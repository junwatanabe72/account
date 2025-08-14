import { BankAccount } from '../../data/bankAccounts'
import { Transaction } from '../../types/transaction'

export interface BankAccountChangeEvent {
  type: 'add' | 'update' | 'disable' | 'enable' | 'delete'
  account: BankAccount
  timestamp: Date
}

export interface AccountSyncResult {
  success: boolean
  affectedTransactions?: string[]
  affectedAccounts?: string[]
  errors?: string[]
}

export class BankAccountService {
  private accounts: Map<string, BankAccount> = new Map()
  private changeListeners: ((event: BankAccountChangeEvent) => void)[] = []
  private transactionReferences: Map<string, Set<string>> = new Map() // accountCode -> transactionIds
  
  constructor(initialAccounts: BankAccount[] = []) {
    initialAccounts.forEach(acc => this.accounts.set(acc.code, acc))
  }
  
  // 口座の追加
  addAccount(account: BankAccount): AccountSyncResult {
    const result: AccountSyncResult = { success: true, affectedAccounts: [] }
    
    // 既存確認
    if (this.accounts.has(account.code)) {
      return {
        success: false,
        errors: [`口座コード ${account.code} は既に存在します`]
      }
    }
    
    // 口座を追加
    this.accounts.set(account.code, account)
    result.affectedAccounts = [account.code]
    
    // イベント発火
    this.notifyChange({
      type: 'add',
      account,
      timestamp: new Date()
    })
    
    // 関連する決済口座・振替口座の更新
    this.syncRelatedAccounts(account, 'add', result)
    
    return result
  }
  
  // 口座の更新
  updateAccount(code: string, updates: Partial<BankAccount>): AccountSyncResult {
    const result: AccountSyncResult = { success: true, affectedAccounts: [], affectedTransactions: [] }
    
    const account = this.accounts.get(code)
    if (!account) {
      return {
        success: false,
        errors: [`口座コード ${code} が見つかりません`]
      }
    }
    
    // 更新前の状態を保存
    const oldAccount = { ...account }
    
    // 更新を適用
    const updatedAccount = { ...account, ...updates }
    this.accounts.set(code, updatedAccount)
    result.affectedAccounts = [code]
    
    // コード変更の場合
    if (updates.code && updates.code !== code) {
      this.accounts.delete(code)
      this.accounts.set(updates.code, updatedAccount)
      
      // 参照している取引を更新
      const transactionIds = this.transactionReferences.get(code)
      if (transactionIds) {
        result.affectedTransactions = Array.from(transactionIds)
        this.transactionReferences.delete(code)
        this.transactionReferences.set(updates.code, transactionIds)
      }
    }
    
    // イベント発火
    this.notifyChange({
      type: 'update',
      account: updatedAccount,
      timestamp: new Date()
    })
    
    // 関連する決済口座・振替口座の更新
    this.syncRelatedAccounts(updatedAccount, 'update', result)
    
    return result
  }
  
  // 口座の無効化
  disableAccount(code: string): AccountSyncResult {
    const result: AccountSyncResult = { success: true, affectedAccounts: [], affectedTransactions: [] }
    
    const account = this.accounts.get(code)
    if (!account) {
      return {
        success: false,
        errors: [`口座コード ${code} が見つかりません`]
      }
    }
    
    // 無効化
    account.isActive = false
    result.affectedAccounts = [code]
    
    // この口座を参照している取引を取得
    const transactionIds = this.transactionReferences.get(code)
    if (transactionIds && transactionIds.size > 0) {
      result.affectedTransactions = Array.from(transactionIds)
    }
    
    // イベント発火
    this.notifyChange({
      type: 'disable',
      account,
      timestamp: new Date()
    })
    
    // 関連する決済口座・振替口座の更新
    this.syncRelatedAccounts(account, 'disable', result)
    
    return result
  }
  
  // 口座の有効化
  enableAccount(code: string): AccountSyncResult {
    const result: AccountSyncResult = { success: true, affectedAccounts: [] }
    
    const account = this.accounts.get(code)
    if (!account) {
      return {
        success: false,
        errors: [`口座コード ${code} が見つかりません`]
      }
    }
    
    // 有効化
    account.isActive = true
    result.affectedAccounts = [code]
    
    // イベント発火
    this.notifyChange({
      type: 'enable',
      account,
      timestamp: new Date()
    })
    
    // 関連する決済口座・振替口座の更新
    this.syncRelatedAccounts(account, 'enable', result)
    
    return result
  }
  
  // 口座の削除
  deleteAccount(code: string, force = false): AccountSyncResult {
    const result: AccountSyncResult = { success: true, affectedAccounts: [], affectedTransactions: [] }
    
    const account = this.accounts.get(code)
    if (!account) {
      return {
        success: false,
        errors: [`口座コード ${code} が見つかりません`]
      }
    }
    
    // 参照チェック
    const transactionIds = this.transactionReferences.get(code)
    if (!force && transactionIds && transactionIds.size > 0) {
      return {
        success: false,
        errors: [`口座 ${code} は ${transactionIds.size} 件の取引で使用されています。強制削除する場合は force オプションを使用してください。`],
        affectedTransactions: Array.from(transactionIds)
      }
    }
    
    // 削除実行
    this.accounts.delete(code)
    this.transactionReferences.delete(code)
    result.affectedAccounts = [code]
    
    if (transactionIds) {
      result.affectedTransactions = Array.from(transactionIds)
    }
    
    // イベント発火
    this.notifyChange({
      type: 'delete',
      account,
      timestamp: new Date()
    })
    
    // 関連する決済口座・振替口座の更新
    this.syncRelatedAccounts(account, 'delete', result)
    
    return result
  }
  
