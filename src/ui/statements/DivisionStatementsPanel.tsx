import React from 'react'
import { AccountingEngine } from '../../domain/accountingEngine'
import { 
  AccountingDivision,
  DEFAULT_ACCOUNTING_DIVISIONS,
  getGroupedAccountingDivisions,
  TOP_LEVEL_NAMES,
  LEGACY_DIVISION_MAPPING
} from '../../types/accountingDivision'

function yen(n: number) { return '¥' + n.toLocaleString() }

const DivisionSelect: React.FC<{ value: string, onChange: (v: string) => void }> = ({ value, onChange }) => {
  const divisions = DEFAULT_ACCOUNTING_DIVISIONS
  const divisionGroups = getGroupedAccountingDivisions(divisions)
  
  return (
    <div className="d-flex align-items-center gap-2 mb-2">
      <label className="form-label mb-0">会計区分</label>
      <select className="form-select" style={{ maxWidth: 280 }} value={value} onChange={e => onChange(e.target.value)}>
        {divisionGroups.map(group => (
          <optgroup key={group.label} label={group.label}>
            {group.options.map(division => {
              // 旧システムのコードとの互換性を保つ
              const legacyCode = Object.entries(LEGACY_DIVISION_MAPPING).find(
                ([_, newCode]) => newCode === division.code
              )?.[0] || division.code
              
              return (
                <option key={division.code} value={legacyCode}>
                  {division.name}
                </option>
              )
            })}
          </optgroup>
        ))}
      </select>
    </div>
  )
}

const YearSelect: React.FC<{ value: string, onChange: (v: string) => void }> = ({ value, onChange }) => (
  <div className="d-flex align-items-center gap-2 mb-2">
    <label className="form-label mb-0">年度</label>
    <select className="form-select" style={{ maxWidth: 180 }} value={value} onChange={e => onChange(e.target.value)}>
      <option value="2024">2024年度</option>
      <option value="2025">2025年度</option>
    </select>
  </div>
)

