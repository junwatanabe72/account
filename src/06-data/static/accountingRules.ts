/**
 * 会計ルール定義（静的データ）
 * システム全体で適用される会計ルールと制約
 */

/**
 * 仕訳ルール
 */
export const JOURNAL_RULES = {
  // 最大明細行数
  MAX_DETAILS: 100,
  
  // 貸借差額の許容誤差（円）
  BALANCE_TOLERANCE: 0.01,
  
  // 仕訳番号フォーマット
  NUMBER_FORMAT: 'YYYYMM-0000',
  
  // 摘要の最大文字数
  MAX_DESCRIPTION_LENGTH: 500,
  
  // 過去日付の制限（日数）
  PAST_DATE_LIMIT: 365,
  
  // 未来日付の制限（日数）
  FUTURE_DATE_LIMIT: 90,
  
  // 自動採番の開始番号
  AUTO_NUMBER_START: 1
} as const

/**
 * 仕訳ステータス遷移ルール
 */
export const JOURNAL_STATUS_TRANSITIONS = {
  DRAFT: ['SUBMITTED', 'POSTED'],
  SUBMITTED: ['APPROVED', 'DRAFT'],
  APPROVED: ['POSTED', 'DRAFT'],
  POSTED: [] // 記帳済みは変更不可
} as const

/**
 * 勘定科目ルール
 */
export const ACCOUNT_RULES = {
  // 階層の最大深度
  MAX_HIERARCHY_DEPTH: 5,
  
  // 仕訳可能なレベル
  POSTABLE_LEVEL: 3,
  
  // コードの桁数
  CODE_LENGTH: {
    LEVEL1: 4,
    LEVEL2: 4,
    LEVEL3: 4,
    LEVEL4: 4,
    LEVEL5: 4
  },
  
  // 正常残高の定義
  NORMAL_BALANCE: {
    ASSET: 'DEBIT',
    LIABILITY: 'CREDIT',
    EQUITY: 'CREDIT',
    REVENUE: 'CREDIT',
    EXPENSE: 'DEBIT'
  }
} as const

/**
 * 金額ルール
 */
export const AMOUNT_RULES = {
  // 最小金額
  MIN_AMOUNT: 0,
  
  // 最大金額
  MAX_AMOUNT: 999999999999,
  
  // 小数点以下の桁数
  DECIMAL_PLACES: 0,
  
  // 千円単位での丸め
  ROUNDING_UNIT: 1,
  
  // マイナス金額の許可
  ALLOW_NEGATIVE: false
} as const

/**
 * 期間ルール
 */
export const PERIOD_RULES = {
  // 標準会計期間（月数）
  STANDARD_PERIOD: 12,
  
  // 会計年度開始月
  FISCAL_YEAR_START_MONTH: 4,
  
  // 月次締め日
  MONTHLY_CLOSING_DAY: 'LAST', // 'LAST' or number
  
  // 期末処理の猶予期間（日数）
  CLOSING_GRACE_PERIOD: 30,
  
  // 仮締めの許可
  ALLOW_PROVISIONAL_CLOSING: true
} as const

/**
 * 補助元帳ルール
 */
export const AUXILIARY_RULES = {
  // コードの最大長
  MAX_CODE_LENGTH: 20,
  
  // 名称の最大長
  MAX_NAME_LENGTH: 100,
  
  // 補助元帳タイプ
  TYPES: ['vendor', 'unit_owner', 'department', 'project'] as const,
  
  // 必須フィールド
  REQUIRED_FIELDS: {
    vendor: ['vendorName', 'category'],
    unit_owner: ['unitNumber', 'ownerName', 'managementFee', 'repairReserve'],
    department: ['departmentName'],
    project: ['projectName', 'startDate', 'endDate']
  }
} as const

/**
 * 取引ルール
 */
export const TRANSACTION_RULES = {
  // 取引タイプ
  TYPES: ['INCOME', 'EXPENSE', 'TRANSFER'] as const,
  
  // 支払方法
  PAYMENT_METHODS: ['CASH', 'BANK_TRANSFER', 'CREDIT_CARD', 'DIRECT_DEBIT', 'OTHER'] as const,
  
  // 振替手数料の上限
  MAX_TRANSFER_FEE: 10000,
  
  // 一括処理の最大件数
  MAX_BATCH_SIZE: 1000,
  
  // 重複チェック期間（日数）
  DUPLICATE_CHECK_DAYS: 7
} as const

