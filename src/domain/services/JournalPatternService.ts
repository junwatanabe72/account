// 仕訳パターン管理サービス - 既存仕訳からパターンを抽出し、LLMプロンプト用に変換

import { Journal, JournalDetail, JournalService } from './JournalService'
import { AccountService } from './AccountService'
import { AuxiliaryService } from './AuxiliaryService'
import { JournalPattern, PatternMatchResult, JournalLearningData } from '../../types/journalPattern'

// LLMプロンプト用の仕訳パターンデータ
export interface JournalPatternForLLM {
  patternId: string
  keywords: string[]
  description: string
  entries: Array<{
    debit?: {
      account: string
      accountName: string
    }
    credit?: {
      account: string
      accountName: string
    }
    amount?: number
    auxiliaryCode?: string
    division?: string
  }>
  frequency: number
  lastUsed: string
  successRate: number
  examples: string[]  // 過去の摘要例
}

export class JournalPatternService {
  private patterns: Map<string, JournalPattern> = new Map()
  private learningData: Map<string, JournalLearningData> = new Map()

  constructor(
    private journalService: JournalService,
    private accountService: AccountService,
    private auxiliaryService: AuxiliaryService
  ) {
    this.initializePatterns()
  }

  // 初期化：既存の仕訳からパターンを抽出
  private initializePatterns() {
    this.loadFromLocalStorage()
    
    // 初回起動時は既存仕訳からパターンを生成
    if (this.patterns.size === 0) {
      this.extractPatternsFromExistingJournals()
    }
  }

  // 既存仕訳からパターンを自動抽出
  private extractPatternsFromExistingJournals() {
    const journals = this.journalService.getJournals()
    const descriptionGroups = new Map<string, Journal[]>()

    // 摘要の類似性でグループ化
    for (const journal of journals) {
      const normalizedDesc = this.normalizeDescription(journal.description)
      const key = this.generateGroupKey(normalizedDesc)
      
      if (!descriptionGroups.has(key)) {
        descriptionGroups.set(key, [])
      }
      descriptionGroups.get(key)!.push(journal)
    }

    // 各グループからパターンを生成（2回以上出現するもののみ）
    for (const [groupKey, journals] of descriptionGroups) {
      if (journals.length >= 2) {
        const pattern = this.createPatternFromJournals(groupKey, journals)
        if (pattern) {
          this.patterns.set(pattern.id, pattern)
        }
      }
    }

    this.saveToLocalStorage()
  }

  // 摘要の正規化（数字、日付を汎用化）
  private normalizeDescription(description: string): string {
    return description
      .replace(/\d{4}年\d{1,2}月/g, 'YYYY年MM月')
      .replace(/\d{1,2}月分/g, 'MM月分')
      .replace(/\d+円/g, '金額円')
      .replace(/\d+号室/g, 'XX号室')
      .replace(/[０-９]/g, (match) => String.fromCharCode(match.charCodeAt(0) - 0xFEE0))
      .replace(/\d+/g, 'NUM')
  }

  // グループ化のキー生成
  private generateGroupKey(description: string): string {
    // 重要な単語を抽出してキーとする
    const keywords = description
      .replace(/[、。・\s]/g, ' ')
      .split(' ')
      .filter(word => word.length > 1)
      .slice(0, 3)
      .join('_')
    
    return keywords || 'other'
  }

