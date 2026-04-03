export type ThemeMode = "system" | "light" | "dark";

export interface ReportCalculationSettings {
  commissionPercentage: number;
  fixedDailyExpense: number;
}

export const DEFAULT_REPORT_CALCULATION_SETTINGS: ReportCalculationSettings = {
  commissionPercentage: 40,
  fixedDailyExpense: 0,
};

export interface SettingsPreferences {
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
  address?: string;
}

export interface BarberApiRequest {
  UserName: string;
  UserPhone: string;
  UserEmail: string;
  BarberName: string;
  BarberPhone: string;
  Address?: string;
}

export interface BarberApiResponse {
  id: string;
  userName: string;
  userPhone: string;
  userEmail: string;
  barberName: string;
  barberPhone: string;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
}