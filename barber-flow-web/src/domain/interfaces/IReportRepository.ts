import { DailyReport, DailyReportStats } from '../entities';

export interface IReportRepository {
  getDailyReport(date: string): Promise<DailyReport>;
  getStats(date: string): Promise<DailyReportStats>;
}
