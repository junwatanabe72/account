/**
 * 入金照合サービス
 * Phase 14: 銀行入金処理と未収金管理
 */

import {
  BankTransaction,
  PaymentMatching,
  UnitMaster,
  SuggestedJournal,
  JournalDetail,
  Receivable
} from '../../../types/payment'
import { JournalService } from '../core/JournalService'
import { ReceivableService } from './ReceivableService'

/**
 * 住戸情報の抽出結果
 */
interface UnitExtractionResult {
  unitNumber: string | null
  confidence: number
  matchedPattern?: string
  originalText?: string
}

export class PaymentMatchingService {
  // 住戸マスタ（POC用の固定データ）
  private unitMaster: Map<string, UnitMaster> = new Map([
    ['101', { 
      unitNumber: '101',
      ownerName: '田中',
      managementFee: 15000, 
      repairReserve: 10000, 
      parkingFee: 3000 
    }],
    ['202', { 
      unitNumber: '202',
      ownerName: '山田',
      managementFee: 20000, 
      repairReserve: 15000, 
      parkingFee: 0 
    }],
    ['303', { 
      unitNumber: '303',
      ownerName: '佐藤',
      managementFee: 15000, 
      repairReserve: 10000, 
      parkingFee: 3000 
    }],
    ['305', { 
      unitNumber: '305',
      ownerName: '鈴木',
      managementFee: 15000, 
      repairReserve: 10000, 
      parkingFee: 3000 
    }],
    ['401', { 
      unitNumber: '401',
      ownerName: '高橋',
      managementFee: 18000, 
      repairReserve: 12000, 
      parkingFee: 0 
    }]
  ])

  // 摘要解析パターン
  private patterns: RegExp[] = [
    /(\d{3,4})\s*号室/,
    /(\d{3,4})\s*号/,
    /(\d{3,4})\s*ゴウ/,
    /(\d{3,4})\s*ｺﾞｳ/,
    /Room\s*(\d{3,4})/i,
    /部屋番号.*(\d{3,4})/,
    /No\.?\s*(\d{3,4})/i,
    /＃(\d{3,4})/,
    /#(\d{3,4})/,
  ]

  // 学習済みパターンのキャッシュ
  private learnedPatterns: Map<string, UnitExtractionResult> = new Map()

  constructor(
    private journalService: JournalService,
    private receivableService: ReceivableService
  ) {
    this.loadLearnedPatterns()
  }

  /**
   * 入金照合処理
   */
  async processPayment(transaction: BankTransaction): Promise<PaymentMatching> {
    const matchingId = this.generateMatchingId()
    
    // 摘要から住戸番号を抽出
    const unitInfo = this.extractUnitInfo(transaction.description)
    
    if (!unitInfo.unitNumber) {
      // 住戸不明の場合
      return this.createUnidentifiedPayment(matchingId, transaction)
    }

    // 標準請求額を取得
    const standard = this.unitMaster.get(unitInfo.unitNumber)
    
    if (!standard) {
      // マスタに存在しない住戸
      return this.createUnknownUnitPayment(matchingId, transaction, unitInfo.unitNumber)
    }

    // 標準請求額の合計
    const standardTotal = standard.managementFee + standard.repairReserve + (standard.parkingFee || 0)
    
    // 差額計算
    const difference = transaction.amount - standardTotal
    
    // 照合タイプの判定と仕訳生成
    if (Math.abs(difference) < 1) {
      // 完全一致（誤差1円未満）
      return this.createExactPayment(matchingId, transaction, unitInfo, standard)
    } else if (difference < 0) {
      // 不足（未収金計上）
      return this.createPartialPayment(matchingId, transaction, unitInfo, standard, difference)
    } else {
      // 過入金（前受金計上）
      return this.createOverPayment(matchingId, transaction, unitInfo, standard, difference)
    }
  }

