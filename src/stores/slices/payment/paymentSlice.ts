/**
 * Payment Slice for Zustand Store
 * Phase 14: 銀行入金処理と未収金管理
 */

import { StateCreator } from 'zustand'
import {
  BankTransaction,
  ImportResult,
  PaymentMatching,
  Receivable,
  ReceivableSummary,
  UnitMaster
} from '../../../types/payment'
import { 
  BankImportService, 
  PaymentMatchingService, 
  ReceivableService 
} from '../../../domain/services/payment'
import { JournalService } from '../../../domain/services/core/JournalService'
import { AccountService } from '../../../domain/services/core/AccountService'

export interface PaymentSlice {
  // State
  bankTransactions: BankTransaction[]
  matchingResults: Map<string, PaymentMatching>
  receivables: Receivable[]
  currentBatchId: string | null
  isProcessing: boolean
  importResult: ImportResult | null
  receivableSummary: ReceivableSummary | null

  // Services
  bankImportService: BankImportService | null
  paymentMatchingService: PaymentMatchingService | null
  receivableService: ReceivableService | null

  // Actions - Initialization
  initializePaymentServices: (
    journalService: JournalService,
    accountService: AccountService
  ) => void

  // Actions - Bank Import
  importBankTransactions: (
    file: File,
    bankType?: 'mufg' | 'smbc' | 'mizuho' | 'generic'
  ) => Promise<ImportResult>
  
  clearImportedTransactions: () => void

  // Actions - Payment Matching
  processPaymentMatching: (
    transactionId: string
  ) => Promise<PaymentMatching>
  
  processAllUnmatched: () => Promise<void>
  
  manualMatchPayment: (
    transactionId: string,
    unitNumber: string
  ) => Promise<PaymentMatching>

  // Actions - Receivables
  createReceivable: (
    unitNumber: string,
    accountCode: '1301' | '1302' | '1303',
    amount: number,
    dueDate: string,
    memo?: string
  ) => Receivable
  
  clearReceivable: (
    receivableId: string,
    paymentAmount: number,
    journalId: string
  ) => void
  
  updateReceivableSummary: () => void
  
  getReceivablesByUnit: (unitNumber: string) => Receivable[]

  // Actions - Journal Creation
  createJournalFromMatching: (
    matchingId: string
  ) => Promise<string | null>

  // Actions - UI State
  setProcessing: (isProcessing: boolean) => void
  
  // Actions - Data Management
  refreshData: () => void
  clearAllData: () => void
}

