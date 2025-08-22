# カラースキーム統一 実装詳細書

## 1. 実装ファイル構成

### 1.1 colors.ts - コアカラー定義

```typescript
// /accounting-system/src/styles/theme/colors.ts

export interface ColorShades {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string; // メインカラー
  600: string;
  700: string;
  800: string;
  900: string;
}

export interface BrandColors {
  primary: ColorShades;
  secondary: ColorShades;
}

export interface BootstrapColors {
  primary: string;
  secondary: string;
  success: string;
  danger: string;
  warning: string;
  info: string;
  light: string;
  dark: string;
}

export interface SemanticColors extends BootstrapColors {
  income: string;      // 収入
  expense: string;     // 支出
  transfer: string;    // 振替
  balance: string;     // 残高
  pending: string;     // 保留中
  approved: string;    // 承認済み
  rejected: string;    // 却下
}

export interface SystemColors {
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
    light: string;
    inverse: string;
  };
  border: {
    light: string;
    default: string;
    dark: string;
  };
  state: {
    hover: string;
    active: string;
    focus: string;
    disabled: string;
  };
}

export interface TableColors {
  default: string;
  primary: string;
  secondary: string;
  success: string;
  danger: string;
  warning: string;
  info: string;
  light: string;
  dark: string;
  striped: string;
  hover: string;
}

export interface ColorConfig {
  brand: BrandColors;
  bootstrap: BootstrapColors;
  semantic: SemanticColors;
  system: SystemColors;
  table: TableColors;
}

// デフォルトカラー定義
export const Colors: ColorConfig = {
  brand: {
    primary: {
      50: '#e6f0ff',
      100: '#b3d1ff',
      200: '#80b3ff',
      300: '#4d94ff',
      400: '#1a75ff',
      500: '#0056b3', // Bootstrapプライマリと統一
      600: '#004590',
      700: '#003d82',
      800: '#002d61',
      900: '#001d41'
    },
    secondary: {
      50: '#f5f6f7',
      100: '#e1e3e5',
      200: '#cdd1d4',
      300: '#b9bec3',
      400: '#a5abb2',
      500: '#6c757d', // Bootstrapセカンダリ
      600: '#5a6268',
      700: '#495057',
      800: '#383d42',
      900: '#272b2e'
    }
  },
  
  bootstrap: {
    primary: '#0056b3',
    secondary: '#6c757d',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    light: '#f8f9fa',
    dark: '#343a40'
  },
  
  semantic: {
    primary: '#0056b3',
    secondary: '#6c757d',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    light: '#f8f9fa',
    dark: '#343a40',
    
    // 会計システム固有
    income: '#28a745',      // 収入（緑）
    expense: '#dc3545',     // 支出（赤）
    transfer: '#007bff',    // 振替（青）
    balance: '#6c757d',     // 残高（グレー）
    pending: '#ffc107',     // 保留中（黄）
    approved: '#28a745',    // 承認済み（緑）
    rejected: '#dc3545'     // 却下（赤）
  },
  
  system: {
    background: {
      primary: '#ffffff',
      secondary: '#f8f9fa',
      tertiary: '#e9ecef',
      inverse: '#343a40'
    },
    text: {
      primary: '#212529',
      secondary: '#495057',
      muted: '#6c757d',
      light: '#adb5bd',
      inverse: '#ffffff'
    },
    border: {
      light: '#dee2e6',
      default: '#ced4da',
      dark: '#adb5bd'
    },
    state: {
      hover: 'rgba(0, 0, 0, 0.075)',
      active: 'rgba(0, 0, 0, 0.125)',
      focus: 'rgba(0, 86, 179, 0.25)',
      disabled: 'rgba(0, 0, 0, 0.5)'
    }
  },
  
  table: {
    default: 'transparent',
    primary: '#b8d4ff',
    secondary: '#d6d8db',
    success: '#c3e6cb',
    danger: '#f5c6cb',
    warning: '#ffeeba',
    info: '#bee5eb',
    light: '#fdfdfe',
    dark: '#c6c8ca',
    striped: 'rgba(0, 0, 0, 0.05)',
    hover: 'rgba(0, 0, 0, 0.075)'
  }
};

// ユーティリティ関数
export function rgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function darken(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) - amt;
  const G = (num >> 8 & 0x00FF) - amt;
  const B = (num & 0x0000FF) - amt;
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255))
    .toString(16).slice(1);
}

export function lighten(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255))
    .toString(16).slice(1);
}
```

