import React from 'react'
import { AccountItem } from '../../accountCategories'
import styles from './AccountSelector.module.css'

interface FrequentAccountsProps {
  accounts: AccountItem[]
  onSelect: (account: AccountItem) => void
}

export const FrequentAccounts: React.FC<FrequentAccountsProps> = ({
  accounts,
  onSelect,
}) => {
  if (accounts.length === 0) {
    return null
  }
  
  return (
    <div className={styles.frequentAccounts}>
      <div className={styles.frequentTitle}>よく使う科目</div>
      <div className={styles.frequentList}>
        {accounts.map((account) => (
          <button
            key={account.code}
            className={styles.frequentItem}
            onClick={() => onSelect(account)}
          >
            <span className={styles.frequentCode}>{account.code}</span>
            <span className={styles.frequentName}>{account.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}