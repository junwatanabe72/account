// Account Types
export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'
export type NormalBalance = 'DEBIT' | 'CREDIT'
export type JournalStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'POSTED'
export type DivisionCode = 'KANRI' | 'SHUZEN' | 'PARKING' | 'SHARED' | 'SPECIAL'

// Account Definition
export interface AccountDefinition {
  code: string
  name: string
  type: AccountType
  normalBalance: NormalBalance
  division?: DivisionCode
  parentCode?: string
  description?: string
  isActive?: boolean
}

// Journal Related Types
export interface JournalDetailData {
  accountCode: string
  debitAmount?: number
  creditAmount?: number
  description?: string
  auxiliaryCode?: string | null
}

export interface JournalData {
  date: string
  description: string
  reference?: string
  details: JournalDetailData[]
  status?: JournalStatus
  number?: string
}

export interface CreateJournalOptions {
  autoPost?: boolean
  meta?: Record<string, any>
}

export interface CreateJournalResult {
  success: boolean
  data?: any
  errors?: string[]
}

// Auxiliary Types
export interface UnitOwner {
  unitNumber: string
  ownerName: string
  monthlyManagementFee: number
  monthlyReserveFund: number
  parkingFee: number
  isActive: boolean
}

export interface Vendor {
  code: string
  name: string
  category: string
}

// Report Types
export interface TrialBalanceEntry {
  code: string
  name: string
  debit: number
  credit: number
  debitBalance: number
  creditBalance: number
}

export interface TrialBalance {
  entries: TrialBalanceEntry[]
  accounts: TrialBalanceEntry[]  // backward compatibility
  totalDebit: number
  totalCredit: number
  isBalanced: boolean
}

export interface IncomeStatementItem {
  code: string
  name: string
  amount: number
}

export interface IncomeStatement {
  revenues: IncomeStatementItem[]
  expenses: IncomeStatementItem[]
  totalRevenue: number
  totalExpense: number
  netIncome: number
}

export interface BalanceSheetItem {
  code: string
  name: string
  amount: number
}

export interface BalanceSheet {
  assets: BalanceSheetItem[]
  liabilities: BalanceSheetItem[]
  equity: BalanceSheetItem[]
  totalAssets: number
  totalLiabilities: number
  totalEquity: number
  totalLiabilitiesAndEquity: number
  isBalanced: boolean
}

export interface BalanceSheetDebugEntry extends BalanceSheetItem {
  rawBalance: number
  normalBalance: NormalBalance
  isDebitBalance: boolean
  balance?: number
  isDebit?: boolean
  displayAmount?: number
  calculatedAmount?: number
}

export interface AccountDetail {
  code: string
  name: string
  type: AccountType
  normalBalance: NormalBalance
  rawBalance: number
  displayBalance: number
  isDebitBalance: boolean
}

export interface BalanceSheetDebugInfo {
  assets: BalanceSheetDebugEntry[]
  liabilities: BalanceSheetDebugEntry[]
  equity: BalanceSheetDebugEntry[]
  totalAssets: number
  totalLiabilities: number
  totalEquity: number
  totalLiabilitiesAndEquity: number
  isBalanced: boolean
  difference: number
  accountDetails: AccountDetail[]
  assetCalculation?: string
  liabilityCalculation?: string
  equityCalculation?: string
  netIncome?: number
}

// Import/Export Types
export interface ImportJson {
  clearExisting?: boolean
  unitOwners?: UnitOwner[]
  vendors?: Vendor[]
  openingBalances?: Array<{
    date?: string
    accountCode: string
    debitAmount?: number
    creditAmount?: number
  }>
  journals?: JournalData[]
  autoPost?: boolean
}

export interface ExportJson {
  version: string
  exportDate: string
  unitOwners: UnitOwner[]
  vendors: Vendor[]
  journals: JournalData[]
}

// Income/Expense Detail Types
export interface IncomeExpenseDetail {
  journalId: string
  date: string
  number: string
  accountCode: string
  accountName: string
  description: string
  amount: number
  auxiliaryCode?: string
  auxiliaryName?: string
  division?: string
}

export interface IncomeExpenseSummary {
  accountCode: string
  accountName: string
  amount: number
  count: number
  division?: string
  auxiliaryDetails?: Array<{
    auxiliaryCode: string
    auxiliaryName: string
    amount: number
    count: number
  }>
}

// Closing Entry Result
export interface ClosingEntryResult {
  division: string
  success: boolean
  journalId?: string
  error?: string
}

// Unit Receivables Summary
export interface UnitReceivablesSummary {
  unitNumber: string
  ownerName: string
  managementFeeReceivable: number
  reserveFundReceivable: number
  totalReceivable: number
}

// Auxiliary Ledger Summary
export interface AuxiliaryLedgerSummaryItem {
  code: string
  name: string
  balance: number
  isDebit: boolean
}

export interface AuxiliaryLedgerSummary {
  accountCode: string
  accountName: string
  auxiliaries: AuxiliaryLedgerSummaryItem[]
}