### 1.2 cssVariables.ts - CSS変数管理

```typescript
// /accounting-system/src/styles/theme/cssVariables.ts

import { ColorConfig } from './colors';

export function generateCSSVariables(colors: ColorConfig): string {
  return `
    :root {
      /* Brand Colors */
      --color-primary-50: ${colors.brand.primary[50]};
      --color-primary-100: ${colors.brand.primary[100]};
      --color-primary-200: ${colors.brand.primary[200]};
      --color-primary-300: ${colors.brand.primary[300]};
      --color-primary-400: ${colors.brand.primary[400]};
      --color-primary-500: ${colors.brand.primary[500]};
      --color-primary-600: ${colors.brand.primary[600]};
      --color-primary-700: ${colors.brand.primary[700]};
      --color-primary-800: ${colors.brand.primary[800]};
      --color-primary-900: ${colors.brand.primary[900]};
      
      --color-secondary-50: ${colors.brand.secondary[50]};
      --color-secondary-100: ${colors.brand.secondary[100]};
      --color-secondary-200: ${colors.brand.secondary[200]};
      --color-secondary-300: ${colors.brand.secondary[300]};
      --color-secondary-400: ${colors.brand.secondary[400]};
      --color-secondary-500: ${colors.brand.secondary[500]};
      --color-secondary-600: ${colors.brand.secondary[600]};
      --color-secondary-700: ${colors.brand.secondary[700]};
      --color-secondary-800: ${colors.brand.secondary[800]};
      --color-secondary-900: ${colors.brand.secondary[900]};
      
      /* Bootstrap Colors */
      --bs-primary: ${colors.bootstrap.primary};
      --bs-secondary: ${colors.bootstrap.secondary};
      --bs-success: ${colors.bootstrap.success};
      --bs-danger: ${colors.bootstrap.danger};
      --bs-warning: ${colors.bootstrap.warning};
      --bs-info: ${colors.bootstrap.info};
      --bs-light: ${colors.bootstrap.light};
      --bs-dark: ${colors.bootstrap.dark};
      
      /* Semantic Colors */
      --color-semantic-income: ${colors.semantic.income};
      --color-semantic-expense: ${colors.semantic.expense};
      --color-semantic-transfer: ${colors.semantic.transfer};
      --color-semantic-balance: ${colors.semantic.balance};
      --color-semantic-pending: ${colors.semantic.pending};
      --color-semantic-approved: ${colors.semantic.approved};
      --color-semantic-rejected: ${colors.semantic.rejected};
      
      /* System Colors - Background */
      --color-bg-primary: ${colors.system.background.primary};
      --color-bg-secondary: ${colors.system.background.secondary};
      --color-bg-tertiary: ${colors.system.background.tertiary};
      --color-bg-inverse: ${colors.system.background.inverse};
      
      /* System Colors - Text */
      --color-text-primary: ${colors.system.text.primary};
      --color-text-secondary: ${colors.system.text.secondary};
      --color-text-muted: ${colors.system.text.muted};
      --color-text-light: ${colors.system.text.light};
      --color-text-inverse: ${colors.system.text.inverse};
      
      /* System Colors - Border */
      --color-border-light: ${colors.system.border.light};
      --color-border-default: ${colors.system.border.default};
      --color-border-dark: ${colors.system.border.dark};
      
      /* System Colors - State */
      --color-state-hover: ${colors.system.state.hover};
      --color-state-active: ${colors.system.state.active};
      --color-state-focus: ${colors.system.state.focus};
      --color-state-disabled: ${colors.system.state.disabled};
      
      /* Table Colors */
      --table-color-default: ${colors.table.default};
      --table-color-primary: ${colors.table.primary};
      --table-color-secondary: ${colors.table.secondary};
      --table-color-success: ${colors.table.success};
      --table-color-danger: ${colors.table.danger};
      --table-color-warning: ${colors.table.warning};
      --table-color-info: ${colors.table.info};
      --table-color-light: ${colors.table.light};
      --table-color-dark: ${colors.table.dark};
      --table-color-striped: ${colors.table.striped};
      --table-color-hover: ${colors.table.hover};
    }
  `;
}

export function injectCSSVariables(css: string): void {
  const styleId = 'theme-css-variables';
  let styleElement = document.getElementById(styleId) as HTMLStyleElement;
  
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = styleId;
    document.head.appendChild(styleElement);
  }
  
  styleElement.textContent = css;
}

export function removeCSSVariables(): void {
  const styleElement = document.getElementById('theme-css-variables');
  if (styleElement) {
    styleElement.remove();
  }
}
```

