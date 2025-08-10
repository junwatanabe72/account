// 仕訳パターン関連の型定義

// 仕訳パターン
export interface JournalPattern {
  id: string
  name: string
  keywords: string[]           // 検索用キーワード
  
  // マッチング条件
  conditions: {
    amountRange?: {
      min: number
      max: number
    }
    descriptionPattern?: string  // 正規表現パターン
    payeePattern?: string        // 支払先パターン
    datePattern?: {
      dayOfMonth?: number[]      // 特定日
      monthlyRecurring?: boolean // 毎月繰り返し
    }
  }
  
  // 仕訳ルール
  journalRule: {
    debitAccount: string
    debitAccountName?: string
    creditAccount: string
    creditAccountName?: string
    division?: string
    auxiliaryCode?: string
    descriptionTemplate?: string  // ${amount}等の変数を含むテンプレート
  }
  
  // 統計情報
  statistics: {
    createdAt: string
    usageCount: number
    successRate: number
    lastUsed?: string
    lastModified: string
  }
  
  // メタデータ
  metadata: {
    isSystemPattern: boolean    // システム定義パターン
    isActive: boolean
    createdBy?: string
    category?: string            // パターンカテゴリ
    notes?: string
  }
}

// パターンマッチング結果
export interface PatternMatchResult {
  pattern: JournalPattern
  similarity: number            // 0-100の類似度スコア
  matchedFields: string[]       // マッチした項目
  confidence: number           // 信頼度
}

// 仕訳学習データ
export interface JournalLearningData {
  transactionId: string
  originalDescription: string
  amount: number
  
  // 適用された仕訳
  appliedJournal: {
    debitAccount: string
    creditAccount: string
    division?: string
    auxiliaryCode?: string
  }
  
  // 学習メタデータ
  learning: {
    wasAutoMatched: boolean
    patternId?: string
    userApproved: boolean
    userModified: boolean
    timestamp: string
  }
}

// パターン提案
export interface PatternSuggestion {
  basedOnTransactions: string[]  // 基となった取引ID
  suggestedPattern: {
    keywords: string[]
    descriptionPattern: string
    journalRule: {
      debitAccount: string
      creditAccount: string
    }
  }
  confidence: number
  reasoning: string
}