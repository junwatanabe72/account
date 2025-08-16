# src 構成ガイド（責務と課題）

本ディレクトリは、会計アプリのフロントエンド実装とドメインロジックを含むワークスペースです。Vite + React + TypeScript + Zustand を中心に構成されています。

## 全体像（データフロー）
- UI: 画面・入出力を担当（フォーム、一覧、レポート表示）。
- Store: グローバル状態（Zustand）と UI/ドメイン連携のアクションを管理。
- Domain: 会計ルール・仕訳・レポート作成など純粋なビジネスロジック。
- Data/Services/Utils: マスタ・外部連携・共通処理。
- 典型フロー: UI → Store のアクション → Domain/Service 呼び出し → Store 更新 → UI 反映。

## ディレクトリ別の責務

### ui/
- app/: ルートコンテナ（`App.tsx`、`AppWithSidebar.tsx`）。
- common/: 共通 UI（モーダル、トースト等）。
- transactions/: 取引/仕訳入力 UI（`TransactionInputForm.tsx`、`JournalForm.tsx`、Freee 風フォーム等）。
- journals/: 仕訳管理パネル（作成/編集/承認/記帳など）。
- ledgers/: 元帳・補助元帳・試算表（`LedgerView.tsx`、`TrialBalanceView.tsx` など）。
- statements/: 財務諸表・各種集計（損益計算書、貸借対照表、部門別集計）。
- masters/: マスタ管理（勘定科目、口座、区分、期末処理など）。
- settings/: 設定/印刷/仕様確認ビュー。
- data-management/: サンプルデータ、インポート/エクスポート、ローカルストレージ管理。
- hooks/: UI 層用のフック（例: `useAccountingData.ts`）。
- styles/: CSS / CSS Modules / 共通スタイル。

### stores/
- Zustand によるグローバル状態。`index.ts` がストア生成のエントリ。
- slices/: 関心ごと別の状態・アクション（`accountingSlice.ts`、`journalSlice*.ts`、`transactionSlice*.ts` 等）。
- types/: ストア構造とアクション型（`StoreState` など）。
- hooks/: ストア関連のカスタムフック（例: `useBankAccounts.ts`）。
- 役割: UI からのイベントを受け、Domain/Service を呼び出し、結果を状態に反映。派生セレクタ（試算表など）もここで定義。

### domain/
- `accountingEngine.ts`: ドメインのファサード/オーケストレーター。各 Service を組み合わせて会計機能を提供。
- services/: ビジネスロジックの分割モジュール。
  - AccountService: 勘定科目・階層・補助科目生成/再構築。
  - DivisionService: 会計区分（部門）の初期化と取得。
  - JournalService: 仕訳の作成/更新/承認/記帳・バリデーション。
  - ReportService: 試算表/PL/BS/部門別集計の生成。
  - ImportExportService: JSON 取込/エクスポート、期首残高の生成。
  - AuxiliaryService: 区分横断の補助台帳・ユニットオーナー/取引先管理。
  - ClosingService: 期末・振替仕訳の生成。
  - TransactionService: Freee 風取引の生成/検索/精算、相手先/テンプレート管理。
  - JournalGenerationEngine: 取引から仕訳への自動起票ロジック。
  - SampleDataService: デモ/検証用データ投入。
  - AccountingServiceProvider: 将来の依存注入/構成ポイント（サービス提供者）。

### data/
- マスタ/サンプル等の静的データ（CSV/JSON/TS）。
- static/: TypeScript でのマスタ定義（`accountMaster.ts`、`accountingRules.ts`、`divisions.ts`）。
- `bankAccounts.ts`、`defaultAccounts.ts` などの初期データ。

### services/
- `llmClient.ts`: LLM 連携クライアント。`VITE_LLM_PROVIDER` などの環境変数でプロバイダ切替（mock/openai/anthropic/azure）。

### utils/
- 共通ユーティリティ。`fileParser.ts` は CSV/TSV/Excel/テキストの解析、エンコーディング判定、簡易構造化を提供。`errorHandler.ts` はエラー共通処理（想定）。

### types/
- ドメイン/画面の型定義（`accounting.ts`、`transaction.ts`、`journalPattern.ts`、`ui.ts`、`master.ts` 等）。
- `index.ts` は型の再エクスポートのエントリ。