### 1.3 ThemeProvider.tsx - Reactテーマ管理

```typescript
// /accounting-system/src/styles/theme/ThemeProvider.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Colors, ColorConfig } from './colors';
import { generateCSSVariables, injectCSSVariables } from './cssVariables';

export type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  colors: ColorConfig;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ダークテーマカラー定義
const DarkColors: ColorConfig = {
  ...Colors,
  system: {
    background: {
      primary: '#1a1a1a',
      secondary: '#2d2d2d',
      tertiary: '#404040',
      inverse: '#ffffff'
    },
    text: {
      primary: '#e5e7eb',
      secondary: '#9ca3af',
      muted: '#6b7280',
      light: '#4b5563',
      inverse: '#1a1a1a'
    },
    border: {
      light: '#374151',
      default: '#4b5563',
      dark: '#6b7280'
    },
    state: {
      hover: 'rgba(255, 255, 255, 0.1)',
      active: 'rgba(255, 255, 255, 0.2)',
      focus: 'rgba(0, 86, 179, 0.4)',
      disabled: 'rgba(255, 255, 255, 0.3)'
    }
  }
};

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ThemeMode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  defaultTheme = 'light' 
}) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme') as ThemeMode;
    return saved || defaultTheme;
  });
  
  const [isDark, setIsDark] = useState(false);
  
  useEffect(() => {
    let actualIsDark = false;
    
    if (theme === 'auto') {
      actualIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
      actualIsDark = theme === 'dark';
    }
    
    setIsDark(actualIsDark);
    
    const colors = actualIsDark ? DarkColors : Colors;
    const cssVariables = generateCSSVariables(colors);
    injectCSSVariables(cssVariables);
    
    // Bootstrapクラスの追加/削除
    if (actualIsDark) {
      document.body.classList.add('theme-dark');
      document.body.classList.remove('theme-light');
    } else {
      document.body.classList.add('theme-light');
      document.body.classList.remove('theme-dark');
    }
  }, [theme]);
  
  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };
  
  const colors = isDark ? DarkColors : Colors;
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme, colors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

// カスタムフック
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function useSemanticColor(semantic: keyof ColorConfig['semantic']) {
  const { colors } = useTheme();
  return colors.semantic[semantic];
}

export function useSystemColor(
  category: keyof ColorConfig['system'],
  variant: string
) {
  const { colors } = useTheme();
  return (colors.system[category] as any)[variant];
}
```

### 1.4 bootstrapOverrides.ts - Bootstrap統合

