import React, { useState } from "react";
import { AccountingEngine } from "../../domain/accountingEngine";
import { AuxiliaryLedgerView } from "../ledgers/AuxiliaryLedgerView";
import { IncomeExpenseReport } from "../statements/IncomeExpenseReport";
import { DivisionStatementsPanel } from "../statements/DivisionStatementsPanel";
import { ExportPanel } from "../data-management/ExportPanel";
import { SettingsPanel } from "../settings/SettingsPanel";
import { JsonSpecView } from "../settings/JsonSpecView";
import { LocalStoragePanel } from "../data-management/LocalStoragePanel";
import { ChartOfAccountsPanel } from "../masters/ChartOfAccountsPanel";
import { ClosingPanel } from "../masters/ClosingPanel";
import { PrintPanel } from "../settings/PrintPanel";
import { IncomeDetailView } from "../statements/IncomeDetailView";
import { ExpenseDetailView } from "../statements/ExpenseDetailView";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { BankImportWizard } from "../transactions/BankImportWizard";
import { ManualView } from "../settings/ManualView";
import FreeeStyleJournalForm from "../transactions/FreeeStyleJournalForm";
import { BankAccountPanel } from "../masters/BankAccountPanel";
import { SampleDataPanel } from "../data-management/SampleDataPanel";
import PaymentTestPanel from "../payment/PaymentTestPanel";
import { ThemeSwitcher } from "../components/ThemeSwitcher";
import "../Sidebar.css";

