import { useCallback } from 'react'
import useStore from '../index'
import { BankAccount } from '../../../06-data/static/bankAccounts'

/**
 * 口座管理用のカスタムフック
 * BankAccountPanelなどのコンポーネントで使用
 */
export const useBankAccounts = () => {
  const {
    bankAccounts,
    syncResult,
    addBankAccount,
    updateBankAccount,
    disableBankAccount,
    enableBankAccount,
    deleteBankAccount,
    refreshBankAccounts
  } = useStore()
  
  // アクティブな口座のみを取得
  const activeAccounts = bankAccounts.filter(acc => acc.isActive)
  
  // 口座コードから口座を取得
  const getAccountByCode = useCallback((code: string) => {
    return bankAccounts.find(acc => acc.code === code)
  }, [bankAccounts])
  
  // 口座IDから口座を取得
  const getAccountById = useCallback((id: string) => {
    return bankAccounts.find(acc => acc.id === id)
  }, [bankAccounts])
  
  // 振替可能な口座の組み合わせを取得
  const getTransferableCombinations = useCallback(() => {
    const combinations: Array<{from: BankAccount, to: BankAccount[]}> = []
    
    activeAccounts.forEach(fromAccount => {
      const toAccounts = activeAccounts.filter(toAccount => {
        // 同じ口座への振替は不可
        if (fromAccount.id === toAccount.id) return false
        
        // 振替可能なパターン
        if (fromAccount.division === 'BOTH' || toAccount.division === 'BOTH') return true
        if (fromAccount.division === 'KANRI' && toAccount.division === 'SHUZEN') return true
        if (fromAccount.division === 'SHUZEN' && toAccount.division === 'KANRI') return true
        if (fromAccount.division === toAccount.division) return true
        
        return false
      })
      
      if (toAccounts.length > 0) {
        combinations.push({ from: fromAccount, to: toAccounts })
      }
    })
    
    return combinations
  }, [activeAccounts])
  
  // 決済可能な口座を取得
  const getPaymentAccounts = useCallback((division?: 'KANRI' | 'SHUZEN' | 'BOTH') => {
    if (!division) return activeAccounts
    
    return activeAccounts.filter(acc => {
      if (acc.division === 'BOTH') return true
      return acc.division === division
    })
  }, [activeAccounts])
  
  return {
    // 状態
    bankAccounts,
    activeAccounts,
    syncResult,
    
    // アクション
    addBankAccount,
    updateBankAccount,
    disableBankAccount,
    enableBankAccount,
    deleteBankAccount,
    refreshBankAccounts,
    
    // ユーティリティ
    getAccountByCode,
    getAccountById,
    getTransferableCombinations,
    getPaymentAccounts
  }
}