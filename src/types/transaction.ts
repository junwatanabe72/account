// Freee型の取引データモデル

// 取引タイプ
export type TransactionType = 'income' | 'expense' | 'transfer'

// 決済ステータス
export type PaymentStatus = 'unpaid' | 'paid'

// 取引データ（ユーザー入力）
export interface Transaction {
  id: string                           // 取引ID
  type: TransactionType                // 取引種別
  divisionCode: string                 // 会計区分コード（一般会計/特別会計）
  occurredOn: string                   // 発生日（YYYY-MM-DD）
  accountCode: string                  // 勘定科目コード
  amount: number                       // 金額（税込）
  status: PaymentStatus                // 決済ステータス
  paymentAccountCode?: string          // 決済口座（決済済みの場合）
  counterpartyId?: string              // 取引先ID
  dueOn?: string                       // 決済期日（YYYY-MM-DD）
  tags?: string[]                      // タグ
  note?: string                        // 備考
  taxCategory?: string                 // 税区分
  journalId?: string                   // 生成された仕訳ID
  createdAt: Date                      // 作成日時
  updatedAt?: Date                     // 更新日時
}

// 取引作成用の入力データ
export interface TransactionInput {
  type: TransactionType
  divisionCode: string
  occurredOn: string
  accountCode: string
  amount: number
  status: PaymentStatus
  paymentAccountCode?: string
  counterpartyId?: string
  dueOn?: string
  tags?: string[]
  note?: string
  taxCategory?: string
}

// 取引先データ
export interface Counterparty {
  id: string
  name: string
  code?: string
  paymentTerms?: PaymentTerms          // 支払条件
  bankAccount?: string                 // 銀行口座
  contact?: string                     // 連絡先
  tags?: string[]
  isActive: boolean
}

// 支払条件
export interface PaymentTerms {
  type: 'immediate' | 'end_of_month' | 'end_of_next_month' | 'custom'
  customDays?: number                  // カスタムの場合の日数
  description?: string                 // 説明（例：月末締め翌月末払い）
}

// 取引テンプレート
export interface TransactionTemplate {
  id: string
  name: string
  description?: string
  type: TransactionType
  accountCode: string
  defaultAmount?: number
  counterpartyId?: string
  tags?: string[]
  taxCategory?: string
  isActive: boolean
}

// 仕訳生成ルール
export interface JournalGenerationRule {
  id: string
  name: string
  condition: RuleCondition
  journalPattern: JournalPattern
  priority: number                     // 優先度（数値が大きいほど優先）
  isActive: boolean
}

// ルール条件
export interface RuleCondition {
  transactionType?: TransactionType
  paymentStatus?: PaymentStatus
  accountCode?: string
  accountType?: string                 // 勘定科目タイプ
  amountRange?: {
    min?: number
    max?: number
  }
  tags?: string[]
}

// 仕訳パターン
export interface JournalPattern {
  debitAccountCode?: string            // 借方勘定科目（動的の場合は空）
  creditAccountCode?: string           // 貸方勘定科目（動的の場合は空）
  useTransactionAccount?: 'debit' | 'credit'  // 取引の勘定科目を使用
  usePaymentAccount?: 'debit' | 'credit'      // 決済口座を使用
  useDefaultAccount?: {                         // デフォルト勘定科目を使用
    position: 'debit' | 'credit'
    accountCode: string
  }
}

// 取引検索条件
export interface TransactionSearchCriteria {
  type?: TransactionType[]
  status?: PaymentStatus[]
  accountCodes?: string[]
  counterpartyIds?: string[]
  dateFrom?: string
  dateTo?: string
  amountMin?: number
  amountMax?: number
  tags?: string[]
  hasJournal?: boolean
}

// 取引集計
export interface TransactionSummary {
  totalIncome: number
  totalExpense: number
  totalTransfer: number
  unpaidIncome: number
  unpaidExpense: number
  periodFrom: string
  periodTo: string
  byAccount: Array<{
    accountCode: string
    accountName: string
    amount: number
    count: number
  }>
  byCounterparty: Array<{
    counterpartyId: string
    counterpartyName: string
    amount: number
    count: number
  }>
}

// 仕訳プレビュー（表示用）
export interface JournalPreview {
  date: string
  entries: Array<{
    debitAccount: string
    debitAmount: number
    creditAccount: string
    creditAmount: number
    taxCategory?: string
  }>
  isBalanced: boolean
  totalAmount: number
}

// 取引インポート結果
export interface TransactionImportResult {
  success: boolean
  imported: number
  failed: number
  errors?: Array<{
    row: number
    message: string
    data?: any
  }>
  transactions?: Transaction[]
}

// 取引バリデーション結果
export interface TransactionValidationResult {
  isValid: boolean
  errors?: string[]
  warnings?: string[]
}