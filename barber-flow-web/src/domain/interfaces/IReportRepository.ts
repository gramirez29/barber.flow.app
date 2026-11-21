import { DailyReport, PeriodReport } from '../entities';

export interface IReportRepository {
  getDailyReport(date: string): Promise<DailyReport>;
  /** Semana (domingo a sábado) que contiene `date` (yyyy-MM-dd). */
  getWeeklyReport(date: string): Promise<PeriodReport>;
  /** Mes calendario `month` (yyyy-MM). */
  getMonthlyReport(month: string): Promise<PeriodReport>;
}
