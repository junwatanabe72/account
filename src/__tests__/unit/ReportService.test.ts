import { describe, it, expect, beforeEach } from 'vitest'
import { ReportService } from '../../domain/services/reporting/ReportService'
import { MockAccountService, MockJournalService, MockDivisionService } from '../../domain/__mocks__'
import { Journal } from '../../domain/services/core/JournalService'

describe('ReportService Unit Tests', () => {
  let reportService: ReportService
  let mockAccountService: MockAccountService
  let mockJournalService: MockJournalService
  let mockDivisionService: MockDivisionService
  
  beforeEach(() => {
    mockAccountService = new MockAccountService()
    mockJournalService = new MockJournalService()
    mockDivisionService = new MockDivisionService()
    
    // モックサービスを初期化
    mockAccountService.initializeAccounts()
    mockDivisionService.initializeDivisions()
    
    // ReportServiceをモックサービスで作成
    reportService = new ReportService(
      mockAccountService,
      mockJournalService,
      mockDivisionService
    )
  })
  
  describe('getTrialBalance', () => {
    it('should return empty trial balance when no transactions', () => {
      const trialBalance = reportService.getTrialBalance()
      
      expect(trialBalance).toBeDefined()
      expect(trialBalance.entries).toHaveLength(0)
      expect(trialBalance.totalDebit).toBe(0)
      expect(trialBalance.totalCredit).toBe(0)
    })
    
    it('should calculate trial balance with account balances', () => {
      // アカウントにバランスを設定
      mockAccountService.setAccountBalance('1101', 1000)  // 現金（借方）
      mockAccountService.setAccountBalance('4111', -1000) // 管理費収入（貸方）
      
      // モックアカウントを更新してバランスを反映
      const cashAccount = mockAccountService.getAccount('1101')
      const revenueAccount = mockAccountService.getAccount('4111')
      
      if (cashAccount) {
        cashAccount.balance = 1000
        cashAccount.getDisplayBalance = () => 1000
        cashAccount.isDebitBalance = () => true
      }
      
      if (revenueAccount) {
        revenueAccount.balance = -1000
        revenueAccount.getDisplayBalance = () => 1000
        revenueAccount.isDebitBalance = () => false
      }
      
      const trialBalance = reportService.getTrialBalance()
      
      expect(trialBalance.entries).toHaveLength(2)
      expect(trialBalance.totalDebit).toBe(1000)
      expect(trialBalance.totalCredit).toBe(1000)
    })
  })
  
  describe('getIncomeStatement', () => {
    it('should return empty income statement when no transactions', () => {
      const incomeStatement = reportService.getIncomeStatement()
      
      expect(incomeStatement).toBeDefined()
      expect(incomeStatement.revenues).toHaveLength(0)
      expect(incomeStatement.expenses).toHaveLength(0)
      expect(incomeStatement.totalRevenue).toBe(0)
      expect(incomeStatement.totalExpense).toBe(0)
      expect(incomeStatement.netIncome).toBe(0)
    })
    
    it('should calculate income statement with revenues and expenses', () => {
      // 収益と費用のモックアカウントを追加
      mockAccountService.addMockAccount({
        code: '5111',
        name: '管理委託費',
        type: 'EXPENSE',
        normalBalance: 'DEBIT',
        balance: 500,
        isActive: true,
        isDebitBalance: () => true,
        getDisplayBalance: () => 500,
        addToBalance: () => {},
        getAuxiliaryLedger: () => undefined,
        hasAuxiliary: false
      } as any)
      
      const revenueAccount = mockAccountService.getAccount('4111')
      if (revenueAccount) {
        revenueAccount.balance = -1000
        revenueAccount.getDisplayBalance = () => 1000
      }
      
      const incomeStatement = reportService.getIncomeStatement()
      
      expect(incomeStatement.revenues).toHaveLength(1)
      expect(incomeStatement.expenses).toHaveLength(1)
      expect(incomeStatement.totalRevenue).toBe(1000)
      expect(incomeStatement.totalExpense).toBe(500)
      expect(incomeStatement.netIncome).toBe(500)
    })
  })
  
  describe('getBalanceSheet', () => {
    it('should return balanced balance sheet', () => {
      // 資産、負債、資本のモックアカウントを設定
      const cashAccount = mockAccountService.getAccount('1101')
      if (cashAccount) {
        cashAccount.balance = 1000
        cashAccount.getDisplayBalance = () => 1000
        cashAccount.normalBalance = 'DEBIT'
      }
      
      // 資本のモックアカウントを追加
      mockAccountService.addMockAccount({
        code: '4101',
        name: '繰越剰余金',
        type: 'EQUITY',
        normalBalance: 'CREDIT',
        balance: -1000,
        isActive: true,
        isDebitBalance: () => false,
        getDisplayBalance: () => 1000,
        addToBalance: () => {},
        getAuxiliaryLedger: () => undefined,
        hasAuxiliary: false
      } as any)
      
      const balanceSheet = reportService.getBalanceSheet()
      
      expect(balanceSheet).toBeDefined()
      expect(balanceSheet.assets).toHaveLength(1)
      expect(balanceSheet.equity).toHaveLength(1)
      expect(balanceSheet.totalAssets).toBe(1000)
      expect(balanceSheet.totalEquity).toBe(1000)
      expect(balanceSheet.isBalanced).toBe(true)
    })
  })
  
  describe('getIncomeDetails', () => {
    it('should return income details for date range', () => {
      // 仕訳を追加
      const journal = new Journal('2024-01-15', '管理費収入')
      journal.id = 'test-journal-1'
      journal.status = 'POSTED'
      journal.details = [
        {
          accountCode: '1101',
          debitAmount: 1000,
          creditAmount: 0,
          getAmount: () => 1000,
          isDebit: () => true
        } as any,
        {
          accountCode: '4111',
          debitAmount: 0,
          creditAmount: 1000,
          getAmount: () => 1000,
          isDebit: () => false
        } as any
      ]
      
      mockJournalService.addMockJournal(journal)
      
      const details = reportService.getIncomeDetails('2024-01-01', '2024-01-31')
      
      expect(details).toBeDefined()
      expect(details).toHaveLength(1)
      expect(details[0].accountCode).toBe('4111')
      expect(details[0].amount).toBe(1000)
    })
  })
})