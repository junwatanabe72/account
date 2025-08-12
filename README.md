# マンション管理組合会計システム

マンション管理組合向けの複式簿記会計システムです。取引入力から財務諸表の作成まで、一連の会計業務をサポートします。

## ディレクトリ構造

```
src/
├── components/          # 共有コンポーネント
├── config/             # 設定ファイル
│   └── featureFlags.ts # 機能フラグ管理
├── constants/          # 定数定義
├── data/              # データファイル
│   ├── accountMaster.csv/json  # 勘定科目マスタ
│   └── defaultAccounts.ts      # デフォルト勘定科目設定
├── domain/            # ビジネスロジック層
│   ├── accountingEngine.ts    # 会計エンジン（V1）
│   ├── AccountingEngineV2.ts  # 会計エンジン（V2）
│   └── services/              # ドメインサービス
├── services/          # アプリケーションサービス
│   └── llmClient.ts  # LLM連携クライアント
├── types/             # 型定義
├── ui/               # UIコンポーネント
│   ├── hooks/        # React Hooks
│   └── styles/       # スタイルシート
├── utils/            # ユーティリティ関数
└── main.tsx          # エントリーポイント
```

## 主要コンポーネント

### UIコンポーネント (/ui)

#### アプリケーション
- `App.tsx` - メインアプリケーション（V1）
- `AppV2.tsx` - 新実装版アプリケーション（V2）
- `AppWithSidebar.tsx` - サイドバー付きレイアウト

#### 取引・仕訳入力
- `TransactionInputForm.tsx` - freee式取引入力フォーム
- `TransactionForm.tsx` - 標準取引入力フォーム
- `JournalForm.tsx` - 仕訳入力フォーム
- `ImprovedJournalForm.tsx` - 改良版仕訳入力フォーム
- `BankImportWizard.tsx` - 銀行データインポートウィザード
- `LLMJournalProcessor.tsx` - AI仕訳処理

#### 帳票表示
- `LedgerView.tsx` - 総勘定元帳ビュー
- `ImprovedLedgerView.tsx` - 改良版総勘定元帳
- `AuxiliaryLedgerView.tsx` - 補助元帳ビュー
- `TrialBalanceView.tsx` - 試算表ビュー

#### 財務諸表
- `BalanceSheetView.tsx` - 貸借対照表
- `IncomeStatementView.tsx` - 損益計算書
- `IncomeExpenseReport.tsx` - 収支報告書
- `IncomeDetailView.tsx` - 収入明細表
- `ExpenseDetailView.tsx` - 支出明細表

#### 管理機能
- `AccountMasterPanel.tsx` - 勘定科目マスタ管理
- `ChartOfAccountsPanel.tsx` - 勘定科目一覧
- `DivisionAccountingView.tsx` - 部門別会計ビュー
- `DivisionStatementsPanel.tsx` - 部門別財務諸表
- `ClosingPanel.tsx` - 決算処理パネル
- `UnitOwnersEditor.tsx` - 組合員管理

#### データ管理
- `JsonImport.tsx` - JSONデータインポート
- `ExportPanel.tsx` - データエクスポート
- `FileUploader.tsx` - ファイルアップロード
- `LocalStoragePanel.tsx` - ローカルストレージ管理
- `SampleDataPanel.tsx` - サンプルデータ管理

#### 設定・その他
- `SettingsPanel.tsx` - 設定パネル
- `PrintPanel.tsx` - 印刷パネル
- `JsonSpecView.tsx` - JSON仕様ビュー
- `ManualView.tsx` - マニュアル表示

#### 共通UI部品
- `ConfirmDialog.tsx` - 確認ダイアログ
- `Toast.tsx` - トースト通知
- `JournalEditModal.tsx` - 仕訳編集モーダル
- `JournalFilterBar.tsx` - 仕訳フィルターバー
- `JournalConfirmation.tsx` - 仕訳確認画面

### ドメインサービス (/domain/services)

#### コアサービス
- `AccountService.ts` - 勘定科目管理（V1）
- `AccountMasterService.ts` - 勘定科目マスタ管理（V2）
- `AccountServiceAdapter.ts` - 新旧サービスアダプター
- `JournalService.ts` - 仕訳管理（V1）
- `JournalEntryService.ts` - 仕訳エントリー管理（V2）

#### 取引処理
- `TransactionService.ts` - 取引管理
- `JournalGenerationEngine.ts` - 仕訳生成エンジン
- `JournalPatternService.ts` - 仕訳パターン管理
- `LLMJournalService.ts` - AI仕訳サービス

#### レポート・決算
- `ReportService.ts` - レポート生成
- `ClosingService.ts` - 決算処理
- `AuxiliaryService.ts` - 補助元帳管理
- `DivisionService.ts` - 部門別会計管理

#### データ管理
- `ImportExportService.ts` - インポート/エクスポート
- `SampleDataService.ts` - サンプルデータ管理

### 型定義 (/types)

- `index.ts` - 型定義エクスポート
- `accounting.ts` - 会計関連型定義
- `accountMaster.ts` - 勘定科目マスタ型
- `accountMasterTypes.ts` - 勘定科目型詳細
- `accountingDivision.ts` - 部門会計型
- `transaction.ts` - 取引関連型
- `journalPattern.ts` - 仕訳パターン型
- `master.ts` - マスタデータ型
- `terminology.ts` - 用語定義
- `ui.ts` - UI関連型

### ユーティリティ (/utils)

- `errorHandler.ts` - エラーハンドリング
- `fileParser.ts` - ファイルパース処理

## 主要機能

1. **取引入力**
   - freee式取引入力
   - 標準仕訳入力
   - 銀行データインポート
   - AI仕訳生成

2. **帳簿管理**
   - 総勘定元帳
   - 補助元帳
   - 仕訳帳

3. **財務諸表**
   - 貸借対照表
   - 損益計算書
   - 収支報告書
   - 試算表

4. **部門別会計**
   - 部門別仕訳
   - 部門別財務諸表

5. **マスタ管理**
   - 勘定科目マスタ
   - 組合員マスタ
   - 仕訳パターン

6. **決算処理**
   - 期末決算
   - 繰越処理

7. **データ管理**
   - インポート/エクスポート
   - バックアップ
   - サンプルデータ

## バージョン管理

- **V1**: 既存の安定版実装（accountingEngine.ts）
- **V2**: 新実装版（AccountingEngineV2.ts）
  - URLパラメータ `?v2=true` で切り替え可能
  - 段階的に機能を移行中

## 技術スタック

- React 18
- TypeScript
- Vite（ビルドツール）
- CSS（スタイリング）

## 起動方法

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# ビルド
npm run build
```

## 設定

`config/featureFlags.ts` で機能フラグを管理し、新機能の有効/無効を切り替えることができます。