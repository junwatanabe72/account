// 仕訳生成エンジン - 取引データから仕訳を自動生成

import { Transaction, TransactionType, PaymentStatus, JournalGenerationRule, JournalPattern } from '../../types/transaction'
import { JournalData, JournalDetail } from '../../types/accounting'
import { AccountService } from './AccountService'
import { IAccountService } from '../interfaces/IAccountService'

export class JournalGenerationEngine {
  private rules: JournalGenerationRule[] = []
  
  constructor(private accountService: AccountService | IAccountService) {
    this.initializeDefaultRules()
  }
  
  // デフォルトの仕訳生成ルールを初期化
  private initializeDefaultRules() {
    this.rules = [
      // 収入取引（未決済）
      {
        id: 'rule_income_unpaid',
        name: '収入取引（未決済）',
        condition: {
          transactionType: 'income',
          paymentStatus: 'unpaid'
        },
        journalPattern: {
          debitAccountCode: '1131',  // 未収入金
          useTransactionAccount: 'credit'
        },
        priority: 100,
        isActive: true
      },
      
      // 収入取引（決済済み）
      {
        id: 'rule_income_paid',
        name: '収入取引（決済済み）',
        condition: {
          transactionType: 'income',
          paymentStatus: 'paid'
        },
        journalPattern: {
          usePaymentAccount: 'debit',
          useTransactionAccount: 'credit'
        },
        priority: 100,
        isActive: true
      },
      
      // 支出取引（未決済）
      {
        id: 'rule_expense_unpaid',
        name: '支出取引（未決済）',
        condition: {
          transactionType: 'expense',
          paymentStatus: 'unpaid'
        },
        journalPattern: {
          useTransactionAccount: 'debit',
          creditAccountCode: '2121'  // 未払金
        },
        priority: 100,
        isActive: true
      },
      
      // 支出取引（決済済み）
      {
        id: 'rule_expense_paid',
        name: '支出取引（決済済み）',
        condition: {
          transactionType: 'expense',
          paymentStatus: 'paid'
        },
        journalPattern: {
          useTransactionAccount: 'debit',
          usePaymentAccount: 'credit'
        },
        priority: 100,
        isActive: true
      },
      
      // 資金移動
      {
        id: 'rule_transfer',
        name: '資金移動',
        condition: {
          transactionType: 'transfer'
        },
        journalPattern: {
          useTransactionAccount: 'debit',  // 移動先
          usePaymentAccount: 'credit'       // 移動元
        },
        priority: 100,
        isActive: true
      }
    ]
  }
  
  // 取引から仕訳を生成
  generateJournal(transaction: Transaction): JournalData {
    // 適用可能なルールを検索
    const applicableRule = this.findApplicableRule(transaction)
    
    if (!applicableRule) {
      throw new Error(`取引タイプ ${transaction.type} に対する仕訳生成ルールが見つかりません`)
    }
    
    // 仕訳明細を生成
    const details = this.generateJournalDetails(transaction, applicableRule.journalPattern)
    
    // 仕訳データを構築
    const journalData: JournalData = {
      date: transaction.occurredOn,
      description: this.generateDescription(transaction),
      reference: transaction.id,
      details: details
    }
    
    return journalData
  }
  
  // 適用可能なルールを検索
  private findApplicableRule(transaction: Transaction): JournalGenerationRule | undefined {
    const applicableRules = this.rules
      .filter(rule => rule.isActive)
      .filter(rule => this.matchesCondition(transaction, rule.condition))
      .sort((a, b) => b.priority - a.priority)
    
    return applicableRules[0]
  }
  
  // 条件にマッチするか判定
  private matchesCondition(transaction: Transaction, condition: any): boolean {
    if (condition.transactionType && condition.transactionType !== transaction.type) {
      return false
    }
    
    if (condition.paymentStatus && condition.paymentStatus !== transaction.status) {
      return false
    }
    
    if (condition.accountCode && condition.accountCode !== transaction.accountCode) {
      return false
    }
    
    if (condition.amountRange) {
      const { min, max } = condition.amountRange
      if (min !== undefined && transaction.amount < min) return false
      if (max !== undefined && transaction.amount > max) return false
    }
    
    if (condition.tags && condition.tags.length > 0) {
      if (!transaction.tags || !condition.tags.some(tag => transaction.tags?.includes(tag))) {
        return false
      }
    }
    
    return true
  }
  
