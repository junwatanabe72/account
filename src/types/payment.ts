/**
 * Phase 14: 銀行入金処理と未収金管理の型定義
 */

/**
 * 未収金管理
 */
export interface Receivable {
  id: string
  unitNumber: string  // 住戸番号
  accountCode: '1301' | '1302' | '1303'  // 1301:管理費未収金, 1302:修繕積立金未収金, 1303:駐車場未収金
  amount: number
  dueDate: string  // YYYY-MM-DD形式
  status: 'outstanding' | 'partially_paid' | 'paid'
  createdDate: string
  clearedDate?: string
  clearedByJournalId?: string
  clearingHistory?: ClearingRecord[]
  memo?: string
}

/**
 * 消し込み履歴
 */
export interface ClearingRecord {
  id: string
  date: string
  amount: number
  journalId: string
  remainingAmount: number
  memo?: string
}

/**
 * 入金照合結果
 */
export interface PaymentMatching {
  id: string
  bankTransactionId: string
  unitNumber?: string
  identifiedPayer?: string
  matchingType: 'exact' | 'partial' | 'over' | 'unidentified'
  confidence: number  // 0-1の信頼度スコア
  standardAmount?: {
    managementFee: number
    repairReserve: number
    parkingFee?: number
  }
  actualAmount: number
  difference: number
  suggestedJournals: SuggestedJournal[]
  manualAdjustments?: ManualAdjustment[]
  status: 'auto_matched' | 'manual_matched' | 'unmatched' | 'pending_review'
}

/**
 * 提案仕訳
 */
export interface SuggestedJournal {
  date: string
  description: string
  debit: JournalDetail[]
  credit: JournalDetail[]
  confidence: number
  reason?: string
}

/**
 * 仕訳明細
 */
export interface JournalDetail {
  accountCode: string
  accountName: string
  amount: number
  division?: string
  memo?: string
}

/**
 * 手動調整
 */
export interface ManualAdjustment {
  field: string
  oldValue: any
  newValue: any
  adjustedBy?: string
  adjustedDate?: string
  reason?: string
}

/**
 * 銀行取引データ（既存の拡張）
 */
export interface BankTransaction {
  id: string
  date: string
  description: string  // 摘要
  depositAmount?: number
  withdrawalAmount?: number
  amount: number  // 正: 入金, 負: 出金
  balance?: number
  bankCode?: string  // 銀行識別子
  transactionType?: 'deposit' | 'withdrawal'
  importBatchId?: string  // インポートバッチID
  status: 'unprocessed' | 'processed' | 'matched' | 'error'
  matchedJournalId?: string
  errorMessage?: string
}

/**
 * インポート結果
 */
export interface ImportResult {
  batchId: string
  total: number
  imported: number
  duplicates: number
  errors: ImportError[]
  transactions: BankTransaction[]
  timestamp: string
}

/**
 * インポートエラー
 */
export interface ImportError {
  row: number
  field?: string
  value?: string
  message: string
  severity: 'warning' | 'error'
}

/**
 * 銀行フォーマットアダプター
 */
export interface BankFormatAdapter {
  bankCode: string
  bankName: string
  parse(rawData: any[]): BankTransaction[]
  validate(data: any): boolean
  getColumnMapping(): ColumnMapping
}

/**
 * カラムマッピング
 */
export interface ColumnMapping {
  date: string
  description: string
  deposit?: string
  withdrawal?: string
  amount?: string
  balance?: string
}

/**
 * 住戸マスタ（標準請求額）
 */
export interface UnitMaster {
  unitNumber: string
  ownerName?: string
  managementFee: number
  repairReserve: number
  parkingFee?: number
  otherFees?: {
    [key: string]: number
  }
  startDate?: string
  endDate?: string
  memo?: string
}

/**
 * 未収金サマリー
 */
export interface ReceivableSummary {
  totalOutstanding: number
  byUnit: Map<string, UnitReceivable>
  byAge: {
    current: number      // 当月
    oneMonth: number     // 1ヶ月延滞
    twoMonths: number    // 2ヶ月延滞
    threeMonthsPlus: number  // 3ヶ月以上
  }
  oldestReceivableDate?: string
  unitCount: number
}

/**
 * 住戸別未収金
 */
export interface UnitReceivable {
  unitNumber: string
  ownerName?: string
  totalAmount: number
  details: {
    managementFee: number
    repairReserve: number
    parkingFee: number
    other: number
  }
  oldestDueDate: string
  monthsOverdue: number
}

/**
 * 消し込み結果
 */
export interface ClearingResult {
  success: boolean
  receivableId?: string
  clearedAmount: number
  remainingAmount: number
  journalId?: string
  message?: string
}

/**
 * 照合設定
 */
export interface MatchingConfig {
  enableAutoMatch: boolean
  minimumConfidence: number  // 自動照合の最小信頼度
  patterns: MatchingPattern[]
  defaultAccountMapping: {
    managementFee: string
    repairReserve: string
    parkingFee?: string
    unidentified: string  // 仮受金
  }
}

/**
 * 照合パターン
 */
export interface MatchingPattern {
  id: string
  name: string
  pattern: string  // 正規表現
  priority: number
  extractionRules: {
    unitNumber?: string
    payerName?: string
    amount?: string
  }
}

/**
 * バッチ処理オプション
 */
export interface BatchProcessingOptions {
  batchSize: number
  retryOnError: boolean
  maxRetries: number
  continueOnError: boolean
  progressCallback?: (progress: ProcessingProgress) => void
}

/**
 * 処理進捗
 */
export interface ProcessingProgress {
  total: number
  processed: number
  succeeded: number
  failed: number
  percentage: number
  currentItem?: string
  estimatedTimeRemaining?: number
}