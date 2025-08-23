import React from 'react'
import { useJournalFormStore } from '../../../stores/useJournalFormStore'
import type { TransactionType } from '../../../stores/slices/journal/journalFormSlice'
import styles from './TransactionTypeSelector.module.css'

interface TransactionOption {
  value: TransactionType
  label: string
  icon: string
  color: string
}

const transactionOptions: TransactionOption[] = [
  { value: 'income', label: '収入', icon: '💰', color: 'success' },
  { value: 'expense', label: '支出', icon: '💸', color: 'danger' },
  { value: 'transfer', label: '振替', icon: '🔄', color: 'info' },
]

export const TransactionTypeSelector: React.FC = () => {
  const {
    transactionType,
    setTransactionType,
    setSelectedAccount,
    setAccountSearchQuery,
    setTransferFromAccount,
    setTransferToAccount,
  } = useJournalFormStore()
  
  const handleTypeChange = (type: TransactionType) => {
    if (transactionType !== type) {
      setTransactionType(type)
      // タイプ変更時に関連状態をリセット
      setSelectedAccount(null)
      setAccountSearchQuery('')
      if (type === 'transfer') {
        // 振替モードの初期化
        setTransferFromAccount('')
        setTransferToAccount('')
      }
    }
  }
  
  return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        {transactionOptions.map((option) => (
          <button
            key={option.value}
            className={`${styles.tab} ${
              transactionType === option.value 
                ? `${styles.active} ${styles[option.color]}` 
                : ''
            }`}
            onClick={() => handleTypeChange(option.value)}
          >
            <span className={styles.icon}>{option.icon}</span>
            <span className={styles.label}>{option.label}</span>
          </button>
        ))}
      </div>
      <div className={styles.indicator}>
        <div 
          className={`${styles.indicatorBar} ${
            styles[transactionOptions.find(opt => opt.value === transactionType)?.color || '']
          }`}
          style={{
            transform: `translateX(${
              transactionOptions.findIndex(opt => opt.value === transactionType) * 100
            }%)`
          }}
        />
      </div>
    </div>
  )
}