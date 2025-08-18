/**
 * DivisionService インタフェース
 * 会計区分管理の抽象化層
 * 
 * 目的: 会計区分処理を抽象化し、依存性を削減
 */

import { AccountingDivision } from '../services/DivisionService'
import { DivisionCode } from '../../types'

export interface IDivisionService {
  // 読み取り専用メソッド
  getDivision(code: DivisionCode): AccountingDivision | undefined
  getDivisions(): AccountingDivision[]
  divisions: AccountingDivision[]
  
  // 初期化メソッド
  initializeDivisions(): void
  
  // 検証メソッド（オプション）
  isValidDivision?(code: DivisionCode): boolean
}