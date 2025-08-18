/**
 * @fileoverview 仕訳関連の型定義
 * @module 01-types/journal
 * @description
 * 仕訳（Journal）に関するすべての型定義を提供します。
 * 仕訳入力から明細表示まで一貫して使用される統一モデルです。
 * 
 * @責務
 * - 仕訳エンティティの型定義
 * - 仕訳操作に関する型定義
 * - 仕訳検証・フィルタリングの型定義
 * 
 * @使用例
 * ```typescript
 * import { UnifiedJournal, JournalStatus, Division } from '@/01-types/journal';
 * ```
 * 
 * @更新履歴
 * - 2024-11-17: フォルダ構造再編成
 */

import { ID, DateString, DateTimeString, Amount } from './core';

/**
 * 仕訳ステータス
 * @description 仕訳の処理状態を表す
 */
export type JournalStatus = 'DRAFT' | 'POSTED' | 'CANCELLED'

/**
 * 会計区分
 * @description 管理会計と修繕会計の区分
 */
export type Division = 'KANRI' | 'SHUZEN'

/**
 * 仕訳明細行
 * @description 仕訳の個別明細行（借方/貸方）
 */
export interface JournalLine {
  id: ID
  accountCode: string
  accountName: string
  debitAmount: Amount
  creditAmount: Amount
  description?: string
  // 拡張フィールド（フェーズ2以降）
  serviceMonth?: string    // 対象月
  payerId?: string         // 支払者ID・部屋番号
  auxiliaryCode?: string   // 補助科目コード
}

// 仕訳エントリー（統一モデル）
export interface UnifiedJournal {
  // 基本情報
  id: ID
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