```typescript
// /accounting-system/src/styles/theme/bootstrapOverrides.ts

export const bootstrapOverrides = `
  /* Bootstrap Color Overrides */
  .btn-primary {
    background-color: var(--bs-primary);
    border-color: var(--bs-primary);
  }
  
  .btn-secondary {
    background-color: var(--bs-secondary);
    border-color: var(--bs-secondary);
  }
  
  .btn-success {
    background-color: var(--bs-success);
    border-color: var(--bs-success);
  }
  
  .btn-danger {
    background-color: var(--bs-danger);
    border-color: var(--bs-danger);
  }
  
  .btn-warning {
    background-color: var(--bs-warning);
    border-color: var(--bs-warning);
  }
  
  .btn-info {
    background-color: var(--bs-info);
    border-color: var(--bs-info);
  }
  
  /* Semantic Button Variants */
  .btn-income {
    background-color: var(--color-semantic-income);
    border-color: var(--color-semantic-income);
    color: white;
  }
  
  .btn-expense {
    background-color: var(--color-semantic-expense);
    border-color: var(--color-semantic-expense);
    color: white;
  }
  
  .btn-transfer {
    background-color: var(--color-semantic-transfer);
    border-color: var(--color-semantic-transfer);
    color: white;
  }
  
  /* Semantic Alert Variants */
  .alert-income {
    background-color: var(--color-semantic-income);
    border-color: var(--color-semantic-income);
    color: white;
  }
  
  .alert-expense {
    background-color: var(--color-semantic-expense);
    border-color: var(--color-semantic-expense);
    color: white;
  }
  
  /* Semantic Badge Variants */
  .badge-income {
    background-color: var(--color-semantic-income);
  }
  
  .badge-expense {
    background-color: var(--color-semantic-expense);
  }
  
  .badge-transfer {
    background-color: var(--color-semantic-transfer);
  }
  
  .badge-pending {
    background-color: var(--color-semantic-pending);
  }
  
  .badge-approved {
    background-color: var(--color-semantic-approved);
  }
  
  .badge-rejected {
    background-color: var(--color-semantic-rejected);
  }
  
  /* Semantic Text Colors */
  .text-semantic-income {
    color: var(--color-semantic-income) !important;
  }
  
  .text-semantic-expense {
    color: var(--color-semantic-expense) !important;
  }
  
  .text-semantic-transfer {
    color: var(--color-semantic-transfer) !important;
  }
  
  .text-semantic-balance {
    color: var(--color-semantic-balance) !important;
  }
  
  /* Table Variants */
  .table-primary {
    background-color: var(--table-color-primary);
  }
  
  .table-secondary {
    background-color: var(--table-color-secondary);
  }
  
  .table-success {
    background-color: var(--table-color-success);
  }
  
  .table-danger {
    background-color: var(--table-color-danger);
  }
  
  .table-warning {
    background-color: var(--table-color-warning);
  }
  
  .table-info {
    background-color: var(--table-color-info);
  }
  
  .table-striped tbody tr:nth-of-type(odd) {
    background-color: var(--table-color-striped);
  }
  
  .table-hover tbody tr:hover {
    background-color: var(--table-color-hover);
  }
  
  /* Form Controls */
  .form-control:focus {
    border-color: var(--color-primary-300);
    box-shadow: 0 0 0 0.2rem var(--color-state-focus);
  }
  
  /* Dark Theme Overrides */
  .theme-dark {
    background-color: var(--color-bg-primary);
    color: var(--color-text-primary);
  }
  
  .theme-dark .card {
    background-color: var(--color-bg-secondary);
    border-color: var(--color-border-default);
  }
  
  .theme-dark .modal-content {
    background-color: var(--color-bg-secondary);
    border-color: var(--color-border-default);
  }
  
  .theme-dark .form-control {
    background-color: var(--color-bg-tertiary);
    border-color: var(--color-border-default);
    color: var(--color-text-primary);
  }
  
  .theme-dark .table {
    color: var(--color-text-primary);
  }
  
  .theme-dark .table-bordered {
    border-color: var(--color-border-default);
  }
  
  .theme-dark .table-striped tbody tr:nth-of-type(odd) {
    background-color: var(--color-bg-tertiary);
  }
`;

export function injectBootstrapOverrides(): void {
  const styleId = 'bootstrap-overrides';
  let styleElement = document.getElementById(styleId) as HTMLStyleElement;
  
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = styleId;
    document.head.appendChild(styleElement);
  }
  
  styleElement.textContent = bootstrapOverrides;
}
```

### 1.5 examples.tsx - 使用例

