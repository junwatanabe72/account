import React, { useCallback } from 'react'
import { useJournalFormStore } from '../../stores/useJournalFormStore'
import { AccountingEngine } from '../../domain/accountingEngine'

// コンポーネントのインポート
import { ValidationMessage } from './components/ValidationMessage'
import { DivisionSelector } from './components/DivisionSelector'
import { TransactionTypeSelector } from './components/TransactionTypeSelector'
import { DateInput } from './components/DateInput'
import { AmountInput } from './components/AmountInput'
import { DescriptionInput } from './components/DescriptionInput'
import { AccountSelector } from './components/AccountSelector'
import { TransferForm } from './components/TransferForm'
import { PaymentOptions } from './components/PaymentOptions'
import { TagManager } from './components/TagManager'
import { JournalPreview } from './components/JournalPreview'

import styles from './FreeeStyleJournalForm.module.css'

interface FreeeStyleJournalFormProps {
  engine?: AccountingEngine
  onChange?: () => void
  onSubmit?: (entry: any) => void
}

/**
 * リファクタリング版 仕訳入力フォーム
 * 1096行のモノリシックコンポーネントを12個の専門コンポーネントに分割
 */
const FreeeStyleJournalFormRefactored: React.FC<FreeeStyleJournalFormProps> = ({
  engine,
  onChange,
  onSubmit,
}) => {
  const {
    transactionType,
    date,
    amount,
    description,
    selectedAccount,
    transferFromAccount,
    transferToAccount,
    division,
    serviceMonth,
    payerId,
    tags,
    paymentAccount,
    paymentStatus,
    validateForm,
    resetForm,
    setValidationMessage,
  } = useJournalFormStore()
  
  // 仕訳データの生成
  const generateJournalEntry = useCallback(() => {
    const numAmount = parseFloat(amount) || 0
    
    const baseEntry = {
      date,
      description,
      division,
      serviceMonth,
      payerId,
      tags: tags.length > 0 ? tags : undefined,
    }
    
    if (transactionType === 'transfer') {
      // 振替の場合
      const fromAccount = defaultBankAccounts.find(acc => acc.id === transferFromAccount)
      const toAccount = defaultBankAccounts.find(acc => acc.id === transferToAccount)
      
      if (!fromAccount || !toAccount) return null
      
      return {
        ...baseEntry,
        details: [
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
        ],
      }
    } else if (transactionType === 'income') {
      // 収入の場合
      if (!selectedAccount) return null
      
      const debitAccount = paymentStatus === 'completed' 
        ? getPaymentAccountForIncome()
        : getReceivableAccount(selectedAccount.code)
      
      return {
        ...baseEntry,
        details: [
          {
            accountCode: debitAccount.code,
            accountName: debitAccount.name,
            debitAmount: numAmount,
            creditAmount: 0,
          },
          {
            accountCode: selectedAccount.code,
            accountName: selectedAccount.name,
            debitAmount: 0,
            creditAmount: numAmount,
          },
        ],
      }
    } else {
      // 支出の場合
      if (!selectedAccount) return null
      
      const creditAccount = paymentStatus === 'completed'
        ? getPaymentAccountForExpense()
        : { code: '2111', name: '未払金' }
      
      return {
        ...baseEntry,
        details: [
          {
            accountCode: selectedAccount.code,
            accountName: selectedAccount.name,
            debitAmount: numAmount,
            creditAmount: 0,
          },
          {
            accountCode: creditAccount.code,
            accountName: creditAccount.name,
            debitAmount: 0,
            creditAmount: numAmount,
          },
        ],
      }
    }
  }, [
    transactionType,
    date,
    amount,
    description,
    selectedAccount,
    transferFromAccount,
    transferToAccount,
    division,
    serviceMonth,
    payerId,
    tags,
    paymentStatus,
    paymentAccount,
  ])
  
  // フォーム送信処理
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    const journalEntry = generateJournalEntry()
    if (!journalEntry) {
      setValidationMessage({
        type: 'error',
        message: '仕訳データの生成に失敗しました',
      })
      return
    }
    
    // AccountingEngineに登録
    if (engine) {
      try {
        engine.addJournal(journalEntry.details, journalEntry.description, journalEntry.date)
        
        setValidationMessage({
          type: 'success',
          message: '仕訳を登録しました',
        })
        
        // コールバック実行
        if (onChange) onChange()
        if (onSubmit) onSubmit(journalEntry)
        
        // フォームリセット
        setTimeout(() => {
          resetForm()
        }, 1000)
      } catch (error) {
        setValidationMessage({
          type: 'error',
          message: `登録エラー: ${error instanceof Error ? error.message : '不明なエラー'}`,
        })
      }
    }
  }, [engine, validateForm, generateJournalEntry, onChange, onSubmit, resetForm, setValidationMessage])
  
  // ヘルパー関数
  const getPaymentAccountForIncome = () => {
    switch (paymentAccount) {
      case 'cash':
        return { code: '1111', name: '現金' }
      case 'kanri_bank':
        return { code: '1121', name: '普通預金（管理費口座）' }
      case 'shuzen_bank':
        return { code: '1122', name: '普通預金（修繕積立金口座）' }
      default:
        return { code: '1121', name: '普通預金' }
    }
  }
  
  const getPaymentAccountForExpense = () => {
    return getPaymentAccountForIncome() // 同じロジック
  }
  
  const getReceivableAccount = (incomeCode: string) => {
    switch (incomeCode) {
      case '4111':
        return { code: '1311', name: '管理費未収金' }
      case '4112':
        return { code: '1312', name: '修繕積立金未収金' }
      case '4121':
        return { code: '1321', name: '駐車場使用料未収金' }
      default:
        return { code: '1399', name: '未収金' }
    }
  }
  
  // defaultBankAccountsのインポートが必要
  const defaultBankAccounts = [
    { id: 'kanri_bank', code: '1121', name: '普通預金（管理費口座）' },
    { id: 'shuzen_bank', code: '1122', name: '普通預金（修繕積立金口座）' },
    { id: 'cash', code: '1111', name: '現金' },
  ]
  
  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2 className={styles.title}>
          かんたん仕訳入力
          <span className={styles.badge}>リファクタリング版</span>
        </h2>
        
        {/* バリデーションメッセージ */}
        <ValidationMessage />
        
        {/* 会計区分選択 */}
        <DivisionSelector />
        
        {/* 取引タイプ選択 */}
        <TransactionTypeSelector />
        
        {/* 日付入力 */}
        <DateInput />
        
        {/* 金額入力 */}
        <AmountInput />
        
        {/* 摘要入力 */}
        <DescriptionInput />
        
        {/* 勘定科目選択 or 振替フォーム */}
        {transactionType === 'transfer' ? (
          <TransferForm />
        ) : (
          <AccountSelector />
        )}
        
        {/* 支払オプション（支出の場合のみ） */}
        <PaymentOptions />
        
        {/* タグ管理 */}
        <TagManager />
        
        {/* 仕訳プレビュー */}
        <JournalPreview />
        
        {/* 送信ボタン */}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.resetButton}
            onClick={resetForm}
          >
            リセット
          </button>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={!amount || !description}
          >
            仕訳を登録
          </button>
        </div>
      </form>
    </div>
  )
}

export default FreeeStyleJournalFormRefactored