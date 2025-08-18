# マンション管理組合会計システム - ビジネスロジック仕様書

*最終更新: 2025-08-19*

## 目次

1. [システム概要](#システム概要)
2. [コアビジネスロジック](#コアビジネスロジック)
3. [勘定科目管理](#勘定科目管理)
4. [仕訳処理](#仕訳処理)
5. [財務レポート](#財務レポート)
6. [補助元帳管理](#補助元帳管理)
7. [決算処理](#決算処理)
8. [データ検証ルール](#データ検証ルール)

---

## システム概要

### 目的

マンション管理組合の会計業務を効率化し、正確な財務管理を実現する。

### 主要機能

- 複式簿記による仕訳管理
- 部門別会計（管理会計・修繕積立金会計）
- 管理費請求と収納管理
- 財務諸表の自動生成
- 補助元帳による詳細管理

### アーキテクチャ

```
UI層（React）
  ↓
Store層（Zustand）
  ↓
Domain層（ビジネスロジック）
  ├── AccountingEngine（ファサード）
  └── Services（各種サービス）
```

---

## コアビジネスロジック

### 1. AccountingEngine

**ファイル**: `src/domain/AccountingEngine.ts`

**責務**:

- すべての会計サービスへの統一インタフェース
- サービス間の協調制御
- トランザクション管理

**主要メソッド**:

```typescript
class AccountingEngine {
  // 初期化
  initializeEngine(): void
  
  // 勘定科目管理
  getAccounts(): HierarchicalAccount[]
  addOrUpdateAccount(def: AccountDefinition): void
  
  // 仕訳管理
  createJournal(data: JournalData): CreateJournalResult
  postJournal(journal: Journal): void
  
  // レポート生成
  getTrialBalance(): TrialBalance
  getBalanceSheet(): BalanceSheet
  getIncomeStatement(): IncomeStatement
}
```

---

## 勘定科目管理

### AccountService

**ファイル**: `src/domain/services/AccountService.ts`

### ビジネスルール

#### 1. 勘定科目コード体系

```
[1][0-9][0-9][0-9] : 資産（1000番台）
[2][0-9][0-9][0-9] : 負債（2000番台）
[3][0-9][0-9][0-9] : 純資産（3000番台）
[4][0-9][0-9][0-9] : 収益（4000番台）
[5][0-9][0-9][0-9] : 費用（5000番台）
```

#### 2. 階層構造

```
レベル1（大科目）: 1000 流動資産
  レベル2（中科目）: 1100 現金預金
    レベル3（小科目）: 1111 普通預金
    レベル3（小科目）: 1112 定期預金
```

#### 3. 正常残高ルール

| 科目区分 | 正常残高 | 増加 | 減少 |
| -------- | -------- | ---- | ---- |
| 資産     | 借方     | 借方 | 貸方 |
| 負債     | 貸方     | 貸方 | 借方 |
| 純資産   | 貸方     | 貸方 | 借方 |
| 収益     | 貸方     | 貸方 | 借方 |
| 費用     | 借方     | 借方 | 貸方 |

### 主要な勘定科目

#### 資産科目

```typescript
{
  "1111": "普通預金",
  "1112": "定期預金",
  "1211": "管理費未収金",
  "1311": "前払費用",
  "1611": "什器備品"
}
```

#### 負債科目

```typescript
{
  "2111": "未払金",
  "2211": "前受金",
  "2311": "預り金"
}
```

#### 収益科目

```typescript
{
  "4111": "管理費収入",
  "4121": "修繕積立金収入",
  "4211": "駐車場収入",
  "4311": "雑収入"
}
```

#### 費用科目

```typescript
{
  "5111": "管理業務委託費",
  "5121": "清掃費",
  "5131": "設備保守費",
  "5211": "水道光熱費",
  "5311": "修繕費"
}
```

---

## 仕訳処理

### JournalService

**ファイル**: `src/domain/services/JournalService.ts`

### ビジネスルール

#### 1. 仕訳の状態遷移

```
DRAFT（下書き）
  ↓ submit
SUBMITTED（提出済み）
  ↓ approve
APPROVED（承認済み）
  ↓ post
POSTED（転記済み）
```

#### 2. 借方・貸方バランス

- **必須条件**: 借方合計 = 貸方合計
- **許容誤差**: 0.01円未満

#### 3. 仕訳の検証ルール

```typescript
interface ValidationRules {
  // 必須項目
  date: Required        // 仕訳日付
  description: Required // 摘要
  details: Required     // 明細行（最低1行）
  
  // バランスチェック
  balance: MustMatch    // 借方=貸方
  
  // 日付チェック
  dateRange: WithinPeriod // 会計期間内
  
  // 勘定科目チェック
  accountCode: MustExist  // 存在する科目
  accountActive: MustBeActive // 有効な科目
}
```

### 典型的な仕訳パターン

#### 1. 管理費収入

```
借方: 普通預金 25,000 / 貸方: 管理費収入 25,000
```

#### 2. 管理業務委託費支払い

```
借方: 管理業務委託費 100,000 / 貸方: 普通預金 100,000
```

#### 3. 修繕積立金収入

```
借方: 普通預金 15,000 / 貸方: 修繕積立金収入 15,000
```

---

## 財務レポート

### ReportService

**ファイル**: `src/domain/services/ReportService.ts`

### 1. 試算表（Trial Balance）

#### 生成ルール

- 転記済み仕訳のみを集計
- 勘定科目別に借方・貸方を集計
- 借方合計 = 貸方合計を検証

#### 出力形式

```typescript
interface TrialBalanceItem {
  accountCode: string
  accountName: string
  debitBalance: number  // 借方残高
  creditBalance: number // 貸方残高
}
```

### 2. 損益計算書（Income Statement）

#### 計算式

```
収益合計
  - 費用合計
  = 当期純利益（損失）
```

#### 集計区分

- **収益の部**: 4000番台の科目
- **費用の部**: 5000番台の科目

### 3. 貸借対照表（Balance Sheet）

#### 貸借一致の原則

```
資産合計 = 負債合計 + 純資産合計
```

#### 表示区分

```
【資産の部】
  流動資産
    現金預金
    未収金
  固定資産
    什器備品

【負債の部】
  流動負債
    未払金
    前受金

【純資産の部】
  繰越利益剰余金
  当期純利益
```

---

## 補助元帳管理

### AuxiliaryService

**ファイル**: `src/domain/services/AuxiliaryService.ts`

### 1. 区分所有者別管理

#### データ構造

```typescript
interface UnitOwner {
  unitNumber: string   // 部屋番号
  ownerName: string    // 所有者名
  monthlyFee: number   // 月額管理費
  repairFund: number   // 月額修繕積立金
}
```

#### 管理費請求処理

```typescript
// 月次請求生成
createMonthlyBilling(billingDate: string) {
  for (const owner of unitOwners) {
    // 管理費請求仕訳
    createJournal({
      debit: "管理費未収金",
      credit: "管理費収入",
      amount: owner.monthlyFee,
      auxiliary: owner.unitNumber
    })
  
    // 修繕積立金請求仕訳
    createJournal({
      debit: "修繕積立金未収金",
      credit: "修繕積立金収入",
      amount: owner.repairFund,
      auxiliary: owner.unitNumber
    })
  }
}
```

### 2. 業者別管理

#### データ構造

```typescript
interface Vendor {
  vendorCode: string  // 業者コード
  vendorName: string  // 業者名
  category: string    // 業種
}
```

---

## 決算処理

### ClosingService

**ファイル**: `src/domain/services/ClosingService.ts`

### 決算仕訳の生成

#### 1. 収益・費用の振替

```typescript
// 収益の振替
借方: 各収益科目 XXX / 貸方: 損益 XXX

// 費用の振替
借方: 損益 XXX / 貸方: 各費用科目 XXX
```

#### 2. 当期純利益の振替

```typescript
// 利益の場合
借方: 損益 XXX / 貸方: 繰越利益剰余金 XXX

// 損失の場合
借方: 繰越利益剰余金 XXX / 貸方: 損益 XXX
```

---

## データ検証ルール

### 共通検証ルール

#### 1. 必須項目チェック

```typescript
interface RequiredFields {
  journal: {
    date: Required
    description: Required
    details: RequiredArray
  }
  
  account: {
    code: Required
    name: Required
    type: Required
    normalBalance: Required
  }
}
```

#### 2. 数値検証

```typescript
interface NumericValidation {
  amount: {
    min: 0
    max: 999999999
    decimal: 2
  }
  
  balance: {
    tolerance: 0.01
  }
}
```

#### 3. 日付検証

```typescript
interface DateValidation {
  format: "YYYY-MM-DD"
  range: {
    min: accountingPeriod.start
    max: accountingPeriod.end
  }
}
```

### エラーハンドリング

#### エラーレベル

1. **ERROR**: 処理を中断すべき重大なエラー
2. **WARNING**: 処理は継続可能だが注意が必要
3. **INFO**: 参考情報

#### エラーコード体系

```typescript
enum ErrorCode {
  // 1000番台: 勘定科目エラー
  ACCOUNT_NOT_FOUND = 1001,
  ACCOUNT_INACTIVE = 1002,
  
  // 2000番台: 仕訳エラー
  JOURNAL_UNBALANCED = 2001,
  JOURNAL_INVALID_DATE = 2002,
  
  // 3000番台: 検証エラー
  VALIDATION_REQUIRED = 3001,
  VALIDATION_FORMAT = 3002
}
```

---

## 部門別会計

### DivisionService

**ファイル**: `src/domain/services/DivisionService.ts`

### 部門コード

```typescript
enum DivisionCode {
  MANAGEMENT = "01",     // 管理会計
  REPAIR_FUND = "02",   // 修繕積立金会計
  PARKING = "03",       // 駐車場会計
  COMMON = "99"         // 共通
}
```

### 部門別仕訳ルール

- 各仕訳は必ず部門コードを持つ
- 部門間振替は相殺仕訳で処理
- 部門別に試算表を生成可能

---

## トランザクション管理

### TransactionService

**ファイル**: `src/domain/services/TransactionService.ts`

### Freee型トランザクション

```typescript
interface Transaction {
  id: string
  date: string
  type: "income" | "expense"
  amount: number
  accountCode: string
  counterparty: string
  description: string
  status: "unsettled" | "settled"
}
```

### 自動仕訳生成

```typescript
// トランザクションから仕訳を自動生成
generateJournal(transaction: Transaction): Journal {
  if (transaction.type === "income") {
    return {
      debit: "普通預金",
      credit: transaction.accountCode,
      amount: transaction.amount
    }
  } else {
    return {
      debit: transaction.accountCode,
      credit: "普通預金",
      amount: transaction.amount
    }
  }
}
```

---

## インポート/エクスポート

### ImportExportService

**ファイル**: `src/domain/services/ImportExportService.ts`

### サポート形式

1. **JSON形式**: システム間連携用
2. **CSV形式**: Excel連携用
3. **開始残高**: 期首残高の一括登録

### データ形式

```typescript
interface ExportFormat {
  version: string
  exported: string
  data: {
    accounts: Account[]
    journals: Journal[]
    divisions: Division[]
  }
}
```

---

## 今後の拡張予定

### Phase 7（計画中）

- [ ] 予算管理機能
- [ ] 前年同期比較
- [ ] キャッシュフロー計算書

### Phase 8（構想中）

- [ ] 電子帳簿保存法対応
- [ ] 監査ログ機能
- [ ] API連携強化

---

*このドキュメントは、システムの中核となるビジネスロジックを包括的に記述しています。*
*各機能の詳細な実装については、対応するソースコードを参照してください。*
