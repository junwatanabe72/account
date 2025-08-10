import { 
  AccountDefinition,
  AccountType,
  NormalBalance
} from '../../types'
import { ACCOUNTING_CONSTANTS } from '../../constants'

type AccountDef = {
  code: string
  name: string
  type: AccountType
  normalBalance: NormalBalance
  division?: string
  parentCode?: string
  description?: string
  isActive?: boolean
}

export class HierarchicalAccount {
  balance = 0
  hasAuxiliary = false
  auxiliaryLedgers = new Map<string, AuxiliaryLedger>()
  parent: HierarchicalAccount | null = null
  children: HierarchicalAccount[] = []
  parentCode?: string
  isPostable = true
  
  constructor(
    public code: string, 
    public name: string, 
    public type: AccountType, 
    public normalBalance: NormalBalance, 
    public division?: string, 
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

export class AccountService {
  accounts = new Map<string, HierarchicalAccount>()
  
  initializeAccounts() {
    const accountDefs: AccountDef[] = [
      // 資産
      { code: '1000', name: '資産', type: 'ASSET', normalBalance: 'DEBIT' },
      { code: '1100', name: '流動資産', type: 'ASSET', normalBalance: 'DEBIT', parentCode: '1000' },
      { code: '1110', name: '現金・預金', type: 'ASSET', normalBalance: 'DEBIT', parentCode: '1100' },
      { code: '1111', name: '普通預金', type: 'ASSET', normalBalance: 'DEBIT', parentCode: '1110', division: 'SHARED' },
      { code: '1112', name: '定期預金', type: 'ASSET', normalBalance: 'DEBIT', parentCode: '1110', division: 'SHARED' },
      { code: '1120', name: '未収金', type: 'ASSET', normalBalance: 'DEBIT', parentCode: '1100' },
      { code: '1121', name: '管理費等未収金', type: 'ASSET', normalBalance: 'DEBIT', parentCode: '1120', division: 'KANRI' },
      { code: '1122', name: '修繕積立金未収金', type: 'ASSET', normalBalance: 'DEBIT', parentCode: '1120', division: 'SHUZEN' },
      { code: '1200', name: '固定資産', type: 'ASSET', normalBalance: 'DEBIT', parentCode: '1000' },
      { code: '1210', name: '有形固定資産', type: 'ASSET', normalBalance: 'DEBIT', parentCode: '1200' },
      { code: '1211', name: '建物', type: 'ASSET', normalBalance: 'DEBIT', parentCode: '1210', division: 'SHARED' },
      { code: '1212', name: '建物附属設備', type: 'ASSET', normalBalance: 'DEBIT', parentCode: '1210', division: 'SHARED' },
      { code: '1213', name: '機械設備', type: 'ASSET', normalBalance: 'DEBIT', parentCode: '1210', division: 'SHARED' },
      { code: '1214', name: '什器備品', type: 'ASSET', normalBalance: 'DEBIT', parentCode: '1210', division: 'SHARED' },
      { code: '1219', name: '減価償却累計額', type: 'ASSET', normalBalance: 'CREDIT', parentCode: '1210', division: 'SHARED' },
      
      // 負債
      { code: '2000', name: '負債', type: 'LIABILITY', normalBalance: 'CREDIT' },
      { code: '2100', name: '流動負債', type: 'LIABILITY', normalBalance: 'CREDIT', parentCode: '2000' },
      { code: '2110', name: '未払金', type: 'LIABILITY', normalBalance: 'CREDIT', parentCode: '2100' },
      { code: '2111', name: '未払費用', type: 'LIABILITY', normalBalance: 'CREDIT', parentCode: '2110', division: 'SHARED' },
      { code: '2120', name: '前受金', type: 'LIABILITY', normalBalance: 'CREDIT', parentCode: '2100' },
      { code: '2121', name: '管理費等前受金', type: 'LIABILITY', normalBalance: 'CREDIT', parentCode: '2120', division: 'KANRI' },
      { code: '2122', name: '修繕積立金前受金', type: 'LIABILITY', normalBalance: 'CREDIT', parentCode: '2120', division: 'SHUZEN' },
      { code: '2130', name: '預り金', type: 'LIABILITY', normalBalance: 'CREDIT', parentCode: '2100' },
      { code: '2131', name: '駐車場保証金', type: 'LIABILITY', normalBalance: 'CREDIT', parentCode: '2130', division: 'PARKING' },
      { code: '2200', name: '固定負債', type: 'LIABILITY', normalBalance: 'CREDIT', parentCode: '2000' },
      { code: '2210', name: '借入金', type: 'LIABILITY', normalBalance: 'CREDIT', parentCode: '2200', division: 'SHUZEN' },
      
      // 純資産
      { code: '3000', name: '純資産', type: 'EQUITY', normalBalance: 'CREDIT' },
      { code: '3100', name: '剰余金', type: 'EQUITY', normalBalance: 'CREDIT', parentCode: '3000' },
      { code: '3110', name: '管理費剰余金', type: 'EQUITY', normalBalance: 'CREDIT', parentCode: '3100', division: 'KANRI' },
      { code: '3120', name: '修繕積立金', type: 'EQUITY', normalBalance: 'CREDIT', parentCode: '3100', division: 'SHUZEN' },
      { code: '3130', name: '駐車場剰余金', type: 'EQUITY', normalBalance: 'CREDIT', parentCode: '3100', division: 'PARKING' },
      { code: '3200', name: '繰越剰余金', type: 'EQUITY', normalBalance: 'CREDIT', parentCode: '3000' },
      { code: '3210', name: '管理費繰越剰余金', type: 'EQUITY', normalBalance: 'CREDIT', parentCode: '3200', division: 'KANRI' },
      { code: '3220', name: '修繕積立金繰越剰余金', type: 'EQUITY', normalBalance: 'CREDIT', parentCode: '3200', division: 'SHUZEN' },
      { code: '3230', name: '駐車場繰越剰余金', type: 'EQUITY', normalBalance: 'CREDIT', parentCode: '3200', division: 'PARKING' },
      
      // 収益
      { code: '4000', name: '収益', type: 'REVENUE', normalBalance: 'CREDIT' },
      { code: '4100', name: '管理費収入', type: 'REVENUE', normalBalance: 'CREDIT', parentCode: '4000' },
      { code: '4110', name: '管理費', type: 'REVENUE', normalBalance: 'CREDIT', parentCode: '4100', division: 'KANRI' },
      { code: '4200', name: '修繕積立金収入', type: 'REVENUE', normalBalance: 'CREDIT', parentCode: '4000' },
      { code: '4210', name: '修繕積立金', type: 'REVENUE', normalBalance: 'CREDIT', parentCode: '4200', division: 'SHUZEN' },
      { code: '4300', name: '駐車場収入', type: 'REVENUE', normalBalance: 'CREDIT', parentCode: '4000' },
      { code: '4310', name: '駐車場使用料', type: 'REVENUE', normalBalance: 'CREDIT', parentCode: '4300', division: 'PARKING' },
      { code: '4400', name: 'その他収入', type: 'REVENUE', normalBalance: 'CREDIT', parentCode: '4000' },
      { code: '4410', name: '雑収入', type: 'REVENUE', normalBalance: 'CREDIT', parentCode: '4400', division: 'SHARED' },
      { code: '4420', name: '受取利息', type: 'REVENUE', normalBalance: 'CREDIT', parentCode: '4400', division: 'SHARED' },
      
      // 費用
      { code: '5000', name: '費用', type: 'EXPENSE', normalBalance: 'DEBIT' },
      { code: '5100', name: '管理業務費', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '5000' },
      { code: '5110', name: '管理員業務費', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '5100', division: 'KANRI' },
      { code: '5120', name: '清掃業務費', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '5100', division: 'KANRI' },
      { code: '5130', name: '設備管理費', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '5100', division: 'KANRI' },
      { code: '5200', name: '水道光熱費', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '5000' },
      { code: '5210', name: '電気料', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '5200', division: 'KANRI' },
      { code: '5220', name: '水道料', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '5200', division: 'KANRI' },
      { code: '5230', name: 'ガス料', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '5200', division: 'KANRI' },
      { code: '5300', name: '修繕費', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '5000' },
      { code: '5310', name: '経常修繕費', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '5300', division: 'KANRI' },
      { code: '5320', name: '計画修繕費', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '5300', division: 'SHUZEN' },
      { code: '5400', name: '損害保険料', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '5000' },
      { code: '5410', name: '火災保険料', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '5400', division: 'KANRI' },
      { code: '5420', name: '施設賠償保険料', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '5400', division: 'KANRI' },
      { code: '5500', name: '支払手数料', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '5000' },
      { code: '5510', name: '振込手数料', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '5500', division: 'SHARED' },
      { code: '5600', name: 'その他費用', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '5000' },
      { code: '5610', name: '通信費', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '5600', division: 'KANRI' },
      { code: '5620', name: '消耗品費', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '5600', division: 'KANRI' },
      { code: '5630', name: '雑費', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '5600', division: 'SHARED' },
      { code: '5700', name: '予備費', type: 'EXPENSE', normalBalance: 'DEBIT', parentCode: '5000', division: 'KANRI' }
    ]
    
    this.rebuildAccountsFrom(accountDefs)
  }
  
  rebuildAccountsFrom(defs: AccountDef[]) {
    this.accounts.clear()
    const parentMap = new Map<string, HierarchicalAccount[]>()
    
    for (const def of defs) {
      const acc = new HierarchicalAccount(def.code, def.name, def.type, def.normalBalance, def.division, def.description, def.isActive !== false)
      acc.parentCode = def.parentCode
      this.accounts.set(def.code, acc)
      if (def.parentCode) {
        if (!parentMap.has(def.parentCode)) parentMap.set(def.parentCode, [])
        parentMap.get(def.parentCode)!.push(acc)
      }
    }
    
    for (const acc of this.accounts.values()) {
      if (acc.parentCode) {
        const parent = this.accounts.get(acc.parentCode)
        if (parent) parent.addChild(acc)
      }
    }
  }
  
  addOrUpdateAccount(def: AccountDef) {
    const exists = this.accounts.get(def.code)
    const acc = exists || new HierarchicalAccount(def.code, def.name, def.type, def.normalBalance, def.division, def.description, def.isActive !== false)
    
    if (exists) {
      acc.name = def.name
      acc.type = def.type
      acc.normalBalance = def.normalBalance
      acc.division = def.division
      acc.description = def.description
      if (def.isActive !== undefined) acc.isActive = def.isActive
    } else {
      this.accounts.set(def.code, acc)
    }
    
    if (def.parentCode) {
      const parent = this.accounts.get(def.parentCode)
      if (parent && !exists) parent.addChild(acc)
    }
    
    return acc
  }
  
  setAccountActive(code: string, active: boolean) {
    const acc = this.accounts.get(code)
    if (acc) acc.isActive = active
  }
  
  getAccounts() { 
    return Array.from(this.accounts.values()).sort((a, b) => a.code.localeCompare(b.code)) 
  }
  
  getAccount(code: string) {
    return this.accounts.get(code)
  }
  
  clearAccounts() {
    this.accounts.clear()
  }
  
  rebuildAuxiliaryAccounts() {
    const a1121 = this.accounts.get('1121')
    const a1122 = this.accounts.get('1122')
    if (a1121) { a1121.auxiliaryLedgers.clear(); a1121.hasAuxiliary = false }
    if (a1122) { a1122.auxiliaryLedgers.clear(); a1122.hasAuxiliary = false }
  }
}