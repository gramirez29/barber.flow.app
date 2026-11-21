import { IReportRepository } from '@domain/interfaces';
import { DailyReport, PeriodReport } from '@domain/entities';
import { API_ENDPOINTS } from '@shared/constants';
import { HttpClient } from '../http';

export class ReportApi implements IReportRepository {
  constructor(private httpClient: HttpClient) {}

  async getDailyReport(date: string): Promise<DailyReport> {
    return this.httpClient.get<DailyReport>(API_ENDPOINTS.REPORTS.DAILY, {
      params: { date },
    });
  }

  async getWeeklyReport(date: string): Promise<PeriodReport> {
    return this.httpClient.get<PeriodReport>(API_ENDPOINTS.REPORTS.WEEKLY, {
      params: { date },
    });
  }

  async getMonthlyReport(month: string): Promise<PeriodReport> {
    return this.httpClient.get<PeriodReport>(API_ENDPOINTS.REPORTS.MONTHLY, {
      params: { month },
    });
  }
}
