/**
 * AccountService インタフェース
 * 勘定科目管理の抽象化層
 * 
 * 目的: 依存性逆転の原則を適用し、サービス間の結合度を下げる
 */

import { HierarchicalAccount } from '../services/AccountService'
import { AccountDefinition } from '../../types'

export interface IAccountService {
  // 読み取り専用メソッド
  getAccount(code: string): HierarchicalAccount | undefined
  getAccounts(): HierarchicalAccount[]
  accounts: HierarchicalAccount[]
  
  // 初期化メソッド（必要最小限）
  initializeAccounts(): void
  
  // 更新メソッド（オプション - 実装によっては不要）
  addOrUpdateAccount?(def: AccountDefinition): void
  setAccountActive?(code: string, active: boolean): void
}

// 将来的な拡張のための型定義
export type AccountCode = string
export type AccountBalance = number