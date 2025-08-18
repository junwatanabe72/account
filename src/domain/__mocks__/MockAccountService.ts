import { IAccountService } from '../interfaces/IAccountService'
import { HierarchicalAccount } from '../services/core/AccountService'

export class MockAccountService implements IAccountService {
  private mockAccounts = new Map<string, HierarchicalAccount>()
  
  get accounts(): HierarchicalAccount[] {
    return Array.from(this.mockAccounts.values())
  }
  
  getAccount(code: string): HierarchicalAccount | undefined {
    return this.mockAccounts.get(code)
  }
  
  getAccounts(): HierarchicalAccount[] {
    return this.accounts
  }
  
  initializeAccounts(): void {
    // テスト用の最小限の勘定科目を設定
    this.addMockAccount({
      code: '1101',
      name: '現金',
      type: 'ASSET',
      normalBalance: 'DEBIT',
      balance: 0,
      isActive: true,
      isDebitBalance: () => true,
      getDisplayBalance: () => 0,
      addToBalance: () => {},
      getAuxiliaryLedger: () => undefined,
      hasAuxiliary: false
    } as any)
    
    this.addMockAccount({
      code: '4111',
      name: '管理費収入',
      type: 'REVENUE',
      normalBalance: 'CREDIT',
      balance: 0,
      isActive: true,
      isDebitBalance: () => false,
      getDisplayBalance: () => 0,
      addToBalance: () => {},
      getAuxiliaryLedger: () => undefined,
      hasAuxiliary: false
    } as any)
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