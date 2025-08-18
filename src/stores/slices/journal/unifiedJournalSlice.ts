/**
 * 統一仕訳ストア
 * 仕訳データの状態管理
 */

import { StateCreator } from 'zustand'
import {
  UnifiedJournal,
  JournalInput,
  JournalFilter,
  JournalSort,
  JournalStatus,
  JournalSummary,
  AccountSummary
} from '../../types/journal'
import { JournalService } from '../../services/journalService'
import { StoreState } from '../types'

export interface UnifiedJournalState {
  // データ
  journals: UnifiedJournal[]
  
  // UI状態
  selectedJournalIds: Set<string>
  filter: JournalFilter
  sort: JournalSort
  
  // 編集状態
  editingJournal: UnifiedJournal | null
  isCreating: boolean
}

export interface UnifiedJournalActions {
  // CRUD操作
  createJournal: (input: JournalInput) => UnifiedJournal | null
  updateJournal: (id: string, updates: Partial<UnifiedJournal>) => boolean
  deleteJournal: (id: string) => boolean
  deleteMultipleJournals: (ids: string[]) => number
  
  // ステータス変更
  postJournal: (id: string) => boolean
  cancelJournal: (id: string) => boolean
  postMultipleJournals: (ids: string[]) => number
  
  // フィルター・ソート
  setFilter: (filter: Partial<JournalFilter>) => void
  clearFilter: () => void
  setSort: (sort: JournalSort) => void
  
  // 選択管理
  selectJournal: (id: string) => void
  deselectJournal: (id: string) => void
  selectAllJournals: () => void
  clearSelection: () => void
  
  // 編集管理
  startEditing: (journal: UnifiedJournal) => void
  stopEditing: () => void
  setCreating: (isCreating: boolean) => void
  
  // 取得・集計
  getFilteredJournals: () => UnifiedJournal[]
  getSortedJournals: () => UnifiedJournal[]
  getJournalById: (id: string) => UnifiedJournal | undefined
  getJournalSummary: () => JournalSummary
  getAccountSummary: () => AccountSummary[]
  
  // データ管理
  importJournals: (journals: UnifiedJournal[]) => void
  exportJournals: () => UnifiedJournal[]
  clearAllJournals: () => void
}

export interface UnifiedJournalSlice extends UnifiedJournalState, UnifiedJournalActions {}

export const createUnifiedJournalSlice: StateCreator<
  StoreState,
  [],
  [],
  UnifiedJournalSlice
