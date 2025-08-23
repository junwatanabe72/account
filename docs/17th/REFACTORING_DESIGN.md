# UI層リファクタリング設計書

## 1. 設計概要

### 1.1 設計方針

**基本原則**:
1. **段階的改善**: 既存機能を維持しながら段階的にリファクタリング
2. **責任の分離**: Single Responsibility Principleの徹底
3. **再利用性**: コンポーネントの汎用化と共通化
4. **型安全性**: TypeScriptの型システムを最大限活用
5. **保守性**: 将来の変更に対する柔軟性を確保
6. **既存資産活用**: Zustand状態管理とCSS Modulesの継続利用

### 1.2 技術スタック（既存前提）

**継続利用するライブラリ**:
- **Zustand 5.x**: 既存のstore実装を維持・拡張
- **CSS Modules**: master.module.css等の既存スタイルを段階的に統合
- **React 18.x + TypeScript 5.x**
- **Vite**: ビルドツール
- **Zod**: バリデーション
- **react-dropzone**: ファイルアップロード

### 1.2 目標アーキテクチャ

```
src/ui/
├── layouts/                 # レイアウトコンポーネント
│   ├── MainLayout/
│   │   ├── MainLayout.tsx
│   │   ├── MainLayout.styles.ts
│   │   └── index.ts
│   └── components/
│       ├── Sidebar/
│       ├── Header/
│       └── Footer/
├── components/             # 共通UIコンポーネント
│   ├── common/            # 基本コンポーネント
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Select/
│   │   └── Modal/
│   ├── feedback/          # フィードバック系
│   │   ├── Toast/
│   │   ├── Alert/
│   │   └── Loading/
│   └── data-display/      # データ表示系
│       ├── Table/
│       ├── Card/
│       └── List/
├── features/              # 機能別コンポーネント
│   ├── journal/
│   ├── ledger/
│   ├── statement/
│   └── payment/
├── hooks/                 # カスタムフック
│   ├── useAccounting.ts
│   ├── useForm.ts
│   └── useNotification.ts
├── hooks/                 # Zustandフック拡張
│   ├── AccountingContext.tsx
│   └── ThemeContext.tsx
├── styles/                # グローバルスタイル
│   ├── theme/
│   ├── variables.css
│   └── global.css
└── utils/                 # UIユーティリティ
    ├── formatters.ts
    └── validators.ts
```

## 2. コンポーネント設計

### 2.1 レイアウトコンポーネント

#### 2.1.1 MainLayout

**責任**: アプリケーション全体のレイアウト管理

```typescript
// src/ui/layouts/MainLayout/MainLayout.tsx
interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { isOpen, toggle } = useSidebar();
  
  return (
    <div className={styles.container}>
      <Sidebar isOpen={isOpen} onToggle={toggle} />
      <div className={styles.mainContent}>
        <Header />
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
};
```

#### 2.1.2 Sidebar

**責任**: ナビゲーションメニューの表示と制御

```typescript
// src/ui/layouts/components/Sidebar/Sidebar.tsx
interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const navigation = useNavigation();
  
  return (
    <aside className={cn(styles.sidebar, { [styles.open]: isOpen })}>
      <SidebarHeader onToggle={onToggle} />
      <Navigation items={navigation} />
    </aside>
  );
};
```

### 2.2 共通コンポーネント

#### 2.2.1 Button コンポーネント

**設計思想**: 一貫性のあるボタンUI

```typescript
// src/ui/components/common/Button/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  loading = false,
  icon,
  children,
  disabled,
  ...props
}) => {
  return (
    <button
      className={cn(
        styles.button,
        styles[variant],
        styles[size],
        { [styles.loading]: loading }
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner />}
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </button>
  );
};
```

#### 2.2.2 Form コンポーネント群

```typescript
// src/ui/components/common/Form/FormField.tsx
interface FormFieldProps {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  error,
  required,
  children
}) => {
  return (
    <div className={styles.field}>
      <label htmlFor={name} className={styles.label}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
      {children}
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
};
```

