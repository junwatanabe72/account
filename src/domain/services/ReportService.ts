import {
  TrialBalance,
  IncomeStatement,
  BalanceSheet,
  BalanceSheetDebugInfo
} from '../../types'
import { 
  ACCOUNTING_CONSTANTS,
  DIVISION_CODES
} from '../../constants'
import { AccountService } from './AccountService'
import { JournalService } from './JournalService'
import { DivisionService } from './DivisionService'

export class ReportService {
  constructor(
    private accountService: AccountService,
    private journalService: JournalService,
    private divisionService: DivisionService
  ) {}
  
  getTrialBalance(): TrialBalance {
    const entries: TrialBalance['entries'] = []
    let totalDebit = 0, totalCredit = 0
    
    for (const acc of this.accountService.getAccounts()) {
      if (acc.balance !== 0) {
        const db = acc.getDisplayBalance()
        const isDebit = acc.isDebitBalance()
        entries.push({ code: acc.code, name: acc.name, debit: isDebit ? db : 0, credit: !isDebit ? db : 0 })
        if (isDebit) totalDebit += db; else totalCredit += db
      }
    }
    
    return { entries, totalDebit, totalCredit }
  }
  
  getIncomeStatement(): IncomeStatement {
    const revenues: IncomeStatement['revenues'] = []
    const expenses: IncomeStatement['expenses'] = []
    let totalRevenue = 0, totalExpense = 0
    
    for (const acc of this.accountService.getAccounts()) {
      if (acc.balance !== 0) {
        const amt = acc.getDisplayBalance()
        if (acc.type === 'REVENUE') { revenues.push({ code: acc.code, name: acc.name, amount: amt }); totalRevenue += amt }
        if (acc.type === 'EXPENSE') { expenses.push({ code: acc.code, name: acc.name, amount: amt }); totalExpense += amt }
      }
    }
    
    const netIncome = totalRevenue - totalExpense
    return { revenues, expenses, totalRevenue, totalExpense, netIncome }
  }
  
  getBalanceSheet(): BalanceSheet {
    const assets: BalanceSheet['assets'] = []
    const liabilities: BalanceSheet['liabilities'] = []
    const equity: BalanceSheet['equity'] = []
    let totalAssets = 0, totalLiabilities = 0, totalEquity = 0
    
    for (const acc of this.accountService.getAccounts()) {
      if (acc.balance !== 0) {
        const amt = acc.getDisplayBalance()
        if (acc.type === 'ASSET') { 
          assets.push({ code: acc.code, name: acc.name, amount: acc.normalBalance === 'DEBIT' ? amt : -amt })
          totalAssets += acc.normalBalance === 'DEBIT' ? amt : -amt
        }
        if (acc.type === 'LIABILITY') { 
          liabilities.push({ code: acc.code, name: acc.name, amount: amt })
          totalLiabilities += amt
        }
        if (acc.type === 'EQUITY') { 
          equity.push({ code: acc.code, name: acc.name, amount: amt })
          totalEquity += amt
        }
      }
    }
    
    const pl = this.getIncomeStatement()
    if (pl.netIncome !== 0) { 
      equity.push({ code: '9999', name: '当期純利益', amount: pl.netIncome })
      totalEquity += pl.netIncome
    }
    
    return { 
      assets, 
      liabilities, 
      equity, 
      totalAssets, 
      totalLiabilities, 
      totalEquity, 
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
      isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < ACCOUNTING_CONSTANTS.BALANCE_THRESHOLD
    }
  }
  
