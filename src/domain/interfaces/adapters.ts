/**
 * @file adapters.ts
 * @description 新旧インターフェースの変換アダプター
 * 
 * 目的:
 * - 段階的な移行をサポート
 * - 後方互換性の維持
 * - 型の安全な変換
 */

import { 
  IJournalService 
} from './IJournalService'
import { 
  IJournalServiceV2,
  StatusChangeResult,
  JournalOperationResult 
} from './IJournalServiceV2'
import { 
  IAccountService 
} from './IAccountService'
import { 
  IAccountServiceV2 
} from './IAccountServiceV2'
import { 
  IDivisionService 
} from './IDivisionService'
import { 
  IDivisionServiceV2 
} from './IDivisionServiceV2'
import { 
  CreateJournalResult 
} from '../../types/accounting'
import { 
  JournalInterface,
  HierarchicalAccountInterface,
  AccountingDivisionInterface 
} from '../../types/services'

// ========================================
// 型変換ユーティリティ
// ========================================

/**
 * CreateJournalResultからJournalOperationResultへの変換
 */
export function convertToOperationResult(
  result: CreateJournalResult
): JournalOperationResult {
  return {
    success: result.success,
    data: result.journal as JournalInterface,
    errors: result.errors
  }
}

/**
 * booleanからStatusChangeResultへの変換
 */
export function booleanToStatusResult(
  success: boolean,
  previousStatus?: string,
  newStatus?: string
): StatusChangeResult {
  return {
    success,
    data: previousStatus && newStatus ? {
      previousStatus: previousStatus as any,
      newStatus: newStatus as any
    } : undefined,
    errors: success ? undefined : ['Operation failed']
  }
}

/**
 * CreateJournalResult | booleanの統一変換
 */
export function normalizeResult(
  result: CreateJournalResult | boolean
): JournalOperationResult {
  if (typeof result === 'boolean') {
    return {
      success: result,
      errors: result ? undefined : ['Operation failed']
    }
  }
  return convertToOperationResult(result)
}

// ========================================
// JournalServiceアダプター
// ========================================

/**
 * レガシーIJournalServiceを新しいIJournalServiceV2に適応させる
 */
export class JournalServiceAdapter implements IJournalServiceV2 {
  constructor(private legacyService: IJournalService) {}

  getJournals(): JournalInterface[] {
    return this.legacyService.getJournals() as JournalInterface[]
  }

  getJournal(id: string): JournalInterface | undefined {
    return this.legacyService.getJournal(id) as JournalInterface | undefined
  }

  createJournalV2(params: any): JournalOperationResult {
    const result = this.legacyService.createJournal(
      params.journalData,
      params.options
    )
    return convertToOperationResult(result)
  }

  createJournal(journalData: any, options?: any): CreateJournalResult {
    return this.legacyService.createJournal(journalData, options)
  }

  submitJournalV2?(id: string): StatusChangeResult {
    if (!this.legacyService.submitJournal) {
      return { success: false, errors: ['Method not implemented'] }
    }
    const result = this.legacyService.submitJournal(id)
    return normalizeResult(result) as StatusChangeResult
  }

  approveJournalV2?(id: string): StatusChangeResult {
    if (!this.legacyService.approveJournal) {
      return { success: false, errors: ['Method not implemented'] }
    }
    const result = this.legacyService.approveJournal(id)
    return normalizeResult(result) as StatusChangeResult
  }

  postJournalV2?(id: string): StatusChangeResult {
    if (!this.legacyService.postJournalById) {
      return { success: false, errors: ['Method not implemented'] }
    }
    const result = this.legacyService.postJournalById(id)
    return normalizeResult(result) as StatusChangeResult
  }

  deleteJournalV2?(id: string): JournalOperationResult {
    if (!this.legacyService.deleteJournal) {
      return { success: false, errors: ['Method not implemented'] }
    }
    const result = this.legacyService.deleteJournal(id)
    return normalizeResult(result)
  }

