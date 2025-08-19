import { StateCreator } from 'zustand'
import { Journal, JournalEntry, JournalStatus } from '../../types/accounting'
import { StoreState } from '../types'
import { JOURNAL_STATUS } from '../../constants'

/**
 * 仕訳管理の拡張スライス
 * 動的データとして仕訳を管理
 */

export interface EnhancedJournalState {
  // 動的データ
  journals: Journal[]
  lastJournalNumber: number
  
  // UI状態
  selectedJournalIds: Set<string>
  journalFilter: {
    status?: JournalStatus
    dateFrom?: string
    dateTo?: string
    accountCode?: string
    divisionCode?: string
    amountMin?: number
    amountMax?: number
  }
  journalSort: {
    field: 'date' | 'number' | 'amount' | 'status'
    direction: 'asc' | 'desc'
  }
}

export interface EnhancedJournalActions {
  // CRUD操作
  createJournal: (entries: JournalEntry[], description: string, date?: string, division?: string) => Journal
  updateJournal: (id: string, updates: Partial<Journal>) => boolean
  deleteJournal: (id: string) => boolean
  postJournal: (id: string) => boolean
  unpostJournal: (id: string) => boolean
  
  // 一括操作
  postMultipleJournals: (ids: string[]) => { success: number; failed: number }
  deleteMultipleJournals: (ids: string[]) => { success: number; failed: number }
  
  // フィルター・ソート
  setJournalFilter: (filter: Partial<EnhancedJournalState['journalFilter']>) => void
  clearJournalFilter: () => void
  setJournalSort: (field: EnhancedJournalState['journalSort']['field'], direction?: 'asc' | 'desc') => void
  
  // 選択管理
  selectJournal: (id: string) => void
  deselectJournal: (id: string) => void
  selectAllJournals: () => void
  clearJournalSelection: () => void
  
  // 集計・派生
  getFilteredJournals: () => Journal[]
  getSortedJournals: () => Journal[]
  getJournalsByStatus: (status: JournalStatus) => Journal[]
  getJournalsByPeriod: (startDate: string, endDate: string) => Journal[]
  getTotalsByAccount: (accountCode: string) => { debit: number; credit: number }
  getNextJournalNumber: () => string
}

export interface EnhancedJournalSlice extends EnhancedJournalState, EnhancedJournalActions {}

export const createEnhancedJournalSlice: StateCreator<
  StoreState,
  [],
  [],
  EnhancedJournalSlice
