# 依存関係分析レポート

*作成日: 2025-01-18 16:00*  
*対象: src/domain/services/*

## 1. サービス間の依存関係マップ

### 依存関係一覧

| サービス | 依存先 |
|---------|--------|
| **AccountService** | なし |
| **JournalService** | AccountService, DivisionService |
| **DivisionService** | なし |
| **AuxiliaryService** | AccountService, JournalService ⚠️ |
| **TransactionService** | JournalService, AccountService, BankAccountService |
| **BankAccountService** | なし |
| **TransferService** | BankAccountService, TransactionService, JournalService |
| **ReportService** | AccountService, JournalService, DivisionService |
| **ImportExportService** | AccountService, JournalService, DivisionService, AuxiliaryService |
| **ClosingService** | AccountService, JournalService, DivisionService |
| **SampleDataService** | JournalService, AccountService, AuxiliaryService |
| **JournalPatternService** | JournalService, AccountService, AuxiliaryService |
| **LLMJournalService** | JournalPatternService, AccountService, AuxiliaryService, DivisionService |
| **JournalGenerationEngine** | AccountService |
| **AccountingServiceProvider** | AccountService, BankAccountService, TransactionService, TransferService, JournalService |

## 2. 循環依存の検出

### 🔴 直接的な循環依存

現在のコード分析では、直接的な循環依存は検出されませんでした。

### 🟡 潜在的な循環依存（間接的）

```
AuxiliaryService → JournalService → AccountService
     ↑                                      ↓
     ←──────────────────────────────────────
```

**問題点**:
- AuxiliaryServiceがJournalServiceに依存
- JournalServiceがAccountServiceに依存
- AuxiliaryServiceもAccountServiceに依存
- これにより三角形の依存関係が形成されている

## 3. 依存関係の深さ分析

### レベル0（依存なし）
- AccountService
- DivisionService
- BankAccountService

### レベル1（基本サービスのみに依存）
- JournalService (→ AccountService, DivisionService)
- JournalGenerationEngine (→ AccountService)

### レベル2（レベル1以下に依存）
- AuxiliaryService (→ AccountService, JournalService)
- TransactionService (→ JournalService, AccountService, BankAccountService)
- ReportService (→ AccountService, JournalService, DivisionService)
- ClosingService (→ AccountService, JournalService, DivisionService)
- SampleDataService (→ JournalService, AccountService, AuxiliaryService)
- JournalPatternService (→ JournalService, AccountService, AuxiliaryService)

### レベル3（レベル2以下に依存）
- TransferService (→ BankAccountService, TransactionService, JournalService)
- ImportExportService (→ AccountService, JournalService, DivisionService, AuxiliaryService)
- LLMJournalService (→ JournalPatternService, AccountService, AuxiliaryService, DivisionService)

### レベル4（複数レベルに依存）
- AccountingServiceProvider (→ AccountService, BankAccountService, TransactionService, TransferService, JournalService)

## 4. 問題のあるパターン

### 4.1 過度の依存集中
**AccountService** への依存が多すぎる（11サービスが依存）
- 変更の影響範囲が大きい
- 単一責任原則の違反の可能性

### 4.2 レイヤー違反
**AccountingServiceProvider** が多数のサービスに直接依存
- ファサードパターンとしては依存が多すぎる
- 抽象化が不足

### 4.3 相互依存のリスク
複数のサービスが互いに依存し合う複雑な構造
- テストが困難
- モジュール性の低下

## 5. 改善提案

### 優先度1: インタフェース導入
```typescript
// 現在
class JournalService {
  constructor(
    private accountService: AccountService,  // 具象クラス
    private divisionService: DivisionService // 具象クラス
  ) {}
}

// 改善後
interface IAccountService {
  getAccount(code: string): Account | undefined
  // 必要最小限のメソッドのみ
}

class JournalService {
  constructor(
    private accountService: IAccountService,  // インタフェース
    private divisionService: IDivisionService // インタフェース
  ) {}
}
```

### 優先度2: 依存関係の整理
1. **AuxiliaryService**
   - JournalServiceへの依存を削除または最小化
   - イベント駆動やコールバックパターンの検討

2. **TransactionService**
   - 3つのサービスへの依存を減らす
   - メディエーターパターンの導入検討

### 優先度3: レイヤー分離
```
Application Layer
  ├── AccountingServiceProvider (Facade)
  │
Domain Layer  
  ├── Core Services
  │   ├── AccountService
  │   ├── DivisionService
  │   └── BankAccountService
  │
  ├── Business Services
  │   ├── JournalService
  │   ├── TransactionService
  │   └── AuxiliaryService
  │
  └── Application Services
      ├── ReportService
      ├── ImportExportService
      └── LLMJournalService
```

## 6. アクションプラン

### Step 1: インタフェース定義（即座に実施）
- [ ] IAccountService インタフェース作成
- [ ] IJournalService インタフェース作成
- [ ] IDivisionService インタフェース作成

### Step 2: 依存性注入の準備（1日以内）
- [ ] 各サービスのコンストラクタを インタフェース受け取りに変更
- [ ] 既存コードとの互換性維持

### Step 3: 段階的な依存解消（1週間以内）
- [ ] AuxiliaryServiceのJournalService依存を解消
- [ ] TransactionServiceの依存を削減
- [ ] テストの追加と動作確認

---

*次回更新予定: インタフェース導入後*