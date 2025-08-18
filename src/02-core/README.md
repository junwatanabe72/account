# 02-core - コアドメイン層

## 概要
ビジネスロジックの中核となるドメインモデルとビジネスルールを実装する層です。
外部依存を持たない純粋なビジネスロジックを提供します。

## ディレクトリ構造

```
02-core/
├── models/              # ドメインモデル（エンティティ、値オブジェクト）
│   ├── Account.ts       # 勘定科目モデル
│   ├── Journal.ts       # 仕訳モデル
│   └── Division.ts      # 会計区分モデル
├── generators/          # ビジネスルール実装
│   └── JournalGenerationEngine.ts  # 仕訳生成エンジン
└── validators/          # バリデーションロジック（将来実装）
```

## 主要コンポーネント

### Models（ドメインモデル）

#### Account
勘定科目のドメインモデル。イミュータブルな値オブジェクトとして実装。

```typescript
class Account {
  constructor(account: AccountType)
  
  // プロパティ
  get code(): string
  get name(): string
  get type(): AccountType
  get isPostable(): boolean
  get division(): 'KANRI' | 'SHUZEN' | 'COMMON'
  
  // ビジネスメソッド
  isDebitAccount(): boolean
  isCreditAccount(): boolean
  belongsToDivision(division: Division): boolean
  calculateBalance(debits: number, credits: number): number
  formatBalance(amount: number): string
}
```

#### Journal
仕訳のドメインモデル。仕訳の作成、検証、転記などのビジネスロジックを実装。

```typescript
class Journal {
  constructor(journal: UnifiedJournal)
  
  // プロパティ
  get id(): ID
  get journalNumber(): string
  get date(): DateString
  get status(): JournalStatus
  get lines(): ReadonlyArray<JournalLine>
  
  // ビジネスメソッド
  getTotalDebits(): Amount
  getTotalCredits(): Amount
  isBalanced(): boolean
  canPost(): boolean
  post(): Journal
  cancel(reason: string): Journal
  validate(): string[]
  
  // ファクトリメソッド
  static createDraft(...): Journal
}
```

#### Division
会計区分のドメインモデル。管理会計と修繕積立金会計の区分を管理。

```typescript
class Division {
  // 定数
  static KANRI: Division
  static SHUZEN: Division
  static COMMON: Division
  
  // メソッド
  getCode(): DivisionCode
  getName(): string
  isManagement(): boolean
  isMaintenance(): boolean
  canUseAccount(accountDivision: DivisionCode): boolean
}
```

### Generators（ビジネスルール）

#### JournalGenerationEngine
取引データから仕訳を自動生成するビジネスルールエンジン。

```typescript
class JournalGenerationEngine {
  constructor(accountService: AccountService)
  
  // 仕訳生成
  generateJournal(transaction: TransactionForJournal): JournalData
  generatePaymentJournal(transaction: TransactionForJournal, paymentAccountCode: string): JournalData
  
  // ルール管理
  addRule(rule: JournalGenerationRule): void
  removeRule(ruleId: string): void
  updateRule(ruleId: string, updates: Partial<JournalGenerationRule>): void
  getRules(): JournalGenerationRule[]
}
```

## 設計原則

### 1. Domain-Driven Design (DDD)
- ドメインモデルを中心とした設計
- ユビキタス言語の使用（管理会計、修繕積立金会計など）
- 集約ルートによる整合性の保証

### 2. イミュータビリティ
- すべてのモデルは不変オブジェクトとして実装
- 状態変更は新しいインスタンスを返す
- Object.freeze()による不変性の保証

### 3. カプセル化
- ビジネスロジックをモデル内に閉じ込める
- privateフィールドによるデータ隠蔽
- getterによる読み取り専用アクセス

### 4. 純粋関数
- 副作用のない関数設計
- 予測可能な振る舞い
- テスタビリティの向上

## 使用例

```typescript
import { Journal } from '@/02-core/models/Journal';
import { JournalGenerationEngine } from '@/02-core/generators/JournalGenerationEngine';

// 仕訳の作成
const journal = Journal.createDraft(
  '2024-11-17',
  'KANRI',
  [
    { accountCode: '1101', debitAmount: 10000, creditAmount: 0 },
    { accountCode: '4101', debitAmount: 0, creditAmount: 10000 }
  ],
  '管理費収入'
);

// バリデーション
const errors = journal.validate();
if (errors.length === 0) {
  // 転記
  const postedJournal = journal.post();
}

// 自動仕訳生成
const engine = new JournalGenerationEngine(accountService);
const journalData = engine.generateJournal(transaction);
```

## テスト戦略

- 単体テスト: 各モデルのメソッドを個別にテスト
- 統合テスト: モデル間の連携をテスト
- プロパティベーステスト: 不変条件の検証

## 注意事項

- 外部依存（データベース、API等）を持たないこと
- ビジネスロジックの変更は慎重に行うこと
- 新しいモデルは必ずイミュータブルに設計すること

## 更新履歴

- 2024-11-17: 初回作成、domain/フォルダから移行
- 2024-11-17: JournalGenerationEngineを02-core/generators/に配置