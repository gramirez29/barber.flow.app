import { IReportRepository } from '@domain/interfaces';
import { DailyReport, PeriodReport } from '@domain/entities';

export class GetDailyReportUseCase {
  constructor(private reportRepository: IReportRepository) {}

  async execute(date: string): Promise<DailyReport> {
    return this.reportRepository.getDailyReport(date);
  }
}

export class GetWeeklyReportUseCase {
  constructor(private reportRepository: IReportRepository) {}

  /** `date`: cualquier día (yyyy-MM-dd) de la semana domingo-sábado que se quiere ver. */
  async execute(date: string): Promise<PeriodReport> {
    return this.reportRepository.getWeeklyReport(date);
  }
}

export class GetMonthlyReportUseCase {
  constructor(private reportRepository: IReportRepository) {}

  /** `month`: yyyy-MM. */
  async execute(month: string): Promise<PeriodReport> {
    return this.reportRepository.getMonthlyReport(month);
  }
}
