import React, { useState, useMemo, useCallback } from 'react'
import { useJournalFormStore } from '../../../../stores/useJournalFormStore'
import { searchAccounts, getFrequentAccounts, isAccountAvailableForDivision } from '../../accountCategories'
import { AccountSearch } from './AccountSearch'
import { AccountModal } from './AccountModal'
import { FrequentAccounts } from './FrequentAccounts'
import styles from './AccountSelector.module.css'

export const AccountSelector: React.FC = () => {
  const {
    selectedAccount,
    setSelectedAccount,
    accountSearchQuery,
    setAccountSearchQuery,
    showAccountModal,
    setShowAccountModal,
    division,
    transactionType,
    errors,
  } = useJournalFormStore()
  
  const [showSuggestions, setShowSuggestions] = useState(false)
  
  // 頻繁に使う勘定科目（会計区分でフィルタリング）
  const frequentAccounts = useMemo(() => {
    return getFrequentAccounts(transactionType, division).filter(
      account => isAccountAvailableForDivision(account.code, division)
    )
  }, [transactionType, division])
  
  // 検索結果
  const searchResults = useMemo(() => {
    if (!accountSearchQuery) return []
    const results = searchAccounts(accountSearchQuery, transactionType)
    return results.filter(account => 
      isAccountAvailableForDivision(account.code, division)
    )
  }, [accountSearchQuery, transactionType, division])
  
  const handleAccountSelect = useCallback((account: typeof selectedAccount) => {
    setSelectedAccount(account)
    setAccountSearchQuery(account?.name || '')
    setShowSuggestions(false)
  }, [setSelectedAccount, setAccountSearchQuery])
  
  const handleSearchChange = useCallback((query: string) => {
    setAccountSearchQuery(query)
    setShowSuggestions(true)
    if (!query) {
      setSelectedAccount(null)
    }
  }, [setAccountSearchQuery, setSelectedAccount])
  
  // 振替タイプの場合は表示しない
  if (transactionType === 'transfer') {
    return null
  }
  
  return (
    <div className={styles.container}>
      <label className={styles.label}>
        勘定科目
        <span className={styles.required}>*</span>
      </label>
      
      <AccountSearch
        query={accountSearchQuery}
        onChange={handleSearchChange}
        onFocus={() => setShowSuggestions(true)}
        onModalOpen={() => setShowAccountModal(true)}
        placeholder={`${transactionType === 'income' ? '収入' : '支出'}科目を検索...`}
        hasError={!!errors.account}
      />
      
      {/* 選択された科目の表示 */}
      {selectedAccount && (
        <div className={styles.selectedAccount}>
          <span className={styles.accountCode}>{selectedAccount.code}</span>
          <span className={styles.accountName}>{selectedAccount.name}</span>
          <button
            className={styles.clearButton}
            onClick={() => handleAccountSelect(null)}
            aria-label="選択をクリア"
          >
            ×
          </button>
        </div>
      )}
      
      {/* 検索サジェスト */}
      {showSuggestions && searchResults.length > 0 && (
        <div className={styles.suggestions}>
          {searchResults.slice(0, 5).map((account) => (
            <div
              key={account.code}
              className={styles.suggestionItem}
              onClick={() => handleAccountSelect(account)}
            >
              <span className={styles.suggestionCode}>{account.code}</span>
              <span className={styles.suggestionName}>{account.name}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* よく使う勘定科目 */}
      {!accountSearchQuery && frequentAccounts.length > 0 && (
        <FrequentAccounts
          accounts={frequentAccounts}
          onSelect={handleAccountSelect}
        />
      )}
      
      {/* エラーメッセージ */}
      {errors.account && (
        <div className={styles.errorMessage}>
          {errors.account}
        </div>
      )}
      
      {/* カテゴリ選択モーダル */}
      {showAccountModal && (
        <AccountModal
          onSelect={handleAccountSelect}
          onClose={() => setShowAccountModal(false)}
        />
      )}
    </div>
  )
}