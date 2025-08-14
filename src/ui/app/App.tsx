import React, { useState } from 'react'
import { AccountingEngine } from '../../domain/accountingEngine'
import { JournalForm } from '../transactions/JournalForm'
import { LedgerView } from '../ledgers/LedgerView'
import { JsonImport } from '../data-management/JsonImport'
import { AuxiliaryLedgerView } from '../ledgers/AuxiliaryLedgerView'
import { IncomeExpenseReport } from '../statements/IncomeExpenseReport'
import { DivisionStatementsPanel } from '../statements/DivisionStatementsPanel'
import { ExportPanel } from '../data-management/ExportPanel'
import { SettingsPanel } from '../settings/SettingsPanel'
import { JsonSpecView } from '../settings/JsonSpecView'
import { LocalStoragePanel } from '../data-management/LocalStoragePanel'
import { ChartOfAccountsPanel } from '../masters/ChartOfAccountsPanel'
import { ClosingPanel } from '../masters/ClosingPanel'
import { PrintPanel } from '../settings/PrintPanel'
import { IncomeDetailView } from '../statements/IncomeDetailView'
import { ExpenseDetailView } from '../statements/ExpenseDetailView'
import { ConfirmDialog } from '../common/ConfirmDialog'
import { BankImportWizard } from '../transactions/BankImportWizard'
import { TransactionInputForm } from '../transactions/TransactionInputForm'
import FreeeStyleJournalForm from '../transactions/FreeeStyleJournalForm'

export const App: React.FC = () => {
  const [engine] = useState(() => new AccountingEngine())
  const [, setTick] = useState(0)

  const forceUpdate = () => setTick((x) => x + 1)

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDangerous?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  })

  const [active, setActive] = React.useState<'freeeInput'|'input'|'transaction'|'statements'|'auxiliary'|'spec'|'export'|'settings'|'incomeDetail'|'expenseDetail'|'report'|'divisionStatements'|'closing'|'chart'|'bankImport'>('freeeInput')

  return (
    <div className="container py-3">
      <h1 className="mb-3">マンション管理組合会計エンジン（React）</h1>

      <ul className="nav nav-tabs">
        <li className="nav-item"><button className={`nav-link ${active==='freeeInput'?'active':''}`} onClick={() => setActive('freeeInput')}>🌟 かんたん入力(新)</button></li>
        <li className="nav-item"><button className={`nav-link ${active==='transaction'?'active':''}`} onClick={() => setActive('transaction')}>取引入力(freee式)</button></li>
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
        <li className="nav-item"><button className={`nav-link ${active==='bankImport'?'active':''}`} onClick={() => setActive('bankImport')}>🤖 銀行明細インポート</button></li>
      </ul>

      {active === 'freeeInput' && (
        <section className="mt-2">
          <FreeeStyleJournalForm engine={engine} onChange={forceUpdate} />
        </section>
      )}

      {active === 'transaction' && (
        <section className="mt-2">
          <TransactionInputForm engine={engine} onChange={forceUpdate} />
        </section>
      )}

      {active === 'input' && (
        <section className="row g-3 mt-2">
          <div className="col-md-6">
            <JournalForm engine={engine} onChange={forceUpdate} />
          </div>
                  <div className="col-md-6">
          <div className="d-flex flex-wrap gap-2 mb-2">
            <button 
              className="btn btn-outline-primary btn-sm" 
              onClick={() => {
                setConfirmDialog({
                  isOpen: true,
                  title: 'データクリアの確認',
                  message: 'すべてのデータが削除されます。この操作は取り消せません。本当に実行しますか？',
                  onConfirm: () => {
                    engine.clearAll();
                    forceUpdate();
                    setConfirmDialog({ ...confirmDialog, isOpen: false });
                  },
                  isDangerous: true,
                });
              }}
            >
              データクリア
            </button>
            <button 
              className="btn btn-success btn-sm" 
              onClick={() => {
                setConfirmDialog({
                  isOpen: true,
                  title: 'サンプルデータ再読込の確認',
                  message: '現在のデータをすべて削除して、サンプルデータを再読込します。この操作は取り消せません。実行しますか？',
                  onConfirm: () => {
                    engine.loadTwoYearSampleData();
                    forceUpdate();
                    setConfirmDialog({ ...confirmDialog, isOpen: false });
                  },
                  isDangerous: true,
                });
              }}
            >
              サンプルデータ再読込
            </button>
          </div>
          <JsonImport engine={engine} onImported={forceUpdate} />
          <LedgerView engine={engine} />
        </div>
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

      {active === 'bankImport' && (
        <section className="mt-2">
          <BankImportWizard 
            accountingEngine={engine}
            onComplete={(results) => {
              forceUpdate()
              alert(`インポート完了: ${results.importedJournals}件の仕訳を登録しました`)
            }}
          />
        </section>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        isDangerous={confirmDialog.isDangerous}
      />
    </div>
  )
}
