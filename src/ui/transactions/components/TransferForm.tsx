import React, { useMemo } from 'react'
import { useJournalFormStore } from '../../../stores/useJournalFormStore'
import { defaultBankAccounts, getTransferableCombinations } from '../../../data/bankAccounts'
import styles from './TransferForm.module.css'

export const TransferForm: React.FC = () => {
  const {
    transactionType,
    transferFromAccount,
    transferToAccount,
    setTransferFromAccount,
    setTransferToAccount,
    errors,
    setErrors,
  } = useJournalFormStore()
  
  // 振替可能な口座の組み合わせ
  const transferableCombinations = useMemo(() => {
    return getTransferableCombinations()
  }, [])
  
  // 振替元として選択可能な口座
  const transferAccounts = useMemo(() => {
    const fromAccountIds = [...new Set(transferableCombinations.map(c => c.from))]
    return defaultBankAccounts.filter(account => fromAccountIds.includes(account.id))
  }, [transferableCombinations])
  
  // 振替先として選択可能な口座
  const availableToAccounts = useMemo(() => {
    if (!transferFromAccount) return []
    
    const validCombinations = transferableCombinations.filter(
      c => c.from === transferFromAccount
    )
    const toAccountIds = validCombinations.map(c => c.to)
    
    return defaultBankAccounts.filter(account => toAccountIds.includes(account.id))
  }, [transferFromAccount, transferableCombinations])
  
  const handleFromAccountChange = (accountId: string) => {
    setTransferFromAccount(accountId)
    setTransferToAccount('') // 振替元を変更したら振替先をリセット
    setErrors({ ...errors, transferFrom: '', transferTo: '' })
  }
  
  const handleToAccountChange = (accountId: string) => {
    setTransferToAccount(accountId)
    setErrors({ ...errors, transferTo: '', transfer: '' })
  }
  
  // 振替タイプでない場合は表示しない
  if (transactionType !== 'transfer') {
    return null
  }
  
  return (
    <div className={styles.container}>
      {/* 振替元口座 */}
      <div className={styles.formGroup}>
        <label className={styles.label}>
          振替元口座
          <span className={styles.required}>*</span>
        </label>
        <select
          value={transferFromAccount}
          onChange={(e) => handleFromAccountChange(e.target.value)}
          className={`${styles.select} ${errors.transferFrom ? styles.error : ''}`}
        >
          <option value="">口座を選択してください</option>
          {transferAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
              {account.bankName && ` (${account.bankName})`}
            </option>
          ))}
        </select>
        {errors.transferFrom && (
          <div className={styles.errorMessage}>{errors.transferFrom}</div>
        )}
      </div>
      
      {/* 振替矢印 */}
      <div className={styles.arrow}>
        <span className={styles.arrowIcon}>↓</span>
      </div>
      
      {/* 振替先口座 */}
      <div className={styles.formGroup}>
        <label className={styles.label}>
          振替先口座
          <span className={styles.required}>*</span>
        </label>
        <select
          value={transferToAccount}
          onChange={(e) => handleToAccountChange(e.target.value)}
          className={`${styles.select} ${
            errors.transferTo || errors.transfer ? styles.error : ''
          }`}
          disabled={!transferFromAccount}
        >
          <option value="">
            {transferFromAccount
              ? '口座を選択してください'
              : 'まず振替元を選択してください'}
          </option>
          {availableToAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
              {account.bankName && ` (${account.bankName})`}
            </option>
          ))}
        </select>
        {errors.transferTo && (
          <div className={styles.errorMessage}>{errors.transferTo}</div>
        )}
        {errors.transfer && (
          <div className={styles.errorMessage}>{errors.transfer}</div>
        )}
      </div>
      
      {/* 振替説明 */}
      {transferFromAccount && transferToAccount && (
        <div className={styles.transferSummary}>
          <div className={styles.summaryTitle}>振替内容</div>
          <div className={styles.summaryContent}>
            {defaultBankAccounts.find(a => a.id === transferFromAccount)?.name} から{' '}
            {defaultBankAccounts.find(a => a.id === transferToAccount)?.name} へ資金を移動
          </div>
        </div>
      )}
    </div>
  )
}