export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  children?: MenuItem[];
}

export const menuItems: MenuItem[] = [
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
    children: [
      { id: "manual", label: "マニュアル", icon: "📚" }
    ],
  },
];