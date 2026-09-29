export type ThemeMode = "system" | "light" | "dark";

export const SUPPORTED_LANGUAGES = ["es", "en"] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export type LanguageSource = "system" | "manual";

export interface ReportCalculationSettings {
	commissionPercentage: number;
	fixedDailyExpense: number;
}

/** Settings block of a Barber as exchanged with the API. */
export interface BarberSettingsPayload extends ReportCalculationSettings {
	/** 0..20. 0 / undefined = recurring appointments disabled. Only the admin can set it. */
	maxRecurringAppointments?: number;
}

export const DEFAULT_REPORT_CALCULATION_SETTINGS: ReportCalculationSettings = {
	commissionPercentage: 40,
	fixedDailyExpense: 0,
};

export interface SettingsPreferences {
	language: Language;
	languageSource: LanguageSource;
	notificationsEnabled: boolean;
	reportCalculations?: ReportCalculationSettings;
	themeMode: ThemeMode;
}

export interface ApplicationUserSettingsForm {
	barberId?: string;
	userName: string;
	userPhone: string;
	userEmail: string;
	barberName: string;
	barberPhone: string;
	shopName?: string;
	shopPhone?: string;
	address?: string;
	password?: string;
	profilePhotoUrl?: string;
	/** Text-input value ("0".."20"). 0 = recurring appointments disabled for this barber. */
	maxRecurringAppointments?: string;
	/** Read-only copy of the barber's stored settings, so an admin edit never overwrites them. */
	existingCommissionPercentage?: number;
	existingFixedDailyExpense?: number;
}

export interface BarberApiRequest {
	UserName: string;
	UserPhone: string;
	UserEmail: string;
	BarberName: string;
	BarberPhone: string;
	BarberShopName?: string;
	BarberShopPhone?: string;
	Address?: string;
	Password?: string;
	PhotoUrl?: string;
	Settings?: BarberSettingsPayload;
}

export interface BarberApiResponse {
	id: string;
	userName: string;
	userPhone: string;
	userEmail: string;
	barberName: string;
	barberPhone: string;
	shopName?: string;
	shopPhone?: string;
	address?: string;
	photoUrl?: string;
	settings?: BarberSettingsPayload;
	createdAt?: string;
	updatedAt?: string;
	userId?: string;
	isBlocked?: boolean;
}

export interface AppStatusResponse {
	isBlocked: boolean;
}