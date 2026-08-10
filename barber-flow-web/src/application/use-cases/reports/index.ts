import { IReportRepository } from '@domain/interfaces';
import { DailyReport } from '@domain/entities';

export class GetDailyReportUseCase {
  constructor(private reportRepository: IReportRepository) {}

  async execute(date: string): Promise<DailyReport> {
    return this.reportRepository.getDailyReport(date);
  }
}
