/**
 * @file AccountService.ts
 * @description 勘定科目管理サービス
 * 
 * 責務:
 * - 勘定科目マスタの管理（作成、更新、削除）
 * - 勘定科目の階層構造の構築と管理
 * - 補助元帳の管理
 * - 残高計算と集計
 * - 勘定科目間の親子関係の管理
 * 
 * ビジネスルール:
 * - 勘定科目コードは4桁の数字
 * - 階層は最大3レベル（大科目、中科目、小科目）
 * - 借方・貸方の正常残高設定
 * - 補助科目は必ず親科目を持つ
 * 
 * アーキテクチャ上の位置: Domain層のコアサービス
 */

// ========================================
// 既存実装 - 段階的に新実装に置き換え中
// 新実装: AccountMasterService.ts を参照
// ========================================

import { 
  AccountDefinition,
  AccountType,
  NormalBalance
} from '../../../types'
import { ACCOUNTING_CONSTANTS } from '../../../constants'
import { defaultAccountsData } from '../../../data/defaultAccounts'
import { IAccountService } from '../../interfaces/IAccountService'

type AccountDef = {
  code: string
  name: string
  type: AccountType
  normalBalance: NormalBalance
  availableDivisions?: string[]  // 変更: division -> availableDivisions
  parentCode?: string
  description?: string
  isActive?: boolean
  level?: number
  isPostable?: boolean
}

export class HierarchicalAccount {
  balance = 0
  hasAuxiliary = false
  auxiliaryLedgers = new Map<string, AuxiliaryLedger>()
  parent: HierarchicalAccount | null = null
  children: HierarchicalAccount[] = []
  parentCode?: string
  isPostable = true
  level: number | undefined
  
  constructor(
    public code: string, 
    public name: string, 
    public type: AccountType, 
    public normalBalance: NormalBalance, 
    public availableDivisions: string[] = ['KANRI', 'SHUZEN', 'PARKING', 'OTHER'], 
    public description?: string,
    public isActive = true
  ) {}
  
  createAuxiliaryLedger(auxiliaryCode: string, name: string, attributes: Record<string, any> = {}) {
    const aux = new AuxiliaryLedger(this.code, auxiliaryCode, name, attributes)
    this.auxiliaryLedgers.set(auxiliaryCode, aux)
    this.hasAuxiliary = true
    return aux
  }
  
  getAuxiliaryLedger(auxiliaryCode: string) { return this.auxiliaryLedgers.get(auxiliaryCode) }
  getAllAuxiliaryLedgers() { return Array.from(this.auxiliaryLedgers.values()) }
  getAuxiliaryTotalBalance() { let t = 0; this.auxiliaryLedgers.forEach(a => t += a.balance); return t }
  
  addToBalance(amount: number, isDebit: boolean) {
    const change = isDebit ? amount : -amount
    this.balance += (this.normalBalance === 'DEBIT') ? change : -change
  }
  
  getDisplayBalance() { return Math.abs(this.balance) }
  
  isDebitBalance() {
    if (this.normalBalance === 'DEBIT') return this.balance >= 0
    return this.balance < 0
  }
  
  addChild(child: HierarchicalAccount) { this.children.push(child); child.parent = this }
}

interface AuxiliaryTransaction {
  date: Date
  amount: number
  isDebit: boolean
  journalId: string
  description: string
  balance: number
  balanceAfter: number
}

export class AuxiliaryLedger {
  balance = 0
  transactions: AuxiliaryTransaction[] = []
  isActive = true
  createdAt = new Date()
  
  constructor(
    public masterAccountCode: string,
    public auxiliaryCode: string,
    public name: string,
    public attributes: Record<string, any> = {}
  ) {}
  
  addTransaction(amount: number, isDebit: boolean, journalId: string, description: string) {
    const transaction: AuxiliaryTransaction = {
      date: new Date(), 
      amount, 
      isDebit, 
      journalId, 
      description, 
      balance: this.balance,
      balanceAfter: 0 // 一時的な値
    }
    this.balance += isDebit ? amount : -amount
    transaction.balanceAfter = this.balance
    this.transactions.push(transaction)
  }
  
  getDisplayBalance() { return Math.abs(this.balance) }
  isDebitBalance() { return this.balance >= 0 }
}

// 旧実装 - AccountServiceAdapterで新実装との互換性を保持
// インタフェースを実装して依存性を抽象化
export class AccountService implements IAccountService {
  private accountsMap = new Map<string, HierarchicalAccount>()
  
  // インタフェースの要求に応じて配列としてアクセス可能にする
  get accounts(): HierarchicalAccount[] {
    return Array.from(this.accountsMap.values())
  }
  
