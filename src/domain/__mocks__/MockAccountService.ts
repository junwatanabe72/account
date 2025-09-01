import { IAccountService } from '../interfaces/IAccountService'
import { HierarchicalAccount } from '../services/core/AccountService'
import { HierarchicalAccountInterface } from '../../types/services'

export class MockAccountService implements IAccountService {
  private mockAccounts = new Map<string, HierarchicalAccount>()
  
  get accounts(): HierarchicalAccountInterface[] {
    return Array.from(this.mockAccounts.values())
  }
  
  getAccount(code: string): HierarchicalAccountInterface | undefined {
    return this.mockAccounts.get(code)
  }
  
  getAccounts(): HierarchicalAccountInterface[] {
    return this.accounts
  }
  
  initializeAccounts(): void {
    // テスト用の最小限の勘定科目を設定
    const cash = new HierarchicalAccount(
      '1101',
      '現金',
      'ASSET',
      'DEBIT',
      ['KANRI', 'SHUZEN', 'PARKING', 'OTHER'],
      '現金勘定',
      true
    )
    cash.level = 2
    this.mockAccounts.set('1101', cash)
    
    const income = new HierarchicalAccount(
      '4111',
      '管理費収入',
      'REVENUE',
      'CREDIT',
      ['KANRI', 'SHUZEN', 'PARKING', 'OTHER'],
      '管理費収入勘定',
      true
    )
    income.level = 2
    this.mockAccounts.set('4111', income)
  }
  
  // テスト用ヘルパーメソッド
  addMockAccount(account: HierarchicalAccount): void {
    this.mockAccounts.set(account.code, account)
  }
  
  clearMockAccounts(): void {
    this.mockAccounts.clear()
  }
  
  setAccountBalance(code: string, balance: number): void {
    const account = this.mockAccounts.get(code)
    if (account) {
      account.balance = balance
    }
  }
}