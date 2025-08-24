import React, { lazy, Suspense } from 'react';
import { AccountingEngine } from '../../domain/accountingEngine';
import { useNavigationStore } from '../../stores/slices/ui/navigationSlice';

// 動的インポートでコード分割
// トランザクション関連
const FreeeStyleJournalForm = lazy(() => import('../transactions/FreeeStyleJournalForm'));
const BankImportWizard = lazy(() => import('../transactions/BankImportWizard').then(m => ({ default: m.BankImportWizard })));

// 帳票関連
const AuxiliaryLedgerView = lazy(() => import('../ledgers/AuxiliaryLedgerView').then(m => ({ default: m.AuxiliaryLedgerView })));

// 財務諸表関連
const IncomeDetailView = lazy(() => import('../statements/IncomeDetailView').then(m => ({ default: m.IncomeDetailView })));
const ExpenseDetailView = lazy(() => import('../statements/ExpenseDetailView').then(m => ({ default: m.ExpenseDetailView })));
const IncomeExpenseReport = lazy(() => import('../statements/IncomeExpenseReport').then(m => ({ default: m.IncomeExpenseReport })));
const DivisionStatementsPanel = lazy(() => import('../statements/DivisionStatementsPanel').then(m => ({ default: m.DivisionStatementsPanel })));

// マスタ関連
const ChartOfAccountsPanel = lazy(() => import('../masters/ChartOfAccountsPanel').then(m => ({ default: m.ChartOfAccountsPanel })));
const BankAccountPanel = lazy(() => import('../masters/BankAccountPanel').then(m => ({ default: m.BankAccountPanel })));
const ClosingPanel = lazy(() => import('../masters/ClosingPanel').then(m => ({ default: m.ClosingPanel })));

// データ管理関連
const SampleDataPanel = lazy(() => import('../data-management/SampleDataPanel').then(m => ({ default: m.SampleDataPanel })));
const ExportPanel = lazy(() => import('../data-management/ExportPanel').then(m => ({ default: m.ExportPanel })));
const LocalStoragePanel = lazy(() => import('../data-management/LocalStoragePanel').then(m => ({ default: m.LocalStoragePanel })));

// 設定関連
const SettingsPanel = lazy(() => import('../settings/SettingsPanel').then(m => ({ default: m.SettingsPanel })));
const PrintPanel = lazy(() => import('../settings/PrintPanel').then(m => ({ default: m.PrintPanel })));
const JsonSpecView = lazy(() => import('../settings/JsonSpecView').then(m => ({ default: m.JsonSpecView })));
const ManualView = lazy(() => import('../settings/ManualView').then(m => ({ default: m.ManualView })));

// 支払関連
const PaymentTestPanel = lazy(() => import('../payment/PaymentTestPanel'));

// ローディングコンポーネント
const Loading: React.FC = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '200px',
    color: 'var(--color-text-secondary)'
  }}>
    <div>読み込み中...</div>
  </div>
);

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

  // コンポーネントをレンダリングする内部関数
  const renderContent = () => {
    switch (activeMenu) {
      case "freeeInput":
        return <FreeeStyleJournalForm engine={engine} onChange={onUpdate} />;

      case "bankImport":
        return (
          <BankImportWizard
            accountingEngine={engine}
            onComplete={(results) => {
              onUpdate();
              alert(`インポート完了: ${results.importedJournals}件の仕訳を登録しました`);
            }}
          />
        );

      case "auxiliary":
        return <AuxiliaryLedgerView engine={engine} onChange={onUpdate} />;

      case "incomeDetail":
        return <IncomeDetailView engine={engine} />;

      case "expenseDetail":
        return <ExpenseDetailView engine={engine} />;

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

  // Suspenseでラップして遅延ローディングを有効化
  return (
    <Suspense fallback={<Loading />}>
      <section className="mt-2">
        {renderContent()}
      </section>
    </Suspense>
  );
};