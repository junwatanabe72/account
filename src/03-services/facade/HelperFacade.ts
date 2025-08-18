import { AuxiliaryService } from '../auxiliary/AuxiliaryService';
import { ClosingService } from '../closing/ClosingService';
import { SampleDataService } from '../../06-data/generators/SampleDataService';
import { JournalGenerationEngine } from '../../02-core/generators/JournalGenerationEngine';
import { CoreFacade } from './CoreFacade';

/**
 * 補助機能を管理するファサード
 * 補助元帳、決算処理、サンプルデータ生成、仕訳自動生成を担当
 */
export class HelperFacade {
  private auxiliaryService: AuxiliaryService;
  private closingService: ClosingService;
  private sampleDataService: SampleDataService;
  private journalGenerationEngine: JournalGenerationEngine;

  constructor(private core: CoreFacade) {
    this.auxiliaryService = new AuxiliaryService();
    this.closingService = new ClosingService(
      core.journals,
      core.accounts
    );
    this.sampleDataService = new SampleDataService(
      core.journals,
      core.accounts,
      this.auxiliaryService
    );
    this.journalGenerationEngine = new JournalGenerationEngine(
      core.accounts
    );
  }

  // 補助元帳サービス
  get auxiliary() {
    return this.auxiliaryService;
  }

  // 決算処理サービス
  get closing() {
    return this.closingService;
  }

  // サンプルデータサービス
  get sampleData() {
    return this.sampleDataService;
  }

  // 仕訳生成エンジン
  get journalGenerator() {
    return this.journalGenerationEngine;
  }

  // サンプルデータの生成
  generateSampleData(options?: {
    includeAccounts?: boolean;
    includeJournals?: boolean;
    journalCount?: number;
  }): void {
    this.sampleDataService.generateSampleData(options);
  }

  // 仕訳パターンからの自動生成
  generateJournalFromPattern(
    pattern: string,
    amount: number,
    date: string,
    description?: string
  ) {
    return this.journalGenerationEngine.generateFromPattern(
      pattern,
      amount,
      date,
      description
    );
  }

  // 決算仕訳の生成
  generateClosingJournals(fiscalYearEnd: string) {
    return this.closingService.generateClosingJournals(fiscalYearEnd);
  }

  // 補助元帳の登録
  registerAuxiliaryLedger(
    accountCode: string,
    auxiliaryCode: string,
    auxiliaryName: string
  ) {
    return this.auxiliaryService.registerAuxiliary(
      accountCode,
      auxiliaryCode,
      auxiliaryName
    );
  }

  // 補助元帳の取得
  getAuxiliaryLedgers(accountCode?: string) {
    if (accountCode) {
      return this.auxiliaryService.getAuxiliariesByAccount(accountCode);
    }
    return this.auxiliaryService.getAllAuxiliaries();
  }

  // データのリセット
  resetAllData(): void {
    this.core.reset();
    this.auxiliaryService.reset();
  }

  // 初期化
  initialize(): void {
    this.core.initialize();
  }
}
