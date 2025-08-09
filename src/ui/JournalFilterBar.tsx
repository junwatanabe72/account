import React from 'react'

export type JournalFilters = {
  dateFrom?: string
  dateTo?: string
  status?: 'ALL' | 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'POSTED'
  accountQuery?: string
  textQuery?: string
}

export const JournalFilterBar: React.FC<{
  value: JournalFilters
  onChange: (filters: JournalFilters) => void
  onClear: () => void
}> = ({ value, onChange, onClear }) => {
  const set = (k: keyof JournalFilters, v: any) => onChange({ ...value, [k]: v })
  return (
    <div className="card mb-2">
      <div className="card-body">
        <div className="row g-2 align-items-end">
          <div className="col-md-2">
            <label className="form-label mb-1">日付(自)</label>
            <input className="form-control" type="date" value={value.dateFrom ?? ''} onChange={e => set('dateFrom', e.target.value || undefined)} />
          </div>
          <div className="col-md-2">
            <label className="form-label mb-1">日付(至)</label>
            <input className="form-control" type="date" value={value.dateTo ?? ''} onChange={e => set('dateTo', e.target.value || undefined)} />
          </div>
          <div className="col-md-2">
            <label className="form-label mb-1">ステータス</label>
            <select className="form-select" value={value.status ?? 'ALL'} onChange={e => set('status', e.target.value as any)}>
              <option value="ALL">ALL</option>
              <option value="DRAFT">DRAFT</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="APPROVED">APPROVED</option>
              <option value="POSTED">POSTED</option>
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label mb-1">勘定コード/名称 含む</label>
            <input className="form-control" placeholder="例: 1121 / 管理費" value={value.accountQuery ?? ''} onChange={e => set('accountQuery', e.target.value || undefined)} />
          </div>
          <div className="col-md-3">
            <label className="form-label mb-1">摘要/伝票番号 含む</label>
            <input className="form-control" placeholder="キーワード" value={value.textQuery ?? ''} onChange={e => set('textQuery', e.target.value || undefined)} />
          </div>
        </div>
        <div className="mt-2 text-end">
          <button className="btn btn-sm btn-outline-secondary" onClick={onClear}>クリア</button>
        </div>
      </div>
    </div>
  )
}
