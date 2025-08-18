import { ReportService } from '../reporting/ReportService';
import { CoreFacade } from './CoreFacade';
import { 
  TrialBalance, 
  IncomeStatement, 
  BalanceSheet,
  BalanceSheetDebugInfo
} from '../../01-types';

/**
 * レポート機能を管理するファサード
 * 試算表、損益計算書、貸借対照表の生成を担当
 */
export class ReportingFacade {
  private reportService: ReportService;

  constructor(private core: CoreFacade) {
    this.reportService = new ReportService(
      core.journals,
      core.accounts,
      core.divisions
    );
  }

  // 試算表の生成
  getTrialBalance(
    startDate: string,
    endDate: string,
    divisionCode?: string | null
  ): TrialBalance {
    return this.reportService.getTrialBalance(startDate, endDate, divisionCode);
  }

  // 損益計算書の生成
  getIncomeStatement(
    startDate: string,
    endDate: string,
    divisionCode?: string | null
  ): IncomeStatement {
    return this.reportService.getIncomeStatement(startDate, endDate, divisionCode);
  }

  // 貸借対照表の生成
  getBalanceSheet(
    date: string,
    divisionCode?: string | null
  ): BalanceSheet {
    return this.reportService.getBalanceSheet(date, divisionCode);
  }

  // 貸借対照表デバッグ情報の取得
  getBalanceSheetDebugInfo(
    date: string,
    divisionCode?: string | null
  ): BalanceSheetDebugInfo {
    return this.reportService.getBalanceSheetDebugInfo(date, divisionCode);
  }

  // 収入明細の取得
  getIncomeDetails(
    startDate: string,
    endDate: string,
    divisionCode?: string | null
  ) {
    return this.reportService.getIncomeDetails(startDate, endDate, divisionCode);
  }

  // 収入明細サマリーの取得
  getIncomeDetailSummary(
    startDate: string,
    endDate: string,
    divisionCode?: string | null
  ) {
    return this.reportService.getIncomeDetailSummary(startDate, endDate, divisionCode);
  }

  // 支出明細の取得
  getExpenseDetails(
    startDate: string,
    endDate: string,
    divisionCode?: string | null
  ) {
    return this.reportService.getExpenseDetails(startDate, endDate, divisionCode);
  }

  // 支出明細サマリーの取得
  getExpenseDetailSummary(
    startDate: string,
    endDate: string,
    divisionCode?: string | null
  ) {
    return this.reportService.getExpenseDetailSummary(startDate, endDate, divisionCode);
  }

  // 会計区分別の損益計算書
  getIncomeStatementByDivision(
    startDate: string,
    endDate: string,
    divisionCode: string
  ) {
    return this.reportService.getIncomeStatementByDivision(
      startDate,
      endDate,
      divisionCode
    );
  }

  // 会計区分別の貸借対照表
  getBalanceSheetByDivision(date: string, divisionCode: string) {
    return this.reportService.getBalanceSheetByDivision(date, divisionCode);
  }
}
