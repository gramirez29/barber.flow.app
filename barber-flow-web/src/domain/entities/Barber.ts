export interface BarberSettings {
  commissionPercentage: number;
  fixedDailyExpense: number;
  /** 0..20. 0 o ausente = citas recurrentes deshabilitadas. Solo la modifica el admin. */
  maxRecurringAppointments?: number;
}

export interface Barber {
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
  settings?: BarberSettings;
  shopId?: string;
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
  isBlocked?: boolean;
}
