/**
 * 会計区分マスターデータ（静的データ）
 * 区分会計の定義と設定
 */

export interface DivisionMaster {
  code: string
  name: string
  shortName: string
  description: string
  isActive: boolean
  fiscalYearStart: string  // MM-DD format
  fiscalYearEnd: string    // MM-DD format
  defaultAccounts: {
    cash?: string           // 現金勘定
    bank?: string          // 預金勘定
    income?: string        // 収入勘定
    expense?: string       // 費用勘定
    surplus?: string       // 繰越金勘定
  }
  budgetSettings?: {
    requireApproval: boolean
    alertThreshold: number  // 予算の何%で警告
  }
}

/**
 * 会計区分定義
 */
export const DIVISION_MASTER: DivisionMaster[] = [
  {
    code: 'KANRI',
    name: '管理会計',
    shortName: '管理',
    description: '日常の管理運営に関する会計',
    isActive: true,
    fiscalYearStart: '04-01',
    fiscalYearEnd: '03-31',
    defaultAccounts: {
      cash: '1101',       // 現金
      bank: '1102',       // 普通預金
      income: '5101',     // 管理費収入
      expense: '6101',    // 管理委託費
      surplus: '4101'     // 管理費繰越金
    },
    budgetSettings: {
      requireApproval: false,
      alertThreshold: 90
    }
  },
  {
    code: 'SHUZEN',
    name: '修繕積立金会計',
    shortName: '修繕',
    description: '大規模修繕に備えた積立金会計',
    isActive: true,
    fiscalYearStart: '04-01',
    fiscalYearEnd: '03-31',
    defaultAccounts: {
      bank: '1103',       // 普通預金（修繕）
      income: '5201',     // 修繕積立金収入
      expense: '6401',    // 修繕工事費
      surplus: '4102'     // 修繕積立金繰越金
    },
    budgetSettings: {
      requireApproval: true,
      alertThreshold: 80
    }
  },
  {
    code: 'PARKING',
    name: '駐車場会計',
    shortName: '駐車場',
    description: '駐車場運営に関する特別会計',
    isActive: true,
    fiscalYearStart: '04-01',
    fiscalYearEnd: '03-31',
    defaultAccounts: {
      bank: '1102',       // 普通預金（管理と共用）
      income: '5102',     // 駐車場使用料収入
      expense: '6201'     // 修繕費
    },
    budgetSettings: {
      requireApproval: false,
      alertThreshold: 85
    }
  },
  {
    code: 'SPECIAL',
    name: '特別会計',
    shortName: '特別',
    description: '特別な目的のための会計',
    isActive: false,
    fiscalYearStart: '04-01',
    fiscalYearEnd: '03-31',
    defaultAccounts: {},
    budgetSettings: {
      requireApproval: true,
      alertThreshold: 75
    }
  },
  {
    code: 'COMMON',
    name: '共通',
    shortName: '共通',
    description: '全会計区分で共通利用',
    isActive: true,
    fiscalYearStart: '04-01',
    fiscalYearEnd: '03-31',
    defaultAccounts: {}
  }
]

/**
 * 会計区分コードの定数（後方互換性のため）
 */
export const DIVISION_CODES = {
  KANRI: 'KANRI',
  SHUZEN: 'SHUZEN',
  PARKING: 'PARKING',
  SPECIAL: 'SPECIAL',
  COMMON: 'COMMON'
} as const

/**
 * 会計区分名称の定数（後方互換性のため）
 */
export const DIVISION_NAMES = {
  [DIVISION_CODES.KANRI]: '管理会計',
  [DIVISION_CODES.SHUZEN]: '修繕積立金会計',
  [DIVISION_CODES.PARKING]: '駐車場会計',
  [DIVISION_CODES.SPECIAL]: '特別会計',
  [DIVISION_CODES.COMMON]: '共通'
} as const

// ユーティリティ関数

/**
 * コードから会計区分を取得
 */
export function getDivisionByCode(code: string): DivisionMaster | undefined {
  return DIVISION_MASTER.find(d => d.code === code)
}

/**
 * アクティブな会計区分のみ取得
 */
export function getActiveDivisions(): DivisionMaster[] {
  return DIVISION_MASTER.filter(d => d.isActive)
}

/**
 * 会計区分の勘定科目を取得
 */
export function getDivisionAccounts(divisionCode: string): DivisionMaster['defaultAccounts'] {
  const division = getDivisionByCode(divisionCode)
  return division?.defaultAccounts || {}
}

/**
 * 会計区分間の振替が可能かチェック
 */
export function canTransferBetweenDivisions(fromCode: string, toCode: string): boolean {
  // ビジネスルール：管理会計から修繕積立金会計への振替は可能
  if (fromCode === 'KANRI' && toCode === 'SHUZEN') return true
  
  // 修繕積立金会計から管理会計への振替は総会決議が必要
  if (fromCode === 'SHUZEN' && toCode === 'KANRI') return false
  
  // 同一区分内は常に可能
  if (fromCode === toCode) return true
  
  // 共通区分との振替は常に可能
  if (fromCode === 'COMMON' || toCode === 'COMMON') return true
  
  // その他は原則不可
  return false
}

/**
 * 会計年度の開始日を取得
 */
export function getFiscalYearStart(year: number, divisionCode: string = 'KANRI'): Date {
  const division = getDivisionByCode(divisionCode)
  if (!division) return new Date(year, 3, 1) // デフォルト: 4月1日
  
  const parts = division.fiscalYearStart.split('-').map(Number)
  const month = parts[0] || 4
  const day = parts[1] || 1
  return new Date(year, month - 1, day)
}

/**
 * 会計年度の終了日を取得
 */
export function getFiscalYearEnd(year: number, divisionCode: string = 'KANRI'): Date {
  const division = getDivisionByCode(divisionCode)
  if (!division) return new Date(year + 1, 2, 31) // デフォルト: 3月31日
  
  const parts = division.fiscalYearEnd.split('-').map(Number)
  const month = parts[0] || 3
  const day = parts[1] || 31
  const endYear = month < 4 ? year + 1 : year // 年度跨ぎの処理
  return new Date(endYear, month - 1, day)
}