const FilteredTrialBalance: React.FC<{ engine: AccountingEngine, division: string, year: string }> = ({ engine, division, year }) => {
  const fiscalYear = parseInt(year)
  const startDate = `${fiscalYear}-04-01`
  const endDate = `${fiscalYear + 1}-03-31`
  
  const filteredAccounts = Array.from(engine.accounts.values()).filter(a => a.division === division)
  const accounts = filteredAccounts.map(a => {
    let balance = 0
    engine.journals.forEach(journal => {
      if (journal.date >= startDate && journal.date <= endDate && journal.status === 'POSTED') {
        journal.details.forEach(detail => {
          if (detail.accountCode === a.code) {
            if (detail.debitAmount) balance += detail.debitAmount
            if (detail.creditAmount) balance -= detail.creditAmount
          }
        })
      }
    })
    
    // 正常残高に基づいて表示残高を調整
    let displayBalance = balance
    if (a.normalBalance === 'CREDIT') {
      displayBalance = -balance
    }
    
    return { ...a, calculatedBalance: balance, displayBalance }
  }).filter(a => a.calculatedBalance !== 0)
  
  const rows = accounts.map(a => {
    const bal = Math.abs(a.displayBalance)
    const isDebit = a.displayBalance >= 0
    return { code: a.code, name: a.name, type: a.type, debit: isDebit ? bal : 0, credit: !isDebit ? bal : 0 }
  }).sort((a,b) => a.code.localeCompare(b.code))
  const totals = rows.reduce((s,r) => { s.debit+=r.debit; s.credit+=r.credit; return s }, { debit: 0, credit: 0 })
  const groups: Record<string, typeof rows> = { '資産の部': [], '負債の部': [], '正味財産の部': [], '収益の部': [], '費用の部': [] }
  rows.forEach(r => {
    const accountType = engine.accounts.find(a => a.code === r.code)?.type
    if (accountType) {
      switch (accountType) {
        case 'ASSET': groups['資産の部']?.push(r); break
        case 'LIABILITY': groups['負債の部']?.push(r); break
        case 'EQUITY': groups['正味財産の部']?.push(r); break
        case 'REVENUE': groups['収益の部']?.push(r); break
        case 'EXPENSE': groups['費用の部']?.push(r); break
      }
    }
  })
  return (
    <div className="card">
      <div className="card-header"><strong>試算表（区分別）</strong></div>
      <div className="card-body">
        <table className="table table-sm table-striped">
          <thead>
            <tr><th>勘定科目</th><th className="text-end">借方</th><th className="text-end">貸方</th></tr>
          </thead>
          <tbody>
            {Object.entries(groups).map(([name, list]) => list.length>0 && (
              <React.Fragment key={name}>
                <tr className="table-secondary"><td colSpan={3}><strong>{name}</strong></td></tr>
                {list.map(r => (
                  <tr key={r.code}><td>{r.code} - {r.name}</td><td className="text-end text-primary">{r.debit>0?yen(r.debit):''}</td><td className="text-end text-danger">{r.credit>0?yen(r.credit):''}</td></tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
          <tfoot>
            <tr className="table-light"><td><strong>合計</strong></td><td className="text-end text-primary"><strong>{yen(totals.debit)}</strong></td><td className="text-end text-danger"><strong>{yen(totals.credit)}</strong></td></tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

const FilteredIncomeStatement: React.FC<{ engine: AccountingEngine, division: string, year: string }> = ({ engine, division, year }) => {
  const fiscalYear = parseInt(year)
  const startDate = `${fiscalYear}-04-01`
  const endDate = `${fiscalYear + 1}-03-31`
  
  const revenues: Array<{ code: string, name: string, amount: number }> = []
  const expenses: Array<{ code: string, name: string, amount: number }> = []
  let totalRevenue = 0, totalExpense = 0
  
  Array.from(engine.accounts.values()).filter(acc => acc.division === division).forEach(acc => {
    let balance = 0
    engine.journals.forEach(journal => {
      if (journal.date >= startDate && journal.date <= endDate && journal.status === 'POSTED') {
        journal.details.forEach(detail => {
          if (detail.accountCode === acc.code) {
            if (detail.debitAmount) balance += detail.debitAmount
            if (detail.creditAmount) balance -= detail.creditAmount
          }
        })
      }
    })
    
    // 正常残高に基づいて表示残高を調整
    let displayBalance = balance
    if (acc.normalBalance === 'CREDIT') {
      displayBalance = -balance
    }
    
    if (displayBalance === 0) return
    const amt = Math.abs(displayBalance)
    
    if (acc.type === 'REVENUE' && displayBalance > 0) { 
      revenues.push({ code: acc.code, name: acc.name, amount: amt }); totalRevenue += amt 
    }
    if (acc.type === 'EXPENSE' && displayBalance > 0) { 
      expenses.push({ code: acc.code, name: acc.name, amount: amt }); totalExpense += amt 
    }
  })
  revenues.sort((a,b)=>a.code.localeCompare(b.code))
  expenses.sort((a,b)=>a.code.localeCompare(b.code))
  const net = totalRevenue - totalExpense
  return (
    <div className="card">
      <div className="card-header"><strong>損益計算書（区分別）</strong></div>
      <div className="card-body">
        <div className="row">
          <div className="col-md-6">
            <h6 className="text-primary">収益</h6>
            <table className="table table-sm"><tbody>
              {revenues.length===0 ? (<tr><td className="text-muted">収益なし</td></tr>) : revenues.map(r => (<tr key={r.code}><td>{r.name}</td><td className="text-end">{yen(r.amount)}</td></tr>))}
              <tr className="table-light"><td><strong>収益合計</strong></td><td className="text-end"><strong>{yen(totalRevenue)}</strong></td></tr>
            </tbody></table>
          </div>
          <div className="col-md-6">
            <h6 className="text-danger">費用</h6>
            <table className="table table-sm"><tbody>
              {expenses.length===0 ? (<tr><td className="text-muted">費用なし</td></tr>) : expenses.map(r => (<tr key={r.code}><td>{r.name}</td><td className="text-end">{yen(r.amount)}</td></tr>))}
              <tr className="table-light"><td><strong>費用合計</strong></td><td className="text-end"><strong>{yen(totalExpense)}</strong></td></tr>
            </tbody></table>
          </div>
        </div>
        <div className="alert" style={{ borderColor: net >= 0 ? '#198754' : '#dc3545', borderWidth: 1, borderStyle: 'solid' }}>
          <div className={net >= 0 ? 'text-success' : 'text-danger'}>
            <strong>当期収支差額:</strong> {yen(Math.abs(net))} {net>=0 ? '（黒字）' : '（赤字）'}
          </div>
        </div>
      </div>
    </div>
  )
}

const FilteredBalanceSheet: React.FC<{ engine: AccountingEngine, division: string, year: string }> = ({ engine, division, year }) => {
  const fiscalYear = parseInt(year)
  const startDate = `${fiscalYear}-04-01`
  const endDate = `${fiscalYear + 1}-03-31`
  
  const assets: Array<{ code: string, name: string, amount: number }> = []
  const liabilities: Array<{ code: string, name: string, amount: number }> = []
  const equity: Array<{ code: string, name: string, amount: number }> = []
  let totalAssets = 0, totalLiabilities = 0, totalEquity = 0
  
  const revenuesExpenses = { rev: 0, exp: 0 }
  
  Array.from(engine.accounts.values()).filter(acc => acc.division === division).forEach(acc => {
    let balance = 0
    engine.journals.forEach(journal => {
      if (journal.date >= startDate && journal.date <= endDate && journal.status === 'POSTED') {
        journal.details.forEach(detail => {
          if (detail.accountCode === acc.code) {
            if (detail.debitAmount) balance += detail.debitAmount
            if (detail.creditAmount) balance -= detail.creditAmount
          }
        })
      }
    })
    
    // 正常残高に基づいて表示残高を調整
    let displayBalance = balance
    if (acc.normalBalance === 'CREDIT') {
      displayBalance = -balance
    }
    
    if (displayBalance === 0) return
    const amt = Math.abs(displayBalance)
    
    if (acc.type === 'ASSET' && displayBalance > 0) { 
      assets.push({ code: acc.code, name: acc.name, amount: amt }); totalAssets += amt 
    }
    if (acc.type === 'LIABILITY' && displayBalance > 0) { 
      liabilities.push({ code: acc.code, name: acc.name, amount: amt }); totalLiabilities += amt 
    }
    if (acc.type === 'EQUITY' && displayBalance > 0) { 
      equity.push({ code: acc.code, name: acc.name, amount: amt }); totalEquity += amt 
    }
    if (acc.type === 'REVENUE') revenuesExpenses.rev += amt
    if (acc.type === 'EXPENSE') revenuesExpenses.exp += amt
  })
  
  const net = revenuesExpenses.rev - revenuesExpenses.exp
  if (net !== 0) { equity.push({ code: '3002', name: '当期収支差額', amount: Math.abs(net) }); totalEquity += Math.abs(net) }
  assets.sort((a,b)=>a.code.localeCompare(b.code)); liabilities.sort((a,b)=>a.code.localeCompare(b.code)); equity.sort((a,b)=>a.code.localeCompare(b.code))
  const balanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
  return (
    <div className="card">
      <div className="card-header"><strong>貸借対照表（区分別）</strong></div>
      <div className="card-body">
        <div className="row">
          <div className="col-md-6">
            <h6 className="text-primary">資産の部</h6>
            <table className="table table-sm"><tbody>
              {assets.length===0 ? (<tr><td className="text-muted">資産なし</td></tr>) : assets.map(a => (<tr key={a.code}><td>{a.name}</td><td className="text-end">{yen(a.amount)}</td></tr>))}
              <tr className="table-light"><td><strong>資産合計</strong></td><td className="text-end"><strong>{yen(totalAssets)}</strong></td></tr>
            </tbody></table>
          </div>
          <div className="col-md-6">
            <h6 className="text-warning">負債の部</h6>
            <table className="table table-sm"><tbody>
              {liabilities.length===0 ? (<tr><td className="text-muted">負債なし</td></tr>) : liabilities.map(a => (<tr key={a.code}><td>{a.name}</td><td className="text-end">{yen(a.amount)}</td></tr>))}
              <tr className="table-light"><td><strong>負債合計</strong></td><td className="text-end"><strong>{yen(totalLiabilities)}</strong></td></tr>
            </tbody></table>
            <h6 className="text-success mt-3">正味財産の部</h6>
            <table className="table table-sm"><tbody>
              {equity.length===0 ? (<tr><td className="text-muted">正味財産なし</td></tr>) : equity.map(a => (<tr key={a.code}><td>{a.name}</td><td className="text-end">{yen(a.amount)}</td></tr>))}
              <tr className="table-light"><td><strong>正味財産合計</strong></td><td className="text-end"><strong>{yen(totalEquity)}</strong></td></tr>
            </tbody></table>
          </div>
        </div>
        <div className="text-center mt-2"><span className={balanced ? 'text-success' : 'text-danger'}>{balanced ? '✓ 一致' : '✗ 不一致'}</span></div>
      </div>
    </div>
  )
}

export const DivisionStatementsPanel: React.FC<{ engine: AccountingEngine }> = ({ engine }) => {
  const [division, setDivision] = React.useState<string>('KANRI')
  const [year, setYear] = React.useState<string>('2024')
  return (
    <div className="mt-2">
      <div className="d-flex gap-3">
        <DivisionSelect value={division} onChange={setDivision} />
        <YearSelect value={year} onChange={setYear} />
      </div>
      <div className="row g-3">
        <div className="col-md-6"><FilteredTrialBalance engine={engine} division={division} year={year} /></div>
        <div className="col-md-6"><FilteredIncomeStatement engine={engine} division={division} year={year} /></div>
        <div className="col-12"><FilteredBalanceSheet engine={engine} division={division} year={year} /></div>
      </div>
    </div>
  )
}
