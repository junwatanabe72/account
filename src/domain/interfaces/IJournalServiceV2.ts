/**
 * @file IJournalServiceV2.ts
 * @description JournalServiceインターフェース（改善版）
 * 
 * 目的:
 * - サービス間の依存を抽象化
 * - テスタビリティの向上
 * - 型安全性の強化
 * 
 * 設計方針:
 * - 統一された戻り値型（OperationResult）
 * - 実装への依存を排除
 * - 段階的な移行をサポート
 */

import { 
  JournalInterface,
  CreateJournalParams,
  UpdateJournalParams
} from '../../types/services'

// 再エクスポート
export type { 
  JournalOperationResult,
  StatusChangeResult 
} from '../../types/services'
import { CreateJournalResult } from '../../types/accounting'

/**
 * JournalServiceの基本インターフェース
 */
export interface IJournalServiceV2 {
  // ========================================
  // 必須メソッド（読み取り専用）
  // ========================================
  
  /**
   * すべての仕訳を取得
   */
  getJournals(): JournalInterface[]
  
  /**
   * 特定の仕訳を取得
   */
  getJournal(id: string): JournalInterface | undefined
  
  // ========================================
  // 必須メソッド（作成・更新）
  // ========================================
  
  /**
   * 仕訳を作成（新しいインターフェース）
   */
  createJournalV2(params: CreateJournalParams): JournalOperationResult
  
  /**
   * 仕訳を作成（レガシー互換）
   */
  createJournal(journalData: any, options?: any): CreateJournalResult
  
  // ========================================
  // オプションメソッド（ステータス管理）
  // ========================================
  
  /**
   * 仕訳を提出（新しいインターフェース）
   */
  submitJournalV2?(id: string): StatusChangeResult
  
  /**
   * 仕訳を承認（新しいインターフェース）
   */
  approveJournalV2?(id: string): StatusChangeResult
  
  /**
   * 仕訳を転記（新しいインターフェース）
   */
  postJournalV2?(id: string): StatusChangeResult
  
  /**
   * 仕訳を削除（新しいインターフェース）
   */
  deleteJournalV2?(id: string): JournalOperationResult
  
  /**
   * 仕訳を更新（新しいインターフェース）
   */
  updateJournalV2?(id: string, params: UpdateJournalParams): JournalOperationResult
  
  // ========================================
  // レガシー互換メソッド（段階的に廃止）
  // ========================================
  
  /**
   * 仕訳を提出（レガシー）
   * @deprecated Use submitJournalV2 instead
   */
  submitJournal?(id: string): CreateJournalResult | boolean
  
  /**
   * 仕訳を承認（レガシー）
   * @deprecated Use approveJournalV2 instead
   */
  approveJournal?(id: string): CreateJournalResult | boolean
  
  /**
   * 仕訳を転記（レガシー）
   * @deprecated Use postJournalV2 instead
   */
  postJournalById?(id: string): CreateJournalResult | boolean
  
  /**
   * 仕訳を削除（レガシー）
   * @deprecated Use deleteJournalV2 instead
   */
  deleteJournal?(id: string): CreateJournalResult | boolean
  
  /**
   * 仕訳を更新（レガシー）
   * @deprecated Use updateJournalV2 instead
   */
  updateJournal?(id: string, data: any): CreateJournalResult | boolean
  
  // ========================================
  // オプションメソッド（その他）
  // ========================================
  
  /**
   * 仕訳をクリア
   */
  clearJournals?(): void
  
  /**
   * プロパティアクセス（レガシー互換）
   */
  journals?: JournalInterface[]
}

/**
 * JournalServiceの拡張インターフェース
 * 具象実装で提供される追加機能
 */
export interface IJournalServiceExtended extends IJournalServiceV2 {
  // 検証機能
  validateJournal(journalData: any): string[]
  validateBalance(details: any[]): boolean
  
  // 集計機能
  getJournalsByDateRange(startDate: string, endDate: string): JournalInterface[]
  getJournalsByStatus(status: string): JournalInterface[]
  getJournalsByAccount(accountCode: string): JournalInterface[]
  
  // バッチ処理
  batchPost(ids: string[]): Map<string, StatusChangeResult>
  batchApprove(ids: string[]): Map<string, StatusChangeResult>
}