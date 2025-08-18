/**
 * @fileoverview 仕訳生成関連の型定義
 * @module 01-types/journalGeneration
 * @description
 * 取引から仕訳を自動生成するための型定義を提供します。
 */

import { TransactionType, TransactionStatus } from './transaction';

/**
 * 支払ステータス
 * @description 支払の状態
 */
export type PaymentStatus = 'paid' | 'unpaid' | 'partial';

/**
 * 仕訳生成パターン
 * @description 仕訳生成時の借方・貸方の設定パターン
 */
export interface JournalGenerationPattern {
  debitAccountCode?: string;
  creditAccountCode?: string;
  useTransactionAccount?: 'debit' | 'credit';
  usePaymentAccount?: 'debit' | 'credit';
  useDefaultAccount?: {
    position: 'debit' | 'credit';
    accountCode: string;
  };
}

/**
 * 仕訳生成ルール
 * @description 取引から仕訳を生成するためのルール定義
 */
export interface JournalGenerationRule {
  id: string;
  name: string;
  condition: {
    transactionType?: TransactionType;
    paymentStatus?: PaymentStatus;
    accountCode?: string;
    amountRange?: {
      min?: number;
      max?: number;
    };
    tags?: string[];
  };
  journalPattern: JournalGenerationPattern;
  priority: number;
  isActive: boolean;
}

/**
 * 拡張取引型（仕訳生成用）
 * @description 仕訳生成エンジンで使用する取引の拡張型
 */
export interface TransactionForJournal {
  id: string;
  type: TransactionType;
  amount: number;
  accountCode: string;
  paymentAccountCode?: string;
  status: PaymentStatus;
  occurredOn: string;
  note?: string;
  tags?: string[];
}