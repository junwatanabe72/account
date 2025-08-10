# LLMファースト仕訳システム - 実装例

## 処理フロー実例

### 1. 様々な形式の銀行明細インポート

#### ケース1: 三菱UFJ銀行のCSV
```csv
日付,摘要,出金,入金,残高
2024/01/05,管理費　ヤマダタロウ,,25000,125000
2024/01/05,管理費　サトウハナコ,,25000,150000
2024/01/10,清掃業務　○○清掃,50000,,100000
```

#### ケース2: 手入力のExcelデータ
```
1月5日  山田さん管理費入金  25,000円
1月5日  佐藤さん管理費入金  25,000円
1月10日 清掃代支払い       -50,000円
```

#### ケース3: PDFからコピーしたテキスト
```
取引明細
2024年1月5日 振込 ヤマダタロウ 25,000
2024年1月5日 振込 サトウハナコ 25,000
2024年1月10日 振替 ○○清掃サービス △50,000
```

### 2. LLMによる正規化処理

#### プロンプト例
```javascript
const normalizationPrompt = {
  system: `
    銀行取引データを以下のJSON形式に変換してください：
    {
      "transactions": [
        {
          "date": "YYYY-MM-DD",
          "description": "取引内容",
          "amount": 数値（入金は正、出金は負）,
          "balance": 残高（分かる場合）,
          "payee": "相手先名",
          "confidence": 0-100
        }
      ]
    }
  `,
  user: rawDataString
}
```

#### LLM出力（標準化JSON）
```json
{
  "transactions": [
    {
      "date": "2024-01-05",
      "description": "管理費　ヤマダタロウ",
      "amount": 25000,
      "balance": 125000,
      "payee": "ヤマダタロウ",
      "category": "管理費収入",
      "confidence": 95
    },
    {
      "date": "2024-01-05",
      "description": "管理費　サトウハナコ",
      "amount": 25000,
      "balance": 150000,
      "payee": "サトウハナコ",
      "category": "管理費収入",
      "confidence": 95
    },
    {
      "date": "2024-01-10",
      "description": "清掃業務　○○清掃",
      "amount": -50000,
      "balance": 100000,
      "payee": "○○清掃",
      "category": "清掃費",
      "confidence": 90
    }
  ],
  "metadata": {
    "bankName": "三菱UFJ銀行",
    "period": {
      "from": "2024-01-05",
      "to": "2024-01-10"
    },
    "importedAt": "2024-01-15T10:30:00Z",
    "originalFormat": "CSV"
  }
}
```

### 3. ルールベース例外処理

#### 例外検出ルール
```typescript
const exceptionChecks = [
  {
    name: "未収金チェック",
    check: (tx: Transaction) => {
      // サトウハナコさんは先月分未納
      if (tx.payee === "サトウハナコ" && tx.amount === 25000) {
        return {
          type: 'warning',
          message: '先月分未納あり。合計50,000円の入金が必要',
          suggestedAmount: 50000
        }
      }
    }
  },
  {
    name: "定期支払チェック",
    check: (tx: Transaction) => {
      if (tx.payee === "○○清掃" && tx.amount !== -50000) {
        return {
          type: 'warning',
          message: '通常と異なる金額です'
        }
      }
    }
  }
]
```

### 4. 仕訳生成

#### LLMへの仕訳生成依頼（既存仕訳パターン活用）
```javascript
const journalPrompt = {
  system: `
    マンション管理組合の仕訳を生成してください。
    
    【使用可能な勘定科目】
    [資産] 1112:普通預金, 1141:未収金
    [収益] 4111:管理費収入, 4112:修繕積立金収入
    [費用] 5121:清掃費, 5122:設備管理費
    
    【過去の仕訳パターン】
    1. "管理費.*ヤマダ" → 借方:普通預金 25,000 / 貸方:管理費収入 15,000, 修繕積立金収入 10,000
    2. "清掃.*○○清掃" → 借方:清掃費 50,000 / 貸方:普通預金 50,000
    3. "電気料金" → 借方:水道光熱費 / 貸方:普通預金
    
    【区分所有者リスト】
    101号室 山田太郎（管理費15,000円、修繕積立金10,000円）
    102号室 佐藤花子（管理費15,000円、修繕積立金10,000円、前月未収あり）
    
    【業者リスト】
    ○○清掃サービス（月額50,000円）
    
    【指示】
    1. 過去の仕訳パターンと照合してください
    2. 一致する場合はそのパターンを使用
    3. 一致しない場合は新規パターンとして仕訳を作成し、isNewPattern: true を設定
  `,
  user: JSON.stringify({
    transaction: transaction,
    existingJournals: journalDatabase.getRecentJournals(100)
  })
}
```

