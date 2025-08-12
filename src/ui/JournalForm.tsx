import React, { useMemo, useState, useRef, useEffect } from 'react'
import { AccountingEngine } from '../domain/accountingEngine'
import { useToast } from './Toast'

export const JournalForm: React.FC<{ engine: AccountingEngine, onChange: () => void }> = ({ engine, onChange }) => {
  const accounts = useMemo(() => engine.getAccounts(), [engine])
  const getToday = () => {
    const today = new Date().toISOString()
    return today.split('T')[0] || ''
  }
  const [date, setDate] = useState<string>(getToday())
  const [description, setDescription] = useState<string>('')
  const [reference, setReference] = useState<string>('')
  const [rows, setRows] = useState<Array<{ debit?: string, debitAmount?: number, credit?: string, creditAmount?: number }>>([
    {}
  ])
  const [error, setError] = useState<string | null>(null)
  
  // Refs for keyboard navigation
  const dateRef = useRef<HTMLInputElement>(null)
  const descriptionRef = useRef<HTMLInputElement>(null)
  const referenceRef = useRef<HTMLInputElement>(null)
  
  // 金額を3桁カンマ付きでフォーマット
  const formatAmount = (value: number | undefined): string => {
    if (!value) return ''
    return value.toLocaleString()
  }
  
  // フォーマットされた金額を数値に戻す
  const parseAmount = (value: string): number => {
    return Number(value.replace(/[,，]/g, ''))
  }

  const addRow = () => setRows((r) => [...r, {}])
  const removeRow = (idx: number) => setRows((r) => r.length > 1 ? r.filter((_, i) => i !== idx) : r)

  const toast = useToast()
  // キーボードショートカット
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter') {
        submit()
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [rows, date, description])
  
  const submit = () => {
    const details: Array<{ accountCode: string, debitAmount: number, creditAmount: number }> = []
    rows.forEach((r, idx) => {
      // フリー入力型：借方と貸方を独立して処理
      const debitAmount = r.debitAmount || 0
      const creditAmount = r.creditAmount || 0
      
      // 借方の処理
      if (r.debit && debitAmount > 0) {
        details.push({ accountCode: r.debit, debitAmount: debitAmount, creditAmount: 0 })
      }
      
      // 貸方の処理
      if (r.credit && creditAmount > 0) {
        details.push({ accountCode: r.credit, debitAmount: 0, creditAmount: creditAmount })
      }
    })
    const result = engine.createJournal({ date, description, reference, details })
    if (result.success) {
      setDescription('')
      setReference('')
      setRows([{}])
      setError(null)
      onChange()
      toast.show('仕訳を作成しました','success')
    } else {
      setError(result.errors?.join('\n') || 'エラーが発生しました')
      toast.show(result.errors?.join(', ') || 'エラーが発生しました','danger')
    }
  }

  const totals = rows.reduce((acc, r) => {
    acc.debit += r.debitAmount ?? 0
    acc.credit += r.creditAmount ?? 0
    return acc
  }, { debit: 0, credit: 0 })

  // 貸借バランスのチェック
  const isBalanced = Math.abs(totals.debit - totals.credit) < 0.01
  const balanceDiff = totals.debit - totals.credit

  return (
    <div className="card">
      <div className="card-header"><h3 className="mb-0">仕訳入力</h3></div>
      <div className="card-body">
        {/* 入力ガイド */}
        <div className="alert alert-info mb-3">
          <h6 className="alert-heading">入力方法（フリー入力型）</h6>
          <ul className="mb-0 small">
            <li>借方と貸方を自由に組み合わせて入力できます</li>
            <li>1つの行に借方と貸方の両方を入力することも可能です</li>
            <li>複数の勘定科目を使用する場合は「明細追加」ボタンで行を追加してください</li>
            <li>借方合計と貸方合計は必ず一致させてください</li>
            <li>Ctrl+Enterで仕訳を登録できます</li>
          </ul>
        </div>

        <div className="mb-2">
          <label className="form-label">日付</label>
          <input 
            ref={dateRef}
            className="form-control" 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && descriptionRef.current?.focus()}
          />
        </div>
        <div className="mb-2">
          <label className="form-label">摘要</label>
          <input 
            ref={descriptionRef}
            className="form-control" 
            type="text" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            placeholder="例：3月分管理費収入"
            onKeyPress={(e) => e.key === 'Enter' && referenceRef.current?.focus()}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">伝票番号 <span className="text-muted small">(Ctrl+Enter で仕訳登録)</span></label>
          <input 
            ref={referenceRef}
            className="form-control" 
            type="text" 
            value={reference} 
            onChange={(e) => setReference(e.target.value)} 
            placeholder="自動生成"
          />
        </div>

        <h5>仕訳明細</h5>
        {/* 列ヘッダー */}
        <div className="row g-2 mb-2">
          <div className="col-md-3"><small className="text-muted">借方科目</small></div>
          <div className="col-md-3"><small className="text-muted">借方金額</small></div>
          <div className="col-md-3"><small className="text-muted">貸方科目</small></div>
          <div className="col-md-2"><small className="text-muted">貸方金額</small></div>
          <div className="col-md-1"></div>
        </div>

        {rows.map((r, idx) => (
          <div key={idx} className="row g-2 align-items-center mb-2">
            <div className="col-md-3">
              <select 
                className="form-select" 
                value={r.debit ?? ''} 
                onChange={(e) => setRows((rs) => rs.map((x, i) => i === idx ? { ...x, debit: e.target.value } : x))}
              >
                <option value="">借方科目を選択</option>
                {accounts.filter(a => a.isPostable).map((a) => (
                  <option key={a.code} value={a.code}>{a.code} - {a.name}{a.division ? ` [${a.division}]` : ''}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <input 
                className="form-control" 
                type="text" 
                value={formatAmount(r.debitAmount)} 
                onChange={(e) => {
                  const numValue = parseAmount(e.target.value)
                  setRows((rs) => rs.map((x, i) => i === idx ? { ...x, debitAmount: numValue } : x))
                }} 
                placeholder="0"
              />
            </div>
            <div className="col-md-3">
              <select 
                className="form-select" 
                value={r.credit ?? ''} 
                onChange={(e) => setRows((rs) => rs.map((x, i) => i === idx ? { ...x, credit: e.target.value } : x))}
              >
                <option value="">貸方科目を選択</option>
                {accounts.filter(a => a.isPostable).map((a) => (
                  <option key={a.code} value={a.code}>{a.code} - {a.name}{a.division ? ` [${a.division}]` : ''}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <input 
                className="form-control" 
                type="text" 
                value={formatAmount(r.creditAmount)} 
                onChange={(e) => {
                  const numValue = parseAmount(e.target.value)
                  setRows((rs) => rs.map((x, i) => i === idx ? { ...x, creditAmount: numValue } : x))
                }} 
                placeholder="0"
              />
            </div>
            <div className="col-md-1 text-end">
              <button className="btn btn-sm btn-outline-danger" onClick={() => removeRow(idx)}>削除</button>
            </div>
          </div>
        ))}
        <div className="mb-3">
          <button className="btn btn-sm btn-secondary" onClick={addRow}>明細追加</button>
        </div>

        {/* 合計表示と貸借バランスチェック */}
        <div className="card mb-3">
          <div className="card-body">
            <div className="d-flex justify-content-between mb-2">
              <span>借方合計: <strong>¥{totals.debit.toLocaleString()}</strong></span>
              <span>貸方合計: <strong>¥{totals.credit.toLocaleString()}</strong></span>
            </div>
            {!isBalanced && (
              <div className="alert alert-warning mb-0">
                <i className="bi bi-exclamation-triangle"></i> 貸借が一致していません（差額: ¥{Math.abs(balanceDiff).toLocaleString()}）
              </div>
            )}
            {isBalanced && totals.debit > 0 && (
              <div className="alert alert-success mb-0">
                <i className="bi bi-check-circle"></i> 貸借が一致しています
              </div>
            )}
          </div>
        </div>

        {/* エラー表示エリア（常時表示） */}
        {error && (
          <div className="alert alert-danger mb-3" role="alert">
            <h6 className="alert-heading">エラー</h6>
            <div style={{ whiteSpace: 'pre-wrap' }}>{error}</div>
          </div>
        )}

        <div>
          <button 
            className="btn btn-primary w-100" 
            onClick={submit}
            disabled={!isBalanced || totals.debit === 0}
          >
            仕訳作成
          </button>
        </div>
      </div>
    </div>
  )
}