  // 仕訳明細を生成
  private generateJournalDetails(transaction: Transaction, pattern: JournalPattern): JournalDetail[] {
    const details: JournalDetail[] = []
    
    // 借方勘定科目を決定
    let debitAccountCode = ''
    if (pattern.debitAccountCode) {
      debitAccountCode = pattern.debitAccountCode
    } else if (pattern.useTransactionAccount === 'debit') {
      debitAccountCode = transaction.accountCode
    } else if (pattern.usePaymentAccount === 'debit' && transaction.paymentAccountCode) {
      debitAccountCode = transaction.paymentAccountCode
    } else if (pattern.useDefaultAccount?.position === 'debit') {
      debitAccountCode = pattern.useDefaultAccount.accountCode
    }
    
    // 貸方勘定科目を決定
    let creditAccountCode = ''
    if (pattern.creditAccountCode) {
      creditAccountCode = pattern.creditAccountCode
    } else if (pattern.useTransactionAccount === 'credit') {
      creditAccountCode = transaction.accountCode
    } else if (pattern.usePaymentAccount === 'credit' && transaction.paymentAccountCode) {
      creditAccountCode = transaction.paymentAccountCode
    } else if (pattern.useDefaultAccount?.position === 'credit') {
      creditAccountCode = pattern.useDefaultAccount.accountCode
    }
    
    // 勘定科目の妥当性を確認
    if (!this.accountService.getAccount(debitAccountCode)) {
      throw new Error(`借方勘定科目 ${debitAccountCode} が見つかりません`)
    }
    if (!this.accountService.getAccount(creditAccountCode)) {
      throw new Error(`貸方勘定科目 ${creditAccountCode} が見つかりません`)
    }
    
    // 仕訳明細を作成
    details.push({
      accountCode: debitAccountCode,
      debitAmount: transaction.amount,
      creditAmount: 0,
      description: transaction.note
    })
    
    details.push({
      accountCode: creditAccountCode,
      debitAmount: 0,
      creditAmount: transaction.amount,
      description: transaction.note
    })
    
    return details
  }
  
  // 仕訳の摘要を生成
  private generateDescription(transaction: Transaction): string {
    let description = ''
    
    // 取引タイプに応じた摘要を生成
    switch (transaction.type) {
      case 'income':
        const incomeAccount = this.accountService.getAccount(transaction.accountCode)
        description = incomeAccount ? `${incomeAccount.name}` : '収入取引'
        break
      
      case 'expense':
        const expenseAccount = this.accountService.getAccount(transaction.accountCode)
        description = expenseAccount ? `${expenseAccount.name}` : '支出取引'
        break
      
      case 'transfer':
        const fromAccount = transaction.paymentAccountCode ? 
          this.accountService.getAccount(transaction.paymentAccountCode) : null
        const toAccount = this.accountService.getAccount(transaction.accountCode)
        
        if (fromAccount && toAccount) {
          description = `資金移動: ${fromAccount.name} → ${toAccount.name}`
        } else {
          description = '資金移動'
        }
        break
    }
    
    // 備考があれば追加
    if (transaction.note) {
      description += ` - ${transaction.note}`
    }
    
    return description
  }
  
  // カスタムルールを追加
  addRule(rule: JournalGenerationRule) {
    this.rules.push(rule)
    // 優先度順にソート
    this.rules.sort((a, b) => b.priority - a.priority)
  }
  
  // ルールを削除
  removeRule(ruleId: string) {
    this.rules = this.rules.filter(r => r.id !== ruleId)
  }
  
  // ルールを更新
  updateRule(ruleId: string, updates: Partial<JournalGenerationRule>) {
    const ruleIndex = this.rules.findIndex(r => r.id === ruleId)
    if (ruleIndex !== -1) {
      this.rules[ruleIndex] = { ...this.rules[ruleIndex], ...updates }
      // 優先度順に再ソート
      this.rules.sort((a, b) => b.priority - a.priority)
    }
  }
  
  // すべてのルールを取得
  getRules(): JournalGenerationRule[] {
    return [...this.rules]
  }
  
  // 決済時の仕訳を生成（未決済→決済済み）
  generatePaymentJournal(transaction: Transaction, paymentAccountCode: string): JournalData {
    const details: JournalDetail[] = []
    
    if (transaction.type === 'income') {
      // 収入の決済: 借方=決済口座、貸方=未収入金
      details.push({
        accountCode: paymentAccountCode,
        debitAmount: transaction.amount,
        creditAmount: 0,
        description: `決済: ${transaction.note || ''}`
      })
      details.push({
        accountCode: '1131',  // 未収入金
        debitAmount: 0,
        creditAmount: transaction.amount,
        description: `決済: ${transaction.note || ''}`
      })
    } else if (transaction.type === 'expense') {
      // 支出の決済: 借方=未払金、貸方=決済口座
      details.push({
        accountCode: '2121',  // 未払金
        debitAmount: transaction.amount,
        creditAmount: 0,
        description: `決済: ${transaction.note || ''}`
      })
      details.push({
        accountCode: paymentAccountCode,
        debitAmount: 0,
        creditAmount: transaction.amount,
        description: `決済: ${transaction.note || ''}`
      })
    }
    
    return {
      date: new Date().toISOString().split('T')[0],
      description: `決済処理: ${this.generateDescription(transaction)}`,
      reference: `payment_${transaction.id}`,
      details: details
    }
  }
}