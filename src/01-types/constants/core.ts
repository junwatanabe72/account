// システム全体で使用する定数定義

// 仕訳の状態
export const JOURNAL_STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  POSTED: 'POSTED'
} as const

// 会計区分コード
export const DIVISION_CODES = {
  KANRI: 'KANRI',      // 管理会計
  SHUZEN: 'SHUZEN',    // 修繕積立金会計
  PARKING: 'PARKING',   // 駐車場会計
  SPECIAL: 'SPECIAL'   // 特別会計
} as const

// 区分名称
export const DIVISION_NAMES = {
  [DIVISION_CODES.KANRI]: '管理会計',
  [DIVISION_CODES.SHUZEN]: '修繕積立金会計',
  [DIVISION_CODES.PARKING]: '駐車場会計',
  [DIVISION_CODES.SPECIAL]: '特別会計'
} as const

// Toast通知タイプ
export const TOAST_TYPES = {
  SUCCESS: 'success',
  INFO: 'info',
  WARNING: 'warning',
  DANGER: 'danger'
} as const

// UI関連の定数
export const UI_CONSTANTS = {
  TOAST_TIMEOUT: 4000,           // Toast表示時間（ミリ秒）
  LEDGER_MAX_HEIGHT: 520,        // 元帳表示の最大高さ
  DEFAULT_PAGE_SIZE: 50,         // デフォルトのページサイズ
  MODAL_Z_INDEX: 1000,          // モーダルのz-index
  ANIMATION_DURATION: 300       // アニメーション時間（ミリ秒）
} as const

// 会計関連の定数
export const ACCOUNTING_CONSTANTS = {
  BALANCE_THRESHOLD: 0.01,       // 残高比較の閾値
  POSTABLE_LEVEL: 4,            // 仕訳可能な勘定科目レベル
  DECIMAL_PLACES: 0,            // 金額の小数点以下桁数
  MAX_JOURNAL_DETAILS: 100,     // 仕訳明細の最大行数
  FISCAL_YEAR_START_MONTH: 4   // 会計年度開始月
} as const

// サンプルデータ生成用の定数
export const SAMPLE_DATA_CONSTANTS = {
  // 管理費・修繕積立金
  MANAGEMENT_FEE_BASE: 25000,
  REPAIR_RESERVE_BASE: 15000,
  
  // 駐車場料金
  PARKING_FEE_MIN: 15000,
  PARKING_FEE_MAX: 30000,
  
  // 費用のランダム範囲
  EXPENSE_RANGES: {
    CLEANING: { min: 10000, max: 30000 },
    ELEVATOR: { min: 60000, max: 90000 },
    ELECTRICITY: { min: 20000, max: 70000 },
    WATER: { min: 10000, max: 30000 },
    INSURANCE: { min: 100000, max: 150000 },
    MANAGEMENT: { min: 100000, max: 200000 },
    SUPPLIES: { min: 3000, max: 15000 },
    COMMUNICATION: { min: 3000, max: 8000 },
    OTHER: { min: 5000, max: 20000 }
  },
  
  // 修繕確率
  REPAIR_PROBABILITY: 0.3,
  
  // 予算係数
  BUDGET_MULTIPLIER: 1.1
} as const

// 日付フォーマット
export const DATE_FORMATS = {
  DISPLAY: 'YYYY/MM/DD',
  INPUT: 'YYYY-MM-DD',
  MONTH: 'YYYY/MM',
  YEAR: 'YYYY'
} as const

// エラーコード
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  BALANCE_MISMATCH: 'BALANCE_MISMATCH',
  ACCOUNT_NOT_FOUND: 'ACCOUNT_NOT_FOUND',
  INVALID_DATE: 'INVALID_DATE',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  INSUFFICIENT_DATA: 'INSUFFICIENT_DATA',
  SYSTEM_ERROR: 'SYSTEM_ERROR'
} as const

// エラーメッセージ
export const ERROR_MESSAGES = {
  [ERROR_CODES.VALIDATION_ERROR]: '入力内容に誤りがあります',
  [ERROR_CODES.BALANCE_MISMATCH]: '貸借が一致していません',
  [ERROR_CODES.ACCOUNT_NOT_FOUND]: '指定された勘定科目が見つかりません',
  [ERROR_CODES.INVALID_DATE]: '日付の形式が正しくありません',
  [ERROR_CODES.DUPLICATE_ENTRY]: '重複したデータが存在します',
  [ERROR_CODES.INSUFFICIENT_DATA]: '必要なデータが不足しています',
  [ERROR_CODES.SYSTEM_ERROR]: 'システムエラーが発生しました',
  // Journal関連のエラーメッセージ
  JOURNAL_DATE_REQUIRED: '仕訳日付は必須です',
  JOURNAL_DESCRIPTION_REQUIRED: '仕訳摘要は必須です',
  JOURNAL_DETAILS_REQUIRED: '仕訳明細は必須です',
  JOURNAL_NOT_BALANCED: '貸借が一致していません',
  JOURNAL_NOT_FOUND: '仕訳が見つかりません',
  JOURNAL_STATUS_INVALID: '仕訳のステータスが無効です',
  JOURNAL_ALREADY_POSTED: '仕訳は既に転記済みです',
  JOURNAL_POSTED_CANNOT_DELETE: '転記済みの仕訳は削除できません',
  JOURNAL_NOT_EDITABLE: '編集可能な状態ではありません'
} as const

// 勘定科目タイプ
export const ACCOUNT_TYPES = {
  ASSET: 'ASSET',
  LIABILITY: 'LIABILITY',
  EQUITY: 'EQUITY',
  REVENUE: 'REVENUE',
  EXPENSE: 'EXPENSE'
} as const

// 正常残高
export const NORMAL_BALANCES = {
  DEBIT: 'DEBIT',
  CREDIT: 'CREDIT'
} as const

// エクスポート形式
export const EXPORT_FORMATS = {
  CSV: 'csv',
  EXCEL: 'excel',
  JSON: 'json'
} as const

// ストレージキー
export const STORAGE_KEYS = {
  ACCOUNTING_DATA: 'accountingData',
  USER_SETTINGS: 'userSettings',
  LAST_BACKUP: 'lastBackup'
} as const

// デフォルト設定
export const DEFAULT_SETTINGS = {
  companyName: 'マンション管理組合',
  fiscalYearStart: '04-01',
  displayOptions: {
    showAccountCodes: true,
    showDivisions: true,
    dateFormat: DATE_FORMATS.DISPLAY
  }
} as const

// CSVエクスポート設定
export const CSV_EXPORT_CONFIG = {
  ENCODING: 'UTF-8',
  BOM: '\uFEFF',
  DELIMITER: ',',
  LINE_BREAK: '\r\n',
  QUOTE: '"'
} as const