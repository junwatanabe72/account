// 統一された用語定義
// マンション管理組合会計システム全体で使用する標準用語

/**
 * 用語の統一ルール:
 * 
 * 1. description (摘要)
 *    - 取引や仕訳の内容を説明する主要なテキスト
 *    - 例: "3月分管理費収入", "エレベーター保守点検費"
 *    - 必須項目として扱う
 * 
 * 2. note (備考)
 *    - 補足情報や詳細説明のためのテキスト
 *    - 例: "3/15に実施", "年間契約の3月分"
 *    - 任意項目として扱う
 * 
 * 3. reference (参照番号)
 *    - 伝票番号、請求書番号などの管理番号
 *    - 例: "INV-2024-001", "自動生成"
 *    - 任意項目として扱う
 * 
 * 4. divisionCode (会計区分コード)
 *    - 一般会計/特別会計を識別するコード
 *    - 必須項目として扱う
 * 
 * 5. accountCode (勘定科目コード)
 *    - 勘定科目を識別する数字コード
 *    - 例: "4111" (管理費収入)
 * 
 * 6. amount (金額)
 *    - 取引金額（常に正の数）
 *    - debitAmount/creditAmountは仕訳明細でのみ使用
 */

// 標準化された仕訳データ型
export interface StandardJournalData {
  id: string                    // 仕訳ID
  date: string                  // 日付 (YYYY-MM-DD)
  description: string           // 摘要（必須）
  reference?: string            // 参照番号（任意）
  note?: string                // 備考（任意）
  divisionCode: string         // 会計区分コード（必須）
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'POSTED'
  details: StandardJournalDetail[]
  createdAt: Date
  updatedAt?: Date
}

// 標準化された仕訳明細
export interface StandardJournalDetail {
  accountCode: string          // 勘定科目コード
  debitAmount: number         // 借方金額
  creditAmount: number        // 貸方金額
  note?: string              // 明細備考（任意）
  auxiliaryCode?: string     // 補助科目コード（任意）
}

// 標準化された取引データ型
export interface StandardTransaction {
  id: string                    // 取引ID
  type: 'income' | 'expense' | 'transfer'  // 取引種別
  divisionCode: string          // 会計区分コード（必須）
  occurredOn: string           // 発生日 (YYYY-MM-DD)
  accountCode: string          // 勘定科目コード
  amount: number               // 金額（税込）
  description: string          // 摘要（必須）
  reference?: string           // 参照番号（任意）
  note?: string               // 備考（任意）
  status: 'unpaid' | 'paid'   // 決済ステータス
  paymentAccountCode?: string // 決済口座コード
  counterpartyId?: string     // 取引先ID
  dueOn?: string              // 決済期日
  tags?: string[]             // タグ
  taxCategory?: string        // 税区分
  journalId?: string          // 生成された仕訳ID
  createdAt: Date
  updatedAt?: Date
}

// 用語マッピング（旧→新）
export const TERMINOLOGY_MAPPING = {
  // 日本語
  '摘要': 'description',
  '備考': 'note',
  '参照': 'reference',
  '伝票番号': 'reference',
  '説明': 'description',
  'メモ': 'note',
  
  // 英語の類似語
  'memo': 'note',
  'notes': 'note',
  'remark': 'note',
  'comment': 'note',
  'details': 'description',
  'summary': 'description',
  'explanation': 'description',
  'referenceNumber': 'reference',
  'voucherNumber': 'reference',
  'documentNumber': 'reference'
}

// フィールドラベル（UI表示用）
export const FIELD_LABELS = {
  description: '摘要',
  note: '備考',
  reference: '参照番号',
  divisionCode: '会計区分',
  accountCode: '勘定科目',
  amount: '金額',
  debitAmount: '借方金額',
  creditAmount: '貸方金額',
  date: '日付',
  occurredOn: '発生日',
  dueOn: '決済期日',
  status: 'ステータス',
  counterpartyId: '取引先',
  paymentAccountCode: '決済口座',
  tags: 'タグ',
  taxCategory: '税区分'
}

// フィールドのプレースホルダー（UI表示用）
export const FIELD_PLACEHOLDERS = {
  description: '例: 3月分管理費収入',
  note: '例: 年間契約の3月分',
  reference: '例: INV-2024-001',
  amount: '0',
  date: 'YYYY-MM-DD',
  tags: 'タグ1, タグ2, ...'
}

// バリデーションメッセージ
export const VALIDATION_MESSAGES = {
  descriptionRequired: '摘要は必須です',
  divisionCodeRequired: '会計区分は必須です',
  accountCodeRequired: '勘定科目は必須です',
  amountRequired: '金額は必須です',
  amountPositive: '金額は0より大きい値を入力してください',
  dateRequired: '日付は必須です',
  dateInvalid: '日付の形式が正しくありません',
  balanceNotMatched: '貸借が一致していません'
}

// データ型の変換ヘルパー
export function normalizeTerminology(data: any): any {
  const normalized = { ...data }
  
  // 用語の統一
  Object.entries(TERMINOLOGY_MAPPING).forEach(([old, newTerm]) => {
    if (old in normalized) {
      normalized[newTerm] = normalized[old]
      if (old !== newTerm) {
        delete normalized[old]
      }
    }
  })
  
  return normalized
}