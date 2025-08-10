// 基本的な会計関連の型定義

export type NormalBalance = 'DEBIT' | 'CREDIT'
export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'
export type JournalStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'POSTED'
export type DivisionCode = 'KANRI' | 'SHUZEN' | 'PARKING' | 'SPECIAL' | null

// 勘定科目の定義
export interface AccountDefinition {
  code: string
  name: string
  type: AccountType
  normalBalance: NormalBalance
  level: number
  parentCode: string | null
  division: DivisionCode
  isActive?: boolean
}

// 仕訳明細
export interface JournalDetail {
  accountCode: string
  debitAmount: number
  creditAmount: number
  description?: string
  auxiliaryCode?: string | null
}

// 仕訳データ
export interface JournalData {
  date: string
  description: string
  reference?: string
  details: JournalDetail[]
}

// 仕訳作成オプション
export interface CreateJournalOptions {
  autoPost?: boolean
  meta?: Record<string, any>
}

// 仕訳作成結果
export interface CreateJournalResult {
  success: boolean
  errors?: string[]
  journal?: Journal
}

// 仕訳クラスのインターフェース
export interface Journal {
  id: string
  date: string
  description: string
  reference?: string
  details: JournalDetail[]
  status: JournalStatus
  meta?: Record<string, any>
  validate(): string[]
}

// 残高情報
export interface Balance {
  code: string
  name: string
  amount: number
  debitBalance: number
  creditBalance: number
}

// 試算表データ
export interface TrialBalance {
  accounts: Balance[]
  totalDebit: number
  totalCredit: number
  isBalanced: boolean
}

// 損益計算書データ
export interface IncomeStatement {
  revenues: Array<{ code: string; name: string; amount: number }>
  expenses: Array<{ code: string; name: string; amount: number }>
  totalRevenue: number
  totalExpense: number
  netIncome: number
}

// 貸借対照表データ
export interface BalanceSheet {
  assets: Array<{ code: string; name: string; amount: number }>
  liabilities: Array<{ code: string; name: string; amount: number }>
  equity: Array<{ code: string; name: string; amount: number }>
  totalAssets: number
  totalLiabilities: number
  totalEquity: number
  isBalanced: boolean
}

// 補助元帳データ
export interface AuxiliaryLedger {
  masterAccountCode: string
  auxiliaryCode: string
  name: string
  balance: number
  transactions: AuxiliaryTransaction[]
  attributes: Record<string, any>
  isActive: boolean
}

// 補助元帳取引
export interface AuxiliaryTransaction {
  date: Date
  amount: number
  isDebit: boolean
  journalId: string
  description: string
  balance: number
  balanceAfter: number
}

// 区分データ
export interface Division {
  code: DivisionCode
  name: string
  balance: number
  description?: string
}

// 組合員データ
export interface UnitOwner {
  unitNumber: string
  ownerName: string
  floor: number
  area: number
  managementFee: number
  repairReserve: number
  contact?: string
  bankAccount?: string
  isActive: boolean
}

// 業者データ
export interface Vendor {
  vendorCode: string
  vendorName: string
  category: string
  bankAccount?: string
  isActive: boolean
}

// インポートデータ形式
export interface ImportJson {
  clearExisting?: boolean
  journals: Array<{
    date: string
    description: string
    reference?: string
    number?: string
    status?: JournalStatus
    meta?: Record<string, any>
    details: JournalDetail[]
  }>
  unitOwners?: UnitOwner[]
  vendors?: Vendor[]
  openingBalances?: {
    date: string
    entries: Array<{ accountCode: string; debitAmount?: number; creditAmount?: number }>
  }
}

// エクスポートデータ形式
export interface ExportJson {
  exportDate: string
  journals: Array<{
    id: string
    date: string
    description: string
    number: string
    status: JournalStatus
    meta?: Record<string, any>
    details: JournalDetail[]
  }>
  unitOwners: UnitOwner[]
  vendors: Vendor[]
  trialBalance: TrialBalance
  divisions: Division[]
}

// デバッグ情報
export interface BalanceSheetDebugInfo {
  assets: DebugItem[]
  liabilities: DebugItem[]
  equity: DebugItem[]
  assetCalculation: string
  liabilityCalculation: string
  equityCalculation: string
  netIncome: number
}

export interface DebugItem {
  code: string
  name: string
  balance: number
  isDebit: boolean
  displayAmount: number
  calculatedAmount: number
}