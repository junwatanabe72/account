import React from 'react'
import { useJournalFormStore } from '../../../stores/useJournalFormStore'
import styles from './DateInput.module.css'

export const DateInput: React.FC = () => {
  const {
    date,
    setDate,
    errors,
  } = useJournalFormStore()
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value)
  }
  
  // 今日の日付を取得
  const today = new Date().toISOString().split('T')[0]
  
  // 月初と月末の日付を計算
  const getMonthStart = () => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  }
  
  const getMonthEnd = () => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
  }
  
  const quickDates = [
    { label: '今日', value: today },
    { label: '月初', value: getMonthStart() },
    { label: '月末', value: getMonthEnd() },
  ]
  
  return (
    <div className={styles.container}>
      <label className={styles.label}>
        取引日
        <span className={styles.required}>*</span>
      </label>
      
      <div className={styles.inputWrapper}>
        <input
          type="date"
          value={date}
          onChange={handleDateChange}
          className={`${styles.dateInput} ${errors.date ? styles.error : ''}`}
          max={today} // 未来の日付は選択不可
        />
        
        <div className={styles.quickButtons}>
          {quickDates.map((quick) => (
            <button
              key={quick.label}
              type="button"
              className={`${styles.quickButton} ${
                date === quick.value ? styles.active : ''
              }`}
              onClick={() => setDate(quick.value)}
            >
              {quick.label}
            </button>
          ))}
        </div>
      </div>
      
      {errors.date && (
        <div className={styles.errorMessage}>
          {errors.date}
        </div>
      )}
      
      {/* 日付のフォーマット表示 */}
      {date && (
        <div className={styles.formattedDate}>
          {new Date(date + 'T00:00:00').toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'short',
          })}
        </div>
      )}
    </div>
  )
}