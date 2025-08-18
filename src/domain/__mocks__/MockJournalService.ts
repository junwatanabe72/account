import { IJournalService } from '../interfaces/IJournalService'
import { Journal } from '../services/JournalService'
import { CreateJournalResult } from '../../types'

export class MockJournalService implements IJournalService {
  private mockJournals: Journal[] = []
  private nextJournalId = 1
  
  get journals(): Journal[] {
    return this.mockJournals
  }
  
  getJournals(): Journal[] {
    return this.mockJournals
  }
  
  getJournal(id: string): Journal | undefined {
    return this.mockJournals.find(j => j.id === id)
  }
  
  createJournal(journalData: any, options?: any): CreateJournalResult {
    const journal = new Journal(
      journalData.date,
      journalData.description,
      journalData.reference
    )
    
    journal.id = `mock_journal_${this.nextJournalId++}`
    journal.number = `J${String(this.mockJournals.length + 1).padStart(6, '0')}`
    
    // 詳細を追加
    if (journalData.details) {
      for (const detail of journalData.details) {
        journal.details.push({
          accountCode: detail.accountCode,
          debitAmount: detail.debitAmount || 0,
          creditAmount: detail.creditAmount || 0,
          description: detail.description,
          auxiliaryCode: detail.auxiliaryCode,
          getAmount: () => detail.debitAmount || detail.creditAmount || 0,
          isDebit: () => (detail.debitAmount || 0) > 0
        } as any)
      }
    }
    
    // オプションでautoPostが指定されている場合
    if (options?.autoPost) {
      journal.status = 'POSTED'
      journal.postedAt = new Date()
    }
    
    this.mockJournals.push(journal)
    
    return {
      success: true,
      data: journal
    }
  }
  
  submitJournal(id: string): CreateJournalResult {
    const journal = this.getJournal(id)
    if (!journal) {
      return { success: false, errors: ['Journal not found'] }
    }
    journal.status = 'SUBMITTED'
    return { success: true, data: journal }
  }
  
  approveJournal(id: string): CreateJournalResult {
    const journal = this.getJournal(id)
    if (!journal) {
      return { success: false, errors: ['Journal not found'] }
    }
    journal.status = 'APPROVED'
    return { success: true, data: journal }
  }
  
  postJournalById(id: string): CreateJournalResult {
    const journal = this.getJournal(id)
    if (!journal) {
      return { success: false, errors: ['Journal not found'] }
    }
    journal.status = 'POSTED'
    journal.postedAt = new Date()
    return { success: true, data: journal }
  }
  
  deleteJournal(id: string): CreateJournalResult {
    const index = this.mockJournals.findIndex(j => j.id === id)
    if (index === -1) {
      return { success: false, errors: ['Journal not found'] }
    }
    this.mockJournals.splice(index, 1)
    return { success: true }
  }
  
  updateJournal(id: string, data: any): CreateJournalResult {
    const journal = this.getJournal(id)
    if (!journal) {
      return { success: false, errors: ['Journal not found'] }
    }
    
    if (data.date) journal.date = data.date
    if (data.description) journal.description = data.description
    
    return { success: true, data: journal }
  }
  
  clearJournals(): void {
    this.mockJournals = []
  }
  
  // テスト用ヘルパーメソッド
  addMockJournal(journal: Journal): void {
    this.mockJournals.push(journal)
  }
  
  setJournalStatus(id: string, status: any): void {
    const journal = this.getJournal(id)
    if (journal) {
      journal.status = status
    }
  }
}