```typescript
// /accounting-system/src/styles/theme/examples.tsx

import React from 'react';
import { useTheme, useSemanticColor, useSystemColor } from './ThemeProvider';
import { Colors, rgba, darken, lighten } from './colors';

// 例1: 基本的な使用
export function BasicUsageExample() {
  const { colors, isDark } = useTheme();
  
  return (
    <div style={{
      backgroundColor: colors.system.background.primary,
      color: colors.system.text.primary,
      border: `1px solid ${colors.system.border.default}`
    }}>
      現在のテーマ: {isDark ? 'ダーク' : 'ライト'}
    </div>
  );
}

// 例2: セマンティックカラーの使用
export function SemanticColorExample() {
  const incomeColor = useSemanticColor('income');
  const expenseColor = useSemanticColor('expense');
  
  return (
    <div>
      <span style={{ color: incomeColor }}>収入: ¥10,000</span>
      <span style={{ color: expenseColor }}>支出: ¥5,000</span>
    </div>
  );
}

// 例3: CSS変数の使用
export function CSSVariableExample() {
  return (
    <div className="custom-component">
      <style>{`
        .custom-component {
          background-color: var(--color-bg-secondary);
          color: var(--color-text-primary);
          border: 1px solid var(--color-border-default);
          padding: 1rem;
        }
        
        .custom-component:hover {
          background-color: var(--color-state-hover);
        }
        
        .income-text {
          color: var(--color-semantic-income);
        }
        
        .expense-text {
          color: var(--color-semantic-expense);
        }
      `}</style>
      
      <p className="income-text">収入項目</p>
      <p className="expense-text">支出項目</p>
    </div>
  );
}

// 例4: Bootstrapコンポーネントとの統合
export function BootstrapIntegrationExample() {
  return (
    <div>
      {/* 標準のBootstrapバリアント */}
      <button className="btn btn-primary">プライマリ</button>
      <button className="btn btn-success">成功</button>
      <button className="btn btn-danger">危険</button>
      
      {/* カスタムセマンティックバリアント */}
      <button className="btn btn-income">収入を追加</button>
      <button className="btn btn-expense">支出を追加</button>
      <button className="btn btn-transfer">振替</button>
      
      {/* アラート */}
      <div className="alert alert-income">収入が記録されました</div>
      <div className="alert alert-expense">支出警告</div>
      
      {/* バッジ */}
      <span className="badge badge-pending">保留中</span>
      <span className="badge badge-approved">承認済み</span>
      <span className="badge badge-rejected">却下</span>
    </div>
  );
}

// 例5: テーマ切り替え
export function ThemeSwitcherExample() {
  const { theme, setTheme } = useTheme();
  
  return (
    <div>
      <button onClick={() => setTheme('light')}>ライト</button>
      <button onClick={() => setTheme('dark')}>ダーク</button>
      <button onClick={() => setTheme('auto')}>自動</button>
      <p>現在のテーマ: {theme}</p>
    </div>
  );
}

// 例6: カラーユーティリティの使用
export function ColorUtilityExample() {
  const primaryColor = Colors.bootstrap.primary;
  
  return (
    <div>
      <div style={{ backgroundColor: primaryColor }}>
        オリジナル
      </div>
      <div style={{ backgroundColor: rgba(primaryColor, 0.5) }}>
        50%透明度
      </div>
      <div style={{ backgroundColor: darken(primaryColor, 20) }}>
        20%暗く
      </div>
      <div style={{ backgroundColor: lighten(primaryColor, 20) }}>
        20%明るく
      </div>
    </div>
  );
}

// 例7: 条件付きスタイリング
export function ConditionalStylingExample() {
  const { colors, isDark } = useTheme();
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'income':
        return colors.semantic.income;
      case 'expense':
        return colors.semantic.expense;
      case 'pending':
        return colors.semantic.pending;
      default:
        return colors.system.text.primary;
    }
  };
  
  const transactions = [
    { id: 1, type: 'income', amount: 10000 },
    { id: 2, type: 'expense', amount: 5000 },
    { id: 3, type: 'pending', amount: 3000 }
  ];
  
  return (
    <div>
      {transactions.map(transaction => (
        <div
          key={transaction.id}
          style={{
            color: getStatusColor(transaction.type),
            backgroundColor: isDark 
              ? colors.system.background.secondary 
              : colors.system.background.primary
          }}
        >
          {transaction.type}: ¥{transaction.amount}
        </div>
      ))}
    </div>
  );
}

// 例8: 移行パターン（既存コードから新システムへ）
export function MigrationExample() {
  // Before: ハードコードされた色
  const oldStyle = {
    color: '#333',
    backgroundColor: '#f8f9fa',
    borderColor: '#dee2e6'
  };
  
  // After: テーマシステムを使用
  const { colors } = useTheme();
  const newStyle = {
    color: colors.system.text.primary,
    backgroundColor: colors.system.background.secondary,
    borderColor: colors.system.border.light
  };
  
  return (
    <div>
      <div style={oldStyle}>旧スタイル</div>
      <div style={newStyle}>新スタイル</div>
    </div>
  );
}
```

