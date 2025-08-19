# Phase 7: ディレクトリ構造改善 実装計画

*作成日: 2025-08-19*

## 実装オプション

### オプション A: 完全実装（推奨）
domain/servicesとstores/slicesの両方を再構成

### オプション B: 段階実装
Phase 7-1でdomain/servicesのみ、Phase 7-2でstores/slices

### オプション C: 最小実装
最も混雑しているdomain/servicesのみ再構成

---

## domain/services 詳細マッピング

### Core（コア会計機能）
```typescript
// services/core/index.ts
export { AccountService } from './AccountService'
export { JournalService } from './JournalService'
export { DivisionService } from './DivisionService'
export type { IAccountService } from '../../interfaces/IAccountService'
export type { IJournalService } from '../../interfaces/IJournalService'
export type { IDivisionService } from '../../interfaces/IDivisionService'
```

**影響範囲**:
- ServiceFactory.ts（3箇所）
- AccountingEngine.ts（3箇所）
- 各サービス間の依存（約15箇所）

### Ledger（補助元帳）
```typescript
// services/ledger/index.ts
export { AuxiliaryService } from './AuxiliaryService'
export { BankAccountService } from './BankAccountService'
```

**影響範囲**:
- ServiceFactory.ts（2箇所）
- TransactionService.ts（1箇所）
- stores/slices/bankAccountSlice.ts（1箇所）

### Reporting（レポート）
```typescript
// services/reporting/index.ts
export { ReportService } from './ReportService'
export { ClosingService } from './ClosingService'
```

**影響範囲**:
- ServiceFactory.ts（2箇所）
- AccountingEngine.ts（2箇所）

### Transaction（取引管理）
```typescript
// services/transaction/index.ts
export { TransactionService } from './TransactionService'
export { JournalGenerationEngine } from './JournalGenerationEngine'
```

**影響範囲**:
- ServiceFactory.ts（2箇所）
- AccountingEngine.ts（2箇所）

### IO（入出力）
```typescript
// services/io/index.ts
export { ImportExportService } from './ImportExportService'
export { SampleDataService } from './SampleDataService'
```

**影響範囲**:
- ServiceFactory.ts（2箇所）
- AccountingEngine.ts（2箇所）

### Factory（DI）
```typescript
// services/factory/index.ts
export { ServiceFactory, ServiceContainer } from './ServiceFactory'
```

**影響範囲**:
- AccountingEngine.ts（1箇所）

---

## stores/slices 詳細マッピング

### Core（エンジン管理）
```typescript
// slices/core/index.ts
export { createAccountingSlice } from './accountingSlice'
export type { AccountingSlice } from './accountingSlice'
```

### Journal（仕訳管理）
```typescript
// slices/journal/index.ts
export { createJournalSlice } from './journalSlice'
export { createJournalSliceEnhanced } from './journalSliceEnhanced'
export { createUnifiedJournalSlice } from './unifiedJournalSlice'
```

### Transaction（取引管理）
```typescript
// slices/transaction/index.ts
export { createTransactionSlice } from './transactionSlice'
export { createTransactionSliceEnhanced } from './transactionSliceEnhanced'
```

### Auxiliary（補助機能）
```typescript
// slices/auxiliary/index.ts
export { createAuxiliarySliceEnhanced } from './auxiliarySliceEnhanced'
export { createBankAccountSlice } from './bankAccountSlice'
```

### UI（UI状態）
```typescript
// slices/ui/index.ts
export { createUiSlice } from './uiSlice'
export type { UiSlice } from './uiSlice'
```

---

## 実装手順詳細

### Step 1: ディレクトリ作成（5分）
```bash
# domain/services
mkdir -p src/domain/services/{core,ledger,reporting,transaction,io,factory}

# stores/slices
mkdir -p src/stores/slices/{core,journal,transaction,auxiliary,ui}
```

### Step 2: ファイル移動（10分）
```bash
# Core services
mv src/domain/services/AccountService.ts src/domain/services/core/
mv src/domain/services/JournalService.ts src/domain/services/core/
mv src/domain/services/DivisionService.ts src/domain/services/core/

# Ledger services
mv src/domain/services/AuxiliaryService.ts src/domain/services/ledger/
mv src/domain/services/BankAccountService.ts src/domain/services/ledger/

# Reporting services
mv src/domain/services/ReportService.ts src/domain/services/reporting/
mv src/domain/services/ClosingService.ts src/domain/services/reporting/

# Transaction services
mv src/domain/services/TransactionService.ts src/domain/services/transaction/
mv src/domain/services/JournalGenerationEngine.ts src/domain/services/transaction/

# IO services
mv src/domain/services/ImportExportService.ts src/domain/services/io/
mv src/domain/services/SampleDataService.ts src/domain/services/io/

# Factory
mv src/domain/services/ServiceFactory.ts src/domain/services/factory/
```

### Step 3: バレルエクスポート作成（15分）
各ディレクトリにindex.tsを作成

### Step 4: インポートパス更新（30分）
- ServiceFactory.ts: 12箇所
- AccountingEngine.ts: 4箇所
- 各サービス間: 約20箇所
- stores/slices: 約5箇所

### Step 5: テスト実行（5分）
```bash
npm test
npm run dev
```

---

## リスク評価と対策

### リスク1: インポートパスの誤り
**対策**: TypeScriptコンパイラでエラーを即座に検出

### リスク2: Git履歴の断絶
**対策**: `git log --follow`でファイル履歴を追跡可能

### リスク3: IDEの混乱
**対策**: VSCode再起動、TypeScriptサーバー再起動

### リスク4: ビルドエラー
**対策**: 段階的な移動とテスト

---

## 期待される成果

### 定量的指標
- ディレクトリ内のファイル数: 最大12個 → 最大3個
- インポート文の簡素化: 約30%削減（バレルエクスポート）
- 新規ファイル追加時の迷い: 削減

### 定性的効果
- コードナビゲーションの改善
- チーム開発時の理解速度向上
- 機能別の責任分界点の明確化

---

## 実装判断基準

### 実装すべき場合
- [ ] チームメンバーが3名以上
- [ ] 今後6ヶ月以上の継続開発予定
- [ ] 新機能追加が月2回以上

### 現状維持すべき場合
- [ ] 単独開発
- [ ] 保守フェーズのみ
- [ ] 3ヶ月以内にリプレース予定

---

## 次のアクション

1. **意思決定**: どのオプションを選択するか
2. **バックアップ**: 現在のブランチをバックアップ
3. **実装**: 選択したオプションを実行
4. **検証**: テストとアプリケーション動作確認
5. **文書化**: 変更内容をREADMEに記載

---

*推定作業時間: 1-2時間*
*推奨実施時期: 他の大きな変更がない時*