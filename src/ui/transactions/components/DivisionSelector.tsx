import React from 'react'
import { useJournalFormStore } from '../../../stores/useJournalFormStore'
import type { Division } from '../../../stores/slices/journal/journalFormSlice'
import styles from './DivisionSelector.module.css'

interface DivisionOption {
  value: Division
  label: string
  description: string
}

const divisionOptions: DivisionOption[] = [
  { value: 'KANRI', label: '管理会計', description: '通常の管理費会計' },
  { value: 'SHUZEN', label: '修繕会計', description: '修繕積立金会計' },
  { value: 'PARKING', label: '駐車場会計', description: '駐車場収支管理' },
  { value: 'OTHER', label: 'その他特別会計', description: '特別会計項目' },
]

export const DivisionSelector: React.FC = () => {
  const {
    division,
    transactionType,
    resetForDivisionChange,
  } = useJournalFormStore()
  
  // 振替取引の場合は区分選択を非表示
  if (transactionType === 'transfer') {
    return null
  }
  
  const handleDivisionChange = (newDivision: Division) => {
    if (division !== newDivision) {
      resetForDivisionChange(newDivision)
    }
  }
  
  return (
    <div className={styles.container}>
      <label className={styles.label}>会計区分</label>
      <div className={styles.buttonGroup}>
        {divisionOptions.map((option) => (
          <button
            key={option.value}
            className={`${styles.divisionButton} ${
              division === option.value ? styles.active : ''
            }`}
            onClick={() => handleDivisionChange(option.value)}
            title={option.description}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className={styles.description}>
        {divisionOptions.find(opt => opt.value === division)?.description}
      </div>
    </div>
  )
}