import React, { useCallback } from 'react'
import { useJournalFormStore } from '../../../stores/useJournalFormStore'
import styles from './AmountInput.module.css'

export const AmountInput: React.FC = () => {
  const {
    amount,
    setAmount,
    errors,
    transactionType,
  } = useJournalFormStore()
  
  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // 数値と小数点のみ許可
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value)
    }
  }, [setAmount])
  
  const formatAmount = useCallback((value: string): string => {
    if (!value) return ''
    const num = parseFloat(value)
    if (isNaN(num)) return value
    return num.toLocaleString('ja-JP')
  }, [])
  
  const getPlaceholder = useCallback((): string => {
    switch (transactionType) {
      case 'income':
        return '収入金額を入力'
      case 'expense':
        return '支出金額を入力'
      case 'transfer':
        return '振替金額を入力'
      default:
        return '金額を入力'
    }
  }, [transactionType])
  
  const getLabel = useCallback((): string => {
    switch (transactionType) {
      case 'income':
        return '収入金額'
      case 'expense':
        return '支出金額'
      case 'transfer':
        return '振替金額'
      default:
        return '金額'
    }
  }, [transactionType])
  
  return (
    <div className={styles.container}>
      <label className={styles.label}>
        {getLabel()}
        <span className={styles.required}>*</span>
      </label>
      <div className={styles.inputWrapper}>
        <span className={styles.currency}>¥</span>
        <input
          type="text"
          className={`${styles.input} ${errors.amount ? styles.error : ''}`}
          value={amount}
          onChange={handleAmountChange}
          placeholder={getPlaceholder()}
          inputMode="decimal"
        />
        {amount && (
          <span className={styles.formatted}>
            {formatAmount(amount)}円
          </span>
        )}
      </div>
      {errors.amount && (
        <div className={styles.errorMessage}>
          {errors.amount}
        </div>
      )}
    </div>
  )
}