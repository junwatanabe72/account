import React, { useState } from 'react'
import { useJournalFormStore } from '../../../../stores/useJournalFormStore'
import { 
  incomeCategories, 
  expenseCategories, 
  AccountItem, 
  AccountCategory,
  isAccountAvailableForDivision 
} from '../../accountCategories'
import styles from './AccountModal.module.css'

interface AccountModalProps {
  onSelect: (account: AccountItem) => void
  onClose: () => void
}

export const AccountModal: React.FC<AccountModalProps> = ({
  onSelect,
  onClose,
}) => {
  const { transactionType, division } = useJournalFormStore()
  const [selectedCategory, setSelectedCategory] = useState<AccountCategory | null>(null)
  
  const categories = transactionType === 'income' ? incomeCategories : expenseCategories
  
  const handleAccountSelect = (account: AccountItem) => {
    onSelect(account)
    onClose()
  }
  
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }
  
  return (
    <div className={styles.modalBackdrop} onClick={handleBackdropClick}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>勘定科目を選択</h3>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="閉じる"
          >
            ×
          </button>
        </div>
        
        <div className={styles.modalBody}>
          {!selectedCategory ? (
            // カテゴリ一覧
            <div className={styles.categoryGrid}>
              {categories.map((category) => (
                <div
                  key={category.name}
                  className={styles.categoryCard}
                  onClick={() => setSelectedCategory(category)}
                >
                  <div className={styles.categoryIcon}>{category.icon}</div>
                  <div className={styles.categoryName}>{category.name}</div>
                </div>
              ))}
            </div>
          ) : (
            // 選択されたカテゴリの科目一覧
            <div>
              <button
                className={styles.backButton}
                onClick={() => setSelectedCategory(null)}
              >
                ← カテゴリに戻る
              </button>
              
              <h4 className={styles.categoryTitle}>
                {selectedCategory.icon} {selectedCategory.name}
              </h4>
              
              <div className={styles.accountList}>
                {selectedCategory.items
                  .filter(account => isAccountAvailableForDivision(account.code, division))
                  .map((account) => (
                    <div
                      key={account.code}
                      className={styles.accountItem}
                      onClick={() => handleAccountSelect(account)}
                    >
                      <span className={styles.accountCode}>{account.code}</span>
                      <span className={styles.accountName}>{account.name}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}