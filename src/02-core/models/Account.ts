import { Account as AccountType } from '../../01-types/account';

export class Account {
  private readonly account: AccountType;

  constructor(account: AccountType) {
    this.account = Object.freeze({ ...account });
  }

  get code(): string {
    return this.account.code;
  }

  get name(): string {
    return this.account.name;
  }

  get type(): AccountType['type'] {
    return this.account.type;
  }

  get isPostable(): boolean {
    return this.account.isPostable;
  }

  get division(): AccountType['division'] {
    return this.account.division;
  }

  isDebitAccount(): boolean {
    return this.account.type === 'ASSET' || 
           this.account.type === 'EXPENSE';
  }

  isCreditAccount(): boolean {
    return this.account.type === 'LIABILITY' || 
           this.account.type === 'EQUITY' || 
           this.account.type === 'REVENUE';
  }

  belongsToDivision(division: 'KANRI' | 'SHUZEN' | 'COMMON'): boolean {
    return this.account.division === division || 
           this.account.division === 'COMMON';
  }

  calculateBalance(debits: number, credits: number): number {
    if (this.isDebitAccount()) {
      return debits - credits;
    } else {
      return credits - debits;
    }
  }

  formatBalance(amount: number): string {
    const absAmount = Math.abs(amount);
    const formattedAmount = absAmount.toLocaleString('ja-JP');
    
    if (amount === 0) {
      return '¥0';
    }
    
    if (this.isDebitAccount()) {
      return amount >= 0 ? `¥${formattedAmount}` : `(¥${formattedAmount})`;
    } else {
      return amount >= 0 ? `¥${formattedAmount}` : `(¥${formattedAmount})`;
    }
  }

  toJSON(): AccountType {
    return { ...this.account };
  }

  static fromJSON(data: AccountType): Account {
    return new Account(data);
  }
}