/**
 * バリデーションルール
 */
export const VALIDATION_RULES = {
  // 日付形式
  DATE_FORMAT: /^\d{4}-\d{2}-\d{2}$/,
  
  // 勘定科目コード形式
  ACCOUNT_CODE_FORMAT: /^\d{4}$/,
  
  // 金額形式
  AMOUNT_FORMAT: /^\d+(\.\d{1,2})?$/,
  
  // 必須フィールド
  REQUIRED_FIELDS: {
    journal: ['date', 'description', 'details'],
    transaction: ['date', 'type', 'amount', 'description'],
    transfer: ['date', 'fromAccountCode', 'toAccountCode', 'amount']
  }
} as const

/**
 * レポートルール
 */
export const REPORT_RULES = {
  // 試算表の集計レベル
  TRIAL_BALANCE_LEVEL: 3,
  
  // 損益計算書の表示順
  INCOME_STATEMENT_ORDER: ['REVENUE', 'EXPENSE'],
  
  // 貸借対照表の表示順
  BALANCE_SHEET_ORDER: ['ASSET', 'LIABILITY', 'EQUITY'],
  
  // ゼロ残高の表示
  SHOW_ZERO_BALANCE: false,
  
  // 前期比較の表示
  SHOW_COMPARISON: true
} as const

/**
 * エクスポートルール
 */
export const EXPORT_RULES = {
  // 対応フォーマット
  FORMATS: ['CSV', 'EXCEL', 'JSON', 'PDF'] as const,
  
  // CSVエンコーディング
  CSV_ENCODING: 'UTF-8',
  
  // CSVセパレータ
  CSV_SEPARATOR: ',',
  
  // 最大エクスポート件数
  MAX_EXPORT_ROWS: 100000,
  
  // ファイル名形式
  FILENAME_FORMAT: '{type}_{date}_{time}'
} as const

// バリデーション関数

/**
 * 仕訳の貸借バランスチェック
 */
export function isJournalBalanced(
  debitTotal: number,
  creditTotal: number
): boolean {
  return Math.abs(debitTotal - creditTotal) <= JOURNAL_RULES.BALANCE_TOLERANCE
}

/**
 * 金額の妥当性チェック
 */
export function isValidAmount(amount: number): boolean {
  return (
    amount >= AMOUNT_RULES.MIN_AMOUNT &&
    amount <= AMOUNT_RULES.MAX_AMOUNT &&
    (AMOUNT_RULES.ALLOW_NEGATIVE || amount >= 0)
  )
}

/**
 * 日付の妥当性チェック
 */
export function isValidJournalDate(date: string): boolean {
  const journalDate = new Date(date)
  const today = new Date()
  const pastLimit = new Date()
  pastLimit.setDate(today.getDate() - JOURNAL_RULES.PAST_DATE_LIMIT)
  const futureLimit = new Date()
  futureLimit.setDate(today.getDate() + JOURNAL_RULES.FUTURE_DATE_LIMIT)
  
  return journalDate >= pastLimit && journalDate <= futureLimit
}

/**
 * 仕訳番号の生成
 */
export function generateJournalNumber(date: string, sequence: number): string {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const seq = String(sequence).padStart(4, '0')
  return `${year}${month}-${seq}`
}

/**
 * 会計期間の取得
 */
export function getAccountingPeriod(date: string): { year: number; month: number; quarter: number } {
  const d = new Date(date)
  const month = d.getMonth() + 1
  const fiscalMonth = month >= PERIOD_RULES.FISCAL_YEAR_START_MONTH 
    ? month - PERIOD_RULES.FISCAL_YEAR_START_MONTH + 1
    : month + 12 - PERIOD_RULES.FISCAL_YEAR_START_MONTH + 1
  
  const fiscalYear = month >= PERIOD_RULES.FISCAL_YEAR_START_MONTH
    ? d.getFullYear()
    : d.getFullYear() - 1
    
  const quarter = Math.ceil(fiscalMonth / 3)
  
  return {
    year: fiscalYear,
    month: fiscalMonth,
    quarter
  }
}