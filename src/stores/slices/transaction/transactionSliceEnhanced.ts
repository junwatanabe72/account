import { StateCreator } from 'zustand'
import { Transaction, TransactionType, PaymentMethod } from '../../../types/transaction'
import { StoreState } from '../../types'
import { v4 as uuidv4 } from 'uuid'

/**
 * 取引管理の拡張スライス
 * 動的データとして取引を管理
 */

export interface EnhancedTransactionState {
  // 動的データ
  transactions: Transaction[]
  transfers: Transfer[]
  
  // UI状態
  selectedTransactionIds: Set<string>
  transactionFilter: {
    type?: TransactionType
    dateFrom?: string
    dateTo?: string
    accountCode?: string
    vendorId?: string
    amountMin?: number
    amountMax?: number
    paymentMethod?: PaymentMethod
  }
  transactionSort: {
    field: 'date' | 'amount' | 'type' | 'vendor'
    direction: 'asc' | 'desc'
  }
}

export interface Transfer {
  id: string
  date: string
  fromAccountCode: string
  toAccountCode: string
  amount: number
  description: string
  fee?: number
  feeAccountCode?: string
  status: 'pending' | 'completed' | 'cancelled'
  createdAt: string
  completedAt?: string
}

export interface EnhancedTransactionActions {
  // 取引CRUD操作
  createEnhancedTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => Transaction
  updateEnhancedTransaction: (id: string, updates: Partial<Transaction>) => boolean
  deleteEnhancedTransaction: (id: string) => boolean
  duplicateTransaction: (id: string) => Transaction | null
  
  // 振替操作
  createTransfer: (transfer: Omit<Transfer, 'id' | 'createdAt' | 'status'>) => Transfer
  completeTransfer: (id: string) => boolean
  cancelTransfer: (id: string) => boolean
  
  // 一括操作
  importTransactions: (transactions: Transaction[]) => { success: number; failed: number }
  deleteMultipleTransactions: (ids: string[]) => { success: number; failed: number }
  
  // フィルター・ソート
  setTransactionFilter: (filter: Partial<EnhancedTransactionState['transactionFilter']>) => void
  clearTransactionFilter: () => void
  setTransactionSort: (field: EnhancedTransactionState['transactionSort']['field'], direction?: 'asc' | 'desc') => void
  
  // 選択管理
  selectTransaction: (id: string) => void
  deselectTransaction: (id: string) => void
  selectAllTransactions: () => void
  clearTransactionSelection: () => void
  
  // 集計・分析
  getFilteredTransactions: () => Transaction[]
  getSortedTransactions: () => Transaction[]
  getTransactionsByType: (type: TransactionType) => Transaction[]
  getTransactionsByPeriod: (startDate: string, endDate: string) => Transaction[]
  getTransactionsByVendor: (vendorId: string) => Transaction[]
  getTotalsByType: () => Record<TransactionType, number>
  getTotalsByPaymentMethod: () => Record<PaymentMethod, number>
  getMonthlyTotals: (year: number, month: number) => { income: number; expense: number; net: number }
  
  // 振替関連
  getTransfersByAccount: (accountCode: string) => Transfer[]
  getPendingTransfers: () => Transfer[]
  getTransferTotal: (accountCode: string, dateFrom?: string, dateTo?: string) => { inflow: number; outflow: number }
  
  // バリデーション
  validateTransaction: (transaction: Partial<Transaction>) => { isValid: boolean; errors: string[] }
  canDeleteTransaction: (id: string) => boolean
}

export interface EnhancedTransactionSlice extends EnhancedTransactionState, EnhancedTransactionActions {}

export const createEnhancedTransactionSlice: StateCreator<
  StoreState,
  [],
  [],
  EnhancedTransactionSlice
