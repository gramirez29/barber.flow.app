import { DailyReport } from '../entities';

export interface IReportRepository {
  getDailyReport(date: string): Promise<DailyReport>;
}
