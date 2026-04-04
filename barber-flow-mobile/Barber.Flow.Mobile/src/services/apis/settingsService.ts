import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiFetch } from "./apiClient";
import type {
  ApplicationUserSettingsForm,
  BarberApiRequest,
  BarberApiResponse,
  Language,
  LanguageSource,
  ReportCalculationSettings,
  SettingsPreferences,
  ThemeMode,
} from "../../types/settings";
import { DEFAULT_REPORT_CALCULATION_SETTINGS } from "../../types/settings";

const SETTINGS_PREFERENCES_KEY = "barber-flow-settings-preferences";

const mapBarberRequest = (
  values: ApplicationUserSettingsForm,
): BarberApiRequest => ({
  UserName: values.userName.trim(),
  UserPhone: values.userPhone,
  UserEmail: values.userEmail.trim(),
  BarberName: values.barberName.trim(),
  BarberPhone: values.barberPhone,
  Address: values.address?.trim() || undefined,
});

const mapBarberResponse = (response: any): BarberApiResponse => ({
  id: response?.id ?? response?.Id,
  userName: response?.userName ?? response?.UserName ?? "",
  userPhone: response?.userPhone ?? response?.UserPhone ?? "",
  userEmail: response?.userEmail ?? response?.UserEmail ?? "",
  barberName: response?.barberName ?? response?.BarberName ?? "",
  barberPhone: response?.barberPhone ?? response?.BarberPhone ?? "",
  address: response?.address ?? response?.Address ?? undefined,
  createdAt: response?.createdAt ?? response?.CreatedAt,
  updatedAt: response?.updatedAt ?? response?.UpdatedAt,
});

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
    const response = await apiFetch("/api/barbers/create", {
      json: mapBarberRequest(values),
      method: "POST",
    });

    return mapBarberResponse(response);
  },

  deleteApplicationUser: async (barberId: string) => {
    await apiFetch(`/api/barbers/delete/${barberId}`, { method: "DELETE" });
  },

  findApplicationUsers: async (query: string): Promise<BarberApiResponse[]> => {
    const encodedQuery = encodeURIComponent(query);
    const response = await apiFetch(`/api/barbers/search?query=${encodedQuery}`, {
      method: "GET",
    });

    return Array.isArray(response) ? response.map(mapBarberResponse) : [];
  },

  getApplicationUserById: async (barberId: string) => {
    const response = await apiFetch(`/api/barbers/getById/${barberId}`, {
      method: "GET",
    });

    return mapBarberResponse(response);
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
    return normalizePreferences(preferences).reportCalculations ?? DEFAULT_REPORT_CALCULATION_SETTINGS;
  },

  async setLanguagePreference(language: Language, languageSource: LanguageSource) {
    const current = normalizePreferences(await settingsService.getStoredPreferences());
    const next: SettingsPreferences = {
      ...current,
      language,
      languageSource,
    };

    await AsyncStorage.setItem(SETTINGS_PREFERENCES_KEY, JSON.stringify(next));
    return next;
  },

  async setNotificationsEnabled(notificationsEnabled: boolean) {
    const current = normalizePreferences(await settingsService.getStoredPreferences());
    const next: SettingsPreferences = {
      ...current,
      notificationsEnabled,
    };

    await AsyncStorage.setItem(SETTINGS_PREFERENCES_KEY, JSON.stringify(next));
    return next;
  },

  async setThemeMode(themeMode: ThemeMode) {
    const current = normalizePreferences(await settingsService.getStoredPreferences());
    const next: SettingsPreferences = {
      ...current,
      themeMode,
    };

    await AsyncStorage.setItem(SETTINGS_PREFERENCES_KEY, JSON.stringify(next));
    return next;
  },

  async setReportCalculationSettings(reportCalculations: ReportCalculationSettings) {
    const current = normalizePreferences(await settingsService.getStoredPreferences());
    const next: SettingsPreferences = {
      ...current,
      reportCalculations,
    };

    await AsyncStorage.setItem(SETTINGS_PREFERENCES_KEY, JSON.stringify(next));
    return next;
  },

  updateApplicationUser: async (
    barberId: string,
    values: ApplicationUserSettingsForm,
  ) => {
    const response = await apiFetch(`/api/barbers/update/${barberId}`, {
      json: mapBarberRequest(values),
      method: "PUT",
    });

    return mapBarberResponse(response);
  },
};