export const App: React.FC = () => {
  const [engine] = useState(() => new AccountingEngine());
  const [, setTick] = useState(0);
  const forceUpdate = () => setTick((x) => x + 1);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDangerous?: boolean;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const [active, setActive] = useState<
    | "freeeInput"
    | "input"
    | "statements"
    | "auxiliary"
    | "spec"
    | "export"
    | "settings"
    | "incomeDetail"
    | "expenseDetail"
    | "report"
    | "divisionStatements"
    | "closing"
    | "chart"
    | "bankImport"
    | "manual"
    | "bankAccounts"
    | "sampleData"
    | "paymentTest"
  >("freeeInput");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<{
    [key: string]: boolean;
  }>({ journal: true });

  const toggleMenu = (menuKey: string) => {
    setExpandedMenus((prev) => ({ ...prev, [menuKey]: !prev[menuKey] }));
  };

  const handleMenuClick = (itemId: string) => {
    setActive(itemId as any);
    if (window.innerWidth <= 768) {
      setMobileMenuOpen(false);
    }
  };

  const menuItems = [
    {
      id: "journal",
      label: "仕訳管理",
      icon: "📝",
      children: [
        { id: "freeeInput", label: "かんたん入力", icon: "🌟" },
        { id: "bankImport", label: "銀行明細インポート", icon: "🤖" },
        { id: "auxiliary", label: "補助元帳", icon: "📚" },
      ],
    },
    {
      id: "reports",
      label: "帳票・レポート",
      icon: "📊",
      children: [
        { id: "incomeDetail", label: "収入明細表", icon: "💰" },
        { id: "expenseDetail", label: "支出明細表", icon: "💸" },
        { id: "report", label: "収支報告書（区分別）", icon: "📈" },
        { id: "divisionStatements", label: "試算表/PL/BS", icon: "📑" },
      ],
    },
    {
      id: "system",
      label: "システム管理",
      icon: "⚙️",
      children: [
        { id: "chart", label: "科目マスタ", icon: "📋" },
        { id: "bankAccounts", label: "口座管理", icon: "🏦" },
        { id: "settings", label: "設定・期首", icon: "🔧" },
        { id: "closing", label: "期末処理", icon: "🔒" },
      ],
    },
    {
      id: "data",
      label: "データ管理",
      icon: "💾",
      children: [
        { id: "sampleData", label: "サンプルデータ", icon: "🏢" },
        { id: "export", label: "バックアップ/CSV", icon: "📤" },
        { id: "spec", label: "JSON仕様", icon: "📄" },
        { id: "paymentTest", label: "Phase14テスト", icon: "🧪" },
      ],
    },
    {
      id: "help",
      label: "ヘルプ",
      icon: "❓",
      children: [{ id: "manual", label: "マニュアル", icon: "📚" }],
    },
  ];

  const SidebarContent = () => (
    <nav style={{ padding: sidebarOpen ? "10px" : "10px 5px" }}>
      {menuItems.map((menu) => (
        <div key={menu.id} style={{ marginBottom: "5px" }}>
          <button
            onClick={() => toggleMenu(menu.id)}
            className="sidebar-menu-item"
            style={{
              width: "100%",
              padding: "10px",
              background: "none",
              border: "none",
              color: "inherit",
              textAlign: "left",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderRadius: "5px",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <span
              style={{ display: "flex", alignItems: "center", gap: "10px" }}
            >
              <span>{menu.icon}</span>
              {(sidebarOpen || window.innerWidth <= 768) && (
                <span>{menu.label}</span>
              )}
            </span>
            {(sidebarOpen || window.innerWidth <= 768) && menu.children && (
              <span
                className={`sidebar-icon ${
                  expandedMenus[menu.id] ? "rotated" : ""
                }`}
              >
                ▶
              </span>
            )}
          </button>

          {(sidebarOpen || window.innerWidth <= 768) &&
            expandedMenus[menu.id] &&
            menu.children && (
              <div
                className={`sidebar-submenu ${
                  expandedMenus[menu.id] ? "expanded" : ""
                }`}
                style={{ marginLeft: "20px", marginTop: "5px" }}
              >
                {menu.children.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleMenuClick(item.id)}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      background: active === item.id ? "#3498db" : "none",
                      border: "none",
                      color: "inherit",
                      textAlign: "left",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      borderRadius: "5px",
                      marginBottom: "3px",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (active !== item.id) {
                        e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (active !== item.id) {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
        </div>
      ))}
    </nav>
  );

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* モバイル用トグルボタン */}
      {window.innerWidth <= 768 && (
        <>
          <button
            className="sidebar-toggle-mobile"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            ☰
          </button>
          <div
            className={`sidebar-overlay ${mobileMenuOpen ? "open" : ""}`}
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className={`sidebar-mobile ${mobileMenuOpen ? "open" : ""}`}>
            <div
              style={{
                padding: "20px",
                borderBottom: "1px solid #34495e",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <h5 style={{ margin: 0, fontSize: "1.1rem" }}>会計システム</h5>
              <button
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "inherit",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>
            <SidebarContent />
          </div>
        </>
      )}

      {/* デスクトップ用サイドバー */}
      {window.innerWidth > 768 && (
        <div
          className="sidebar sidebar-desktop"
          style={{
            width: sidebarOpen ? "280px" : "60px",
            transition: "width 0.3s ease",
            overflowY: "auto",
            overflowX: "hidden",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              padding: "20px",
              borderBottom: "1px solid #34495e",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h5
              style={{
                margin: 0,
                fontSize: sidebarOpen ? "1.1rem" : "0",
                whiteSpace: "nowrap",
                overflow: "hidden",
                transition: "font-size 0.3s ease",
              }}
            >
              会計システム
            </h5>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                background: "none",
                border: "none",
                color: "#ecf0f1",
                fontSize: "1.5rem",
                cursor: "pointer",
                padding: "0 5px",
              }}
            >
              {sidebarOpen ? "◀" : "▶"}
            </button>
          </div>
          <SidebarContent />
        </div>
      )}

      {/* メインコンテンツ */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          marginLeft: window.innerWidth <= 768 ? "0" : "0",
        }}
        className="main-content-area"
      >
        <div
          className="container-fluid py-3"
          style={{ paddingLeft: window.innerWidth <= 768 ? "60px" : "20px" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h1 className="mb-0">マンション管理組合会計エンジン</h1>
            <ThemeSwitcher />
          </div>

          {active === "freeeInput" && (
            <section className="mt-2">
              <FreeeStyleJournalForm engine={engine} onChange={forceUpdate} />
            </section>
          )}

          {active === "incomeDetail" && (
            <section className="mt-2">
              <IncomeDetailView engine={engine} />
            </section>
          )}

          {active === "expenseDetail" && (
            <section className="mt-2">
              <ExpenseDetailView engine={engine} />
            </section>
          )}

          {active === "report" && (
            <section className="mt-2">
              <IncomeExpenseReport engine={engine} />
            </section>
          )}

          {active === "divisionStatements" && (
            <DivisionStatementsPanel engine={engine} />
          )}

          {active === "auxiliary" && (
            <section className="mt-2">
              <AuxiliaryLedgerView engine={engine} onChange={forceUpdate} />
            </section>
          )}

          {active === "spec" && <JsonSpecView engine={engine} />}

          {active === "export" && (
            <>
              <ExportPanel engine={engine} onImported={forceUpdate} />
              <LocalStoragePanel engine={engine} onLoaded={forceUpdate} />
              <PrintPanel />
            </>
          )}

          {active === "settings" && (
            <SettingsPanel engine={engine} onApplied={forceUpdate} />
          )}

          {active === "closing" && (
            <ClosingPanel engine={engine} onChange={forceUpdate} />
          )}

          {active === "chart" && (
            <ChartOfAccountsPanel engine={engine} onChanged={forceUpdate} />
          )}

          {active === "bankAccounts" && (
            <section className="mt-2">
              <BankAccountPanel engine={engine} onChanged={forceUpdate} />
            </section>
          )}

          {active === "bankImport" && (
            <section className="mt-2">
              <BankImportWizard
                accountingEngine={engine}
                onComplete={(results) => {
                  forceUpdate();
                  alert(
                    `インポート完了: ${results.importedJournals}件の仕訳を登録しました`
                  );
                }}
              />
            </section>
          )}

          {active === "manual" && (
            <section className="mt-2">
              <ManualView />
            </section>
          )}

          {active === "sampleData" && (
            <section className="mt-2">
              <SampleDataPanel engine={engine} onChange={forceUpdate} />
            </section>
          )}

          {active === "paymentTest" && (
            <section className="mt-2">
              <PaymentTestPanel />
            </section>
          )}

          <ConfirmDialog
            isOpen={confirmDialog.isOpen}
            title={confirmDialog.title}
            message={confirmDialog.message}
            onConfirm={confirmDialog.onConfirm}
            onCancel={() =>
              setConfirmDialog({ ...confirmDialog, isOpen: false })
            }
            isDangerous={confirmDialog.isDangerous}
          />
        </div>
      </div>
    </div>
  );
};