> = (set, get) => ({
  // 初期状態
  journals: [],
  lastJournalNumber: 0,
  selectedJournalIds: new Set(),
  journalFilter: {},
  journalSort: { field: 'date', direction: 'desc' },
  
  // 仕訳作成
  createJournal: (entries, description, date, division) => {
    const state = get()
    const journalNumber = state.getNextJournalNumber()
    
    const newJournal: Journal = {
      id: `j_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      date: date || new Date().toISOString().split('T')[0],
      number: journalNumber,
      description,
      status: JOURNAL_STATUS.POSTED, // 作成時に記帳済みにする
      details: entries.map(entry => ({
        accountCode: entry.accountCode,
        debitAmount: entry.isDebit ? entry.amount : undefined,
        creditAmount: !entry.isDebit ? entry.amount : undefined,
        description: entry.description
      }))
    }
    
    // AccountingEngineにも仕訳を追加
    const { engine } = get()
    if (engine) {
      console.log('=== 仕訳をAccountingEngineに追加 ===')
      console.log('仕訳データ:', newJournal)
      console.log('日付:', newJournal.date)
      console.log('区分:', division)
      console.log('ステータス:', newJournal.status)
      console.log('明細:', newJournal.details)
      
      // engineのcreateJournalメソッドを使用して仕訳を追加
      const journalData = {
        date: newJournal.date,
        description: newJournal.description,
        division: division || 'KANRI', // divisionを追加（デフォルトはKANRI）
        details: newJournal.details.map(d => ({
          accountCode: d.accountCode,
          amount: d.debitAmount || d.creditAmount || 0,
          isDebit: !!d.debitAmount
        }))
      }
      
      const result = engine.createJournal(journalData)
      console.log('Engine.createJournal 結果:', result)
      
      if (result.success && result.data) {
        // 作成された仕訳を記帳
        const postResult = engine.postJournalById(result.data.id)
        console.log('Posted journal:', result.data.id, postResult)
        
        // 作成されたIDを使用
        newJournal.id = result.data.id
      }
    } else {
      console.warn('Engine not available')
    }
    
    set(state => ({
      journals: [...state.journals, newJournal],
      lastJournalNumber: state.lastJournalNumber + 1,
      lastUpdate: new Date()
    }))
    
    get().showToast('success', `仕訳 ${journalNumber} を作成しました`)
    return newJournal
  },
  
  // 仕訳更新
  updateJournal: (id, updates) => {
    const journal = get().journals.find(j => j.id === id)
    if (!journal) {
      get().showToast('error', '仕訳が見つかりません')
      return false
    }
    
    // 記帳済みは編集不可
    if (journal.status === JOURNAL_STATUS.POSTED && !updates.status) {
      get().showToast('error', '記帳済みの仕訳は編集できません')
      return false
    }
    
    set(state => ({
      journals: state.journals.map(j => 
        j.id === id ? { ...j, ...updates } : j
      ),
      lastUpdate: new Date()
    }))
    
    get().showToast('success', '仕訳を更新しました')
    return true
  },
  
  // 仕訳削除
  deleteJournal: (id) => {
    const journal = get().journals.find(j => j.id === id)
    if (!journal) {
      get().showToast('error', '仕訳が見つかりません')
      return false
    }
    
    if (journal.status === JOURNAL_STATUS.POSTED) {
      get().showToast('error', '記帳済みの仕訳は削除できません')
      return false
    }
    
    set(state => ({
      journals: state.journals.filter(j => j.id !== id),
      selectedJournalIds: new Set([...state.selectedJournalIds].filter(sid => sid !== id)),
      lastUpdate: new Date()
    }))
    
    get().showToast('success', '仕訳を削除しました')
    return true
  },
  
  // 記帳
  postJournal: (id) => {
    const journal = get().journals.find(j => j.id === id)
    if (!journal) return false
    
    if (journal.status === JOURNAL_STATUS.POSTED) {
      get().showToast('warning', '既に記帳済みです')
      return false
    }
    
    // 貸借チェック
    const totalDebit = journal.details.reduce((sum, d) => sum + (d.debitAmount || 0), 0)
    const totalCredit = journal.details.reduce((sum, d) => sum + (d.creditAmount || 0), 0)
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      get().showToast('error', '貸借が一致しません')
      return false
    }
    
    // AccountingEngineにも記帳を反映
    const { engine } = get()
    if (engine) {
      engine.postJournalById(id)
    }
    
    set(state => ({
      journals: state.journals.map(j => 
        j.id === id ? { ...j, status: JOURNAL_STATUS.POSTED } : j
      ),
      lastUpdate: new Date()
    }))
    
    get().showToast('success', `仕訳を記帳しました`)
    return true
  },
  
  // 記帳取消
  unpostJournal: (id) => {
    set(state => ({
      journals: state.journals.map(j => 
        j.id === id ? { ...j, status: JOURNAL_STATUS.DRAFT } : j
      ),
      lastUpdate: new Date()
    }))
    
    get().showToast('success', '記帳を取り消しました')
    return true
  },
  
  // 一括記帳
  postMultipleJournals: (ids) => {
    let success = 0
    let failed = 0
    
    ids.forEach(id => {
      if (get().postJournal(id)) {
        success++
      } else {
        failed++
      }
    })
    
    if (success > 0) {
      get().showToast('success', `${success}件の仕訳を記帳しました`)
    }
    if (failed > 0) {
      get().showToast('warning', `${failed}件の仕訳の記帳に失敗しました`)
    }
    
    return { success, failed }
  },
  
  // 一括削除
  deleteMultipleJournals: (ids) => {
    let success = 0
    let failed = 0
    
    ids.forEach(id => {
      if (get().deleteJournal(id)) {
        success++
      } else {
        failed++
      }
    })
    
    return { success, failed }
  },
  
  // フィルター設定
  setJournalFilter: (filter) => {
    set(state => ({
      journalFilter: { ...state.journalFilter, ...filter }
    }))
  },
  
  clearJournalFilter: () => {
    set({ journalFilter: {} })
  },
  
  // ソート設定
  setJournalSort: (field, direction) => {
    set(state => ({
      journalSort: {
        field,
        direction: direction || (state.journalSort.field === field && state.journalSort.direction === 'asc' ? 'desc' : 'asc')
      }
    }))
  },
  
  // 選択管理
  selectJournal: (id) => {
    set(state => ({
      selectedJournalIds: new Set([...state.selectedJournalIds, id])
    }))
  },
  
  deselectJournal: (id) => {
    set(state => ({
      selectedJournalIds: new Set([...state.selectedJournalIds].filter(sid => sid !== id))
    }))
  },
  
  selectAllJournals: () => {
    const filtered = get().getFilteredJournals()
    set({
      selectedJournalIds: new Set(filtered.map(j => j.id))
    })
  },
  
  clearJournalSelection: () => {
    set({ selectedJournalIds: new Set() })
  },
  
  // フィルター済み仕訳取得
  getFilteredJournals: () => {
    const { journals, journalFilter } = get()
    
    return journals.filter(j => {
      if (journalFilter.status && j.status !== journalFilter.status) return false
      if (journalFilter.dateFrom && j.date < journalFilter.dateFrom) return false
      if (journalFilter.dateTo && j.date > journalFilter.dateTo) return false
      if (journalFilter.accountCode) {
        const hasAccount = j.details.some(d => d.accountCode === journalFilter.accountCode)
        if (!hasAccount) return false
      }
      if (journalFilter.amountMin || journalFilter.amountMax) {
        const total = j.details.reduce((sum, d) => sum + (d.debitAmount || 0), 0)
        if (journalFilter.amountMin && total < journalFilter.amountMin) return false
        if (journalFilter.amountMax && total > journalFilter.amountMax) return false
      }
      return true
    })
  },
  
  // ソート済み仕訳取得
  getSortedJournals: () => {
    const { journalSort } = get()
    const filtered = get().getFilteredJournals()
    
    return [...filtered].sort((a, b) => {
      let comparison = 0
      
      switch (journalSort.field) {
        case 'date':
          comparison = a.date.localeCompare(b.date)
          break
        case 'number':
          comparison = a.number.localeCompare(b.number)
          break
        case 'amount':
          const aTotal = a.details.reduce((sum, d) => sum + (d.debitAmount || 0), 0)
          const bTotal = b.details.reduce((sum, d) => sum + (d.debitAmount || 0), 0)
          comparison = aTotal - bTotal
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
      }
      
      return journalSort.direction === 'asc' ? comparison : -comparison
    })
  },
  
  // ステータス別仕訳取得
  getJournalsByStatus: (status) => {
    return get().journals.filter(j => j.status === status)
  },
  
  // 期間別仕訳取得
  getJournalsByPeriod: (startDate, endDate) => {
    return get().journals.filter(j => j.date >= startDate && j.date <= endDate)
  },
  
  // 勘定科目別集計
  getTotalsByAccount: (accountCode) => {
    const journals = get().journals.filter(j => j.status === JOURNAL_STATUS.POSTED)
    let debit = 0
    let credit = 0
    
    journals.forEach(j => {
      j.details.forEach(d => {
        if (d.accountCode === accountCode) {
          debit += d.debitAmount || 0
          credit += d.creditAmount || 0
        }
      })
    })
    
    return { debit, credit }
  },
  
  // 次の仕訳番号取得
  getNextJournalNumber: () => {
    const { lastJournalNumber } = get()
    const nextNumber = lastJournalNumber + 1
    const year = new Date().getFullYear()
    const month = String(new Date().getMonth() + 1).padStart(2, '0')
    return `${year}${month}-${String(nextNumber).padStart(4, '0')}`
  }
})