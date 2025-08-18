/**
 * 勘定科目マスターデータ（静的データ）
 * このデータはアプリケーション全体で共通の定義として使用される
 * ユーザーによる変更は不可
 */

export interface AccountMaster {
  code: string
  name: string
  shortName: string
  category: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'
  subCategory: string
  accountType: 'DEBIT' | 'CREDIT'
  level: number
  parentCode?: string
  isPostable: boolean
  divisionCode: 'COMMON' | 'KANRI' | 'SHUZEN' | 'PARKING' | 'SPECIAL'
  displayOrder: number
  description?: string
}

// defaultAccountsDataから移行（静的データとして管理）
export { defaultAccountsData as ACCOUNT_MASTER } from '../defaultAccounts'

/**
 * 勘定科目コードから科目を取得
 */
export function getAccountByCode(code: string): AccountMaster | undefined {
  const { defaultAccountsData } = require('../defaultAccounts')
  return defaultAccountsData.find((acc: any) => acc.code === code)
}

/**
 * 親科目コードから子科目一覧を取得
 */
export function getChildAccounts(parentCode: string): AccountMaster[] {
  const { defaultAccountsData } = require('../defaultAccounts')
  return defaultAccountsData.filter((acc: any) => acc.parentCode === parentCode)
}

/**
 * カテゴリーから科目一覧を取得
 */
export function getAccountsByCategory(category: AccountMaster['category']): AccountMaster[] {
  const { defaultAccountsData } = require('../defaultAccounts')
  return defaultAccountsData.filter((acc: any) => acc.category === category)
}

/**
 * 仕訳可能な科目のみを取得
 */
export function getPostableAccounts(): AccountMaster[] {
  const { defaultAccountsData } = require('../defaultAccounts')
  return defaultAccountsData.filter((acc: any) => acc.isPostable)
}

/**
 * 階層構造を構築
 */
export function buildAccountTree(): Map<string, AccountMaster[]> {
  const { defaultAccountsData } = require('../defaultAccounts')
  const tree = new Map<string, AccountMaster[]>()
  
  // ルートレベル（parentCodeがない）
  const roots = defaultAccountsData.filter((acc: any) => !acc.parentCode)
  tree.set('root', roots)
  
  // 各親に対する子を設定
  defaultAccountsData.forEach((parent: any) => {
    const children = defaultAccountsData.filter((child: any) => child.parentCode === parent.code)
    if (children.length > 0) {
      tree.set(parent.code, children)
    }
  })
  
  return tree
}