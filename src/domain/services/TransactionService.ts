// 取引管理サービス - Freee型の取引データを管理

import { 
  Transaction, 
  TransactionInput, 
  TransactionSearchCriteria,
  TransactionSummary,
  TransactionValidationResult,
  Counterparty,
  TransactionTemplate
} from '../../types/transaction'
import { CreateJournalResult } from '../../types/accounting'
import { JournalService } from './JournalService'
import { AccountService } from './AccountService'
import { JournalGenerationEngine } from './JournalGenerationEngine'
import { BankAccountService } from './BankAccountService'
import { IAccountService } from '../interfaces/IAccountService'
import { IJournalService } from '../interfaces/IJournalService'

export class TransactionService {
  private transactions: Transaction[] = []
  private counterparties: Counterparty[] = []
  private templates: TransactionTemplate[] = []
  private journalGenerationEngine: JournalGenerationEngine
  private bankAccountService: BankAccountService | null = null
  
  constructor(
    private accountService: AccountService | IAccountService,
    private journalService: JournalService | IJournalService,
    bankAccountService?: BankAccountService
  ) {
    this.journalGenerationEngine = new JournalGenerationEngine(accountService)
    this.bankAccountService = bankAccountService || null
    this.initializeDefaultData()
  }
  
  // BankAccountServiceを設定
  setBankAccountService(bankAccountService: BankAccountService): void {
    this.bankAccountService = bankAccountService
  }
  
  // デフォルトデータの初期化
  private initializeDefaultData() {
    // デフォルトの取引先
    this.counterparties = [
      {
        id: 'cp_001',
        name: '管理会社A',
        code: 'KANRI_A',
        paymentTerms: {
          type: 'end_of_month',
          description: '月末締め翌月末払い'
        },
        isActive: true
      },
      {
        id: 'cp_002',
        name: '清掃業者B',
        code: 'SEISO_B',
        paymentTerms: {
          type: 'immediate',
          description: '即日払い'
        },
        isActive: true
      },
      {
        id: 'cp_003',
        name: '電力会社',
        code: 'DENRYOKU',
        paymentTerms: {
          type: 'custom',
          customDays: 20,
          description: '20日後払い'
        },
        isActive: true
      }
    ]
    
    // デフォルトのテンプレート
    this.templates = [
      {
        id: 'tpl_001',
        name: '管理費収入',
        description: '毎月の管理費収入',
        type: 'income',
        accountCode: '4111',  // 管理費収入
        tags: ['定期', '管理費'],
        isActive: true
      },
      {
        id: 'tpl_002',
        name: '電気代支払',
        description: '共用部電気代',
        type: 'expense',
        accountCode: '5131',  // 水道光熱費
        counterpartyId: 'cp_003',
        tags: ['定期', '光熱費'],
        isActive: true
      },
      {
        id: 'tpl_003',
        name: '清掃費支払',
        description: '定期清掃費用',
        type: 'expense',
        accountCode: '5121',  // 管理委託費
        counterpartyId: 'cp_002',
        tags: ['定期', '清掃'],
        isActive: true
      }
    ]
  }
  
