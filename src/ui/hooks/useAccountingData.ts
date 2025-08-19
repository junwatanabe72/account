import { useMemo } from 'react'
import { AccountingEngine } from '../../domain/accountingEngine'

// 試算表データのメモ化
export const useTrialBalance = (engine: AccountingEngine) => {
  return useMemo(() => engine.getTrialBalance(), [engine])
}

// 損益計算書データのメモ化
export const useIncomeStatement = (engine: AccountingEngine) => {
  return useMemo(() => engine.getIncomeStatement(), [engine])
}

// 貸借対照表データのメモ化
export const useBalanceSheet = (engine: AccountingEngine) => {
  return useMemo(() => engine.getBalanceSheet(), [engine])
}

// 区分別試算表データのメモ化
export const useDivisionTrialBalance = (engine: AccountingEngine) => {
  return useMemo(() => engine.getDivisionTrialBalance(), [engine])
}

// フィルター済み仕訳のメモ化
export const useFilteredJournals = (
  engine: AccountingEngine,
  filters: {
    status?: string
    dateFrom?: string
    dateTo?: string
    textQuery?: string
    accountQuery?: string
  }
) => {
  return useMemo(() => {
    return engine.journals.filter(j => {
      if (filters.status && filters.status !== 'ALL' && j.status !== filters.status) return false
      if (filters.dateFrom && j.date < filters.dateFrom) return false
      if (filters.dateTo && j.date > filters.dateTo) return false
      if (filters.textQuery) {
        const t = (j.description + ' ' + j.number).toLowerCase()
        if (!t.includes(filters.textQuery.toLowerCase())) return false
      }
      if (filters.accountQuery) {
        const q = filters.accountQuery.toLowerCase()
        const hit = j.details.some(d => {
          const acc = engine.accounts.find(a => a.code === d.accountCode)
          const s = (d.accountCode + ' ' + (acc?.name ?? '')).toLowerCase()
          return s.includes(q)
        })
        if (!hit) return false
      }
      return true
    })
  }, [engine.journals, filters])
}

// 収入明細サマリーのメモ化
export const useIncomeDetailSummary = (
  engine: AccountingEngine,
  startDate: string,
  endDate: string,
  divisionCode?: string
) => {
  return useMemo(() => {
    return engine.getIncomeDetailSummary(startDate, endDate, divisionCode)
  }, [engine, startDate, endDate, divisionCode])
}

// 支出明細サマリーのメモ化
export const useExpenseDetailSummary = (
  engine: AccountingEngine,
  startDate: string,
  endDate: string,
  divisionCode?: string
) => {
  return useMemo(() => {
    return engine.getExpenseDetailSummary(startDate, endDate, divisionCode)
  }, [engine, startDate, endDate, divisionCode])
}