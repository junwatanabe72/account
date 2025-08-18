/**
 * @file accountingSlice.ts
 * @description 会計エンジンの状態管理スライス
 * 
 * 責務:
 * - AccountingEngineインスタンスのライフサイクル管理
 * - 会計エンジンの初期化状態の管理
 * - UI層からドメイン層へのアクセスポイント提供
 * - エンジンの更新と再初期化の制御
 * 
 * 管理する状態:
 * - engine: AccountingEngineインスタンス
 * - isInitialized: 初期化状態フラグ
 * - lastUpdate: 最終更新日時
 * 
 * アーキテクチャ上の位置: Store層（UIとDomainの仲介）
 */

import { StateCreator } from 'zustand'
import { AccountingEngine } from '../../domain/accountingEngine'
import { AccountingState, AccountingActions, StoreState } from '../types'

export interface AccountingSlice extends AccountingState, AccountingActions {}

export const createAccountingSlice: StateCreator<
  StoreState,
  [],
  [],
  AccountingSlice
> = (set, get) => ({
  // 初期状態
  engine: null,
  isInitialized: false,
  lastUpdate: null,
  
  // アクション
  initializeEngine: () => {
    const engine = new AccountingEngine()
    // コンストラクタ内で既に初期化されている
    
    set({
      engine,
      isInitialized: true,
      lastUpdate: new Date()
    })
    
    console.log('AccountingEngine initialized')
  },
  
  resetEngine: () => {
    const engine = new AccountingEngine()
    engine.clearAll()
    
    set({
      engine,
      isInitialized: false,
      lastUpdate: new Date()
    })
    
    console.log('AccountingEngine reset')
  },
  
  updateEngine: (updater) => {
    const { engine } = get()
    if (!engine) {
      console.error('Engine not initialized')
      return
    }
    
    updater(engine)
    
    set({
      engine: engine, // クラスインスタンスはそのまま設定
      lastUpdate: new Date()
    })
  }
})