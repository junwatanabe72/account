# Phase 14 - 1st Implementation Details
## 実装詳細ドキュメント

## 1. ReceivableService 実装詳細

### 概要
未収金の作成、管理、消し込み処理を担当するサービス

### 主要メソッド

#### `createReceivable()`
```typescript
createReceivable(
  unitNumber: string,
  accountCode: '1301' | '1302' | '1303',
  amount: number,
  dueDate: string,
  memo?: string
): Receivable
```
- 新規未収金を作成
- 自動でIDを生成
- LocalStorageに保存

#### `clearReceivable()`
```typescript
clearReceivable(
  receivableId: string,
  paymentAmount: number,
  journalId: string,
  memo?: string
): ClearingResult
```
- 完全消し込み: 支払額 ≥ 未収金額
- 部分消し込み: 支払額 < 未収金額
- 消し込み履歴を記録

#### `getReceivableSummary()`
```typescript
getReceivableSummary(asOfDate?: string): ReceivableSummary
```
- 総未収金額の集計
- 住戸別未収金の集計
- 延滞期間別の分類（当月/1ヶ月/2ヶ月/3ヶ月以上）

### データ構造
```typescript
interface Receivable {
  id: string
  unitNumber: string
  accountCode: '1301' | '1302' | '1303'
  amount: number
  dueDate: string
  status: 'outstanding' | 'partially_paid' | 'paid'
  createdDate: string
  clearedDate?: string
  clearingHistory?: ClearingRecord[]
}
```

### インデックス管理
- `receivables`: Map<receivableId, Receivable>
- `unitIndex`: Map<unitNumber, receivableId[]>

## 2. BankImportService 実装詳細

### 概要
銀行明細CSVのインポートと解析を担当

### 銀行アダプター実装

#### GenericBankAdapter（基底クラス）
```typescript
class GenericBankAdapter implements BankFormatAdapter {
  getColumnMapping(): ColumnMapping {
    return {
      date: '日付',
      description: '摘要',
      deposit: '入金',
      withdrawal: '出金',
      balance: '残高'
    }
  }
  
  parse(rawData: any[]): BankTransaction[] {
    // CSVデータを標準形式に変換
  }
}
```

#### 銀行別アダプター
- **MUFGAdapter**: 三菱UFJ銀行形式
- **SMBCAdapter**: 三井住友銀行形式
- **MizuhoAdapter**: みずほ銀行形式

### 日付解析の実装
```typescript
private parseDate(value: string): string {
  // YYYY-MM-DD形式
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr
  }
  
  // YYYY/MM/DD形式
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(dateStr)) {
    return dateStr.replace(/\//g, '-')
  }
  
  // 和暦対応（令和6年4月25日 -> 2024-04-25）
  const reiwaMatch = dateStr.match(/令和(\d+)年(\d+)月(\d+)日/)
  if (reiwaMatch) {
    const year = 2018 + parseInt(reiwaMatch[1])
    return `${year}-${month}-${day}`
  }
}
```

### 重複チェック
```typescript
private filterDuplicates(transactions: BankTransaction[]): BankTransaction[] {
  // キー: 日付_摘要_金額_残高
  const key = `${txn.date}_${txn.description}_${txn.amount}_${txn.balance}`
}
```

## 3. PaymentMatchingService 実装詳細

### 概要
入金の照合と仕訳提案を担当

### 摘要解析パターン
```typescript
private patterns: RegExp[] = [
  /(\d{3,4})\s*号室/,      // "101号室"
  /(\d{3,4})\s*号/,        // "101号"
  /(\d{3,4})\s*ゴウ/,      // "101ゴウ"
  /(\d{3,4})\s*ｺﾞｳ/,      // "101ｺﾞｳ"
  /Room\s*(\d{3,4})/i,     // "Room 101"
  /部屋番号.*(\d{3,4})/,   // "部屋番号101"
  /No\.?\s*(\d{3,4})/i,    // "No.101"
  /＃(\d{3,4})/,          // "＃101"
  /#(\d{3,4})/,           // "#101"
]
```

### 照合処理フロー

#### 1. 住戸番号抽出
```typescript
private extractUnitInfo(description: string): UnitExtractionResult {
  // 1. 学習済みパターンをチェック
  // 2. 正規表現パターンマッチング
  // 3. 住戸マスタの名前検索
  // 4. 結果返却（信頼度付き）
}
```

#### 2. 照合タイプ判定
```typescript
processPayment(transaction: BankTransaction): PaymentMatching {
  const difference = transaction.amount - standardTotal
  
  if (Math.abs(difference) < 1) {
    // 完全一致
    return this.createExactPayment(...)
  } else if (difference < 0) {
    // 不足（未収金計上）
    return this.createPartialPayment(...)
  } else {
    // 過入金（前受金計上）
    return this.createOverPayment(...)
  }
}
```

### 仕訳提案の生成

#### 完全一致の場合
```
借方: 普通預金 28,000
貸方: 管理費収入 15,000
      修繕積立金収入 10,000
      駐車場収入 3,000
```

