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
} from '../01-types'

import { AccountService as DomainAccountService, HierarchicalAccount, AuxiliaryLedger } from '../03-services/account/AccountService'
import { JournalService, Journal, JournalDetail } from '../03-services/journal/JournalService'
import { DivisionService, AccountingDivision } from '../03-services/division/DivisionService'
import { ReportService } from '../03-services/reporting/ReportService'
import { ImportExportService } from '../03-services/io/ImportExportService'
import { AuxiliaryService } from '../03-services/auxiliary/AuxiliaryService'
import { SampleDataService } from '../06-data/generators/SampleDataService'
import { ClosingService } from '../03-services/closing/ClosingService'
import { TransactionService } from '../03-services/transaction/TransactionService'
import { JournalGenerationEngine } from '../02-core/generators/JournalGenerationEngine'
import { AccountingFacade } from '../03-services/facade/AccountingFacade'

// Re-export for backward compatibility
export { HierarchicalAccount, AuxiliaryLedger, Journal, JournalDetail, AccountingDivision }

/**
 * AccountingEngine - 後方互換性のためのラッパークラス
 * 新しいアーキテクチャではAccountingFacadeを使用してください
 * @deprecated Use AccountingFacade instead
 */
export class AccountingEngine {
  private facade: AccountingFacade
  
  // 後方互換性のためのプロパティ
  private get accountService() { return this.facade.core.accounts as any }
  private get journalService() { return this.facade.core.journals as any }
  private get divisionService() { return this.facade.core.divisions as any }
  private get reportService() { return this.facade.reporting as any }
  private get importExportService() { return this.facade.io as any }
  private get auxiliaryService() { return this.facade.helper.auxiliary as any }
  private get _sampleDataService() { return this.facade.helper.sampleData as any }
  private get closingService() { return this.facade.helper.closing as any }
  private get transactionService() { return this.facade.core.transactions as any }
  private get journalGenerationEngine() { return this.facade.helper.journalGenerator as any }
  
  constructor() {
    this.facade = new AccountingFacade()
    this.initializeEngine()
  }
  
  private initializeEngine() {
    // 新しいファサードでの初期化
    this.facade.initialize()
    
    // 後方互換性のための追加初期化
    if (this.auxiliaryService && typeof this.auxiliaryService.initializeUnitOwners === 'function') {
      this.auxiliaryService.initializeUnitOwners()
    }
    if (this.auxiliaryService && typeof this.auxiliaryService.initializeVendors === 'function') {
      this.auxiliaryService.initializeVendors()
    }
    if (this.auxiliaryService && typeof this.auxiliaryService.createUnitOwnerAuxiliaryAccounts === 'function') {
      this.auxiliaryService.createUnitOwnerAuxiliaryAccounts(this.accountService)
    }
    if (this._sampleDataService && typeof this._sampleDataService.loadOneMonthSampleData === 'function') {
      this._sampleDataService.loadOneMonthSampleData()
    }
  }
  
  // Account management
  get accounts() { return this.accountService.accounts }
  get divisions() { return this.divisionService.divisions }
  initializeAccounts() { return this.accountService.initializeAccounts() }
  rebuildAccountsFrom(defs: any[]) { return this.accountService.rebuildAccountsFrom(defs) }
  addOrUpdateAccount(def: any) { return this.accountService.addOrUpdateAccount(def) }
  setAccountActive(code: string, active: boolean) { return this.accountService.setAccountActive(code, active) }
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
  getAuxiliaryLedgerSummary() { return this.auxiliaryService.getAuxiliaryLedgerSummary(this.accountService) }
  getUnitReceivablesSummary() { return this.auxiliaryService.getUnitReceivablesSummary(this.accountService) }
  createMonthlyBilling(billingDate: string) { 
    return this.auxiliaryService.createMonthlyBilling(billingDate, this.journalService, this.accountService) 
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
  rebuildAuxiliaryAccounts() { return this.accountService.rebuildAuxiliaryAccounts() }
  
  // Closing entries
  createClosingEntries(closingDate: string) { return this.closingService.createClosingEntries(closingDate) }
  
  // Legacy methods for backward compatibility
  postJournal(journal: Journal) { return this.journalService.postJournal(journal) }
  validateDivisionAccounting(journal: Journal) { return this.journalService.validateDivisionAccounting(journal) }
  
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
