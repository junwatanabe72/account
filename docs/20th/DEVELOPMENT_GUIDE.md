# 開発ガイドライン

## 🚀 開発環境のセットアップ

### 必要要件
- Node.js 18.0以上
- npm 9.0以上
- Git

### インストール手順
```bash
# リポジトリのクローン
git clone https://github.com/junwatanabe72/account.git
cd account

# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

### 利用可能なスクリプト
```bash
npm run dev         # 開発サーバー起動 (http://localhost:5173/account/)
npm run build       # プロダクションビルド
npm run typecheck   # TypeScript型チェック
npm run preview     # ビルドのプレビュー
npm run test        # テスト実行
npm run deploy      # GitHub Pagesへデプロイ
```

## 📝 コーディング規約

### TypeScript

#### 1. 型定義
```typescript
// ✅ Good - 明示的な型定義
interface JournalProps {
  id: string;
  date: string;
  amount: number;
}

// ❌ Bad - any型の使用
const data: any = fetchData();
```

#### 2. Null安全性
```typescript
// ✅ Good - Optional chaining
const name = user?.profile?.name ?? 'Unknown';

// ❌ Bad - 非null assertion
const name = user!.profile!.name;
```

#### 3. 関数の型定義
```typescript
// ✅ Good - 完全な型定義
const calculateTotal = (items: Item[]): number => {
  return items.reduce((sum, item) => sum + item.price, 0);
};

// ❌ Bad - 暗黙的な型
const calculateTotal = (items) => {
  return items.reduce((sum, item) => sum + item.price, 0);
};
```

### React

#### 1. コンポーネント定義
```typescript
// ✅ Good - FC型とProps定義
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  label, 
  onClick, 
  disabled = false 
}) => {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
};
```

#### 2. Hooks使用規則
```typescript
// ✅ Good - カスタムフックの抽出
const useJournalData = (id: string) => {
  const [data, setData] = useState<Journal | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // データ取得ロジック
  }, [id]);
  
  return { data, loading };
};
```

#### 3. メモ化の適切な使用
```typescript
// ✅ Good - 高コストな計算のメモ化
const expensiveValue = useMemo(() => 
  calculateComplexValue(data), 
  [data]
);

// ✅ Good - 参照等価性が重要な場合のコールバック
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
```

### CSS

#### 1. CSS変数の使用
```css
/* ✅ Good - CSS変数を使用 */
.button {
  background-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

/* ❌ Bad - ハードコードされた値 */
.button {
  background-color: #3498db;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
```

#### 2. CSS Modules
```typescript
// ✅ Good - CSS Modules使用
import styles from './Component.module.css';

<div className={styles.container}>
  <span className={styles.text}>Hello</span>
</div>

// ❌ Bad - インラインスタイル
<div style={{ padding: '10px', color: 'red' }}>
  <span style={{ fontSize: '14px' }}>Hello</span>
</div>
```

#### 3. レスポンシブデザイン
```css
/* ✅ Good - モバイルファースト */
.container {
  padding: 1rem;
}

@media (min-width: 768px) {
  .container {
    padding: 2rem;
  }
}
```

## 🏗 アーキテクチャガイドライン

### ディレクトリ構造
```
src/
├── domain/          # ビジネスロジック
├── services/        # アプリケーションサービス
├── stores/          # 状態管理 (Zustand)
├── ui/              # UIコンポーネント
├── utils/           # ユーティリティ関数
└── types/           # 型定義
```

### コンポーネント設計

#### 1. 単一責任の原則
```typescript
// ✅ Good - 単一の責務
export const JournalListItem: React.FC<{ journal: Journal }> = ({ journal }) => {
  return <li>{journal.description}</li>;
};

// ❌ Bad - 複数の責務
export const JournalManager: React.FC = () => {
  // リスト表示、編集、削除、検索など全てを含む
};
```

#### 2. Props の設計
```typescript
// ✅ Good - 必要最小限のProps
interface CardProps {
  title: string;
  children: React.ReactNode;
}

// ❌ Bad - 過剰なProps
interface CardProps {
  title: string;
  subtitle?: string;
  icon?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  // ... 20+ props
}
```

### 状態管理 (Zustand)

#### ストアの作成
```typescript
// ✅ Good - 明確な型定義とアクション
interface JournalStore {
  journals: Journal[];
  isLoading: boolean;
  
  // Actions
  addJournal: (journal: Journal) => void;
  removeJournal: (id: string) => void;
  updateJournal: (id: string, updates: Partial<Journal>) => void;
}

export const useJournalStore = create<JournalStore>((set) => ({
  journals: [],
  isLoading: false,
  
  addJournal: (journal) => set((state) => ({
    journals: [...state.journals, journal]
  })),
  
  // ...
}));
```

## 🧪 テスト方針

### 単体テスト
```typescript
// domain/accountingEngine.test.ts
describe('AccountingEngine', () => {
  it('should calculate trial balance correctly', () => {
    const engine = new AccountingEngine();
    engine.addJournal(mockJournal);
    
    const balance = engine.getTrialBalance();
    expect(balance.debit).toBe(balance.credit);
  });
});
```

### コンポーネントテスト
```typescript
// ui/components/Button.test.tsx
describe('Button', () => {
  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();
    const { getByRole } = render(
      <Button label="Test" onClick={handleClick} />
    );
    
    fireEvent.click(getByRole('button'));
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
```

## 🔧 デバッグとトラブルシューティング

### よくある問題と解決策

#### 1. TypeScriptエラー
```bash
# 型チェックの実行
npm run typecheck

# よくあるエラー
# - Object is possibly 'undefined'
#   → Optional chainingを使用: obj?.property
# - Type 'string' is not assignable to type 'number'
#   → 型変換: Number(value) または parseInt(value)
```

#### 2. ビルドエラー
```bash
# クリーンビルド
rm -rf node_modules dist
npm install
npm run build
```

#### 3. 開発サーバーの問題
```bash
# ポートが使用中の場合
lsof -i :5173
kill -9 [PID]

# または別のポートを使用
npm run dev -- --port 3000
```

## 📦 パッケージ管理

### 依存関係の追加
```bash
# 本番環境依存
npm install package-name

# 開発環境依存
npm install -D package-name
```

### バージョン管理
- package-lock.jsonをコミット
- 定期的な依存関係の更新
- 破壊的変更の確認

## 🚢 デプロイメント

### GitHub Pages
```bash
# ビルドとデプロイ
npm run deploy
```

### 環境変数
```typescript
// 環境変数の使用
const API_URL = import.meta.env.VITE_API_URL || 'default-url';
```

## 📚 参考リソース

### 公式ドキュメント
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Zustand](https://github.com/pmndrs/zustand)

### プロジェクト固有
- [プロジェクト概要](./PROJECT_OVERVIEW.md)
- [アーキテクチャ](./ARCHITECTURE.md)
- [実装履歴](./IMPLEMENTATION_HISTORY.md)

## ⚠️ 注意事項

1. **any型の使用禁止**
   - 必ず適切な型を定義

2. **インラインスタイル禁止**
   - CSS ModulesまたはCSS変数を使用

3. **コミットメッセージ規約**
   ```
   feat: 新機能追加
   fix: バグ修正
   docs: ドキュメント更新
   style: コードスタイル修正
   refactor: リファクタリング
   test: テスト追加・修正
   chore: ビルド・ツール関連
   ```

4. **プルリクエスト規約**
   - 機能単位でPR作成
   - レビュー必須
   - テスト通過確認