export const createPaymentSlice: StateCreator<PaymentSlice> = (set, get) => ({
  // Initial State
  bankTransactions: [],
  matchingResults: new Map(),
  receivables: [],
  currentBatchId: null,
  isProcessing: false,
  importResult: null,
  receivableSummary: null,

  // Services (initialized later)
  bankImportService: null,
  paymentMatchingService: null,
  receivableService: null,

  // Initialize services
  initializePaymentServices: (journalService, accountService) => {
    const receivableService = new ReceivableService()
    const bankImportService = new BankImportService(journalService, accountService)
    const paymentMatchingService = new PaymentMatchingService(
      journalService,
      receivableService
    )

    set({
      bankImportService,
      paymentMatchingService,
      receivableService
    })

    // Load existing data
    get().refreshData()
  },

  // Import bank transactions
  importBankTransactions: async (file, bankType = 'generic') => {
    const { bankImportService } = get()
    if (!bankImportService) {
      throw new Error('Services not initialized')
    }

    set({ isProcessing: true })

    try {
      const result = await bankImportService.importCSV(file, bankType)
      
      set({
        importResult: result,
        currentBatchId: result.batchId,
        bankTransactions: result.transactions,
        isProcessing: false
      })

      return result
    } catch (error) {
      set({ isProcessing: false })
      throw error
    }
  },

  clearImportedTransactions: () => {
    const { bankImportService } = get()
    if (bankImportService) {
      bankImportService.clearAll()
    }
    set({
      bankTransactions: [],
      currentBatchId: null,
      importResult: null
    })
  },

  // Process payment matching
  processPaymentMatching: async (transactionId) => {
    const { paymentMatchingService, bankTransactions } = get()
    if (!paymentMatchingService) {
      throw new Error('Services not initialized')
    }

    const transaction = bankTransactions.find(t => t.id === transactionId)
    if (!transaction) {
      throw new Error('Transaction not found')
    }

    set({ isProcessing: true })

    try {
      const matching = await paymentMatchingService.processPayment(transaction)
      
      // Update matching results
      const newResults = new Map(get().matchingResults)
      newResults.set(matching.id, matching)
      
      // Update transaction status
      transaction.status = 'matched'
      
      set({
        matchingResults: newResults,
        bankTransactions: [...get().bankTransactions],
        isProcessing: false
      })

      // Create receivables if needed
      if (matching.matchingType === 'partial' && matching.unitNumber) {
        const { receivableService } = get()
        if (receivableService && matching.difference < 0) {
          const shortage = Math.abs(matching.difference)
          
          // 未収金を作成
          if (matching.standardAmount) {
            // 管理費未収金
            if (matching.standardAmount.managementFee > 0) {
              const managementShortage = Math.floor(
                shortage * (matching.standardAmount.managementFee / 
                  (matching.standardAmount.managementFee + 
                   matching.standardAmount.repairReserve + 
                   (matching.standardAmount.parkingFee || 0)))
              )
              if (managementShortage > 0) {
                receivableService.createReceivable(
                  matching.unitNumber,
                  '1301',
                  managementShortage,
                  transaction.date,
                  '一部入金による未収金'
                )
              }
            }

            // 修繕積立金未収金
            if (matching.standardAmount.repairReserve > 0) {
              const repairShortage = Math.floor(
                shortage * (matching.standardAmount.repairReserve / 
                  (matching.standardAmount.managementFee + 
                   matching.standardAmount.repairReserve + 
                   (matching.standardAmount.parkingFee || 0)))
              )
              if (repairShortage > 0) {
                receivableService.createReceivable(
                  matching.unitNumber,
                  '1302',
                  repairShortage,
                  transaction.date,
                  '一部入金による未収金'
                )
              }
            }
          }

          // Refresh receivables
          get().refreshData()
        }
      }

      return matching
    } catch (error) {
      set({ isProcessing: false })
      throw error
    }
  },

  processAllUnmatched: async () => {
    const { bankTransactions } = get()
    const unmatched = bankTransactions.filter(t => t.status === 'unprocessed')
    
    set({ isProcessing: true })

    for (const transaction of unmatched) {
      try {
        await get().processPaymentMatching(transaction.id)
      } catch (error) {
        console.error(`Failed to match transaction ${transaction.id}:`, error)
      }
    }

    set({ isProcessing: false })
  },

  manualMatchPayment: async (transactionId, unitNumber) => {
    const { paymentMatchingService, bankTransactions } = get()
    if (!paymentMatchingService) {
      throw new Error('Services not initialized')
    }

    const transaction = bankTransactions.find(t => t.id === transactionId)
    if (!transaction) {
      throw new Error('Transaction not found')
    }

    // 手動で住戸番号を設定して再処理
    paymentMatchingService.manualSetUnit('', unitNumber, transaction.description)
    
    return get().processPaymentMatching(transactionId)
  },

  // Receivables management
  createReceivable: (unitNumber, accountCode, amount, dueDate, memo) => {
    const { receivableService } = get()
    if (!receivableService) {
      throw new Error('Services not initialized')
    }

    const receivable = receivableService.createReceivable(
      unitNumber,
      accountCode,
      amount,
      dueDate,
      memo
    )

    get().refreshData()
    return receivable
  },

  clearReceivable: (receivableId, paymentAmount, journalId) => {
    const { receivableService } = get()
    if (!receivableService) {
      throw new Error('Services not initialized')
    }

    receivableService.clearReceivable(receivableId, paymentAmount, journalId)
    get().refreshData()
  },

  updateReceivableSummary: () => {
    const { receivableService } = get()
    if (!receivableService) return

    const summary = receivableService.getReceivableSummary()
    set({ receivableSummary: summary })
  },

  getReceivablesByUnit: (unitNumber) => {
    const { receivableService } = get()
    if (!receivableService) return []

    return receivableService.getReceivablesByUnit(unitNumber)
  },

  // Create journal from matching
  createJournalFromMatching: async (matchingId) => {
    const { matchingResults } = get()
    const matching = matchingResults.get(matchingId)
    
    if (!matching || matching.suggestedJournals.length === 0) {
      return null
    }

    // TODO: Integrate with JournalService to create actual journal entries
    // For now, just return a dummy journal ID
    const journalId = `jnl_${Date.now()}`
    
    // Update transaction status
    const { bankImportService, bankTransactions } = get()
    if (bankImportService) {
      const transaction = bankTransactions.find(t => t.id === matching.bankTransactionId)
      if (transaction) {
        bankImportService.updateTransactionStatus(
          transaction.id,
          'processed',
          journalId
        )
      }
    }

    return journalId
  },

  // UI State
  setProcessing: (isProcessing) => {
    set({ isProcessing })
  },

  // Data management
  refreshData: () => {
    const { receivableService, bankImportService } = get()
    
    if (receivableService) {
      const receivables = receivableService.getAllReceivables()
      const summary = receivableService.getReceivableSummary()
      set({ receivables, receivableSummary: summary })
    }

    if (bankImportService) {
      const transactions = bankImportService.getImportedTransactions()
      set({ bankTransactions: transactions })
    }
  },

  clearAllData: () => {
    const { receivableService, bankImportService } = get()
    
    if (receivableService) {
      receivableService.clearAll()
    }
    
    if (bankImportService) {
      bankImportService.clearAll()
    }

    set({
      bankTransactions: [],
      matchingResults: new Map(),
      receivables: [],
      currentBatchId: null,
      importResult: null,
      receivableSummary: null
    })
  }
})