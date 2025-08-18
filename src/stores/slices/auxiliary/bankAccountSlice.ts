import { StateCreator } from 'zustand'
import { BankAccount, defaultBankAccounts } from '../../data/bankAccounts'
import { BankAccountService, AccountSyncResult } from '../../domain/services/BankAccountService'
import { BankAccountState, BankAccountActions, StoreState } from '../types'

export interface BankAccountSlice extends BankAccountState, BankAccountActions {}

export const createBankAccountSlice: StateCreator<
  StoreState,
  [],
  [],
  BankAccountSlice
> = (set, get) => ({
  // 初期状態
  bankAccounts: [],
  bankAccountService: null,
  syncResult: null,
  
  // アクション
  initializeBankAccounts: () => {
    const service = new BankAccountService(defaultBankAccounts)
    
    // 変更リスナーを設定
    service.addChangeListener((event) => {
      console.log(`Bank account ${event.type}:`, event.account.code)
      
      // 状態を更新
      set({
        bankAccounts: service.getAccounts(true),
        lastUpdate: new Date()
      })
    })
    
    set({
      bankAccountService: service,
      bankAccounts: service.getAccounts(true)
    })
    
    console.log('BankAccountService initialized with', service.getAccounts().length, 'accounts')
  },
  
  addBankAccount: (account: BankAccount) => {
    const service = get().bankAccountService
    
    if (!service) {
      const error = 'BankAccountService not initialized'
      set({ error })
      return { success: false, errors: [error] }
    }
    
    const result = service.addAccount(account)
    
    if (result.success) {
      set({
        bankAccounts: service.getAccounts(true),
        syncResult: result,
        lastUpdate: new Date()
      })
      
      // 成功メッセージを表示
      get().showToast('success', `口座「${account.name}」を追加しました`)
    } else {
      set({ 
        syncResult: result,
        error: result.errors?.join('\n') || '口座の追加に失敗しました'
      })
      get().showToast('error', result.errors?.join('\n') || '口座の追加に失敗しました')
    }
    
    return result
  },
  
  updateBankAccount: (code: string, updates: Partial<BankAccount>) => {
    const service = get().bankAccountService
    if (!service) {
      const error = 'BankAccountService not initialized'
      set({ error })
      return { success: false, errors: [error] }
    }
    
    const result = service.updateAccount(code, updates)
    
    if (result.success) {
      set({
        bankAccounts: service.getAccounts(true),
        syncResult: result,
        lastUpdate: new Date()
      })
      
      get().showToast('success', '口座情報を更新しました')
    } else {
      set({ 
        syncResult: result,
        error: result.errors?.join('\n') || '口座の更新に失敗しました'
      })
      get().showToast('error', result.errors?.join('\n') || '口座の更新に失敗しました')
    }
    
    return result
  },
  
  disableBankAccount: (code: string) => {
    const service = get().bankAccountService
    if (!service) {
      const error = 'BankAccountService not initialized'
      set({ error })
      return { success: false, errors: [error] }
    }
    
    const account = service.getAccount(code)
    const result = service.disableAccount(code)
    
    if (result.success) {
      set({
        bankAccounts: service.getAccounts(true),
        syncResult: result,
        lastUpdate: new Date()
      })
      
      let message = `口座「${account?.name}」を無効化しました`
      if (result.affectedTransactions && result.affectedTransactions.length > 0) {
        message += `\n${result.affectedTransactions.length}件の取引が影響を受けます`
      }
      
      const toastType = result.errors && result.errors.length > 0 ? 'warning' : 'success'
      get().showToast(toastType, message)
    } else {
      set({ 
        syncResult: result,
        error: result.errors?.join('\n') || '口座の無効化に失敗しました'
      })
      get().showToast('error', result.errors?.join('\n') || '口座の無効化に失敗しました')
    }
    
    return result
  },
  
  enableBankAccount: (code: string) => {
    const service = get().bankAccountService
    if (!service) {
      const error = 'BankAccountService not initialized'
      set({ error })
      return { success: false, errors: [error] }
    }
    
    const account = service.getAccount(code)
    const result = service.enableAccount(code)
    
    if (result.success) {
      set({
        bankAccounts: service.getAccounts(true),
        syncResult: result,
        lastUpdate: new Date()
      })
      
      get().showToast('success', `口座「${account?.name}」を有効化しました`)
    } else {
      set({ 
        syncResult: result,
        error: result.errors?.join('\n') || '口座の有効化に失敗しました'
      })
      get().showToast('error', result.errors?.join('\n') || '口座の有効化に失敗しました')
    }
    
    return result
  },
  
  deleteBankAccount: (code: string, force = false) => {
    const service = get().bankAccountService
    if (!service) {
      const error = 'BankAccountService not initialized'
      set({ error })
      return { success: false, errors: [error] }
    }
    
    const account = service.getAccount(code)
    const result = service.deleteAccount(code, force)
    
    if (result.success) {
      set({
        bankAccounts: service.getAccounts(true),
        syncResult: result,
        lastUpdate: new Date()
      })
      
      get().showToast('success', `口座「${account?.name}」を削除しました`)
    } else {
      set({ 
        syncResult: result,
        error: result.errors?.join('\n') || '口座の削除に失敗しました'
      })
      
      // 強制削除が必要な場合は警告として表示
      if (result.affectedTransactions && result.affectedTransactions.length > 0) {
        get().showToast('warning', result.errors?.join('\n') || '関連する取引があります')
      } else {
        get().showToast('error', result.errors?.join('\n') || '口座の削除に失敗しました')
      }
    }
    
    return result
  },
  
  refreshBankAccounts: () => {
    const service = get().bankAccountService
    if (!service) {
      console.error('BankAccountService not initialized')
      return
    }
    
    set({
      bankAccounts: service.getAccounts(true),
      lastUpdate: new Date()
    })
  }
})