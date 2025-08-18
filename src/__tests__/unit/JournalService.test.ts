import { describe, it, expect, beforeEach } from 'vitest'
import { JournalService } from '../../domain/services/JournalService'
import { MockAccountService, MockDivisionService } from '../../domain/__mocks__'

describe('JournalService Unit Tests', () => {
  let journalService: JournalService
  let mockAccountService: MockAccountService
  let mockDivisionService: MockDivisionService
  
  beforeEach(() => {
    mockAccountService = new MockAccountService()
    mockDivisionService = new MockDivisionService()
    
    // モックサービスを初期化
    mockAccountService.initializeAccounts()
    mockDivisionService.initializeDivisions()
    
    // JournalServiceをモックサービスで作成
    journalService = new JournalService(mockAccountService, mockDivisionService)
  })
  
  describe('createJournal', () => {
    it('should create a journal with valid data', () => {
      const journalData = {
        date: '2024-01-01',
        description: 'テスト仕訳',
        details: [
          { accountCode: '1101', debitAmount: 1000 },
          { accountCode: '4111', creditAmount: 1000 }
        ]
      }
      
      const result = journalService.createJournal(journalData)
      
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.description).toBe('テスト仕訳')
      expect(result.data?.status).toBe('POSTED')
    })
    
    it('should fail when account code does not exist', () => {
      const journalData = {
        date: '2024-01-01',
        description: 'テスト仕訳',
        details: [
          { accountCode: '9999', debitAmount: 1000 },  // 存在しない勘定科目
          { accountCode: '4111', creditAmount: 1000 }
        ]
      }
      
      const result = journalService.createJournal(journalData)
      
      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors?.[0]).toContain('9999')
    })
    
    it('should fail when journal is not balanced', () => {
      const journalData = {
        date: '2024-01-01',
        description: 'テスト仕訳',
        details: [
          { accountCode: '1101', debitAmount: 1000 },
          { accountCode: '4111', creditAmount: 500 }  // アンバランス
        ]
      }
      
      const result = journalService.createJournal(journalData)
      
      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors?.[0]).toBeDefined()
    })
  })
  
  describe('Journal Status Management', () => {
    it('should submit a draft journal', () => {
      const journalData = {
        date: '2024-01-01',
        description: 'テスト仕訳',
        details: [
          { accountCode: '1101', debitAmount: 1000 },
          { accountCode: '4111', creditAmount: 1000 }
        ]
      }
      
      // autoPost: false でドラフト作成
      const createResult = journalService.createJournal(journalData, { autoPost: false })
      expect(createResult.success).toBe(true)
      
      const journalId = createResult.data?.id
      expect(journalId).toBeDefined()
      
      // 提出
      const submitResult = journalService.submitJournal(journalId!)
      expect(submitResult.success).toBe(true)
      expect(submitResult.data?.status).toBe('SUBMITTED')
    })
    
    it('should approve a submitted journal', () => {
      const journalData = {
        date: '2024-01-01',
        description: 'テスト仕訳',
        details: [
          { accountCode: '1101', debitAmount: 1000 },
          { accountCode: '4111', creditAmount: 1000 }
        ]
      }
      
      const createResult = journalService.createJournal(journalData, { autoPost: false })
      const journalId = createResult.data?.id!
      
      journalService.submitJournal(journalId)
      const approveResult = journalService.approveJournal(journalId)
      
      expect(approveResult.success).toBe(true)
      expect(approveResult.data?.status).toBe('APPROVED')
    })
  })
  
  describe('getJournals', () => {
    it('should return all created journals', () => {
      // 複数の仕訳を作成
      const journalData1 = {
        date: '2024-01-01',
        description: '仕訳1',
        details: [
          { accountCode: '1101', debitAmount: 1000 },
          { accountCode: '4111', creditAmount: 1000 }
        ]
      }
      
      const journalData2 = {
        date: '2024-01-02',
        description: '仕訳2',
        details: [
          { accountCode: '1101', debitAmount: 2000 },
          { accountCode: '4111', creditAmount: 2000 }
        ]
      }
      
      journalService.createJournal(journalData1)
      journalService.createJournal(journalData2)
      
      const journals = journalService.getJournals()
      
      expect(journals).toHaveLength(2)
      expect(journals[0].description).toBe('仕訳1')
      expect(journals[1].description).toBe('仕訳2')
    })
  })
})