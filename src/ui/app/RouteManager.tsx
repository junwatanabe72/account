import React from 'react';
import { AccountingEngine } from '../../domain/accountingEngine';
import { useNavigationStore } from '../../stores/slices/ui/navigationSlice';

// 各コンポーネントのインポート
import FreeeStyleJournalForm from '../transactions/FreeeStyleJournalForm';
import { BankImportWizard } from '../transactions/BankImportWizard';
import { AuxiliaryLedgerView } from '../ledgers/AuxiliaryLedgerView';
import { IncomeDetailView } from '../statements/IncomeDetailView';
import { ExpenseDetailView } from '../statements/ExpenseDetailView';
import { IncomeExpenseReport } from '../statements/IncomeExpenseReport';
import { DivisionStatementsPanel } from '../statements/DivisionStatementsPanel';
import { ChartOfAccountsPanel } from '../masters/ChartOfAccountsPanel';
import { BankAccountPanel } from '../masters/BankAccountPanel';
import { SettingsPanel } from '../settings/SettingsPanel';
import { ClosingPanel } from '../masters/ClosingPanel';
import { SampleDataPanel } from '../data-management/SampleDataPanel';
import { ExportPanel } from '../data-management/ExportPanel';
import { LocalStoragePanel } from '../data-management/LocalStoragePanel';
import { PrintPanel } from '../settings/PrintPanel';
import { JsonSpecView } from '../settings/JsonSpecView';
import PaymentTestPanel from '../payment/PaymentTestPanel';
import { ManualView } from '../settings/ManualView';

interface RouteManagerProps {
  engine: AccountingEngine;
  onUpdate: () => void;
}

/**
 * ルーティング管理コンポーネント
 * 
 * 責任:
 * - activeMenuに基づいたコンポーネントの表示切り替え
 * - 各コンポーネントへのprops伝達
 */
export const RouteManager: React.FC<RouteManagerProps> = ({ engine, onUpdate }) => {
  const { activeMenu } = useNavigationStore();

  // activeMenuに基づいてコンポーネントをレンダリング
  switch (activeMenu) {
    case "freeeInput":
      return (
        <section className="mt-2">
          <FreeeStyleJournalForm engine={engine} onChange={onUpdate} />
        </section>
      );

    case "bankImport":
      return (
        <section className="mt-2">
          <BankImportWizard
            accountingEngine={engine}
            onComplete={(results) => {
              onUpdate();
              alert(`インポート完了: ${results.importedJournals}件の仕訳を登録しました`);
            }}
          />
        </section>
      );

    case "auxiliary":
      return (
        <section className="mt-2">
          <AuxiliaryLedgerView engine={engine} onChange={onUpdate} />
        </section>
      );

    case "incomeDetail":
      return (
        <section className="mt-2">
          <IncomeDetailView engine={engine} />
        </section>
      );

    case "expenseDetail":
      return (
        <section className="mt-2">
          <ExpenseDetailView engine={engine} />
        </section>
      );

    case "report":
      return (
        <section className="mt-2">
          <IncomeExpenseReport engine={engine} />
        </section>
      );

    case "divisionStatements":
      return <DivisionStatementsPanel engine={engine} />;

    case "chart":
      return <ChartOfAccountsPanel engine={engine} onChanged={onUpdate} />;

    case "bankAccounts":
      return (
        <section className="mt-2">
          <BankAccountPanel engine={engine} onChanged={onUpdate} />
        </section>
      );

    case "settings":
      return <SettingsPanel engine={engine} onApplied={onUpdate} />;

    case "closing":
      return <ClosingPanel engine={engine} onChange={onUpdate} />;

    case "sampleData":
      return (
        <section className="mt-2">
          <SampleDataPanel engine={engine} onChange={onUpdate} />
        </section>
      );

    case "export":
      return (
        <>
          <ExportPanel engine={engine} onImported={onUpdate} />
          <LocalStoragePanel engine={engine} onLoaded={onUpdate} />
          <PrintPanel />
        </>
      );

    case "spec":
      return <JsonSpecView engine={engine} />;

    case "paymentTest":
      return (
        <section className="mt-2">
          <PaymentTestPanel />
        </section>
      );

    case "manual":
      return (
        <section className="mt-2">
          <ManualView />
        </section>
      );

    default:
      return (
        <div className="text-center mt-5">
          <h3>ページが見つかりません</h3>
          <p>選択されたメニュー項目に対応するページが存在しません。</p>
        </div>
      );
  }
};