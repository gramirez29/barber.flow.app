import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiFetch } from "./apis/apiClient";
import type {
	ApplicationUserSettingsForm,
	BarberApiRequest,
	BarberApiResponse,
	Language,
	LanguageSource,
	ReportCalculationSettings,
	SettingsPreferences,
	ThemeMode,
} from "../types/settings";
import { DEFAULT_REPORT_CALCULATION_SETTINGS } from "../types/settings";

const SETTINGS_PREFERENCES_KEY = "barber-flow-settings-preferences";

const mapBarberRequest = (
	values: ApplicationUserSettingsForm,
	reportCalculations?: ReportCalculationSettings,
): BarberApiRequest => ({
	UserName: values.userName.trim(),
	UserPhone: values.userPhone || values.barberPhone,
	UserEmail: values.userEmail.trim(),
	BarberName: values.barberName.trim(),
	BarberPhone: values.barberPhone,
	BarberShopName: values.shopName?.trim() || undefined,
	BarberShopPhone: values.shopPhone || undefined,
	Address: values.address?.trim() || undefined,
	Password: values.password?.trim() || undefined,
	PhotoUrl: values.profilePhotoUrl || undefined,
	Settings: reportCalculations ? {
		commissionPercentage: reportCalculations.commissionPercentage,
		fixedDailyExpense: reportCalculations.fixedDailyExpense,
	} : undefined,
});

const mapBarberResponse = (response: Record<string, unknown>): BarberApiResponse => {
	// Extract settings from response if available
	const settingsData = response.settings ?? response.Settings;
	let settings: ReportCalculationSettings | undefined;
	
	if (settingsData && typeof settingsData === 'object') {
		const settingsObj = settingsData as Record<string, unknown>;
		settings = {
			commissionPercentage: (settingsObj.commissionPercentage ?? settingsObj.CommissionPercentage) as number ?? DEFAULT_REPORT_CALCULATION_SETTINGS.commissionPercentage,
			fixedDailyExpense: (settingsObj.fixedDailyExpense ?? settingsObj.FixedDailyExpense) as number ?? DEFAULT_REPORT_CALCULATION_SETTINGS.fixedDailyExpense,
		};
	}

	return {
		id: ((response.id ?? response.Id) as string | undefined) ?? "",
		userName: ((response.userName ?? response.UserName) as string | undefined) ?? "",
		userPhone: ((response.userPhone ?? response.UserPhone) as string | undefined) ?? "",
		userEmail: ((response.userEmail ?? response.UserEmail) as string | undefined) ?? "",
		barberName: ((response.barberName ?? response.BarberName) as string | undefined) ?? "",
		barberPhone: ((response.barberPhone ?? response.BarberPhone) as string | undefined) ?? "",
		shopName: (response.shopName ?? response.ShopName ?? response.barberShopName ?? response.BarberShopName) as string | undefined,
		shopPhone: (response.shopPhone ?? response.ShopPhone ?? response.barberShopPhone ?? response.BarberShopPhone) as string | undefined,
		address: (response.address ?? response.Address) as string | undefined,
		photoUrl: (response.photoUrl ?? response.PhotoUrl) as string | undefined,
		settings,
		createdAt: (response.createdAt ?? response.CreatedAt) as string | undefined,
		updatedAt: (response.updatedAt ?? response.UpdatedAt) as string | undefined,
	};
};

const normalizePreferences = (
	preferences: SettingsPreferences | null,
): SettingsPreferences => ({
	language: preferences?.language ?? "es",
	languageSource: preferences?.languageSource ?? "system",
	notificationsEnabled: preferences?.notificationsEnabled ?? true,
	reportCalculations: {
		...DEFAULT_REPORT_CALCULATION_SETTINGS,
		...preferences?.reportCalculations,
	},
	themeMode: preferences?.themeMode ?? "system",
});

