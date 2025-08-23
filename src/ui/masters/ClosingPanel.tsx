import React from 'react'
import { AccountingEngine } from '../../domain/accountingEngine'
import { useToast } from '../common/Toast'

interface ClosingResult {
  division: string
  success: boolean
  journalId?: string
  error?: string
}

export const ClosingPanel: React.FC<{ engine: AccountingEngine, onChange: () => void }> = ({ engine, onChange }) => {
  const [date, setDate] = React.useState<string>(new Date().toISOString().split('T')[0] || '')
  const toast = useToast()
  const runClosing = () => {
    const res = engine.createClosingEntries(date) as ClosingResult[]
    const successCount = res.filter(r => r.success).length
    if (successCount > 0) {
      toast.show(`期末振替を作成: ${successCount}件`, 'success')
      onChange()
    } else {
      toast.show('期末振替に失敗しました', 'danger')
    }
  }
  const reverse = () => {
    // reverseClosingEntriesメソッドは現在未実装
    toast.show('期末振替取消機能は現在利用できません', 'warning')
  }

  return (
    <div className="card mt-3">
      <div className="card-header d-flex justify-content-between align-items-center">
        <strong>期末処理</strong>
        <div className="d-flex align-items-center gap-2">
          <input className="form-control" style={{ maxWidth: 200 }} type="date" value={date} onChange={e => setDate(e.target.value)} />
          <button className="btn btn-sm btn-primary" onClick={runClosing}>期末振替を作成</button>
          <button className="btn btn-sm btn-outline-danger" onClick={reverse}>期末振替を取消</button>
        </div>
      </div>
      <div className="card-body">
        <ul className="mb-0">
          <li>各会計区分ごとに収益・費用を当期収支差額へ振替する仕訳を自動生成します。</li>
          <li>「取消」は当日付で逆仕訳を自動生成します。</li>
        </ul>
      </div>
    </div>
  )
}
