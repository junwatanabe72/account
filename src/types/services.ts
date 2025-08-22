/**
 * @file services.ts
 * @description サービス層の共通型定義
 * 
 * このファイルは、Domain層のサービスで使用される共通の型定義を提供します。
 * インターフェースと実装の間で共有される型を定義し、循環参照を防ぎます。
 */

import { 
  AccountDefinition, 
  JournalDetail as JournalDetailType,
  JournalStatus,
  AccountType,
  NormalBalance,
  DivisionCode,
  CreateJournalResult,
  JournalData,
  CreateJournalOptions
} from './accounting'

// ========================================
// 勘定科目関連の型定義
// ========================================

/**
 * 階層構造を持つ勘定科目
 */
export interface HierarchicalAccountInterface {
  code: string
  name: string
  type: AccountType
  normalBalance: NormalBalance
  level: number
  parentCode: string | null
  children: HierarchicalAccountInterface[]
  balance: number
  debitBalance: number
  creditBalance: number
  division?: DivisionCode
  isActive?: boolean
  description?: string  // 追加: AccountingEngineで使用
}

/**
 * 補助元帳アカウント
 */
export interface AuxiliaryLedgerInterface {
  code: string
  name: string
  mainAccountCode: string
  balance: number
  debitBalance: number
  creditBalance: number
  transactions: Array<{
    date: string
    description: string
    debitAmount: number
    creditAmount: number
    balance: number
  }>
}

// ========================================
// 仕訳関連の型定義
// ========================================

/**
 * 仕訳明細
 */
export interface JournalDetailInterface {
  accountCode: string
  debitAmount: number
  creditAmount: number
  description?: string
  auxiliaryCode?: string | null
  divisionCode?: DivisionCode
}

/**
 * 仕訳エンティティ
 */
export interface JournalInterface {
  id: string
  date: string
  description: string
  reference?: string
  details: JournalDetailInterface[]
  status: JournalStatus
  meta?: Record<string, any>
  validate(): string[]
}

/**
 * 仕訳作成パラメータ
 */
export interface CreateJournalParams {
  journalData: JournalData
  options?: CreateJournalOptions
}

/**
 * 仕訳更新パラメータ
 */
export interface UpdateJournalParams {
  date?: string
  description?: string
  reference?: string
  details?: JournalDetailInterface[]
}

// ========================================
// 部門関連の型定義
// ========================================

/**
 * 会計部門
 */
export interface AccountingDivisionInterface {
  code: DivisionCode
  name: string
  description?: string
  isActive?: boolean  // オプショナルに変更（既存実装との互換性）
  accounts?: string[]
}

// ========================================
// サービスメソッドの戻り値型
// ========================================

/**
 * 操作結果の統一型
 * 成功/失敗の判定と詳細情報を含む
 */
export interface OperationResult<T = any> {
  success: boolean
  data?: T
  errors?: string[]
  warnings?: string[]
}

/**
 * 仕訳操作の結果型
 * CreateJournalResultの代替として使用
 */
export type JournalOperationResult = OperationResult<JournalInterface>

/**
 * ステータス変更の結果型
 */
export type StatusChangeResult = OperationResult<{ 
  previousStatus: JournalStatus
  newStatus: JournalStatus 
}>

// ========================================
// エクスポート
// ========================================

export type {
  CreateJournalResult as LegacyCreateJournalResult,
  JournalData,
  CreateJournalOptions
} from './accounting'