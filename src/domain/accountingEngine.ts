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

// 型のエクスポートとinstanceofチェック用にインポート
import { AccountService, HierarchicalAccount, AuxiliaryLedger } from './services/AccountService'
import { JournalService, Journal, JournalDetail } from './services/JournalService'
import { AccountingDivision } from './services/DivisionService'
import { ServiceFactory, ServiceContainer } from './services/ServiceFactory'

// Re-export for backward compatibility
export { HierarchicalAccount, AuxiliaryLedger, Journal, JournalDetail, AccountingDivision }

export class AccountingEngine {
  private services: ServiceContainer
  
  constructor(serviceFactory?: ServiceFactory) {
    // ServiceFactoryを使用してサービスを作成
    const factory = serviceFactory || ServiceFactory.getInstance()
    this.services = factory.createServices()
    
    this.initializeEngine()
  }
  
  private initializeEngine() {
    this.services.accountService.initializeAccounts()
    this.services.divisionService.initializeDivisions()
    this.services.auxiliaryService.initializeUnitOwners()
    this.services.auxiliaryService.initializeVendors()
    this.services.auxiliaryService.createUnitOwnerAuxiliaryAccounts(this.services.accountService)
    this.services.sampleDataService.loadOneMonthSampleData()
  }
  
  // Account management
  get accounts() { return this.services.accountService.accounts }
  get divisions() { return this.services.divisionService.divisions }
  initializeAccounts() { return this.services.accountService.initializeAccounts() }
  rebuildAccountsFrom(defs: any[]) { 
    // AccountServiceの具象型にキャストが必要な場合
    if (this.services.accountService instanceof AccountService) {
      return this.services.accountService.rebuildAccountsFrom(defs)
    }
    throw new Error('rebuildAccountsFrom requires AccountService implementation')
  }
  addOrUpdateAccount(def: any) { 
    if (this.services.accountService instanceof AccountService) {
      return this.services.accountService.addOrUpdateAccount(def)
    }
    throw new Error('addOrUpdateAccount requires AccountService implementation')
  }
  setAccountActive(code: string, active: boolean) { 
    if (this.services.accountService instanceof AccountService) {
      return this.services.accountService.setAccountActive(code, active)
    }
    throw new Error('setAccountActive requires AccountService implementation')
  }
  getAccounts() { return this.services.accountService.getAccounts() }
  
  // Journal management
  get journals() { return this.services.journalService.getJournals() }
  createJournal(journalData: any, options?: any) { return this.services.journalService.createJournal(journalData, options) }
  submitJournal(id: string) { return this.services.journalService.submitJournal(id) }
  approveJournal(id: string) { return this.services.journalService.approveJournal(id) }
  postJournalById(id: string) { return this.services.journalService.postJournalById(id) }
  deleteJournal(id: string) { return this.services.journalService.deleteJournal(id) }
  updateJournal(id: string, data: any) { return this.services.journalService.updateJournal(id, data) }
  
  // Division management
  initializeDivisions() { return this.services.divisionService.initializeDivisions() }
  
  // Auxiliary management
  get unitOwners() { return this.services.auxiliaryService.getUnitOwners() }
  set unitOwners(owners: UnitOwner[]) { this.services.auxiliaryService.setUnitOwners(owners) }
  get vendors() { return this.services.auxiliaryService.getVendors() }
  set vendors(vendors: Vendor[]) { this.services.auxiliaryService.setVendors(vendors) }
  initializeUnitOwners() { return this.services.auxiliaryService.initializeUnitOwners() }
  initializeVendors() { return this.services.auxiliaryService.initializeVendors() }
  createUnitOwnerAuxiliaryAccounts() { return this.services.auxiliaryService.createUnitOwnerAuxiliaryAccounts(this.services.accountService) }
  getAuxiliaryLedgerSummary() { 
    if (this.services.accountService instanceof AccountService) {
      return this.services.auxiliaryService.getAuxiliaryLedgerSummary(this.services.accountService)
    }
    throw new Error('getAuxiliaryLedgerSummary requires AccountService implementation')
  }
  getUnitReceivablesSummary() { 
    if (this.services.accountService instanceof AccountService) {
      return this.services.auxiliaryService.getUnitReceivablesSummary(this.services.accountService)
    }
    throw new Error('getUnitReceivablesSummary requires AccountService implementation')
  }
  createMonthlyBilling(billingDate: string) { 
    if (this.services.journalService instanceof JournalService && this.services.accountService instanceof AccountService) {
      return this.services.auxiliaryService.createMonthlyBilling(billingDate, this.services.journalService, this.services.accountService)
    }
    throw new Error('createMonthlyBilling requires concrete service implementations')
  }
  
