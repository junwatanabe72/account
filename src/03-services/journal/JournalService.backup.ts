// Import types directly from journal.ts to avoid circular dependency
import { 
  UnifiedJournal, 
  JournalLine,
  JournalInput, 
  JournalValidation,
  JournalFilter,
  JournalSort
} from '../../01-types/journal'
import { AccountSummary } from '../../01-types/accounting'

// Re-export types for compatibility
export type Journal = UnifiedJournal
export type JournalDetail = JournalLine

export class JournalService {
  private static instance: JournalService
  private journals: UnifiedJournal[] = []
  private nextId = 1

  private constructor() {}

  static getInstance(): JournalService {
    if (!JournalService.instance) {
      JournalService.instance = new JournalService()
    }
    return JournalService.instance
  }

  validateJournal(input: Partial<UnifiedJournal>): JournalValidation {
    const errors: { field?: string; message: string }[] = []
    
    if (!input.date) {
      errors.push({ field: 'date', message: '日付は必須です' })
    }
    
    if (!input.description?.trim()) {
      errors.push({ field: 'description', message: '摘要は必須です' })
    }
    
    if (!input.lines || input.lines.length === 0) {
      errors.push({ field: 'lines', message: '明細行は1つ以上必要です' })
    } else {
      const totalDebit = input.lines.reduce((sum, line) => sum + (line.debitAmount || 0), 0)
      const totalCredit = input.lines.reduce((sum, line) => sum + (line.creditAmount || 0), 0)
      
      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        errors.push({ message: '借方・貸方の合計が一致しません' })
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  createJournal(input: JournalInput): UnifiedJournal {
    const lines: JournalLine[] = input.lines.map((line, index) => ({
      id: `line-${this.nextId}-${index}`,
      accountCode: line.accountCode,
      accountName: line.accountName || '',
      debitAmount: line.debitAmount || 0,
      creditAmount: line.creditAmount || 0,
      description: line.description
    }))

    const totalDebit = lines.reduce((sum, line) => sum + line.debitAmount, 0)
    const totalCredit = lines.reduce((sum, line) => sum + line.creditAmount, 0)
    
    const journal: UnifiedJournal = {
      id: `journal-${this.nextId++}`,
      journalNumber: `J${String(this.nextId).padStart(6, '0')}`,
      date: input.date,
      description: input.description,
      division: input.division,
      status: 'DRAFT',
      lines,
      tags: input.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalDebit,
      totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01
    }
    
    this.journals.push(journal)
    return journal
  }

  calculateTotals(lines: Partial<JournalLine>[]): { totalDebit: number; totalCredit: number; isBalanced: boolean } {
    const totalDebit = lines.reduce((sum, line) => sum + (line.debitAmount || 0), 0)
    const totalCredit = lines.reduce((sum, line) => sum + (line.creditAmount || 0), 0)
    return {
      totalDebit,
      totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01
    }
  }

  filterJournals(journals: UnifiedJournal[], filter: JournalFilter): UnifiedJournal[] {
    return journals.filter(journal => {
      if (filter.status && journal.status !== filter.status) return false
      if (filter.division && journal.division !== filter.division) return false
      if (filter.dateFrom && journal.date < filter.dateFrom) return false
      if (filter.dateTo && journal.date > filter.dateTo) return false
      if (filter.searchText) {
        const search = filter.searchText.toLowerCase()
        if (!journal.description.toLowerCase().includes(search) &&
            !journal.lines.some(line => line.accountName.toLowerCase().includes(search))) {
          return false
        }
      }
      return true
    })
  }

  sortJournals(journals: UnifiedJournal[], sort: JournalSort): UnifiedJournal[] {
    return [...journals].sort((a, b) => {
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
      
      return sort.direction === 'desc' ? -comparison : comparison
    })
  }

  summarizeByAccount(journals: UnifiedJournal[]): AccountSummary[] {
    const summaries = new Map<string, AccountSummary>()
    
    journals.forEach(journal => {
      journal.lines.forEach(line => {
        const existing = summaries.get(line.accountCode) || {
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
        existing.transactionCount++
        
        summaries.set(line.accountCode, existing)
      })
    })
    
    return Array.from(summaries.values())
  }

  clearJournals(): void {
    this.journals = []
    this.nextId = 1
  }

  getAllJournals(): UnifiedJournal[] {
    return [...this.journals]
  }

  getJournalById(id: string): UnifiedJournal | undefined {
    return this.journals.find(j => j.id === id)
  }

  updateJournal(id: string, updates: Partial<UnifiedJournal>): boolean {
    const index = this.journals.findIndex(j => j.id === id)
    if (index === -1) return false
    
    this.journals[index] = {
      ...this.journals[index],
      ...updates,
      updatedAt: new Date().toISOString()
    }
    
    return true
  }

  deleteJournal(id: string): boolean {
    const index = this.journals.findIndex(j => j.id === id)
    if (index === -1) return false
    
    this.journals.splice(index, 1)
    return true
  }
}

// Re-export types for convenience
export type { UnifiedJournal, JournalInput, JournalValidation, JournalFilter, JournalSort, JournalLine, AccountSummary }