  /**
   * 摘要から住戸番号を抽出
   */
  private extractUnitInfo(description: string): UnitExtractionResult {
    // 正規化
    const normalized = description
      .replace(/\s+/g, ' ')
      .trim()

    // 学習済みパターンをチェック
    if (this.learnedPatterns.has(normalized)) {
      return this.learnedPatterns.get(normalized)!
    }

    // パターンマッチング
    for (const pattern of this.patterns) {
      const match = description.match(pattern)
      if (match) {
        const unitNumber = match[1].padStart(3, '0')
        return {
          unitNumber,
          confidence: 0.8,
          matchedPattern: pattern.source,
          originalText: match[0]
        }
      }
    }

    // マスタの住戸番号と名前で検索
    for (const [unitNumber, master] of this.unitMaster) {
      if (master.ownerName && description.includes(master.ownerName)) {
        return {
          unitNumber,
          confidence: 0.6,
          matchedPattern: `ownerName:${master.ownerName}`,
          originalText: master.ownerName
        }
      }
    }

    return {
      unitNumber: null,
      confidence: 0
    }
  }

  /**
   * 完全一致の照合結果を作成
   */
  private createExactPayment(
    matchingId: string,
    transaction: BankTransaction,
    unitInfo: UnitExtractionResult,
    standard: UnitMaster
  ): PaymentMatching {
    const suggestedJournals: SuggestedJournal[] = [{
      date: transaction.date,
      description: `入金処理 ${standard.unitNumber}号室 ${standard.ownerName || ''}`,
      debit: [{
        accountCode: '1101',
        accountName: '普通預金',
        amount: transaction.amount
      }],
      credit: [
        {
          accountCode: '4101',
          accountName: '管理費収入',
          amount: standard.managementFee,
          division: '管理費会計'
        },
        {
          accountCode: '4102',
          accountName: '修繕積立金収入',
          amount: standard.repairReserve,
          division: '修繕積立金会計'
        }
      ],
      confidence: unitInfo.confidence,
      reason: '標準請求額と完全一致'
    }]

    // 駐車場料金がある場合
    if (standard.parkingFee && standard.parkingFee > 0) {
      suggestedJournals[0].credit.push({
        accountCode: '4103',
        accountName: '駐車場収入',
        amount: standard.parkingFee,
        division: '駐車場会計'
      })
    }

    return {
      id: matchingId,
      bankTransactionId: transaction.id,
      unitNumber: unitInfo.unitNumber!,
      identifiedPayer: standard.ownerName,
      matchingType: 'exact',
      confidence: unitInfo.confidence,
      standardAmount: {
        managementFee: standard.managementFee,
        repairReserve: standard.repairReserve,
        parkingFee: standard.parkingFee
      },
      actualAmount: transaction.amount,
      difference: 0,
      suggestedJournals,
      status: 'auto_matched'
    }
  }

