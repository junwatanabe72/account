import React, { useMemo, useState } from 'react'
import { AccountingEngine } from '../domain/accountingEngine'
import { JournalForm } from './JournalForm'
import { LedgerView } from './LedgerView'
import { TrialBalanceView } from './TrialBalanceView'
import { IncomeStatementView } from './IncomeStatementView'
import { BalanceSheetView } from './BalanceSheetView'
import { JsonImport } from './JsonImport'
import { DivisionAccountingView } from './DivisionAccountingView'
import { AuxiliaryLedgerView } from './AuxiliaryLedgerView'
import { IncomeExpenseReport } from './IncomeExpenseReport'
import { DivisionStatementsPanel } from './DivisionStatementsPanel'
import { ExportPanel } from './ExportPanel'
import { SettingsPanel } from './SettingsPanel'
import { JsonSpecView } from './JsonSpecView'
import { LocalStoragePanel } from './LocalStoragePanel'
import { ChartOfAccountsPanel } from './ChartOfAccountsPanel'
import { ClosingPanel } from './ClosingPanel'
import { PrintPanel } from './PrintPanel'
import { IncomeDetailView } from './IncomeDetailView'
import { ExpenseDetailView } from './ExpenseDetailView'

export const App: React.FC = () => {
  const [engine] = useState(() => new AccountingEngine())
  const [, setTick] = useState(0)

  const forceUpdate = () => setTick((x) => x + 1)

  useMemo(() => ({
    trial: engine.getTrialBalance(),
    pl: engine.getIncomeStatement(),
    bs: engine.getBalanceSheet(),
  }), [engine])

  const [active, setActive] = React.useState<'input'|'statements'|'auxiliary'|'spec'|'export'|'settings'|'incomeDetail'|'expenseDetail'|'report'|'divisionStatements'|'closing'|'chart'>('input')

  return (
    <div className="container py-3">
      <h1 className="mb-3">マンション管理組合会計エンジン（React）</h1>

      <ul className="nav nav-tabs">
        <li className="nav-item"><button className={`nav-link ${active==='input'?'active':''}`} onClick={() => setActive('input')}>仕訳/仕訳帳</button></li>
        <li className="nav-item"><button className={`nav-link ${active==='incomeDetail'?'active':''}`} onClick={() => setActive('incomeDetail')}>収入明細表</button></li>
        <li className="nav-item"><button className={`nav-link ${active==='expenseDetail'?'active':''}`} onClick={() => setActive('expenseDetail')}>支出明細表</button></li>
        <li className="nav-item"><button className={`nav-link ${active==='report'?'active':''}`} onClick={() => setActive('report')}>収支報告書（区分別）</button></li>
        <li className="nav-item"><button className={`nav-link ${active==='divisionStatements'?'active':''}`} onClick={() => setActive('divisionStatements')}>試算表/PL/BS</button></li>
        <li className="nav-item"><button className={`nav-link ${active==='auxiliary'?'active':''}`} onClick={() => setActive('auxiliary')}>補助元帳</button></li>
        <li className="nav-item"><button className={`nav-link ${active==='spec'?'active':''}`} onClick={() => setActive('spec')}>JSON仕様</button></li>
        <li className="nav-item"><button className={`nav-link ${active==='export'?'active':''}`} onClick={() => setActive('export')}>バックアップ/CSV</button></li>
        <li className="nav-item"><button className={`nav-link ${active==='settings'?'active':''}`} onClick={() => setActive('settings')}>設定/期首</button></li>
        <li className="nav-item"><button className={`nav-link ${active==='closing'?'active':''}`} onClick={() => setActive('closing')}>期末処理</button></li>
        <li className="nav-item"><button className={`nav-link ${active==='chart'?'active':''}`} onClick={() => setActive('chart')}>科目マスタ</button></li>
      </ul>

      {active === 'input' && (
        <section className="row g-3 mt-2">
          <div className="col-md-6">
            <JournalForm engine={engine} onChange={forceUpdate} />
          </div>
                  <div className="col-md-6">
          <div className="d-flex flex-wrap gap-2 mb-2">
            <button className="btn btn-outline-primary btn-sm" onClick={() => { engine.clearAll(); forceUpdate() }}>データクリア</button>
            <button className="btn btn-success btn-sm" onClick={() => { engine.loadTwoYearSampleData(); forceUpdate() }}>サンプルデータ再読込</button>
          </div>
          <JsonImport engine={engine} onImported={forceUpdate} />
          <LedgerView engine={engine} />
        </div>
        </section>
      )}

      {active === 'statements' && (
        <section className="mt-2">
          <DivisionStatementsPanel engine={engine} />
        </section>
      )}

      {active === 'incomeDetail' && (
        <section className="mt-2">
          <IncomeDetailView engine={engine} />
        </section>
      )}

      {active === 'expenseDetail' && (
        <section className="mt-2">
          <ExpenseDetailView engine={engine} />
        </section>
      )}

      {active === 'report' && (
        <section className="mt-2">
          <IncomeExpenseReport engine={engine} />
        </section>
      )}

      {active === 'divisionStatements' && (
        <DivisionStatementsPanel engine={engine} />
      )}

      {active === 'auxiliary' && (
        <section className="mt-2">
          <AuxiliaryLedgerView engine={engine} onChange={forceUpdate} />
        </section>
      )}

      {active === 'spec' && (
        <JsonSpecView engine={engine} />
      )}

      {active === 'export' && (
        <>
          <ExportPanel engine={engine} onImported={forceUpdate} />
          <LocalStoragePanel engine={engine} onLoaded={forceUpdate} />
          <PrintPanel />
        </>
      )}

      {active === 'settings' && (
        <SettingsPanel engine={engine} onApplied={forceUpdate} />
      )}

      {active === 'closing' && (
        <ClosingPanel engine={engine} onChange={forceUpdate} />
      )}

      {active === 'chart' && (
        <ChartOfAccountsPanel engine={engine} onChanged={forceUpdate} />
      )}
    </div>
  )
}
