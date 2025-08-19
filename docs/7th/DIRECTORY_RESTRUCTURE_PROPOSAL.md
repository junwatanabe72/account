# ディレクトリ構造改善提案

*作成日: 2025-08-19*

## 概要

現在フラットな構造のdomain/servicesとstores/slicesを、責務別にサブディレクトリに整理する提案です。

---

## 1. domain/services の再構成

### 現状（フラット構造）
```
domain/services/
├── AccountService.ts
├── AuxiliaryService.ts
├── BankAccountService.ts
├── ClosingService.ts
├── DivisionService.ts
├── ImportExportService.ts
├── JournalGenerationEngine.ts
├── JournalService.ts
├── ReportService.ts
├── SampleDataService.ts
├── ServiceFactory.ts
└── TransactionService.ts
```

### 提案（責務別ディレクトリ）
```
domain/services/
├── core/                    # コア会計機能
│   ├── AccountService.ts
│   ├── JournalService.ts
│   └── DivisionService.ts
│
├── ledger/                  # 補助元帳・補助機能
│   ├── AuxiliaryService.ts
│   └── BankAccountService.ts
│
├── reporting/               # レポート・分析
│   ├── ReportService.ts
│   └── ClosingService.ts
│
├── transaction/             # 取引管理
│   ├── TransactionService.ts
│   └── JournalGenerationEngine.ts
│
├── io/                      # データ入出力
│   ├── ImportExportService.ts
│   └── SampleDataService.ts
│
└── factory/                 # ファクトリー・DI
    └── ServiceFactory.ts
```

### 分類の根拠

| カテゴリ | サービス | 責務 |
|---------|---------|------|
| **core** | AccountService | 勘定科目の基本管理 |
| | JournalService | 仕訳の基本管理 |
| | DivisionService | 部門管理 |
| **ledger** | AuxiliaryService | 補助元帳（区分所有者・業者） |
| | BankAccountService | 銀行口座管理 |
| **reporting** | ReportService | 財務諸表生成 |
| | ClosingService | 決算処理 |
| **transaction** | TransactionService | Freee型取引管理 |
| | JournalGenerationEngine | 仕訳自動生成 |
| **io** | ImportExportService | データのI/O |
| | SampleDataService | サンプルデータ生成 |
| **factory** | ServiceFactory | DI管理 |

---

## 2. stores/slices の再構成

### 現状（フラット構造）
```
stores/slices/
├── accountingSlice.ts
├── auxiliarySliceEnhanced.ts
├── bankAccountSlice.ts
├── journalSlice.ts
├── journalSliceEnhanced.ts
├── transactionSlice.ts
├── transactionSliceEnhanced.ts
├── uiSlice.ts
└── unifiedJournalSlice.ts
```

### 提案（機能別ディレクトリ）
```
stores/slices/
├── core/                    # コアエンジン
│   └── accountingSlice.ts
│
├── journal/                 # 仕訳関連
│   ├── journalSlice.ts
│   ├── journalSliceEnhanced.ts
│   └── unifiedJournalSlice.ts
│
├── transaction/             # 取引関連
│   ├── transactionSlice.ts
│   └── transactionSliceEnhanced.ts
│
├── auxiliary/               # 補助機能
│   ├── auxiliarySliceEnhanced.ts
│   └── bankAccountSlice.ts
│
└── ui/                      # UI状態
    └── uiSlice.ts
```

### 分類の根拠

| カテゴリ | スライス | 管理する状態 |
|---------|----------|------------|
| **core** | accountingSlice | AccountingEngineインスタンス |
| **journal** | journalSlice | 基本仕訳UI状態 |
| | journalSliceEnhanced | 拡張仕訳機能 |
| | unifiedJournalSlice | 統合仕訳管理 |
| **transaction** | transactionSlice | 基本取引UI状態 |
| | transactionSliceEnhanced | 拡張取引機能 |
| **auxiliary** | auxiliarySliceEnhanced | 補助元帳UI状態 |
| | bankAccountSlice | 銀行口座UI状態 |
| **ui** | uiSlice | 共通UI状態（モーダル等） |

---

## 3. インポートパスの改善

### Before
```typescript
import { AccountService } from '../services/AccountService'
import { JournalService } from '../services/JournalService'
import { ReportService } from '../services/ReportService'
```

### After（バレルエクスポート使用）
```typescript
// services/core/index.ts
export * from './AccountService'
export * from './JournalService'
export * from './DivisionService'

// 使用側
import { AccountService, JournalService } from '../services/core'
```

---

## 4. 実装手順

### Phase 7-1: domain/services の再構成
1. サブディレクトリの作成
2. ファイルの移動
3. インポートパスの更新
4. バレルエクスポートの追加
5. テスト実行

### Phase 7-2: stores/slices の再構成
1. サブディレクトリの作成
2. ファイルの移動
3. インポートパスの更新
4. バレルエクスポートの追加
5. アプリケーション動作確認

---

## 5. メリットと考慮事項

### メリット
1. **可読性向上**: 関連ファイルがグループ化される
2. **スケーラビリティ**: 新規ファイル追加時の配置が明確
3. **保守性向上**: 責務が明確になる
4. **インポート簡素化**: バレルエクスポートによる簡潔な記述

### 考慮事項
1. **インポートパス変更**: 全ファイルでパス更新が必要
2. **Git履歴**: ファイル移動により履歴が見づらくなる可能性
3. **ビルド設定**: TypeScript設定の確認が必要

---

## 6. 代替案

### 代替案1: 機能別モジュール化
```
domain/
├── accounting/
│   ├── services/
│   ├── models/
│   └── interfaces/
├── reporting/
│   ├── services/
│   └── models/
└── transaction/
    ├── services/
    └── models/
```

### 代替案2: レイヤー別整理（現状維持）
現在の構造を維持し、ファイル名のプレフィックスで整理
- `core.AccountService.ts`
- `ledger.AuxiliaryService.ts`
- `report.ReportService.ts`

---

## 7. 移行スクリプト例

### ディレクトリ作成とファイル移動
```bash
#!/bin/bash

# domain/services の再構成
mkdir -p src/domain/services/{core,ledger,reporting,transaction,io,factory}

# ファイル移動
mv src/domain/services/AccountService.ts src/domain/services/core/
mv src/domain/services/JournalService.ts src/domain/services/core/
mv src/domain/services/DivisionService.ts src/domain/services/core/

mv src/domain/services/AuxiliaryService.ts src/domain/services/ledger/
mv src/domain/services/BankAccountService.ts src/domain/services/ledger/

# ... 他のファイルも同様

# インポートパス更新
find src -name "*.ts" -exec sed -i '' \
  -e "s|'../services/AccountService'|'../services/core/AccountService'|g" \
  -e "s|'./services/AccountService'|'./services/core/AccountService'|g" \
  {} \;
```

---

## まとめ

この再構成により、コードベースがより整理され、今後の拡張や保守が容易になります。特に：

1. **新規開発者**: どこに何があるか理解しやすい
2. **機能追加**: 適切な配置場所が明確
3. **リファクタリング**: 関連ファイルをまとめて変更可能

実装は段階的に行い、各ステップでテストを実行して安全性を確保します。