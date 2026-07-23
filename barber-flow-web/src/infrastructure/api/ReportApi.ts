import { IReportRepository } from '@domain/interfaces';
import { DailyReport, DailyReportStats } from '@domain/entities';
import { HttpClient } from '../http';

export class ReportApi implements IReportRepository {
  constructor(private httpClient: HttpClient) {}

  async getDailyReport(date: string): Promise<DailyReport> {
    const response = await this.httpClient.get<any>('/api/reports/daily', {
      params: { date },
    });
    return response;
  }

  async getStats(date: string): Promise<DailyReportStats> {
    const response = await this.httpClient.get<any>('/api/reports/daily', {
      params: { date },
    });
    return response.stats || response;
  }
}
