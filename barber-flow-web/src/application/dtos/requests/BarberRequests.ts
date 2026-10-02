export interface BarberSettingsRequest {
  commissionPercentage: number;
  fixedDailyExpense: number;
  maxRecurringAppointments?: number;
  /** Duración ajustable de citas (spots de 15 min, redimensionar). Solo la modifica el admin; ausente = apagado. */
  enableAppointmentDurations?: boolean;
}

export interface CreateBarberRequest {
  userName: string;
  userPhone: string;
  userEmail: string;
  barberName: string;
  barberPhone: string;
  address?: string;
  barberShopName?: string;
  barberShopPhone?: string;
  photoUrl?: string;
  password?: string;
  settings?: BarberSettingsRequest;
}

export type UpdateBarberRequest = CreateBarberRequest;