#### LLM出力（仕訳提案 - 既存パターン活用）
```json
{
  "journals": [
    {
      "date": "2024-01-05",
      "description": "101号室 山田様 1月分管理費",
      "entries": [
        {
          "debit": {
            "account": "1112",
            "accountName": "普通預金",
            "amount": 25000
          },
          "credit": {
            "account": "4111",
            "accountName": "管理費収入",
            "amount": 15000,
            "auxiliaryCode": "101"
          }
        },
        {
          "credit": {
            "account": "4112",
            "accountName": "修繕積立金収入",
            "amount": 10000,
            "auxiliaryCode": "101"
          }
        }
      ],
      "patternMatch": {
        "matchedPatternId": "pattern_001",
        "similarity": 95,
        "isNewPattern": false
      },
      "confidence": 95,
      "reasoning": "過去の仕訳パターン#1と一致。山田太郎様の定期管理費入金"
    },
    {
      "date": "2024-01-05",
      "description": "102号室 佐藤様 1月分管理費（前月分未収あり）",
      "entries": [
        {
          "debit": {
            "account": "1112",
            "accountName": "普通預金",
            "amount": 25000
          },
          "credit": {
            "account": "1141",
            "accountName": "未収金",
            "amount": 25000,
            "auxiliaryCode": "102"
          }
        }
      ],
      "confidence": 85,
      "reasoning": "未収金があるため、まず前月分の消込と判断",
      "note": "追加で25,000円の入金確認が必要"
    },
    {
      "date": "2024-01-10",
      "description": "清掃業務委託費 1月分",
      "entries": [
        {
          "debit": {
            "account": "5121",
            "accountName": "清掃費",
            "amount": 50000,
            "division": "KANRI"
          },
          "credit": {
            "account": "1112",
            "accountName": "普通預金",
            "amount": 50000
          }
        }
      ],
      "confidence": 95,
      "reasoning": "定期的な清掃業務の支払い"
    }
  ]
}
```

### 5. 新規仕訳パターンの例

#### 新規パターンとして検出される例
```json
{
  "transaction": {
    "date": "2024-01-15",
    "description": "自販機売上回収",
    "amount": 15230,
    "payee": "ベンダー会社"
  },
  
  "llmResponse": {
    "journal": {
      "date": "2024-01-15",
      "description": "自動販売機売上金回収",
      "entries": [
        {
          "debit": {
            "account": "1112",
            "accountName": "普通預金",
            "amount": 15230
          },
          "credit": {
            "account": "4191",
            "accountName": "雑収入",
            "amount": 15230,
            "auxiliaryCode": "自販機"
          }
        }
      ],
      "patternMatch": {
        "matchedPatternId": null,
        "similarity": 0,
        "isNewPattern": true,
        "suggestedPattern": {
          "keywords": ["自販機", "売上", "ベンダー"],
          "debitRule": "1112:普通預金",
          "creditRule": "4191:雑収入",
          "auxiliaryRule": "自販機"
        }
      },
      "confidence": 75,
      "reasoning": "既存パターンに該当なし。自動販売機の売上金と推定し、雑収入として処理"
    }
  }
}
```

### 6. 仕訳パターン学習機能

