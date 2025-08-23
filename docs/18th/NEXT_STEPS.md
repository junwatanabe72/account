# 次のステップと改善提案

## 🎯 優先度別タスク

### 🔴 優先度: 高（1週間以内）

#### 1. forceUpdateパターンの削除
```typescript
// 現在
const [, setTick] = useState(0);
const forceUpdate = () => setTick((x) => x + 1);

// 改善案: Zustandストア化
const useAccountingStore = create((set, get) => ({
  engine: new AccountingEngine(),
  journals: [],
  
  refreshJournals: () => {
    const journals = get().engine.getJournals();
    set({ journals });
  },
  
  createJournal: (data) => {
    const result = get().engine.createJournal(data);
    if (result.success) {
      get().refreshJournals();
    }
    return result;
  }
}));
```

#### 2. プロップドリリングの解消
```typescript
// AccountingEngineのContext化
const AccountingContext = createContext<AccountingEngine | null>(null);

export const useAccounting = () => {
  const context = useContext(AccountingContext);
  if (!context) {
    throw new Error('useAccounting must be used within AccountingProvider');
  }
  return context;
};

// 使用側
const MyComponent = () => {
  const engine = useAccounting(); // プロップ不要
};
```

### 🟡 優先度: 中（2-3週間）

#### 3. 共通コンポーネントライブラリ
```
src/ui/components/common/
├── Button/
│   ├── Button.tsx
│   ├── Button.module.css
│   └── Button.stories.tsx
├── Input/
│   ├── Input.tsx
│   ├── Input.module.css
│   └── Input.stories.tsx
├── Select/
├── Modal/
└── Table/
```

#### 4. エラーバウンダリの実装
```typescript
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error caught:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

### 🟢 優先度: 低（1ヶ月以内）

#### 5. 遅延ロードの実装
```typescript
// RouteManager.tsx
const FreeeStyleJournalForm = lazy(() => 
  import('../transactions/FreeeStyleJournalForm')
);

// 使用時
<Suspense fallback={<Loading />}>
  <FreeeStyleJournalForm engine={engine} />
</Suspense>
```

#### 6. テストの追加
```typescript
// Sidebar.test.tsx
describe('Sidebar', () => {
  it('should toggle open/closed state', () => {
    const onToggle = jest.fn();
    const { getByLabelText } = render(
      <Sidebar isOpen={true} onToggle={onToggle} />
    );
    
    fireEvent.click(getByLabelText('サイドバーを閉じる'));
    expect(onToggle).toHaveBeenCalled();
  });
});
```

## 🏗️ アーキテクチャ改善

### Store統合計画
```typescript
// src/stores/index.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

const useStore = create()(
  devtools(
    persist(
      immer((set, get) => ({
        // Navigation
        ...createNavigationSlice(set, get),
        // Accounting
        ...createAccountingSlice(set, get),
        // Journal
        ...createJournalSlice(set, get),
        // UI
        ...createUISlice(set, get),
      })),
      { name: 'app-store' }
    )
  )
);
```

### ディレクトリ構造の最終形
```
src/
├── domain/        # ビジネスロジック（変更なし）
├── stores/        # Zustand統合ストア
├── ui/
│   ├── app/       # アプリケーションレベル
│   ├── layouts/   # レイアウト
│   ├── features/  # 機能別コンポーネント
│   │   ├── journal/
│   │   ├── ledger/
│   │   ├── statement/
│   │   └── payment/
│   ├── components/# 共通コンポーネント
│   │   ├── common/
│   │   ├── feedback/
│   │   └── data-display/
│   ├── hooks/     # カスタムフック
│   └── styles/    # グローバルスタイル
└── utils/         # ユーティリティ

```

## 📊 パフォーマンス最適化

### 1. バンドルサイズ削減
```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'react';
            if (id.includes('zustand')) return 'zustand';
            if (id.includes('zod')) return 'validation';
            return 'vendor';
          }
        }
      }
    }
  }
});
```

### 2. 画像最適化
```typescript
// 遅延ロード画像コンポーネント
const LazyImage = ({ src, alt, ...props }) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const imgRef = useRef();
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.unobserve(entry.target);
          }
        });
      }
    );
    
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    
    return () => observer.disconnect();
  }, [src]);
  
  return <img ref={imgRef} src={imageSrc} alt={alt} {...props} />;
};
```

## 🧪 テスト戦略

### 単体テスト
- Jest + React Testing Library
- 各コンポーネントの独立テスト
- カスタムフックのテスト

### 統合テスト
- ユーザーフロー全体のテスト
- Zustandストアとの連携テスト

### E2Eテスト
- Playwright or Cypress
- 主要な業務フローの自動テスト

## 📈 メトリクス監視

### 追跡すべき指標
1. **パフォーマンス**
   - First Contentful Paint (FCP)
   - Time to Interactive (TTI)
   - バンドルサイズ

2. **コード品質**
   - 型カバレッジ
   - テストカバレッジ
   - 複雑度

3. **開発効率**
   - ビルド時間
   - PR作成からマージまでの時間
   - バグ修正時間

## 🚀 ロードマップ

### Q3 2025（7-9月）
- [x] AppWithSidebarリファクタリング
- [ ] 共通コンポーネント作成
- [ ] Zustand統合
- [ ] テスト追加

### Q4 2025（10-12月）
- [ ] パフォーマンス最適化
- [ ] アクセシビリティ改善
- [ ] ドキュメント整備
- [ ] CI/CD改善

### Q1 2026（1-3月）
- [ ] マイクロフロントエンド検討
- [ ] デザインシステム確立
- [ ] 国際化対応

---

*作成日: 2025年8月23日*  
*次回レビュー: 2025年8月30日*