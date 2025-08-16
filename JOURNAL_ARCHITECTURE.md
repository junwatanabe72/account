# 仕訳システム アーキテクチャ設計書

## 1. 概要

本システムは、マンション管理組合の会計処理を支援する仕訳システムです。
管理会計（KANRI）、修繕会計（SHUZEN）、駐車場会計（PARKING）の3つの会計区分に対応し、
各種報告書（収支報告書、試算表、貸借対照表等）と連携して動作します。

## 2. データモデル

### 2.1 中核データ型

#### UnifiedJournal（統一仕訳モデル）
```typescript
interface UnifiedJournal {
  // 基本情報
  id: string                    // 一意識別子
  journalNumber: string          // 仕訳番号
  date: string                   // 取引日（YYYY-MM-DD）
  description: string            // 摘要
  division: Division             // 会計区分（KANRI/SHUZEN）
  status: JournalStatus          // ステータス（DRAFT/POSTED/CANCELLED）
  
  // 仕訳明細
  lines: JournalLine[]           // 仕訳明細行の配列
  
  // メタデータ
  tags?: string[]                // タグ（分類用）
  createdAt: string              // 作成日時
  updatedAt: string              // 更新日時
  createdBy?: string             // 作成者
  
  // 集計情報（自動計算）
  totalDebit: number             // 借方合計
  totalCredit: number            // 貸方合計
  isBalanced: boolean            // 貸借一致フラグ
}
```

#### JournalLine（仕訳明細行）
```typescript
interface JournalLine {
  id: string                     // 明細行ID
  accountCode: string            // 勘定科目コード
  accountName: string            // 勘定科目名
  debitAmount: number            // 借方金額
  creditAmount: number           // 貸方金額
  description?: string           // 明細摘要
  
  // 拡張フィールド（フェーズ2以降）
  serviceMonth?: string          // 対象月（管理費等）
  payerId?: string               // 支払者ID・部屋番号
  auxiliaryCode?: string         // 補助科目コード
}
```

### 2.2 ステータス管理

```typescript
type JournalStatus = 'DRAFT' | 'POSTED' | 'CANCELLED'
```

- **DRAFT**: 下書き（編集可能）
- **POSTED**: 転記済み（確定）
- **CANCELLED**: 取消済み

### 2.3 会計区分

```typescript
type Division = 'KANRI' | 'SHUZEN' | 'PARKING'
```

- **KANRI**: 管理会計（日常の管理費収支）
- **SHUZEN**: 修繕会計（修繕積立金・大規模修繕）
- **PARKING**: 駐車場会計（駐車場収支）※実装予定

## 3. システムアーキテクチャ

### 3.1 レイヤー構成

```
┌─────────────────────────────────────────────┐
│         UI Layer (React Components)          │
│  - UnifiedJournalForm                        │
│  - FreeeStyleJournalForm                     │
│  - JournalManagementPanel                    │
└─────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────┐
│      State Management (Zustand Store)        │
│  - unifiedJournalSlice                       │
│  - journalSlice                              │
│  - accountingSlice                           │
└─────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────┐
│        Service Layer (Business Logic)        │
│  - JournalService                            │
│  - AccountingEngine                          │
└─────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────┐
│           Data Layer (Storage)               │
│  - LocalStorage (persist)                    │
│  - IndexedDB (将来実装)                      │
└─────────────────────────────────────────────┘
```

### 3.2 データフロー

```
1. ユーザー入力
   ↓
2. UIコンポーネント（フォーム）
   ↓
3. バリデーション（JournalService）
   ↓
4. Zustandストア更新
   ↓
5. AccountingEngine反映
   ↓
6. 各種報告書へ自動反映
```

## 4. 報告書との連携

### 4.1 収支報告書（IncomeExpenseReport）

#### データ取得フロー
```typescript
// AccountingEngineから会計区分別にデータを取得
engine.getIncomeDetailSummary(startDate, endDate, division)
engine.getExpenseDetailSummary(startDate, endDate, division)
```

#### 連携ポイント
- 仕訳の`division`フィールドで会計区分を判定
- `date`フィールドで期間集計
- 勘定科目コードでグループ化して集計

### 4.2 試算表（TrialBalance）

#### データ取得フロー
```typescript
engine.getTrialBalance()
```

#### 連携ポイント
- 全仕訳の借方・貸方を勘定科目別に集計
- 残高計算：前期繰越 + 当期借方 - 当期貸方

### 4.3 貸借対照表（BalanceSheet）

#### データ取得フロー
```typescript
engine.getBalanceSheet()
```

#### 連携ポイント
- 資産・負債・純資産の勘定科目を分類
- 期末残高を表示

## 5. 主要機能

### 5.1 仕訳入力

1. **基本入力**
   - 日付選択
   - 摘要入力
   - 会計区分選択（KANRI/SHUZEN）

2. **明細入力**
   - 勘定科目選択（階層型ドロップダウン）
   - 借方・貸方金額入力
   - 複数明細行対応

3. **バリデーション**
   - 貸借一致チェック
   - 必須項目チェック
   - 金額妥当性チェック

### 5.2 仕訳管理

1. **一覧表示**
   - フィルタリング（期間、区分、ステータス）
   - ソート機能
   - ページネーション

2. **編集・削除**
   - DRAFTステータスのみ編集可能
   - 削除時は論理削除（CANCELLED）

3. **転記処理**
   - DRAFT → POSTED への状態遷移
   - 転記後は編集不可

## 6. 実装状況

### 6.1 完了済み

- ✅ UnifiedJournalデータモデル定義
- ✅ JournalServiceの基本実装
- ✅ Zustandストア統合
- ✅ 基本的な仕訳入力フォーム
- ✅ AccountingEngineとの連携

### 6.2 実装中

- 🔄 division選択機能の完全実装
- 🔄 トースト通知の統合
- 🔄 仕訳一覧画面の改善

### 6.3 今後の実装予定

- ⏳ 補助科目対応
- ⏳ 承認ワークフロー
- ⏳ エクスポート機能（CSV/PDF）
- ⏳ 一括インポート機能
- ⏳ 監査ログ

## 7. 技術スタック

- **フロントエンド**: React + TypeScript
- **状態管理**: Zustand
- **スタイリング**: CSS Modules + Bootstrap
- **ビルドツール**: Vite
- **永続化**: LocalStorage（Zustand persist）

## 8. 注意事項

### 8.1 データ整合性

- 仕訳の貸借は必ず一致させる
- 転記済み仕訳は編集不可
- 削除は論理削除のみ

### 8.2 パフォーマンス

- 大量データ時はページネーション使用
- 集計処理はメモ化で最適化
- 不要な再レンダリング防止

### 8.3 セキュリティ

- 入力値の適切なサニタイズ
- XSS対策
- 権限管理（将来実装）

## 9. トラブルシューティング

### 問題: divisionが報告書に反映されない

**原因**: 仕訳作成時にdivisionフィールドが正しく設定されていない

**解決策**: 
1. JournalService.createJournal()でdivisionを確実に設定
2. AccountingEngineへの登録時にdivisionを渡す
3. 報告書でdivisionフィルタを適用

### 問題: トースト通知が表示されない

**原因**: UIスライスのtoastMessage更新が反映されていない

**解決策**:
1. setToastMessageアクションを適切に呼び出す
2. Toastコンポーネントがストアを監視していることを確認

## 10. 参考資料

- [Zustand公式ドキュメント](https://github.com/pmndrs/zustand)
- [React Hook Form](https://react-hook-form.com/)
- [会計基準・勘定科目体系](./src/data/static/accounts.json)