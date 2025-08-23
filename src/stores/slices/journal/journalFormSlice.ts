import { StateCreator } from 'zustand'
import { AccountItem } from '../../../ui/transactions/accountCategories'

// 型定義
export type TransactionType = 'income' | 'expense' | 'transfer'
export type Division = 'KANRI' | 'SHUZEN' | 'PARKING' | 'OTHER'
export type PaymentAccountType = 'cash' | 'kanri_bank' | 'shuzen_bank'
export type PaymentStatus = 'completed' | 'pending'

export interface ValidationMessage {
  type: 'success' | 'error' | 'info'
  message: string
}

export interface JournalFormState {
  // 基本情報
  transactionType: TransactionType
  division: Division
  date: string
  amount: string
  description: string
  
  // 勘定科目
  selectedAccount: AccountItem | null
  accountSearchQuery: string
  
  // 振替
  transferFromAccount: string
  transferToAccount: string
  
  // 支払情報
  paymentAccount: PaymentAccountType
  paymentStatus: PaymentStatus
  
  // その他
  serviceMonth: string
  payerId: string
  tags: string[]
  tagInput: string
  
  // UI状態
  showSuggestions: boolean
  showAccountModal: boolean
  errors: Record<string, string>
  validationMessage: ValidationMessage | null
}

export interface JournalFormActions {
  // 基本アクション
  setTransactionType: (type: TransactionType) => void
  setDivision: (division: Division) => void
  setDate: (date: string) => void
  setAmount: (amount: string) => void
  setDescription: (description: string) => void
  
  // 勘定科目アクション
  setSelectedAccount: (account: AccountItem | null) => void
  setAccountSearchQuery: (query: string) => void
  
  // 振替アクション
  setTransferFromAccount: (account: string) => void
  setTransferToAccount: (account: string) => void
  
  // 支払アクション
  setPaymentAccount: (account: PaymentAccountType) => void
  setPaymentStatus: (status: PaymentStatus) => void
  
  // その他アクション
  setServiceMonth: (month: string) => void
  setPayerId: (id: string) => void
  addTag: (tag: string) => void
  removeTag: (tag: string) => void
  setTagInput: (input: string) => void
  
  // UI状態アクション
  setShowSuggestions: (show: boolean) => void
  setShowAccountModal: (show: boolean) => void
  setErrors: (errors: Record<string, string>) => void
  setValidationMessage: (message: ValidationMessage | null) => void
  
  // 複合アクション
  resetForm: () => void
  resetForDivisionChange: (newDivision: Division) => void
  validateForm: () => boolean
}

export type JournalFormSlice = JournalFormState & JournalFormActions

// 初期状態
const initialState: JournalFormState = {
  transactionType: 'expense',
  division: 'KANRI',
  date: new Date().toISOString().split('T')[0],
  amount: '',
  description: '',
  selectedAccount: null,
  accountSearchQuery: '',
  transferFromAccount: '',
  transferToAccount: '',
  paymentAccount: 'kanri_bank',
  paymentStatus: 'completed',
  serviceMonth: new Date().toISOString().slice(0, 7),
  payerId: '',
  tags: [],
  tagInput: '',
  showSuggestions: false,
  showAccountModal: false,
  errors: {},
  validationMessage: null,
}

// Sliceの作成
export const createJournalFormSlice: StateCreator<
  JournalFormSlice,
  [],
  [],
  JournalFormSlice
> = (set, get) => ({
  ...initialState,
  
  // 基本アクション
  setTransactionType: (type) => set({ transactionType: type }),
  setDivision: (division) => set({ division }),
  setDate: (date) => set({ date }),
  setAmount: (amount) => set({ amount }),
  setDescription: (description) => set({ description }),
  
  // 勘定科目アクション
  setSelectedAccount: (account) => set({ selectedAccount: account }),
  setAccountSearchQuery: (query) => set({ accountSearchQuery: query }),
  
  // 振替アクション
  setTransferFromAccount: (account) => set({ transferFromAccount: account }),
  setTransferToAccount: (account) => set({ transferToAccount: account }),
  
  // 支払アクション
  setPaymentAccount: (account) => set({ paymentAccount: account }),
  setPaymentStatus: (status) => set({ paymentStatus: status }),
  
  // その他アクション
  setServiceMonth: (month) => set({ serviceMonth: month }),
  setPayerId: (id) => set({ payerId: id }),
  
  addTag: (tag) => set((state) => {
    if (tag && !state.tags.includes(tag) && state.tags.length < 5) {
      return { tags: [...state.tags, tag], tagInput: '' }
    }
    return {}
  }),
  
  removeTag: (tag) => set((state) => ({
    tags: state.tags.filter(t => t !== tag)
  })),
  
  setTagInput: (input) => set({ tagInput: input }),
  
  // UI状態アクション
  setShowSuggestions: (show) => set({ showSuggestions: show }),
  setShowAccountModal: (show) => set({ showAccountModal: show }),
  setErrors: (errors) => set({ errors }),
  setValidationMessage: (message) => set({ validationMessage: message }),
  
  // 複合アクション
  resetForm: () => set({
    ...initialState,
    date: new Date().toISOString().split('T')[0],
    serviceMonth: new Date().toISOString().slice(0, 7),
  }),
  
  resetForDivisionChange: (newDivision) => {
    const defaultAccount = newDivision === 'SHUZEN' ? 'shuzen_bank' : 'kanri_bank'
    
    set({
      division: newDivision,
      amount: '',
      description: '',
      selectedAccount: null,
      accountSearchQuery: '',
      payerId: '',
      tags: [],
      tagInput: '',
      paymentAccount: defaultAccount,
      errors: {},
      validationMessage: {
        type: 'info',
        message: `${getDivisionName(newDivision)}に切り替えました。入力がリセットされました。`
      }
    })
    
    // 2秒後にメッセージをクリア
    setTimeout(() => {
      set({ validationMessage: null })
    }, 2000)
  },
  
  validateForm: () => {
    const state = get()
    const newErrors: Record<string, string> = {}
    
    if (!state.date) {
      newErrors.date = '日付を入力してください'
    }
    
    if (state.transactionType === 'transfer') {
      if (!state.transferFromAccount) {
        newErrors.transferFrom = '振替元口座を選択してください'
      }
      if (!state.transferToAccount) {
        newErrors.transferTo = '振替先口座を選択してください'
      }
      if (state.transferFromAccount === state.transferToAccount) {
        newErrors.transfer = '振替元と振替先は異なる口座を選択してください'
      }
    } else {
      if (!state.selectedAccount) {
        newErrors.account = '勘定科目を選択してください'
      }
    }
    
    if (!state.amount || isNaN(parseFloat(state.amount)) || parseFloat(state.amount) <= 0) {
      newErrors.amount = '正しい金額を入力してください'
    }
    
    if (!state.description || state.description.trim().length === 0) {
      newErrors.description = '摘要を入力してください'
    }
    
    set({ errors: newErrors })
    
    if (Object.keys(newErrors).length > 0) {
      set({
        validationMessage: {
          type: 'error',
          message: '入力内容にエラーがあります。確認してください。'
        }
      })
      return false
    }
    
    return true
  }
})

// ヘルパー関数
function getDivisionName(division: Division): string {
  switch (division) {
    case 'KANRI':
      return '管理会計'
    case 'SHUZEN':
      return '修繕会計'
    case 'PARKING':
      return '駐車場会計'
    case 'OTHER':
      return 'その他特別会計'
    default:
      return '会計'
  }
}