  // 仕訳グループからパターンを生成
  private createPatternFromJournals(groupKey: string, journals: Journal[]): JournalPattern | null {
    const firstJournal = journals[0]
    if (!firstJournal) return null

    // 仕訳エントリのパターンを分析
    const entryPatterns = this.analyzeJournalEntries(journals)
    if (!entryPatterns) return null

    // キーワード抽出
    const keywords = this.extractKeywords(journals.map(j => j.description))

    return {
      id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${groupKey}パターン`,
      keywords,
      conditions: {
        descriptionPattern: this.createDescriptionPattern(journals[0].description),
        amountRange: this.calculateAmountRange(journals)
      },
      journalRule: entryPatterns,
      statistics: {
        createdAt: new Date().toISOString(),
        usageCount: journals.length,
        successRate: 100,
        lastUsed: journals[journals.length - 1].date,
        lastModified: new Date().toISOString()
      },
      metadata: {
        isSystemPattern: true,
        isActive: true,
        category: this.categorizePattern(firstJournal.description),
        notes: `${journals.length}件の仕訳から自動生成`
      }
    }
  }

  // 仕訳エントリの分析
  private analyzeJournalEntries(journals: Journal[]): JournalPattern['journalRule'] | null {
    // 最初の仕訳をベースにパターンを作成
    const baseJournal = journals[0]
    if (!baseJournal || baseJournal.details.length === 0) return null

    // 2エントリの標準パターンを想定
    const debitDetail = baseJournal.details.find(d => d.debitAmount > 0)
    const creditDetail = baseJournal.details.find(d => d.creditAmount > 0)

    if (!debitDetail || !creditDetail) return null

    return {
      debitAccount: debitDetail.accountCode,
      debitAccountName: this.accountService.getAccount(debitDetail.accountCode)?.name,
      creditAccount: creditDetail.accountCode,
      creditAccountName: this.accountService.getAccount(creditDetail.accountCode)?.name,
      auxiliaryCode: debitDetail.auxiliaryCode || creditDetail.auxiliaryCode,
      descriptionTemplate: this.createDescriptionTemplate(baseJournal.description)
    }
  }

  // 摘要のテンプレート化
  private createDescriptionTemplate(description: string): string {
    return description
      .replace(/\d{4}年\d{1,2}月/g, '${year}年${month}月')
      .replace(/\d{1,2}月分/g, '${month}月分')
      .replace(/\d+円/g, '${amount}円')
  }

  // キーワード抽出
  private extractKeywords(descriptions: string[]): string[] {
    const wordCount = new Map<string, number>()
    
    for (const desc of descriptions) {
      const words = desc
        .replace(/[、。・\s]/g, ' ')
        .split(' ')
        .filter(word => word.length > 1)
      
      for (const word of words) {
        wordCount.set(word, (wordCount.get(word) || 0) + 1)
      }
    }

    return Array.from(wordCount.entries())
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word, _]) => word)
  }

  // 金額範囲の計算
  private calculateAmountRange(journals: Journal[]): { min: number; max: number } {
    const amounts = journals.map(j => j.getTotalDebit())
    return {
      min: Math.min(...amounts) * 0.8,
      max: Math.max(...amounts) * 1.2
    }
  }

  // パターンのカテゴリ分類
  private categorizePattern(description: string): string {
    if (description.includes('管理費') || description.includes('修繕積立金')) return '収入'
    if (description.includes('清掃') || description.includes('管理員')) return '管理費用'
    if (description.includes('修繕') || description.includes('工事')) return '修繕費用'
    if (description.includes('水道') || description.includes('電気')) return '水道光熱費'
    return 'その他'
  }

  // LLMプロンプト用のパターンデータ生成
  generatePatternsForLLM(limit: number = 50): JournalPatternForLLM[] {
    const activePatterns = Array.from(this.patterns.values())
      .filter(p => p.metadata.isActive)
      .sort((a, b) => b.statistics.usageCount - a.statistics.usageCount)
      .slice(0, limit)

    return activePatterns.map(pattern => ({
      patternId: pattern.id,
      keywords: pattern.keywords,
      description: pattern.name,
      entries: this.convertJournalRuleToEntries(pattern.journalRule),
      frequency: pattern.statistics.usageCount,
      lastUsed: pattern.statistics.lastUsed || '',
      successRate: pattern.statistics.successRate,
      examples: this.getExampleDescriptions(pattern.id)
    }))
  }

  // 仕訳ルールをエントリ形式に変換
  private convertJournalRuleToEntries(rule: JournalPattern['journalRule']): JournalPatternForLLM['entries'] {
    const entries: JournalPatternForLLM['entries'] = []

    if (rule.debitAccount) {
      entries.push({
        debit: {
          account: rule.debitAccount,
          accountName: rule.debitAccountName || this.accountService.getAccount(rule.debitAccount)?.name || ''
        },
        auxiliaryCode: rule.auxiliaryCode
      })
    }

    if (rule.creditAccount) {
      entries.push({
        credit: {
          account: rule.creditAccount,
          accountName: rule.creditAccountName || this.accountService.getAccount(rule.creditAccount)?.name || ''
        }
      })
    }

    return entries
  }

  // パターンの使用例を取得
  private getExampleDescriptions(patternId: string): string[] {
    return Array.from(this.learningData.values())
      .filter(data => data.learning.patternId === patternId)
      .slice(0, 3)
      .map(data => data.originalDescription)
  }

  // 類似パターンの検索
  findSimilarPatterns(
    description: string, 
    amount?: number,
    threshold: number = 70
  ): PatternMatchResult[] {
    const results: PatternMatchResult[] = []
    const normalizedDesc = this.normalizeDescription(description)

    for (const pattern of this.patterns.values()) {
      if (!pattern.metadata.isActive) continue

      const similarity = this.calculatePatternSimilarity(
        normalizedDesc,
        amount,
        pattern
      )

      if (similarity >= threshold) {
        results.push({
          pattern,
          similarity,
          matchedFields: this.getMatchedFields(normalizedDesc, amount, pattern),
          confidence: similarity
        })
      }
    }

    return results.sort((a, b) => b.similarity - a.similarity)
  }

  // パターン類似度計算
  private calculatePatternSimilarity(
    description: string,
    amount: number | undefined,
    pattern: JournalPattern
  ): number {
    let score = 0

    // キーワードマッチング (50%)
    const matchedKeywords = pattern.keywords.filter(keyword =>
      description.includes(keyword)
    )
    score += (matchedKeywords.length / pattern.keywords.length) * 50

    // 金額範囲チェック (30%)
    if (amount && pattern.conditions.amountRange) {
      const { min, max } = pattern.conditions.amountRange
      if (amount >= min && amount <= max) {
        score += 30
      }
    }

    // 正規表現マッチング (20%)
    if (pattern.conditions.descriptionPattern) {
      try {
        const regex = new RegExp(pattern.conditions.descriptionPattern)
        if (regex.test(description)) {
          score += 20
        }
      } catch (e) {
        // 正規表現エラーは無視
      }
    }

    return Math.min(score, 100)
  }

  // マッチした項目の取得
  private getMatchedFields(
    description: string,
    amount: number | undefined,
    pattern: JournalPattern
  ): string[] {
    const matched: string[] = []

    // キーワードマッチ
    const matchedKeywords = pattern.keywords.filter(k => description.includes(k))
    if (matchedKeywords.length > 0) {
      matched.push(`keywords: ${matchedKeywords.join(', ')}`)
    }

    // 金額マッチ
    if (amount && pattern.conditions.amountRange) {
      const { min, max } = pattern.conditions.amountRange
      if (amount >= min && amount <= max) {
        matched.push(`amount: ${amount} (${min}-${max})`)
      }
    }

    return matched
  }

  // 新規パターンの学習
  learnFromUserApproval(
    transactionId: string,
    description: string,
    amount: number,
    appliedJournal: {
      debitAccount: string
      creditAccount: string
      division?: string
      auxiliaryCode?: string
    },
    patternId?: string,
    userModified: boolean = false
  ) {
    const learningData: JournalLearningData = {
      transactionId,
      originalDescription: description,
      amount,
      appliedJournal,
      learning: {
        wasAutoMatched: !!patternId,
        patternId,
        userApproved: true,
        userModified,
        timestamp: new Date().toISOString()
      }
    }

    this.learningData.set(transactionId, learningData)

    // 既存パターンの統計更新
    if (patternId) {
      this.updatePatternStatistics(patternId, !userModified)
    } else {
      // 新規パターンの候補として検討
      this.considerNewPattern(learningData)
    }

    this.saveToLocalStorage()
  }

  // パターン統計の更新
  private updatePatternStatistics(patternId: string, success: boolean) {
    const pattern = this.patterns.get(patternId)
    if (!pattern) return

    pattern.statistics.usageCount++
    pattern.statistics.successRate = 
      (pattern.statistics.successRate * (pattern.statistics.usageCount - 1) + 
       (success ? 100 : 0)) / pattern.statistics.usageCount
    pattern.statistics.lastModified = new Date().toISOString()

    this.patterns.set(patternId, pattern)
  }

  // 新規パターンの検討
  private considerNewPattern(learningData: JournalLearningData) {
    // 同様の取引が複数回確認されたら新規パターンとして登録
    const similarTransactions = Array.from(this.learningData.values())
      .filter(data => 
        !data.learning.patternId && 
        this.isSimilarTransaction(data, learningData)
      )

    if (similarTransactions.length >= 2) {
      this.createNewPatternFromLearningData(similarTransactions)
    }
  }

  // 類似取引の判定
  private isSimilarTransaction(data1: JournalLearningData, data2: JournalLearningData): boolean {
    // 仕訳内容が同じかチェック
    const journal1 = data1.appliedJournal
    const journal2 = data2.appliedJournal

    return journal1.debitAccount === journal2.debitAccount &&
           journal1.creditAccount === journal2.creditAccount &&
           Math.abs(data1.amount - data2.amount) / Math.max(data1.amount, data2.amount) < 0.2
  }

  // 学習データから新規パターンを作成
  private createNewPatternFromLearningData(learningDataList: JournalLearningData[]) {
    const first = learningDataList[0]
    if (!first) return

    const keywords = this.extractKeywords(
      learningDataList.map(data => data.originalDescription)
    )

    const pattern: JournalPattern = {
      id: `learned_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `学習パターン：${keywords.slice(0, 2).join('・')}`,
      keywords,
      conditions: {
        amountRange: {
          min: Math.min(...learningDataList.map(d => d.amount)) * 0.9,
          max: Math.max(...learningDataList.map(d => d.amount)) * 1.1
        },
        descriptionPattern: this.createDescriptionPattern(first.originalDescription)
      },
      journalRule: {
        debitAccount: first.appliedJournal.debitAccount,
        creditAccount: first.appliedJournal.creditAccount,
        division: first.appliedJournal.division,
        auxiliaryCode: first.appliedJournal.auxiliaryCode
      },
      statistics: {
        createdAt: new Date().toISOString(),
        usageCount: learningDataList.length,
        successRate: 100,
        lastUsed: learningDataList[learningDataList.length - 1].learning.timestamp,
        lastModified: new Date().toISOString()
      },
      metadata: {
        isSystemPattern: false,
        isActive: true,
        category: this.categorizePattern(first.originalDescription),
        notes: `${learningDataList.length}件の学習データから作成`
      }
    }

    this.patterns.set(pattern.id, pattern)

    // 学習データにパターンIDを設定
    for (const data of learningDataList) {
      data.learning.patternId = pattern.id
      this.learningData.set(data.transactionId, data)
    }
  }

  // パターンの説明文を生成
  private createDescriptionPattern(description: string): string {
    return description
      .replace(/\d+/g, '\\d+')
      .replace(/[()]/g, '\\$&')
  }

  // LocalStorage への保存
  private saveToLocalStorage() {
    const data = {
      patterns: Array.from(this.patterns.entries()),
      learningData: Array.from(this.learningData.entries())
    }
    localStorage.setItem('journalPatterns', JSON.stringify(data))
  }

  // LocalStorage からの読み込み
  private loadFromLocalStorage() {
    const stored = localStorage.getItem('journalPatterns')
    if (stored) {
      try {
        const data = JSON.parse(stored)
        if (data.patterns) {
          this.patterns = new Map(data.patterns)
        }
        if (data.learningData) {
          this.learningData = new Map(data.learningData)
        }
      } catch (e) {
        console.error('Failed to load journal patterns:', e)
      }
    }
  }

  // デバッグ用：パターン一覧を取得
  getAllPatterns(): JournalPattern[] {
    return Array.from(this.patterns.values())
  }

  // デバッグ用：学習データを取得
  getAllLearningData(): JournalLearningData[] {
    return Array.from(this.learningData.values())
  }
}