### 2.3 機能別コンポーネント

#### 2.3.1 Journal機能の再構成

**現在**: `FreeeStyleJournalForm.tsx` (600行以上)

**改善後**:
```
features/journal/
├── JournalForm/
│   ├── JournalForm.tsx          # メインフォーム
│   ├── JournalForm.hooks.ts     # カスタムフック
│   ├── JournalForm.types.ts     # 型定義
│   ├── JournalForm.utils.ts     # ユーティリティ
│   └── components/
│       ├── AccountSelector.tsx   # 勘定科目選択
│       ├── AmountInput.tsx      # 金額入力
│       └── DatePicker.tsx       # 日付選択
```

```typescript
// features/journal/JournalForm/JournalForm.tsx
export const JournalForm: React.FC = () => {
  const {
    formData,
    errors,
    handleSubmit,
    handleChange
  } = useJournalForm();
  
  return (
    <Form onSubmit={handleSubmit}>
      <DatePicker
        value={formData.date}
        onChange={(date) => handleChange('date', date)}
        error={errors.date}
      />
      <AccountSelector
        value={formData.account}
        onChange={(account) => handleChange('account', account)}
        division={formData.division}
      />
      <AmountInput
        value={formData.amount}
        onChange={(amount) => handleChange('amount', amount)}
        error={errors.amount}
      />
      <Button type="submit">登録</Button>
    </Form>
  );
};
```

## 3. 状態管理設計

### 3.1 Context APIによる状態管理

#### 3.1.1 AccountingContext

```typescript
// src/ui/contexts/AccountingContext.tsx
interface AccountingContextValue {
  engine: AccountingEngine;
  journals: Journal[];
  accounts: Account[];
  isLoading: boolean;
  error: Error | null;
  actions: {
    addJournal: (journal: Journal) => Promise<void>;
    updateJournal: (id: string, journal: Partial<Journal>) => Promise<void>;
    deleteJournal: (id: string) => Promise<void>;
    refreshData: () => Promise<void>;
  };
}

const AccountingContext = createContext<AccountingContextValue | null>(null);

export const AccountingProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [engine] = useState(() => new AccountingEngine());
  const [state, dispatch] = useReducer(accountingReducer, initialState);
  
  const value = useMemo(() => ({
    engine,
    ...state,
    actions: {
      addJournal: async (journal) => {
        dispatch({ type: 'ADD_JOURNAL_START' });
        try {
          await engine.addJournal(journal);
          dispatch({ type: 'ADD_JOURNAL_SUCCESS', payload: journal });
        } catch (error) {
          dispatch({ type: 'ADD_JOURNAL_ERROR', payload: error });
        }
      },
      // ... 他のアクション
    }
  }), [engine, state]);
  
  return (
    <AccountingContext.Provider value={value}>
      {children}
    </AccountingContext.Provider>
  );
};

// カスタムフック
export const useAccounting = () => {
  const context = useContext(AccountingContext);
  if (!context) {
    throw new Error('useAccounting must be used within AccountingProvider');
  }
  return context;
};
```

### 3.2 ローカル状態の管理

```typescript
// src/ui/hooks/useForm.ts
export function useForm<T extends Record<string, any>>(
  initialValues: T,
  validate?: (values: T) => Partial<Record<keyof T, string>>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  
  const handleChange = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);
  
  const handleSubmit = useCallback((onSubmit: (values: T) => void) => {
    return (e: React.FormEvent) => {
      e.preventDefault();
      
      if (validate) {
        const validationErrors = validate(values);
        setErrors(validationErrors);
        
        if (Object.keys(validationErrors).length > 0) {
          return;
        }
      }
      
      onSubmit(values);
    };
  }, [values, validate]);
  
  return {
    values,
    errors,
    touched,
    handleChange,
    handleSubmit,
    reset: () => {
      setValues(initialValues);
      setErrors({});
      setTouched({});
    }
  };
}
```

