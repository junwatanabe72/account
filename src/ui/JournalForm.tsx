import React, { useMemo, useState } from 'react'
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

  const addRow = () => setRows((r) => [...r, {}])
  const removeRow = (idx: number) => setRows((r) => r.length > 1 ? r.filter((_, i) => i !== idx) : r)

  const toast = useToast()
  const submit = () => {
    const details: Array<{ accountCode: string, debitAmount: number, creditAmount: number }> = []
    let rowError = ''
    rows.forEach((r, idx) => {
      const hasDebit = !!r.debit && (r.debitAmount ?? 0) > 0
      const hasCredit = !!r.credit && (r.creditAmount ?? 0) > 0
      if (hasDebit && hasCredit) rowError = `${idx+1}行目: 同一行で借方と貸方が入力されています`
      if (!hasDebit && !hasCredit) return
      if (hasDebit) details.push({ accountCode: r.debit!, debitAmount: r.debitAmount ?? 0, creditAmount: 0 })
      if (hasCredit) details.push({ accountCode: r.credit!, debitAmount: 0, creditAmount: r.creditAmount ?? 0 })
    })
    if (rowError) { setError(rowError); toast.show(rowError,'danger'); return }
    const result = engine.createJournal({ date, description, reference, details })
    if (result.success) {
      setDescription('')
      setReference('')
      setRows([{}])
      setError(null)
      onChange()
      toast.show('仕訳を作成しました','success')
    } else {
      setError(result.errors.join('\n'))
      toast.show(result.errors.join(', '),'danger')
    }
  }

  const totals = rows.reduce((acc, r) => {
    acc.debit += r.debitAmount ?? 0
    acc.credit += r.creditAmount ?? 0
    return acc
  }, { debit: 0, credit: 0 })

  return (
    <div className="card">
      <div className="card-header"><h3 className="mb-0">仕訳入力</h3></div>
      <div className="card-body">
        <div className="mb-2">
          <label className="form-label">日付</label>
          <input className="form-control" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="mb-2">
          <label className="form-label">摘要</label>
          <input className="form-control" type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="例：3月分管理費収入" />
        </div>
        <div className="mb-3">
          <label className="form-label">伝票番号</label>
          <input className="form-control" type="text" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="自動生成" />
        </div>

        <h5>仕訳明細</h5>
        {rows.map((r, idx) => (
          <div key={idx} className="row g-2 align-items-center mb-2">
            <div className="col-md-3">
              <select className="form-select" value={r.debit ?? ''} onChange={(e) => setRows((rs) => rs.map((x, i) => i === idx ? { ...x, debit: e.target.value } : x))}>
                <option value="">借方科目</option>
                {accounts.filter(a => a.isPostable).map((a) => (
                  <option key={a.code} value={a.code}>{a.code} - {a.name}{a.division ? ` [${a.division}]` : ''}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <input className="form-control" type="number" min={0} value={r.debitAmount ?? ''} onChange={(e) => setRows((rs) => rs.map((x, i) => i === idx ? { ...x, debitAmount: Number(e.target.value) } : x))} placeholder="借方金額" />
            </div>
            <div className="col-md-3">
              <select className="form-select" value={r.credit ?? ''} onChange={(e) => setRows((rs) => rs.map((x, i) => i === idx ? { ...x, credit: e.target.value } : x))}>
                <option value="">貸方科目</option>
                {accounts.filter(a => a.isPostable).map((a) => (
                  <option key={a.code} value={a.code}>{a.code} - {a.name}{a.division ? ` [${a.division}]` : ''}</option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <input className="form-control" type="number" min={0} value={r.creditAmount ?? ''} onChange={(e) => setRows((rs) => rs.map((x, i) => i === idx ? { ...x, creditAmount: Number(e.target.value) } : x))} placeholder="貸方金額" />
            </div>
            <div className="col-md-1 text-end">
              <button className="btn btn-sm btn-outline-danger" onClick={() => removeRow(idx)}>削除</button>
            </div>
          </div>
        ))}
        <div className="mb-2">
          <button className="btn btn-sm btn-secondary" onClick={addRow}>明細追加</button>
        </div>

        <div className="d-flex justify-content-between mb-2">
          <span>借方合計: ¥{totals.debit.toLocaleString()}</span>
          <span>貸方合計: ¥{totals.credit.toLocaleString()}</span>
        </div>

        {error && <div className="text-danger" style={{ whiteSpace: 'pre-wrap' }}>{error}</div>}

        <div>
          <button className="btn btn-primary w-100" onClick={submit}>仕訳作成</button>
        </div>
      </div>
    </div>
  )
}
