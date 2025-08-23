# Zustand統合・拡張計画

## 1. 現状のZustand実装の分析

### 1.1 既存のStore構造
```
src/stores/
├── slices/
│   ├── journal/           # 仕訳関連（3ファイル）
│   │   ├── journalSlice.ts
│   │   ├── journalSliceEnhanced.ts
│   │   └── unifiedJournalSlice.ts
│   ├── core/             # コア機能
│   │   └── accountingSlice.ts
│   ├── auxiliary/        # 補助元帳
│   │   ├── auxiliarySliceEnhanced.ts
│   │   └── bankAccountSlice.ts
│   ├── transaction/      # 取引
│   │   ├── transactionSlice.ts
│   │   └── transactionSliceEnhanced.ts
│   ├── payment/          # 支払い
│   │   └── paymentSlice.ts
│   └── ui/              # UI状態
│       └── uiSlice.ts
└── hooks/
    └── useBankAccounts.ts
```

### 1.2 現在の問題点
1. **Store分散**: 10個以上の独立したストア
2. **命名不統一**: `Enhanced`サフィックスの不統一な使用
3. **型定義の重複**: 各スライスで似た型定義
4. **フック不足**: `useBankAccounts`のみでその他は直接参照

## 2. リファクタリング方針

### 2.1 Zustandを維持する理由
- **既存実装の活用**: 既に動作している状態管理ロジック
- **パフォーマンス**: Context APIより高速
- **DevTools対応**: デバッグが容易
- **型安全性**: TypeScriptとの相性が良い

### 2.2 改善方針

#### 方針1: Store統合とモジュール化
```typescript
// src/stores/index.ts - 統合ストア
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// 各スライスをインポート
import { createJournalSlice } from './slices/journal';
import { createAccountingSlice } from './slices/accounting';
import { createUISlice } from './slices/ui';

export const useStore = create<StoreState>()(
  devtools(
    immer((...args) => ({
      ...createJournalSlice(...args),
      ...createAccountingSlice(...args),
      ...createUISlice(...args),
    }))
  )
);
```

#### 方針2: カスタムフックの充実
```typescript
// src/hooks/useAccounting.ts
export const useAccounting = () => {
  const engine = useStore((state) => state.engine);
  const journals = useStore((state) => state.journals);
  const accounts = useStore((state) => state.accounts);
  
  return {
    engine,
    journals,
    accounts,
    // メソッドも含める
    createJournal: useStore((state) => state.createJournal),
    updateJournal: useStore((state) => state.updateJournal),
  };
};

// src/hooks/useJournal.ts
export const useJournal = (journalId?: string) => {
  const journal = useStore(
    (state) => journalId 
      ? state.journals.find(j => j.id === journalId)
      : undefined
  );
  
  const updateJournal = useStore((state) => state.updateJournal);
  const deleteJournal = useStore((state) => state.deleteJournal);
  
  return {
    journal,
    update: journalId ? (data: Partial<Journal>) => 
      updateJournal(journalId, data) : undefined,
    delete: journalId ? () => 
      deleteJournal(journalId) : undefined,
  };
};
```

## 3. CSS Modules統合計画

### 3.1 現状のCSS構造
```
src/ui/
├── styles/
│   ├── master.module.css      # 既存のCSS Module
│   ├── theme.css              # テーマ変数
│   ├── theme-unified.css      # 統一テーマ
│   ├── commonStyles.ts        # CSS-in-TS
│   ├── data-display.css       # プレーンCSS
│   ├── forms.css              # プレーンCSS
│   ├── responsive.css         # レスポンシブ
│   └── tabs.css               # タブスタイル
├── Sidebar.css                # コンポーネント個別CSS
└── transactions/
    ├── FreeeStyleJournalForm.css
    └── FreeeStyleJournalFormEnhanced.css
```

### 3.2 統合方針

#### Phase 1: CSS Modules移行準備
1. **命名規則統一**
   - `*.module.css`に統一
   - BEM記法の採用: `block__element--modifier`

