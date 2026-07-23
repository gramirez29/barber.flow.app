import { IReportRepository } from '@domain/interfaces';
import { DailyReport, DailyReportStats } from '@domain/entities';

export class GetDailyReportUseCase {
  constructor(private reportRepository: IReportRepository) {}

  async execute(date: string): Promise<DailyReport> {
    return this.reportRepository.getDailyReport(date);
  }
}

export class GetDailyReportStatsUseCase {
  constructor(private reportRepository: IReportRepository) {}

  async execute(date: string): Promise<DailyReportStats> {
    return this.reportRepository.getStats(date);
  }
}
