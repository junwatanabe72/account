/**
 * @file IAccountServiceV2.ts
 * @description AccountServiceインターフェース（改善版）
 * 
 * 目的:
 * - 依存性逆転の原則を適用
 * - サービス間の結合度を下げる
 * - 循環参照を防ぐ
 * 
 * 設計方針:
 * - 実装クラスへの依存を排除
 * - 共通型定義を使用
 * - 必須メソッドとオプションメソッドを明確に区別
 */

import { 
  HierarchicalAccountInterface,
  AuxiliaryLedgerInterface 
} from '../../types/services'
import { AccountDefinition } from '../../types/accounting'

/**
 * AccountServiceの基本インターフェース
 * 読み取り専用操作を中心に定義
 */
export interface IAccountServiceV2 {
  // ========================================
  // 必須メソッド（読み取り専用）
  // ========================================
  
  /**
   * 勘定科目を取得
   */
  getAccount(code: string): HierarchicalAccountInterface | undefined
  
  /**
   * すべての勘定科目を取得
   */
  getAccounts(): HierarchicalAccountInterface[]
  
  /**
   * 勘定科目のプロパティアクセス
   */
  readonly accounts: HierarchicalAccountInterface[]
  
  /**
   * 初期化処理
   */
  initializeAccounts(): void

  // ========================================
  // オプションメソッド（更新操作）
  // ========================================
  
  /**
   * 勘定科目の追加または更新
   */
  addOrUpdateAccount?(def: AccountDefinition): void
  
  /**
   * 勘定科目の有効/無効設定
   */
  setAccountActive?(code: string, active: boolean): void
  
  /**
   * 勘定科目のクリア
   */
  clearAccounts?(): void
  
  /**
   * 勘定科目の再構築
   */
  rebuildAccountsFrom?(defs: AccountDefinition[]): void
  
  /**
   * 補助元帳の再構築
   */
  rebuildAuxiliaryAccounts?(): void
}

/**
 * AccountServiceの拡張インターフェース
 * 具象実装で提供される追加機能
 */
export interface IAccountServiceExtended extends IAccountServiceV2 {
  // 補助元帳関連
  getAuxiliaryLedger(code: string): AuxiliaryLedgerInterface | undefined
  getAuxiliaryLedgers(): AuxiliaryLedgerInterface[]
  
  // 残高計算
  calculateBalance(code: string): number
  calculateTrialBalance(): {
    totalDebit: number
    totalCredit: number
    isBalanced: boolean
  }
  
  // 階層構造の操作
  getChildAccounts(parentCode: string): HierarchicalAccountInterface[]
  getAccountHierarchy(): HierarchicalAccountInterface[]
}