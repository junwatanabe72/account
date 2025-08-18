import { 
  NormalBalance, 
  AccountType, 
  JournalStatus,
  DivisionCode,
  AccountDefinition,
  JournalData,
  CreateJournalOptions,
  CreateJournalResult,
  ImportJson,
  ExportJson,
  TrialBalance,
  IncomeStatement,
  BalanceSheet,
  UnitOwner,
  Vendor,
  BalanceSheetDebugInfo
} from '../types'

// 型のみインポート（具象クラスはinstanceofチェック用）
import { AccountService, HierarchicalAccount, AuxiliaryLedger } from './services/AccountService'
import { JournalService, Journal, JournalDetail } from './services/JournalService'
import { DivisionService, AccountingDivision } from './services/DivisionService'
import type { ReportService } from './services/ReportService'
import type { ImportExportService } from './services/ImportExportService'
import type { AuxiliaryService } from './services/AuxiliaryService'
import type { SampleDataService } from './services/SampleDataService'
import type { ClosingService } from './services/ClosingService'
import type { TransactionService } from './services/TransactionService'
import type { JournalGenerationEngine } from './services/JournalGenerationEngine'
import { ServiceFactory, ServiceContainer } from './services/ServiceFactory'
import { IAccountService } from './interfaces/IAccountService'
import { IJournalService } from './interfaces/IJournalService'
import { IDivisionService } from './interfaces/IDivisionService'

// Re-export for backward compatibility
export { HierarchicalAccount, AuxiliaryLedger, Journal, JournalDetail, AccountingDivision }

export class AccountingEngine {
  private services: ServiceContainer
  private accountService: IAccountService
  private journalService: IJournalService
  private divisionService: IDivisionService
  private reportService: ReportService
  private importExportService: ImportExportService
  private auxiliaryService: AuxiliaryService
  private _sampleDataService: SampleDataService
  private closingService: ClosingService
  private transactionService: TransactionService
  private journalGenerationEngine: JournalGenerationEngine
  
  constructor(serviceFactory?: ServiceFactory) {
    // ServiceFactoryを使用してサービスを作成
    const factory = serviceFactory || ServiceFactory.getInstance()
    this.services = factory.createServices()
    
    // 各サービスへの参照を保持（後方互換性のため）
    this.accountService = this.services.accountService
    this.journalService = this.services.journalService
    this.divisionService = this.services.divisionService
    this.reportService = this.services.reportService
    this.importExportService = this.services.importExportService
    this.auxiliaryService = this.services.auxiliaryService
    this._sampleDataService = this.services.sampleDataService
    this.closingService = this.services.closingService
    this.transactionService = this.services.transactionService
    this.journalGenerationEngine = this.services.journalGenerationEngine
    
    this.initializeEngine()
  }
  
  private initializeEngine() {
    this.accountService.initializeAccounts()
    this.divisionService.initializeDivisions()
    this.auxiliaryService.initializeUnitOwners()
    this.auxiliaryService.initializeVendors()
    this.auxiliaryService.createUnitOwnerAuxiliaryAccounts(this.accountService)
    this._sampleDataService.loadOneMonthSampleData()
  }
  
  // Account management
  get accounts() { return this.accountService.accounts }
  get divisions() { return this.divisionService.divisions }
  initializeAccounts() { return this.accountService.initializeAccounts() }
  rebuildAccountsFrom(defs: any[]) { 
    // AccountServiceの具象型にキャストが必要な場合
    if (this.accountService instanceof AccountService) {
      return this.accountService.rebuildAccountsFrom(defs)
    }
    throw new Error('rebuildAccountsFrom requires AccountService implementation')
  }
  addOrUpdateAccount(def: any) { 
    if (this.accountService instanceof AccountService) {
      return this.accountService.addOrUpdateAccount(def)
    }
    throw new Error('addOrUpdateAccount requires AccountService implementation')
  }
  setAccountActive(code: string, active: boolean) { 
    if (this.accountService instanceof AccountService) {
      return this.accountService.setAccountActive(code, active)
    }
    throw new Error('setAccountActive requires AccountService implementation')
  }
  getAccounts() { return this.accountService.getAccounts() }
  
  // Journal management
  get journals() { return this.journalService.getJournals() }
  createJournal(journalData: any, options?: any) { return this.journalService.createJournal(journalData, options) }
  submitJournal(id: string) { return this.journalService.submitJournal(id) }
  approveJournal(id: string) { return this.journalService.approveJournal(id) }
  postJournalById(id: string) { return this.journalService.postJournalById(id) }
  deleteJournal(id: string) { return this.journalService.deleteJournal(id) }
  updateJournal(id: string, data: any) { return this.journalService.updateJournal(id, data) }
  
  // Division management
  initializeDivisions() { return this.divisionService.initializeDivisions() }
  
