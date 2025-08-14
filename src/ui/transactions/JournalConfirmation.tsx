import React, { useState, useMemo } from 'react'
import { StandardizedBankTransaction, JournalSuggestion } from '../../types/master'

interface ProcessedResults {
  normalizedData: StandardizedBankTransaction
  journalSuggestions: JournalSuggestion[]
  processingTime: number
  stats: {
    totalTransactions: number
    patternMatched: number
    newPatterns: number
    highConfidence: number
    lowConfidence: number
  }
}

interface JournalConfirmationProps {
  results: ProcessedResults
  onApprove: (approvedJournals: ApprovedJournal[]) => void
  onBack: () => void
  accountingEngine: any
}

interface ApprovedJournal {
  transactionId: string
  originalTransaction: StandardizedBankTransaction['transactions'][0]
  journalEntries: {
    date: string
    description: string
    details: Array<{
      accountCode: string
      accountName: string
      debitAmount: number
      creditAmount: number
      auxiliaryCode?: string
      division?: string
    }>
  }
  confidence: number
  isModified: boolean
  patternId?: string
}

type FilterType = 'all' | 'high' | 'medium' | 'low' | 'modified'
type SortType = 'date' | 'amount' | 'confidence'

export const JournalConfirmation: React.FC<JournalConfirmationProps> = ({
  results,
  onApprove,
  onBack,
  accountingEngine
}) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [modifiedJournals, setModifiedJournals] = useState<Map<string, ApprovedJournal>>(new Map())
  const [filter, setFilter] = useState<FilterType>('all')
  const [sort, setSort] = useState<SortType>('date')
  const [showDetails, setShowDetails] = useState<Set<string>>(new Set())

  // フィルタリングとソート
  const filteredAndSortedJournals = useMemo(() => {
    let filtered = results.journalSuggestions

    // フィルター適用
    switch (filter) {
      case 'high':
        filtered = filtered.filter(s => s.confidence >= 80)
        break
      case 'medium':
        filtered = filtered.filter(s => s.confidence >= 60 && s.confidence < 80)
        break
      case 'low':
        filtered = filtered.filter(s => s.confidence < 60)
        break
      case 'modified':
        filtered = filtered.filter(s => modifiedJournals.has(s.transactionId))
        break
    }

    // ソート適用
    switch (sort) {
      case 'date':
        return filtered.sort((a, b) => a.suggestedJournal.date.localeCompare(b.suggestedJournal.date))
      case 'amount':
        return filtered.sort((a, b) => Math.abs(b.suggestedJournal.amount) - Math.abs(a.suggestedJournal.amount))
      case 'confidence':
        return filtered.sort((a, b) => b.confidence - a.confidence)
      default:
        return filtered
    }
  }, [results.journalSuggestions, filter, sort, modifiedJournals])

  const handleSelectAll = () => {
    if (selectedItems.size === filteredAndSortedJournals.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(filteredAndSortedJournals.map(j => j.transactionId)))
    }
  }

  const handleSelectItem = (transactionId: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(transactionId)) {
      newSelected.delete(transactionId)
    } else {
      newSelected.add(transactionId)
    }
    setSelectedItems(newSelected)
  }

  const handleToggleDetails = (transactionId: string) => {
    const newDetails = new Set(showDetails)
    if (newDetails.has(transactionId)) {
      newDetails.delete(transactionId)
    } else {
      newDetails.add(transactionId)
    }
    setShowDetails(newDetails)
  }

  const handleEditJournal = (suggestion: JournalSuggestion) => {
    setEditingItem(suggestion.transactionId)
    // 編集フォームの初期値設定等
  }

  const handleSaveEdit = (transactionId: string, editedJournal: ApprovedJournal) => {
    const newModified = new Map(modifiedJournals)
    newModified.set(transactionId, { ...editedJournal, isModified: true })
    setModifiedJournals(newModified)
    setEditingItem(null)
  }

  const handleApproveSelected = () => {
    const approvedJournals: ApprovedJournal[] = []

    for (let i = 0; i < results.journalSuggestions.length; i++) {
      const suggestion = results.journalSuggestions[i]
      if (selectedItems.has(suggestion.transactionId)) {
        const modified = modifiedJournals.get(suggestion.transactionId)
        
        if (modified) {
          approvedJournals.push(modified)
        } else {
          // インデックスで対応する取引を取得
          const transaction = results.normalizedData.transactions[i]
          
          if (transaction) {
            approvedJournals.push({
              transactionId: suggestion.transactionId,
              originalTransaction: transaction,
              journalEntries: {
                date: suggestion.suggestedJournal.date,
                description: suggestion.suggestedJournal.description,
                details: [
                  {
                    accountCode: suggestion.suggestedJournal.debitAccount,
                    accountName: suggestion.suggestedJournal.debitAccountName || '',
                    debitAmount: suggestion.suggestedJournal.amount,
                    creditAmount: 0,
                    division: suggestion.suggestedJournal.division
                  },
                  {
                    accountCode: suggestion.suggestedJournal.creditAccount,
                    accountName: suggestion.suggestedJournal.creditAccountName || '',
                    debitAmount: 0,
                    creditAmount: suggestion.suggestedJournal.amount,
                    division: suggestion.suggestedJournal.division
                  }
                ]
              },
              confidence: suggestion.confidence,
              isModified: false
            })
          }
        }
      }
    }

    onApprove(approvedJournals)
  }

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 80) return '#1f883d'
    if (confidence >= 60) return '#fb8500'
    return '#d1242f'
  }

  const getConfidenceLabel = (confidence: number): string => {
    if (confidence >= 80) return '高'
    if (confidence >= 60) return '中'
    return '低'
  }

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('ja-JP').format(Math.abs(amount))
  }

  return (
    <div className="journal-confirmation">
      <div className="confirmation-header">
        <div className="header-top">
          <h2>🔍 仕訳確認</h2>
          <button onClick={onBack} className="back-button">
            ← 戻る
          </button>
        </div>
        
        <div className="processing-summary">
          <div className="summary-stats">
            <div className="stat-item">
              <span className="stat-value">{results.stats.totalTransactions}</span>
              <span className="stat-label">総取引数</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{results.stats.highConfidence}</span>
              <span className="stat-label">高信頼度</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{results.stats.lowConfidence}</span>
              <span className="stat-label">要確認</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{(results.processingTime / 1000).toFixed(1)}s</span>
              <span className="stat-label">処理時間</span>
            </div>
          </div>
        </div>
      </div>

      <div className="filter-controls">
        <div className="filter-group">
          <label>フィルター:</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value as FilterType)}>
            <option value="all">すべて ({results.journalSuggestions.length})</option>
            <option value="high">高信頼度 ({results.stats.highConfidence})</option>
            <option value="medium">中信頼度</option>
            <option value="low">低信頼度 ({results.stats.lowConfidence})</option>
            <option value="modified">修正済み ({modifiedJournals.size})</option>
          </select>
        </div>

        <div className="filter-group">
          <label>ソート:</label>
          <select value={sort} onChange={(e) => setSort(e.target.value as SortType)}>
            <option value="date">日付順</option>
            <option value="amount">金額順</option>
            <option value="confidence">信頼度順</option>
          </select>
        </div>

        <div className="selection-controls">
          <button onClick={handleSelectAll} className="select-all-button">
            {selectedItems.size === filteredAndSortedJournals.length ? '全解除' : '全選択'}
          </button>
          <span className="selection-count">
            {selectedItems.size} / {filteredAndSortedJournals.length} 選択中
          </span>
        </div>
      </div>

      <div className="journal-list">
        {filteredAndSortedJournals.map((suggestion, index) => {
          const isSelected = selectedItems.has(suggestion.transactionId)
          const isModified = modifiedJournals.has(suggestion.transactionId)
          const showDetail = showDetails.has(suggestion.transactionId)
          const originalTransaction = results.normalizedData.transactions[index]

          return (
            <div key={suggestion.transactionId} className={`journal-item ${isSelected ? 'selected' : ''} ${isModified ? 'modified' : ''}`}>
              <div className="journal-header">
                <div className="item-controls">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleSelectItem(suggestion.transactionId)}
                  />
                  <div className="confidence-badge" style={{ color: getConfidenceColor(suggestion.confidence) }}>
                    {getConfidenceLabel(suggestion.confidence)} {suggestion.confidence}%
                  </div>
                  {isModified && <span className="modified-badge">修正済み</span>}
                </div>

                <div className="transaction-summary">
                  <div className="transaction-main">
                    <span className="date">{suggestion.suggestedJournal.date}</span>
                    <span className="description">{suggestion.suggestedJournal.description}</span>
                    <span className={`amount ${suggestion.suggestedJournal.amount >= 0 ? 'positive' : 'negative'}`}>
                      {suggestion.suggestedJournal.amount >= 0 ? '+' : '-'}¥{formatAmount(suggestion.suggestedJournal.amount)}
                    </span>
                  </div>
                  
                  <div className="journal-summary">
                    <span className="debit">{suggestion.suggestedJournal.debitAccountName}</span>
                    <span className="separator">/</span>
                    <span className="credit">{suggestion.suggestedJournal.creditAccountName}</span>
                  </div>
                </div>

                <div className="item-actions">
                  <button 
                    onClick={() => handleToggleDetails(suggestion.transactionId)}
                    className="details-button"
                  >
                    {showDetail ? '▲' : '▼'}
                  </button>
                  <button 
                    onClick={() => handleEditJournal(suggestion)}
                    className="edit-button"
                  >
                    編集
                  </button>
                </div>
              </div>

              {showDetail && (
                <div className="journal-details">
                  <div className="detail-section">
                    <h4>元取引データ</h4>
                    <div className="original-transaction">
                      <p><strong>摘要:</strong> {originalTransaction?.description}</p>
                      <p><strong>金額:</strong> ¥{formatAmount(originalTransaction?.amount || 0)}</p>
                      {originalTransaction?.payee && (
                        <p><strong>相手先:</strong> {originalTransaction.payee}</p>
                      )}
                      {originalTransaction?.category && (
                        <p><strong>カテゴリ:</strong> {originalTransaction.category}</p>
                      )}
                    </div>
                  </div>

                  <div className="detail-section">
                    <h4>生成された仕訳</h4>
                    <div className="journal-entries">
                      <div className="entry-row">
                        <span className="account-side">借方</span>
                        <span className="account-code">{suggestion.suggestedJournal.debitAccount}</span>
                        <span className="account-name">{suggestion.suggestedJournal.debitAccountName}</span>
                        <span className="amount">¥{formatAmount(suggestion.suggestedJournal.amount)}</span>
                      </div>
                      <div className="entry-row">
                        <span className="account-side">貸方</span>
                        <span className="account-code">{suggestion.suggestedJournal.creditAccount}</span>
                        <span className="account-name">{suggestion.suggestedJournal.creditAccountName}</span>
                        <span className="amount">¥{formatAmount(suggestion.suggestedJournal.amount)}</span>
                      </div>
                    </div>
                  </div>

                  {suggestion.reasoning && (
                    <div className="detail-section">
                      <h4>判断理由</h4>
                      <p className="reasoning">{suggestion.reasoning}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="confirmation-footer">
        <div className="footer-summary">
          <p>選択中の仕訳: <strong>{selectedItems.size}</strong>件</p>
          <p>総金額: <strong>¥{formatAmount(
            filteredAndSortedJournals
              .filter(s => selectedItems.has(s.transactionId))
              .reduce((sum, s) => sum + Math.abs(s.suggestedJournal.amount), 0)
          )}</strong></p>
        </div>
        
        <div className="footer-actions">
          <button 
            onClick={handleApproveSelected}
            disabled={selectedItems.size === 0}
            className="approve-button"
          >
            選択した仕訳を登録 ({selectedItems.size}件)
          </button>
        </div>
      </div>

      <style jsx>{`
        .journal-confirmation {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .confirmation-header {
          margin-bottom: 24px;
        }

        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .header-top h2 {
          margin: 0;
          color: #24292f;
        }

        .back-button {
          background: none;
          border: 1px solid #d0d7de;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          color: #24292f;
        }

        .back-button:hover {
          background-color: #f6f8fa;
        }

        .processing-summary {
          background: #f6f8fa;
          border: 1px solid #d0d7de;
          border-radius: 8px;
          padding: 16px;
        }

        .summary-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 16px;
        }

        .stat-item {
          text-align: center;
        }

        .stat-value {
          display: block;
          font-size: 24px;
          font-weight: 700;
          color: #24292f;
        }

        .stat-label {
          display: block;
          font-size: 12px;
          color: #656d76;
          margin-top: 4px;
        }

        .filter-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding: 16px;
          background: white;
          border: 1px solid #d0d7de;
          border-radius: 8px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .filter-group label {
          font-size: 14px;
          color: #24292f;
          font-weight: 600;
        }

        .filter-group select {
          padding: 4px 8px;
          border: 1px solid #d0d7de;
          border-radius: 4px;
          background: white;
        }

        .selection-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .select-all-button {
          padding: 6px 12px;
          background: #f6f8fa;
          border: 1px solid #d0d7de;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .select-all-button:hover {
          background-color: #e6f2ff;
        }

        .selection-count {
          font-size: 12px;
          color: #656d76;
        }

        .journal-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 24px;
        }

        .journal-item {
          background: white;
          border: 1px solid #d0d7de;
          border-radius: 8px;
          padding: 16px;
          transition: all 0.2s ease;
        }

        .journal-item:hover {
          border-color: #0969da;
        }

        .journal-item.selected {
          border-color: #0969da;
          background-color: #f0f6ff;
        }

        .journal-item.modified {
          border-left: 4px solid #fb8500;
        }

        .journal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }

        .item-controls {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 120px;
        }

        .confidence-badge {
          font-size: 12px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 12px;
          background-color: rgba(0, 0, 0, 0.05);
        }

        .modified-badge {
          background-color: #fb8500;
          color: white;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 8px;
        }

        .transaction-summary {
          flex: 1;
          min-width: 0;
        }

        .transaction-main {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 4px;
        }

        .date {
          font-size: 12px;
          color: #656d76;
          min-width: 80px;
        }

        .description {
          flex: 1;
          font-weight: 600;
          color: #24292f;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .amount {
          font-size: 16px;
          font-weight: 700;
          min-width: 120px;
          text-align: right;
        }

        .amount.positive {
          color: #1f883d;
        }

        .amount.negative {
          color: #d1242f;
        }

        .journal-summary {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #656d76;
        }

        .separator {
          color: #d0d7de;
        }

        .item-actions {
          display: flex;
          gap: 8px;
        }

        .details-button,
        .edit-button {
          padding: 4px 8px;
          background: none;
          border: 1px solid #d0d7de;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .details-button:hover,
        .edit-button:hover {
          background-color: #f6f8fa;
        }

        .journal-details {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #d0d7de;
        }

        .detail-section {
          margin-bottom: 16px;
        }

        .detail-section h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #24292f;
        }

        .original-transaction p {
          margin: 4px 0;
          font-size: 12px;
          color: #656d76;
        }

        .journal-entries {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .entry-row {
          display: grid;
          grid-template-columns: 60px 80px 1fr 120px;
          gap: 12px;
          align-items: center;
          font-size: 12px;
        }

        .account-side {
          font-weight: 600;
          color: #24292f;
        }

        .account-code {
          color: #0969da;
          font-family: monospace;
        }

        .account-name {
          color: #656d76;
        }

        .reasoning {
          font-size: 12px;
          color: #656d76;
          line-height: 1.4;
          margin: 0;
        }

        .confirmation-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: white;
          border: 1px solid #d0d7de;
          border-radius: 8px;
          position: sticky;
          bottom: 0;
          z-index: 10;
        }

        .footer-summary p {
          margin: 2px 0;
          font-size: 14px;
          color: #24292f;
        }

        .approve-button {
          background: #1f883d;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .approve-button:hover:not(:disabled) {
          background: #1a7f37;
        }

        .approve-button:disabled {
          background: #8c959f;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .journal-header {
            flex-direction: column;
            align-items: stretch;
          }

          .transaction-main {
            flex-direction: column;
            align-items: flex-start;
          }

          .confirmation-footer {
            flex-direction: column;
            gap: 16px;
          }

          .entry-row {
            grid-template-columns: 1fr;
            gap: 4px;
          }
        }
      `}</style>
    </div>
  )
}