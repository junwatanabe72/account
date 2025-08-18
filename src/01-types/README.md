# 01-types - 型定義層

## 概要
アプリケーション全体で使用される型定義を集約したディレクトリです。
TypeScriptの型安全性を保証し、ドメインモデルの構造を定義します。

## ディレクトリ構造

```
01-types/
├── core.ts                # 基本的な共通型（ID, DateString, Amount等）
├── account.ts             # 勘定科目関連の型定義
├── journal.ts             # 仕訳関連の型定義
├── transaction.ts         # 取引関連の型定義
├── accounting.ts          # 会計処理関連の型定義
├── accountingDivision.ts  # 会計区分関連の型定義
├── master.ts              # マスタデータ関連の型定義
├── journalPattern.ts      # 仕訳パターン関連の型定義
├── journalGeneration.ts   # 仕訳生成関連の型定義
└── index.ts               # 全型定義の集約エクスポート
```

## 主要な型定義

### Core Types (`core.ts`)
- `ID`: エンティティの一意識別子
- `DateString`: ISO形式の日付文字列
- `Amount`: 金額を表す数値型
- `Timestamp`: タイムスタンプ

### Account Types (`account.ts`)
- `Account`: 勘定科目の基本情報
- `AccountType`: 勘定科目タイプ（ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE）
- `NormalBalance`: 貸借区分（DEBIT, CREDIT）
- `AccountBalance`: 勘定科目の残高情報

### Journal Types (`journal.ts`)
- `UnifiedJournal`: 統一仕訳モデル
- `JournalLine`: 仕訳明細行
- `JournalStatus`: 仕訳ステータス（DRAFT, POSTED, CANCELLED）
- `Division`: 会計区分（KANRI, SHUZEN）

### Transaction Types (`transaction.ts`)
- `Transaction`: 基本的な取引情報
- `TransactionType`: 取引タイプ（income, expense, transfer）
- `TransactionStatus`: 取引ステータス
- `BankTransaction`: 銀行取引の拡張型

### Accounting Types (`accounting.ts`)
- `JournalData`: 仕訳データ構造
- `JournalDetail`: 仕訳明細
- `TrialBalance`: 試算表
- `FinancialReport`: 財務レポート

## 使用方法

### インポート例

```typescript
// 個別インポート
import { Account, AccountType } from '@/01-types/account';
import { UnifiedJournal, JournalStatus } from '@/01-types/journal';

// 集約インポート
import { Account, UnifiedJournal, Transaction } from '@/01-types';
```

### 型定義の利用例

```typescript
// 勘定科目の定義
const account: Account = {
  code: '1101',
  name: '現金',
  type: 'ASSET',
  normalBalance: 'DEBIT',
  isActive: true,
  isPostable: true,
  division: 'COMMON'
};

// 仕訳の作成
const journal: UnifiedJournal = {
  id: 'journal_001',
  journalNumber: 'J202411001',
  date: '2024-11-17',
  division: 'KANRI',
  status: 'DRAFT',
  lines: [
    {
      id: 'line_001',
      accountCode: '1101',
      accountName: '現金',
      debitAmount: 10000,
      creditAmount: 0
    }
  ]
};
```

## 設計原則

1. **Pure Types**: 型定義のみを含み、実装やビジネスロジックは含まない
2. **Immutability**: 全ての型はイミュータブルとして設計
3. **Domain Driven**: ドメインモデルに基づいた型定義
4. **Type Safety**: 厳密な型安全性の保証

## 注意事項

- 型定義の変更は影響範囲が大きいため、慎重に行うこと
- 新しい型を追加する場合は、必ずindex.tsからエクスポートすること
- 重複する型定義を避け、既存の型を可能な限り再利用すること
- JSDocコメントで型の用途と制約を明確に記述すること

## 更新履歴

- 2024-11-17: 初回作成、旧types/フォルダから移行
- 2024-11-17: journalGeneration.ts追加、型定義の重複を解消