/**
 * 未収金管理サービス
 * Phase 14: 銀行入金処理と未収金管理
 */

import { 
  Receivable, 
  ClearingResult, 
  ClearingRecord,
  ReceivableSummary,
  UnitReceivable
} from '../../../types/payment'

export class ReceivableService {
  private receivables: Map<string, Receivable> = new Map()
  private unitIndex: Map<string, string[]> = new Map()  // unitNumber -> receivableIds[]
  
  constructor() {
    this.initializeFromStorage()
  }

  /**
   * LocalStorageから未収金データを初期化
   */
  private initializeFromStorage(): void {
    try {
      const stored = localStorage.getItem('receivables')
      if (stored) {
        const data = JSON.parse(stored)
        data.forEach((r: Receivable) => {
          this.receivables.set(r.id, r)
          this.updateUnitIndex(r.unitNumber, r.id)
        })
      }
    } catch (error) {
      console.error('Failed to initialize receivables from storage:', error)
    }
  }

  /**
   * 未収金を作成
   */
  createReceivable(
    unitNumber: string,
    accountCode: '1301' | '1302' | '1303',
    amount: number,
    dueDate: string,
    memo?: string
  ): Receivable {
    const receivable: Receivable = {
      id: this.generateId(),
      unitNumber,
      accountCode,
      amount,
      dueDate,
      status: 'outstanding',
      createdDate: new Date().toISOString(),
      memo
    }
    
    this.receivables.set(receivable.id, receivable)
    this.updateUnitIndex(unitNumber, receivable.id)
    this.saveToStorage()
    
    return receivable
  }

  /**
   * 未収金の消し込み処理
   */
  clearReceivable(
    receivableId: string,
    paymentAmount: number,
    journalId: string,
    memo?: string
  ): ClearingResult {
    const receivable = this.receivables.get(receivableId)
    
    if (!receivable) {
      return {
        success: false,
        clearedAmount: 0,
        remainingAmount: 0,
        message: 'Receivable not found'
      }
    }

    const clearingRecord: ClearingRecord = {
      id: this.generateId(),
      date: new Date().toISOString(),
      amount: Math.min(paymentAmount, receivable.amount),
      journalId,
      remainingAmount: Math.max(0, receivable.amount - paymentAmount),
      memo
    }

    if (!receivable.clearingHistory) {
      receivable.clearingHistory = []
    }
    receivable.clearingHistory.push(clearingRecord)

    if (paymentAmount >= receivable.amount) {
      // 完全消し込み
      receivable.status = 'paid'
      receivable.clearedDate = new Date().toISOString()
      receivable.clearedByJournalId = journalId
      receivable.amount = 0
    } else {
      // 部分消し込み
      receivable.status = 'partially_paid'
      receivable.amount -= paymentAmount
    }

    this.saveToStorage()

    return {
      success: true,
      receivableId,
      clearedAmount: clearingRecord.amount,
      remainingAmount: receivable.amount,
      journalId,
      message: receivable.status === 'paid' ? 'Fully cleared' : 'Partially cleared'
    }
  }

  /**
   * 住戸番号で未収金を検索
   */
  getReceivablesByUnit(unitNumber: string): Receivable[] {
    const ids = this.unitIndex.get(unitNumber) || []
    return ids
      .map(id => this.receivables.get(id))
      .filter((r): r is Receivable => r !== undefined)
      .filter(r => r.status !== 'paid')
  }

  /**
   * 全未収金を取得
   */
  getAllReceivables(includeCleared = false): Receivable[] {
    const receivables = Array.from(this.receivables.values())
    return includeCleared 
      ? receivables
      : receivables.filter(r => r.status !== 'paid')
  }

