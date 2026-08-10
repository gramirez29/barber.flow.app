export interface PaymentMethodBreakdownItem {
  paymentMethod: string; // 'cash' | 'sinpeMovil' | 'transfer'
  label: string;
  total: number;
  appointmentCount: number;
}

export interface CompletedAppointmentReportItem {
  id: string;
  clientName: string;
  serviceName?: string;
  time: string;
  servicePrice: number;
  paymentMethodUsed: string;
}

export interface DailyReport {
  reportDate: string; // ISO date (YYYY-MM-DD)
  totalCustomersServed: number;
  grossRevenue: number;
  netProfit: number;
  commissionAmount: number;
  fixedDailyExpense: number;
  paymentMethodBreakdown: PaymentMethodBreakdownItem[];
  completedAppointments: CompletedAppointmentReportItem[];
  generatedAt: string;
}
