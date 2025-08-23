# FreeeStyleJournalForm リファクタリング計画

## 現状分析

### ファイル情報
- **パス**: `/src/ui/transactions/FreeeStyleJournalForm.tsx`
- **行数**: 1096行
- **複雑度**: 非常に高い

### 主要な問題点

1. **巨大な単一コンポーネント**
   - 1096行のモノリシックコンポーネント
   - 20個以上の状態変数
   - 複数の責務が混在

2. **状態管理の複雑さ**
   - 20個のuseState（過剰な状態管理）
   - 相互依存する状態の管理が複雑
   - グローバル状態との連携が不明確

3. **ビジネスロジックの混在**
   - 勘定科目の検証ロジック
   - 仕訳生成ロジック
   - フォームバリデーション
   - 全てがUIコンポーネント内に存在

4. **重複コード**
   - 会計区分切り替え時のリセット処理が4箇所で重複
   - 似たような条件分岐が多数存在

## リファクタリング設計

### 1. コンポーネント分割

```
FreeeStyleJournalForm/
├── index.tsx                    // メインコンテナ (100行)
├── TransactionTypeSelector.tsx  // 取引タイプ選択 (80行)
├── DivisionSelector.tsx         // 会計区分選択 (120行)
├── AmountInput.tsx              // 金額入力 (60行)
├── AccountSelector/
│   ├── index.tsx                // 勘定科目選択 (150行)
│   ├── AccountSearch.tsx        // 検索機能 (80行)
│   ├── AccountModal.tsx         // モーダル (100行)
│   └── FrequentAccounts.tsx     // よく使う科目 (60行)
├── TransferForm.tsx             // 振替フォーム (100行)
├── PaymentOptions.tsx           // 支払オプション (80行)
├── TagManager.tsx               // タグ管理 (60行)
├── JournalPreview.tsx           // 仕訳プレビュー (80行)
└── ValidationMessage.tsx        // バリデーション表示 (40行)
```

### 2. Zustand Store設計

```typescript
// stores/slices/journal/journalFormSlice.ts
interface JournalFormState {
  // 基本情報
  transactionType: 'income' | 'expense' | 'transfer'
  division: Division
  date: string
  amount: string
  description: string
  
  // 勘定科目
  selectedAccount: AccountItem | null
  accountSearchQuery: string
  
  // 振替
  transferFromAccount: string
  transferToAccount: string
  
  // 支払情報
  paymentAccount: PaymentAccountType
  paymentStatus: 'completed' | 'pending'
  
  // その他
  serviceMonth: string
  payerId: string
  tags: string[]
  
  // UI状態
  showSuggestions: boolean
  showAccountModal: boolean
  errors: Record<string, string>
  validationMessage: ValidationMessage | null
  
  // アクション
  setTransactionType: (type: TransactionType) => void
  setDivision: (division: Division) => void
  resetForm: () => void
  validateForm: () => boolean
  submitJournal: () => Promise<void>
}
```

### 3. カスタムフック

```typescript
// hooks/useJournalForm.ts
export const useJournalForm = () => {
  const formState = useJournalFormStore()
  const engine = useAccountingEngine()
  
  const generateJournal = useCallback(() => {
    // 仕訳生成ロジック
  }, [formState])
  
  const handleSubmit = useCallback(async () => {
    // 送信処理
  }, [formState, engine])
  
  return {
    ...formState,
    generateJournal,
    handleSubmit
  }
}

// hooks/useAccountSearch.ts
export const useAccountSearch = (division: Division) => {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<AccountItem[]>([])
  
  const searchAccounts = useCallback(() => {
    // 検索ロジック
  }, [query, division])
  
  return {
    query,
    setQuery,
    suggestions,
    searchAccounts
  }
}
```

### 4. ユーティリティ関数

```typescript
// utils/journal/validation.ts
export const validateJournalForm = (form: JournalFormData): ValidationResult => {
  // バリデーションロジック
}

// utils/journal/generator.ts
export const generateJournalEntry = (form: JournalFormData): JournalEntry => {
  // 仕訳生成ロジック
}

// utils/journal/accountMapping.ts
export const getPaymentAccountCode = (account: PaymentAccountType): string => {
  // 勘定科目マッピング
}
```

### 5. CSS Modules化

```css
/* FreeeStyleJournalForm.module.css */
.container {
  /* スタイル定義 */
}

.transactionTabs {
  /* タブスタイル */
}

.divisionSelector {
  /* 区分選択スタイル */
}
```

## 実装手順

### Phase 1: Store作成（1時間）
1. journalFormSlice.tsの作成
2. 既存の状態をStoreに移行
3. アクションの定義

### Phase 2: コンポーネント分割（3時間）
1. 各サブコンポーネントの作成
2. プロップスの定義と接続
3. イベントハンドラの移行

### Phase 3: ロジック抽出（2時間）
1. カスタムフックの作成
2. ユーティリティ関数の実装
3. ビジネスロジックの分離

### Phase 4: スタイル整理（1時間）
1. CSS Modulesへの移行
2. 共通スタイルの抽出
3. レスポンシブ対応の確認

### Phase 5: テストと最適化（1時間）
1. 動作確認
2. パフォーマンス最適化
3. TypeScript型の強化

## 期待される成果

### 定量的改善
- **コード行数**: 1096行 → 各コンポーネント平均80行
- **複雑度**: 単一の複雑なコンポーネント → 13個の単純なコンポーネント
- **状態管理**: 20個のuseState → Zustand Storeで一元管理

### 定性的改善
- **保守性**: 各コンポーネントが単一責務
- **テスタビリティ**: ロジックとUIの分離
- **再利用性**: 共通コンポーネントの抽出
- **可読性**: 明確な構造と命名

## リスクと対策

### リスク
1. 既存機能の破損
2. パフォーマンスの劣化
3. スタイルの崩れ

### 対策
1. 段階的な移行と動作確認
2. React.memoによる最適化
3. CSS Modulesの慎重な移行

## 次のステップ

1. ✅ リファクタリング計画の作成
2. ⏳ Zustand Storeの実装
3. ⏳ コンポーネント分割の開始
4. ⏳ 動作確認とレビュー