  // Auxiliary management
  get unitOwners() { return this.auxiliaryService.getUnitOwners() }
  set unitOwners(owners: UnitOwner[]) { this.auxiliaryService.setUnitOwners(owners) }
  get vendors() { return this.auxiliaryService.getVendors() }
  set vendors(vendors: Vendor[]) { this.auxiliaryService.setVendors(vendors) }
  initializeUnitOwners() { return this.auxiliaryService.initializeUnitOwners() }
  initializeVendors() { return this.auxiliaryService.initializeVendors() }
  createUnitOwnerAuxiliaryAccounts() { return this.auxiliaryService.createUnitOwnerAuxiliaryAccounts(this.accountService) }
  getAuxiliaryLedgerSummary() { 
    if (this.accountService instanceof AccountService) {
      return this.auxiliaryService.getAuxiliaryLedgerSummary(this.accountService)
    }
    throw new Error('getAuxiliaryLedgerSummary requires AccountService implementation')
  }
  getUnitReceivablesSummary() { 
    if (this.accountService instanceof AccountService) {
      return this.auxiliaryService.getUnitReceivablesSummary(this.accountService)
    }
    throw new Error('getUnitReceivablesSummary requires AccountService implementation')
  }
  createMonthlyBilling(billingDate: string) { 
    if (this.journalService instanceof JournalService && this.accountService instanceof AccountService) {
      return this.auxiliaryService.createMonthlyBilling(billingDate, this.journalService, this.accountService)
    }
    throw new Error('createMonthlyBilling requires concrete service implementations')
  }
  
  // Report generation
  getTrialBalance() { return this.reportService.getTrialBalance() }
  getIncomeStatement() { return this.reportService.getIncomeStatement() }
  getBalanceSheet() { return this.reportService.getBalanceSheet() }
  getBalanceSheetDebugInfo() { return this.reportService.getBalanceSheetDebugInfo() }
  getDivisionTrialBalance() { return this.reportService.getDivisionTrialBalance() }
  getIncomeDetails(startDate: string, endDate: string, divisionCode?: string) { 
    return this.reportService.getIncomeDetails(startDate, endDate, divisionCode) 
  }
  getIncomeDetailSummary(startDate: string, endDate: string, divisionCode?: string) { 
    return this.reportService.getIncomeDetailSummary(startDate, endDate, divisionCode) 
  }
  getExpenseDetails(startDate: string, endDate: string, divisionCode?: string) { 
    return this.reportService.getExpenseDetails(startDate, endDate, divisionCode) 
  }
  getExpenseDetailSummary(startDate: string, endDate: string, divisionCode?: string) { 
    return this.reportService.getExpenseDetailSummary(startDate, endDate, divisionCode) 
  }
  
  // Import/Export
  serialize() { return this.importExportService.serialize() }
  restore(data: any) { return this.importExportService.restore(data) }
  importJsonData(json: ImportJson) { return this.importExportService.importJsonData(json) }
  createOpeningBalance(date: string, entries: any[]) { return this.importExportService.createOpeningBalance(date, entries) }
  exportCurrentBalancesAsOpeningDetails() { return this.importExportService.exportCurrentBalancesAsOpeningDetails() }
  
  // Sample data
  get sampleDataService() { return this._sampleDataService }
  loadTwoYearSampleData() { return this._sampleDataService.loadTwoYearSampleData() }
  loadOneMonthSampleData() { return this._sampleDataService.loadOneMonthSampleData() }
  loadSampleData() { return this._sampleDataService.loadSampleData() }
  clearAll() { return this._sampleDataService.clearAll() }
  rebuildAuxiliaryAccounts() { 
    if (this.accountService instanceof AccountService) {
      return this.accountService.rebuildAuxiliaryAccounts()
    }
    throw new Error('rebuildAuxiliaryAccounts requires AccountService implementation')
  }
  
  // Closing entries
  createClosingEntries(closingDate: string) { return this.closingService.createClosingEntries(closingDate) }
  
  // Legacy methods for backward compatibility
  postJournal(journal: Journal) { 
    if (this.journalService instanceof JournalService) {
      return this.journalService.postJournal(journal)
    }
    throw new Error('postJournal requires JournalService implementation')
  }
  validateDivisionAccounting(journal: Journal) { 
    if (this.journalService instanceof JournalService) {
      return this.journalService.validateDivisionAccounting(journal)
    }
    throw new Error('validateDivisionAccounting requires JournalService implementation')
  }
  
  // Chart of accounts
  getChartOfAccounts() {
    return this.getAccounts().map(acc => ({
      code: acc.code,
      name: acc.name,
      type: acc.type,
      normalBalance: acc.normalBalance,
      division: acc.division,
      parentCode: acc.parentCode,
      description: acc.description,
      isActive: acc.isActive,
      level: (acc as any).level,
      isPostable: (acc as any).isPostable
    }))
  }
  
  // Transaction management (Freee型)
  getTransactionService() { return this.transactionService }
  getJournalGenerationEngine() { return this.journalGenerationEngine }
  getAccountService() { return this.accountService }
  createTransaction(input: any) { return this.transactionService.createTransaction(input) }
  getTransactions() { return this.transactionService.getTransactions() }
  searchTransactions(criteria: any) { return this.transactionService.searchTransactions(criteria) }
  settleTransaction(id: string, paymentAccountCode: string) { 
    return this.transactionService.settleTransaction(id, paymentAccountCode) 
  }
  getCounterparties() { return this.transactionService.getCounterparties() }
  getTransactionTemplates() { return this.transactionService.getTemplates() }
}

// Re-export AccountDef for backward compatibility
export type AccountDef = {
  code: string
  name: string
  type: AccountType
  normalBalance: NormalBalance
  division?: string
  parentCode?: string
  description?: string
  isActive?: boolean
  level?: number
}