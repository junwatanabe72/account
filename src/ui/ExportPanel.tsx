import React from 'react'
import { AccountingEngine } from '../domain/accountingEngine'
import { TrialBalanceEntry } from '../types'
// import { utils as XLSXUtils, writeFile } from 'xlsx' // disabled due to build issue
import { useToast } from './Toast'

function download(filename: string, content: string, type = 'text/plain') {
  const blob = new Blob([content], { type: type + ';charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export const ExportPanel: React.FC<{ engine: AccountingEngine, onImported: () => void }> = ({ engine, onImported }) => {
  const toast = useToast()

  const backup = () => {
    const payload = engine.serialize()
    download(`backup-${Date.now()}.json`, JSON.stringify(payload, null, 2), 'application/json')
    toast.show('バックアップを保存しました', 'success')
  }

  const restore: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      engine.restore(json)
      onImported()
      toast.show('バックアップから復元しました', 'success')
    } catch (err: any) {
      toast.show(`復元に失敗: ${err.message ?? String(err)}`,'danger')
    } finally {
      e.target.value = ''
    }
  }

  const exportCSV = () => {
    const tb = engine.getTrialBalance()
    const lines = ['code,name,debit,credit']
    tb.accounts.forEach((a: TrialBalanceEntry) => {
      lines.push([a.code, a.name, a.debitBalance, a.creditBalance].join(','))
    })
    download('trial-balance.csv', lines.join('\n'), 'text/csv')
    toast.show('試算表CSVを出力しました', 'success')
  }

  // Excel export temporarily disabled due to build import issues
  const exportExcel = () => {
    // Disabled: build incompatibility. Use CSV exports for now.
    toast.show('Excel出力は一時的に無効化されています。CSVをご利用ください。','warning')
  }

  const exportPL = () => {
    const pl = engine.getIncomeStatement()
    const lines = ['type,code,name,amount']
    pl.revenues.forEach(a => lines.push(['revenue', a.code, a.name, a.amount].join(',')))
    pl.expenses.forEach(a => lines.push(['expense', a.code, a.name, a.amount].join(',')))
    lines.push(['total','', 'totalRevenue', pl.totalRevenue].join(','))
    lines.push(['total','', 'totalExpense', pl.totalExpense].join(','))
    lines.push(['total','', 'netIncome', pl.netIncome].join(','))
    download('income-statement.csv', lines.join('\n'), 'text/csv')
    toast.show('損益計算書CSVを出力しました', 'success')
  }

  const exportBS = () => {
    const bs = engine.getBalanceSheet()
    const lines = ['section,code,name,amount']
    bs.assets.forEach(a => lines.push(['asset', a.code, a.name, a.amount].join(',')))
    bs.liabilities.forEach(a => lines.push(['liability', a.code, a.name, a.amount].join(',')))
    bs.equity.forEach(a => lines.push(['equity', a.code, a.name, a.amount].join(',')))
    lines.push(['total','', 'totalAssets', bs.totalAssets].join(','))
    lines.push(['total','', 'totalLiabilities', bs.totalLiabilities].join(','))
    lines.push(['total','', 'totalEquity', bs.totalEquity].join(','))
    download('balance-sheet.csv', lines.join('\n'), 'text/csv')
    toast.show('貸借対照表CSVを出力しました', 'success')
  }

  const fileRef = React.useRef<HTMLInputElement>(null)

  return (
    <div className="card" style={{ marginTop: 12 }}>
      <div className="card-header d-flex justify-content-between align-items-center">
        <strong>エクスポート/バックアップ</strong>
        <div>
          <button className="btn btn-sm btn-outline-secondary" onClick={backup}>バックアップ保存</button>
          <button className="btn btn-sm btn-outline-primary ms-2" onClick={() => fileRef.current?.click()}>バックアップ復元</button>
          <input ref={fileRef} type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={restore} />
        </div>
      </div>
      <div className="card-body">
        <div className="btn-group" role="group">
          <button className="btn btn-sm btn-secondary" onClick={exportCSV}>試算表CSV</button>
          <button className="btn btn-sm btn-secondary" onClick={exportPL}>損益計算書CSV</button>
          <button className="btn btn-sm btn-secondary" onClick={exportBS}>貸借対照表CSV</button>
          <button className="btn btn-sm btn-success" onClick={exportExcel}>Excel出力(xlsx)</button>
        </div>
      </div>
    </div>
  )
}
