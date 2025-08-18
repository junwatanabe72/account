import { DIVISION_CODES } from '../../constants'
import { AccountService } from './AccountService'
import { JournalService } from './JournalService'
import { DivisionService } from './DivisionService'
import { IAccountService } from '../interfaces/IAccountService'
import { IJournalService } from '../interfaces/IJournalService'
import { IDivisionService } from '../interfaces/IDivisionService'

export class ClosingService {
  constructor(
    private accountService: AccountService | IAccountService,
    private journalService: JournalService | IJournalService,
    private divisionService: DivisionService | IDivisionService
  ) {}
  
  createClosingEntries(closingDate: string) {
    const results: Array<{ division: string, success: boolean, journalId?: string, error?: string }> = []
    
    for (const division of this.divisionService.getDivisions()) {
      if (!division.isRequired) continue
      
      const divCode = division.code
      const revenueAccounts = []
      const expenseAccounts = []
      let totalRevenue = 0
      let totalExpense = 0
      
      for (const acc of this.accountService.getAccounts()) {
        if (acc.division === divCode && acc.balance !== 0) {
          const amt = acc.getDisplayBalance()
          if (acc.type === 'REVENUE') {
            revenueAccounts.push(acc)
            totalRevenue += amt
          } else if (acc.type === 'EXPENSE') {
            expenseAccounts.push(acc)
            totalExpense += amt
          }
        }
      }
      
      if (totalRevenue === 0 && totalExpense === 0) { 
        results.push({ division: divCode, success: true })
        continue
      }
      
      const details = []
      
      // 収益の振替
      for (const acc of revenueAccounts) {
        details.push({ accountCode: acc.code, debitAmount: acc.getDisplayBalance() })
      }
      
      // 費用の振替
      for (const acc of expenseAccounts) {
        details.push({ accountCode: acc.code, creditAmount: acc.getDisplayBalance() })
      }
      
      // 剰余金への振替
      const netIncome = totalRevenue - totalExpense
      const surplusAccountCode = divCode === DIVISION_CODES.KANRI ? '3110' :
                                divCode === DIVISION_CODES.SHUZEN ? '3120' :
                                divCode === DIVISION_CODES.PARKING ? '3130' : null
      
      if (surplusAccountCode) {
        if (netIncome > 0) {
          details.push({ accountCode: surplusAccountCode, creditAmount: netIncome })
        } else if (netIncome < 0) {
          details.push({ accountCode: surplusAccountCode, debitAmount: Math.abs(netIncome) })
        }
      }
      
      const result = this.journalService.createJournal({
        date: closingDate,
        description: `決算振替仕訳（${division.name}）`,
        details
      })
      
      if (result.success) {
        results.push({ division: divCode, success: true, journalId: result.data?.id })
      } else {
        results.push({ division: divCode, success: false, error: result.errors?.join(', ') })
      }
    }
    
    return results
  }
}