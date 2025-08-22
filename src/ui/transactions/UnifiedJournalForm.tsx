import React, { useState, useCallback, useMemo } from 'react'
import useStore from '../../stores'
import { JournalInput, JournalLine, Division } from '../../types/journal'
import { JournalService } from '../../services/journalService'
import { 
  incomeCategories, 
  expenseCategories, 
  transferCategories,
  searchAccounts,
  getFrequentAccounts,
  isAccountAvailableForDivision,
  AccountItem
} from './accountCategories'
import { defaultBankAccounts } from '../../data/bankAccounts'
import './FreeeStyleJournalForm.css'

const UnifiedJournalForm: React.FC = () => {
  const { createJournal, showToast } = useStore()
  const journalService = JournalService.getInstance()

  // 状態管理
  const [transactionType, setTransactionType] = useState<'income' | 'expense' | 'transfer'>('expense')
  const [division, setDivision] = useState<Division>('KANRI')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [selectedAccount, setSelectedAccount] = useState<AccountItem | null>(null)
  const [accountSearchQuery, setAccountSearchQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [serviceMonth, setServiceMonth] = useState(new Date().toISOString().slice(0, 7))
  const [payerId, setPayerId] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [paymentAccount, setPaymentAccount] = useState<'cash' | 'kanri_bank' | 'shuzen_bank'>('kanri_bank')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [validationMessage, setValidationMessage] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null)
  
  // 振替用の状態
  const [transferFromAccount, setTransferFromAccount] = useState<string>('')
  const [transferToAccount, setTransferToAccount] = useState<string>('')

  // 現在のカテゴリー
  const currentCategories = useMemo(() => {
    switch (transactionType) {
      case 'income':
        return incomeCategories
      case 'expense':
        return expenseCategories
      case 'transfer':
        return transferCategories
      default:
        return expenseCategories
    }
  }, [transactionType])

  // よく使う勘定科目
  const frequentAccounts = useMemo(() => {
    return getFrequentAccounts(transactionType, division, 5)
  }, [transactionType, division])

  // 決済口座のオプション
  const paymentAccountOptions = useMemo(() => {
    if (division === 'KANRI') {
      return [
        { value: 'cash', label: '現金', code: '1101' },
        { value: 'kanri_bank', label: '普通預金（管理）', code: '1102' }
      ]
    } else {
      return [
        { value: 'shuzen_bank', label: '普通預金（修繕）', code: '1103' },
        { value: 'kanri_bank', label: '普通預金（管理）から振替', code: '1102' }
      ]
    }
  }, [division])

  // 決済口座コードの取得
  const getPaymentAccountCode = () => {
    const account = paymentAccountOptions.find(opt => opt.value === paymentAccount)
    return account ? account.code : (division === 'KANRI' ? '1102' : '1103')
  }

  // 振替可能な口座リスト
  const transferAccounts = useMemo(() => {
    return defaultBankAccounts.filter(acc => acc.isActive)
  }, [])

  // 振替先口座の選択肢
  const availableToAccounts = useMemo(() => {
    if (!transferFromAccount) return []
    const fromAccount = defaultBankAccounts.find(acc => acc.id === transferFromAccount)
    if (!fromAccount) return []
    
    return transferAccounts.filter(acc => {
      if (acc.id === transferFromAccount) return false
      if (fromAccount.division === 'KANRI' && acc.division === 'SHUZEN') return true
      if (fromAccount.division === 'SHUZEN' && acc.division === 'KANRI') return true
      if (fromAccount.division === acc.division) return true
      return false
    })
  }, [transferFromAccount, transferAccounts])

  // 検索結果
  const searchResults = useMemo(() => {
    if (!accountSearchQuery || accountSearchQuery.length < 1) return []
    return searchAccounts(accountSearchQuery, transactionType, division)
  }, [accountSearchQuery, transactionType, division])

  // 勘定科目選択
  const handleAccountSelect = useCallback((account: AccountItem) => {
    setSelectedAccount(account)
    setAccountSearchQuery(account.label)
    setShowSuggestions(false)
    setErrors(prev => ({ ...prev, accountCode: '' }))
  }, [])

  // タグの追加
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  // タグの削除
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  // 仕訳データの生成（統一モデル形式）
  const generateJournalInput = (): JournalInput | null => {
    const lines: Omit<JournalLine, 'id'>[] = []
    const numAmount = parseFloat(amount) || 0

    if (transactionType === 'transfer') {
      // 振替の場合
      if (!transferFromAccount || !transferToAccount || !numAmount) return null
      
      const fromAccount = defaultBankAccounts.find(acc => acc.id === transferFromAccount)
      const toAccount = defaultBankAccounts.find(acc => acc.id === transferToAccount)
      if (!fromAccount || !toAccount) return null
      
      lines.push(
        {
          accountCode: toAccount.code,
          accountName: toAccount.name,
          debitAmount: numAmount,
          creditAmount: 0
        },
        {
          accountCode: fromAccount.code,
          accountName: fromAccount.name,
          debitAmount: 0,
          creditAmount: numAmount
        }
      )
    } else {
      // 収入・支出の場合
      if (!selectedAccount || !numAmount) return null

      const paymentCode = getPaymentAccountCode()
      const paymentName = paymentAccountOptions.find(opt => opt.code === paymentCode)?.label || ''

      if (transactionType === 'income') {
        lines.push(
          {
            accountCode: paymentCode,
            accountName: paymentName,
            debitAmount: numAmount,
            creditAmount: 0
          },
          {
            accountCode: selectedAccount.code,
            accountName: selectedAccount.label,
            debitAmount: 0,
            creditAmount: numAmount,
            serviceMonth: `${serviceMonth}-01`,
            payerId
          }
        )
      } else {
        lines.push(
          {
            accountCode: selectedAccount.code,
            accountName: selectedAccount.label,
            debitAmount: numAmount,
            creditAmount: 0,
            serviceMonth: `${serviceMonth}-01`
          },
          {
            accountCode: paymentCode,
            accountName: paymentName,
            debitAmount: 0,
            creditAmount: numAmount
          }
        )
      }
    }

    return {
      date,
      description,
      division,
      lines,
      tags: tags.length > 0 ? tags : undefined
    }
  }

  // バリデーション
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (transactionType === 'transfer') {
      if (!transferFromAccount) {
        newErrors.transferFrom = '振替元口座を選択してください'
      }
      if (!transferToAccount) {
        newErrors.transferTo = '振替先口座を選択してください'
      }
    } else {
      if (!selectedAccount) {
        newErrors.accountCode = '勘定科目を選択してください'
      }
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = '金額を入力してください'
    }
    if (!date) {
      newErrors.date = '日付を入力してください'
    }
    if (!description.trim()) {
      newErrors.description = '摘要を入力してください'
    }

    setErrors(newErrors)
    
    if (Object.keys(newErrors).length > 0) {
      setValidationMessage({ type: 'error', message: '必須項目を入力してください' })
      return false
    }
    
    return true
  }

  // フォーム送信
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    const journalInput = generateJournalInput()
    if (!journalInput) {
      setValidationMessage({ type: 'error', message: '仕訳データの生成に失敗しました' })
      return
    }

    // 仕訳を作成（統一ストアを使用）
    const result = createJournal(journalInput)
    
    if (result) {
      // フォームをリセット
      setAmount('')
      setDescription('')
      setSelectedAccount(null)
      setAccountSearchQuery('')
      setPayerId('')
      setTags([])
      setTagInput('')
      setTransferFromAccount('')
      setTransferToAccount('')
      setValidationMessage({ type: 'success', message: '仕訳を登録しました' })
      
      setTimeout(() => {
        setValidationMessage(null)
      }, 3000)
    }
  }

  // 仕訳プレビューの生成
  const journalPreview = useMemo(() => {
    const input = generateJournalInput()
    if (!input) return null
    
    const validation = journalService.validateJournal(input)
    const totals = journalService.calculateTotals(input.lines)
    
    return {
      lines: input.lines,
      totals,
      validation
    }
  }, [date, description, division, amount, selectedAccount, transferFromAccount, transferToAccount, serviceMonth, payerId])

  return (
    <div className="freee-journal-form">
      <div className="form-header">
        <h2>📝 仕訳入力（統一モデル版）</h2>
        {transactionType !== 'transfer' && (
          <div className="division-toggle">
            <button
              className={`division-btn ${division === 'KANRI' ? 'active' : ''}`}
              onClick={() => setDivision('KANRI')}
            >
              管理会計
            </button>
            <button
              className={`division-btn ${division === 'SHUZEN' ? 'active' : ''}`}
              onClick={() => setDivision('SHUZEN')}
            >
              修繕会計
            </button>
          </div>
        )}
      </div>

      {/* 取引タイプタブ */}
      <div className="transaction-tabs">
        <button
          className={`tab-btn ${transactionType === 'income' ? 'active income' : ''}`}
          onClick={() => setTransactionType('income')}
        >
          <span className="tab-icon">💰</span>
          収入
        </button>
        <button
          className={`tab-btn ${transactionType === 'expense' ? 'active expense' : ''}`}
          onClick={() => setTransactionType('expense')}
        >
          <span className="tab-icon">💸</span>
          支出
        </button>
        <button
          className={`tab-btn ${transactionType === 'transfer' ? 'active transfer' : ''}`}
          onClick={() => setTransactionType('transfer')}
        >
          <span className="tab-icon">🔄</span>
          振替
        </button>
      </div>

      <form onSubmit={handleSubmit} className="journal-form">
        {/* 日付入力 */}
        <div className="form-group">
          <label>
            取引日 <span className="required">*</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={errors.date ? 'error' : ''}
          />
          {errors.date && <span className="error-message">{errors.date}</span>}
        </div>

        {/* 振替元・振替先口座選択（振替タブの場合） */}
        {transactionType === 'transfer' ? (
          <>
            <div className="form-group">
              <label>
                振替元口座 <span className="required">*</span>
              </label>
              <select
                value={transferFromAccount}
                onChange={(e) => {
                  setTransferFromAccount(e.target.value)
                  setTransferToAccount('')
                }}
                className={`form-select ${errors.transferFrom ? 'error' : ''}`}
              >
                <option value="">口座を選択してください</option>
                {transferAccounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} {account.bankName ? `(${account.bankName})` : ''}
                  </option>
                ))}
              </select>
              {errors.transferFrom && <span className="error-message">{errors.transferFrom}</span>}
            </div>

            <div className="form-group">
              <label>
                振替先口座 <span className="required">*</span>
              </label>
              <select
                value={transferToAccount}
                onChange={(e) => setTransferToAccount(e.target.value)}
                className={`form-select ${errors.transferTo ? 'error' : ''}`}
                disabled={!transferFromAccount}
              >
                <option value="">
                  {transferFromAccount ? '口座を選択してください' : 'まず振替元を選択してください'}
                </option>
                {availableToAccounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} {account.bankName ? `(${account.bankName})` : ''}
                  </option>
                ))}
              </select>
              {errors.transferTo && <span className="error-message">{errors.transferTo}</span>}
            </div>
          </>
        ) : (
          /* 勘定科目選択（収入・支出タブの場合） */
          <div className="form-group">
            <label>
              勘定科目 <span className="required">*</span>
            </label>
            <div className="account-search-wrapper">
              <input
                type="text"
                value={accountSearchQuery}
                onChange={(e) => {
                  setAccountSearchQuery(e.target.value)
                  setShowSuggestions(true)
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder={`${transactionType === 'income' ? '収入' : '支出'}科目を検索...`}
                className={errors.accountCode ? 'error' : ''}
              />
              <button
                type="button"
                className="category-btn"
                onClick={() => setShowAccountModal(true)}
                title="カテゴリーから選択"
              >
                📁
              </button>
            </div>

            {/* 検索サジェスト */}
            {showSuggestions && searchResults.length > 0 && (
              <div className="suggestions-dropdown">
                {searchResults.slice(0, 5).map(account => (
                  <div
                    key={account.code}
                    className="suggestion-item"
                    onClick={() => handleAccountSelect(account)}
                  >
                    <span className="suggestion-label">{account.label}</span>
                    <span className="suggestion-code">{account.code}</span>
                  </div>
                ))}
              </div>
            )}

            {/* よく使う項目 */}
            {!accountSearchQuery && frequentAccounts.length > 0 && (
              <div className="frequent-accounts">
                <div className="frequent-label">よく使う項目</div>
                <div className="frequent-buttons">
                  {frequentAccounts.map(account => (
                    <button
                      key={account.code}
                      type="button"
                      className="frequent-btn"
                      onClick={() => handleAccountSelect(account)}
                    >
                      {account.shortLabel || account.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {errors.accountCode && <span className="error-message">{errors.accountCode}</span>}
          </div>
        )}

        {/* 金額入力 */}
        <div className="form-group">
          <label>
            金額 <span className="required">*</span>
          </label>
          <div className="amount-input">
            <span className="currency">¥</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              min="0"
              step="1"
              className={errors.amount ? 'error' : ''}
            />
          </div>
          {errors.amount && <span className="error-message">{errors.amount}</span>}
        </div>

        {/* 対象月（収入・支出の場合） */}
        {transactionType !== 'transfer' && (
          <div className="form-group">
            <label>対象月</label>
            <input
              type="month"
              value={serviceMonth}
              onChange={(e) => setServiceMonth(e.target.value)}
            />
          </div>
        )}

        {/* 支払者（収入の場合） */}
        {transactionType === 'income' && (
          <div className="form-group">
            <label>支払者・部屋番号</label>
            <input
              type="text"
              value={payerId}
              onChange={(e) => setPayerId(e.target.value)}
              placeholder="例: 101号室"
            />
          </div>
        )}

        {/* 摘要 */}
        <div className="form-group">
          <label>
            摘要 <span className="required">*</span>
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="取引の説明を入力"
            className={errors.description ? 'error' : ''}
          />
          {errors.description && <span className="error-message">{errors.description}</span>}
        </div>

        {/* 決済口座 */}
        {transactionType !== 'transfer' && (
          <div className="form-group">
            <label>決済口座</label>
            <select
              value={paymentAccount}
              onChange={(e) => setPaymentAccount(e.target.value)}
              className="form-select"
            >
              {paymentAccountOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} ({opt.code})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* タグ */}
        <div className="form-group">
          <label>タグ</label>
          <div className="tag-input-wrapper">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddTag()
                }
              }}
              placeholder="タグを入力してEnterキー"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="add-tag-btn"
            >
              追加
            </button>
          </div>
          {tags.length > 0 && (
            <div className="tags-display">
              {tags.map(tag => (
                <span key={tag} className="tag-chip">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="tag-remove"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 仕訳プレビュー */}
        {journalPreview && journalPreview.lines.length > 0 && (
          <div className="journal-preview">
            <h4>📋 仕訳プレビュー</h4>
            <table className="preview-table">
              <thead>
                <tr>
                  <th>借方科目</th>
                  <th>借方金額</th>
                  <th>貸方科目</th>
                  <th>貸方金額</th>
                </tr>
              </thead>
              <tbody>
                {journalPreview.lines.map((line, index) => (
                  <tr key={index}>
                    <td>{line.debitAmount > 0 ? `${line.accountName || line.accountCode}` : '-'}</td>
                    <td className="amount">{line.debitAmount > 0 ? `¥${line.debitAmount.toLocaleString()}` : '-'}</td>
                    <td>{line.creditAmount > 0 ? `${line.accountName || line.accountCode}` : '-'}</td>
                    <td className="amount">{line.creditAmount > 0 ? `¥${line.creditAmount.toLocaleString()}` : '-'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th>合計</th>
                  <th className="amount">¥{journalPreview.totals.totalDebit.toLocaleString()}</th>
                  <th>合計</th>
                  <th className="amount">¥{journalPreview.totals.totalCredit.toLocaleString()}</th>
                </tr>
              </tfoot>
            </table>
            {journalPreview.validation && !journalPreview.validation.isValid && (
              <div className="validation-errors">
                {journalPreview.validation.errors.map((error, index) => (
                  <div key={index} className="error-message">
                    {error.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* バリデーションメッセージ */}
        {validationMessage && (
          <div className={`validation-message ${validationMessage.type}`}>
            {validationMessage.type === 'success' && '✅ '}
            {validationMessage.type === 'error' && '❌ '}
            {validationMessage.type === 'info' && 'ℹ️ '}
            {validationMessage.message}
          </div>
        )}

        {/* 送信ボタン */}
        <div className="form-actions">
          <button type="submit" className="submit-btn">
            仕訳を登録
          </button>
        </div>
      </form>

      {/* カテゴリー選択モーダル */}
      {showAccountModal && (
        <div className="modal-backdrop" onClick={() => setShowAccountModal(false)}>
          <div className="account-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>勘定科目を選択</h3>
              <button className="close-btn" onClick={() => setShowAccountModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-content">
              {currentCategories.map(category => (
                <div key={category.id} className="category-section">
                  <h4 style={{ color: category.color }}>{category.label}</h4>
                  {category.description && (
                    <p className="category-desc">{category.description}</p>
                  )}
                  <div className="account-grid">
                    {category.accounts.map(account => {
                      const isAvailable = isAccountAvailableForDivision(account, division)
                      return (
                        <button
                          key={account.code}
                          className={`account-btn ${!isAvailable ? 'disabled' : ''}`}
                          onClick={() => {
                            if (isAvailable) {
                              handleAccountSelect(account)
                              setShowAccountModal(false)
                            }
                          }}
                          disabled={!isAvailable}
                        >
                          <span className="account-label">
                            {account.shortLabel || account.label}
                          </span>
                          <span className="account-code">{account.code}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UnifiedJournalForm