## 4. スタイリング戦略

### 4.1 CSS Modules + CSS Variables

#### 4.1.1 テーマ変数

```css
/* src/ui/styles/variables.css */
:root {
  /* Colors */
  --color-primary: #3498db;
  --color-primary-dark: #2980b9;
  --color-secondary: #2ecc71;
  --color-danger: #e74c3c;
  --color-warning: #f39c12;
  --color-info: #3498db;
  
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* Typography */
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-md: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 24px;
  
  /* Breakpoints */
  --breakpoint-mobile: 576px;
  --breakpoint-tablet: 768px;
  --breakpoint-desktop: 1024px;
}

/* Dark theme */
[data-theme="dark"] {
  --color-primary: #5dade2;
  --color-background: #1a1a1a;
  --color-surface: #2d2d2d;
  --color-text: #ffffff;
}
```

#### 4.1.2 コンポーネントスタイル

```css
/* src/ui/components/common/Button/Button.module.css */
.button {
  /* Base styles */
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: 4px;
  font-size: var(--font-size-md);
  transition: all 0.2s ease;
  cursor: pointer;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
}

/* Variants */
.primary {
  background-color: var(--color-primary);
  color: white;
}

.primary:hover {
  background-color: var(--color-primary-dark);
}

/* Sizes */
.small {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-sm);
}

.large {
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: var(--font-size-lg);
}

/* States */
.loading {
  opacity: 0.7;
  pointer-events: none;
}
```

### 4.2 レスポンシブデザイン

```typescript
// src/ui/hooks/useMediaQuery.ts
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    const media = window.matchMedia(query);
    
    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };
    
    setMatches(media.matches);
    media.addEventListener('change', listener);
    
    return () => media.removeEventListener('change', listener);
  }, [query]);
  
  return matches;
};

// 使用例
export const useIsMobile = () => useMediaQuery('(max-width: 768px)');
export const useIsTablet = () => useMediaQuery('(max-width: 1024px)');
```

## 5. エラーハンドリング統一

### 5.1 グローバルエラーハンドラー

```typescript
// src/ui/components/ErrorBoundary/ErrorBoundary.tsx
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // エラーログサービスに送信
  }
  
  render() {
    if (this.state.hasError && this.state.error) {
      const Fallback = this.props.fallback || DefaultErrorFallback;
      return <Fallback error={this.state.error} />;
    }
    
    return this.props.children;
  }
}
```

### 5.2 通知システム

```typescript
// src/ui/hooks/useNotification.ts
interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export const useNotification = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const show = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = generateId();
    const newNotification = { ...notification, id };
    
    setNotifications(prev => [...prev, newNotification]);
    
    if (notification.duration !== 0) {
      setTimeout(() => {
        dismiss(id);
      }, notification.duration || 5000);
    }
  }, []);
  
  const dismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);
  
  return {
    notifications,
    show,
    dismiss,
    success: (title: string, message?: string) => 
      show({ type: 'success', title, message }),
    error: (title: string, message?: string) => 
      show({ type: 'error', title, message }),
    warning: (title: string, message?: string) => 
      show({ type: 'warning', title, message }),
    info: (title: string, message?: string) => 
      show({ type: 'info', title, message })
  };
};
```

## 6. パフォーマンス最適化

### 6.1 コンポーネントの最適化

```typescript
// メモ化の活用
export const ExpensiveComponent = memo(({ data }: Props) => {
  const processedData = useMemo(() => 
    expensiveProcessing(data), [data]
  );
  
  const handleClick = useCallback((id: string) => {
    // 処理
  }, []);
  
  return (
    <div>
      {processedData.map(item => (
        <Item key={item.id} onClick={() => handleClick(item.id)} />
      ))}
    </div>
  );
});
```

### 6.2 遅延読み込み