> = (set, get) => ({
  // 初期状態
  transactions: [],
  transfers: [],
  selectedTransactionIds: new Set(),
  transactionFilter: {},
  transactionSort: { field: 'date', direction: 'desc' },
  
  // 取引作成（拡張版）
  createEnhancedTransaction: (transactionData) => {
    const newTransaction: Transaction = {
      ...transactionData,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    }
    
    // バリデーション
    const validation = get().validateTransaction(newTransaction)
    if (!validation.isValid) {
      get().showToast('error', validation.errors.join(', '))
      return newTransaction
    }
    
    set(state => ({
      transactions: [...state.transactions, newTransaction],
      lastUpdate: new Date()
    }))
    
    // 自動的に仕訳を生成（必要に応じて）
    if (newTransaction.type === 'INCOME' || newTransaction.type === 'EXPENSE') {
      get().createJournal(
        [
          {
            accountCode: newTransaction.accountCode,
            amount: newTransaction.amount,
            isDebit: newTransaction.type === 'EXPENSE',
            description: newTransaction.description
          }
        ],
        newTransaction.description,
        newTransaction.date
      )
    }
    
    get().showToast('success', '取引を登録しました')
    return newTransaction
  },
  
  // 取引更新（拡張版）
  updateEnhancedTransaction: (id, updates) => {
    const transaction = get().transactions.find(t => t.id === id)
    if (!transaction) {
      get().showToast('error', '取引が見つかりません')
      return false
    }
    
    const updatedTransaction = { ...transaction, ...updates }
    const validation = get().validateTransaction(updatedTransaction)
    if (!validation.isValid) {
      get().showToast('error', validation.errors.join(', '))
      return false
    }
    
    set(state => ({
      transactions: state.transactions.map(t => 
        t.id === id ? updatedTransaction : t
      ),
      lastUpdate: new Date()
    }))
    
    get().showToast('success', '取引を更新しました')
    return true
  },
  
  // 取引削除（拡張版）
  deleteEnhancedTransaction: (id) => {
    if (!get().canDeleteTransaction(id)) {
      get().showToast('error', 'この取引は削除できません')
      return false
    }
    
    set(state => ({
      transactions: state.transactions.filter(t => t.id !== id),
      selectedTransactionIds: new Set([...state.selectedTransactionIds].filter(sid => sid !== id)),
      lastUpdate: new Date()
    }))
    
    get().showToast('success', '取引を削除しました')
    return true
  },
  
  // 取引複製
  duplicateTransaction: (id) => {
    const transaction = get().transactions.find(t => t.id === id)
    if (!transaction) {
      get().showToast('error', '取引が見つかりません')
      return null
    }
    
    const duplicated = get().createEnhancedTransaction({
      ...transaction,
      date: new Date().toISOString().split('T')[0],
      description: `${transaction.description} (複製)`
    })
    
    return duplicated
  },
  
  // 振替作成
  createTransfer: (transferData) => {
    const newTransfer: Transfer = {
      ...transferData,
      id: uuidv4(),
      status: 'pending',
      createdAt: new Date().toISOString()
    }
    
    set(state => ({
      transfers: [...state.transfers, newTransfer],
      lastUpdate: new Date()
    }))
    
    get().showToast('success', '振替を作成しました')
    return newTransfer
  },
  
  // 振替完了
  completeTransfer: (id) => {
    const transfer = get().transfers.find(t => t.id === id)
    if (!transfer) {
      get().showToast('error', '振替が見つかりません')
      return false
    }
    
    if (transfer.status === 'completed') {
      get().showToast('warning', '既に完了しています')
      return false
    }
    
    // 仕訳を生成
    const entries = [
      {
        accountCode: transfer.fromAccountCode,
        amount: transfer.amount,
        isDebit: false,
        description: `振替: ${transfer.description}`
      },
      {
        accountCode: transfer.toAccountCode,
        amount: transfer.amount,
        isDebit: true,
        description: `振替: ${transfer.description}`
      }
    ]
    
    // 手数料がある場合
    if (transfer.fee && transfer.feeAccountCode) {
      entries.push({
        accountCode: transfer.fromAccountCode,
        amount: transfer.fee,
        isDebit: false,
        description: '振替手数料'
      })
      entries.push({
        accountCode: transfer.feeAccountCode,
        amount: transfer.fee,
        isDebit: true,
        description: '振替手数料'
      })
    }
    
    get().createJournal(entries, transfer.description, transfer.date)
    
    set(state => ({
      transfers: state.transfers.map(t => 
        t.id === id 
          ? { ...t, status: 'completed' as const, completedAt: new Date().toISOString() }
          : t
      ),
      lastUpdate: new Date()
    }))
    
    get().showToast('success', '振替を完了しました')
    return true
  },
  
  // 振替キャンセル
  cancelTransfer: (id) => {
    const transfer = get().transfers.find(t => t.id === id)
    if (!transfer) {
      get().showToast('error', '振替が見つかりません')
      return false
    }
    
    if (transfer.status === 'completed') {
      get().showToast('error', '完了済みの振替はキャンセルできません')
      return false
    }
    
    set(state => ({
      transfers: state.transfers.map(t => 
        t.id === id ? { ...t, status: 'cancelled' as const } : t
      ),
      lastUpdate: new Date()
    }))
    
    get().showToast('success', '振替をキャンセルしました')
    return true
  },
  
  // 取引インポート
  importTransactions: (transactions) => {
    let success = 0
    let failed = 0
    
    transactions.forEach(transaction => {
      const validation = get().validateTransaction(transaction)
      if (validation.isValid) {
        get().createEnhancedTransaction(transaction)
        success++
      } else {
        failed++
      }
    })
    
    get().showToast('info', `インポート完了: 成功 ${success}件, 失敗 ${failed}件`)
    return { success, failed }
  },
  
  // 一括削除
  deleteMultipleTransactions: (ids) => {
    let success = 0
    let failed = 0
    
    ids.forEach(id => {
      if (get().deleteEnhancedTransaction(id)) {
        success++
      } else {
        failed++
      }
    })
    
    return { success, failed }
  },
  
  // フィルター設定
  setTransactionFilter: (filter) => {
    set(state => ({
      transactionFilter: { ...state.transactionFilter, ...filter }
    }))
  },
  
  clearTransactionFilter: () => {
    set({ transactionFilter: {} })
  },
  
  // ソート設定
  setTransactionSort: (field, direction) => {
    set(state => ({
      transactionSort: {
        field,
        direction: direction || (state.transactionSort.field === field && state.transactionSort.direction === 'asc' ? 'desc' : 'asc')
      }
    }))
  },
  
  // 選択管理
  selectTransaction: (id) => {
    set(state => ({
      selectedTransactionIds: new Set([...state.selectedTransactionIds, id])
    }))
  },
  
  deselectTransaction: (id) => {
    set(state => ({
      selectedTransactionIds: new Set([...state.selectedTransactionIds].filter(sid => sid !== id))
    }))
  },
  
  selectAllTransactions: () => {
    const filtered = get().getFilteredTransactions()
    set({
      selectedTransactionIds: new Set(filtered.map(t => t.id))
    })
  },
  
  clearTransactionSelection: () => {
    set({ selectedTransactionIds: new Set() })
  },
  
  // フィルター済み取引取得
  getFilteredTransactions: () => {
    const { transactions, transactionFilter } = get()
    
    return transactions.filter(t => {
      if (transactionFilter.type && t.type !== transactionFilter.type) return false
      if (transactionFilter.dateFrom && t.date < transactionFilter.dateFrom) return false
      if (transactionFilter.dateTo && t.date > transactionFilter.dateTo) return false
      if (transactionFilter.accountCode && t.accountCode !== transactionFilter.accountCode) return false
      if (transactionFilter.vendorId && t.vendorId !== transactionFilter.vendorId) return false
      if (transactionFilter.paymentMethod && t.paymentMethod !== transactionFilter.paymentMethod) return false
      if (transactionFilter.amountMin && t.amount < transactionFilter.amountMin) return false
      if (transactionFilter.amountMax && t.amount > transactionFilter.amountMax) return false
      return true
    })
  },
  
  // ソート済み取引取得
  getSortedTransactions: () => {
    const { transactionSort } = get()
    const filtered = get().getFilteredTransactions()
    
    return [...filtered].sort((a, b) => {
      let comparison = 0
      
      switch (transactionSort.field) {
        case 'date':
          comparison = a.date.localeCompare(b.date)
          break
        case 'amount':
          comparison = a.amount - b.amount
          break
        case 'type':
          comparison = a.type.localeCompare(b.type)
          break
        case 'vendor':
          comparison = (a.vendorId || '').localeCompare(b.vendorId || '')
          break
      }
      
      return transactionSort.direction === 'asc' ? comparison : -comparison
    })
  },
  
  // タイプ別取引取得
  getTransactionsByType: (type) => {
    return get().transactions.filter(t => t.type === type)
  },
  
  // 期間別取引取得
  getTransactionsByPeriod: (startDate, endDate) => {
    return get().transactions.filter(t => t.date >= startDate && t.date <= endDate)
  },
  
  // 取引先別取引取得
  getTransactionsByVendor: (vendorId) => {
    return get().transactions.filter(t => t.vendorId === vendorId)
  },
  
  // タイプ別集計
  getTotalsByType: () => {
    const totals: Record<TransactionType, number> = {
      INCOME: 0,
      EXPENSE: 0,
      TRANSFER: 0
    }
    
    get().transactions.forEach(t => {
      totals[t.type] += t.amount
    })
    
    return totals
  },
  
  // 支払方法別集計
  getTotalsByPaymentMethod: () => {
    const totals: Partial<Record<PaymentMethod, number>> = {}
    
    get().transactions.forEach(t => {
      if (t.paymentMethod) {
        totals[t.paymentMethod] = (totals[t.paymentMethod] || 0) + t.amount
      }
    })
    
    return totals as Record<PaymentMethod, number>
  },
  
  // 月次集計
  getMonthlyTotals: (year, month) => {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`
    
    const transactions = get().getTransactionsByPeriod(startDate, endDate)
    
    const income = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const expense = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0)
    
    return {
      income,
      expense,
      net: income - expense
    }
  },
  
  // 口座別振替取得
  getTransfersByAccount: (accountCode) => {
    return get().transfers.filter(t => 
      t.fromAccountCode === accountCode || t.toAccountCode === accountCode
    )
  },
  
  // 保留中振替取得
  getPendingTransfers: () => {
    return get().transfers.filter(t => t.status === 'pending')
  },
  
  // 振替合計取得
  getTransferTotal: (accountCode, dateFrom, dateTo) => {
    let inflow = 0
    let outflow = 0
    
    get().transfers
      .filter(t => {
        if (t.status !== 'completed') return false
        if (dateFrom && t.date < dateFrom) return false
        if (dateTo && t.date > dateTo) return false
        return t.fromAccountCode === accountCode || t.toAccountCode === accountCode
      })
      .forEach(t => {
        if (t.fromAccountCode === accountCode) {
          outflow += t.amount + (t.fee || 0)
        }
        if (t.toAccountCode === accountCode) {
          inflow += t.amount
        }
      })
    
    return { inflow, outflow }
  },
  
  // バリデーション
  validateTransaction: (transaction) => {
    const errors: string[] = []
    
    if (!transaction.date) {
      errors.push('日付は必須です')
    }
    
    if (!transaction.amount || transaction.amount <= 0) {
      errors.push('金額は0より大きい必要があります')
    }
    
    if (!transaction.type) {
      errors.push('取引タイプは必須です')
    }
    
    if (!transaction.accountCode) {
      errors.push('勘定科目は必須です')
    }
    
    if (!transaction.description) {
      errors.push('摘要は必須です')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  },
  
  // 削除可能判定
  canDeleteTransaction: (id) => {
    const transaction = get().transactions.find(t => t.id === id)
    if (!transaction) return false
    
    // ビジネスルールに基づいて削除可能かどうかを判定
    // 例：記帳済みの取引は削除不可など
    
    return true
  }
})