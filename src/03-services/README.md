# 03-services - アプリケーションサービス層

## 概要
アプリケーションロジックとユースケースを実装する層です。
コアドメイン層（02-core）のモデルを組み合わせて、具体的な業務機能を提供します。

## ディレクトリ構造

```
03-services/
├── facade/                 # ファサードパターンによる統合インターフェース
│   ├── AccountingFacade.ts # メインファサード
│   ├── CoreFacade.ts       # コア機能ファサード
│   ├── ReportingFacade.ts  # レポート機能ファサード
│   ├── IOFacade.ts         # 入出力機能ファサード
│   └── HelperFacade.ts     # ヘルパー機能ファサード
├── account/                # 勘定科目サービス
│   └── AccountService.ts
├── journal/                # 仕訳サービス
│   └── JournalService.ts
├── transaction/            # 取引サービス
│   └── TransactionService.ts
├── division/               # 会計区分サービス
│   └── DivisionService.ts
├── reporting/              # レポートサービス
│   └── ReportService.ts
└── io/                     # 入出力サービス
    └── ImportExportService.ts
```

## 主要コンポーネント

### Facade Pattern（ファサード）

#### AccountingFacade
複雑なサービス群を統合し、シンプルなインターフェースを提供するメインファサード。

```typescript
class AccountingFacade {
  private _core: CoreFacade
  private _reporting: ReportingFacade
  private _io: IOFacade
  private _helper: HelperFacade
  
  // 統合インターフェース
  initialize(): void
  reset(): void
  getState(): AccountingState
}
```

#### CoreFacade
コア業務機能（勘定科目、仕訳、取引、会計区分）を統合。

```typescript
class CoreFacade {
  accounts: AccountService
  journals: JournalService
  transactions: TransactionService
  divisions: DivisionService
}
```

### Services（サービス）

#### AccountService
勘定科目の管理機能を提供。

```typescript
class AccountService {
  // CRUD操作
  getAccount(code: string): Account | undefined
  getAllAccounts(): Account[]
  createAccount(account: Account): void
  updateAccount(code: string, updates: Partial<Account>): void
  
  // ビジネスロジック
  getAccountsByType(type: AccountType): Account[]
  getAccountsByDivision(division: Division): Account[]
  calculateBalance(code: string): number
}
```

#### JournalService
仕訳の管理と処理機能を提供。

```typescript
class JournalService {
  // 仕訳操作
  createJournal(data: JournalData): CreateJournalResult
  getJournal(id: string): Journal | undefined
  updateJournal(id: string, updates: Partial<Journal>): void
  deleteJournal(id: string): void
  
  // ビジネス処理
  postJournal(id: string): void
  cancelJournal(id: string, reason: string): void
  validateJournal(journal: Journal): string[]
  
  // 検索・集計
  searchJournals(filter: JournalFilter): Journal[]
  getJournalsByPeriod(start: Date, end: Date): Journal[]
}
```

#### TransactionService
取引データの管理と仕訳生成機能を提供。

```typescript
class TransactionService {
  // 取引管理
  createTransaction(data: TransactionData): Transaction
  importTransactions(data: BankTransaction[]): ImportResult
  
  // 仕訳生成
  generateJournal(transaction: Transaction): Journal
  matchTransactions(transactions: Transaction[]): MatchResult
  
  // 検索・分析
  searchTransactions(filter: TransactionFilter): Transaction[]
  analyzeTransactions(period: Period): TransactionAnalysis
}
```

#### ReportService
レポート生成と財務諸表作成機能を提供。

```typescript
class ReportService {
  // 財務諸表
  generateBalanceSheet(date: Date, division?: Division): BalanceSheet
  generateIncomeStatement(period: Period, division?: Division): IncomeStatement
  generateTrialBalance(date: Date, division?: Division): TrialBalance
  
  // カスタムレポート
  generateCustomReport(config: ReportConfig): Report
  exportReport(report: Report, format: ExportFormat): Blob
}
```

## 設計原則

### 1. ファサードパターン
- 複雑なサービス群をシンプルなインターフェースで隠蔽
- クライアントコードの簡潔性を保つ
- サービス間の依存関係を管理

### 2. 単一責任原則
- 各サービスは1つの責務のみを持つ
- 明確な境界と責任範囲
- 高い凝集性と低い結合度

### 3. 依存性逆転原則
- 抽象に依存し、具象に依存しない
- インターフェースを介した疎結合
- テスタビリティの向上

### 4. レイヤードアーキテクチャ
- 02-core層のモデルを利用
- 04-stores層への橋渡し
- 05-ui層から呼び出される

## 使用例

```typescript
import { AccountingFacade } from '@/03-services/facade/AccountingFacade';

// ファサードの初期化
const facade = new AccountingFacade();
facade.initialize();

// 勘定科目の取得
const account = facade.core.accounts.getAccount('1101');

// 仕訳の作成
const result = facade.core.journals.createJournal({
  date: '2024-11-17',
  description: '管理費収入',
  details: [...]
});

// レポートの生成
const balanceSheet = facade.reporting.generateBalanceSheet(
  new Date('2024-11-17'),
  'KANRI'
);
```

## テスト戦略

- 単体テスト: 各サービスメソッドの個別テスト
- 統合テスト: ファサード経由の機能テスト
- モックテスト: 外部依存のモック化

## 注意事項

- サービス間の直接参照は避ける（ファサード経由で）
- 状態管理はストア層（04-stores）で行う
- UI固有のロジックは含めない

## 更新履歴

- 2024-11-17: 初回作成、domain/services/から移行
- 2024-11-17: ファサードパターンによる再構成