#### 6.1 パターンデータベースの自動拡張
```typescript
class JournalPatternLearning {
  private patterns: Map<string, JournalPattern> = new Map()
  
  // 新規パターンの登録
  async registerNewPattern(
    transaction: Transaction,
    journal: Journal,
    userApproved: boolean
  ): Promise<void> {
    if (!userApproved) return
    
    const pattern: JournalPattern = {
      id: generateId(),
      keywords: this.extractKeywords(transaction.description),
      conditions: {
        amountRange: this.calculateAmountRange(transaction.amount),
        descriptionPattern: this.createRegexPattern(transaction.description)
      },
      journalRule: {
        debitAccount: journal.debit.account,
        creditAccount: journal.credit.account,
        division: journal.division,
        auxiliaryCode: journal.auxiliaryCode
      },
      statistics: {
        createdAt: new Date().toISOString(),
        usageCount: 1,
        successRate: 100,
        lastModified: new Date().toISOString()
      }
    }
    
    this.patterns.set(pattern.id, pattern)
    await this.saveToDatabase(pattern)
  }
  
  // パターンの更新（使用頻度と成功率）
  updatePatternStatistics(
    patternId: string,
    success: boolean
  ): void {
    const pattern = this.patterns.get(patternId)
    if (!pattern) return
    
    pattern.statistics.usageCount++
    pattern.statistics.successRate = 
      (pattern.statistics.successRate * (pattern.statistics.usageCount - 1) + 
       (success ? 100 : 0)) / pattern.statistics.usageCount
    pattern.statistics.lastModified = new Date().toISOString()
    
    this.patterns.set(patternId, pattern)
  }
  
  // 類似パターンの検索
  findSimilarPatterns(
    transaction: Transaction,
    threshold: number = 70
  ): JournalPattern[] {
    const results: Array<{pattern: JournalPattern, score: number}> = []
    
    for (const pattern of this.patterns.values()) {
      const score = this.calculateSimilarity(transaction, pattern)
      if (score >= threshold) {
        results.push({ pattern, score })
      }
    }
    
    return results
      .sort((a, b) => b.score - a.score)
      .map(r => r.pattern)
  }
  
  private extractKeywords(description: string): string[] {
    // 重要なキーワードを抽出
    const stopWords = ['の', 'を', 'に', 'が', 'と', 'は', 'で']
    return description
      .split(/[\s　,、。・]+/)
      .filter(word => !stopWords.includes(word) && word.length > 1)
  }
  
  private calculateSimilarity(
    transaction: Transaction,
    pattern: JournalPattern
  ): number {
    let score = 0
    
    // キーワードマッチング
    const txKeywords = this.extractKeywords(transaction.description)
    const matchedKeywords = txKeywords.filter(k => 
      pattern.keywords.includes(k)
    )
    score += (matchedKeywords.length / pattern.keywords.length) * 50
    
    // 金額範囲チェック
    if (pattern.conditions.amountRange) {
      const { min, max } = pattern.conditions.amountRange
      if (transaction.amount >= min && transaction.amount <= max) {
        score += 30
      }
    }
    
    // 正規表現パターンマッチング
    if (pattern.conditions.descriptionPattern) {
      const regex = new RegExp(pattern.conditions.descriptionPattern)
      if (regex.test(transaction.description)) {
        score += 20
      }
    }
    
    return Math.min(score, 100)
  }
}
```

### 6. 実装上のポイント

#### 5.1 エラーハンドリング
```typescript
class LLMJournalProcessor {
  async processImport(file: File): Promise<ProcessResult> {
    try {
      // Step 1: ファイル読み込み
      const rawData = await this.readFile(file)
      
      // Step 2: LLM正規化
      const normalized = await this.normalizewithLLM(rawData)
      
      // Step 3: 検証
      const validated = this.validateData(normalized)
      
      // Step 4: 例外処理
      const processed = this.applyExceptionRules(validated)
      
      // Step 5: 仕訳生成
      const journals = await this.generateJournals(processed)
      
      return { success: true, journals }
      
    } catch (error) {
      // エラーの種類に応じた処理
      if (error instanceof LLMError) {
        // LLMエラーの場合は手動入力画面へ
        return { success: false, fallback: 'manual' }
      }
      throw error
    }
  }
  
  private validateData(data: NormalizedData): ValidatedData {
    const errors = []
    
    // 必須項目チェック
    data.transactions.forEach((tx, index) => {
      if (!tx.date) errors.push(`行${index + 1}: 日付が不明`)
      if (!tx.amount) errors.push(`行${index + 1}: 金額が不明`)
    })
    
    // 整合性チェック
    if (data.transactions.length > 0) {
      const calculatedBalance = this.calculateBalance(data.transactions)
      const lastBalance = data.transactions[data.transactions.length - 1].balance
      if (Math.abs(calculatedBalance - lastBalance) > 1) {
        errors.push('残高計算が合いません')
      }
    }
    
    if (errors.length > 0) {
      throw new ValidationError(errors)
    }
    
    return data as ValidatedData
  }
}
```

#### 5.2 ユーザー確認画面
```typescript
interface ConfirmationView {
  // 元データと変換結果の対比表示
  showComparison: (original: string, normalized: NormalizedData) => void
  
  // 信頼度による色分け表示
  highlightConfidence: (confidence: number) => string
  
  // 修正機能
  enableManualEdit: (transaction: Transaction) => void
  
  // 一括承認/個別承認
  approvalActions: {
    approveAll: () => void
    approveSelected: (ids: string[]) => void
    reject: (id: string) => void
  }
}
```

## まとめ

このLLMファーストアプローチにより：

1. **形式を問わない柔軟な入力対応**
   - CSV、Excel、PDF、画像、テキストなど
   - 各銀行固有のフォーマットに依存しない

2. **高精度な自動仕訳**
   - LLMによる文脈理解
   - 過去データからの学習

3. **例外処理の自動化**
   - ビジネスルールの適用
   - 異常値の自動検出

4. **ユーザー負担の軽減**
   - フォーマット設定不要
   - 直感的な確認・修正UI

これにより、実務で本当に使える仕訳自動化システムが実現できます。