export interface DailyReportStatsResponse {
  date: string;
  totalAppointments: number;
  completedAppointments: number;
  totalIncome: number;
  incomeByCurrency: {
    cash: number;
    sinpeMovil: number;
    transfer: number;
  };
  expenses?: number;
  netIncome: number;
}

export interface DailyReportResponse {
  id: string;
  date: string;
  appointments: Array<{
    id: string;
    clientName: string;
    time: string;
    status: string;
    amount: number;
    paymentMethod: string;
  }>;
  stats: DailyReportStatsResponse;
}
