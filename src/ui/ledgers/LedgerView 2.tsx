import React from 'react'
import { AccountingEngine } from '../../domain/accountingEngine'
// import { JournalEditModal } from '../transactions/JournalEditModal'
// import { JournalFilterBar, JournalFilters } from '../transactions/JournalFilterBar'
// TODO: JournalEditModalとJournalFilterBarの実装が必要
interface JournalFilters {
  status: string
  dateFrom?: string
  dateTo?: string
  textQuery?: string
  accountQuery?: string
}
import { useToast } from '../common/Toast'
import { ConfirmDialog } from '../common/ConfirmDialog'

export const LedgerView: React.FC<{ engine: AccountingEngine }> = ({ engine }) => {
  const [, setTick] = React.useState(0)
  const refresh = () => setTick(x => x + 1)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [filters, setFilters] = React.useState<JournalFilters>({ status: 'ALL' })
  const [confirmDialog, setConfirmDialog] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  })

  const toast = useToast()

  const filtered = engine.journals.filter(j => {
    if (filters.status && filters.status !== 'ALL' && j.status !== filters.status) return false
    if (filters.dateFrom && j.date < filters.dateFrom) return false
    if (filters.dateTo && j.date > filters.dateTo) return false
    if (filters.textQuery) {
      const t = (j.description + ' ' + j.number).toLowerCase()
      if (!t.includes(filters.textQuery.toLowerCase())) return false
    }
    if (filters.accountQuery) {
      const q = filters.accountQuery.toLowerCase()
      const hit = j.details.some(d => {
        const acc = engine.accounts.find(a => a.code === d.accountCode)
        const s = (d.accountCode + ' ' + (acc?.name ?? '')).toLowerCase()
        return s.includes(q)
      })
      if (!hit) return false
    }
    return true
  })

  const exportFilteredCsv = () => {
    const lines = ['number,date,status,description,accountCode,accountName,debit,credit']
    filtered.forEach(j => {
      j.details.forEach(d => {
        const acc = engine.accounts.find(a => a.code === d.accountCode)
        lines.push([j.number, j.date, j.status, JSON.stringify(j.description), d.accountCode, (acc?.name ?? ''), d.debitAmount || 0, d.creditAmount || 0].join(','))
      })
    })
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `journals-${Date.now()}.csv`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
    toast.show('仕訳CSVを出力しました', 'success')
  }
  const exportFilteredExcel = () => {
    toast.show('Excel出力は一時的に無効化されています。CSVをご利用ください。','warning')
  }

  if (engine.journals.length === 0) return <div className="card"><div className="card-body text-muted">仕訳がありません</div></div>
  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h3 className="mb-0">仕訳帳</h3>
        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-outline-secondary" onClick={exportFilteredCsv}>CSV出力</button>
          <button className="btn btn-sm btn-outline-success" onClick={exportFilteredExcel}>Excel出力</button>
        </div>
      </div>
      <div className="card-body" style={{ maxHeight: 520, overflowY: 'auto' }}>
        <JournalFilterBar value={filters} onChange={setFilters} onClear={() => setFilters({ status: 'ALL' })} />
        {filtered.map((j) => (
          <div key={j.id} className="mb-3" style={{ borderLeft: '4px solid #0d6efd', paddingLeft: 8 }}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <strong>{j.number}</strong>
                <span className="ms-2 badge bg-secondary">{j.status}</span>
              </div>
              <span>{j.date}</span>
            </div>
            <div className="mb-2">{j.description}</div>
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>勘定科目</th>
                  <th className="text-end">借方</th>
                  <th className="text-end">貸方</th>
                </tr>
              </thead>
              <tbody>
                {j.details.map((d, idx) => {
                  const account = engine.accounts.find(a => a.code === d.accountCode)
                  return (
                    <tr key={idx}>
                      <td>{account?.name ?? d.accountCode}</td>
                      <td className="text-end text-primary">{d.debitAmount > 0 ? `¥${d.debitAmount.toLocaleString()}` : ''}</td>
                      <td className="text-end text-danger">{d.creditAmount > 0 ? `¥${d.creditAmount.toLocaleString()}` : ''}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div className="d-flex gap-2">
              {j.status === 'DRAFT' && <><button className="btn btn-sm btn-outline-primary" onClick={() => { const r = engine.submitJournal(j.id); if (!(r as any).success) toast.show((r as any).errors.join(', '),'danger'); else { toast.show('提出しました','success'); refresh() } }}>提出</button>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setEditingId(j.id)}>編集</button></>}
              {j.status === 'SUBMITTED' && <button className="btn btn-sm btn-outline-success" onClick={() => { const r = engine.approveJournal(j.id); if (!(r as any).success) toast.show((r as any).errors.join(', '),'danger'); else { toast.show('承認しました','success'); refresh() } }}>承認</button>}
              {j.status === 'APPROVED' && <button className="btn btn-sm btn-primary" onClick={() => { const r = engine.postJournalById(j.id); if (!(r as any).success) toast.show((r as any).errors.join(', '),'danger'); else { toast.show('記帳しました','success'); refresh() } }}>記帳</button>}
              {j.status !== 'POSTED' && <button 
                className="btn btn-sm btn-outline-danger" 
                onClick={() => {
                  setConfirmDialog({
                    isOpen: true,
                    title: '仕訳の削除',
                    message: `仕訳番号 ${j.number} を削除しますか？この操作は取り消せません。`,
                    onConfirm: () => {
                      const r = engine.deleteJournal(j.id);
                      if (!(r as any).success) {
                        toast.show((r as any).errors.join(', '), 'danger');
                      } else {
                        toast.show('削除しました', 'success');
                        refresh();
                      }
                      setConfirmDialog({ ...confirmDialog, isOpen: false });
                    },
                  });
                }}
              >
                削除
              </button>}
            </div>
          </div>
        ))}
      </div>
      {editingId && <JournalEditModal engine={engine} journalId={editingId} onClose={() => setEditingId(null)} onSaved={refresh} />}
      
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        isDangerous={true}
      />
    </div>
  )
}
