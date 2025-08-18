# 04-stores - 状態管理層

## 概要
アプリケーションの状態管理を担当する層です。
Zustandを使用して、グローバルな状態を管理し、UIコンポーネントへリアクティブなデータを提供します。

## ディレクトリ構造

```
04-stores/
├── stores/                 # ストア実装
│   ├── useAccountingStore.ts    # メインストア
│   ├── useAccountStore.ts       # 勘定科目ストア
│   ├── useJournalStore.ts       # 仕訳ストア
│   ├── useTransactionStore.ts   # 取引ストア
│   └── types/                   # ストア型定義
│       └── index.ts
└── slices/                 # ストアスライス（将来実装）
```

## 主要コンポーネント

### useAccountingStore
アプリケーションのメイン状態管理ストア。すべての会計データと操作を統括。

```typescript
interface AccountingStore {
  // 状態
  engine: AccountingEngine | null
  isInitialized: boolean
  currentDivision: 'KANRI' | 'SHUZEN'
  
  // アクション
  initialize(): void
  reset(): void
  setDivision(division: 'KANRI' | 'SHUZEN'): void
  
  // 勘定科目操作
  getAccount(code: string): Account | undefined
  getAllAccounts(): Account[]
  
  // 仕訳操作
  createJournal(data: JournalData): CreateJournalResult
  getJournal(id: string): Journal | undefined
  deleteJournal(id: string): void
  
  // レポート生成
  generateBalanceSheet(date: Date): BalanceSheet
  generateIncomeStatement(period: Period): IncomeStatement
  generateTrialBalance(date: Date): TrialBalance
}
```

### useAccountStore
勘定科目に特化した状態管理ストア。

```typescript
interface AccountStore {
  // 状態
  accounts: Map<string, Account>
  selectedAccount: Account | null
  filter: AccountFilter
  
  // アクション
  loadAccounts(): Promise<void>
  selectAccount(code: string): void
  updateAccount(code: string, updates: Partial<Account>): void
  setFilter(filter: AccountFilter): void
  
  // 派生状態
  filteredAccounts: Account[]
  accountsByType: Map<AccountType, Account[]>
}
```

### useJournalStore
仕訳に特化した状態管理ストア。

```typescript
interface JournalStore {
  // 状態
  journals: Map<string, Journal>
  selectedJournal: Journal | null
  filter: JournalFilter
  editingJournal: Journal | null
  
  // アクション
  loadJournals(period?: Period): Promise<void>
  selectJournal(id: string): void
  startEdit(journal: Journal): void
  saveEdit(): Promise<void>
  cancelEdit(): void
  
  // 派生状態
  filteredJournals: Journal[]
  journalsByStatus: Map<JournalStatus, Journal[]>
  totalDebits: number
  totalCredits: number
}
```

### useTransactionStore
取引データに特化した状態管理ストア。

```typescript
interface TransactionStore {
  // 状態
  transactions: Map<string, Transaction>
  importedTransactions: Transaction[]
  matchingResults: MatchResult[]
  
  // アクション
  loadTransactions(): Promise<void>
  importFromBank(file: File): Promise<ImportResult>
  matchTransactions(): Promise<MatchResult[]>
  confirmMatch(matchId: string): void
  rejectMatch(matchId: string): void
  
  // 派生状態
  unmatchedTransactions: Transaction[]
  matchedTransactions: Transaction[]
  matchingRate: number
}
```

## 設計原則

### 1. 単一ソースオブトゥルース
- アプリケーションの状態は一元管理
- データの重複を避ける
- 一貫性のあるデータフロー

### 2. イミュータブル更新
- Zustandのimmerミドルウェアを使用
- 状態の不変性を保証
- 予測可能な状態変更

### 3. 派生状態の活用
- 計算された値はメモ化
- 不要な再計算を防ぐ
- パフォーマンスの最適化

### 4. 責任の分離
- 各ストアは特定のドメインに特化
- 過度な結合を避ける
- テスタビリティの向上

## 使用例

```typescript
import { useAccountingStore } from '@/04-stores/stores/useAccountingStore';
import { useJournalStore } from '@/04-stores/stores/useJournalStore';

// メインストアの使用
function AccountingComponent() {
  const { engine, initialize, createJournal } = useAccountingStore();
  
  useEffect(() => {
    if (!engine) {
      initialize();
    }
  }, []);
  
  const handleCreateJournal = (data: JournalData) => {
    const result = createJournal(data);
    if (result.success) {
      console.log('仕訳作成成功:', result.journal);
    }
  };
  
  return <div>...</div>;
}

// 仕訳ストアの使用
function JournalList() {
  const { 
    filteredJournals, 
    selectJournal, 
    setFilter 
  } = useJournalStore();
  
  return (
    <div>
      {filteredJournals.map(journal => (
        <JournalItem 
          key={journal.id}
          journal={journal}
          onSelect={() => selectJournal(journal.id)}
        />
      ))}
    </div>
  );
}
```

## Zustand DevTools

開発環境では、Zustand DevToolsが有効になっています。
ブラウザの開発者ツールで状態の変化を確認できます。

```typescript
const useStore = create(
  devtools(
    immer((set, get) => ({
      // ストア実装
    })),
    { name: 'AccountingStore' }
  )
);
```

## パフォーマンス最適化

### セレクター使用
```typescript
// 全体の再レンダリングを避ける
const accounts = useAccountingStore(state => state.accounts);
const createJournal = useAccountingStore(state => state.createJournal);
```

### 浅い比較
```typescript
import { shallow } from 'zustand/shallow';

const { account, balance } = useAccountingStore(
  state => ({ 
    account: state.selectedAccount,
    balance: state.currentBalance 
  }),
  shallow
);
```

## テスト戦略

```typescript
// ストアのモック
const mockStore = {
  engine: mockEngine,
  initialize: jest.fn(),
  createJournal: jest.fn(),
};

// テストでの使用
beforeEach(() => {
  useAccountingStore.setState(mockStore);
});
```

## 注意事項

- 大量データの場合は仮想化を検討
- 非同期処理では適切なローディング状態を管理
- メモリリークを防ぐため、クリーンアップを実装
- サーバーサイドレンダリング時の初期化に注意

## 更新履歴

- 2024-11-17: 初回作成、stores/フォルダから移行
- 2024-11-17: Zustandベースの状態管理に統一