/**
 * DivisionService インタフェース
 * 会計区分管理の抽象化層
 * 
 * 目的: 会計区分処理を抽象化し、依存性を削減
 */

// 循環参照を避けるため、型定義は types から import
import { DivisionCode } from '../../types'
import { AccountingDivisionInterface } from '../../types/services'

export interface IDivisionService {
  // 読み取り専用メソッド
  getDivision(code: DivisionCode): AccountingDivisionInterface | undefined
  getDivisions(): AccountingDivisionInterface[]
  divisions: AccountingDivisionInterface[]
  
  // 初期化メソッド
  initializeDivisions(): void
  
  // 検証メソッド（オプション）
  isValidDivision?(code: DivisionCode): boolean
}