  /**
   * 未収金サマリーを取得
   */
  getReceivableSummary(asOfDate?: string): ReceivableSummary {
    const targetDate = asOfDate ? new Date(asOfDate) : new Date()
    const byUnit = new Map<string, UnitReceivable>()
    const byAge = {
      current: 0,
      oneMonth: 0,
      twoMonths: 0,
      threeMonthsPlus: 0
    }

    let totalOutstanding = 0
    let oldestReceivableDate: string | undefined

    this.getAllReceivables().forEach(receivable => {
      const dueDate = new Date(receivable.dueDate)
      const monthsOverdue = this.calculateMonthsOverdue(dueDate, targetDate)
      
      totalOutstanding += receivable.amount

      // 住戸別集計
      const unitSummary = byUnit.get(receivable.unitNumber) || this.createEmptyUnitReceivable(receivable.unitNumber)
      
      switch (receivable.accountCode) {
        case '1301':
          unitSummary.details.managementFee += receivable.amount
          break
        case '1302':
          unitSummary.details.repairReserve += receivable.amount
          break
        case '1303':
          unitSummary.details.parkingFee += receivable.amount
          break
      }
      
      unitSummary.totalAmount += receivable.amount
      
      if (!unitSummary.oldestDueDate || dueDate < new Date(unitSummary.oldestDueDate)) {
        unitSummary.oldestDueDate = receivable.dueDate
        unitSummary.monthsOverdue = monthsOverdue
      }
      
      byUnit.set(receivable.unitNumber, unitSummary)

      // 延滞期間別集計
      if (monthsOverdue === 0) {
        byAge.current += receivable.amount
      } else if (monthsOverdue === 1) {
        byAge.oneMonth += receivable.amount
      } else if (monthsOverdue === 2) {
        byAge.twoMonths += receivable.amount
      } else {
        byAge.threeMonthsPlus += receivable.amount
      }

      // 最古の未収金日付
      if (!oldestReceivableDate || receivable.dueDate < oldestReceivableDate) {
        oldestReceivableDate = receivable.dueDate
      }
    })

    return {
      totalOutstanding,
      byUnit,
      byAge,
      oldestReceivableDate,
      unitCount: byUnit.size
    }
  }

  /**
   * 未収金の更新
   */
  updateReceivable(id: string, updates: Partial<Receivable>): Receivable | null {
    const receivable = this.receivables.get(id)
    if (!receivable) return null

    Object.assign(receivable, updates)
    this.saveToStorage()
    return receivable
  }

  /**
   * 未収金の削除
   */
  deleteReceivable(id: string): boolean {
    const receivable = this.receivables.get(id)
    if (!receivable) return false

    this.receivables.delete(id)
    
    // インデックスから削除
    const unitIds = this.unitIndex.get(receivable.unitNumber)
    if (unitIds) {
      const index = unitIds.indexOf(id)
      if (index > -1) {
        unitIds.splice(index, 1)
      }
    }

    this.saveToStorage()
    return true
  }

  /**
   * 延滞月数を計算
   */
  private calculateMonthsOverdue(dueDate: Date, asOfDate: Date): number {
    const months = (asOfDate.getFullYear() - dueDate.getFullYear()) * 12 
                  + asOfDate.getMonth() - dueDate.getMonth()
    return Math.max(0, months)
  }

  /**
   * 空の住戸別未収金を作成
   */
  private createEmptyUnitReceivable(unitNumber: string): UnitReceivable {
    return {
      unitNumber,
      totalAmount: 0,
      details: {
        managementFee: 0,
        repairReserve: 0,
        parkingFee: 0,
        other: 0
      },
      oldestDueDate: '',
      monthsOverdue: 0
    }
  }

  /**
   * 住戸インデックスを更新
   */
  private updateUnitIndex(unitNumber: string, receivableId: string): void {
    if (!this.unitIndex.has(unitNumber)) {
      this.unitIndex.set(unitNumber, [])
    }
    const ids = this.unitIndex.get(unitNumber)!
    if (!ids.includes(receivableId)) {
      ids.push(receivableId)
    }
  }

  /**
   * IDを生成
   */
  private generateId(): string {
    return `rcv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * LocalStorageに保存
   */
  private saveToStorage(): void {
    try {
      const data = Array.from(this.receivables.values())
      localStorage.setItem('receivables', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save receivables to storage:', error)
    }
  }

  /**
   * データをクリア（テスト用）
   */
  clearAll(): void {
    this.receivables.clear()
    this.unitIndex.clear()
    localStorage.removeItem('receivables')
  }
}