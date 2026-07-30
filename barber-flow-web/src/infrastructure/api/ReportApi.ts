import { IReportRepository } from '@domain/interfaces';
import { DailyReport, DailyReportStats } from '@domain/entities';
import { HttpClient } from '../http';

export class ReportApi implements IReportRepository {
  constructor(private httpClient: HttpClient) {}

  async getDailyReport(date: string): Promise<DailyReport> {
    return this.httpClient.get<DailyReport>('/api/reports/daily', {
      params: { date },
    });
  }

  async getStats(date: string): Promise<DailyReportStats> {
    const response = await this.getDailyReport(date);
    return response.stats;
  }
}
