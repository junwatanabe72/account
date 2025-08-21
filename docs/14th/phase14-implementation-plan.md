# Phase 14: 実装計画書

## 実装概要
銀行明細CSVインポートによる入金処理自動化と未収金管理機能のPOC実装

## 実装スコープ

### 含まれる機能
- ✅ 銀行明細CSVのインポート
- ✅ 入金仕訳の自動生成
- ✅ 標準請求額との差額計算
- ✅ 未収金の自動計上
- ✅ 未収金の手動消し込み
- ✅ 基本的な入金レポート

### 含まれない機能（将来実装）
- ❌ 請求書発行機能
- ❌ 自動消し込み（次回入金時）
- ❌ 延滞金計算
- ❌ 督促管理
- ❌ 口座振替連携

---

## 実装アーキテクチャ（現在のプロジェクトに準拠）

### レイヤー構成
```
UI層（React Components）
  ├── BankImportWizard.tsx（既存を拡張）
  ├── PaymentMatchingStep.tsx（新規）
  ├── ReceivableListView.tsx（新規）
  └── PaymentReportView.tsx（新規）

Store層（Zustand）
  └── slices/
      └── payment/
          ├── paymentSlice.ts（新規）
          └── index.ts

Domain層（Services）
  └── services/
      └── payment/（新規ディレクトリ）
          ├── BankImportService.ts
          ├── PaymentMatchingService.ts
          ├── ReceivableService.ts
          └── index.ts

Types層
  └── types/
      └── payment.ts（新規）

Data層
  └── utils/
      ├── csvParser.ts（既存fileParserを拡張）
      └── bankFormatAdapters.ts（新規）
```

---

## 詳細設計

### 1. BankImportService
```typescript
class BankImportService {
  private csvParser: CSVParser
  private formatAdapters: Map<string, BankFormatAdapter>
  
  constructor(
    private journalService: JournalService,
    private accountService: AccountService
  ) {}
  
  // CSVインポートメイン処理
  async importCSV(
    file: File, 
    bankType: 'mufg' | 'smbc' | 'mizuho' | 'generic'
  ): Promise<ImportResult> {
    // 1. CSV解析
    const rawData = await this.csvParser.parse(file)
    
    // 2. 銀行別フォーマット変換
    const adapter = this.formatAdapters.get(bankType)
    const transactions = adapter.convert(rawData)
    
    // 3. 重複チェック
    const uniqueTransactions = this.filterDuplicates(transactions)
    
    // 4. 検証
    const validationResult = this.validateTransactions(uniqueTransactions)
    
    return {
      total: transactions.length,
      imported: uniqueTransactions.length,
      duplicates: transactions.length - uniqueTransactions.length,
      errors: validationResult.errors
    }
  }
}
```

### 2. PaymentMatchingService
```typescript
class PaymentMatchingService {
  // 住戸マスタ（POC用の固定データ）
  private unitMaster = new Map([
    ['101', { managementFee: 15000, repairReserve: 10000, parkingFee: 3000 }],
    ['202', { managementFee: 20000, repairReserve: 15000, parkingFee: 0 }],
    ['303', { managementFee: 15000, repairReserve: 10000, parkingFee: 3000 }]
  ])
  
  // 入金照合処理
  processPayment(transaction: BankTransaction): PaymentProcessResult {
    // 1. 摘要から住戸番号を抽出
    const unitInfo = this.extractUnitInfo(transaction.description)
    
    if (!unitInfo) {
      // 住戸不明の場合は仮受金
      return this.createUnidentifiedPayment(transaction)
    }
    
    // 2. 標準請求額を取得
    const standard = this.unitMaster.get(unitInfo.unitNumber)
    
    // 3. 差額計算
    const difference = transaction.depositAmount - standard.total
    
    // 4. 仕訳生成
    if (difference === 0) {
      // 完全一致
      return this.createNormalPayment(transaction, unitInfo, standard)
    } else if (difference < 0) {
      // 不足（未収金計上）
      return this.createPartialPayment(transaction, unitInfo, standard, difference)
    } else {
      // 過入金（前受金計上）
      return this.createAdvancePayment(transaction, unitInfo, standard, difference)
    }
  }
  
  // 摘要解析
  private extractUnitInfo(description: string): UnitInfo | null {
    // パターンマッチング
    const patterns = [
      /(\d{3,4})号室/,
      /(\d{3,4})ゴウ/,
      /Room\s*(\d{3,4})/i,
      /部屋番号.*(\d{3,4})/
    ]
    
    for (const pattern of patterns) {
      const match = description.match(pattern)
      if (match) {
        return {
          unitNumber: match[1].padStart(3, '0'),
          originalText: match[0]
        }
      }
    }
    
    return null
  }
}
```

