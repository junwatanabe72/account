import React, { useState, useRef, useEffect, useMemo } from 'react'
import { AccountingEngine } from '../../domain/accountingEngine'
import { useToast } from '../common/Toast'
import { Transaction, TransactionType, PaymentStatus, JournalPreview } from '../../types/transaction'
import { JournalGenerationEngine } from '../../domain/services/JournalGenerationEngine'
import { 
  AccountingDivision, 
  DEFAULT_ACCOUNTING_DIVISIONS, 
  getGroupedAccountingDivisions,
  filterAccountsByDivision 
} from '../../types/accountingDivision'
import { HierarchicalAccountSelect } from './HierarchicalAccountSelect'

interface TransactionFormProps {
  engine: AccountingEngine
  onChange: () => void
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ engine, onChange }) => {
  const accounts = useMemo(() => engine.getAccounts(), [engine])
  const toast = useToast()
  
  // 取引タイプの状態
  const [transactionType, setTransactionType] = useState<TransactionType>('expense')
  
  // 会計区分の状態
  const [divisionCode, setDivisionCode] = useState<string>('GENERAL')
  const [divisions] = useState<AccountingDivision[]>(DEFAULT_ACCOUNTING_DIVISIONS)
  const divisionGroups = getGroupedAccountingDivisions(divisions)
  
  // フォームの状態
  const [occurredOn, setOccurredOn] = useState<string>(new Date().toISOString().split('T')[0])
  const [accountCode, setAccountCode] = useState<string>('')
  const [amount, setAmount] = useState<string>('')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('paid')
  const [paymentAccountCode, setPaymentAccountCode] = useState<string>('1101') // デフォルト：現金
  const [note, setNote] = useState<string>('')
  const [tags, setTags] = useState<string>('')
  const [dueOn, setDueOn] = useState<string>('')
  
  // 仕訳プレビュー
  const [journalPreview, setJournalPreview] = useState<JournalPreview | null>(null)
  const [showPreview, setShowPreview] = useState<boolean>(false)
  const [previewError, setPreviewError] = useState<string>('')
  
  // refs
  const dateRef = useRef<HTMLInputElement>(null)
  const accountRef = useRef<HTMLSelectElement>(null)
  const amountRef = useRef<HTMLInputElement>(null)
  
  // 金額フォーマット
  const formatAmount = (value: string): string => {
    const num = value.replace(/[^0-9]/g, '')
    if (!num) return ''
    return parseInt(num).toLocaleString()
  }
  
  // 勘定科目のフィルタリング
  const getAccountOptions = () => {
    // まず会計区分でフィルタリング
    const divisionFiltered = filterAccountsByDivision(accounts, divisionCode)
    const postableAccounts = divisionFiltered.filter(a => a.isPostable)
    
    switch (transactionType) {
      case 'income':
        // 収益科目と負債科目（借入金など）
        return postableAccounts.filter(a => 
          a.type === 'REVENUE' || 
          (a.type === 'LIABILITY' && a.code.startsWith('21'))
        )
      
      case 'expense':
        // 費用科目
        return postableAccounts.filter(a => a.type === 'EXPENSE')
      
      case 'transfer':
        // 資産科目（現金、預金など）
        return postableAccounts.filter(a => 
          a.type === 'ASSET' && 
          (a.code.startsWith('11') || a.code.startsWith('12'))
        )
      
      default:
        return postableAccounts
    }
  }
  
  // 決済口座のオプション（現金・預金のみ）
  const paymentAccountOptions = accounts.filter(a => 
    a.isPostable && 
    a.type === 'ASSET' && 
    (a.code === '1111' || a.code.startsWith('1112'))
  )
  
  // 仕訳プレビューの生成
  useEffect(() => {
    if (!accountCode || !amount) {
      setJournalPreview(null)
      setPreviewError('')
      return
    }
    
    try {
      const numAmount = parseInt(amount.replace(/[^0-9]/g, ''))
      if (isNaN(numAmount) || numAmount <= 0) {
        setJournalPreview(null)
        setPreviewError('金額を正しく入力してください')
        return
      }
      
      // 仮の取引データを作成
      const tempTransaction: Transaction = {
        id: 'preview',
        type: transactionType,
        divisionCode: divisionCode,
        occurredOn: occurredOn,
        accountCode: accountCode,
        amount: numAmount,
        status: paymentStatus,
        paymentAccountCode: paymentStatus === 'paid' ? paymentAccountCode : undefined,
        note: note,
        tags: tags ? tags.split(',').map(t => t.trim()) : undefined,
        dueOn: dueOn || undefined,
        createdAt: new Date()
      }
      
      // 仕訳生成エンジンを使用してプレビューを生成
      const generationEngine = new JournalGenerationEngine(engine.accountService)
      const journalData = generationEngine.generateJournal(tempTransaction)
      
      // プレビュー用のデータに変換
      const preview: JournalPreview = {
        date: journalData.date,
        entries: journalData.details.map(detail => {
          const account = accounts.find(a => a.code === detail.accountCode)
          return {
            debitAccount: detail.debitAmount > 0 ? (account?.name || detail.accountCode) : '',
            debitAmount: detail.debitAmount,
            creditAccount: detail.creditAmount > 0 ? (account?.name || detail.accountCode) : '',
            creditAmount: detail.creditAmount,
            taxCategory: '対象外' // TODO: 税区分の実装
          }
        }).filter(e => e.debitAmount > 0 || e.creditAmount > 0),
        isBalanced: true,
        totalAmount: numAmount
      }
      
      setJournalPreview(preview)
      setPreviewError('')
    } catch (error) {
      setJournalPreview(null)
      setPreviewError(error instanceof Error ? error.message : '仕訳生成エラー')
    }
  }, [transactionType, occurredOn, accountCode, amount, paymentStatus, paymentAccountCode, accounts, engine])
  
  // フォームのリセット
  const resetForm = () => {
    setAccountCode('')
    setAmount('')
    setNote('')
    setTags('')
    setDueOn('')
    setJournalPreview(null)
    setPreviewError('')
  }
  
  // 登録処理
  const handleSubmit = () => {
    // バリデーション
    if (!accountCode) {
      toast.show('勘定科目を選択してください', 'danger')
      return
    }
    
    const numAmount = parseInt(amount.replace(/[^0-9]/g, ''))
    if (!numAmount || numAmount <= 0) {
      toast.show('金額を入力してください', 'danger')
      return
    }
    
    if (paymentStatus === 'paid' && !paymentAccountCode) {
      toast.show('決済口座を選択してください', 'danger')
      return
    }
    
    try {
      // 取引データを作成
      const transaction: Transaction = {
        id: `t_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: transactionType,
        divisionCode: divisionCode,
        occurredOn: occurredOn,
        accountCode: accountCode,
        amount: numAmount,
        status: paymentStatus,
        paymentAccountCode: paymentStatus === 'paid' ? paymentAccountCode : undefined,
        note: note,
        tags: tags ? tags.split(',').map(t => t.trim()) : undefined,
        dueOn: dueOn || undefined,
        createdAt: new Date()
      }
      
      // 仕訳生成エンジンを使用して仕訳を生成
      const generationEngine = new JournalGenerationEngine(engine.accountService)
      const journalData = generationEngine.generateJournal(transaction)
      
      // 仕訳を登録（autoPost: trueで自動転記）
      const result = engine.createJournal(journalData, { autoPost: true })
      
      if (result.success) {
        toast.show('取引を登録しました', 'success')
        resetForm()
        onChange()
      } else {
        toast.show(result.errors?.join(', ') || 'エラーが発生しました', 'danger')
      }
    } catch (error) {
      toast.show(error instanceof Error ? error.message : '登録エラー', 'danger')
    }
  }
  
  // キーボードショートカット
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter') {
        handleSubmit()
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [accountCode, amount, paymentStatus, paymentAccountCode])
  
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="mb-0">取引の登録</h3>
      </div>
      <div className="card-body">
        {/* 会計区分選択 */}
        <div className="alert alert-warning mb-3">
          <h6 className="alert-heading">
            <i className="bi bi-exclamation-triangle"></i> 会計区分の選択（重要）
          </h6>
          <p className="mb-2 small">取引を登録する前に、必ず会計区分を選択してください。</p>
          <select 
            className="form-select"
            value={divisionCode}
            onChange={(e) => {
              setDivisionCode(e.target.value)
              setAccountCode('') // 会計区分変更時は勘定科目をリセット
            }}
          >
            {divisionGroups.map(group => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map(division => (
                  <option key={division.code} value={division.code}>
                    {division.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        
        {/* 取引タイプ選択 */}
        <div className="btn-group w-100 mb-3" role="group">
          <button
            type="button"
            className={`btn ${transactionType === 'income' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setTransactionType('income')}
          >
            <i className="bi bi-arrow-down-circle"></i> 収入
          </button>
          <button
            type="button"
            className={`btn ${transactionType === 'expense' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setTransactionType('expense')}
          >
            <i className="bi bi-arrow-up-circle"></i> 支出
          </button>
          <button
            type="button"
            className={`btn ${transactionType === 'transfer' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setTransactionType('transfer')}
          >
            <i className="bi bi-arrow-left-right"></i> 資金移動
          </button>
        </div>
        
        <div className="row">
          {/* 左側：必須項目 */}
          <div className="col-md-6">
            <h5 className="mb-3">基本情報</h5>
            
            {/* 発生日 */}
            <div className="mb-3">
              <label className="form-label">発生日 <span className="text-danger">*</span></label>
              <input
                ref={dateRef}
                type="date"
                className="form-control"
                value={occurredOn}
                onChange={(e) => setOccurredOn(e.target.value)}
              />
            </div>
            
            {/* 勘定科目 */}
            <div className="mb-3">
              <label className="form-label">
                {transactionType === 'transfer' ? '移動先口座' : '勘定科目'} 
                <span className="text-danger"> *</span>
              </label>
              <HierarchicalAccountSelect
                accounts={accounts}
                value={accountCode}
                onChange={(value) => setAccountCode(value)}
                placeholder="科目を選択"
              />
            </div>
            
            {/* 金額 */}
            <div className="mb-3">
              <label className="form-label">金額（税込） <span className="text-danger">*</span></label>
              <div className="input-group">
                <span className="input-group-text">¥</span>
                <input
                  ref={amountRef}
                  type="text"
                  className="form-control"
                  value={amount}
                  onChange={(e) => setAmount(formatAmount(e.target.value))}
                  placeholder="0"
                />
              </div>
            </div>
            
            {/* 決済ステータス */}
            <div className="mb-3">
              <label className="form-label">決済ステータス</label>
              <div className="btn-group w-100" role="group">
                <button
                  type="button"
                  className={`btn ${paymentStatus === 'unpaid' ? 'btn-warning' : 'btn-outline-warning'}`}
                  onClick={() => setPaymentStatus('unpaid')}
                  disabled={transactionType === 'transfer'}
                >
                  未決済
                </button>
                <button
                  type="button"
                  className={`btn ${paymentStatus === 'paid' ? 'btn-success' : 'btn-outline-success'}`}
                  onClick={() => setPaymentStatus('paid')}
                >
                  決済済み
                </button>
              </div>
            </div>
            
            {/* 決済口座（決済済みの場合） */}
            {(paymentStatus === 'paid' || transactionType === 'transfer') && (
              <div className="mb-3">
                <label className="form-label">
                  {transactionType === 'transfer' ? '移動元口座' : '決済口座'} 
                  <span className="text-danger"> *</span>
                </label>
                <select
                  className="form-select"
                  value={paymentAccountCode}
                  onChange={(e) => setPaymentAccountCode(e.target.value)}
                >
                  <option value="">選択してください</option>
                  {paymentAccountOptions.map(account => (
                    <option key={account.code} value={account.code}>
                      {account.code} - {account.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          
          {/* 右側：任意項目 */}
          <div className="col-md-6">
            <h5 className="mb-3">詳細情報</h5>
            
            {/* 決済期日（未決済の場合） */}
            {paymentStatus === 'unpaid' && transactionType !== 'transfer' && (
              <div className="mb-3">
                <label className="form-label">決済期日</label>
                <input
                  type="date"
                  className="form-control"
                  value={dueOn}
                  onChange={(e) => setDueOn(e.target.value)}
                />
              </div>
            )}
            
            {/* タグ */}
            <div className="mb-3">
              <label className="form-label">タグ</label>
              <input
                type="text"
                className="form-control"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="タグ1, タグ2, ..."
              />
              <small className="text-muted">カンマ区切りで複数入力可能</small>
            </div>
            
            {/* 備考 */}
            <div className="mb-3">
              <label className="form-label">備考</label>
              <textarea
                className="form-control"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="取引の詳細など"
              />
            </div>
          </div>
        </div>
        
        {/* 仕訳プレビュー */}
        <div className="mt-4">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="mb-0">仕訳プレビュー</h5>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? '非表示' : '表示'}
            </button>
          </div>
          
          {showPreview && (
            <div className="border rounded p-3 bg-light">
              {previewError ? (
                <div className="alert alert-warning mb-0">
                  <i className="bi bi-exclamation-triangle"></i> {previewError}
                </div>
              ) : journalPreview ? (
                <table className="table table-sm mb-0">
                  <thead>
                    <tr>
                      <th>発生日</th>
                      <th>借方科目</th>
                      <th>借方金額</th>
                      <th>貸方科目</th>
                      <th>貸方金額</th>
                      <th>税区分</th>
                    </tr>
                  </thead>
                  <tbody>
                    {journalPreview.entries.map((entry, idx) => (
                      <tr key={idx}>
                        <td>{journalPreview.date}</td>
                        <td>{entry.debitAccount}</td>
                        <td className="text-end">
                          {entry.debitAmount > 0 ? `¥${entry.debitAmount.toLocaleString()}` : ''}
                        </td>
                        <td>{entry.creditAccount}</td>
                        <td className="text-end">
                          {entry.creditAmount > 0 ? `¥${entry.creditAmount.toLocaleString()}` : ''}
                        </td>
                        <td>{entry.taxCategory || '対象外'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-muted mb-0">
                  勘定科目と金額を入力すると仕訳が表示されます
                </p>
              )}
            </div>
          )}
        </div>
        
        {/* 登録ボタン */}
        <div className="mt-4">
          <button
            className="btn btn-primary btn-lg w-100"
            onClick={handleSubmit}
            disabled={!accountCode || !amount || (paymentStatus === 'paid' && !paymentAccountCode)}
          >
            <i className="bi bi-check-circle"></i> 登録する
            <small className="ms-2">(Ctrl+Enter)</small>
          </button>
        </div>
      </div>
    </div>
  )
}