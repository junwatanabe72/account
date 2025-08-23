import React, { useMemo } from 'react'
import { useJournalFormStore } from '../../../stores/useJournalFormStore'
import { defaultBankAccounts } from '../../../data/bankAccounts'
import styles from './JournalPreview.module.css'

interface JournalDetail {
  accountCode: string
  accountName: string
  debitAmount: number
  creditAmount: number
}

export const JournalPreview: React.FC = () => {
  const {
    transactionType,
    date,
    amount,
    description,
    selectedAccount,
    transferFromAccount,
    transferToAccount,
    paymentAccount,
    paymentStatus,
    division,
    tags,
  } = useJournalFormStore()
  
  // 支払口座のコードを取得
  const getPaymentAccountCode = (): string => {
    switch (paymentAccount) {
      case 'cash':
        return '1111' // 現金
      case 'kanri_bank':
        return '1121' // 普通預金（管理費口座）
      case 'shuzen_bank':
        return '1122' // 普通預金（修繕積立金口座）
      default:
        return '1121'
    }
  }
  
  // 支払口座の名前を取得
  const getPaymentAccountName = (): string => {
    switch (paymentAccount) {
      case 'cash':
        return '現金'
      case 'kanri_bank':
        return '普通預金（管理費口座）'
      case 'shuzen_bank':
        return '普通預金（修繕積立金口座）'
      default:
        return '普通預金'
    }
  }
  
  // 仕訳明細の生成
  const journalDetails = useMemo((): JournalDetail[] | null => {
    if (!amount || parseFloat(amount) <= 0) return null
    
    const numAmount = parseFloat(amount)
    
    if (transactionType === 'transfer') {
      // 振替の場合
      if (!transferFromAccount || !transferToAccount) return null
      
      const fromAccount = defaultBankAccounts.find(acc => acc.id === transferFromAccount)
      const toAccount = defaultBankAccounts.find(acc => acc.id === transferToAccount)
      
      if (!fromAccount || !toAccount) return null
      
      return [
        {
          accountCode: toAccount.code,
          accountName: toAccount.name,
          debitAmount: numAmount,
          creditAmount: 0,
        },
        {
          accountCode: fromAccount.code,
          accountName: fromAccount.name,
          debitAmount: 0,
          creditAmount: numAmount,
        },
      ]
    } else if (transactionType === 'income') {
      // 収入の場合
      if (!selectedAccount) return null
      
      if (paymentStatus === 'completed') {
        // 入金済み
        return [
          {
            accountCode: getPaymentAccountCode(),
            accountName: getPaymentAccountName(),
            debitAmount: numAmount,
            creditAmount: 0,
          },
          {
            accountCode: selectedAccount.code,
            accountName: selectedAccount.name,
            debitAmount: 0,
            creditAmount: numAmount,
          },
        ]
      } else {
        // 未収の場合
        const receivableCode = getReceivableCode(selectedAccount.code)
        const receivableName = getReceivableName(selectedAccount.code)
        
        return [
          {
            accountCode: receivableCode,
            accountName: receivableName,
            debitAmount: numAmount,
            creditAmount: 0,
          },
          {
            accountCode: selectedAccount.code,
            accountName: selectedAccount.name,
            debitAmount: 0,
            creditAmount: numAmount,
          },
        ]
      }
    } else if (transactionType === 'expense') {
      // 支出の場合
      if (!selectedAccount) return null
      
      if (paymentStatus === 'completed') {
        // 支払済み
        return [
          {
            accountCode: selectedAccount.code,
            accountName: selectedAccount.name,
            debitAmount: numAmount,
            creditAmount: 0,
          },
          {
            accountCode: getPaymentAccountCode(),
            accountName: getPaymentAccountName(),
            debitAmount: 0,
            creditAmount: numAmount,
          },
        ]
      } else {
        // 未払いの場合
        return [
          {
            accountCode: selectedAccount.code,
            accountName: selectedAccount.name,
            debitAmount: numAmount,
            creditAmount: 0,
          },
          {
            accountCode: '2111', // 未払金
            accountName: '未払金',
            debitAmount: 0,
            creditAmount: numAmount,
          },
        ]
      }
    }
    
    return null
  }, [
    transactionType,
    amount,
    selectedAccount,
    transferFromAccount,
    transferToAccount,
    paymentAccount,
    paymentStatus,
  ])
  
  // 未収金コードの取得
  const getReceivableCode = (incomeCode: string): string => {
    switch (incomeCode) {
      case '4111': // 管理費収入
        return '1311' // 管理費未収金
      case '4112': // 修繕積立金収入
        return '1312' // 修繕積立金未収金
      case '4121': // 駐車場収入
        return '1321' // 駐車場使用料未収金
      default:
        return '1399' // その他未収金
    }
  }
  
  // 未収金名称の取得
  const getReceivableName = (incomeCode: string): string => {
    switch (incomeCode) {
      case '4111':
        return '管理費未収金'
      case '4112':
        return '修繕積立金未収金'
      case '4121':
        return '駐車場使用料未収金'
      default:
        return '未収金'
    }
  }
  
  if (!journalDetails || journalDetails.length === 0) {
    return null
  }
  
  const totalDebit = journalDetails.reduce((sum, d) => sum + d.debitAmount, 0)
  const totalCredit = journalDetails.reduce((sum, d) => sum + d.creditAmount, 0)
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01
  
  return (
    <div className={styles.container}>
      <h3 className={styles.title}>仕訳プレビュー</h3>
      
      {/* 仕訳情報 */}
      <div className={styles.info}>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>日付:</span>
          <span className={styles.infoValue}>{date || '未設定'}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>摘要:</span>
          <span className={styles.infoValue}>{description || '未入力'}</span>
        </div>
        {tags.length > 0 && (
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>タグ:</span>
            <span className={styles.infoValue}>{tags.join(', ')}</span>
          </div>
        )}
      </div>
      
      {/* 仕訳明細 */}
      <table className={styles.table}>
        <thead>
          <tr>
            <th>借方科目</th>
            <th>借方金額</th>
            <th>貸方科目</th>
            <th>貸方金額</th>
          </tr>
        </thead>
        <tbody>
          {journalDetails.map((detail, index) => (
            <tr key={index}>
              <td>
                {detail.debitAmount > 0 && (
                  <>
                    <span className={styles.accountCode}>{detail.accountCode}</span>
                    <span className={styles.accountName}>{detail.accountName}</span>
                  </>
                )}
              </td>
              <td className={styles.amount}>
                {detail.debitAmount > 0 && detail.debitAmount.toLocaleString()}
              </td>
              <td>
                {detail.creditAmount > 0 && (
                  <>
                    <span className={styles.accountCode}>{detail.accountCode}</span>
                    <span className={styles.accountName}>{detail.accountName}</span>
                  </>
                )}
              </td>
              <td className={styles.amount}>
                {detail.creditAmount > 0 && detail.creditAmount.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th>合計</th>
            <th className={styles.total}>{totalDebit.toLocaleString()}</th>
            <th>合計</th>
            <th className={styles.total}>{totalCredit.toLocaleString()}</th>
          </tr>
        </tfoot>
      </table>
      
      {/* バランスチェック */}
      {!isBalanced && (
        <div className={styles.warning}>
          ⚠️ 貸借が一致していません
        </div>
      )}
      
      {isBalanced && (
        <div className={styles.success}>
          ✅ 貸借一致
        </div>
      )}
    </div>
  )
}