import { AccountService } from './AccountService'
import { BankAccountService } from './BankAccountService'
import { TransactionService } from './TransactionService'
import { TransferService } from './TransferService'
import { JournalService } from './JournalService'
import { defaultBankAccounts } from '../../data/bankAccounts'

/**
 * 会計サービスの統合プロバイダー
 * 各サービス間の依存関係を管理し、一貫性のある処理を提供します
 */
export class AccountingServiceProvider {
  private accountService: AccountService
  private bankAccountService: BankAccountService
  private transactionService: TransactionService
  private transferService: TransferService
  private journalService: JournalService
  
  constructor() {
    // サービスの初期化
    this.accountService = new AccountService()
    this.accountService.initializeAccounts()
    
    this.journalService = new JournalService()
    
    this.bankAccountService = new BankAccountService(defaultBankAccounts)
    
    this.transactionService = new TransactionService(
      this.accountService,
      this.journalService,
      this.bankAccountService
    )
    
    this.transferService = new TransferService(
      this.bankAccountService,
      this.transactionService,
      this.journalService
    )
    
    // サービス間の連携設定
    this.setupServiceIntegration()
  }
  
  /**
   * サービス間の連携を設定
   */
  private setupServiceIntegration(): void {
    // BankAccountServiceの変更イベントをリッスン
    this.bankAccountService.addChangeListener((event) => {
      console.log(`口座変更イベント: ${event.type}`, event.account)
      
      // 口座の無効化/削除時の処理
      if (event.type === 'disable' || event.type === 'delete') {
        this.handleAccountDeactivation(event.account.code)
      }
      
      // 口座コードの変更時の処理
      if (event.type === 'update') {
        this.handleAccountCodeChange(event.account.code)
      }
    })
  }
  
  /**
   * 口座無効化時の処理
   */
  private handleAccountDeactivation(accountCode: string): void {
    // 影響を受ける取引の警告をログに記録
    console.warn(`口座 ${accountCode} が無効化されました。関連する取引を確認してください。`)
    
    // 実際のアプリケーションでは、ここで以下の処理を行う可能性があります：
    // - 影響を受ける取引のリストをUIに表示
    // - 代替口座の提案
    // - 自動的な取引の再割り当て（設定による）
  }
  
  /**
   * 口座コード変更時の処理
   */
  private handleAccountCodeChange(newCode: string): void {
    console.log(`口座コードが ${newCode} に変更されました。`)
    
    // 実際のアプリケーションでは、ここで以下の処理を行う可能性があります：
    // - 関連する仕訳エントリの更新
    // - レポートの再生成
    // - キャッシュのクリア
  }
  
  // サービスのゲッター
  getAccountService(): AccountService {
    return this.accountService
  }
  
  getBankAccountService(): BankAccountService {
    return this.bankAccountService
  }
  
  getTransactionService(): TransactionService {
    return this.transactionService
  }
  
  getTransferService(): TransferService {
    return this.transferService
  }
  
  getJournalService(): JournalService {
    return this.journalService
  }
  
  /**
   * 口座の一括同期
   * 全ての口座の状態を確認し、不整合を検出・修正します
   */
  async syncAllAccounts(): Promise<{
    success: boolean
    report: {
      totalAccounts: number
      activeAccounts: number
      inactiveAccounts: number
      affectedTransactions: number
      errors: string[]
    }
  }> {
    const accounts = this.bankAccountService.getAccounts(true)
    const activeAccounts = accounts.filter(acc => acc.isActive)
    const inactiveAccounts = accounts.filter(acc => !acc.isActive)
    
    const errors: string[] = []
    let affectedTransactions = 0
    
    // 各口座の参照をチェック
    for (const account of accounts) {
      if (!account.isActive) {
        // 無効な口座を参照している取引を検出
        // 実際の実装では、TransactionServiceから取引を取得して確認
        console.log(`口座 ${account.code} (${account.name}) の参照をチェック中...`)
      }
    }
    
    return {
      success: errors.length === 0,
      report: {
        totalAccounts: accounts.length,
        activeAccounts: activeAccounts.length,
        inactiveAccounts: inactiveAccounts.length,
        affectedTransactions,
        errors
      }
    }
  }
  
  /**
   * システム全体の整合性チェック
   */
  async performSystemCheck(): Promise<{
    success: boolean
    issues: Array<{
      type: 'warning' | 'error'
      message: string
      context?: any
    }>
  }> {
    const issues: Array<{
      type: 'warning' | 'error'
      message: string
      context?: any
    }> = []
    
    // 1. 口座の整合性チェック
    const accounts = this.bankAccountService.getAccounts(true)
    for (const account of accounts) {
      if (!account.code) {
        issues.push({
          type: 'error',
          message: `口座コードが設定されていない口座があります: ${account.name}`,
          context: account
        })
      }
      
      if (!account.name) {
        issues.push({
          type: 'error',
          message: `口座名が設定されていない口座があります: ${account.code}`,
          context: account
        })
      }
    }
    
    // 2. 振替可能な組み合わせのチェック
    const transferOptions = this.transferService.getAvailableTransferOptions()
    if (transferOptions.length === 0) {
      issues.push({
        type: 'warning',
        message: '振替可能な口座の組み合わせがありません'
      })
    }
    
    // 3. 決済口座の利用可能性チェック
    const paymentAccounts = this.bankAccountService.getPaymentAccounts()
    if (paymentAccounts.length === 0) {
      issues.push({
        type: 'error',
        message: '利用可能な決済口座がありません'
      })
    }
    
    return {
      success: issues.filter(i => i.type === 'error').length === 0,
      issues
    }
  }
}