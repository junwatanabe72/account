/**
 * @file JournalService.ts
 * @description 仕訳管理サービス
 * 
 * 責務:
 * - 仕訳の作成、更新、削除
 * - 仕訳の検証（借方・貸方のバランスチェック）
 * - 仕訳の承認フロー管理（ドラフト→承認→転記）
 * - 勘定科目への転記処理
 * - 部門別会計の仕訳処理
 * 
 * ビジネスルール:
 * - 借方と貸方の合計額は必ず一致
 * - 転記済み仕訳は変更不可
 * - 仕訳日付は会計期間内
 * - 各仕訳明細は必ず勘定科目コードを持つ
 * - 部門別会計では部門コードが必須
 * 
 * アーキテクチャ上の位置: Domain層のコアサービス
 */

// ========================================
// 既存実装 - 段階的に JournalEntryService に置き換え中
// 新実装: JournalEntryService.ts を参照
// ========================================

import {
  JournalStatus,
  JournalData,
  CreateJournalOptions,
  CreateJournalResult
} from '../../../types'
import { 
  ACCOUNTING_CONSTANTS,
  JOURNAL_STATUS,
  ERROR_MESSAGES,
  ERROR_CODES
} from '../../../constants'
import { AccountService, HierarchicalAccount } from '../core/AccountService'
import { DivisionService } from '../core/DivisionService'
import { IJournalService, CreateJournalInput, CreateJournalOptions } from '../../interfaces/IJournalService'
import { IAccountService } from '../../interfaces/IAccountService'
import { IDivisionService } from '../../interfaces/IDivisionService'

export class JournalDetail {
  constructor(
    public accountCode: string,
    public debitAmount: number,
    public creditAmount: number,
    public description?: string,
    public auxiliaryCode?: string | null
  ) {}
  
  getAmount() { return this.debitAmount || this.creditAmount }
  isDebit() { return this.debitAmount > 0 }
}

export class Journal {
  id: string
  number = ''
  details: JournalDetail[] = []
  status: JournalStatus = 'DRAFT'
  createdAt = new Date()
  postedAt?: Date
  meta: Record<string, unknown> = {}
  division?: string
  
