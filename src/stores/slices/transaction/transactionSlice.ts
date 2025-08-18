import { StateCreator } from 'zustand'
import { Transaction, TransactionInput } from '../../types/transaction'
import { TransactionService } from '../../../domain/services/transaction/TransactionService'
import { TransactionState, TransactionActions, StoreState } from '../types'

export interface TransactionSlice extends TransactionState, TransactionActions {}

export const createTransactionSlice: StateCreator<
  StoreState,
  [],
  [],
  TransactionSlice
> = (set, get) => ({
  // 初期状態
  transactions: [],
  transactionService: null,
  selectedTransaction: null,
  
  // アクション
  initializeTransactions: () => {
    const { engine, bankAccountService } = get()
    
    if (!engine) {
      console.error('Engine not initialized')
      return
    }
    
    // engineからjournalServiceを取得
    const journalService = engine.journals ? {
      createJournal: (data: any, options: any) => {
        // 簡易実装
        return { success: true, data: { id: `j_${Date.now()}`, ...data } }
      }
    } : null
    
    if (!journalService) {
      console.error('JournalService not available')
      return
    }
    
    const service = new TransactionService(
      engine.accounts,
      journalService as any,
      bankAccountService || undefined
    )
    
    set({
      transactionService: service,
      transactions: []
    })
    
    console.log('TransactionService initialized')
  },
  
  createTransaction: async (input: TransactionInput) => {
    const service = get().transactionService
    if (!service) {
      const error = 'TransactionService not initialized'
      set({ error })
      return { success: false, errors: [error] }
    }
    
    set({ isLoading: true })
    
    try {
      // 決済口座の検証
      if (input.paymentAccountCode) {
        const { bankAccountService } = get()
        if (bankAccountService) {
          const account = bankAccountService.getAccount(input.paymentAccountCode)
          if (!account) {
            throw new Error(`決済口座 ${input.paymentAccountCode} が見つかりません`)
          }
          if (!account.isActive) {
            throw new Error(`決済口座 ${account.name} は無効化されています`)
          }
        }
      }
      
      const result = service.createTransaction(input)
      
      if (result.success && result.data) {
        const transaction = result.data as Transaction
        
        // 口座参照を登録
        if (input.paymentAccountCode) {
          const { bankAccountService } = get()
          bankAccountService?.registerTransactionReference(
            transaction.id,
            input.paymentAccountCode,
            false
          )
        }
        
        // 振替取引の場合
        if (input.type === 'transfer' && input.accountCode) {
          const { bankAccountService } = get()
          bankAccountService?.registerTransactionReference(
            transaction.id,
            input.accountCode,
            true
          )
        }
        
        set(state => ({
          transactions: [...state.transactions, transaction],
          isLoading: false,
          lastUpdate: new Date()
        }))
        
        get().showToast('success', '取引を登録しました')
        
        return { success: true, data: transaction }
      } else {
        throw new Error(result.errors?.join('\n') || '取引の作成に失敗しました')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '取引の作成中にエラーが発生しました'
      
      set({ 
        isLoading: false, 
        error: errorMessage 
      })
      
      get().showToast('error', errorMessage)
      
      return { success: false, errors: [errorMessage] }
    }
  },
  
  updateTransaction: (id: string, updates: Partial<Transaction>) => {
    set(state => ({
      transactions: state.transactions.map(t => 
        t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t
      ),
      lastUpdate: new Date()
    }))
    
    get().showToast('success', '取引を更新しました')
  },
  
  deleteTransaction: (id: string) => {
    const transaction = get().transactions.find(t => t.id === id)
    
    if (transaction) {
      // 口座参照を削除
      const { bankAccountService } = get()
      if (bankAccountService) {
        if (transaction.paymentAccountCode) {
          bankAccountService.unregisterTransactionReference(
            id,
            transaction.paymentAccountCode,
            false
          )
        }
        
        if (transaction.type === 'transfer' && transaction.accountCode) {
          bankAccountService.unregisterTransactionReference(
            id,
            transaction.accountCode,
            true
          )
        }
      }
    }
    
    set(state => ({
      transactions: state.transactions.filter(t => t.id !== id),
      selectedTransaction: state.selectedTransaction?.id === id ? null : state.selectedTransaction,
      lastUpdate: new Date()
    }))
    
    get().showToast('success', '取引を削除しました')
  },
  
  selectTransaction: (transaction: Transaction | null) => {
    set({ selectedTransaction: transaction })
  }
})