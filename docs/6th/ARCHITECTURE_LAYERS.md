# アーキテクチャレイヤーの責務分離

*作成日: 2025-08-19*

## 概要

このシステムは、クリーンアーキテクチャの原則に基づき、明確な責務分離を行っています。

## レイヤー構造

```
src/
├── domain/          # ビジネスロジック層
│   ├── services/    # ビジネスサービス
│   └── interfaces/  # 抽象化インタフェース
├── stores/          # 状態管理層
│   ├── slices/      # Zustandスライス
│   └── hooks/       # カスタムフック
└── ui/              # プレゼンテーション層
```

---

## 1. Domain層（ビジネスロジック）

### 場所
`src/domain/services/`

### 責務
- **ビジネスルールの実装**
- **データの処理と計算**
- **ドメインモデルの管理**
- **外部システムとの統合**

### 特徴
```typescript
// domain/services/AccountService.ts
export class AccountService {
  // ビジネスロジック：勘定科目の階層構造を構築
  buildHierarchy(accounts: Account[]): HierarchicalAccount[] {
    // 複雑なビジネスルールを実装
  }
  
  // ビジネスロジック：残高計算
  calculateBalance(account: Account): number {
    // 会計原則に基づく計算
  }
}
```

### 主要なサービス（12個）
| サービス | 責務 |
|---------|------|
| AccountService | 勘定科目管理、階層構造、残高計算 |
| JournalService | 仕訳の作成、検証、転記 |
| DivisionService | 部門管理、部門別会計 |
| ReportService | 財務諸表生成、レポート作成 |
| TransactionService | 取引管理、Freee型インタフェース |
| ImportExportService | データのインポート/エクスポート |
| AuxiliaryService | 補助元帳、管理費請求 |
| ClosingService | 決算処理、締め処理 |
| SampleDataService | サンプルデータ生成 |
| JournalGenerationEngine | 仕訳自動生成 |
| BankAccountService | 銀行口座管理 |
| ServiceFactory | サービス生成、DI管理 |

---

## 2. Stores層（状態管理）

### 場所
`src/stores/slices/`

### 責務
- **UIの状態管理**
- **ドメインとUIの仲介**
- **非同期処理の管理**
- **キャッシュ管理**

### 特徴
```typescript
// stores/slices/accountingSlice.ts
export const createAccountingSlice = (set, get) => ({
  // 状態
  engine: null,
  isInitialized: false,
  lastUpdate: null,
  
  // UIアクション（ドメインサービスを呼び出す）
  initializeEngine: () => {
    const engine = new AccountingEngine() // ドメインを使用
    set({ engine, isInitialized: true })
  }
})
```

### 主要なスライス（9個）
| スライス | 責務 |
|----------|------|
| accountingSlice | AccountingEngineのインスタンス管理 |
| journalSlice | 仕訳のUI状態管理 |
| transactionSlice | 取引のUI状態管理 |
| auxiliarySliceEnhanced | 補助元帳のUI状態管理 |
| bankAccountSlice | 銀行口座のUI状態管理 |
| uiSlice | UI全般の状態（モーダル、ローディング等） |
| journalSliceEnhanced | 拡張仕訳機能のUI状態 |
| transactionSliceEnhanced | 拡張取引機能のUI状態 |
| unifiedJournalSlice | 統合仕訳管理のUI状態 |

---

## 責務の明確な分離

### Domain/Services（ビジネスロジック）
```typescript
// 責務：ビジネスルールの実装
class JournalService {
  validateJournal(journal: Journal): ValidationResult {
    // 複雑な会計ルールのチェック
    // - 借方と貸方のバランス
    // - 勘定科目の妥当性
    // - 部門会計の整合性
    return { isValid, errors }
  }
}
```

### Stores/Slices（状態管理）
```typescript
// 責務：UIの状態とユーザーインタラクション
const journalSlice = {
  // UI状態
  selectedJournal: null,
  isEditing: false,
  validationErrors: [],
  
  // UIアクション（ドメインを呼び出す）
  saveJournal: async (data) => {
    // 1. ドメインサービスを呼び出す
    const result = engine.createJournal(data)
    
    // 2. UI状態を更新
    set({ 
      selectedJournal: result.journal,
      validationErrors: result.errors 
    })
  }
}
```

