export interface BarberSettingsRequest {
  commissionPercentage: number;
  fixedDailyExpense: number;
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
