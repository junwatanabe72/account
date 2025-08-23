import React from 'react'
import { AccountingEngine } from '../../domain/accountingEngine'
import styles from './DivisionAccountingView.module.css'

export const DivisionAccountingView: React.FC<{ engine: AccountingEngine }> = ({ engine }) => {
  const divisions = engine.getDivisionTrialBalance()

  return (
    <div className={styles.container}>
      <h3>区分経理状況</h3>
      <div className={styles.content}>
        {Array.from(divisions.entries()).map(([code, div]) => {
          const hasAny = div.totalAssets > 0 || div.totalLiabilities > 0 || div.totalRevenues > 0 || div.totalExpenses > 0
          if (code === 'OTHER' && !hasAny) return null
          const netIncome = div.totalRevenues - div.totalExpenses
          return (
            <div key={code} className={styles.divisionCard}>
              <div className={styles.divisionHeader}>
                <strong>{div.name}</strong>
              </div>
              <div className={styles.divisionBody}>
                <div className={styles.accountGroups}>
                  <div className={styles.accountGroup}>
                    <h4 className={`${styles.accountGroupTitle} ${styles.assets}`}>資産</h4>
                    <ul className={styles.accountList}>
                      {div.assets.length === 0 ? <li className={styles.emptyItem}>なし</li> : div.assets.map(a => (
                        <li key={a.code}>{a.name}: ¥{a.amount.toLocaleString()}</li>
                      ))}
                    </ul>
                    <div className={styles.totalAmount}>資産計: ¥{div.totalAssets.toLocaleString()}</div>
                  </div>
                  <div className={styles.accountGroup}>
                    <h4 className={`${styles.accountGroupTitle} ${styles.liabilities}`}>負債</h4>
                    <ul className={styles.accountList}>
                      {div.liabilities.length === 0 ? <li className={styles.emptyItem}>なし</li> : div.liabilities.map(a => (
                        <li key={a.code}>{a.name}: ¥{a.amount.toLocaleString()}</li>
                      ))}
                    </ul>
                    <div className={styles.totalAmount}>負債計: ¥{div.totalLiabilities.toLocaleString()}</div>
                  </div>
                </div>
                <div className={styles.accountGroups}>
                  <div className={styles.accountGroup}>
                    <h4 className={`${styles.accountGroupTitle} ${styles.revenue}`}>収益</h4>
                    <ul className={styles.accountList}>
                      {div.revenues.length === 0 ? <li className={styles.emptyItem}>なし</li> : div.revenues.map(a => (
                        <li key={a.code}>{a.name}: ¥{a.amount.toLocaleString()}</li>
                      ))}
                    </ul>
                    <div className={styles.totalAmount}>収益計: ¥{div.totalRevenues.toLocaleString()}</div>
                  </div>
                  <div className={styles.accountGroup}>
                    <h4 className={`${styles.accountGroupTitle} ${styles.expenses}`}>費用</h4>
                    <ul className={styles.accountList}>
                      {div.expenses.length === 0 ? <li className={styles.emptyItem}>なし</li> : div.expenses.map(a => (
                        <li key={a.code}>{a.name}: ¥{a.amount.toLocaleString()}</li>
                      ))}
                    </ul>
                    <div className={styles.totalAmount}>費用計: ¥{div.totalExpenses.toLocaleString()}</div>
                  </div>
                </div>
                <div className={styles.netIncomeSection}>
                  <h5 className={styles.netIncomeTitle}>収支差額</h5>
                  <div className={`${styles.netIncomeValue} ${netIncome < 0 ? styles.negative : ''}`}>
                    ¥{Math.abs(netIncome).toLocaleString()} {netIncome >= 0 ? '（黒字）' : '（赤字）'}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
