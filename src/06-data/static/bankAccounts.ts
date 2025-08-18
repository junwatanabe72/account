// 口座マスターデータ
export interface BankAccount {
  id: string
  code: string
  name: string
  shortName: string
  accountType: 'cash' | 'savings' | 'checking' | 'time_deposit'
  division: 'KANRI' | 'SHUZEN' | 'BOTH'
  bankName?: string
  branchName?: string
  accountNumber?: string
  accountHolder?: string
  balance?: number
  isActive: boolean
  description?: string
  displayOrder: number
}

// デフォルトの口座データ
export const defaultBankAccounts: BankAccount[] = [
  {
    id: 'cash',
    code: '1101',
    name: '現金',
    shortName: '現金',
    accountType: 'cash',
    division: 'KANRI',
    isActive: true,
    description: '小口現金',
    displayOrder: 1
  },
  {
    id: 'kanri_bank_1',
    code: '1102',
    name: '普通預金（管理）',
    shortName: '管理口座',
    accountType: 'savings',
    division: 'KANRI',
    bankName: '三菱UFJ銀行',
    branchName: '○○支店',
    accountNumber: '1234567',
    accountHolder: '○○マンション管理組合',
    isActive: true,
    description: '管理費口座',
    displayOrder: 2
  },
  {
    id: 'shuzen_bank_1',
    code: '1103',
    name: '普通預金（修繕）',
    shortName: '修繕口座',
    accountType: 'savings',
    division: 'SHUZEN',
    bankName: '三菱UFJ銀行',
    branchName: '○○支店',
    accountNumber: '7654321',
    accountHolder: '○○マンション管理組合',
    isActive: true,
    description: '修繕積立金口座',
    displayOrder: 3
  },
  {
    id: 'time_deposit_1',
    code: '1104',
    name: '定期預金',
    shortName: '定期預金',
    accountType: 'time_deposit',
    division: 'SHUZEN',
    bankName: '三菱UFJ銀行',
    branchName: '○○支店',
    accountNumber: '9876543',
    accountHolder: '○○マンション管理組合',
    isActive: true,
    description: '修繕積立金運用',
    displayOrder: 4
  },
  {
    id: 'kanri_bank_2',
    code: '1105',
    name: '普通預金（管理予備）',
    shortName: '管理予備口座',
    accountType: 'savings',
    division: 'KANRI',
    bankName: 'みずほ銀行',
    branchName: '△△支店',
    accountNumber: '2345678',
    accountHolder: '○○マンション管理組合',
    isActive: false,
    description: '予備口座（未使用）',
    displayOrder: 5
  }
]

// 振替可能な口座の組み合わせを取得
export function getTransferableCombinations(): Array<{from: BankAccount, to: BankAccount[]}> {
  const activeAccounts = defaultBankAccounts.filter(acc => acc.isActive)
  const combinations: Array<{from: BankAccount, to: BankAccount[]}> = []
  
  activeAccounts.forEach(fromAccount => {
    const toAccounts = activeAccounts.filter(toAccount => {
      // 同じ口座への振替は不可
      if (fromAccount.id === toAccount.id) return false
      
      // 振替可能なパターン
      // 1. 管理口座 → 修繕口座
      // 2. 修繕口座 → 管理口座
      // 3. 同じ区分内での振替（管理→管理、修繕→修繕）
      if (fromAccount.division === 'KANRI' && toAccount.division === 'SHUZEN') return true
      if (fromAccount.division === 'SHUZEN' && toAccount.division === 'KANRI') return true
      if (fromAccount.division === toAccount.division) return true
      
      return false
    })
    
    if (toAccounts.length > 0) {
      combinations.push({ from: fromAccount, to: toAccounts })
    }
  })
  
  return combinations
}

// 口座コードから口座情報を取得
export function getBankAccountByCode(code: string): BankAccount | undefined {
  return defaultBankAccounts.find(acc => acc.code === code)
}

// 口座IDから口座情報を取得
export function getBankAccountById(id: string): BankAccount | undefined {
  return defaultBankAccounts.find(acc => acc.id === id)
}