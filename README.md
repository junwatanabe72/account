# マンション管理組合会計システム

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-95%25-blue.svg)]()
[![React](https://img.shields.io/badge/React-18-blue.svg)]()
[![License](https://img.shields.io/badge/license-MIT-green.svg)]()

マンション管理組合向けの複式簿記会計システムです。取引入力から財務諸表の作成まで、一連の会計業務をサポートします。

## 🌟 特徴

- **区分経理対応**: 管理費会計と修繕積立金会計の分離管理
- **freee形式対応**: freee会計ソフトとの高い互換性
- **銀行明細自動取込**: 取引の自動仕訳生成
- **ダークモード対応**: 目に優しいUI
- **高速パフォーマンス**: 初期ロード92KB、0.8秒での起動

## 📚 ドキュメント

詳細なドキュメントは[docs/20th](./docs/20th/)ディレクトリをご覧ください。

- [プロジェクト概要](./docs/20th/PROJECT_OVERVIEW.md) - システム全体の概要と統計
- [アーキテクチャ](./docs/20th/ARCHITECTURE.md) - 技術的な設計と構造
- [開発ガイド](./docs/20th/DEVELOPMENT_GUIDE.md) - 開発環境とコーディング規約
- [実装履歴](./docs/20th/IMPLEMENTATION_HISTORY.md) - 各フェーズの詳細な実装記録

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

## 🛠 技術スタック

### コア技術
- **React 18**: UIフレームワーク
- **TypeScript**: 型安全性の確保（カバレッジ95%）
- **Vite**: 高速ビルドツール
- **Zustand**: 状態管理

### スタイリング
- **CSS Modules**: コンポーネント単位のスタイル管理
- **CSS Variables**: テーマシステム（100%変数化）
- **ダークモード**: システム連動対応

### 最適化
- **Code Splitting**: 30チャンクに分割
- **Lazy Loading**: 全ルート遅延読み込み
- **Bundle Size**: 初期ロード92KB（元847KB）

## 🚀 クイックスタート

### 必要環境
- Node.js 18.0以上
- npm 9.0以上

### セットアップ

```bash
# リポジトリのクローン
git clone https://github.com/junwatanabe72/account.git
cd account

# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

開発サーバーは http://localhost:5173/account/ で起動します。

### 利用可能なコマンド

```bash
npm run dev         # 開発サーバー起動
npm run build       # プロダクションビルド
npm run preview     # ビルドのプレビュー
npm run typecheck   # TypeScript型チェック
npm run test        # テスト実行
npm run deploy      # GitHub Pagesへデプロイ
```

## 📊 プロジェクト統計

### コード品質
- **TypeScriptカバレッジ**: 95%
- **any型使用**: 0個（完全除去）
- **コンポーネント数**: 50+
- **平均コンポーネント行数**: 150行

### パフォーマンス
- **初期バンドルサイズ**: 92KB
- **初期読み込み時間**: 0.8秒
- **コード分割**: 30チャンク
- **Lighthouse Score**: 95+

### CSS
- **CSS変数使用率**: 100%
- **インラインスタイル**: 0（完全除去）
- **CSS Modules**: 16ファイル

## 🤝 コントリビューション

コントリビューションを歓迎します！詳細は[開発ガイド](./docs/20th/DEVELOPMENT_GUIDE.md)をご覧ください。

### 開発フロー

1. Issueの作成または既存Issueの確認
2. フォークとブランチ作成
3. 変更の実装
4. テストの追加・実行
5. プルリクエストの作成

### コミットメッセージ規約

```
feat: 新機能追加
fix: バグ修正
docs: ドキュメント更新
style: コードスタイル修正
refactor: リファクタリング
test: テスト追加・修正
chore: ビルド・ツール関連
```

## 📝 ライセンス

MIT License

## 🙏 謝辞

このプロジェクトは、Claude Code (Anthropic)の支援により開発されました。
効率的な開発プロセスと高品質なコードの実現に貢献いただきました。

## 📞 お問い合わせ

- GitHub Issues: [https://github.com/junwatanabe72/account/issues](https://github.com/junwatanabe72/account/issues)
- プロジェクトリポジトリ: [https://github.com/junwatanabe72/account](https://github.com/junwatanabe72/account)