  updateJournalV2?(id: string, params: any): JournalOperationResult {
    if (!this.legacyService.updateJournal) {
      return { success: false, errors: ['Method not implemented'] }
    }
    const result = this.legacyService.updateJournal(id, params)
    return normalizeResult(result)
  }

  // レガシー互換メソッド
  submitJournal?(id: string): CreateJournalResult | boolean {
    return this.legacyService.submitJournal?.(id)
  }

  approveJournal?(id: string): CreateJournalResult | boolean {
    return this.legacyService.approveJournal?.(id)
  }

  postJournalById?(id: string): CreateJournalResult | boolean {
    return this.legacyService.postJournalById?.(id)
  }

  deleteJournal?(id: string): CreateJournalResult | boolean {
    return this.legacyService.deleteJournal?.(id)
  }

  updateJournal?(id: string, data: any): CreateJournalResult | boolean {
    return this.legacyService.updateJournal?.(id, data)
  }

  clearJournals?(): void {
    // レガシーインターフェースには存在しない可能性
    if ('clearJournals' in this.legacyService) {
      (this.legacyService as any).clearJournals()
    }
  }

  get journals(): JournalInterface[] | undefined {
    return this.legacyService.journals as JournalInterface[]
  }
}

// ========================================
// AccountServiceアダプター
// ========================================

/**
 * レガシーIAccountServiceを新しいIAccountServiceV2に適応させる
 */
export class AccountServiceAdapter implements IAccountServiceV2 {
  constructor(private legacyService: IAccountService) {}

  getAccount(code: string): HierarchicalAccountInterface | undefined {
    return this.legacyService.getAccount(code) as HierarchicalAccountInterface | undefined
  }

  getAccounts(): HierarchicalAccountInterface[] {
    return this.legacyService.getAccounts() as HierarchicalAccountInterface[]
  }

  get accounts(): HierarchicalAccountInterface[] {
    return this.legacyService.accounts as HierarchicalAccountInterface[]
  }

  initializeAccounts(): void {
    this.legacyService.initializeAccounts()
  }

  addOrUpdateAccount?(def: any): void {
    this.legacyService.addOrUpdateAccount?.(def)
  }

  setAccountActive?(code: string, active: boolean): void {
    this.legacyService.setAccountActive?.(code, active)
  }

  clearAccounts?(): void {
    // レガシーインターフェースには存在しない可能性
    if ('clearAccounts' in this.legacyService) {
      (this.legacyService as any).clearAccounts()
    }
  }

  rebuildAccountsFrom?(defs: any[]): void {
    // レガシーインターフェースには存在しない可能性
    if ('rebuildAccountsFrom' in this.legacyService) {
      (this.legacyService as any).rebuildAccountsFrom(defs)
    }
  }

  rebuildAuxiliaryAccounts?(): void {
    // レガシーインターフェースには存在しない可能性
    if ('rebuildAuxiliaryAccounts' in this.legacyService) {
      (this.legacyService as any).rebuildAuxiliaryAccounts()
    }
  }
}

// ========================================
// DivisionServiceアダプター
// ========================================

/**
 * レガシーIDivisionServiceを新しいIDivisionServiceV2に適応させる
 */
export class DivisionServiceAdapter implements IDivisionServiceV2 {
  constructor(private legacyService: IDivisionService) {}

  getDivision(code: any): AccountingDivisionInterface | undefined {
    return this.legacyService.getDivision(code) as AccountingDivisionInterface | undefined
  }

  getDivisions(): AccountingDivisionInterface[] {
    return this.legacyService.getDivisions() as AccountingDivisionInterface[]
  }

  get divisions(): AccountingDivisionInterface[] {
    return this.legacyService.divisions as AccountingDivisionInterface[]
  }

  initializeDivisions(): void {
    this.legacyService.initializeDivisions()
  }

  clearDivisions?(): void {
    // レガシーインターフェースには存在しない可能性
    if ('clearDivisions' in this.legacyService) {
      (this.legacyService as any).clearDivisions()
    }
  }
}