2. **変数の統一**
   ```css
   /* src/ui/styles/variables.module.css */
   :root {
     /* Colors */
     --color-primary: #3498db;
     --color-secondary: #2c3e50;
     --color-danger: #e74c3c;
     --color-success: #27ae60;
     
     /* Spacing */
     --spacing-xs: 4px;
     --spacing-sm: 8px;
     --spacing-md: 16px;
     --spacing-lg: 24px;
     --spacing-xl: 32px;
     
     /* Typography */
     --font-size-sm: 12px;
     --font-size-md: 14px;
     --font-size-lg: 16px;
     --font-size-xl: 20px;
   }
   ```

#### Phase 2: コンポーネントスタイル移行
```typescript
// Before: インラインスタイル
<div style={{ padding: 20, border: '1px solid #ddd' }}>

// After: CSS Module
import styles from './Component.module.css';
<div className={styles.container}>
```

#### Phase 3: 共通スタイルライブラリ
```typescript
// src/ui/styles/utils.ts
import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// 使用例
<div className={cn(
  styles.base,
  isActive && styles.active,
  isDanger && styles.danger
)}>
```

## 4. 実装スケジュール

### Week 1: Zustand統合
- [ ] Store統合設計
- [ ] カスタムフック作成
- [ ] 既存コンポーネントの移行準備

### Week 2: CSS Modules Phase 1
- [ ] 変数ファイル作成
- [ ] 命名規則統一
- [ ] 既存CSS Modulesの整理

### Week 3: CSS Modules Phase 2
- [ ] コンポーネントスタイル移行（優先度高）
- [ ] 共通コンポーネントのスタイル作成

### Week 4: 統合テスト
- [ ] Zustand DevToolsセットアップ
- [ ] パフォーマンステスト
- [ ] リグレッションテスト

## 5. 移行例

### 5.1 AppWithSidebar.tsx のリファクタリング

#### Before
```typescript
export const App: React.FC = () => {
  const [engine] = useState(() => new AccountingEngine());
  const [, setTick] = useState(0);
  const forceUpdate = () => setTick((x) => x + 1);
  // ... 450行のコード
};
```

#### After
```typescript
// src/ui/app/App.tsx
export const App: React.FC = () => {
  const { engine } = useAccounting();
  
  return (
    <MainLayout>
      <Routes />
    </MainLayout>
  );
};

// src/ui/layouts/MainLayout/MainLayout.tsx
export const MainLayout: React.FC<PropsWithChildren> = ({ children }) => {
  const { sidebarOpen, toggleSidebar } = useUIStore();
  
  return (
    <div className={styles.layout}>
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
};

// src/ui/layouts/components/Sidebar/Sidebar.tsx
export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const { activeMenu } = useNavigation();
  
  return (
    <aside className={cn(styles.sidebar, isOpen && styles.open)}>
      <SidebarHeader onToggle={onToggle} />
      <SidebarNav activeMenu={activeMenu} />
    </aside>
  );
};
```

## 6. 利点

### Zustand継続の利点
1. **既存コードの再利用**: 10個以上のスライスロジックを維持
2. **学習コスト削減**: チームが既に習熟
3. **移行リスク低減**: 段階的な改善が可能
4. **パフォーマンス**: 不要な再レンダリング回避

### CSS Modules活用の利点
1. **スコープ分離**: グローバル汚染なし
2. **型安全性**: TypeScript連携
3. **既存資産活用**: master.module.css等
4. **段階的移行**: プレーンCSSと共存可能

## 7. 注意事項

### リスクと対策
| リスク | 対策 |
|--------|------|
| Store統合時の破壊 | Feature Flagで段階的切り替え |
| CSS競合 | CSS Modulesでスコープ分離 |
| パフォーマンス劣化 | React DevToolsでプロファイリング |

### 段階的移行戦略
1. **新規コンポーネント**: 新方式で実装
2. **既存コンポーネント**: 優先度順に移行
3. **Feature Flag**: 本番環境での段階的リリース

## 8. まとめ

ZustandとCSS Modulesを前提としたリファクタリング計画により：
- **既存資産の最大活用**
- **段階的な品質改善**
- **リスクの最小化**
- **開発効率の向上**

を実現します。