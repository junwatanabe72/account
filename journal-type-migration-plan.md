# 仕訳データ型の移行計画

## 1. データ型の比較

### 現在のデータ型（複式簿記型）
```typescript
// 仕訳明細（複式簿記の各行）
interface JournalDetail {
  accountCode: string      // 勘定科目コード
  debitAmount: number      // 借方金額
  creditAmount: number     // 貸方金額
  description?: string     // 明細説明
  auxiliaryCode?: string   // 補助科目コード
}

// 仕訳データ
interface JournalData {
  date: string           // 日付
  description: string    // 摘要
  reference?: string     // 参照番号
  details: JournalDetail[] // 明細行（複数行）
}
```

### Freeeのデータ型（取引型）
```typescript
// 取引データ（ユーザー入力）
interface Transaction {
  type: 'income' | 'expense' | 'transfer'  // 取引種別
  occurredOn: Date                          // 発生日
  accountTitle: string                      // 勘定科目
  amountTaxIncl: number                     // 金額（税込）
  status: 'unpaid' | 'paid'                 // 決済ステータス
  counterpartyId?: string                   // 取引先ID
  dueOn?: Date                              // 決済期日
  tags?: string[]                           // タグ
  note?: string                             // 備考
}

// 仕訳（自動生成される複式簿記データ）
interface JournalEntry {
  date: Date
  debitAccount: string
  creditAccount: string
  amount: number
  taxCategory?: string
}
```

## 2. 主な違い

### 概念的な違い
| 項目 | 現在のシステム | Freee型 |
|------|--------------|---------|
| 入力単位 | 仕訳（複式簿記） | 取引（ビジネス実態） |
| ユーザー知識 | 借方・貸方の理解が必要 | 収入・支出の理解のみ |
| 仕訳生成 | ユーザーが直接入力 | システムが自動生成 |
| 複雑な仕訳 | 直接入力可能 | ルールエンジンで対応 |

### データ構造の違い
1. **取引タイプの追加**
   - 現在：なし（すべて仕訳として扱う）
   - Freee：income/expense/transfer で分類

2. **決済ステータス**
   - 現在：なし（仕訳で表現）
   - Freee：unpaid/paid で管理

3. **取引先・期日管理**
   - 現在：補助元帳で部分的に管理
   - Freee：取引レベルで直接管理

## 3. 影響を受ける主要コンポーネント

### フロントエンド
1. **JournalForm.tsx** - 完全な再設計が必要
   - 借方・貸方入力 → 取引タイプ・金額入力へ
   - 仕訳プレビュー機能の追加

2. **JournalEditModal.tsx** - 取引編集UIへ変更

3. **JournalFilterBar.tsx** - フィルタ条件の追加
   - 取引タイプ、決済ステータスでのフィルタ

4. **LedgerView.tsx** - 表示ロジックの調整

5. **新規作成が必要**
   - TransactionForm.tsx（取引入力フォーム）
   - JournalPreview.tsx（仕訳プレビュー）

### バックエンド（ドメイン層）
1. **JournalService.ts** - 大幅な変更
   - createJournal → createTransaction
   - 仕訳生成エンジンの追加

2. **AccountingEngine.ts** - APIの変更

3. **新規作成が必要**
   - TransactionService.ts（取引管理）
   - JournalGenerationEngine.ts（仕訳生成ルール）
   - CounterpartyService.ts（取引先管理）

### データ層
1. **types/accounting.ts** - 型定義の追加
2. **ImportExportService.ts** - インポート/エクスポートロジックの変更

## 4. 段階的移行計画

### Phase 1: 基盤整備（互換性維持）
1. 新しい型定義の追加（既存と並行）
2. 取引→仕訳変換エンジンの実装
3. 既存の仕訳データを取引データとして扱うアダプタ層

### Phase 2: UI層の段階的移行
1. 新しい取引入力フォームの追加（既存フォームと並行）
2. 仕訳プレビュー機能の実装
3. フィルタ・一覧表示の拡張

### Phase 3: サービス層の移行
1. TransactionServiceの実装
2. 既存JournalServiceのラッパー化
3. 仕訳生成ルールエンジンの実装

### Phase 4: データ移行
1. 既存仕訳データの取引データへの変換
2. 取引先マスタの構築
3. 決済ステータスの推定・設定

### Phase 5: 最適化と旧コード削除
1. パフォーマンス最適化
2. 旧仕訳入力UIの削除
3. 不要なコードの削除

## 5. 実装の優先順位

### 即座に実装すべき項目
1. **型定義の追加**（types/transaction.ts）
```typescript
export interface Transaction {
  id: string
  type: 'income' | 'expense' | 'transfer'
  occurredOn: string
  accountCode: string
  amount: number
  status: 'unpaid' | 'paid'
  counterpartyId?: string
  dueOn?: string
  tags?: string[]
  note?: string
  journalId?: string  // 生成された仕訳へのリンク
}
```

2. **仕訳生成エンジン**の基本実装
```typescript
export class JournalGenerationEngine {
  generateJournal(transaction: Transaction): JournalData {
    // ルールベースの仕訳生成ロジック
  }
}
```

### 段階的に実装する項目
1. 取引入力UI（TransactionForm）
2. 取引管理サービス（TransactionService）
3. 既存データの移行ツール
4. 取引先管理機能

## 6. リスクと対策

### リスク
1. **データ整合性** - 取引と仕訳の不整合
   - 対策：トランザクション管理とバリデーション強化

2. **ユーザー混乱** - UIの大幅変更
   - 対策：段階的移行と並行運用期間の設定

3. **パフォーマンス** - 仕訳自動生成のオーバーヘッド
   - 対策：キャッシュとバッチ処理の実装

## 7. 移行のメリット

1. **ユーザビリティ向上**
   - 会計知識不要で入力可能
   - 入力ミスの削減

2. **自動化の促進**
   - 取引パターンの学習
   - 定型処理の自動化

3. **拡張性向上**
   - AI/MLとの統合が容易
   - 外部システム連携の簡素化

## 8. 次のステップ

1. この計画のレビューと承認
2. Phase 1の詳細設計
3. プロトタイプの実装（取引入力フォーム）
4. ユーザーテストと フィードバック収集