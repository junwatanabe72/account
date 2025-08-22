/**
 * AccountService インタフェース
 * 勘定科目管理の抽象化層
 * 
 * 目的: 依存性逆転の原則を適用し、サービス間の結合度を下げる
 */

// 循環参照を避けるため、型定義は types から import
import { AccountDefinition } from '../../types'
import { HierarchicalAccountInterface } from '../../types/services'

export interface IAccountService {
  // 読み取り専用メソッド
  getAccount(code: string): HierarchicalAccountInterface | undefined
  getAccounts(): HierarchicalAccountInterface[]
  accounts: HierarchicalAccountInterface[]
  
  // 初期化メソッド（必要最小限）
  initializeAccounts(): void
  
  // 更新メソッド（オプション - 実装によっては不要）
  addOrUpdateAccount?(def: AccountDefinition): void
  setAccountActive?(code: string, active: boolean): void
}

// 将来的な拡張のための型定義
export type AccountCode = string
export type AccountBalance = number