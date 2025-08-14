import React from 'react'
import { AccountingEngine } from '../../domain/accountingEngine'
import { JournalEditModal } from '../transactions/JournalEditModal'
import { JournalFilterBar, JournalFilters } from '../transactions/JournalFilterBar'
import { useToast } from '../common/Toast'
import { ConfirmDialog } from '../common/ConfirmDialog'

export const ImprovedLedgerView: React.FC<{ engine: AccountingEngine }> = ({ engine }) => {
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
        const acc = engine.accounts.get(d.accountCode)
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
        const acc = engine.accounts.get(d.accountCode)
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

  // ステータスの日本語化
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DRAFT': return '下書き'
      case 'SUBMITTED': return '提出済'
      case 'APPROVED': return '承認済'
      case 'POSTED': return '記帳済'
      default: return status
    }
  }

  // ステータスのバッジ色
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'badge bg-secondary'
      case 'SUBMITTED': return 'badge bg-warning text-dark'
      case 'APPROVED': return 'badge bg-info'
      case 'POSTED': return 'badge bg-success'
      default: return 'badge bg-secondary'
    }
  }

  if (engine.journals.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <i className="bi bi-journal-text" style={{ fontSize: '3rem', color: '#dee2e6' }}></i>
          <p className="text-muted mt-3">仕訳がありません</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h3 className="mb-0">仕訳帳</h3>
        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-outline-secondary" onClick={exportFilteredCsv}>
            <i className="bi bi-filetype-csv"></i> CSV出力
          </button>
          <button className="btn btn-sm btn-outline-success" onClick={exportFilteredExcel}>
            <i className="bi bi-file-earmark-excel"></i> Excel出力
          </button>
        </div>
      </div>
      <div className="card-body">
        <JournalFilterBar value={filters} onChange={setFilters} onClear={() => setFilters({ status: 'ALL' })} />
        
        {/* 改善された仕訳表示 */}
        <div className="journal-list">
          {filtered.map((j, index) => (
            <div 
              key={j.id} 
              className={`journal-item ${index % 2 === 0 ? 'journal-item-even' : ''}`}
              style={{
                marginBottom: '1.5rem',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: '1px solid #e9ecef',
                backgroundColor: index % 2 === 0 ? '#f8f9fa' : '#fff',
              }}
            >
              {/* ヘッダー部分 */}
              <div className="journal-header d-flex justify-content-between align-items-start mb-3">
                <div>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <h5 className="mb-0" style={{ fontSize: '1.1rem' }}>
                      <strong>伝票番号: {j.number}</strong>
                    </h5>
                    <span className={getStatusBadgeClass(j.status)}>
                      {getStatusLabel(j.status)}
                    </span>
                  </div>
                  <div className="text-muted">
                    <i className="bi bi-calendar3"></i> {j.date}
                  </div>
                </div>
              </div>

              {/* 摘要 */}
              <div className="mb-3">
                <strong>摘要:</strong> {j.description}
              </div>

              {/* 仕訳明細テーブル */}
              <div className="table-responsive">
                <table className="table table-sm table-hover mb-2">
                  <thead>
                    <tr style={{ backgroundColor: '#e9ecef' }}>
                      <th style={{ width: '40%' }}>勘定科目</th>
                      <th className="text-end" style={{ width: '30%' }}>借方</th>
                      <th className="text-end" style={{ width: '30%' }}>貸方</th>
                    </tr>
                  </thead>
                  <tbody>
                    {j.details.map((d, idx) => {
                      const account = engine.accounts.get(d.accountCode)
                      return (
                        <tr key={idx}>
                          <td>
                            <span className="fw-medium">{account?.name ?? d.accountCode}</span>
                            {account?.division && (
                              <span className="text-muted ms-2">
                                [{account.division}]
                              </span>
                            )}
                          </td>
                          <td className="text-end">
                            {d.debitAmount > 0 && (
                              <span className="text-primary fw-bold">
                                ¥{d.debitAmount.toLocaleString()}
                              </span>
                            )}
                          </td>
                          <td className="text-end">
                            {d.creditAmount > 0 && (
                              <span className="text-danger fw-bold">
                                ¥{d.creditAmount.toLocaleString()}
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ backgroundColor: '#e9ecef', fontWeight: 'bold' }}>
                      <td>合計</td>
                      <td className="text-end text-primary">
                        ¥{j.details.reduce((sum, d) => sum + d.debitAmount, 0).toLocaleString()}
                      </td>
                      <td className="text-end text-danger">
                        ¥{j.details.reduce((sum, d) => sum + d.creditAmount, 0).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* アクションボタン */}
              <div className="d-flex gap-2 mt-3">
                {j.status === 'DRAFT' && (
                  <>
                    <button 
                      className="btn btn-sm btn-outline-primary" 
                      onClick={() => { 
                        const r = engine.submitJournal(j.id); 
                        if (!(r as any).success) {
                          toast.show((r as any).errors.join(', '),'danger'); 
                        } else { 
                          toast.show('提出しました','success'); 
                          refresh() 
                        } 
                      }}
                    >
                      <i className="bi bi-send"></i> 提出
                    </button>
                    <button 
                      className="btn btn-sm btn-outline-secondary" 
                      onClick={() => setEditingId(j.id)}
                    >
                      <i className="bi bi-pencil"></i> 編集
                    </button>
                  </>
                )}
                {j.status === 'SUBMITTED' && (
                  <button 
                    className="btn btn-sm btn-outline-success" 
                    onClick={() => { 
                      const r = engine.approveJournal(j.id); 
                      if (!(r as any).success) {
                        toast.show((r as any).errors.join(', '),'danger'); 
                      } else { 
                        toast.show('承認しました','success'); 
                        refresh() 
                      } 
                    }}
                  >
                    <i className="bi bi-check-circle"></i> 承認
                  </button>
                )}
                {j.status === 'APPROVED' && (
                  <button 
                    className="btn btn-sm btn-primary" 
                    onClick={() => { 
                      const r = engine.postJournalById(j.id); 
                      if (!(r as any).success) {
                        toast.show((r as any).errors.join(', '),'danger'); 
                      } else { 
                        toast.show('記帳しました','success'); 
                        refresh() 
                      } 
                    }}
                  >
                    <i className="bi bi-journal-check"></i> 記帳
                  </button>
                )}
                {j.status !== 'POSTED' && (
                  <button 
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
                    <i className="bi bi-trash"></i> 削除
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {editingId && (
        <JournalEditModal 
          engine={engine} 
          journalId={editingId} 
          onClose={() => setEditingId(null)} 
          onSaved={refresh} 
        />
      )}
      
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