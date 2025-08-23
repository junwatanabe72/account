import React, { useEffect } from 'react'
import { useJournalFormStore } from '../../../stores/useJournalFormStore'
import styles from './ValidationMessage.module.css'

export const ValidationMessage: React.FC = () => {
  const { validationMessage, setValidationMessage } = useJournalFormStore()
  
  useEffect(() => {
    if (validationMessage && validationMessage.type !== 'error') {
      const timer = setTimeout(() => {
        setValidationMessage(null)
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [validationMessage, setValidationMessage])
  
  if (!validationMessage) {
    return null
  }
  
  const getIcon = () => {
    switch (validationMessage.type) {
      case 'success':
        return '✅'
      case 'error':
        return '❌'
      case 'info':
        return 'ℹ️'
      default:
        return ''
    }
  }
  
  return (
    <div className={`${styles.container} ${styles[validationMessage.type]}`}>
      <span className={styles.icon}>{getIcon()}</span>
      <span className={styles.message}>{validationMessage.message}</span>
      <button
        className={styles.closeButton}
        onClick={() => setValidationMessage(null)}
        aria-label="メッセージを閉じる"
      >
        ×
      </button>
    </div>
  )
}