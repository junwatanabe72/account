import { StateCreator } from 'zustand'
import { AccountingEngine } from '../../../02-core/accountingEngine'
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