  constructor(public date: string, public description: string, reference = '', division?: string) {
    this.id = `j_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    if (reference) this.meta.reference = reference
    this.division = division
  }
  
  addDetail(d: JournalDetail) { this.details.push(d) }
  getTotalDebit() { return this.details.reduce((s, d) => s + d.debitAmount, 0) }
  getTotalCredit() { return this.details.reduce((s, d) => s + d.creditAmount, 0) }
  isBalanced() { return Math.abs(this.getTotalDebit() - this.getTotalCredit()) < ACCOUNTING_CONSTANTS.BALANCE_THRESHOLD }
  
  validate() {
    const errors: string[] = []
    if (!this.date) errors.push(ERROR_MESSAGES.JOURNAL_DATE_REQUIRED)
    if (!this.description) errors.push(ERROR_MESSAGES.JOURNAL_DESCRIPTION_REQUIRED)
    if (this.details.length === 0) errors.push(ERROR_MESSAGES.JOURNAL_DETAILS_REQUIRED)
    if (!this.isBalanced()) errors.push(ERROR_MESSAGES.JOURNAL_NOT_BALANCED)
    return errors
  }
}

export class JournalService implements IJournalService {
  journals: Journal[] = []
  
  constructor(
    private accountService: AccountService | IAccountService,
    private divisionService: DivisionService | IDivisionService
  ) {}
  
  createJournal(
    journalData: CreateJournalInput,
    options?: CreateJournalOptions & { meta?: Record<string, unknown> }
  ): CreateJournalResult {
    const journal = new Journal(journalData.date, journalData.description, journalData.reference || '', journalData.division)
    
    for (const d of journalData.details) {
      const account = this.accountService.getAccount(d.accountCode)
      if (!account) return { success: false, errors: [`勘定科目 ${d.accountCode} が見つかりません`] }
      if (!account.isActive) return { success: false, errors: [`勘定科目 ${d.accountCode} は無効です`] }
      
      journal.addDetail(new JournalDetail(
        d.accountCode, 
        d.debitAmount || 0, 
        d.creditAmount || 0, 
        d.description, 
        d.auxiliaryCode
      ))
    }
    
    const validationErrors = journal.validate()
    if (validationErrors.length > 0) return { success: false, errors: validationErrors }
    
    const divValidation = this.validateDivisionAccounting(journal)
    if (!divValidation.success) return divValidation
    
    if (options?.meta) Object.assign(journal.meta, options.meta)
    journal.number = `J${String(this.journals.length + 1).padStart(6, '0')}`
    this.journals.push(journal)
    
    if (options?.autoPost !== false) {
      return this.postJournal(journal)
    }
    
    return { success: true, journal: journal }
  }
  
  submitJournal(id: string): CreateJournalResult {
    const journal = this.journals.find(j => j.id === id)
    if (!journal) return { success: false, errors: [ERROR_MESSAGES.JOURNAL_NOT_FOUND] }
    if (journal.status !== 'DRAFT') return { success: false, errors: [ERROR_MESSAGES.JOURNAL_STATUS_INVALID] }
    journal.status = 'SUBMITTED'
    return { success: true, journal: journal }
  }
  
  approveJournal(id: string): CreateJournalResult {
    const journal = this.journals.find(j => j.id === id)
    if (!journal) return { success: false, errors: [ERROR_MESSAGES.JOURNAL_NOT_FOUND] }
    if (journal.status !== 'SUBMITTED') return { success: false, errors: [ERROR_MESSAGES.JOURNAL_STATUS_INVALID] }
    journal.status = 'APPROVED'
    return { success: true, journal: journal }
  }
  
  postJournalById(id: string): CreateJournalResult {
    const journal = this.journals.find(j => j.id === id)
    if (!journal) return { success: false, errors: [ERROR_MESSAGES.JOURNAL_NOT_FOUND] }
    if (journal.status === 'POSTED') return { success: false, errors: [ERROR_MESSAGES.JOURNAL_ALREADY_POSTED] }
    return this.postJournal(journal)
  }
  
  deleteJournal(id: string): CreateJournalResult {
    const idx = this.journals.findIndex(j => j.id === id)
    if (idx === -1) return { success: false, errors: [ERROR_MESSAGES.JOURNAL_NOT_FOUND] }
    const journal = this.journals[idx]
    if (!journal) return { success: false, errors: [ERROR_MESSAGES.JOURNAL_NOT_FOUND] }
    if (journal.status === 'POSTED') return { success: false, errors: [ERROR_MESSAGES.JOURNAL_POSTED_CANNOT_DELETE] }
    this.journals.splice(idx, 1)
    return { success: true }
  }
  
  updateJournal(id: string, data: { 
    date?: string, 
    description?: string, 
    reference?: string, 
    details?: Array<{ 
      accountCode: string, 
      debitAmount?: number, 
      creditAmount?: number, 
      description?: string, 
      auxiliaryCode?: string | null 
    }> 
  }): CreateJournalResult {
    const journalIndex = this.journals.findIndex(j => j.id === id)
    if (journalIndex === -1) return { success: false, errors: [ERROR_MESSAGES.JOURNAL_NOT_FOUND] }
    
    const journal = this.journals[journalIndex]
    if (!journal) return { success: false, errors: [ERROR_MESSAGES.JOURNAL_NOT_FOUND] }
    if (journal.status !== 'DRAFT') return { success: false, errors: [ERROR_MESSAGES.JOURNAL_NOT_EDITABLE] }
    
    if (data.date !== undefined) journal.date = data.date
    if (data.description !== undefined) journal.description = data.description
    if (data.reference !== undefined) journal.meta.reference = data.reference
    
    if (data.details) {
      journal.details = []
      for (const d of data.details) {
        journal.addDetail(new JournalDetail(d.accountCode, d.debitAmount || 0, d.creditAmount || 0, d.description, d.auxiliaryCode))
      }
    }
    
    const errors = journal.validate()
    if (errors.length > 0) return { success: false, errors }
    
    return { success: true, journal: journal }
  }
  
  validateDivisionAccounting(journal: Journal): CreateJournalResult {
    const divisionTotals = new Map<string, { debit: number, credit: number }>()
    
    for (const detail of journal.details) {
      const acc = this.accountService.getAccount(detail.accountCode)
      if (acc && acc.division) {
        if (!divisionTotals.has(acc.division)) divisionTotals.set(acc.division, { debit: 0, credit: 0 })
        const t = divisionTotals.get(acc.division)!
        t.debit += detail.debitAmount
        t.credit += detail.creditAmount
      }
    }
    
    const divisions = Array.from(divisionTotals.keys())
    if (divisions.length > 1) {
      for (let i = 0; i < divisions.length; i++) {
        for (let j = i + 1; j < divisions.length; j++) {
          const fromDivCode = divisions[i]
          const toDivCode = divisions[j]
          if (fromDivCode && toDivCode) {
            const fromDiv = this.divisionService.getDivision(fromDivCode)
            const tDiv = divisionTotals.get(toDivCode)!
            if (fromDiv) {
              const transferAmount = Math.max(tDiv.debit, tDiv.credit)
              if (!fromDiv.canTransferTo(toDivCode, transferAmount)) {
                return { success: false, errors: [`区分${fromDivCode}から${toDivCode}への振替制限を超えています`] }
              }
            }
          }
        }
      }
    }
    
    return { success: true }
  }
  
  postJournal(journal: Journal): CreateJournalResult {
    if (journal.status === 'POSTED') return { success: false, errors: [ERROR_MESSAGES.JOURNAL_ALREADY_POSTED] }
    
    for (const d of journal.details) {
      const acc = this.accountService.getAccount(d.accountCode)
      if (!acc) continue
      
      acc.addToBalance(d.getAmount(), d.isDebit())
      
      if (d.auxiliaryCode && acc.hasAuxiliary) {
        const aux = acc.getAuxiliaryLedger(d.auxiliaryCode)
        if (aux) aux.addTransaction(d.getAmount(), d.isDebit(), journal.id, journal.description)
      }
      
      if (acc.division) {
        const division = this.divisionService.getDivision(acc.division)
        if (division) {
          division.addTransaction(journal.id, journal.date, journal.description, d.getAmount(), d.isDebit(), acc.type)
        }
      }
    }
    
    journal.status = 'POSTED'
    journal.postedAt = new Date()
    return { success: true, journal: journal }
  }
  
  getJournals() {
    return this.journals
  }
  
  getJournal(id: string): Journal | undefined {
    return this.journals.find(j => j.id === id)
  }
  
  clearJournals() {
    this.journals = []
  }
}