#### 一部入金の場合
```
// 入金仕訳
借方: 普通預金 20,000
貸方: 管理費収入 12,000
      修繕積立金収入 8,000

// 未収金計上
借方: 管理費未収金 3,000
貸方: 管理費収入 3,000
借方: 修繕積立金未収金 2,000
貸方: 修繕積立金収入 2,000
```

#### 過入金の場合
```
借方: 普通預金 50,000
貸方: 管理費収入 15,000
      修繕積立金収入 10,000
      駐車場収入 3,000
      前受金 22,000
```

### 学習機能
```typescript
manualSetUnit(matchingId: string, unitNumber: string, description?: string): void {
  // 手動設定を記憶
  this.learnedPatterns.set(normalized, {
    unitNumber,
    confidence: 1.0,
    matchedPattern: 'manual'
  })
  // LocalStorageに保存
  this.saveLearnedPatterns()
}
```

## 4. PaymentSlice (Zustand) 実装詳細

### State構造
```typescript
interface PaymentSlice {
  // データ
  bankTransactions: BankTransaction[]
  matchingResults: Map<string, PaymentMatching>
  receivables: Receivable[]
  receivableSummary: ReceivableSummary | null
  
  // UI状態
  currentBatchId: string | null
  isProcessing: boolean
  importResult: ImportResult | null
  
  // サービス
  bankImportService: BankImportService | null
  paymentMatchingService: PaymentMatchingService | null
  receivableService: ReceivableService | null
}
```

### 主要アクション

#### `initializePaymentServices()`
```typescript
initializePaymentServices: (journalService, accountService) => {
  // 各サービスのインスタンス化
  const receivableService = new ReceivableService()
  const bankImportService = new BankImportService(journalService, accountService)
  const paymentMatchingService = new PaymentMatchingService(
    journalService,
    receivableService
  )
  
  // stateに設定
  set({ bankImportService, paymentMatchingService, receivableService })
  
  // 既存データの読み込み
  get().refreshData()
}
```

#### `importBankTransactions()`
```typescript
importBankTransactions: async (file, bankType = 'generic') => {
  set({ isProcessing: true })
  
  const result = await bankImportService.importCSV(file, bankType)
  
  set({
    importResult: result,
    currentBatchId: result.batchId,
    bankTransactions: result.transactions,
    isProcessing: false
  })
  
  return result
}
```

#### `processPaymentMatching()`
```typescript
processPaymentMatching: async (transactionId) => {
  // 1. 照合処理実行
  const matching = await paymentMatchingService.processPayment(transaction)
  
  // 2. 結果を保存
  newResults.set(matching.id, matching)
  
  // 3. 未収金作成（部分入金の場合）
  if (matching.matchingType === 'partial') {
    receivableService.createReceivable(...)
  }
  
  return matching
}
```

## 5. データ永続化戦略

### LocalStorage構造
```javascript
localStorage = {
  // 未収金データ
  'receivables': JSON.stringify(Receivable[]),
  
  // 銀行取引データ
  'bankTransactions': JSON.stringify(BankTransaction[]),
  
  // 学習済みパターン
  'paymentMatchingPatterns': JSON.stringify([description, result][]),
  
  // Zustand Store（自動）
  'zustand': JSON.stringify(StoreState)
}
```

### 保存タイミング
- サービスメソッド実行後に自動保存
- Zustand persistミドルウェアによる自動保存

### 読み込みタイミング
- サービスのコンストラクタで自動読み込み
- Store初期化時に自動読み込み

## 6. エラーハンドリング

### インポートエラー
```typescript
interface ImportError {
  row: number
  field?: string
  value?: string
  message: string
  severity: 'warning' | 'error'
}
```

### 検証項目
1. 日付形式の検証
2. 金額の数値検証
3. 摘要の存在確認
4. 重複チェック

## 7. パフォーマンス考慮事項

### インデックス使用
- 住戸番号による高速検索
- 未収金IDによる直接アクセス

### バッチ処理対応
```typescript
interface BatchProcessingOptions {
  batchSize: number
  retryOnError: boolean
  maxRetries: number
  continueOnError: boolean
  progressCallback?: (progress: ProcessingProgress) => void
}
```

### メモリ管理
- 大量データ処理時の分割処理
- 不要データの定期クリーンアップ

## 8. テスト用データ

### サンプル銀行明細
```csv
日付,摘要,入金,出金,残高
2024-04-25,管理費 101号室 田中様,28000,,5028000
2024-04-25,管理費・修繕費 202号室 山田,35000,,5063000
2024-04-26,303 サトウ,20000,,5083000
```

### テストシナリオ
1. **正常入金**: 標準額と一致
2. **一部入金**: 標準額より少ない
3. **過入金**: 標準額より多い
4. **住戸不明**: 摘要から特定不可
5. **返金処理**: 出金取引

---

*このドキュメントはPhase 14の1st実装の技術詳細を記録したものです。*