> = (set, get) => {
  const journalService = JournalService.getInstance()
  
  return {
    // 初期状態
    journals: [],
    selectedJournalIds: new Set(),
    filter: {},
    sort: { field: 'date', direction: 'desc' },
    editingJournal: null,
    isCreating: false,
    
    // 仕訳作成
    createJournal: (input) => {
      const validation = journalService.validateJournal(input)
      if (!validation.isValid) {
        const { showToast } = get()
        showToast('error', validation.errors[0].message)
        return null
      }
      
      const newJournal = journalService.createJournal(input)
      
      set(state => ({
        journals: [...state.journals, newJournal]
      }))
      
      const { showToast } = get()
      showToast('success', '仕訳を作成しました')
      
      return newJournal
    },
    
    // 仕訳更新
    updateJournal: (id, updates) => {
      const journal = get().journals.find(j => j.id === id)
      if (!journal) return false
      
      const updatedJournal = { ...journal, ...updates, updatedAt: new Date().toISOString() }
      
      // 合計を再計算
      if (updates.lines) {
        const totals = journalService.calculateTotals(updates.lines)
        updatedJournal.totalDebit = totals.totalDebit
        updatedJournal.totalCredit = totals.totalCredit
        updatedJournal.isBalanced = Math.abs(totals.totalDebit - totals.totalCredit) < 0.01
      }
      
      // 検証
      const validation = journalService.validateJournal(updatedJournal)
      if (!validation.isValid) {
        const { showToast } = get()
        showToast('error', validation.errors[0].message)
        return false
      }
      
      set(state => ({
        journals: state.journals.map(j => j.id === id ? updatedJournal : j)
      }))
      
      const { showToast } = get()
      showToast('success', '仕訳を更新しました')
      
      return true
    },
    
    // 仕訳削除
    deleteJournal: (id) => {
      const journal = get().journals.find(j => j.id === id)
      if (!journal) return false
      
      if (journal.status === 'POSTED') {
        const { showToast } = get()
        showToast('error', '記帳済みの仕訳は削除できません')
        return false
      }
      
      set(state => ({
        journals: state.journals.filter(j => j.id !== id),
        selectedJournalIds: new Set([...state.selectedJournalIds].filter(sid => sid !== id))
      }))
      
      const { showToast } = get()
      showToast('success', '仕訳を削除しました')
      
      return true
    },
    
    // 複数削除
    deleteMultipleJournals: (ids) => {
      let deletedCount = 0
      ids.forEach(id => {
        if (get().deleteJournal(id)) {
          deletedCount++
        }
      })
      return deletedCount
    },
    
    // 記帳
    postJournal: (id) => {
      const journal = get().journals.find(j => j.id === id)
      if (!journal || journal.status === 'POSTED') return false
      
      if (!journal.isBalanced) {
        const { showToast } = get()
        showToast('error', '貸借が一致していない仕訳は記帳できません')
        return false
      }
      
      set(state => ({
        journals: state.journals.map(j => 
          j.id === id ? { ...j, status: 'POSTED' as JournalStatus } : j
        )
      }))
      
      const { showToast } = get()
      showToast('success', '仕訳を記帳しました')
      
      return true
    },
    
    // 取消
    cancelJournal: (id) => {
      const journal = get().journals.find(j => j.id === id)
      if (!journal || journal.status === 'CANCELLED') return false
      
      set(state => ({
        journals: state.journals.map(j => 
          j.id === id ? { ...j, status: 'CANCELLED' as JournalStatus } : j
        )
      }))
      
      const { showToast } = get()
      showToast('success', '仕訳を取り消しました')
      
      return true
    },
    
    // 複数記帳
    postMultipleJournals: (ids) => {
      let postedCount = 0
      ids.forEach(id => {
        if (get().postJournal(id)) {
          postedCount++
        }
      })
      return postedCount
    },
    
    // フィルター設定
    setFilter: (filter) => {
      set(state => ({
        filter: { ...state.filter, ...filter }
      }))
    },
    
    // フィルタークリア
    clearFilter: () => {
      set({ filter: {} })
    },
    
    // ソート設定
    setSort: (sort) => {
      set({ sort })
    },
    
    // 選択
    selectJournal: (id) => {
      set(state => ({
        selectedJournalIds: new Set([...state.selectedJournalIds, id])
      }))
    },
    
    // 選択解除
    deselectJournal: (id) => {
      set(state => ({
        selectedJournalIds: new Set([...state.selectedJournalIds].filter(sid => sid !== id))
      }))
    },
    
    // 全選択
    selectAllJournals: () => {
      const filteredJournals = get().getFilteredJournals()
      set({
        selectedJournalIds: new Set(filteredJournals.map(j => j.id))
      })
    },
    
    // 選択クリア
    clearSelection: () => {
      set({ selectedJournalIds: new Set() })
    },
    
    // 編集開始
    startEditing: (journal) => {
      set({ editingJournal: journal })
    },
    
    // 編集終了
    stopEditing: () => {
      set({ editingJournal: null })
    },
    
    // 作成モード設定
    setCreating: (isCreating) => {
      set({ isCreating })
    },
    
    // フィルター済み仕訳取得
    getFilteredJournals: () => {
      const { journals, filter } = get()
      return journalService.filterJournals(journals, filter)
    },
    
    // ソート済み仕訳取得
    getSortedJournals: () => {
      const filtered = get().getFilteredJournals()
      const { sort } = get()
      return journalService.sortJournals(filtered, sort)
    },
    
    // ID検索
    getJournalById: (id) => {
      return get().journals.find(j => j.id === id)
    },
    
    // サマリー取得
    getJournalSummary: () => {
      const { journals } = get()
      const now = new Date().toISOString().split('T')[0]
      
      return {
        totalCount: journals.length,
        draftCount: journals.filter(j => j.status === 'DRAFT').length,
        postedCount: journals.filter(j => j.status === 'POSTED').length,
        cancelledCount: journals.filter(j => j.status === 'CANCELLED').length,
        totalDebitAmount: journals.reduce((sum, j) => sum + j.totalDebit, 0),
        totalCreditAmount: journals.reduce((sum, j) => sum + j.totalCredit, 0),
        periodStart: journals.length > 0 ? journals[0].date : now,
        periodEnd: journals.length > 0 ? journals[journals.length - 1].date : now
      }
    },
    
    // 勘定科目別サマリー
    getAccountSummary: () => {
      const { journals } = get()
      return journalService.summarizeByAccount(journals)
    },
    
    // インポート
    importJournals: (journals) => {
      set({ journals })
      const { showToast } = get()
      showToast('success', `${journals.length}件の仕訳をインポートしました`)
    },
    
    // エクスポート
    exportJournals: () => {
      return get().journals
    },
    
    // 全削除
    clearAllJournals: () => {
      set({ 
        journals: [], 
        selectedJournalIds: new Set(),
        editingJournal: null 
      })
      const { showToast } = get()
      showToast('info', 'すべての仕訳を削除しました')
    }
  }
}