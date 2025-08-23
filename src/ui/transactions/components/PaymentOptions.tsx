import React from 'react'
import { useJournalFormStore } from '../../../stores/useJournalFormStore'
import type { PaymentAccountType, PaymentStatus } from '../../../stores/slices/journal/journalFormSlice'
import styles from './PaymentOptions.module.css'

interface PaymentOption {
  value: PaymentAccountType
  label: string
  icon: string
}

const paymentOptions: PaymentOption[] = [
  { value: 'cash', label: '現金', icon: '💵' },
  { value: 'kanri_bank', label: '管理費口座', icon: '🏦' },
  { value: 'shuzen_bank', label: '修繕積立金口座', icon: '🏗️' },
]

const statusOptions: { value: PaymentStatus; label: string; color: string }[] = [
  { value: 'completed', label: '支払済', color: 'success' },
  { value: 'pending', label: '未払い', color: 'warning' },
]

export const PaymentOptions: React.FC = () => {
  const {
    transactionType,
    paymentAccount,
    paymentStatus,
    setPaymentAccount,
    setPaymentStatus,
    division,
  } = useJournalFormStore()
  
  // 収入タイプまたは振替タイプの場合は表示しない
  if (transactionType !== 'expense') {
    return null
  }
  
  // 会計区分に応じたデフォルト口座の推奨
  const getRecommendedAccount = (): PaymentAccountType => {
    switch (division) {
      case 'SHUZEN':
        return 'shuzen_bank'
      case 'KANRI':
      case 'PARKING':
      case 'OTHER':
      default:
        return 'kanri_bank'
    }
  }
  
  const recommendedAccount = getRecommendedAccount()
  
  return (
    <div className={styles.container}>
      {/* 支払方法 */}
      <div className={styles.section}>
        <label className={styles.label}>支払方法</label>
        <div className={styles.optionGroup}>
          {paymentOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`${styles.optionButton} ${
                paymentAccount === option.value ? styles.active : ''
              } ${
                option.value === recommendedAccount ? styles.recommended : ''
              }`}
              onClick={() => setPaymentAccount(option.value)}
            >
              <span className={styles.optionIcon}>{option.icon}</span>
              <span className={styles.optionLabel}>{option.label}</span>
              {option.value === recommendedAccount && (
                <span className={styles.recommendedBadge}>推奨</span>
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* 支払状況 */}
      <div className={styles.section}>
        <label className={styles.label}>支払状況</label>
        <div className={styles.statusGroup}>
          {statusOptions.map((status) => (
            <label
              key={status.value}
              className={`${styles.statusOption} ${
                paymentStatus === status.value ? styles[status.color] : ''
              }`}
            >
              <input
                type="radio"
                name="paymentStatus"
                value={status.value}
                checked={paymentStatus === status.value}
                onChange={() => setPaymentStatus(status.value)}
                className={styles.radio}
              />
              <span className={styles.statusLabel}>{status.label}</span>
            </label>
          ))}
        </div>
      </div>
      
      {/* 支払情報サマリー */}
      <div className={styles.summary}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>選択中の支払方法:</span>
          <span className={styles.summaryValue}>
            {paymentOptions.find(opt => opt.value === paymentAccount)?.icon}{' '}
            {paymentOptions.find(opt => opt.value === paymentAccount)?.label}
          </span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>状況:</span>
          <span className={`${styles.summaryValue} ${
            styles[statusOptions.find(s => s.value === paymentStatus)?.color || '']
          }`}>
            {statusOptions.find(s => s.value === paymentStatus)?.label}
          </span>
        </div>
      </div>
    </div>
  )
}