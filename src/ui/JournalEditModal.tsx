import React from 'react'
import { AccountingEngine } from '../domain/accountingEngine'

export const JournalEditModal: React.FC<{ engine: AccountingEngine, journalId: string, onClose: () => void, onSaved: () => void }>
= ({ engine, journalId, onClose, onSaved }) => {
  const j = engine.journals.find(x => x.id === journalId)
  const [date, setDate] = React.useState(j?.date ?? '')
  const [description, setDescription] = React.useState(j?.description ?? '')
  const [rows, setRows] = React.useState<Array<{ accountCode: string, debitAmount?: number, creditAmount?: number }>>(
    j?.details.map(d => ({ accountCode: d.accountCode, debitAmount: d.debitAmount, creditAmount: d.creditAmount })) ?? []
  )
  const [error, setError] = React.useState<string | null>(null)

  if (!j) return null

  const accounts = Array.from(engine.accounts.values()).filter(a => a.isPostable).sort((a,b) => a.code.localeCompare(b.code))

  const addRow = () => setRows(r => [...r, { accountCode: '', debitAmount: 0, creditAmount: 0 }])
  const removeRow = (idx: number) => setRows(r => r.filter((_, i) => i !== idx))

  const save = () => {
    const details = rows.map(r => ({ accountCode: r.accountCode, debitAmount: r.debitAmount ?? 0, creditAmount: r.creditAmount ?? 0 }))
    const res = engine.updateJournal(journalId, { date, description, details })
    if (!(res as any).success) { setError((res as any).errors.join('\n')); return }
    onSaved(); onClose(); alert('仕訳を更新しました')
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: '95%', maxWidth: 980 }}>
        <div className="card-header d-flex justify-content-between align-items-center">
          <strong>仕訳を編集</strong>
          <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>× 閉じる</button>
        </div>
        <div className="card-body">
          <div className="row g-2 mb-2">
            <div className="col-md-3">
              <label className="form-label">日付</label>
              <input className="form-control" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="col-md-9">
              <label className="form-label">摘要</label>
              <input className="form-control" type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>

          <h6>仕訳明細</h6>
          {rows.map((r, idx) => (
            <div key={idx} className="row g-2 align-items-center mb-2">
              <div className="col-md-4">
                <select className="form-select" value={r.accountCode} onChange={e => setRows(rs => rs.map((x,i) => i===idx? { ...x, accountCode: e.target.value } : x))}>
                  <option value="">勘定科目</option>
                  {accounts.map(a => <option key={a.code} value={a.code}>{a.code} - {a.name}</option>)}
                </select>
              </div>
              <div className="col-md-3">
                <input className="form-control" type="number" min={0} value={r.debitAmount ?? ''} onChange={e => setRows(rs => rs.map((x,i) => i===idx? { ...x, debitAmount: Number(e.target.value) } : x))} placeholder="借方" />
              </div>
              <div className="col-md-3">
                <input className="form-control" type="number" min={0} value={r.creditAmount ?? ''} onChange={e => setRows(rs => rs.map((x,i) => i===idx? { ...x, creditAmount: Number(e.target.value) } : x))} placeholder="貸方" />
              </div>
              <div className="col-md-2 text-end">
                <button className="btn btn-sm btn-outline-danger" onClick={() => removeRow(idx)}>削除</button>
              </div>
            </div>
          ))}
          <div className="mb-2"><button className="btn btn-sm btn-secondary" onClick={addRow}>明細追加</button></div>

          {error && <div className="text-danger" style={{ whiteSpace: 'pre-wrap' }}>{error}</div>}
        </div>
        <div className="card-footer d-flex justify-content-end gap-2">
          <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>キャンセル</button>
          <button className="btn btn-sm btn-primary" onClick={save}>保存</button>
        </div>
      </div>
    </div>
  )
}
