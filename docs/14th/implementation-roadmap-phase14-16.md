# 実装ロードマップ: Phase 14-16
## 消し込み処理・未収未払対応・決算締め作業

## 現状の確認

### 既存実装
1. **ClosingService** - 決算振替仕訳の基本機能あり
2. **TransactionService** - settleTransaction（決済処理）の基本実装あり
3. **勘定科目** - 未収金・未払金の科目は設定済み
   - 1301: 管理費未収金
   - 1302: 修繕積立金未収金
   - 2101: 未払金

### 不足している機能
1. 未収金・未払金の自動計上
2. 消し込み処理の詳細実装
3. 決算締め処理の完全実装
4. 月次締め処理

---

## Phase 14: 未収金・未払金の自動計上

### 目的
管理費等の請求時に未収金を計上し、入金時に消し込む仕組みを構築

### 実装内容

#### 1. 未収金計上サービスの作成
```typescript
// ReceivableService.ts
class ReceivableService {
  // 月次請求処理
  createMonthlyBilling(billingDate: string) {
    // 各住戸への請求仕訳作成
    // 管理費未収金 / 管理費収入
    // 修繕積立金未収金 / 修繕積立金収入
  }
  
  // 未収金一覧取得
  getReceivables(asOfDate: string) {
    // 未収金残高のある住戸一覧
  }
  
  // 滞納状況レポート
  getDelinquentReport(asOfDate: string) {
    // 滞納月数、滞納額の集計
  }
}
```

#### 2. 補助元帳との連携強化
```typescript
// 住戸別補助元帳で未収金管理
interface UnitOwnerLedger {
  unitNumber: string
  ownerName: string
  receivables: {
    managementFee: number
    repairReserve: number
    parkingFee: number
  }
  lastPaymentDate: string
  delinquentMonths: number
}
```

#### 3. UI実装
- 未収金一覧画面
- 滞納状況ダッシュボード
- 請求書発行機能

### 期待される成果
- 未収金の自動計上により請求管理が効率化
- 滞納状況の可視化
- 補助元帳との連携による住戸別管理

---

## Phase 15: 消し込み処理の実装

### 目的
入金データと未収金の自動照合・消し込み機能の実装

### 実装内容

#### 1. 消し込みエンジンの作成
```typescript
// MatchingService.ts
class MatchingService {
  // 自動消し込み処理
  autoMatch(bankTransaction: BankTransaction) {
    // 1. 金額完全一致
    // 2. 住戸番号による照合
    // 3. 入金者名による照合
  }
  
  // 手動消し込み
  manualMatch(bankTransactionId: string, receivableId: string) {
    // 消し込み仕訳の作成
    // 現金・預金 / 未収金
  }
  
  // 部分消し込み
  partialMatch(bankTransactionId: string, allocations: MatchAllocation[]) {
    // 複数の未収金への配分
  }
}
```

#### 2. 銀行データ連携
```typescript
// BankDataImportService.ts
class BankDataImportService {
  // CSVインポート
  importCSV(file: File) {
    // 銀行取引明細のインポート
  }
  
  // 入金データの解析
  parseDepositData(transaction: BankTransaction) {
    // 摘要欄から住戸番号等を抽出
  }
}
```

#### 3. 消し込み状況の管理
```typescript
interface MatchingStatus {
  bankTransactionId: string
  status: 'unmatched' | 'partially_matched' | 'fully_matched'
  matchedReceivables: Array<{
    receivableId: string
    amount: number
    matchedDate: string
  }>
  unmatchedAmount: number
}
```

#### 4. UI実装
- 消し込み画面（ドラッグ&ドロップ対応）
- 銀行データインポート画面
- 消し込み状況一覧
- 不一致レポート

### 期待される成果
- 入金処理の自動化・効率化
- 消し込みミスの削減
- リアルタイムな入金状況の把握

---

## Phase 16: 決算締め処理の完全実装

### 目的
月次締め、年次決算の完全な自動化

### 実装内容

#### 1. 月次締め処理
```typescript
// MonthlyClosingService.ts
class MonthlyClosingService {
  // 月次締め処理
  performMonthlyClosing(closingDate: string) {
    // 1. 未収金の計上
    // 2. 未払金の計上
    // 3. 経過勘定の計上
    // 4. 月次試算表の確定
    // 5. 締め済みフラグの設定
  }
  
  // 締め解除
  cancelMonthlyClosing(period: string) {
    // 締め済み期間の解除（権限チェック付き）
  }
}
```

#### 2. 年次決算処理
```typescript
// AnnualClosingService.ts  
class AnnualClosingService extends ClosingService {
  // 決算整理仕訳
  createAdjustingEntries(closingDate: string) {
    // 1. 減価償却費の計上
    // 2. 引当金の計上
    // 3. 経過勘定の整理
    // 4. 棚卸資産の評価
  }
  
  // 決算書作成
  generateFinancialStatements(fiscalYear: number) {
    // 1. 貸借対照表
    // 2. 正味財産増減計算書
    // 3. 財産目録
    // 4. 注記
  }
  
  // 繰越処理
  carryForward(fromYear: number, toYear: number) {
    // 1. 残高の繰越
    // 2. 繰越仕訳の作成
    // 3. 新年度の開始残高設定
  }
}
```

#### 3. 決算チェックリスト
```typescript
interface ClosingChecklist {
  items: Array<{
    category: string
    task: string
    status: 'pending' | 'in_progress' | 'completed'
    completedBy?: string
    completedDate?: string
    notes?: string
  }>
  
  // チェック項目例
  // - 全ての取引が入力済み
  // - 銀行残高との照合完了
  // - 未収金・未払金の確認
  // - 決算整理仕訳の作成
  // - 試算表の確認
  // - 決算書の作成
}
```

#### 4. UI実装
- 決算処理ウィザード
- 決算チェックリスト画面
- 決算書プレビュー・印刷
- 決算ロック機能

### 期待される成果
- 決算処理の標準化・自動化
- 決算ミスの防止
- 監査対応の効率化

---

## 実装優先順位と工数見積もり

### 優先順位
1. **Phase 14**: 未収金・未払金対応（基礎となる機能）
2. **Phase 15**: 消し込み処理（日常業務の効率化）
3. **Phase 16**: 決算締め処理（年次・月次の締め）

### 工数見積もり
- Phase 14: 3-4日
  - サービス層: 1日
  - UI実装: 2日
  - テスト: 1日

- Phase 15: 4-5日
  - 消し込みエンジン: 2日
  - 銀行連携: 1日
  - UI実装: 2日

- Phase 16: 5-6日
  - 月次締め: 2日
  - 年次決算: 2日
  - UI・レポート: 2日

### 技術的考慮事項

#### データ整合性
- トランザクション管理の強化
- 締め済み期間のロック機能
- 監査ログの実装

#### パフォーマンス
- 大量データ処理の最適化
- バッチ処理の実装
- キャッシュの活用

#### セキュリティ
- 権限管理の実装
- 決算承認ワークフロー
- データの暗号化

---

## 推奨される次のステップ

### Phase 14から開始する理由
1. 他の機能の基礎となる
2. 日常業務への影響が大きい
3. 比較的実装が単純

### 実装開始前の準備
1. 詳細な要件定義
2. 画面設計・UIモックアップ作成
3. テストケースの作成
4. サンプルデータの準備

### 段階的リリース
- Phase 14: 基本機能のリリース
- Phase 15: 自動化機能の追加
- Phase 16: 完全な決算機能

この実装により、マンション管理組合の会計業務が大幅に効率化され、正確性も向上します。