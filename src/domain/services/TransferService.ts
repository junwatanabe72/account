import { BankAccountService } from './BankAccountService'
import { TransactionService } from './TransactionService'
import { JournalService } from './JournalService'
import { BankAccount } from '../../data/bankAccounts'
import { CreateJournalResult } from '../../types/accounting'

export interface TransferRequest {
  fromAccountCode: string
  toAccountCode: string
  amount: number
  date: string
  description?: string
  divisionCode: string
}

export interface TransferValidationResult {
  isValid: boolean
  errors?: string[]
  warnings?: string[]
}

export class TransferService {
  constructor(
    private bankAccountService: BankAccountService,
    private transactionService: TransactionService,
    private journalService: JournalService
  ) {}
  
  // 振替取引のバリデーション
  validateTransfer(request: TransferRequest): TransferValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    
    // 振替元口座の確認
    const fromAccount = this.bankAccountService.getAccount(request.fromAccountCode)
    if (!fromAccount) {
      errors.push(`振替元口座 ${request.fromAccountCode} が見つかりません`)
    } else if (!fromAccount.isActive) {
      errors.push(`振替元口座 ${fromAccount.name} は無効化されています`)
    }
    
    // 振替先口座の確認
    const toAccount = this.bankAccountService.getAccount(request.toAccountCode)
    if (!toAccount) {
      errors.push(`振替先口座 ${request.toAccountCode} が見つかりません`)
    } else if (!toAccount.isActive) {
      errors.push(`振替先口座 ${toAccount.name} は無効化されています`)
    }
    
    // 同一口座への振替チェック
    if (request.fromAccountCode === request.toAccountCode) {
      errors.push('同じ口座への振替はできません')
    }
    
    // 金額チェック
    if (request.amount <= 0) {
      errors.push('振替金額は0より大きい必要があります')
    }
    
    // 区分チェック（異なる区分間の振替の警告）
    if (fromAccount && toAccount) {
      if (fromAccount.division !== toAccount.division && 
          fromAccount.division !== 'BOTH' && 
          toAccount.division !== 'BOTH') {
        warnings.push(
          `異なる会計区分間の振替です: ${fromAccount.division} → ${toAccount.division}`
        )
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    }
  }
  
  // 振替取引を実行
  executeTransfer(request: TransferRequest): CreateJournalResult {
    // バリデーション
    const validation = this.validateTransfer(request)
    if (!validation.isValid) {
      return { 
        success: false, 
        errors: validation.errors 
      }
    }
    
    const fromAccount = this.bankAccountService.getAccount(request.fromAccountCode)!
    const toAccount = this.bankAccountService.getAccount(request.toAccountCode)!
    
    try {
      // 振替取引を作成
      const transactionId = `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // 仕訳エントリを作成
      const journalData = {
        occurredOn: request.date,
        description: request.description || `振替: ${fromAccount.name} → ${toAccount.name}`,
        entries: [
          {
            accountCode: request.toAccountCode,
            amount: request.amount,
            isDebit: true,
            description: `振替入金（${fromAccount.name}より）`
          },
          {
            accountCode: request.fromAccountCode,
            amount: request.amount,
            isDebit: false,
            description: `振替出金（${toAccount.name}へ）`
          }
        ],
        divisionCode: request.divisionCode,
        posted: true
      }
      
      // 仕訳を登録
      const journalResult = this.journalService.createJournal(journalData, {
        autoPost: true,
        meta: { 
          transactionId,
          transactionType: 'transfer',
          fromAccount: request.fromAccountCode,
          toAccount: request.toAccountCode
        }
      })
      
      if (!journalResult.success) {
        return journalResult
      }
      
      // BankAccountServiceに振替参照を登録
      this.bankAccountService.registerTransactionReference(
        transactionId,
        request.fromAccountCode,
        true
      )
      this.bankAccountService.registerTransactionReference(
        transactionId,
        request.toAccountCode,
        true
      )
      
      // 警告がある場合はメッセージに含める
      let message = `振替が完了しました: ${fromAccount.name} → ${toAccount.name}`
      if (validation.warnings && validation.warnings.length > 0) {
        message += '\n警告: ' + validation.warnings.join('\n')
      }
      
      return {
        success: true,
        journal: journalResult.data,
        data: {
          transactionId,
          message,
          warnings: validation.warnings
        }
      }
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : '振替処理エラー']
      }
    }
  }
  
  // 振替可能な組み合わせを取得
  getAvailableTransferOptions(): Array<{from: BankAccount, to: BankAccount[]}> {
    return this.bankAccountService.getTransferableCombinations()
  }
  
  // 特定の口座から振替可能な口座を取得
  getTransferableAccountsFrom(fromAccountCode: string): BankAccount[] {
    const fromAccount = this.bankAccountService.getAccount(fromAccountCode)
    if (!fromAccount || !fromAccount.isActive) {
      return []
    }
    
    const allAccounts = this.bankAccountService.getAccounts(false)
    return allAccounts.filter(toAccount => {
      // 同じ口座への振替は不可
      if (fromAccount.code === toAccount.code) return false
      
      // 振替可能なパターンをチェック
      if (fromAccount.division === 'BOTH' || toAccount.division === 'BOTH') {
        return true
      }
      
      // 管理口座 → 修繕口座
      if (fromAccount.division === 'KANRI' && toAccount.division === 'SHUZEN') {
        return true
      }
      
      // 修繕口座 → 管理口座
      if (fromAccount.division === 'SHUZEN' && toAccount.division === 'KANRI') {
        return true
      }
      
      // 同じ区分内での振替
      if (fromAccount.division === toAccount.division) {
        return true
      }
      
      return false
    })
  }
}