  /**
   * 一部入金の照合結果を作成（未収金計上）
   */
  private createPartialPayment(
    matchingId: string,
    transaction: BankTransaction,
    unitInfo: UnitExtractionResult,
    standard: UnitMaster,
    difference: number
  ): PaymentMatching {
    const shortage = Math.abs(difference)
    const actualPayment = transaction.amount

    // 実際の入金を各費目に按分
    const standardTotal = standard.managementFee + standard.repairReserve + (standard.parkingFee || 0)
    const managementRatio = standard.managementFee / standardTotal
    const repairRatio = standard.repairReserve / standardTotal
    const parkingRatio = (standard.parkingFee || 0) / standardTotal

    const actualManagement = Math.floor(actualPayment * managementRatio)
    const actualRepair = Math.floor(actualPayment * repairRatio)
    const actualParking = Math.floor(actualPayment * parkingRatio)

    // 端数調整
    const adjustment = actualPayment - (actualManagement + actualRepair + actualParking)
    
    const suggestedJournals: SuggestedJournal[] = [{
      date: transaction.date,
      description: `入金処理（一部入金） ${standard.unitNumber}号室 ${standard.ownerName || ''}`,
      debit: [{
        accountCode: '1101',
        accountName: '普通預金',
        amount: actualPayment
      }],
      credit: [
        {
          accountCode: '4101',
          accountName: '管理費収入',
          amount: actualManagement + adjustment, // 端数を管理費に加算
          division: '管理費会計'
        },
        {
          accountCode: '4102',
          accountName: '修繕積立金収入',
          amount: actualRepair,
          division: '修繕積立金会計'
        }
      ],
      confidence: unitInfo.confidence * 0.9,
      reason: `標準請求額より${shortage}円不足`
    }]

    if (actualParking > 0) {
      suggestedJournals[0].credit.push({
        accountCode: '4103',
        accountName: '駐車場収入',
        amount: actualParking,
        division: '駐車場会計'
      })
    }

    // 未収金計上の仕訳
    const shortageManagement = standard.managementFee - (actualManagement + adjustment)
    const shortageRepair = standard.repairReserve - actualRepair
    const shortageParking = (standard.parkingFee || 0) - actualParking

    const receivableJournal: SuggestedJournal = {
      date: transaction.date,
      description: `未収金計上 ${standard.unitNumber}号室`,
      debit: [],
      credit: [],
      confidence: unitInfo.confidence * 0.9,
      reason: '不足分を未収金として計上'
    }

    if (shortageManagement > 0) {
      receivableJournal.debit.push({
        accountCode: '1301',
        accountName: '管理費未収金',
        amount: shortageManagement
      })
      receivableJournal.credit.push({
        accountCode: '4101',
        accountName: '管理費収入',
        amount: shortageManagement,
        division: '管理費会計'
      })
    }

    if (shortageRepair > 0) {
      receivableJournal.debit.push({
        accountCode: '1302',
        accountName: '修繕積立金未収金',
        amount: shortageRepair
      })
      receivableJournal.credit.push({
        accountCode: '4102',
        accountName: '修繕積立金収入',
        amount: shortageRepair,
        division: '修繕積立金会計'
      })
    }

    if (shortageParking > 0) {
      receivableJournal.debit.push({
        accountCode: '1303',
        accountName: '駐車場未収金',
        amount: shortageParking
      })
      receivableJournal.credit.push({
        accountCode: '4103',
        accountName: '駐車場収入',
        amount: shortageParking,
        division: '駐車場会計'
      })
    }

    if (receivableJournal.debit.length > 0) {
      suggestedJournals.push(receivableJournal)
    }

    return {
      id: matchingId,
      bankTransactionId: transaction.id,
      unitNumber: unitInfo.unitNumber!,
      identifiedPayer: standard.ownerName,
      matchingType: 'partial',
      confidence: unitInfo.confidence * 0.9,
      standardAmount: {
        managementFee: standard.managementFee,
        repairReserve: standard.repairReserve,
        parkingFee: standard.parkingFee
      },
      actualAmount: actualPayment,
      difference: difference,
      suggestedJournals,
      status: 'auto_matched'
    }
  }

  /**
   * 過入金の照合結果を作成（前受金計上）
   */
  private createOverPayment(
    matchingId: string,
    transaction: BankTransaction,
    unitInfo: UnitExtractionResult,
    standard: UnitMaster,
    difference: number
  ): PaymentMatching {
    const overpayment = difference
    const standardTotal = standard.managementFee + standard.repairReserve + (standard.parkingFee || 0)

    const suggestedJournals: SuggestedJournal[] = [{
      date: transaction.date,
      description: `入金処理（過入金） ${standard.unitNumber}号室 ${standard.ownerName || ''}`,
      debit: [{
        accountCode: '1101',
        accountName: '普通預金',
        amount: transaction.amount
      }],
      credit: [
        {
          accountCode: '4101',
          accountName: '管理費収入',
          amount: standard.managementFee,
          division: '管理費会計'
        },
        {
          accountCode: '4102',
          accountName: '修繕積立金収入',
          amount: standard.repairReserve,
          division: '修繕積立金会計'
        }
      ],
      confidence: unitInfo.confidence * 0.95,
      reason: `標準請求額より${overpayment}円超過`
    }]

    if (standard.parkingFee && standard.parkingFee > 0) {
      suggestedJournals[0].credit.push({
        accountCode: '4103',
        accountName: '駐車場収入',
        amount: standard.parkingFee,
        division: '駐車場会計'
      })
    }

    // 超過分を前受金として計上
    suggestedJournals[0].credit.push({
      accountCode: '2201',
      accountName: '前受金',
      amount: overpayment,
      memo: `${standard.unitNumber}号室 次月分前受`
    })

    return {
      id: matchingId,
      bankTransactionId: transaction.id,
      unitNumber: unitInfo.unitNumber!,
      identifiedPayer: standard.ownerName,
      matchingType: 'over',
      confidence: unitInfo.confidence * 0.95,
      standardAmount: {
        managementFee: standard.managementFee,
        repairReserve: standard.repairReserve,
        parkingFee: standard.parkingFee
      },
      actualAmount: transaction.amount,
      difference: difference,
      suggestedJournals,
      status: 'auto_matched'
    }
  }