  getBalanceSheetDebugInfo(): BalanceSheetDebugInfo {
    const assets: BalanceSheetDebugInfo['assets'] = []
    const liabilities: BalanceSheetDebugInfo['liabilities'] = []
    const equity: BalanceSheetDebugInfo['equity'] = []
    let totalAssets = 0, totalLiabilities = 0, totalEquity = 0
    
    const accountDetails: BalanceSheetDebugInfo['accountDetails'] = []
    
    for (const acc of this.accountService.getAccounts()) {
      accountDetails.push({
        code: acc.code,
        name: acc.name,
        type: acc.type,
        normalBalance: acc.normalBalance,
        rawBalance: acc.balance,
        displayBalance: acc.getDisplayBalance(),
        isDebitBalance: acc.isDebitBalance()
      })
      
      if (acc.balance !== 0) {
        const amt = acc.getDisplayBalance()
        const rawBalance = acc.balance
        const normalBalance = acc.normalBalance
        const isDebitBalance = acc.isDebitBalance()
        
        const entry = { 
          code: acc.code, 
          name: acc.name, 
          amount: amt,
          rawBalance,
          normalBalance,
          isDebitBalance
        }
        
        if (acc.type === 'ASSET') {
          const adjustedAmount = acc.normalBalance === 'DEBIT' ? amt : -amt
          assets.push({ ...entry, amount: adjustedAmount })
          totalAssets += adjustedAmount
        }
        if (acc.type === 'LIABILITY') {
          liabilities.push(entry)
          totalLiabilities += amt
        }
        if (acc.type === 'EQUITY') {
          equity.push(entry)
          totalEquity += amt
        }
      }
    }
    
    const pl = this.getIncomeStatement()
    if (pl.netIncome !== 0) {
      equity.push({ 
        code: '9999', 
        name: '当期純利益', 
        amount: pl.netIncome,
        rawBalance: pl.netIncome,
        normalBalance: 'CREDIT',
        isDebitBalance: pl.netIncome < 0
      })
      totalEquity += pl.netIncome
    }
    
    const difference = totalAssets - (totalLiabilities + totalEquity)
    
    return {
      assets,
      liabilities,
      equity,
      totalAssets,
      totalLiabilities,
      totalEquity,
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
      isBalanced: Math.abs(difference) < ACCOUNTING_CONSTANTS.BALANCE_THRESHOLD,
      difference,
      accountDetails
    }
  }
  
  getDivisionTrialBalance() {
    const result: Record<string, TrialBalance> = {}
    
    for (const div of this.divisionService.getDivisions()) {
      const entries: TrialBalance['entries'] = []
      let totalDebit = 0, totalCredit = 0
      
      for (const acc of this.accountService.getAccounts()) {
        if (acc.balance !== 0) {
          const amt = acc.getDisplayBalance()
          const isDebit = acc.isDebitBalance()
          
          if (acc.division === div.code || (acc.division === DIVISION_CODES.SHARED && div.isRequired)) {
            switch (acc.type) {
              case 'ASSET':
              case 'EXPENSE':
                entries.push({ code: acc.code, name: acc.name, debit: isDebit ? amt : 0, credit: !isDebit ? amt : 0 })
                if (isDebit) totalDebit += amt; else totalCredit += amt
                break
              case 'LIABILITY':
              case 'EQUITY':
              case 'REVENUE':
                entries.push({ code: acc.code, name: acc.name, debit: !isDebit ? amt : 0, credit: isDebit ? amt : 0 })
                if (!isDebit) totalDebit += amt; else totalCredit += amt
                break
            }
          }
        }
      }
      
      result[div.code] = { entries, totalDebit, totalCredit }
    }
    
    return result
  }
  
  getIncomeDetails(startDate: string, endDate: string, divisionCode?: string) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const details: Array<{
      journalId: string
      date: string
      number: string
      accountCode: string
      accountName: string
      description: string
      amount: number
      auxiliaryCode?: string
      auxiliaryName?: string
      division?: string
    }> = []
    
    for (const journal of this.journalService.getJournals()) {
      const journalDate = new Date(journal.date)
      if (journalDate >= start && journalDate <= end && journal.status === 'POSTED') {
        for (const detail of journal.details) {
          const account = this.accountService.getAccount(detail.accountCode)
          if (account && account.type === 'REVENUE') {
            const amount = detail.creditAmount - detail.debitAmount
            if (!divisionCode || account.division === divisionCode) {
              if (amount > 0) {
                const item: any = {
                  journalId: journal.id,
                  date: journal.date,
                  number: journal.number,
                  accountCode: detail.accountCode,
                  accountName: account.name,
                  description: detail.description || journal.description,
                  amount,
                  division: account.division
                }
                
                if (detail.auxiliaryCode && account.hasAuxiliary) {
                  const aux = account.getAuxiliaryLedger(detail.auxiliaryCode)
                  if (aux) {
                    item.auxiliaryCode = detail.auxiliaryCode
                    item.auxiliaryName = aux.name
                  }
                }
                
                details.push(item)
              }
            }
          }
        }
      }
    }
    
