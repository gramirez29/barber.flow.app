export interface BarberSettings {
  commissionPercentage: number;
  fixedDailyExpense: number;
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
}
