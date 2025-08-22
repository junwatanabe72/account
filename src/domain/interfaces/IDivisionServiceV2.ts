/**
 * @file IDivisionServiceV2.ts
 * @description DivisionServiceインターフェース（改善版）
 * 
 * 目的:
 * - 部門管理の抽象化
 * - 循環参照の防止
 * - 型安全性の向上
 */

import { AccountingDivisionInterface } from '../../types/services'
import { DivisionCode } from '../../types/accounting'

/**
 * DivisionServiceの基本インターフェース
 */
export interface IDivisionServiceV2 {
  // ========================================
  // 必須メソッド（読み取り専用）
  // ========================================
  
  /**
   * 部門を取得
   */
  getDivision(code: DivisionCode): AccountingDivisionInterface | undefined
  
  /**
   * すべての部門を取得
   */
  getDivisions(): AccountingDivisionInterface[]
  
  /**
   * 部門のプロパティアクセス
   */
  readonly divisions: AccountingDivisionInterface[]
  
  /**
   * 初期化処理
   */
  initializeDivisions(): void
  
  // ========================================
  // オプションメソッド（更新操作）
  // ========================================
  
  /**
   * 部門の追加
   */
  addDivision?(division: AccountingDivisionInterface): void
  
  /**
   * 部門の更新
   */
  updateDivision?(code: DivisionCode, updates: Partial<AccountingDivisionInterface>): void
  
  /**
   * 部門の削除
   */
  removeDivision?(code: DivisionCode): void
  
  /**
   * 部門のクリア
   */
  clearDivisions?(): void
}

/**
 * DivisionServiceの拡張インターフェース
 */
export interface IDivisionServiceExtended extends IDivisionServiceV2 {
  // 部門と勘定科目の関連
  getAccountsByDivision(code: DivisionCode): string[]
  assignAccountToDivision(accountCode: string, divisionCode: DivisionCode): void
  removeAccountFromDivision(accountCode: string, divisionCode: DivisionCode): void
  
  // 部門別集計
  getDivisionBalance(code: DivisionCode): {
    totalDebit: number
    totalCredit: number
    balance: number
  }
  
  // 検証
  validateDivisionCode(code: DivisionCode): boolean
  isDivisionActive(code: DivisionCode): boolean
}