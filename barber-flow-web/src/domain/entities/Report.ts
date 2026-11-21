export interface PaymentMethodBreakdownItem {
  paymentMethod: string; // 'cash' | 'card' | 'sinpeMovil' | 'transfer'
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

export type ReportPeriodType = 'weekly' | 'monthly';

export interface PeriodReportDay {
  date: string; // yyyy-MM-dd
  totalCustomersServed: number;
  grossRevenue: number;
  commissionAmount: number;
  fixedExpense: number;
  netProfit: number;
}

/** Reporte semanal (domingo a sábado) o mensual: mismas cifras que el diario para todo el periodo + una entrada por día. */
export interface PeriodReport {
  periodType: ReportPeriodType;
  from: string; // yyyy-MM-dd
  to: string; // yyyy-MM-dd
  countedDays: number; // días a los que se les resta el gasto fijo (hasta hoy si el periodo sigue en curso)
  totalCustomersServed: number;
  grossRevenue: number;
  commissionAmount: number;
  fixedDailyExpense: number; // gasto fijo de UN día
  fixedExpenseTotal: number; // fixedDailyExpense × countedDays
  netProfit: number;
  paymentMethodBreakdown: PaymentMethodBreakdownItem[];
  days: PeriodReportDay[];
  generatedAt: string;
}
