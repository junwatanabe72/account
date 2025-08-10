// Accounting Constants
export const ACCOUNTING_CONSTANTS = {
  BALANCE_THRESHOLD: 0.01,
  TOAST_DURATION: 4000,
  LEDGER_VIEW_MAX_HEIGHT: 520,
  REPAIR_PROBABILITY: 0.3,
  BUDGET_MULTIPLIER: 1.1,
  DEFAULT_MANAGEMENT_FEE: 25000,
  DEFAULT_RESERVE_FUND: 15000,
  COLLECTION_SUCCESS_RATE: 0.95,
  SUMMER_ELECTRICITY_MULTIPLIER: 1.3,
  WINTER_ELECTRICITY_MULTIPLIER: 1.2
} as const

// Division Codes
export const DIVISION_CODES = {
  KANRI: 'KANRI',
  SHUZEN: 'SHUZEN',
  PARKING: 'PARKING',
  SHARED: 'SHARED',
  SPECIAL: 'SPECIAL'
} as const

// Division Names
export const DIVISION_NAMES = {
  [DIVISION_CODES.KANRI]: '管理費会計',
  [DIVISION_CODES.SHUZEN]: '修繕積立金会計',
  [DIVISION_CODES.PARKING]: '駐車場会計',
  [DIVISION_CODES.SHARED]: '共通',
  [DIVISION_CODES.SPECIAL]: '特別会計'
} as const

// Journal Status
export const JOURNAL_STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  POSTED: 'POSTED'
} as const

// Toast Types
export const TOAST_TYPES = {
  SUCCESS: 'success',
  INFO: 'info',
  WARNING: 'warning',
  DANGER: 'danger'
} as const

// Sample Data Constants
export const SAMPLE_DATA_CONSTANTS = {
  // 管理員業務費
  MANAGEMENT_STAFF_MIN: 150000,
  MANAGEMENT_STAFF_MAX: 180000,
  
  // 清掃業務費
  CLEANING_MIN: 80000,
  CLEANING_MAX: 100000,
  
  // 電気料
  ELECTRICITY_BASE_MIN: 30000,
  ELECTRICITY_BASE_MAX: 50000,
  
  // 水道料
  WATER_MIN: 20000,
  WATER_MAX: 30000,
  
  // 経常修繕費
  REGULAR_REPAIR_MIN: 50000,
  REGULAR_REPAIR_MAX: 200000,
  
  // 支払処理
  PAYMENT_MIN: 300000,
  PAYMENT_MAX: 500000,
  
  // 年間保険料
  ANNUAL_INSURANCE: 480000,
  
  // 理事会運営費
  BOARD_OPERATION: 50000,
  
  // 大規模修繕工事費
  MAJOR_REPAIR: 3000000
} as const

// Error Messages
export const ERROR_MESSAGES = {
  JOURNAL_NOT_FOUND: '仕訳が見つかりません',
  JOURNAL_STATUS_INVALID: '仕訳のステータスが不正です',
  JOURNAL_ALREADY_POSTED: '既に記帳済みの仕訳です',
  JOURNAL_POSTED_CANNOT_DELETE: '記帳済みの仕訳は削除できません',
  JOURNAL_NOT_EDITABLE: '編集可能な状態ではありません',
  JOURNAL_DATE_REQUIRED: '仕訳日付は必須です',
  JOURNAL_DESCRIPTION_REQUIRED: '仕訳摘要は必須です',
  JOURNAL_DETAILS_REQUIRED: '仕訳明細は必須です',
  JOURNAL_NOT_BALANCED: '貸借が一致していません',
  ACCOUNT_NOT_FOUND: '勘定科目が見つかりません',
  ACCOUNT_INACTIVE: '勘定科目が無効です',
  DIVISION_TRANSFER_LIMIT_EXCEEDED: '区分間振替制限を超えています',
  NO_BILLING_AMOUNT: '請求する金額がありません',
  NO_OPENING_BALANCE_DETAILS: '期首残高の明細がありません',
  REQUIRED_FIELDS_MISSING: '必須フィールドが不足しています',
  INVALID_JOURNAL_DETAIL_FORMAT: '仕訳明細の形式が正しくありません'
} as const

// Error Codes
export const ERROR_CODES = {
  JOURNAL_NOT_FOUND: 'E001',
  JOURNAL_STATUS_INVALID: 'E002',
  JOURNAL_ALREADY_POSTED: 'E003',
  JOURNAL_POSTED_CANNOT_DELETE: 'E004',
  JOURNAL_NOT_EDITABLE: 'E005',
  VALIDATION_ERROR: 'E010',
  ACCOUNT_NOT_FOUND: 'E020',
  ACCOUNT_INACTIVE: 'E021',
  DIVISION_ERROR: 'E030',
  IMPORT_ERROR: 'E040'
} as const

// Repair Descriptions
export const REPAIR_DESCRIPTIONS = [
  'エレベーター点検補修',
  '給水ポンプ交換',
  '共用廊下照明器具交換',
  'エントランスドア修繕',
  '駐車場区画線補修',
  '排水管清掃',
  '消防設備点検補修'
] as const

// Account Type Groups
export const ACCOUNT_TYPE_GROUPS = {
  BALANCE_SHEET: ['ASSET', 'LIABILITY', 'EQUITY'],
  INCOME_STATEMENT: ['REVENUE', 'EXPENSE']
} as const

// Number Formats
export const NUMBER_FORMATS = {
  JOURNAL_NUMBER_PREFIX: 'J',
  JOURNAL_NUMBER_PADDING: 6,
  DECIMAL_PLACES: 2
} as const