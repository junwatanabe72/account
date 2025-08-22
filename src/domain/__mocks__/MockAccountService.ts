import { IAccountService } from '../interfaces/IAccountService'
import { HierarchicalAccount } from '../services/core/AccountService'
import { HierarchicalAccountInterface } from '../../types/services'

export class MockAccountService implements IAccountService {
  private mockAccounts = new Map<string, HierarchicalAccountInterface>()
  
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
    this.addMockAccount({
      code: '1101',
      name: '現金',
      type: 'ASSET',
      normalBalance: 'DEBIT',
      level: 2,
      parentCode: null,
      children: [],
      balance: 0,
      debitBalance: 0,
      creditBalance: 0,
      isActive: true
    })
    
    this.addMockAccount({
      code: '4111',
      name: '管理費収入',
      type: 'REVENUE',
      normalBalance: 'CREDIT',
      level: 2,
      parentCode: null,
      children: [],
      balance: 0,
      debitBalance: 0,
      creditBalance: 0,
      isActive: true
    })
  }
  
  // テスト用ヘルパーメソッド
  addMockAccount(account: HierarchicalAccountInterface): void {
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