export const settingsService = {
	createApplicationUser: async (values: ApplicationUserSettingsForm) => {
		// Get current settings from AsyncStorage to include in the barber creation
		const reportCalculations = await settingsService.getReportCalculationSettings();
		
		const response = await apiFetch("/api/barbers/create", {
			json: mapBarberRequest(values, reportCalculations),
			method: "POST",
		});

		return mapBarberResponse(response);
	},

	deleteApplicationUser: async (barberId: string) => {
		await apiFetch(`/api/barbers/delete/${barberId}`, { method: "DELETE" });
	},

	findApplicationUsers: async (query: string): Promise<BarberApiResponse[]> => {
		const encodedQuery = encodeURIComponent(query);
		const response = await apiFetch(
			`/api/barbers/search?query=${encodedQuery}`,
			{
				method: "GET",
			},
		);

		return Array.isArray(response) ? response.map(mapBarberResponse) : [];
	},

	getApplicationUserById: async (barberId: string): Promise<BarberApiResponse | null> => {
		try {
			const response = await apiFetch(`/api/barbers/getById/${barberId}`, {
				method: "GET",
			});
			const barberData = mapBarberResponse(response);
			
			// Auto-sync settings from backend to AsyncStorage if available
			if (barberData.settings) {
				await settingsService.syncSettingsFromBackend(barberData);
			}
			
			return barberData;
		} catch (error: unknown) {
			const msg = error instanceof Error ? error.message : "";
			if (msg.includes("(404)")) return null;
			throw error;
		}
	},

	getNextBarberId: async () => {
		const response = await apiFetch("/api/barbers/nextId", { method: "GET" });
		return response?.nextId ?? "CRB-0000";
	},

	async getStoredPreferences(): Promise<SettingsPreferences | null> {
		const value = await AsyncStorage.getItem(SETTINGS_PREFERENCES_KEY);

		if (!value) {
			return normalizePreferences(null);
		}

		return normalizePreferences(JSON.parse(value) as SettingsPreferences);
	},

	async getReportCalculationSettings(): Promise<ReportCalculationSettings> {
		const preferences = await settingsService.getStoredPreferences();
		return (
			normalizePreferences(preferences).reportCalculations ??
			DEFAULT_REPORT_CALCULATION_SETTINGS
		);
	},

	async setLanguagePreference(
		language: Language,
		languageSource: LanguageSource,
	) {
		const current = normalizePreferences(
			await settingsService.getStoredPreferences(),
		);
		const next: SettingsPreferences = {
			...current,
			language,
			languageSource,
		};

		await AsyncStorage.setItem(SETTINGS_PREFERENCES_KEY, JSON.stringify(next));
		return next;
	},

	async setNotificationsEnabled(notificationsEnabled: boolean) {
		const current = normalizePreferences(
			await settingsService.getStoredPreferences(),
		);
		const next: SettingsPreferences = {
			...current,
			notificationsEnabled,
		};

		await AsyncStorage.setItem(SETTINGS_PREFERENCES_KEY, JSON.stringify(next));
		return next;
	},

	async setThemeMode(themeMode: ThemeMode) {
		const current = normalizePreferences(
			await settingsService.getStoredPreferences(),
		);
		const next: SettingsPreferences = {
			...current,
			themeMode,
		};

		await AsyncStorage.setItem(SETTINGS_PREFERENCES_KEY, JSON.stringify(next));
		return next;
	},

	async setReportCalculationSettings(
		reportCalculations: ReportCalculationSettings,
		barberId?: string,
	) {
		// Always save to AsyncStorage first
		const current = normalizePreferences(
			await settingsService.getStoredPreferences(),
		);
		const next: SettingsPreferences = {
			...current,
			reportCalculations,
		};

		await AsyncStorage.setItem(SETTINGS_PREFERENCES_KEY, JSON.stringify(next));
		
		// If barberId is provided, sync to backend
		if (barberId) {
			try {
				await settingsService.syncSettingsToBackend(barberId, reportCalculations);
			} catch (error) {
				console.warn('Failed to sync settings to backend:', error);
				// Don't throw - AsyncStorage update succeeded
			}
		}
		
		return next;
	},

	updateApplicationUser: async (
		barberId: string,
		values: ApplicationUserSettingsForm,
	) => {
		// Get current settings from AsyncStorage to include in the update
		const reportCalculations = await settingsService.getReportCalculationSettings();
		
		const response = await apiFetch(`/api/barbers/update/${barberId}`, {
			json: mapBarberRequest(values, reportCalculations),
			method: "PUT",
		});

		return mapBarberResponse(response);
	},

	/**
	 * Get barber ID by searching for userName
	 * Useful for finding the logged-in user's barber profile
	 */
	getBarberIdByUserName: async (userName: string): Promise<string | null> => {
		try {
			const results = await settingsService.findApplicationUsers(userName);
			const exactMatch = results.find(
				(b) => b.userName.toLowerCase() === userName.toLowerCase()
			);
			return exactMatch?.id ?? null;
		} catch {
			return null;
		}
	},

	/**
	 * Sync settings from backend to AsyncStorage
	 * Called when fetching barber data to ensure local settings match backend
	 */
	syncSettingsFromBackend: async (barberData: BarberApiResponse) => {
		if (barberData.settings) {
			await settingsService.setReportCalculationSettings(barberData.settings);
		}
	},

	/**
	 * Sync settings from AsyncStorage to backend
	 * Called when updating settings to ensure backend matches local storage
	 */
	syncSettingsToBackend: async (
		barberId: string,
		settings: ReportCalculationSettings,
	) => {
		// Get current barber data
		const barber = await settingsService.getApplicationUserById(barberId);
		if (!barber) {
			throw new Error('Barber not found');
		}

		// Update with new settings
		const updatedBarber: ApplicationUserSettingsForm = {
			barberId: barber.id,
			userName: barber.userName,
			userPhone: barber.userPhone,
			userEmail: barber.userEmail,
			barberName: barber.barberName,
			barberPhone: barber.barberPhone,
			shopName: barber.shopName,
			shopPhone: barber.shopPhone,
			address: barber.address,
			profilePhotoUrl: barber.photoUrl,
		};

		const response = await apiFetch(`/api/barbers/update/${barberId}`, {
			json: mapBarberRequest(updatedBarber, settings),
			method: "PUT",
		});

		return mapBarberResponse(response);
	},
};
