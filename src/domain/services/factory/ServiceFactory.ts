/**
 * @file ServiceFactory.ts
 * @description サービスファクトリー・依存性注入コンテナ
 * 
 * 責務:
 * - すべてのドメインサービスのインスタンス生成
 * - サービス間の依存関係の解決
 * - シングルトンパターンの実装
 * - ServiceContainerの提供
 * 
 * 設計パターン:
 * - Factory Method パターン
 * - Dependency Injection パターン
 * - Singleton パターン
 * 
 * アーキテクチャ上の位置: Domain層のDIコンテナ
 */

import { AccountService } from '../core/AccountService'
import { JournalService } from '../core/JournalService'
import { DivisionService } from '../core/DivisionService'
import { ReportService } from '../reporting/ReportService'
import { ImportExportService } from '../io/ImportExportService'
import { AuxiliaryService } from '../ledger/AuxiliaryService'
import { SampleDataService } from '../io/SampleDataService'
import { ClosingService } from '../reporting/ClosingService'
import { TransactionService } from '../transaction/TransactionService'
import { JournalGenerationEngine } from '../transaction/JournalGenerationEngine'
import { BankAccountService } from '../ledger/BankAccountService'

import { IAccountService } from '../../interfaces/IAccountService'
import { IJournalService } from '../../interfaces/IJournalService'
import { IDivisionService } from '../../interfaces/IDivisionService'

export interface ServiceContainer {
  accountService: IAccountService
  journalService: IJournalService
  divisionService: IDivisionService
  reportService: ReportService
  importExportService: ImportExportService
  auxiliaryService: AuxiliaryService
  sampleDataService: SampleDataService
  closingService: ClosingService
  transactionService: TransactionService
  journalGenerationEngine: JournalGenerationEngine
  bankAccountService?: BankAccountService
}

export class ServiceFactory {
  private static instance: ServiceFactory | null = null
  private container: ServiceContainer | null = null

  private constructor() {}

  static getInstance(): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory()
    }
    return ServiceFactory.instance
  }

  createServices(): ServiceContainer {
    // コアサービスの作成
    const accountService = new AccountService()
    const divisionService = new DivisionService()
    const auxiliaryService = new AuxiliaryService()
    const journalService = new JournalService(accountService, divisionService)
    
    // ビジネスサービスの作成
    const reportService = new ReportService(accountService, journalService, divisionService)
    const importExportService = new ImportExportService(
      accountService,
      journalService,
      divisionService,
      auxiliaryService
    )
    const sampleDataService = new SampleDataService(
      journalService,
      accountService,
      auxiliaryService
    )
    const closingService = new ClosingService(
      accountService,
      journalService,
      divisionService
    )
    
    // トランザクション関連サービスの作成
    const journalGenerationEngine = new JournalGenerationEngine(accountService)
    const transactionService = new TransactionService(accountService, journalService)
    
    return {
      accountService,
      journalService,
      divisionService,
      reportService,
      importExportService,
      auxiliaryService,
      sampleDataService,
      closingService,
      transactionService,
      journalGenerationEngine
    }
  }

  getContainer(): ServiceContainer {
    if (!this.container) {
      this.container = this.createServices()
    }
    return this.container
  }

  resetContainer(): void {
    this.container = null
  }

  // 個別サービスのファクトリーメソッド
  static createAccountService(): IAccountService {
    return new AccountService()
  }

  static createJournalService(
    accountService: IAccountService,
    divisionService: IDivisionService
  ): IJournalService {
    return new JournalService(accountService, divisionService)
  }

  static createDivisionService(): IDivisionService {
    return new DivisionService()
  }

  static createReportService(
    accountService: IAccountService,
    journalService: IJournalService,
    divisionService: IDivisionService
  ): ReportService {
    return new ReportService(accountService, journalService, divisionService)
  }

  static createTransactionService(
    accountService: IAccountService,
    journalService: IJournalService,
    bankAccountService?: BankAccountService
  ): TransactionService {
    return new TransactionService(accountService, journalService, bankAccountService)
  }

  static createJournalGenerationEngine(
    accountService: IAccountService
  ): JournalGenerationEngine {
    return new JournalGenerationEngine(accountService)
  }

  static createImportExportService(
    accountService: IAccountService,
    journalService: IJournalService,
    divisionService: IDivisionService,
    auxiliaryService: AuxiliaryService
  ): ImportExportService {
    return new ImportExportService(accountService, journalService, divisionService, auxiliaryService)
  }

  static createClosingService(
    accountService: IAccountService,
    journalService: IJournalService,
    divisionService: IDivisionService
  ): ClosingService {
    return new ClosingService(accountService, journalService, divisionService)
  }

  static createSampleDataService(
    journalService: IJournalService,
    accountService: IAccountService,
    auxiliaryService: AuxiliaryService
  ): SampleDataService {
    return new SampleDataService(journalService, accountService, auxiliaryService)
  }
}