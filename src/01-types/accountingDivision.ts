// Accounting Division Types and Constants

export interface AccountingDivision {
  code: string
  name: string
  parentCode?: string
  level: number
  accountCodes?: string[]
}

export const DEFAULT_ACCOUNTING_DIVISIONS: AccountingDivision[] = [
  // 収入の部
  { code: '01', name: '管理費', level: 1 },
  { code: '02', name: '修繕積立金', level: 1 },
  { code: '03', name: '駐車場収入', level: 1 },
  { code: '04', name: '専用使用料', level: 1 },
  { code: '05', name: 'その他収入', level: 1 },
  
  // 支出の部
  { code: '10', name: '管理事務費', level: 1 },
  { code: '11', name: '管理員人件費', level: 1 },
  { code: '12', name: '清掃費', level: 1 },
  { code: '13', name: '設備保守費', level: 1 },
  { code: '14', name: '修繕費', level: 1 },
  { code: '15', name: '水道光熱費', level: 1 },
  { code: '16', name: '保険料', level: 1 },
  { code: '17', name: '支払手数料', level: 1 },
  { code: '18', name: 'その他支出', level: 1 },
]

export const TOP_LEVEL_NAMES: Record<string, string> = {
  income: '収入の部',
  expense: '支出の部',
  asset: '資産の部',
  liability: '負債の部'
}

export function getGroupedAccountingDivisions() {
  const income = DEFAULT_ACCOUNTING_DIVISIONS.filter(d => parseInt(d.code) < 10)
  const expense = DEFAULT_ACCOUNTING_DIVISIONS.filter(d => parseInt(d.code) >= 10)
  
  return {
    income,
    expense
  }
}

export const LEGACY_DIVISION_MAPPING: Record<string, string> = {
  'KANRI': '管理',
  'SHUZEN': '修繕'
}

// Re-export from other modules for compatibility
export type { DivisionCode } from './accounting'