  /**
   * 住戸不明の照合結果を作成
   */
  private createUnidentifiedPayment(
    matchingId: string,
    transaction: BankTransaction
  ): PaymentMatching {
    const suggestedJournals: SuggestedJournal[] = [{
      date: transaction.date,
      description: `入金処理（住戸不明） ${transaction.description}`,
      debit: [{
        accountCode: '1101',
        accountName: '普通預金',
        amount: transaction.amount
      }],
      credit: [{
        accountCode: '2202',
        accountName: '仮受金',
        amount: transaction.amount,
        memo: '入金者不明 - 要確認'
      }],
      confidence: 0,
      reason: '摘要から住戸を特定できませんでした'
    }]

    return {
      id: matchingId,
      bankTransactionId: transaction.id,
      matchingType: 'unidentified',
      confidence: 0,
      actualAmount: transaction.amount,
      difference: 0,
      suggestedJournals,
      status: 'pending_review'
    }
  }

  /**
   * マスタに存在しない住戸の照合結果を作成
   */
  private createUnknownUnitPayment(
    matchingId: string,
    transaction: BankTransaction,
    unitNumber: string
  ): PaymentMatching {
    const suggestedJournals: SuggestedJournal[] = [{
      date: transaction.date,
      description: `入金処理（住戸マスタ未登録） ${unitNumber}号室`,
      debit: [{
        accountCode: '1101',
        accountName: '普通預金',
        amount: transaction.amount
      }],
      credit: [{
        accountCode: '2202',
        accountName: '仮受金',
        amount: transaction.amount,
        memo: `${unitNumber}号室 - マスタ未登録`
      }],
      confidence: 0.3,
      reason: '住戸番号は特定できましたが、マスタに登録されていません'
    }]

    return {
      id: matchingId,
      bankTransactionId: transaction.id,
      unitNumber,
      matchingType: 'unidentified',
      confidence: 0.3,
      actualAmount: transaction.amount,
      difference: 0,
      suggestedJournals,
      status: 'pending_review'
    }
  }

  /**
   * 手動で住戸番号を設定
   */
  manualSetUnit(
    matchingId: string,
    unitNumber: string,
    description?: string
  ): void {
    // 学習パターンに追加
    if (description) {
      const normalized = description.replace(/\s+/g, ' ').trim()
      this.learnedPatterns.set(normalized, {
        unitNumber,
        confidence: 1.0,
        matchedPattern: 'manual',
        originalText: description
      })
      this.saveLearnedPatterns()
    }
  }

  /**
   * 住戸マスタを更新（実際のシステムではDBから取得）
   */
  updateUnitMaster(unitNumber: string, master: UnitMaster): void {
    this.unitMaster.set(unitNumber, master)
  }

  /**
   * 照合IDを生成
   */
  private generateMatchingId(): string {
    return `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 学習済みパターンを保存
   */
  private saveLearnedPatterns(): void {
    try {
      const data = Array.from(this.learnedPatterns.entries())
      localStorage.setItem('paymentMatchingPatterns', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save learned patterns:', error)
    }
  }

  /**
   * 学習済みパターンを読み込み
   */
  private loadLearnedPatterns(): void {
    try {
      const stored = localStorage.getItem('paymentMatchingPatterns')
      if (stored) {
        const data = JSON.parse(stored)
        this.learnedPatterns = new Map(data)
      }
    } catch (error) {
      console.error('Failed to load learned patterns:', error)
    }
  }
}