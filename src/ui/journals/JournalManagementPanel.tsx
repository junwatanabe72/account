import React, { useState, useEffect } from 'react'
import useStore from '../../stores'
import { Journal, JournalEntry } from '../../types/accounting'
import { JOURNAL_STATUS } from '../../constants'
import styles from '../styles/master.module.css'

/**
 * 仕訳管理パネル
 * 拡張されたZustand仕訳管理機能を使用
 */
export const JournalManagementPanel: React.FC = () => {
  const {
    // 基本データ
    journals,
    selectedJournalIds,
    journalFilter,
    journalSort,
    
    // CRUD操作
    createJournal,
    updateJournal,
    deleteJournal,
    postJournal,
    unpostJournal,
    
    // 一括操作
    postMultipleJournals,
    deleteMultipleJournals,
    
    // フィルター・ソート
    setJournalFilter,
    clearJournalFilter,
    setJournalSort,
    
    // 選択管理
    selectJournal,
    deselectJournal,
    selectAllJournals,
    clearJournalSelection,
    
    // 集計・派生
    getSortedJournals,
    getJournalsByStatus,
    getNextJournalNumber,
    
    // UI
    showToast
  } = useStore()
  
  // ローカル状態
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newJournalData, setNewJournalData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    entries: [] as JournalEntry[]
  })
  
  // ソート済み仕訳の取得
  const sortedJournals = getSortedJournals()
  
  // 統計情報
  const stats = {
    total: journals.length,
    draft: getJournalsByStatus(JOURNAL_STATUS.DRAFT).length,
    posted: getJournalsByStatus(JOURNAL_STATUS.POSTED).length,
    selected: selectedJournalIds.size
  }
  
  // 仕訳作成
  const handleCreateJournal = () => {
    if (!newJournalData.description || newJournalData.entries.length === 0) {
      showToast('error', '仕訳明細と摘要を入力してください')
      return
    }
    
    // 貸借チェック
    const totalDebit = newJournalData.entries
      .filter(e => e.isDebit)
      .reduce((sum, e) => sum + e.amount, 0)
    const totalCredit = newJournalData.entries
      .filter(e => !e.isDebit)
      .reduce((sum, e) => sum + e.amount, 0)
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      showToast('error', '貸借が一致しません')
      return
    }
    
    createJournal(
      newJournalData.entries,
      newJournalData.description,
      newJournalData.date
    )
    
    // フォームリセット
    setNewJournalData({
      date: new Date().toISOString().split('T')[0],
      description: '',
      entries: []
    })
    setIsCreating(false)
  }
  
  // 一括操作
  const handleBatchPost = () => {
    const ids = Array.from(selectedJournalIds)
    if (ids.length === 0) {
      showToast('warning', '仕訳を選択してください')
      return
    }
    
    const result = postMultipleJournals(ids)
    clearJournalSelection()
  }
  
  const handleBatchDelete = () => {
    const ids = Array.from(selectedJournalIds)
    if (ids.length === 0) {
      showToast('warning', '仕訳を選択してください')
      return
    }
    
    if (!confirm(`${ids.length}件の仕訳を削除してもよろしいですか？`)) {
      return
    }
    
    const result = deleteMultipleJournals(ids)
    clearJournalSelection()
  }
  
  // 選択切り替え
  const toggleSelection = (id: string) => {
    if (selectedJournalIds.has(id)) {
      deselectJournal(id)
    } else {
      selectJournal(id)
    }
  }
  
  return (
    <div className={styles.masterContainer}>
      {/* ヘッダー */}
      <div className={styles.masterHeader}>
        <h2>仕訳管理（拡張版）</h2>
        <div className={styles.headerActions}>
          <button 
            className={styles.primaryButton}
            onClick={() => setIsCreating(true)}
          >
            新規仕訳
          </button>
        </div>
      </div>
      
      {/* 統計情報 */}
      <div className={styles.statsContainer}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>総仕訳数</span>
          <span className={styles.statValue}>{stats.total}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>下書き</span>
          <span className={styles.statValue}>{stats.draft}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>記帳済</span>
          <span className={styles.statValue}>{stats.posted}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>選択中</span>
          <span className={styles.statValue}>{stats.selected}</span>
        </div>
      </div>
      
      {/* フィルター */}
      <div className={styles.filterContainer}>
        <div className={styles.filterGroup}>
          <label>ステータス</label>
          <select
            value={journalFilter.status || ''}
            onChange={(e) => setJournalFilter({ 
              status: e.target.value as any || undefined 
            })}
          >
            <option value="">すべて</option>
            <option value={JOURNAL_STATUS.DRAFT}>下書き</option>
            <option value={JOURNAL_STATUS.POSTED}>記帳済</option>
          </select>
        </div>
        
        <div className={styles.filterGroup}>
          <label>期間</label>
          <input
            type="date"
            value={journalFilter.dateFrom || ''}
            onChange={(e) => setJournalFilter({ dateFrom: e.target.value })}
            placeholder="開始日"
          />
          <span>〜</span>
          <input
            type="date"
            value={journalFilter.dateTo || ''}
            onChange={(e) => setJournalFilter({ dateTo: e.target.value })}
            placeholder="終了日"
          />
        </div>
        
        <div className={styles.filterGroup}>
          <label>金額範囲</label>
          <input
            type="number"
            value={journalFilter.amountMin || ''}
            onChange={(e) => setJournalFilter({ 
              amountMin: e.target.value ? Number(e.target.value) : undefined 
            })}
            placeholder="最小"
          />
          <span>〜</span>
          <input
            type="number"
            value={journalFilter.amountMax || ''}
            onChange={(e) => setJournalFilter({ 
              amountMax: e.target.value ? Number(e.target.value) : undefined 
            })}
            placeholder="最大"
          />
        </div>
        
        <button 
          className={styles.secondaryButton}
          onClick={clearJournalFilter}
        >
          フィルタークリア
        </button>
      </div>
      
      {/* 一括操作 */}
      {stats.selected > 0 && (
        <div className={styles.batchActions}>
          <button onClick={selectAllJournals}>すべて選択</button>
          <button onClick={clearJournalSelection}>選択解除</button>
          <button onClick={handleBatchPost} className={styles.primaryButton}>
            一括記帳（{stats.selected}件）
          </button>
          <button onClick={handleBatchDelete} className={styles.dangerButton}>
            一括削除（{stats.selected}件）
          </button>
        </div>
      )}
      
      {/* ソート設定 */}
      <div className={styles.sortContainer}>
        <label>並び替え：</label>
        <button 
          onClick={() => setJournalSort('date')}
          className={journalSort.field === 'date' ? styles.active : ''}
        >
          日付 {journalSort.field === 'date' && (journalSort.direction === 'asc' ? '↑' : '↓')}
        </button>
        <button 
          onClick={() => setJournalSort('number')}
          className={journalSort.field === 'number' ? styles.active : ''}
        >
          番号 {journalSort.field === 'number' && (journalSort.direction === 'asc' ? '↑' : '↓')}
        </button>
        <button 
          onClick={() => setJournalSort('amount')}
          className={journalSort.field === 'amount' ? styles.active : ''}
        >
          金額 {journalSort.field === 'amount' && (journalSort.direction === 'asc' ? '↑' : '↓')}
        </button>
        <button 
          onClick={() => setJournalSort('status')}
          className={journalSort.field === 'status' ? styles.active : ''}
        >
          ステータス {journalSort.field === 'status' && (journalSort.direction === 'asc' ? '↑' : '↓')}
        </button>
      </div>
      
      {/* 仕訳リスト */}
      <div className={styles.tableContainer}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>選択</th>
              <th>仕訳番号</th>
              <th>日付</th>
              <th>摘要</th>
              <th>借方合計</th>
              <th>貸方合計</th>
              <th>ステータス</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {sortedJournals.map((journal) => {
              const totalDebit = journal.details.reduce((sum, d) => sum + (d.debitAmount || 0), 0)
              const totalCredit = journal.details.reduce((sum, d) => sum + (d.creditAmount || 0), 0)
              
              return (
                <tr key={journal.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedJournalIds.has(journal.id)}
                      onChange={() => toggleSelection(journal.id)}
                    />
                  </td>
                  <td>{journal.number}</td>
                  <td>{journal.date}</td>
                  <td>{journal.description}</td>
                  <td className={styles.numberCell}>
                    {totalDebit.toLocaleString()}
                  </td>
                  <td className={styles.numberCell}>
                    {totalCredit.toLocaleString()}
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[journal.status.toLowerCase()]}`}>
                      {journal.status === JOURNAL_STATUS.DRAFT ? '下書き' : '記帳済'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionButtons}>
                      {journal.status === JOURNAL_STATUS.DRAFT ? (
                        <>
                          <button onClick={() => postJournal(journal.id)}>
                            記帳
                          </button>
                          <button onClick={() => setEditingId(journal.id)}>
                            編集
                          </button>
                          <button 
                            onClick={() => deleteJournal(journal.id)}
                            className={styles.dangerButton}
                          >
                            削除
                          </button>
                        </>
                      ) : (
                        <button onClick={() => unpostJournal(journal.id)}>
                          記帳取消
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        
        {sortedJournals.length === 0 && (
          <div className={styles.emptyState}>
            仕訳がありません
          </div>
        )}
      </div>
      
      {/* 新規作成モーダル（簡易版） */}
      {isCreating && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>新規仕訳作成</h3>
            <div className={styles.formGroup}>
              <label>日付</label>
              <input
                type="date"
                value={newJournalData.date}
                onChange={(e) => setNewJournalData({
                  ...newJournalData,
                  date: e.target.value
                })}
              />
            </div>
            <div className={styles.formGroup}>
              <label>摘要</label>
              <input
                type="text"
                value={newJournalData.description}
                onChange={(e) => setNewJournalData({
                  ...newJournalData,
                  description: e.target.value
                })}
                placeholder="仕訳の説明を入力"
              />
            </div>
            <div className={styles.modalActions}>
              <button onClick={() => setIsCreating(false)}>
                キャンセル
              </button>
              <button 
                onClick={handleCreateJournal}
                className={styles.primaryButton}
              >
                作成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}