```typescript
// src/ui/App.tsx
const JournalForm = lazy(() => 
  import('./features/journal/JournalForm')
);

const LedgerView = lazy(() => 
  import('./features/ledger/LedgerView')
);

export const App: React.FC = () => {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/journal" element={<JournalForm />} />
        <Route path="/ledger" element={<LedgerView />} />
      </Routes>
    </Suspense>
  );
};
```

## 7. テスト戦略

### 7.1 コンポーネントテスト

```typescript
// src/ui/components/common/Button/Button.test.tsx
describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });
  
  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('disables when loading', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### 7.2 カスタムフックのテスト

```typescript
// src/ui/hooks/useForm.test.ts
describe('useForm Hook', () => {
  it('initializes with correct values', () => {
    const { result } = renderHook(() => 
      useForm({ name: '', email: '' })
    );
    
    expect(result.current.values).toEqual({ name: '', email: '' });
    expect(result.current.errors).toEqual({});
  });
  
  it('updates values on change', () => {
    const { result } = renderHook(() => 
      useForm({ name: '' })
    );
    
    act(() => {
      result.current.handleChange('name', 'John');
    });
    
    expect(result.current.values.name).toBe('John');
  });
});
```

## 8. 移行戦略

### 8.1 段階的移行アプローチ

**Phase 1: 基盤整備（Week 1）**
1. 新しいディレクトリ構造の作成
2. 共通コンポーネントの実装
3. Context APIの設定

**Phase 2: レイアウト分離（Week 2）**
1. MainLayoutコンポーネントの作成
2. Sidebarの独立
3. ルーティングの改善

**Phase 3: 機能別リファクタリング（Week 3-4）**
1. Journal機能の再構成
2. Ledger機能の再構成
3. Statement機能の再構成

**Phase 4: スタイリング統一（Week 5）**
1. CSS変数の導入
2. CSS Modulesへの移行
3. レスポンシブ対応の改善

### 8.2 互換性の維持

```typescript
// 一時的な互換性レイヤー
// src/ui/app/AppWithSidebar.tsx (移行期間中)
import { MainLayout } from '../layouts/MainLayout';
import { LegacyAdapter } from '../utils/LegacyAdapter';

export const App: React.FC = () => {
  return (
    <LegacyAdapter>
      <MainLayout>
        {/* 既存のコンポーネントを段階的に移行 */}
      </MainLayout>
    </LegacyAdapter>
  );
};
```

## 9. 品質保証

### 9.1 コードレビューチェックリスト

- [ ] コンポーネントは単一責任を持っているか
- [ ] Props の型定義は適切か
- [ ] エラーハンドリングは統一されているか
- [ ] スタイリングは CSS Modules を使用しているか
- [ ] メモ化が適切に使用されているか
- [ ] テストが書かれているか
- [ ] アクセシビリティは考慮されているか

### 9.2 パフォーマンス指標

| 指標 | 現在 | 目標 | 測定方法 |
|-----|------|------|---------|
| First Contentful Paint | 2.5s | 1.5s | Lighthouse |
| Time to Interactive | 4.0s | 2.5s | Lighthouse |
| Bundle Size | 800KB | 600KB | webpack-bundle-analyzer |
| Re-render Count | 高 | 低 | React DevTools Profiler |

## 10. まとめ

この設計書では、UI層の包括的なリファクタリング計画を提示しました。主要な改善点：

1. **構造の改善**: 明確な責任分離とディレクトリ構造
2. **再利用性の向上**: 共通コンポーネントライブラリの構築
3. **状態管理の最適化**: Context APIによる適切な状態管理
4. **スタイリングの統一**: CSS ModulesとCSS変数による一貫性
5. **品質の向上**: テスト戦略とエラーハンドリングの確立

次のドキュメント（IMPLEMENTATION_PLAN.md）では、具体的な実装計画とスケジュールを提示します。

---

*設計作成日: 2025年8月23日*  
*最終更新日: 2025年8月23日*