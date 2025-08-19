# Phase 7: ディレクトリ構造の最適化

実施日: 2025-08-19

## 実行内容

### 1. domain/servicesの再構成

#### 変更前
```
domain/services/
├── AccountService.ts
├── JournalService.ts
├── DivisionService.ts
├── ReportService.ts
├── ImportExportService.ts
├── AuxiliaryService.ts
├── SampleDataService.ts
├── ClosingService.ts
├── TransactionService.ts
├── JournalGenerationEngine.ts
├── BankAccountService.ts
└── ServiceFactory.ts
```

#### 変更後
```
domain/services/
├── core/                    # コアビジネスロジック
│   ├── AccountService.ts
│   ├── JournalService.ts
│   ├── DivisionService.ts
│   └── index.ts
├── ledger/                  # 補助元帳関連
│   ├── AuxiliaryService.ts
│   ├── BankAccountService.ts
│   └── index.ts
├── reporting/               # レポート・決算関連
│   ├── ReportService.ts
│   ├── ClosingService.ts
│   └── index.ts
├── transaction/             # 取引・仕訳生成関連
│   ├── TransactionService.ts
│   ├── JournalGenerationEngine.ts
│   └── index.ts
├── io/                      # インポート・エクスポート関連
│   ├── ImportExportService.ts
│   ├── SampleDataService.ts
│   └── index.ts
├── factory/                 # サービスファクトリー
│   ├── ServiceFactory.ts
│   └── index.ts
└── index.ts                 # 統合バレルエクスポート
```

### 2. stores/slicesの再構成

#### 変更前
```
stores/slices/
├── accountingSlice.ts
├── journalSlice.ts
├── journalSliceEnhanced.ts
├── unifiedJournalSlice.ts
├── transactionSlice.ts
├── transactionSliceEnhanced.ts
├── auxiliarySliceEnhanced.ts
├── bankAccountSlice.ts
└── uiSlice.ts
```

#### 変更後
```
stores/slices/
├── core/                    # コア状態管理
│   ├── accountingSlice.ts
│   └── index.ts
├── journal/                 # 仕訳関連状態
│   ├── journalSlice.ts
│   ├── journalSliceEnhanced.ts
│   ├── unifiedJournalSlice.ts
│   └── index.ts
├── transaction/             # 取引関連状態
│   ├── transactionSlice.ts
│   ├── transactionSliceEnhanced.ts
│   └── index.ts
├── auxiliary/               # 補助元帳関連状態
│   ├── auxiliarySliceEnhanced.ts
│   ├── bankAccountSlice.ts
│   └── index.ts
├── ui/                      # UI状態管理
│   ├── uiSlice.ts
│   └── index.ts
└── index.ts                 # 統合バレルエクスポート
```

## 実装詳細

### 1. ファイル移動とディレクトリ作成
- 各カテゴリ別のディレクトリを作成
- 関連ファイルを適切なサブディレクトリに移動
- 責務と機能によってファイルをグループ化

### 2. インポートパスの修正
- 相対パスを新しいディレクトリ構造に合わせて更新
  - `../../data/` → `../../../data/`
  - `../../types/` → `../../../types/`
  - `../../constants` → `../../../constants`
- サービス間の参照パスを更新
- Mockファイルのインポートパスを修正

### 3. バレルエクスポートの作成
- 各サブディレクトリにindex.tsを追加
- すべてのモジュールを再エクスポート
- ルートレベルのindex.tsから統合エクスポート

## 技術的な改善点

### 1. コードの組織化
- **関心の分離**: 機能別にファイルをグループ化
- **依存関係の明確化**: ディレクトリ構造が依存関係を反映
- **保守性の向上**: 関連ファイルが同じ場所に配置

### 2. インポートの簡略化
```typescript
// Before
import { AccountService } from '../services/AccountService'
import { JournalService } from '../services/JournalService'
import { DivisionService } from '../services/DivisionService'

// After
import { AccountService, JournalService, DivisionService } from '../services/core'
```

### 3. スケーラビリティ
- 新しいサービスの追加が容易
- カテゴリ別の拡張が可能
- チーム開発での責任範囲が明確

## 影響を受けたファイル

### domain関連
- AccountingEngine.ts: サービスインポートパスを更新
- ServiceFactory.ts: 新しいディレクトリ構造に対応
- 各サービスファイル: 相互参照パスを更新
- Mockファイル: テスト用インポートパスを修正

### stores関連
- useAccountingStore.ts: sliceインポートパスを更新
- 各sliceファイル: ドメインサービスへの参照を更新

## テスト結果
```
Test Files  3 passed (3)
Tests      19 passed | 4 skipped (23)
```

すべてのテストが正常に動作することを確認

## 今後の拡張ポイント

1. **APIレイヤーの追加**
   - services/api/ディレクトリを追加可能
   - 外部APIとの統合を管理

2. **バリデーションレイヤー**
   - services/validation/ディレクトリを追加可能
   - ビジネスルールの検証を集約

3. **イベントハンドリング**
   - services/events/ディレクトリを追加可能
   - ドメインイベントの管理

## まとめ
Phase 7では、プロジェクトの成長に備えた構造的な改善を実施しました。この再構成により、コードベースの理解しやすさ、保守性、拡張性が大幅に向上しました。