---

## 責務分離の原則

### 1. 単一責任の原則（SRP）

| レイヤー | 単一の責任 |
|---------|-----------|
| Domain/Services | ビジネスロジックの実装のみ |
| Stores/Slices | UI状態管理のみ |
| UI/Components | 描画とユーザー入力のみ |

### 2. 依存関係の方向

```
UI Components
    ↓ 依存
Stores/Slices
    ↓ 依存
Domain/Services
    ↓ 依存
Domain/Interfaces
```

**重要**: 依存は常に内側（ドメイン）に向かう

### 3. データフローの明確化

```
ユーザー操作
    ↓
UI Component（イベント発火）
    ↓
Store/Slice（アクション実行）
    ↓
Domain/Service（ビジネスロジック）
    ↓
Store/Slice（状態更新）
    ↓
UI Component（再レンダリング）
```

---

## 具体例：仕訳作成フロー

### 1. UI層
```typescript
// ui/components/JournalForm.tsx
const handleSubmit = (formData) => {
  // Storeのアクションを呼び出すだけ
  store.createJournal(formData)
}
```

### 2. Store層
```typescript
// stores/slices/journalSlice.ts
createJournal: async (formData) => {
  set({ isLoading: true })
  
  // ドメインサービスを呼び出す
  const engine = get().engine
  const result = engine.createJournal(formData)
  
  set({ 
    journals: [...get().journals, result.journal],
    isLoading: false 
  })
}
```

### 3. Domain層
```typescript
// domain/services/JournalService.ts
createJournal(data: JournalData): CreateJournalResult {
  // ビジネスロジック
  const validation = this.validate(data)
  if (!validation.isValid) {
    return { success: false, errors: validation.errors }
  }
  
  const journal = new Journal(data)
  this.journals.push(journal)
  
  // 勘定科目への転記
  this.postToAccounts(journal)
  
  return { success: true, journal }
}
```

---

## アンチパターンと解決策

### ❌ アンチパターン1: StoreでビジネスロジックI実装
```typescript
// 悪い例：Storeでビジネスロジックを実装
const journalSlice = {
  validateJournal: (journal) => {
    // ビジネスルールをStoreに書いてしまう
    if (journal.debit !== journal.credit) {
      return false
    }
  }
}
```

### ✅ 解決策
```typescript
// 良い例：ドメインサービスに委譲
const journalSlice = {
  validateJournal: (journal) => {
    // ドメインサービスを呼び出す
    return get().engine.validateJournal(journal)
  }
}
```

### ❌ アンチパターン2: Domainが UI状態を持つ
```typescript
// 悪い例：DomainがUI状態を持つ
class JournalService {
  isLoading = false  // UI状態
  selectedIndex = -1 // UI状態
}
```

### ✅ 解決策
```typescript
// 良い例：純粋なビジネスロジックのみ
class JournalService {
  // ビジネスデータのみ
  journals: Journal[] = []
  
  // ビジネスロジックのみ
  createJournal(data: JournalData): Journal {
    // ...
  }
}
```

---

## まとめ

### Domain/Services の責務
- ✅ ビジネスルールの実装
- ✅ データの計算と変換
- ✅ 永続化ロジック
- ✅ 外部サービスとの統合
- ❌ UI状態の管理
- ❌ ユーザーインタラクション

### Stores/Slices の責務
- ✅ UI状態の管理
- ✅ ユーザーアクションの処理
- ✅ ドメインサービスの呼び出し
- ✅ 非同期処理の管理
- ❌ ビジネスロジックの実装
- ❌ データの永続化

この明確な責務分離により、以下が実現されています：
1. **テスタビリティ**: 各層を独立してテスト可能
2. **保守性**: 変更の影響範囲が限定的
3. **再利用性**: ドメインロジックをUIから独立して再利用可能
4. **理解しやすさ**: 各層の役割が明確

---

*作成者: Claude Code*  
*最終更新: 2025-08-19 18:45*