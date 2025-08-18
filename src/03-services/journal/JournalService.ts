// Completely self-contained JournalService with no external dependencies

// Define all types directly in this file
export interface JournalDetail {
  id: string
  accountCode: string
  accountName: string
  debitAmount: number
  creditAmount: number
  description?: string
}

export interface Journal {
  id: string
  journalNumber: string
  date: string
  description: string
  division: 'KANRI' | 'SHUZEN'
  status: 'DRAFT' | 'POSTED' | 'CANCELLED'
  lines: JournalDetail[]
  createdAt: string
  updatedAt: string
  totalDebit: number
  totalCredit: number
  isBalanced: boolean
}

// JournalService implementation
export class JournalService {
  private static instance: JournalService
  private journals: Journal[] = []
  private nextId = 1

  private constructor() {}

  static getInstance(): JournalService {
    if (!JournalService.instance) {
      JournalService.instance = new JournalService()
    }
    return JournalService.instance
  }

  getJournals(): Journal[] {
    return this.journals
  }

  addJournal(journal: Journal): void {
    this.journals.push(journal)
  }

  clearJournals(): void {
    this.journals = []
  }
}