// マンション管理組合の会計区分階層構造

// 上位会計区分（一般会計・特別会計）
export type TopLevelAccountingType = 'GENERAL' | 'SPECIAL'

// 特別会計のサブカテゴリ
export type SpecialAccountingCategory = 'SHUZEN' | 'PARKING' | 'OTHER'

// 会計区分の定義
export interface AccountingDivision {
  code: string                          // 区分コード
  name: string                          // 区分名称
  topLevel: TopLevelAccountingType     // 上位区分（一般/特別）
  category?: SpecialAccountingCategory  // 特別会計の場合のカテゴリ
  description?: string                  // 説明
  isActive: boolean                     // 有効フラグ
  sortOrder: number                     // 表示順
}

// デフォルトの会計区分定義
export const DEFAULT_ACCOUNTING_DIVISIONS: AccountingDivision[] = [
  {
    code: 'GENERAL',
    name: '一般会計（管理費会計）',
    topLevel: 'GENERAL',
    description: '日常の管理運営に関する会計',
    isActive: true,
    sortOrder: 1
  },
  {
    code: 'SHUZEN',
    name: '修繕積立金会計',
    topLevel: 'SPECIAL',
    category: 'SHUZEN',
    description: '大規模修繕のための積立金会計',
    isActive: true,
    sortOrder: 2
  },
  {
    code: 'PARKING',
    name: '駐車場会計',
    topLevel: 'SPECIAL',
    category: 'PARKING',
    description: '駐車場運営に関する特別会計',
    isActive: true,
    sortOrder: 3
  },
  {
    code: 'SPECIAL_OTHER',
    name: 'その他特別会計',
    topLevel: 'SPECIAL',
    category: 'OTHER',
    description: 'その他の特定目的のための会計',
    isActive: true,
    sortOrder: 4
  }
]

// 上位区分の表示名
export const TOP_LEVEL_NAMES: Record<TopLevelAccountingType, string> = {
  GENERAL: '一般会計',
  SPECIAL: '特別会計'
}

// 特別会計カテゴリの表示名
export const SPECIAL_CATEGORY_NAMES: Record<SpecialAccountingCategory, string> = {
  SHUZEN: '修繕積立金',
  PARKING: '駐車場',
  OTHER: 'その他'
}

// 会計区分選択用のグループ化されたオプション
export interface AccountingDivisionGroup {
  label: string
  options: AccountingDivision[]
}

// 会計区分をグループ化して返す
export function getGroupedAccountingDivisions(divisions: AccountingDivision[]): AccountingDivisionGroup[] {
  const general = divisions.filter(d => d.topLevel === 'GENERAL' && d.isActive)
  const special = divisions.filter(d => d.topLevel === 'SPECIAL' && d.isActive)
  
  const groups: AccountingDivisionGroup[] = []
  
  if (general.length > 0) {
    groups.push({
      label: TOP_LEVEL_NAMES.GENERAL,
      options: general.sort((a, b) => a.sortOrder - b.sortOrder)
    })
  }
  
  if (special.length > 0) {
    groups.push({
      label: TOP_LEVEL_NAMES.SPECIAL,
      options: special.sort((a, b) => a.sortOrder - b.sortOrder)
    })
  }
  
  return groups
}

// 旧システムの区分コードとの互換性マッピング
export const LEGACY_DIVISION_MAPPING: Record<string, string> = {
  'KANRI': 'GENERAL',        // 管理会計 → 一般会計
  'SHUZEN': 'SHUZEN',        // 修繕積立金会計（変更なし）
  'PARKING': 'PARKING',      // 駐車場会計（変更なし）
  'SPECIAL': 'SPECIAL_OTHER' // 特別会計 → その他特別会計
}

// 会計区分間の振替制限
export interface TransferRestriction {
  fromDivision: string
  toDivision: string
  allowed: boolean
  requiresApproval?: boolean
  maxAmount?: number
  description?: string
}

// デフォルトの振替制限
export const DEFAULT_TRANSFER_RESTRICTIONS: TransferRestriction[] = [
  {
    fromDivision: 'GENERAL',
    toDivision: 'SHUZEN',
    allowed: true,
    requiresApproval: true,
    description: '一般会計から修繕積立金会計への振替（総会決議必要）'
  },
  {
    fromDivision: 'SHUZEN',
    toDivision: 'GENERAL',
    allowed: true,
    requiresApproval: true,
    description: '修繕積立金会計から一般会計への振替（総会決議必要）'
  },
  {
    fromDivision: 'PARKING',
    toDivision: 'GENERAL',
    allowed: true,
    requiresApproval: false,
    description: '駐車場会計から一般会計への振替'
  },
  {
    fromDivision: 'GENERAL',
    toDivision: 'PARKING',
    allowed: false,
    description: '一般会計から駐車場会計への振替は原則不可'
  }
]

// 会計区分別の勘定科目フィルタリング
export function filterAccountsByDivision(
  accounts: any[], 
  divisionCode: string,
  useLegacyMapping: boolean = true
): any[] {
  const targetCode = useLegacyMapping && LEGACY_DIVISION_MAPPING[divisionCode] 
    ? LEGACY_DIVISION_MAPPING[divisionCode] 
    : divisionCode
  
  return accounts.filter(account => {
    // 区分が設定されていない勘定科目は全区分で使用可能
    if (!account.division) return true
    
    // レガシーマッピングを考慮した比較
    const accountDivision = useLegacyMapping && LEGACY_DIVISION_MAPPING[account.division]
      ? LEGACY_DIVISION_MAPPING[account.division]
      : account.division
    
    return accountDivision === targetCode
  })
}