## 2. 実装手順

### 2.1 初期セットアップ

```bash
# 1. テーマディレクトリの作成
mkdir -p src/styles/theme

# 2. ファイルの作成
touch src/styles/theme/colors.ts
touch src/styles/theme/cssVariables.ts
touch src/styles/theme/ThemeProvider.tsx
touch src/styles/theme/bootstrapOverrides.ts
touch src/styles/theme/index.ts
touch src/styles/theme/examples.tsx
```

### 2.2 App.tsxへの統合

```typescript
// src/App.tsx
import React from 'react';
import { ThemeProvider } from './styles/theme/ThemeProvider';
import { injectBootstrapOverrides } from './styles/theme/bootstrapOverrides';

// Bootstrapオーバーライドの適用
injectBootstrapOverrides();

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      {/* 既存のアプリケーションコンポーネント */}
    </ThemeProvider>
  );
}

export default App;
```

### 2.3 index.tsエクスポート

```typescript
// src/styles/theme/index.ts
export { Colors, rgba, darken, lighten } from './colors';
export type { ColorConfig, SemanticColors, SystemColors } from './colors';

export { 
  ThemeProvider, 
  useTheme, 
  useSemanticColor, 
  useSystemColor 
} from './ThemeProvider';
export type { ThemeMode } from './ThemeProvider';

export { generateCSSVariables, injectCSSVariables } from './cssVariables';
export { injectBootstrapOverrides } from './bootstrapOverrides';
```

## 3. 移行ガイド

### 3.1 CSSファイルの移行

```css
/* Before: theme.css */
:root {
  --primary: #0056b3;
  --secondary: #6c757d;
}

.custom-class {
  color: #333;
  background-color: #f8f9fa;
}

/* After: theme.css */
.custom-class {
  color: var(--color-text-primary);
  background-color: var(--color-bg-secondary);
}
```

### 3.2 Reactコンポーネントの移行

```typescript
/* Before */
const Component = () => {
  return (
    <div style={{ color: '#333', backgroundColor: '#f8f9fa' }}>
      Content
    </div>
  );
};

/* After */
import { useTheme } from '@/styles/theme';

const Component = () => {
  const { colors } = useTheme();
  
  return (
    <div style={{ 
      color: colors.system.text.primary, 
      backgroundColor: colors.system.background.secondary 
    }}>
      Content
    </div>
  );
};
```

## 4. テストチェックリスト

```markdown
## ビジュアル回帰テスト
- [ ] すべてのページで色が正しく表示される
- [ ] ホバー状態が正しく動作する
- [ ] フォーカス状態が正しく動作する
- [ ] 無効化状態が正しく動作する

## 機能テスト
- [ ] テーマ切り替えが正しく動作する
- [ ] LocalStorageにテーマ設定が保存される
- [ ] ページリロード後もテーマが維持される
- [ ] 自動テーマがシステム設定に従う

## パフォーマンステスト
- [ ] ページ読み込み時間に影響がない
- [ ] テーマ切り替えが即座に反映される
- [ ] メモリリークがない

## アクセシビリティテスト
- [ ] コントラスト比が WCAG AA 基準を満たす
- [ ] ダークモードでも読みやすい
- [ ] カラーブラインドフレンドリー
```

## 5. トラブルシューティング

### 問題: CSS変数が適用されない
**解決策**: 
1. ThemeProviderがアプリのルートにあることを確認
2. injectCSSVariables()が呼ばれていることを確認
3. ブラウザのDevToolsでCSS変数が定義されているか確認

### 問題: Bootstrapコンポーネントの色が変わらない
**解決策**:
1. bootstrapOverrides.tsが正しくインポートされているか確認
2. injectBootstrapOverrides()が呼ばれているか確認
3. CSS優先順位を確認（!importantが必要な場合がある）

### 問題: ダークモードが正しく表示されない
**解決策**:
1. DarkColorsオブジェクトが正しく定義されているか確認
2. body要素にtheme-darkクラスが追加されているか確認
3. ダークモード用のCSSオーバーライドが適用されているか確認