  // 関連口座の同期処理
  private syncRelatedAccounts(
    account: BankAccount, 
    action: BankAccountChangeEvent['type'],
    result: AccountSyncResult
  ): void {
    // 決済口座として使用されている取引を検索
    const paymentAccountTransactions = this.findTransactionsUsingPaymentAccount(account.code)
    
    // 振替元/先口座として使用されている取引を検索
    const transferAccountTransactions = this.findTransactionsUsingTransferAccount(account.code)
    
    // 影響を受ける取引IDを追加
    const affectedTransIds = new Set([
      ...paymentAccountTransactions,
      ...transferAccountTransactions
    ])
    
    if (affectedTransIds.size > 0) {
      if (!result.affectedTransactions) {
        result.affectedTransactions = []
      }
      result.affectedTransactions.push(...Array.from(affectedTransIds))
    }
    
    // 無効化/削除時の警告
    if ((action === 'disable' || action === 'delete') && affectedTransIds.size > 0) {
      if (!result.errors) result.errors = []
      result.errors.push(
        `口座 ${account.code} (${account.name}) の${action === 'disable' ? '無効化' : '削除'}により、${affectedTransIds.size} 件の取引が影響を受けます。`
      )
    }
  }
  
  // 決済口座として使用されている取引を検索
  private findTransactionsUsingPaymentAccount(accountCode: string): string[] {
    // 実際の実装では、TransactionServiceと連携して取引を検索
    return this.transactionReferences.get(accountCode) 
      ? Array.from(this.transactionReferences.get(accountCode)!)
      : []
  }
  
  // 振替口座として使用されている取引を検索
  private findTransactionsUsingTransferAccount(accountCode: string): string[] {
    // 実際の実装では、TransactionServiceと連携して振替取引を検索
    const transferKey = `transfer_${accountCode}`
    return this.transactionReferences.get(transferKey)
      ? Array.from(this.transactionReferences.get(transferKey)!)
      : []
  }
  
  // 取引参照の登録
  registerTransactionReference(transactionId: string, accountCode: string, isTransfer = false): void {
    const key = isTransfer ? `transfer_${accountCode}` : accountCode
    
    if (!this.transactionReferences.has(key)) {
      this.transactionReferences.set(key, new Set())
    }
    this.transactionReferences.get(key)!.add(transactionId)
  }
  
  // 取引参照の削除
  unregisterTransactionReference(transactionId: string, accountCode: string, isTransfer = false): void {
    const key = isTransfer ? `transfer_${accountCode}` : accountCode
    const refs = this.transactionReferences.get(key)
    
    if (refs) {
      refs.delete(transactionId)
      if (refs.size === 0) {
        this.transactionReferences.delete(key)
      }
    }
  }
  
  // 変更リスナーの登録
  addChangeListener(listener: (event: BankAccountChangeEvent) => void): void {
    this.changeListeners.push(listener)
  }
  
  // 変更リスナーの削除
  removeChangeListener(listener: (event: BankAccountChangeEvent) => void): void {
    const index = this.changeListeners.indexOf(listener)
    if (index > -1) {
      this.changeListeners.splice(index, 1)
    }
  }
  
  // 変更通知
  private notifyChange(event: BankAccountChangeEvent): void {
    this.changeListeners.forEach(listener => listener(event))
  }
  
  // 口座一覧取得
  getAccounts(includeInactive = false): BankAccount[] {
    const accounts = Array.from(this.accounts.values())
    return includeInactive ? accounts : accounts.filter(acc => acc.isActive)
  }
  
  // 口座取得
  getAccount(code: string): BankAccount | undefined {
    return this.accounts.get(code)
  }
  
  // 振替可能な組み合わせを取得
  getTransferableCombinations(): Array<{from: BankAccount, to: BankAccount[]}> {
    const activeAccounts = this.getAccounts(false)
    const combinations: Array<{from: BankAccount, to: BankAccount[]}> = []
    
    activeAccounts.forEach(fromAccount => {
      const toAccounts = activeAccounts.filter(toAccount => {
        // 同じ口座への振替は不可
        if (fromAccount.id === toAccount.id) return false
        
        // 振替可能なパターン
        // 1. 管理口座 → 修繕口座
        // 2. 修繕口座 → 管理口座
        // 3. 同じ区分内での振替（管理→管理、修繕→修繕）
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
  }
  
  // 決済可能な口座を取得
  getPaymentAccounts(division?: 'KANRI' | 'SHUZEN' | 'BOTH'): BankAccount[] {
    const accounts = this.getAccounts(false)
    
    if (!division) return accounts
    
    return accounts.filter(acc => {
      // BOTH の口座は全ての区分で使用可能
      if (acc.division === 'BOTH') return true
      // 指定された区分と一致する口座
      return acc.division === division
    })
  }
}