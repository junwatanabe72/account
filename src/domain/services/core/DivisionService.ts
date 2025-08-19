import {
  DivisionCode,
  AccountType
} from '../../../types'
import {
  DIVISION_CODES,
  DIVISION_NAMES,
  ACCOUNTING_CONSTANTS
} from '../../../constants'
import { IDivisionService } from '../../interfaces/IDivisionService'

export class AccountingDivision {
  transferLimits: Record<string, number> = {}
  transactions: Array<{
    journalId: string
    date: string
    description: string
    amount: number
    isDebit: boolean
    accountType: AccountType
  }> = []
  
  constructor(public code: string, public name: string, public description: string, public isRequired = true) {}
  
  canTransferTo(targetDivision: string, amount: number) {
    if (this.code === DIVISION_CODES.SHUZEN && targetDivision !== DIVISION_CODES.SHUZEN) {
      return false
    }
    const limit = this.transferLimits[targetDivision]
    if (limit && amount > limit) {
      return false
    }
    return true
  }
  
  setTransferLimit(targetDivision: string, limit: number) { 
    this.transferLimits[targetDivision] = limit 
  }
  
  addTransaction(journalId: string, date: string, description: string, amount: number, isDebit: boolean, accountType: AccountType) {
    this.transactions.push({ journalId, date, description, amount, isDebit, accountType })
  }
  
  getBalance() {
    let balance = 0
    for (const t of this.transactions) {
      if (t.accountType === 'ASSET' || t.accountType === 'EXPENSE') {
        balance += t.isDebit ? t.amount : -t.amount
      } else {
        balance += t.isDebit ? -t.amount : t.amount
      }
    }
    return balance
  }
}

export class DivisionService implements IDivisionService {
  private divisionsMap = new Map<string, AccountingDivision>()
  
  // インタフェースの要求に応じて配列としてもアクセス可能
  get divisions(): AccountingDivision[] {
    return Array.from(this.divisionsMap.values())
  }
  
  initializeDivisions() {
    this.divisionsMap.set(DIVISION_CODES.KANRI, new AccountingDivision(
      DIVISION_CODES.KANRI, 
      DIVISION_NAMES[DIVISION_CODES.KANRI], 
      '管理費会計に関する区分'
    ))
    this.divisionsMap.set(DIVISION_CODES.SHUZEN, new AccountingDivision(
      DIVISION_CODES.SHUZEN, 
      DIVISION_NAMES[DIVISION_CODES.SHUZEN], 
      '修繕積立金会計に関する区分'
    ))
    this.divisionsMap.set(DIVISION_CODES.PARKING, new AccountingDivision(
      DIVISION_CODES.PARKING, 
      DIVISION_NAMES[DIVISION_CODES.PARKING], 
      '駐車場会計に関する区分'
    ))
    this.divisionsMap.set(DIVISION_CODES.SHARED, new AccountingDivision(
      DIVISION_CODES.SHARED, 
      DIVISION_NAMES[DIVISION_CODES.SHARED], 
      '区分共通の会計', 
      false
    ))
  }
  
  getDivision(code: string | DivisionCode): AccountingDivision | undefined {
    return this.divisionsMap.get(code)
  }
  
  getDivisions() {
    return Array.from(this.divisionsMap.values())
  }
  
  clearDivisions() {
    this.divisionsMap.clear()
  }
}