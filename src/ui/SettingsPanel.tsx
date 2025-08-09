import React from 'react'
import { AccountingEngine } from '../domain/accountingEngine'

export const SettingsPanel: React.FC<{ engine: AccountingEngine, onApplied: () => void }> = ({ engine, onApplied }) => {
  const [date, setDate] = React.useState(() => new Date().toISOString().split('T')[0])

  const exportOpening = () => {
    const entries = engine.exportCurrentBalancesAsOpeningDetails()
    const payload = { openingBalances: { date, entries } }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `opening-${date}.json`
    document.body.appendChild(a)
    a.click(); a.remove(); URL.revokeObjectURL(url)
  }

  const applyOpening: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      if (!json.openingBalances) throw new Error('openingBalancesが見つかりません')
      const res = engine.createOpeningBalance(json.openingBalances.date, json.openingBalances.entries)
      if (!(res as any).success) alert('適用に失敗: ' + (res as any).errors?.join(', '))
      else { alert('期首残高を適用しました'); onApplied() }
    } catch (err: any) {
      alert(`適用に失敗: ${err.message ?? String(err)}`)
    } finally {
      e.target.value = ''
    }
  }

  const fileRef = React.useRef<HTMLInputElement>(null)

  return (
    <div className="card mt-3">
      <div className="card-header d-flex justify-content-between align-items-center">
        <strong>設定/期首残高</strong>
        <div>
          <button className="btn btn-sm btn-outline-secondary" onClick={exportOpening}>現残高を期首JSONとして出力</button>
          <button className="btn btn-sm btn-outline-primary ms-2" onClick={() => fileRef.current?.click()}>期首JSONを適用</button>
          <input ref={fileRef} type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={applyOpening} />
        </div>
      </div>
      <div className="card-body d-flex align-items-center gap-2">
        <label className="form-label mb-0">期首日</label>
        <input className="form-control" style={{ maxWidth: 200 }} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
    </div>
  )
}