### 3. ReceivableService
```typescript
class ReceivableService {
  private receivables: Map<string, Receivable[]> = new Map()
  
  // 未収金計上
  createReceivable(
    unitNumber: string,
    accountCode: '1301' | '1302', // 管理費未収金 or 修繕積立金未収金
    amount: number,
    dueDate: string
  ): Receivable {
    const receivable: Receivable = {
      id: generateId(),
      unitNumber,
      accountCode,
      amount,
      dueDate,
      status: 'outstanding',
      createdDate: new Date().toISOString()
    }
    
    // 住戸別に管理
    if (!this.receivables.has(unitNumber)) {
      this.receivables.set(unitNumber, [])
    }
    this.receivables.get(unitNumber)!.push(receivable)
    
    return receivable
  }
  
  // 消し込み処理
  clearReceivable(
    receivableId: string,
    paymentAmount: number,
    journalId: string
  ): ClearingResult {
    const receivable = this.findReceivable(receivableId)
    
    if (paymentAmount >= receivable.amount) {
      // 完全消し込み
      receivable.status = 'paid'
      receivable.clearedDate = new Date().toISOString()
      receivable.clearedByJournalId = journalId
    } else {
      // 部分消し込み
      receivable.status = 'partially_paid'
      receivable.amount -= paymentAmount
      
      // 消し込み履歴を記録
      this.recordPartialClearing(receivableId, paymentAmount, journalId)
    }
    
    return {
      success: true,
      remainingAmount: Math.max(0, receivable.amount - paymentAmount)
    }
  }
  
  // 未収金サマリー取得
  getReceivableSummary(): ReceivableSummary {
    const summary = {
      totalOutstanding: 0,
      byUnit: new Map<string, number>(),
      byAge: {
        current: 0,     // 当月
        oneMonth: 0,    // 1ヶ月延滞
        twoMonths: 0,   // 2ヶ月延滞
        threeMonthsPlus: 0 // 3ヶ月以上
      }
    }
    
    for (const [unitNumber, receivables] of this.receivables) {
      const unitTotal = receivables
        .filter(r => r.status !== 'paid')
        .reduce((sum, r) => sum + r.amount, 0)
      
      summary.byUnit.set(unitNumber, unitTotal)
      summary.totalOutstanding += unitTotal
      
      // 延滞期間別集計
      // ...
    }
    
    return summary
  }
}
```

### 4. UI Components

#### CSVImportDialog
```typescript
const CSVImportDialog: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [bankType, setBankType] = useState<string>('generic')
  const [preview, setPreview] = useState<any[]>([])
  
  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // プレビュー表示
      const preview = await parseCSVPreview(file, 5)
      setPreview(preview)
    }
  }
  
  const handleImport = async () => {
    const result = await bankImportService.importCSV(file, bankType)
    
    // 照合処理
    for (const transaction of result.transactions) {
      const matchResult = await paymentMatchingService.processPayment(transaction)
      
      // 仕訳作成
      if (matchResult.journals) {
        for (const journal of matchResult.journals) {
          await journalService.createJournal(journal)
        }
      }
    }
  }
  
  return (
    <Dialog>
      <DialogTitle>銀行明細インポート</DialogTitle>
      <DialogContent>
        <BankTypeSelector value={bankType} onChange={setBankType} />
        <FileUpload onChange={handleFileSelect} />
        <PreviewTable data={preview} />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleImport}>インポート実行</Button>
      </DialogActions>
    </Dialog>
  )
}
```

---

## サンプルデータ

### 銀行明細CSV例
```csv
日付,摘要,入金,出金,残高
2024-04-25,カンリヒ 101ゴウシツ タナカ,25000,,5025000
2024-04-25,管理費・修繕費 202号室 ヤマダ様,35000,,5060000
2024-04-25,303 サトウ,20000,,5080000
2024-04-26,管理費等 305号室,28000,,5108000
2024-04-26,カンリヒ 401,15000,,5123000
```

### 生成される仕訳例
```
# 正常入金（101号室）
2024-04-25 普通預金 25,000 / 管理費収入 15,000
                          / 修繕積立金収入 10,000

# 一部入金（303号室 - 8,000円不足）
2024-04-25 普通預金 20,000 / 管理費収入 15,000
                          / 修繕積立金収入 5,000
2024-04-25 修繕積立金未収金 5,000 / 修繕積立金収入 5,000
           駐車場未収金 3,000 / 駐車場収入 3,000

# 住戸不明
2024-04-26 普通預金 15,000 / 仮受金 15,000
```

---

## テスト計画

### 単体テスト
- CSVパーサーのテスト
- 摘要解析のテスト
- 仕訳生成ロジックのテスト
- 未収金計算のテスト

### 統合テスト
- CSVインポート〜仕訳作成の一連フロー
- 未収金計上〜消し込みフロー
- 異常系処理（不正なCSV、重複データ等）

### 受け入れテスト
- 実際の銀行明細での動作確認
- パフォーマンステスト（1000件以上）
- UI/UXテスト

---

## 実装スケジュール

### Day 1: 基盤実装
- CSVパーサー実装
- BankImportService基本機能
- データモデル定義

### Day 2: 照合エンジン
- PaymentMatchingService実装
- 摘要解析ロジック
- 仕訳生成ロジック

### Day 3: 未収金管理
- ReceivableService実装
- 消し込み機能
- レポート機能

### Day 4: UI実装とテスト
- React Components実装
- 統合テスト
- バグ修正

---

## リスクと対策

### リスク1: 摘要の表記ゆれ
- **対策**: パターンマッチングの充実、手動修正機能

### リスク2: 重複インポート
- **対策**: トランザクションIDによる重複チェック

### リスク3: 金額不一致
- **対策**: 確認画面の実装、手動調整機能

このPOC実装により、入金処理の自動化の実現可能性を検証し、本格実装への道筋を明確にします。