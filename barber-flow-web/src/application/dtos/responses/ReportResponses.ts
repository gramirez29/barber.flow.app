export interface PaymentMethodBreakdownResponse {
  paymentMethod: string;
  label: string;
  total: number;
  appointmentCount: number;
}

export interface CompletedAppointmentReportItemResponse {
  id: string;
  clientName: string;
  serviceName?: string;
  time: string;
  servicePrice: number;
  paymentMethodUsed: string;
}

export interface DailyReportResponse {
  reportDate: string;
  totalCustomersServed: number;
  grossRevenue: number;
  netProfit: number;
  commissionAmount: number;
  fixedDailyExpense: number;
  paymentMethodBreakdown: PaymentMethodBreakdownResponse[];
  completedAppointments: CompletedAppointmentReportItemResponse[];
  generatedAt: string;
}
