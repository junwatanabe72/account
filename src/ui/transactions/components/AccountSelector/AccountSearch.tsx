import React from 'react'
import styles from './AccountSelector.module.css'

interface AccountSearchProps {
  query: string
  onChange: (query: string) => void
  onFocus: () => void
  onModalOpen: () => void
  placeholder: string
  hasError: boolean
}

export const AccountSearch: React.FC<AccountSearchProps> = ({
  query,
  onChange,
  onFocus,
  onModalOpen,
  placeholder,
  hasError,
}) => {
  return (
    <div className={styles.searchWrapper}>
      <input
        type="text"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder={placeholder}
        className={`${styles.searchInput} ${hasError ? styles.error : ''}`}
      />
      <button
        type="button"
        className={styles.categoryButton}
        onClick={onModalOpen}
        title="カテゴリーから選択"
      >
        📁
      </button>
    </div>
  )
}