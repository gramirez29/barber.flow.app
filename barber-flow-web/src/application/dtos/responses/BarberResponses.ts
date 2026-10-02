export interface BarberSettingsResponse {
  commissionPercentage: number;
  fixedDailyExpense: number;
  maxRecurringAppointments?: number;
  /** Duración ajustable de citas (spots de 15 min, redimensionar). Solo la modifica el admin; ausente = apagado. */
  enableAppointmentDurations?: boolean;
}

export interface BarberResponse {
  id: string;
  userName: string;
  userPhone: string;
  userEmail: string;
  barberName: string;
  barberPhone: string;
  address?: string;
  barberShopName?: string;
  barberShopPhone?: string;
  photoUrl?: string;
  settings?: BarberSettingsResponse;
  shopId?: string;
  createdAt: string;
  updatedAt: string;
  userId?: string;
  isBlocked?: boolean;
}