  private mapCategoryToAccountType(category: string): AccountType {
    switch (category) {
      case 'ASSET': return 'ASSET'
      case 'LIABILITY': return 'LIABILITY'
      case 'EQUITY': return 'EQUITY'
      case 'REVENUE': return 'REVENUE'
      case 'EXPENSE': return 'EXPENSE'
      default: return 'ASSET'
    }
  }
  
  private getDivisionsFromLegacyDivisionCode(divisionCode?: string): string[] {
    // 旧divisionCodeから使用可能な区分の配列に変換
    switch (divisionCode) {
      case 'KANRI':
        return ['KANRI']
      case 'SHUZEN':
        return ['SHUZEN']
      case 'PARKING':
        return ['PARKING']
      case 'OTHER':
        return ['OTHER']
      case 'COMMON':
      default:
        // COMMONまたは未指定の場合は全区分で使用可能
        return ['KANRI', 'SHUZEN', 'PARKING', 'OTHER']
    }
  }
  
  initializeAccounts() {
    // defaultAccountsDataをAccountDef形式に変換
    const accountDefs: AccountDef[] = defaultAccountsData.map(account => ({
      code: account.code,
      name: account.name,
      type: this.mapCategoryToAccountType(account.category),
      normalBalance: account.accountType === 'DEBIT' ? 'DEBIT' as NormalBalance : 'CREDIT' as NormalBalance,
      // divisionCodeからavailableDivisionsに変換
      availableDivisions: this.getDivisionsFromLegacyDivisionCode(account.divisionCode),
      parentCode: account.parentCode,
      description: account.description,
      isActive: true,
      level: account.level,
      isPostable: account.isPostable
    }))
    
    this.rebuildAccountsFrom(accountDefs)
  }
  
  rebuildAccountsFrom(defs: AccountDef[]) {
    this.accountsMap.clear()
    const parentMap = new Map<string, HierarchicalAccount[]>()
    
    for (const def of defs) {
      const acc = new HierarchicalAccount(def.code, def.name, def.type, def.normalBalance, def.availableDivisions || ['KANRI', 'SHUZEN', 'PARKING', 'OTHER'], def.description, def.isActive !== false)
      acc.parentCode = def.parentCode
      if (def.level !== undefined) acc.level = def.level
      if (def.isPostable !== undefined) acc.isPostable = def.isPostable
      this.accountsMap.set(def.code, acc)
      if (def.parentCode) {
        if (!parentMap.has(def.parentCode)) parentMap.set(def.parentCode, [])
        parentMap.get(def.parentCode)!.push(acc)
      }
    }
    
    for (const acc of this.accountsMap.values()) {
      if (acc.parentCode) {
        const parent = this.accountsMap.get(acc.parentCode)
        if (parent) parent.addChild(acc)
      }
    }
  }
  
  addOrUpdateAccount(def: AccountDef) {
    const exists = this.accountsMap.get(def.code)
    const acc = exists || new HierarchicalAccount(def.code, def.name, def.type, def.normalBalance, def.availableDivisions || ['KANRI', 'SHUZEN', 'PARKING', 'OTHER'], def.description, def.isActive !== false)
    
    if (exists) {
      acc.name = def.name
      acc.type = def.type
      acc.normalBalance = def.normalBalance
      acc.availableDivisions = def.availableDivisions || ['KANRI', 'SHUZEN', 'PARKING', 'OTHER']
      acc.description = def.description
      if (def.isActive !== undefined) acc.isActive = def.isActive
      if (def.level !== undefined) acc.level = def.level
      if (def.isPostable !== undefined) acc.isPostable = def.isPostable
    } else {
      this.accountsMap.set(def.code, acc)
      if (def.level !== undefined) acc.level = def.level
      if (def.isPostable !== undefined) acc.isPostable = def.isPostable
    }
    
    if (def.parentCode) {
      const parent = this.accountsMap.get(def.parentCode)
      if (parent && !exists) parent.addChild(acc)
    }
    
    return acc
  }
  
  setAccountActive(code: string, active: boolean) {
    const acc = this.accountsMap.get(code)
    if (acc) acc.isActive = active
  }
  
  getAccounts() { 
    return Array.from(this.accountsMap.values()).sort((a, b) => a.code.localeCompare(b.code)) 
  }
  
  getAccount(code: string) {
    return this.accountsMap.get(code)
  }
  
  clearAccounts() {
    this.accountsMap.clear()
  }
  
  rebuildAuxiliaryAccounts() {
    const a1121 = this.accountsMap.get('1121')
    const a1122 = this.accountsMap.get('1122')
    if (a1121) { a1121.auxiliaryLedgers.clear(); a1121.hasAuxiliary = false }
    if (a1122) { a1122.auxiliaryLedgers.clear(); a1122.hasAuxiliary = false }
  }
}