    return details.sort((a, b) => a.date.localeCompare(b.date) || a.number.localeCompare(b.number))
  }
  
  getIncomeDetailSummary(startDate: string, endDate: string, divisionCode?: string) {
    const details = this.getIncomeDetails(startDate, endDate, divisionCode)
    const accountSummary = new Map<string, any>()
    
    for (const detail of details) {
      const key = detail.accountCode
      let summary = accountSummary.get(key)
      
      if (!summary) {
        summary = {
          accountCode: detail.accountCode,
          accountName: detail.accountName,
          amount: 0,
          count: 0,
          division: detail.division,
          auxiliaryDetails: detail.auxiliaryCode ? new Map() : undefined
        }
        accountSummary.set(key, summary)
      }
      
      summary.amount += detail.amount
      summary.count += 1
      
      if (detail.auxiliaryCode && summary.auxiliaryDetails) {
        let auxDetail = summary.auxiliaryDetails.get(detail.auxiliaryCode)
        if (!auxDetail) {
          auxDetail = {
            auxiliaryCode: detail.auxiliaryCode,
            auxiliaryName: detail.auxiliaryName,
            amount: 0,
            count: 0
          }
          summary.auxiliaryDetails.set(detail.auxiliaryCode, auxDetail)
        }
        auxDetail.amount += detail.amount
        auxDetail.count += 1
      }
    }
    
    return Array.from(accountSummary.values()).map(summary => ({
      ...summary,
      auxiliaryDetails: summary.auxiliaryDetails ? 
        Array.from(summary.auxiliaryDetails.values()) : undefined
    }))
  }
  
  getExpenseDetails(startDate: string, endDate: string, divisionCode?: string) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const details: Array<{
      journalId: string
      date: string
      number: string
      accountCode: string
      accountName: string
      description: string
      amount: number
      auxiliaryCode?: string
      auxiliaryName?: string
      division?: string
    }> = []
    
    for (const journal of this.journalService.getJournals()) {
      const journalDate = new Date(journal.date)
      if (journalDate >= start && journalDate <= end && journal.status === 'POSTED') {
        for (const detail of journal.details) {
          const account = this.accountService.getAccount(detail.accountCode)
          if (account && account.type === 'EXPENSE') {
            const amount = detail.debitAmount - detail.creditAmount
            if (!divisionCode || account.division === divisionCode) {
              if (amount > 0) {
                const item: any = {
                  journalId: journal.id,
                  date: journal.date,
                  number: journal.number,
                  accountCode: detail.accountCode,
                  accountName: account.name,
                  description: detail.description || journal.description,
                  amount,
                  division: account.division
                }
                
                if (detail.auxiliaryCode && account.hasAuxiliary) {
                  const aux = account.getAuxiliaryLedger(detail.auxiliaryCode)
                  if (aux) {
                    item.auxiliaryCode = detail.auxiliaryCode
                    item.auxiliaryName = aux.name
                  }
                }
                
                details.push(item)
              }
            }
          }
        }
      }
    }
    
    return details.sort((a, b) => a.date.localeCompare(b.date) || a.number.localeCompare(b.number))
  }
  
  getExpenseDetailSummary(startDate: string, endDate: string, divisionCode?: string) {
    const details = this.getExpenseDetails(startDate, endDate, divisionCode)
    const accountSummary = new Map<string, any>()
    
    for (const detail of details) {
      const key = detail.accountCode
      let summary = accountSummary.get(key)
      
      if (!summary) {
        summary = {
          accountCode: detail.accountCode,
          accountName: detail.accountName,
          amount: 0,
          count: 0,
          division: detail.division,
          auxiliaryDetails: detail.auxiliaryCode ? new Map() : undefined
        }
        accountSummary.set(key, summary)
      }
      
      summary.amount += detail.amount
      summary.count += 1
      
      if (detail.auxiliaryCode && summary.auxiliaryDetails) {
        let auxDetail = summary.auxiliaryDetails.get(detail.auxiliaryCode)
        if (!auxDetail) {
          auxDetail = {
            auxiliaryCode: detail.auxiliaryCode,
            auxiliaryName: detail.auxiliaryName,
            amount: 0,
            count: 0
          }
          summary.auxiliaryDetails.set(detail.auxiliaryCode, auxDetail)
        }
        auxDetail.amount += detail.amount
        auxDetail.count += 1
      }
    }
    
    return Array.from(accountSummary.values()).map(summary => ({
      ...summary,
      auxiliaryDetails: summary.auxiliaryDetails ? 
        Array.from(summary.auxiliaryDetails.values()) : undefined
    }))
  }
}