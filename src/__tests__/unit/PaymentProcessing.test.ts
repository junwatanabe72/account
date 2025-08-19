import { describe, it, expect, beforeEach } from 'vitest'
import { JournalGenerationEngine } from '../../domain/services/transaction/JournalGenerationEngine'
import { AccountService } from '../../domain/services/core/AccountService'
import { Transaction } from '../../types/transaction'

describe('PaymentProcessing', () => {
  let engine: JournalGenerationEngine
  let accountService: AccountService

  beforeEach(() => {
    accountService = new AccountService()
    accountService.initializeAccounts()
    engine = new JournalGenerationEngine(accountService)
  })

  describe('未決済取引の仕訳生成', () => {
    it('管理費収入（未決済）は管理費未収金を計上する', () => {
      const transaction: Transaction = {
        id: 't_001',
        type: 'income',
        occurredOn: '2025-08-19',
        accountCode: '5101', // 管理費収入
        amount: 10000,
        status: 'unpaid',
        divisionCode: 'KANRI',
        createdAt: new Date()
      }

      const journal = engine.generateJournal(transaction)
      
      expect(journal.details).toHaveLength(2)
      // 借方：管理費未収金
      expect(journal.details[0].accountCode).toBe('1301')
      expect(journal.details[0].debitAmount).toBe(10000)
      // 貸方：管理費収入
      expect(journal.details[1].accountCode).toBe('5101')
      expect(journal.details[1].creditAmount).toBe(10000)
    })

    it('修繕積立金収入（未決済）は修繕積立金未収金を計上する', () => {
      const transaction: Transaction = {
        id: 't_002',
        type: 'income',
        occurredOn: '2025-08-19',
        accountCode: '5201', // 修繕積立金収入
        amount: 15000,
        status: 'unpaid',
        divisionCode: 'SHUZEN',
        createdAt: new Date()
      }

      const journal = engine.generateJournal(transaction)
      
      expect(journal.details).toHaveLength(2)
      // 借方：修繕積立金未収金
      expect(journal.details[0].accountCode).toBe('1302')
      expect(journal.details[0].debitAmount).toBe(15000)
      // 貸方：修繕積立金収入
      expect(journal.details[1].accountCode).toBe('5201')
      expect(journal.details[1].creditAmount).toBe(15000)
    })

    it('費用（未決済）は未払金を計上する', () => {
      const transaction: Transaction = {
        id: 't_003',
        type: 'expense',
        occurredOn: '2025-08-19',
        accountCode: '6101', // 管理委託費
        amount: 50000,
        status: 'unpaid',
        divisionCode: 'KANRI',
        createdAt: new Date()
      }

      const journal = engine.generateJournal(transaction)
      
      expect(journal.details).toHaveLength(2)
      // 借方：管理委託費
      expect(journal.details[0].accountCode).toBe('6101')
      expect(journal.details[0].debitAmount).toBe(50000)
      // 貸方：未払金
      expect(journal.details[1].accountCode).toBe('2101')
      expect(journal.details[1].creditAmount).toBe(50000)
    })
  })

  describe('決済処理の仕訳生成', () => {
    it('管理費収入の決済時は管理費未収金を消し込む', () => {
      const transaction: Transaction = {
        id: 't_004',
        type: 'income',
        occurredOn: '2025-08-19',
        accountCode: '5101', // 管理費収入
        amount: 10000,
        status: 'unpaid',
        divisionCode: 'KANRI',
        createdAt: new Date()
      }

      const paymentJournal = engine.generatePaymentJournal(transaction, '1102') // 普通預金（管理）
      
      expect(paymentJournal.details).toHaveLength(2)
      // 借方：普通預金
      expect(paymentJournal.details[0].accountCode).toBe('1102')
      expect(paymentJournal.details[0].debitAmount).toBe(10000)
      // 貸方：管理費未収金
      expect(paymentJournal.details[1].accountCode).toBe('1301')
      expect(paymentJournal.details[1].creditAmount).toBe(10000)
    })

    it('費用の決済時は未払金を消し込む', () => {
      const transaction: Transaction = {
        id: 't_005',
        type: 'expense',
        occurredOn: '2025-08-19',
        accountCode: '6101', // 管理委託費
        amount: 50000,
        status: 'unpaid',
        divisionCode: 'KANRI',
        createdAt: new Date()
      }

      const paymentJournal = engine.generatePaymentJournal(transaction, '1102') // 普通預金（管理）
      
      expect(paymentJournal.details).toHaveLength(2)
      // 借方：未払金
      expect(paymentJournal.details[0].accountCode).toBe('2101')
      expect(paymentJournal.details[0].debitAmount).toBe(50000)
      // 貸方：普通預金
      expect(paymentJournal.details[1].accountCode).toBe('1102')
      expect(paymentJournal.details[1].creditAmount).toBe(50000)
    })
  })
})