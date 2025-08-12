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

import { AccountService, HierarchicalAccount, AuxiliaryLedger } from './services/AccountService'
import { JournalService, Journal, JournalDetail } from './services/JournalService'
import { DivisionService, AccountingDivision } from './services/DivisionService'
import { ReportService } from './services/ReportService'
import { ImportExportService } from './services/ImportExportService'
import { AuxiliaryService } from './services/AuxiliaryService'
import { SampleDataService } from './services/SampleDataService'
import { ClosingService } from './services/ClosingService'
import { TransactionService } from './services/TransactionService'
import { JournalGenerationEngine } from './services/JournalGenerationEngine'

// Re-export for backward compatibility
export { HierarchicalAccount, AuxiliaryLedger, Journal, JournalDetail, AccountingDivision }

export class AccountingEngine {
  private accountService: AccountService
  private journalService: JournalService
  private divisionService: DivisionService
  private reportService: ReportService
  private importExportService: ImportExportService
  private auxiliaryService: AuxiliaryService
  private sampleDataService: SampleDataService
  private closingService: ClosingService
  private transactionService: TransactionService
  private journalGenerationEngine: JournalGenerationEngine
  
  constructor() {
    this.accountService = new AccountService()
    this.divisionService = new DivisionService()
    this.auxiliaryService = new AuxiliaryService()
    this.journalService = new JournalService(this.accountService, this.divisionService)
    this.reportService = new ReportService(this.accountService, this.journalService, this.divisionService)
    this.importExportService = new ImportExportService(
      this.accountService, 
      this.journalService, 
      this.divisionService, 
      this.auxiliaryService
    )
    this.sampleDataService = new SampleDataService(
      this.journalService,
      this.accountService,
      this.auxiliaryService
    )
    this.closingService = new ClosingService(
      this.accountService,
      this.journalService,
      this.divisionService
    )
    this.journalGenerationEngine = new JournalGenerationEngine(this.accountService)
    this.transactionService = new TransactionService(this.accountService, this.journalService)
    
    this.initializeEngine()
  }
  
  private initializeEngine() {
    this.accountService.initializeAccounts()
    this.divisionService.initializeDivisions()
    this.auxiliaryService.initializeUnitOwners()
    this.auxiliaryService.initializeVendors()
    this.auxiliaryService.createUnitOwnerAuxiliaryAccounts(this.accountService)
    this.sampleDataService.loadTwoYearSampleData()
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
  loadTwoYearSampleData() { return this.sampleDataService.loadTwoYearSampleData() }
  loadSampleData() { return this.sampleDataService.loadSampleData() }
  clearAll() { return this.sampleDataService.clearAll() }
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
      isActive: acc.isActive
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