  // 取引を作成
  createTransaction(input: TransactionInput): CreateJournalResult {
    // バリデーション
    const validation = this.validateTransaction(input)
    if (!validation.isValid) {
      return { success: false, errors: validation.errors }
    }
    
    // 決済口座のバリデーション
    if (input.paymentAccountCode && this.bankAccountService) {
      const paymentAccount = this.bankAccountService.getAccount(input.paymentAccountCode)
      if (!paymentAccount) {
        return { 
          success: false, 
          errors: [`決済口座 ${input.paymentAccountCode} が見つかりません`] 
        }
      }
      if (!paymentAccount.isActive) {
        return { 
          success: false, 
          errors: [`決済口座 ${paymentAccount.name} は無効化されています`] 
        }
      }
    }
    
    // 取引データを作成
    const transaction: Transaction = {
      id: `t_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...input,
      createdAt: new Date()
    }
    
    try {
      // 仕訳を生成
      const journalData = this.journalGenerationEngine.generateJournal(transaction)
      
      // 仕訳を登録
      const journalResult = this.journalService.createJournal(journalData, { 
        autoPost: input.status === 'paid',
        meta: { transactionId: transaction.id }
      })
      
      if (!journalResult.success) {
        return journalResult
      }
      
      // 仕訳IDを取引に紐付け
      transaction.journalId = journalResult.data?.id
      
      // 取引を保存
      this.transactions.push(transaction)
      
      // BankAccountServiceに取引参照を登録
      if (this.bankAccountService) {
        if (input.paymentAccountCode) {
          this.bankAccountService.registerTransactionReference(
            transaction.id, 
            input.paymentAccountCode,
            false
          )
        }
        
        // 振替取引の場合
        if (input.type === 'transfer' && input.accountCode) {
          this.bankAccountService.registerTransactionReference(
            transaction.id,
            input.accountCode,
            true
          )
        }
      }
      
      return { 
        success: true, 
        journal: journalResult.data,
        data: transaction 
      }
    } catch (error) {
      return { 
        success: false, 
        errors: [error instanceof Error ? error.message : '取引作成エラー'] 
      }
    }
  }
  
  // 取引のバリデーション
  private validateTransaction(input: TransactionInput): TransactionValidationResult {
    const errors: string[] = []
    
    // 必須項目のチェック
    if (!input.divisionCode) {
      errors.push('会計区分は必須です')
    }
    
    if (!input.occurredOn) {
      errors.push('発生日は必須です')
    }
    
    if (!input.accountCode) {
      errors.push('勘定科目は必須です')
    } else {
      const account = this.accountService.getAccount(input.accountCode)
      if (!account) {
        errors.push(`勘定科目 ${input.accountCode} が見つかりません`)
      } else if (!account.isActive) {
        errors.push(`勘定科目 ${input.accountCode} は無効です`)
      }
    }
    
    if (!input.amount || input.amount <= 0) {
      errors.push('金額は0より大きい値を入力してください')
    }
    
    // 決済済みの場合は決済口座が必須
    if (input.status === 'paid' && !input.paymentAccountCode) {
      errors.push('決済済みの場合は決済口座を選択してください')
    }
    
    // 資金移動の場合の特別なチェック
    if (input.type === 'transfer') {
      if (!input.paymentAccountCode) {
        errors.push('資金移動の場合は移動元口座を選択してください')
      }
      if (input.accountCode === input.paymentAccountCode) {
        errors.push('移動元と移動先は異なる口座を選択してください')
      }
    }
    
    // 日付の妥当性チェック
    if (input.dueOn && input.occurredOn) {
      const occurredDate = new Date(input.occurredOn)
      const dueDate = new Date(input.dueOn)
      if (dueDate < occurredDate) {
        errors.push('決済期日は発生日以降の日付を設定してください')
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    }
  }
  
  // 取引を更新
  updateTransaction(id: string, updates: Partial<TransactionInput>): CreateJournalResult {
    const transactionIndex = this.transactions.findIndex(t => t.id === id)
    if (transactionIndex === -1) {
      return { success: false, errors: ['取引が見つかりません'] }
    }
    
    const transaction = this.transactions[transactionIndex]
    if (!transaction) {
      return { success: false, errors: ['取引が見つかりません'] }
    }
    
    // 更新データのマージ
    const updatedTransaction: Transaction = {
      ...transaction,
      ...updates,
      updatedAt: new Date()
    }
    
    // バリデーション
    const validation = this.validateTransaction(updatedTransaction)
    if (!validation.isValid) {
      return { success: false, errors: validation.errors }
    }
    
    try {
      // 既存の仕訳を削除
      if (transaction.journalId) {
        this.journalService.deleteJournal(transaction.journalId)
      }
      
      // 新しい仕訳を生成
      const journalData = this.journalGenerationEngine.generateJournal(updatedTransaction)
      const journalResult = this.journalService.createJournal(journalData, { 
        autoPost: updatedTransaction.status === 'paid',
        meta: { transactionId: updatedTransaction.id }
      })
      
      if (!journalResult.success) {
        return journalResult
      }
      
      // 仕訳IDを更新
      updatedTransaction.journalId = journalResult.data?.id
      
      // 取引を更新
      this.transactions[transactionIndex] = updatedTransaction
      
      return { success: true, data: updatedTransaction }
    } catch (error) {
      return { 
        success: false, 
        errors: [error instanceof Error ? error.message : '取引更新エラー'] 
      }
    }
  }
  
  // 取引を削除
  deleteTransaction(id: string): CreateJournalResult {
    const transactionIndex = this.transactions.findIndex(t => t.id === id)
    if (transactionIndex === -1) {
      return { success: false, errors: ['取引が見つかりません'] }
    }
    
    const transaction = this.transactions[transactionIndex]
    if (!transaction) {
      return { success: false, errors: ['取引が見つかりません'] }
    }
    
    // 関連する仕訳を削除
    if (transaction.journalId) {
      const deleteResult = this.journalService.deleteJournal(transaction.journalId)
      if (!deleteResult.success) {
        return deleteResult
      }
    }
    
    // 取引を削除
    this.transactions.splice(transactionIndex, 1)
    
    return { success: true }
  }
  
  // 取引の決済処理
  settleTransaction(id: string, paymentAccountCode: string): CreateJournalResult {
    const transaction = this.transactions.find(t => t.id === id)
    if (!transaction) {
      return { success: false, errors: ['取引が見つかりません'] }
    }
    
    if (transaction.status === 'paid') {
      return { success: false, errors: ['既に決済済みです'] }
    }
    
    if (transaction.type === 'transfer') {
      return { success: false, errors: ['資金移動は決済処理できません'] }
    }
    
    try {
      // 決済仕訳を生成
      const paymentJournal = this.journalGenerationEngine.generatePaymentJournal(
        transaction, 
        paymentAccountCode
      )
      
      // 決済仕訳を登録
      const journalResult = this.journalService.createJournal(paymentJournal, { 
        autoPost: true,
        meta: { 
          transactionId: transaction.id,
          type: 'payment'
        }
      })
      
      if (!journalResult.success) {
        return journalResult
      }
      
      // 取引のステータスを更新
      transaction.status = 'paid'
      transaction.paymentAccountCode = paymentAccountCode
      transaction.updatedAt = new Date()
      
      return { success: true, data: transaction }
    } catch (error) {
      return { 
        success: false, 
        errors: [error instanceof Error ? error.message : '決済処理エラー'] 
      }
    }
  }
  
  // 取引を検索
  searchTransactions(criteria: TransactionSearchCriteria): Transaction[] {
    let results = [...this.transactions]
    
    // タイプでフィルタ
    if (criteria.type && criteria.type.length > 0) {
      results = results.filter(t => criteria.type?.includes(t.type))
    }
    
    // ステータスでフィルタ
    if (criteria.status && criteria.status.length > 0) {
      results = results.filter(t => criteria.status?.includes(t.status))
    }
    
    // 勘定科目でフィルタ
    if (criteria.accountCodes && criteria.accountCodes.length > 0) {
      results = results.filter(t => criteria.accountCodes?.includes(t.accountCode))
    }
    
    // 取引先でフィルタ
    if (criteria.counterpartyIds && criteria.counterpartyIds.length > 0) {
      results = results.filter(t => 
        t.counterpartyId && criteria.counterpartyIds?.includes(t.counterpartyId)
      )
    }
    
    // 日付範囲でフィルタ
    if (criteria.dateFrom) {
      results = results.filter(t => t.occurredOn >= criteria.dateFrom!)
    }
    if (criteria.dateTo) {
      results = results.filter(t => t.occurredOn <= criteria.dateTo!)
    }
    
    // 金額範囲でフィルタ
    if (criteria.amountMin !== undefined) {
      results = results.filter(t => t.amount >= criteria.amountMin!)
    }
    if (criteria.amountMax !== undefined) {
      results = results.filter(t => t.amount <= criteria.amountMax!)
    }
    
    // タグでフィルタ
    if (criteria.tags && criteria.tags.length > 0) {
      results = results.filter(t => 
        t.tags && criteria.tags?.some(tag => t.tags?.includes(tag))
      )
    }
    
    // 仕訳の有無でフィルタ
    if (criteria.hasJournal !== undefined) {
      results = results.filter(t => 
        criteria.hasJournal ? !!t.journalId : !t.journalId
      )
    }
    
    // 日付順にソート（新しい順）
    results.sort((a, b) => b.occurredOn.localeCompare(a.occurredOn))
    
    return results
  }
  
  // 取引の集計
  getTransactionSummary(dateFrom: string, dateTo: string): TransactionSummary {
    const transactions = this.searchTransactions({ dateFrom, dateTo })
    
    // 基本集計
    const summary: TransactionSummary = {
      totalIncome: 0,
      totalExpense: 0,
      totalTransfer: 0,
      unpaidIncome: 0,
      unpaidExpense: 0,
      periodFrom: dateFrom,
      periodTo: dateTo,
      byAccount: [],
      byCounterparty: []
    }
    
    // 勘定科目別と取引先別の集計用Map
    const accountMap = new Map<string, { name: string, amount: number, count: number }>()
    const counterpartyMap = new Map<string, { name: string, amount: number, count: number }>()
    
    transactions.forEach(t => {
      // タイプ別集計
      switch (t.type) {
        case 'income':
          summary.totalIncome += t.amount
          if (t.status === 'unpaid') {
            summary.unpaidIncome += t.amount
          }
          break
        case 'expense':
          summary.totalExpense += t.amount
          if (t.status === 'unpaid') {
            summary.unpaidExpense += t.amount
          }
          break
        case 'transfer':
          summary.totalTransfer += t.amount
          break
      }
      
      // 勘定科目別集計
      const account = this.accountService.getAccount(t.accountCode)
      if (account) {
        const existing = accountMap.get(t.accountCode) || { 
          name: account.name, 
          amount: 0, 
          count: 0 
        }
        existing.amount += t.amount
        existing.count += 1
        accountMap.set(t.accountCode, existing)
      }
      
      // 取引先別集計
      if (t.counterpartyId) {
        const counterparty = this.counterparties.find(c => c.id === t.counterpartyId)
        if (counterparty) {
          const existing = counterpartyMap.get(t.counterpartyId) || { 
            name: counterparty.name, 
            amount: 0, 
            count: 0 
          }
          existing.amount += t.amount
          existing.count += 1
          counterpartyMap.set(t.counterpartyId, existing)
        }
      }
    })
    
    // MapをArrayに変換
    summary.byAccount = Array.from(accountMap.entries()).map(([code, data]) => ({
      accountCode: code,
      accountName: data.name,
      amount: data.amount,
      count: data.count
    })).sort((a, b) => b.amount - a.amount)
    
    summary.byCounterparty = Array.from(counterpartyMap.entries()).map(([id, data]) => ({
      counterpartyId: id,
      counterpartyName: data.name,
      amount: data.amount,
      count: data.count
    })).sort((a, b) => b.amount - a.amount)
    
    return summary
  }
  
  // 取引先管理
  getCounterparties(): Counterparty[] {
    return [...this.counterparties]
  }
  
  addCounterparty(counterparty: Counterparty): void {
    this.counterparties.push(counterparty)
  }
  
  updateCounterparty(id: string, updates: Partial<Counterparty>): void {
    const index = this.counterparties.findIndex(c => c.id === id)
    if (index !== -1) {
      this.counterparties[index] = { ...this.counterparties[index]!, ...updates }
    }
  }
  
  // テンプレート管理
  getTemplates(): TransactionTemplate[] {
    return [...this.templates]
  }
  
  getTemplate(id: string): TransactionTemplate | undefined {
    return this.templates.find(t => t.id === id)
  }
  
  // テンプレートから取引を作成
  createTransactionFromTemplate(templateId: string, overrides?: Partial<TransactionInput>): CreateJournalResult {
    const template = this.templates.find(t => t.id === templateId)
    if (!template) {
      return { success: false, errors: ['テンプレートが見つかりません'] }
    }
    
    const input: TransactionInput = {
      type: template.type,
      occurredOn: new Date().toISOString().split('T')[0],
      accountCode: template.accountCode,
      amount: template.defaultAmount || 0,
      status: 'unpaid',
      counterpartyId: template.counterpartyId,
      tags: template.tags,
      taxCategory: template.taxCategory,
      ...overrides
    }
    
    return this.createTransaction(input)
  }
  
  // 全取引を取得
  getTransactions(): Transaction[] {
    return [...this.transactions]
  }
  
  // 取引をクリア
  clearTransactions(): void {
    this.transactions = []
  }
}