/**
 * @fileoverview 勘定科目関連の型定義
 * @module 01-types/account
 * @description
 * 勘定科目に関するすべての型定義を提供します。
 * 
 * @責務
 * - 勘定科目エンティティの型定義
 * - 勘定科目分類の型定義
 * - 勘定科目階層の型定義
 * 
 * @使用例
 * ```typescript
 * import { Account, AccountType } from '@/01-types/account';
 * ```
 * 
 * @更新履歴
 * - 2024-11-17: 初回作成
 */

import { ID, Amount } from './core';

/**
 * 勘定科目タイプ
 * @description 貸借対照表・損益計算書の分類
 */
export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

/**
 * 貸借区分
 * @description 通常の借方/貸方
 */
export type NormalBalance = 'DEBIT' | 'CREDIT';

/**
 * 勘定科目
 * @description 勘定科目マスタの基本情報
 */
export interface Account {
  code: string;
  name: string;
  type: AccountType;
  normalBalance: NormalBalance;
  parentCode?: string;
  isActive: boolean;
  isPostable: boolean;
  division?: 'KANRI' | 'SHUZEN' | 'COMMON';
  isSystemAccount?: boolean;
  description?: string;
}

/**
 * 勘定科目残高
 * @description 期間残高情報
 */
export interface AccountBalance {
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  beginningBalance: Amount;
  debitAmount: Amount;
  creditAmount: Amount;
  endingBalance: Amount;
}

/**
 * 勘定科目階層
 * @description 親子関係を持つ勘定科目
 */
export interface HierarchicalAccount extends Account {
  level: number;
  children: HierarchicalAccount[];
  totalBalance?: Amount;
}

/**
 * 勘定科目カテゴリ
 * @description UI表示用のグループ分け
 */
export interface AccountCategory {
  id: string;
  name: string;
  type: AccountType;
  accounts: Account[];
  displayOrder: number;
}