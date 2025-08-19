/**
 * @file journalSlice.ts
 * @description 仕訳のUI状態管理スライス
 * 
 * 責務:
 * - 表示中の仕訳一覧の管理
 * - 選択中の仕訳の管理
 * - 仕訳のフィルタリング状態の管理
 * - 仕訳の編集状態の管理
 * - ページネーションの管理
 * 
 * 管理する状態:
 * - journals: 表示中の仕訳一覧
 * - selectedJournal: 選択中の仕訳
 * - filter: フィルタ条件
 * - isLoading: ローディング状態
 * 
 * アーキテクチャ上の位置: Store層（仕訳UIの状態管理）
 */

import { StateCreator } from 'zustand'
import { Journal } from '../../types/accounting'
import { JournalState, JournalActions, StoreState } from '../types'

export interface JournalSlice extends JournalState, JournalActions {}

export const createJournalSlice: StateCreator<
  StoreState,
  [],
  [],
  JournalSlice
> = (set, get) => ({
  // 初期状態
  journals: [],
  selectedJournal: null,
  filterCriteria: {},
  
  // アクション
  loadJournals: () => {
    const { engine } = get()
    if (!engine) {
      console.error('Engine not initialized')
      return
    }
    
    // エンジンから仕訳を読み込み
    const journals = engine.journals || []
    set({ 
      journals,
      lastUpdate: new Date()
    })
    
    console.log(`Loaded ${journals.length} journals`)
  },
  
  addJournal: (journalData: Partial<Journal>) => {
    const { engine } = get()
    if (!engine) {
      set({ error: 'Engine not initialized' })
      return
    }
    
    const journal: Journal = {
      id: `j_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString().split('T')[0],
      number: '',
      description: '',
      status: 'DRAFT',
      details: [],
      ...journalData
    }
    
    // エンジンに仕訳を追加
    engine.journals.push(journal)
    
    set(state => ({
      journals: [...state.journals, journal],
      lastUpdate: new Date()
    }))
    
    get().showToast('success', '仕訳を追加しました')
  },
  
  updateJournal: (id: string, updates: Partial<Journal>) => {
    const { engine } = get()
    if (!engine) {
      set({ error: 'Engine not initialized' })
      return
    }
    
    // エンジン内の仕訳を更新
    const journalIndex = engine.journals.findIndex(j => j.id === id)
    if (journalIndex !== -1) {
      engine.journals[journalIndex] = { ...engine.journals[journalIndex], ...updates }
    }
    
    set(state => ({
      journals: state.journals.map(j => 
        j.id === id ? { ...j, ...updates } : j
      ),
      selectedJournal: state.selectedJournal?.id === id 
        ? { ...state.selectedJournal, ...updates }
        : state.selectedJournal,
      lastUpdate: new Date()
    }))
    
    get().showToast('success', '仕訳を更新しました')
  },
  
  deleteJournal: (id: string) => {
    const { engine } = get()
    if (!engine) {
      set({ error: 'Engine not initialized' })
      return
    }
    
    // エンジンから仕訳を削除
    engine.journals = engine.journals.filter(j => j.id !== id)
    
    set(state => ({
      journals: state.journals.filter(j => j.id !== id),
      selectedJournal: state.selectedJournal?.id === id ? null : state.selectedJournal,
      lastUpdate: new Date()
    }))
    
    get().showToast('success', '仕訳を削除しました')
  },
  
  selectJournal: (journal: Journal | null) => {
    set({ selectedJournal: journal })
  },
  
  setFilterCriteria: (criteria: JournalState['filterCriteria']) => {
    set({ filterCriteria: criteria })
  },
  
  clearFilterCriteria: () => {
    set({ filterCriteria: {} })
  }
})