import { BankAccount } from '../../data/bankAccounts'
import { AccountingEngine } from '../../domain/accountingEngine'
import { BankAccountService, AccountSyncResult } from '../../domain/services/ledger/BankAccountService'
import { TransactionService } from '../../domain/services/transaction/TransactionService'
import { Transaction, TransactionInput } from '../../types/transaction'
import { Journal, JournalEntry } from '../../types/accounting'
import { EnhancedJournalSlice } from '../slices/journalSliceEnhanced'
import { EnhancedTransactionSlice } from '../slices/transactionSliceEnhanced'
import { EnhancedAuxiliarySlice } from '../slices/auxiliarySliceEnhanced'

// UI状態の型定義
export interface UIState {
  isLoading: boolean
  error: string | null
  toastMessage: {
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
  } | null
}

// 会計エンジン状態の型定義
export interface AccountingState {
  engine: AccountingEngine | null
  isInitialized: boolean
  lastUpdate: Date | null
}

// 口座管理状態の型定義
export interface BankAccountState {
  bankAccounts: BankAccount[]
  bankAccountService: BankAccountService | null
  syncResult: AccountSyncResult | null
}

// 取引管理状態の型定義
export interface TransactionState {
  transactions: Transaction[]
  transactionService: TransactionService | null
  selectedTransaction: Transaction | null
}

// 仕訳管理状態の型定義
export interface JournalState {
  journals: Journal[]
  selectedJournal: Journal | null
  filterCriteria: {
    status?: string
    dateFrom?: string
    dateTo?: string
    textQuery?: string
    accountQuery?: string
  }
}

// ストア全体の型定義
export interface StoreState extends 
  UIState, 
  AccountingState,
  AccountingActions,
  BankAccountState,
  BankAccountActions, 
  TransactionState,
  TransactionActions,
  JournalState,
  JournalActions,
  EnhancedJournalSlice,
  EnhancedTransactionSlice,
  EnhancedAuxiliarySlice {
  // グローバルアクション
  reset: () => void
  clearError: () => void
  showToast: (type: UIState['toastMessage']['type'], message: string) => void
  hideToast: () => void
  
  // 初期化アクション
  initializeAll: () => Promise<void>
}

// アクションの型定義
export interface AccountingActions {
  initializeEngine: () => void
  resetEngine: () => void
  updateEngine: (updater: (engine: AccountingEngine) => void) => void
}

export interface BankAccountActions {
  initializeBankAccounts: () => void
  addBankAccount: (account: BankAccount) => AccountSyncResult
  updateBankAccount: (code: string, updates: Partial<BankAccount>) => AccountSyncResult
  disableBankAccount: (code: string) => AccountSyncResult
  enableBankAccount: (code: string) => AccountSyncResult
  deleteBankAccount: (code: string, force?: boolean) => AccountSyncResult
  refreshBankAccounts: () => void
}

export interface TransactionActions {
  initializeTransactions: () => void
  createTransaction: (input: TransactionInput) => Promise<{ success: boolean; data?: Transaction; errors?: string[] }>
  updateTransaction: (id: string, updates: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void
  selectTransaction: (transaction: Transaction | null) => void
}

export interface JournalActions {
  loadJournals: () => void
  addJournal: (journal: Partial<Journal>) => void
  updateJournal: (id: string, updates: Partial<Journal>) => void
  deleteJournal: (id: string) => void
  selectJournal: (journal: Journal | null) => void
  setFilterCriteria: (criteria: JournalState['filterCriteria']) => void
  clearFilterCriteria: () => void
}