  // Report generation
  getTrialBalance() { return this.services.reportService.getTrialBalance() }
  getIncomeStatement() { return this.services.reportService.getIncomeStatement() }
  getBalanceSheet() { return this.services.reportService.getBalanceSheet() }
  getBalanceSheetDebugInfo() { return this.services.reportService.getBalanceSheetDebugInfo() }
  getDivisionTrialBalance() { return this.services.reportService.getDivisionTrialBalance() }
  getIncomeDetails(startDate: string, endDate: string, divisionCode?: string) { 
    return this.services.reportService.getIncomeDetails(startDate, endDate, divisionCode) 
  }
  getIncomeDetailSummary(startDate: string, endDate: string, divisionCode?: string) { 
    return this.services.reportService.getIncomeDetailSummary(startDate, endDate, divisionCode) 
  }
  getExpenseDetails(startDate: string, endDate: string, divisionCode?: string) { 
    return this.services.reportService.getExpenseDetails(startDate, endDate, divisionCode) 
  }
  getExpenseDetailSummary(startDate: string, endDate: string, divisionCode?: string) { 
    return this.services.reportService.getExpenseDetailSummary(startDate, endDate, divisionCode) 
  }
  
  // Import/Export
  serialize() { return this.services.importExportService.serialize() }
  restore(data: any) { return this.services.importExportService.restore(data) }
  importJsonData(json: ImportJson) { return this.services.importExportService.importJsonData(json) }
  createOpeningBalance(date: string, entries: any[]) { return this.services.importExportService.createOpeningBalance(date, entries) }
  exportCurrentBalancesAsOpeningDetails() { return this.services.importExportService.exportCurrentBalancesAsOpeningDetails() }
  
  // Sample data
  get sampleDataService() { return this.services.sampleDataService }
  loadTwoYearSampleData() { return this.services.sampleDataService.loadTwoYearSampleData() }
  loadOneMonthSampleData() { return this.services.sampleDataService.loadOneMonthSampleData() }
  loadSampleData() { return this.services.sampleDataService.loadSampleData() }
  clearAll() { return this.services.sampleDataService.clearAll() }
  rebuildAuxiliaryAccounts() { 
    if (this.services.accountService instanceof AccountService) {
      return this.services.accountService.rebuildAuxiliaryAccounts()
    }
    throw new Error('rebuildAuxiliaryAccounts requires AccountService implementation')
  }
  
  // Closing entries
  createClosingEntries(closingDate: string) { return this.services.closingService.createClosingEntries(closingDate) }
  
  // Legacy methods for backward compatibility
  postJournal(journal: Journal) { 
    if (this.services.journalService instanceof JournalService) {
      return this.services.journalService.postJournal(journal)
    }
    throw new Error('postJournal requires JournalService implementation')
  }
  validateDivisionAccounting(journal: Journal) { 
    if (this.services.journalService instanceof JournalService) {
      return this.services.journalService.validateDivisionAccounting(journal)
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
  getTransactionService() { return this.services.transactionService }
  getJournalGenerationEngine() { return this.services.journalGenerationEngine }
  getAccountService() { return this.services.accountService }
  createTransaction(input: any) { return this.services.transactionService.createTransaction(input) }
  getTransactions() { return this.services.transactionService.getTransactions() }
  searchTransactions(criteria: any) { return this.services.transactionService.searchTransactions(criteria) }
  settleTransaction(id: string, paymentAccountCode: string) { 
    return this.services.transactionService.settleTransaction(id, paymentAccountCode) 
  }
  getCounterparties() { return this.services.transactionService.getCounterparties() }
  getTransactionTemplates() { return this.services.transactionService.getTemplates() }
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