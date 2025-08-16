/**
 * 仕訳サービス
 * 仕訳の作成・検証・計算ロジックを集約
 */

import {
  UnifiedJournal,
  JournalInput,
  JournalValidation,
  JournalLine,
  JournalStatus,
  JournalFilter,
  JournalSort,
  AccountSummary
} from '../types/journal'

export class JournalService {
  private static instance: JournalService
  private journalCounter: number = 1

  static getInstance(): JournalService {
    if (!JournalService.instance) {
      JournalService.instance = new JournalService()
    }
    return JournalService.instance
  }

  /**
   * 仕訳を作成
   */
  createJournal(input: JournalInput): UnifiedJournal {
    const now = new Date().toISOString()
    const lines = this.createJournalLines(input.lines)
    const { totalDebit, totalCredit } = this.calculateTotals(lines)
    
    return {
      id: this.generateId(),
      journalNumber: this.generateJournalNumber(),
      date: input.date,
      description: input.description,
      division: input.division,
      status: 'DRAFT',
      lines,
      tags: input.tags || [],
      createdAt: now,
      updatedAt: now,
      totalDebit,
      totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01
    }
  }

  /**
   * 仕訳の検証
   */
  validateJournal(journal: JournalInput | UnifiedJournal): JournalValidation {
    const errors: JournalValidation['errors'] = []
    const warnings: JournalValidation['warnings'] = []

    // 日付チェック
    if (!journal.date) {
      errors.push({ field: 'date', message: '日付は必須です' })
    }

    // 摘要チェック
    if (!journal.description?.trim()) {
      errors.push({ field: 'description', message: '摘要は必須です' })
    }

    // 明細行チェック
    if (!journal.lines || journal.lines.length === 0) {
      errors.push({ field: 'lines', message: '仕訳明細が必要です' })
    } else {
      // 各明細行の検証
      journal.lines.forEach((line, index) => {
        if (!line.accountCode) {
          errors.push({ 
            field: `lines[${index}].accountCode`, 
            message: `${index + 1}行目: 勘定科目コードは必須です` 
          })
        }
        
        if (line.debitAmount < 0 || line.creditAmount < 0) {
          errors.push({ 
            field: `lines[${index}]`, 
            message: `${index + 1}行目: 金額は0以上である必要があります` 
          })
        }
        
        if (line.debitAmount > 0 && line.creditAmount > 0) {
          errors.push({ 
            field: `lines[${index}]`, 
            message: `${index + 1}行目: 借方と貸方の両方に金額を入力することはできません` 
          })
        }
        
        if (line.debitAmount === 0 && line.creditAmount === 0) {
          errors.push({ 
            field: `lines[${index}]`, 
            message: `${index + 1}行目: 借方または貸方に金額を入力してください` 
          })
        }
      })
    }

    // 貸借チェック
    const totals = this.calculateTotals(journal.lines)
    if (Math.abs(totals.totalDebit - totals.totalCredit) >= 0.01) {
      errors.push({ 
        message: `貸借が一致しません (借方: ${totals.totalDebit}, 貸方: ${totals.totalCredit})` 
      })
    }

    // 警告チェック
    if (journal.lines.length > 10) {
      warnings.push({ 
        message: '仕訳明細が多数あります。内容を確認してください。' 
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    }
  }

  /**
   * 合計金額を計算
   */
  calculateTotals(lines: JournalLine[] | Omit<JournalLine, 'id'>[]): {
    totalDebit: number
    totalCredit: number
  } {
    const totalDebit = lines.reduce((sum, line) => sum + (line.debitAmount || 0), 0)
    const totalCredit = lines.reduce((sum, line) => sum + (line.creditAmount || 0), 0)
    return { totalDebit, totalCredit }
  }

  /**
   * 仕訳明細行の作成
   */
  private createJournalLines(inputLines: Omit<JournalLine, 'id'>[]): JournalLine[] {
    return inputLines.map((line, index) => ({
      ...line,
      id: `line_${Date.now()}_${index}`
    }))
  }

  /**
   * 仕訳のフィルタリング
   */
  filterJournals(journals: UnifiedJournal[], filter: JournalFilter): UnifiedJournal[] {
    return journals.filter(journal => {
      // ステータスフィルター
      if (filter.status && journal.status !== filter.status) {
        return false
      }

      // 会計区分フィルター
      if (filter.division && journal.division !== filter.division) {
        return false
      }

      // 日付範囲フィルター
      if (filter.dateFrom && journal.date < filter.dateFrom) {
        return false
      }
      if (filter.dateTo && journal.date > filter.dateTo) {
        return false
      }

      // 勘定科目フィルター
      if (filter.accountCode) {
        const hasAccount = journal.lines.some(line => line.accountCode === filter.accountCode)
        if (!hasAccount) return false
      }

      // 金額範囲フィルター
      if (filter.amountMin !== undefined) {
        if (journal.totalDebit < filter.amountMin && journal.totalCredit < filter.amountMin) {
          return false
        }
      }
      if (filter.amountMax !== undefined) {
        if (journal.totalDebit > filter.amountMax && journal.totalCredit > filter.amountMax) {
          return false
        }
      }

      // タグフィルター
      if (filter.tags && filter.tags.length > 0) {
        const hasAllTags = filter.tags.every(tag => journal.tags?.includes(tag))
        if (!hasAllTags) return false
      }

      // テキスト検索
      if (filter.searchText) {
        const searchLower = filter.searchText.toLowerCase()
        const inDescription = journal.description.toLowerCase().includes(searchLower)
        const inLines = journal.lines.some(line => 
          line.accountName?.toLowerCase().includes(searchLower) ||
          line.description?.toLowerCase().includes(searchLower)
        )
        if (!inDescription && !inLines) return false
      }

      return true
    })
  }

  /**
   * 仕訳のソート
   */
  sortJournals(journals: UnifiedJournal[], sort: JournalSort): UnifiedJournal[] {
    const sorted = [...journals]
    
    sorted.sort((a, b) => {
      let comparison = 0
      
      switch (sort.field) {
        case 'date':
          comparison = a.date.localeCompare(b.date)
          break
        case 'journalNumber':
          comparison = a.journalNumber.localeCompare(b.journalNumber)
          break
        case 'amount':
          comparison = a.totalDebit - b.totalDebit
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
        case 'createdAt':
          comparison = a.createdAt.localeCompare(b.createdAt)
          break
      }
      
      return sort.direction === 'asc' ? comparison : -comparison
    })
    
    return sorted
  }

  /**
   * 勘定科目別集計
   */
  summarizeByAccount(journals: UnifiedJournal[]): AccountSummary[] {
    const summaryMap = new Map<string, AccountSummary>()
    
    journals.forEach(journal => {
      if (journal.status !== 'POSTED') return
      
      journal.lines.forEach(line => {
        const existing = summaryMap.get(line.accountCode) || {
          accountCode: line.accountCode,
          accountName: line.accountName,
          debitTotal: 0,
          creditTotal: 0,
          balance: 0,
          transactionCount: 0
        }
        
        existing.debitTotal += line.debitAmount
        existing.creditTotal += line.creditAmount
        existing.balance = existing.debitTotal - existing.creditTotal
        existing.transactionCount += 1
        
        summaryMap.set(line.accountCode, existing)
      })
    })
    
    return Array.from(summaryMap.values())
  }

  /**
   * ID生成
   */
  private generateId(): string {
    return `journal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 仕訳番号生成
   */
  private generateJournalNumber(): string {
    const number = this.journalCounter++
    return `J${String(number).padStart(6, '0')}`
  }

  /**
   * 仕訳番号カウンターをリセット
   */
  resetJournalCounter(startFrom: number = 1): void {
    this.journalCounter = startFrom
  }
}