### constants/ と ルート直下の `constants.ts`
- アプリ共通の定数群。UI/会計/エラーメッセージ/日付フォーマット/エクスポート設定など。

### ルート直下の主要ファイル
- `main.tsx`: エントリーポイント。アプリのマウントと初期化を行う。
- `types.ts`: 旧来型の一括定義（新しい `types/` への移行を検討）。
- `vite-env.d.ts`: Vite の型定義。

## 開発時の指針
- ドメインロジックは `domain/` の Service/Engine に集約。UI からは Store 経由で呼び出す。
- 状態は `stores/` の slice に分割。副作用も slice で扱い、UI は薄く保つ。
- 型は `types/` に集約し、UI/Domain/Store で共有する（循環参照を避ける）。
- 定数は `constants/` に集約し、用途別に名前空間を分ける。
- データ（マスタ/サンプル）は `data/` に置き、形式の混在を避ける（TS/JSON/CSV のいずれかを正に）。

## 既知の課題（要整理/対応方針）
- 型の重複/不整合:
  - `types/index.ts` が `accountMasterTypes` を再エクスポートしていますが該当ファイルが存在しません。`master.ts` に合わせて修正が必要。
  - `types/transaction.ts` と `types/transaction 2.ts` が重複。差分を精査し統合、片方を削除/移設する。
  - ルートの `types.ts` と `types/` 配下の定義が重複。参照元を棚卸しし、`types/` 側へ一本化。
- 定数の二重管理:
  - ルートの `constants.ts` と `constants/index.ts` に同種の定数（JOURNAL_STATUS、DIVISION_CODES 等）が重複。`constants/` に集約し、重複は削除。命名/粒度も統一する。
- Slice の重複/並存:
  - `journalSlice` と `journalSliceEnhanced`、`transactionSlice` と `transactionSliceEnhanced` が同居。`stores/index.ts` で双方を結合しており状態の出所が曖昧。どちらを正とするかポリシーを決め、API 互換性を確認の上で統合/段階的移行を行う。
- UI 実装の重複:
  - `LedgerView` と `ImprovedLedgerView`、`JournalForm` と `ImprovedJournalForm`/`FreeeStyleJournalForm` などバリエーションが混在。UX/要件に合わせた正統実装を選定し、残りは `experimental/` 等へ隔離または削除。
- データ形式の混在:
  - 勘定科目マスタが CSV/JSON/TS（`accountMaster.csv`、`accountMaster_utf8.csv`、`accountMaster.json`、`static/accountMaster.ts`）で共存。正とする形式を決め、他形式は生成物にする（例: TS を正→ JSON/CSV は Export 機能で生成）。
- LLM 連携の整備:
  - `llmClient.ts` のプロバイダ切替・エラー処理・タイムアウトは実装済。UI からの利用箇所（例: `LLMJournalProcessor.tsx`）での検証/フォールバック（モック動作）の明示と、プロダクション無効化フラグの導入を検討。
- パフォーマンス/再計算:
  - 試算表/PL/BS セレクタや `accountingEngine` 呼び出しの再計算コストの把握。必要に応じメモ化/スナップショット化を導入。
- 永続化戦略:
  - Zustand `persist` の `partialize` で UI 設定のみを保存中。業務要件に応じて、仕訳/取引/マスタの保存方針を定義（サイズ・復元・マイグレーションを考慮）。
- テスト不足:
  - `domain/services` と `utils/fileParser.ts` はユニットテスト対象。`tests/` 配下に `*.spec.ts` を追加し、ドメインのクリティカルパス（仕訳作成/記帳/レポート計算）で ≥80% カバレッジを目標にする。

## 今後のリファクタリング優先度（提案）
1) 定数/型の一本化（重複解消とエクスポート整理）
2) Slice の正統化（Enhanced 系に寄せるかを判断し統合）
3) UI コンポーネントの選定と不要版の隔離/削除
4) マスタデータ形式の正規化（TS or JSON へ）
5) ドメインサービスのユニットテスト整備

---
補足や用語定義の追記、運用ポリシー確定（永続化/エクスポート仕様/LLM ガード等）をご希望であれば、追って詳細化します。
