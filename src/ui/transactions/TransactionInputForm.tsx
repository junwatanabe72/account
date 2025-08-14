import React, { useState, useEffect, useRef, useMemo } from 'react'
import { AccountingEngine } from '../../domain/accountingEngine'
import { JournalEntry } from '../../types'
import { HierarchicalAccountSelect } from './HierarchicalAccountSelect'

interface TransactionInput {
  type: 'income' | 'expense' | 'transfer'
  date: string
  accountTitle: string
  amount: number
  status: 'unpaid' | 'paid'
  counterparty?: string
  dueDate?: string
  tags?: string[]
  note?: string
  paymentAccount?: string
}

interface Props {
  engine: AccountingEngine
  onChange: () => void
}

export const TransactionInputForm: React.FC<Props> = ({ engine, onChange }) => {
  const accounts = useMemo(() => engine.getAccounts(), [engine])
  const [activeTab, setActiveTab] = useState<'income' | 'expense' | 'transfer'>('expense')
  const [showPreview, setShowPreview] = useState(true)
  const [transaction, setTransaction] = useState<TransactionInput>({
    type: 'expense',
    date: new Date().toISOString().split('T')[0],
    accountTitle: '',
    amount: 0,
    status: 'unpaid',
    paymentAccount: '1101', // 現金
  })

  const [generatedJournal, setGeneratedJournal] = useState<{
    debit: { account: string; accountName: string; amount: number }
    credit: { account: string; accountName: string; amount: number }
  } | null>(null)

  // Refs for keyboard navigation
  const dateRef = useRef<HTMLInputElement>(null)
  const accountRef = useRef<HTMLSelectElement>(null)
  const amountRef = useRef<HTMLInputElement>(null)
  const counterpartyRef = useRef<HTMLInputElement>(null)
  const noteRef = useRef<HTMLTextAreaElement>(null)

  // 金額を3桁カンマ付きでフォーマット
  const formatAmount = (value: string): string => {
    const num = value.replace(/[^\d]/g, '')
    if (!num) return ''
    return Number(num).toLocaleString()
  }

  // フォーマットされた金額を数値に戻す
  const parseAmount = (value: string): number => {
    return Number(value.replace(/[,，]/g, ''))
  }

  // 仕訳を自動生成
  const generateJournalEntry = (trans: TransactionInput) => {
    if (!trans.accountTitle || trans.amount <= 0) {
      setGeneratedJournal(null)
      return
    }

    let debit = { account: '', accountName: '', amount: trans.amount }
    let credit = { account: '', accountName: '', amount: trans.amount }

    const getAccountName = (code: string) => {
      const account = accounts.find(a => a.code === code)
      return account ? account.name : code
    }

    if (trans.type === 'income') {
      if (trans.status === 'unpaid') {
        // 未収入金 / 収入科目
        debit = { account: '1301', accountName: '管理費未収金', amount: trans.amount }
        credit = { account: trans.accountTitle, accountName: getAccountName(trans.accountTitle), amount: trans.amount }
      } else {
        // 現金等 / 収入科目
        debit = { account: trans.paymentAccount || '1101', accountName: getAccountName(trans.paymentAccount || '1101'), amount: trans.amount }
        credit = { account: trans.accountTitle, accountName: getAccountName(trans.accountTitle), amount: trans.amount }
      }
    } else if (trans.type === 'expense') {
      if (trans.status === 'unpaid') {
        // 費用科目 / 未払金
        debit = { account: trans.accountTitle, accountName: getAccountName(trans.accountTitle), amount: trans.amount }
        credit = { account: '2101', accountName: '未払金', amount: trans.amount }
      } else {
        // 費用科目 / 現金等
        debit = { account: trans.accountTitle, accountName: getAccountName(trans.accountTitle), amount: trans.amount }
        credit = { account: trans.paymentAccount || '1101', accountName: getAccountName(trans.paymentAccount || '1101'), amount: trans.amount }
      }
    } else if (trans.type === 'transfer') {
      // 資金移動: 移動先 / 移動元
      const [fromAccount, toAccount] = trans.accountTitle.split('→').map(s => s.trim())
      if (fromAccount && toAccount) {
        debit = { account: toAccount, accountName: getAccountName(toAccount), amount: trans.amount }
        credit = { account: fromAccount, accountName: getAccountName(fromAccount), amount: trans.amount }
      }
    }

    setGeneratedJournal({ debit, credit })
  }

  // 取引タイプ変更時
  const handleTabChange = (type: 'income' | 'expense' | 'transfer') => {
    setActiveTab(type)
    setTransaction({ ...transaction, type, accountTitle: '' })
  }

  // 入力値変更時
  const handleInputChange = (field: keyof TransactionInput, value: any) => {
    const newTransaction = { ...transaction, [field]: value }
    setTransaction(newTransaction)
    generateJournalEntry(newTransaction)
  }

  // 金額入力の処理
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatAmount(e.target.value)
    const numValue = parseAmount(formatted)
    e.target.value = formatted
    handleInputChange('amount', numValue)
  }

  // 仕訳登録
  const handleSubmit = () => {
    if (!generatedJournal || transaction.amount <= 0) {
      alert('必要な項目を入力してください')
      return
    }

    const journal: JournalEntry = {
      id: Date.now().toString(),
      date: transaction.date,
      debit: {
        account: generatedJournal.debit.account,
        subAccount: '',
        amount: generatedJournal.debit.amount,
      },
      credit: {
        account: generatedJournal.credit.account,
        subAccount: '',
        amount: generatedJournal.credit.amount,
      },
      description: transaction.note || `${transaction.counterparty || ''} ${generatedJournal.debit.accountName}`,
      division: 'KANRI', // デフォルト区分
    }

    engine.addJournal(journal)
    onChange()

    // フォームをリセット
    setTransaction({
      ...transaction,
      accountTitle: '',
      amount: 0,
      counterparty: '',
      note: '',
    })
    setGeneratedJournal(null)

    // フォーカスを最初のフィールドに戻す
    dateRef.current?.focus()
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
  }, [generatedJournal, transaction])

  // 科目選択オプションを生成
  const getAccountOptions = () => {
    const postableAccounts = accounts.filter(a => a.isPostable)
    
    if (activeTab === 'income') {
      // 収入系の科目（5000番台）
      return postableAccounts.filter(a => a.type === 'REVENUE')
    } else if (activeTab === 'expense') {
      // 費用系の科目（6000番台）
      return postableAccounts.filter(a => a.type === 'EXPENSE')
    } else {
      // 資金移動用（現金・預金等）
      return postableAccounts.filter(a => 
        a.code === '1101' || 
        a.code === '1102' ||
        a.code === '1103' ||
        a.code === '1104'
      )
    }
  }

  // 支払口座のオプション
  const paymentAccountOptions = accounts.filter(a => 
    a.isPostable && 
    a.type === 'ASSET' && 
    (a.code === '1101' || // 現金
     a.code === '1102' || // 普通預金（管理）
     a.code === '1103' || // 普通預金（修繕）
     a.code === '1104')   // 定期預金
  )

  return (
    <div className="card">
      <div className="card-header">
        <strong>取引入力（freee風UI）</strong>
        <span className="ms-3 text-muted small">
          Ctrl+Enter で登録 | Tab で次の項目へ移動
        </span>
      </div>
      <div className="card-body">
        {/* タブ切り替え */}
        <div className="btn-group mb-3" role="group">
          <button
            type="button"
            className={`btn ${activeTab === 'income' ? 'btn-success' : 'btn-outline-success'}`}
            onClick={() => handleTabChange('income')}
          >
            💰 収入
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'expense' ? 'btn-danger' : 'btn-outline-danger'}`}
            onClick={() => handleTabChange('expense')}
          >
            💸 支出
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'transfer' ? 'btn-info' : 'btn-outline-info'}`}
            onClick={() => handleTabChange('transfer')}
          >
            🔄 口座振替
          </button>
        </div>

        <div className="row">
          {/* 左側: 必須項目 */}
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">
                発生日 <span className="text-danger">*</span>
              </label>
              <input
                ref={dateRef}
                type="date"
                className="form-control"
                value={transaction.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && accountRef.current?.focus()}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">
                {activeTab === 'transfer' ? '振替元 → 振替先' : '勘定科目'} 
                <span className="text-danger">*</span>
              </label>
              {activeTab === 'transfer' ? (
                <div className="d-flex gap-2 align-items-center">
                  <select 
                    className="form-select"
                    onChange={(e) => {
                      const toAccount = transaction.accountTitle.split('→')[1] || ''
                      handleInputChange('accountTitle', `${e.target.value}→${toAccount}`)
                    }}
                  >
                    <option value="">振替元を選択</option>
                    {paymentAccountOptions.map(a => (
                      <option key={a.code} value={a.code}>
                        {a.code} - {a.name}
                      </option>
                    ))}
                  </select>
                  <span>→</span>
                  <select 
                    className="form-select"
                    onChange={(e) => {
                      const fromAccount = transaction.accountTitle.split('→')[0] || ''
                      handleInputChange('accountTitle', `${fromAccount}→${e.target.value}`)
                    }}
                  >
                    <option value="">振替先を選択</option>
                    {paymentAccountOptions.map(a => (
                      <option key={a.code} value={a.code}>
                        {a.code} - {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <HierarchicalAccountSelect
                  accounts={accounts}
                  value={transaction.accountTitle}
                  onChange={(value) => handleInputChange('accountTitle', value)}
                  placeholder="科目を選択してください"
                />
              )}
            </div>

            <div className="mb-3">
              <label className="form-label">
                金額（税込） <span className="text-danger">*</span>
              </label>
              <input
                ref={amountRef}
                type="text"
                className="form-control"
                placeholder="0"
                onChange={handleAmountChange}
                onKeyPress={(e) => e.key === 'Enter' && counterpartyRef.current?.focus()}
              />
            </div>

            {activeTab !== 'transfer' && (
              <div className="mb-3">
                <label className="form-label">決済ステータス</label>
                <div className="btn-group w-100" role="group">
                  <button
                    type="button"
                    className={`btn ${transaction.status === 'unpaid' ? 'btn-warning' : 'btn-outline-warning'}`}
                    onClick={() => handleInputChange('status', 'unpaid')}
                  >
                    ⏳ 未決済
                  </button>
                  <button
                    type="button"
                    className={`btn ${transaction.status === 'paid' ? 'btn-success' : 'btn-outline-success'}`}
                    onClick={() => handleInputChange('status', 'paid')}
                  >
                    ✅ 決済済み
                  </button>
                </div>
              </div>
            )}

            {activeTab !== 'transfer' && transaction.status === 'paid' && (
              <div className="mb-3">
                <label className="form-label">決済口座</label>
                <select
                  className="form-select"
                  value={transaction.paymentAccount}
                  onChange={(e) => handleInputChange('paymentAccount', e.target.value)}
                >
                  {paymentAccountOptions.map(a => (
                    <option key={a.code} value={a.code}>
                      {a.code} - {a.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 右側: 任意項目 */}
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">取引先</label>
              <input
                ref={counterpartyRef}
                type="text"
                className="form-control"
                placeholder="例: ○○商店"
                value={transaction.counterparty || ''}
                onChange={(e) => handleInputChange('counterparty', e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && noteRef.current?.focus()}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">決済期日</label>
              <input
                type="date"
                className="form-control"
                value={transaction.dueDate || ''}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">備考</label>
              <textarea
                ref={noteRef}
                className="form-control"
                rows={3}
                placeholder="取引の詳細をメモ"
                value={transaction.note || ''}
                onChange={(e) => handleInputChange('note', e.target.value)}
              />
            </div>

            <button
              className="btn btn-primary w-100"
              onClick={handleSubmit}
              disabled={!generatedJournal || transaction.amount <= 0}
            >
              <strong>登録する</strong>
              <span className="ms-2 small">(Ctrl + Enter)</span>
            </button>
          </div>
        </div>

        {/* 仕訳プレビュー */}
        <div className="mt-4">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <button
              className="btn btn-sm btn-link text-decoration-none"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? '▼' : '▶'} 仕訳プレビュー
            </button>
            {generatedJournal && (
              <span className="badge bg-success">
                貸借一致 ✓
              </span>
            )}
          </div>
          
          {showPreview && generatedJournal && (
            <div className="table-responsive">
              <table className="table table-sm table-bordered">
                <thead className="table-light">
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
                  <tr>
                    <td>{transaction.date}</td>
                    <td>{generatedJournal.debit.accountName}</td>
                    <td className="text-end">{generatedJournal.debit.amount.toLocaleString()}</td>
                    <td>{generatedJournal.credit.accountName}</td>
                    <td className="text-end">{generatedJournal.credit.amount.toLocaleString()}</td>
                    <td>対象外</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}