# マンション管理組合会計システム

マンション管理組合向けの複式簿記会計システムです。取引入力から財務諸表の作成まで、一連の会計業務をサポートします。

## ディレクトリ構造

```
src/
├── components/          # 共有コンポーネント
├── constants/          # 定数定義
│   └── index.ts        # 定数エクスポート
├── constants.ts        # レガシー定数定義
├── data/              # データファイル
│   ├── accountMaster.csv       # 勘定科目マスタ（CSV）
│   ├── accountMaster.json      # 勘定科目マスタ（JSON）
│   ├── accountMaster_utf8.csv  # 勘定科目マスタ（UTF-8）
│   └── defaultAccounts.ts      # デフォルト勘定科目設定
├── domain/            # ビジネスロジック層
│   ├── accountingEngine.ts    # 会計エンジン
│   └── services/              # ドメインサービス
├── services/          # アプリケーションサービス
│   └── llmClient.ts  # LLM連携クライアント
├── types/             # 型定義
│   ├── index.ts              # 型定義エクスポート
│   ├── accounting.ts         # 会計関連型
│   ├── accountingDivision.ts # 部門会計型
│   ├── journalPattern.ts     # 仕訳パターン型
│   ├── master.ts            # マスタデータ型
│   ├── terminology.ts       # 用語定義
│   ├── transaction.ts       # 取引関連型
│   └── ui.ts               # UI関連型
├── types.ts           # レガシー型定義
├── ui/               # UIコンポーネント
│   ├── app/          # アプリケーションルート
│   │   ├── App.tsx
│   │   └── AppWithSidebar.tsx
│   ├── transactions/ # 取引・仕訳入力
│   ├── ledgers/      # 帳簿表示
│   ├── statements/   # 財務諸表
│   ├── masters/      # マスタ管理
│   ├── data-management/ # データ管理
│   ├── settings/     # 設定・その他
│   ├── common/       # 共通コンポーネント
│   ├── hooks/        # React Hooks
│   │   └── useAccountingData.ts
│   └── styles/       # スタイルシート
│       ├── commonStyles.ts    # 共通スタイル
│       ├── data-display.css   # データ表示用CSS
│       ├── forms.css         # フォーム用CSS
│       ├── responsive.css    # レスポンシブCSS
│       ├── tabs.css          # タブ用CSS
│       └── theme.css         # テーマCSS
├── utils/            # ユーティリティ関数
│   ├── errorHandler.ts  # エラーハンドリング
│   └── fileParser.ts    # ファイルパース処理
├── main.tsx          # エントリーポイント
└── vite-env.d.ts     # Vite環境型定義
```

## 主要コンポーネント

### UIコンポーネント (/ui)

#### app/ - アプリケーションルート
- `App.tsx` - メインアプリケーション
- `AppWithSidebar.tsx` - サイドバー付きレイアウト

#### transactions/ - 取引・仕訳入力
- `TransactionInputForm.tsx` - freee式取引入力フォーム
- `TransactionForm.tsx` - 標準取引入力フォーム
- `JournalForm.tsx` - 仕訳入力フォーム
- `ImprovedJournalForm.tsx` - 改良版仕訳入力フォーム
- `BankImportWizard.tsx` - 銀行データインポートウィザード
- `LLMJournalProcessor.tsx` - AI仕訳処理
- `JournalEditModal.tsx` - 仕訳編集モーダル
- `JournalFilterBar.tsx` - 仕訳フィルターバー
- `JournalConfirmation.tsx` - 仕訳確認画面

#### ledgers/ - 帳票表示
- `LedgerView.tsx` - 総勘定元帳ビュー
- `ImprovedLedgerView.tsx` - 改良版総勘定元帳
- `AuxiliaryLedgerView.tsx` - 補助元帳ビュー
- `TrialBalanceView.tsx` - 試算表ビュー

#### statements/ - 財務諸表
- `BalanceSheetView.tsx` - 貸借対照表
- `IncomeStatementView.tsx` - 損益計算書
- `IncomeExpenseReport.tsx` - 収支報告書
- `IncomeDetailView.tsx` - 収入明細表
- `ExpenseDetailView.tsx` - 支出明細表
- `DivisionStatementsPanel.tsx` - 部門別財務諸表

#### masters/ - マスタ管理
- `ChartOfAccountsPanel.tsx` - 勘定科目一覧
- `DivisionAccountingView.tsx` - 部門別会計ビュー
- `ClosingPanel.tsx` - 決算処理パネル
- `UnitOwnersEditor.tsx` - 組合員管理

#### data-management/ - データ管理
- `JsonImport.tsx` - JSONデータインポート
- `ExportPanel.tsx` - データエクスポート
- `FileUploader.tsx` - ファイルアップロード
- `LocalStoragePanel.tsx` - ローカルストレージ管理
- `SampleDataPanel.tsx` - サンプルデータ管理

#### settings/ - 設定・その他
- `SettingsPanel.tsx` - 設定パネル
- `PrintPanel.tsx` - 印刷パネル
- `JsonSpecView.tsx` - JSON仕様ビュー
- `ManualView.tsx` - マニュアル表示

#### common/ - 共通UI部品
- `ConfirmDialog.tsx` - 確認ダイアログ
- `Toast.tsx` - トースト通知

### ドメインサービス (/domain/services)

#### コアサービス
- `AccountService.ts` - 勘定科目管理
- `JournalService.ts` - 仕訳管理

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

## アーキテクチャ

- **ドメイン駆動設計**: ビジネスロジックを `domain/` に集約
- **サービス層**: アプリケーションロジックを `services/` で管理
- **型安全性**: TypeScriptによる厳密な型定義

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

## 開発環境

- Node.js 18以上
- npm 9以上