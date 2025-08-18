import {
  ImportJson,
  ExportJson,
  UnitOwner,
  Vendor
} from '../../types'
import { AccountService } from './AccountService'
import { JournalService } from './JournalService'
import { DivisionService } from './DivisionService'
import { AuxiliaryService } from './AuxiliaryService'
import { IAccountService } from '../interfaces/IAccountService'
import { IJournalService } from '../interfaces/IJournalService'
import { IDivisionService } from '../interfaces/IDivisionService'

export class ImportExportService {
  constructor(
    private accountService: AccountService | IAccountService,
    private journalService: JournalService | IJournalService,
    private divisionService: DivisionService | IDivisionService,
    private auxiliaryService: AuxiliaryService
  ) {}
  
  serialize(): ExportJson {
    return {
      version: '1.0',
      exportDate: new Date().toISOString(),
      unitOwners: this.auxiliaryService.getUnitOwners(),
      vendors: this.auxiliaryService.getVendors(),
      journals: this.journalService.getJournals().map(j => ({
        date: j.date,
        description: j.description,
        reference: j.meta.reference,
        details: j.details.map(d => ({
          accountCode: d.accountCode,
          debitAmount: d.debitAmount || undefined,
          creditAmount: d.creditAmount || undefined,
          description: d.description,
          auxiliaryCode: d.auxiliaryCode
        })),
        status: j.status,
        number: j.number
      }))
    }
  }
  
  restore(data: any) {
    if (!data || typeof data !== 'object') return
    
    this.accountService.clearAccounts()
    this.journalService.clearJournals()
    this.divisionService.clearDivisions()
    this.auxiliaryService.clearAuxiliaries()
    
    this.accountService.initializeAccounts()
    this.divisionService.initializeDivisions()
    
    if (data.unitOwners) {
      this.auxiliaryService.setUnitOwners(data.unitOwners)
    }
    if (data.vendors) {
      this.auxiliaryService.setVendors(data.vendors)
    }
    
    this.auxiliaryService.createUnitOwnerAuxiliaryAccounts(this.accountService)
    
    if (data.journals && Array.isArray(data.journals)) {
      for (const j of data.journals) {
        const res = this.journalService.createJournal(j, { autoPost: false })
        if (res.success && res.data) {
          const journal = res.data
          if (j.status && j.status !== 'POSTED') {
            if (j.status === 'SUBMITTED') this.journalService.submitJournal(journal.id)
            if (j.status === 'APPROVED') this.journalService.approveJournal(journal.id)
          } else {
            this.journalService.postJournalById(journal.id)
          }
        }
      }
    }
  }
  
  importJsonData(json: ImportJson) {
    try {
      const results: Array<{ index: number, success: boolean, error?: string }> = []
      
      if (json.clearExisting) {
        this.journalService.clearJournals()
        this.accountService.rebuildAuxiliaryAccounts()
        for (const acc of this.accountService.getAccounts()) {
          acc.balance = 0
        }
      }
      
      if (json.unitOwners) {
        const validOwners = json.unitOwners.filter(o => o.unitNumber && o.ownerName)
        this.auxiliaryService.setUnitOwners(validOwners)
        this.auxiliaryService.createUnitOwnerAuxiliaryAccounts(this.accountService)
      }
      
      if (json.vendors) {
        const validVendors = json.vendors.filter(v => v.code && v.name)
        this.auxiliaryService.setVendors(validVendors)
      }
      
      if (json.openingBalances && json.openingBalances.length > 0) {
        const firstBalance = json.openingBalances[0]
        const openingDate = firstBalance?.date ?? new Date().toISOString().split('T')[0] ?? ''
        const ob = this.createOpeningBalance(
          openingDate || new Date().toISOString().split('T')[0] || '',
          json.openingBalances
        )
        if (!ob.success) {
          results.push({ index: -1, success: false, error: ob.errors?.join(', ') })
        }
      }
      
      if (json.journals) {
        json.journals.forEach((j, idx) => {
          if (!j.date || !j.description || !j.details) {
            results.push({ index: idx, success: false, error: '必須フィールドが不足しています' })
            return
          }
          
          let ok = true
          for (const d of j.details) {
            if (!d.accountCode || (!d.debitAmount && !d.creditAmount)) ok = false
          }
          if (!ok) { results.push({ index: idx, success: false, error: '仕訳明細の形式が正しくありません（勘定科目コード、借方金額または貸方金額が必要）' }); return }
          
          const res = this.journalService.createJournal(j, { autoPost: json.autoPost !== false })
          if (!res.success) {
            results.push({ index: idx, success: false, error: res.errors?.join(', ') })
          } else {
            results.push({ index: idx, success: true })
          }
        })
      }
      
      return { success: true, results }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }
  
  createOpeningBalance(date: string, entries: Array<{ accountCode: string, debitAmount?: number, creditAmount?: number }>) {
    const details: any[] = []
    let totalDebit = 0, totalCredit = 0
    
    for (const e of entries) {
      const acc = this.accountService.getAccount(e.accountCode)
      if (!acc) continue
      if (!acc.isActive) continue
      
      const isNormalDebit = acc.normalBalance === 'DEBIT'
      let db = e.debitAmount || 0
      let cr = e.creditAmount || 0
      
      if (db > 0 || cr > 0) {
        details.push({ accountCode: e.accountCode, debitAmount: db, creditAmount: cr })
        totalDebit += db
        totalCredit += cr
      }
    }
    
    const diff = Math.abs(totalDebit - totalCredit)
    if (diff > 0.01) {
      const openingAccount = this.accountService.getAccount('3200') || this.accountService.getAccount('3000')
      if (openingAccount) {
        if (totalDebit > totalCredit) {
          details.push({ accountCode: openingAccount.code, creditAmount: diff })
        } else {
          details.push({ accountCode: openingAccount.code, debitAmount: diff })
        }
      }
    }
    
    if (details.length === 0) {
      return { success: false, errors: ['期首残高の明細がありません'] }
    }
    
    return this.journalService.createJournal({
      date,
      description: '期首残高',
      details
    }, { autoPost: true })
  }
  
  exportCurrentBalancesAsOpeningDetails() {
    const entries = []
    for (const acc of this.accountService.getAccounts()) {
      if (acc.balance !== 0) {
        const isDebit = acc.isDebitBalance()
        const amt = acc.getDisplayBalance()
        entries.push({
          accountCode: acc.code,
          debitAmount: isDebit ? amt : 0,
          creditAmount: !isDebit ? amt : 0
        })
      }
    }
    return entries
  }
}