/**
 * 統一仕訳データモデル
 * 仕訳入力から明細表示まで一貫して使用
 */

// 仕訳ステータス
export type JournalStatus = 'DRAFT' | 'POSTED' | 'CANCELLED'

// 会計区分（仕訳データ用）
// 注意: COMMONは含まない（COMMONは勘定科目マスタ専用）
export type Division = 'KANRI' | 'SHUZEN' | 'PARKING' | 'OTHER'

// 仕訳明細行
export interface JournalLine {
  id: string
  accountCode: string
  accountName: string
  debitAmount: number
  creditAmount: number
  description?: string
  // 拡張フィールド（フェーズ2以降）
  serviceMonth?: string    // 対象月
  payerId?: string         // 支払者ID・部屋番号
  auxiliaryCode?: string   // 補助科目コード
}

// 仕訳エントリー（統一モデル）
export interface UnifiedJournal {
  // 基本情報
  id: string
  journalNumber: string
  date: string
  description: string
  division: Division
  status: JournalStatus
  
  // 仕訳明細
  lines: JournalLine[]
  
  // メタデータ
  tags?: string[]
  createdAt: string
  updatedAt: string
  createdBy?: string
  
  // 集計情報（自動計算）
  totalDebit: number
  totalCredit: number
  isBalanced: boolean
  
  // 拡張フィールド（フェーズ2以降）
  attachments?: string[]    // 添付ファイルID
  approvedBy?: string       // 承認者
  approvedAt?: string       // 承認日時
  reference?: string        // 参照番号
}

// 仕訳作成時の入力データ
export interface JournalInput {
  date: string
  description: string
  division: Division
  lines: Omit<JournalLine, 'id'>[]
  tags?: string[]
}

// 仕訳検証結果
export interface JournalValidation {
  isValid: boolean
  errors: {
    field?: string
    message: string
  }[]
  warnings?: {
    field?: string
    message: string
  }[]
}

// 仕訳フィルター条件
export interface JournalFilter {
  status?: JournalStatus
  division?: Division
  dateFrom?: string
  dateTo?: string
  accountCode?: string
  amountMin?: number
  amountMax?: number
  tags?: string[]
  searchText?: string
}

// 仕訳ソート条件
export interface JournalSort {
  field: 'date' | 'journalNumber' | 'amount' | 'status' | 'createdAt'
  direction: 'asc' | 'desc'
}

// 仕訳集計情報
export interface JournalSummary {
  totalCount: number
  draftCount: number
  postedCount: number
  cancelledCount: number
  totalDebitAmount: number
  totalCreditAmount: number
  periodStart?: string
  periodEnd?: string
}

// 勘定科目別集計
export interface AccountSummary {
  accountCode: string
  accountName: string
  debitTotal: number
  creditTotal: number
  balance: number
  transactionCount: number
}

// エクスポート用フォーマット
export interface JournalExport {
  version: string
  exportDate: string
  journals: UnifiedJournal[]
  summary: JournalSummary
}