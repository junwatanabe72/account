/**
 * @fileoverview コア型定義
 * @module 01-types/core
 * @description
 * アプリケーション全体で使用される基本的な型定義を提供します。
 * 
 * @責務
 * - 基本的なプリミティブ型の定義
 * - 共通で使用される列挙型の定義
 * - ユーティリティ型の提供
 * 
 * @使用例
 * ```typescript
 * import { ID, DateString, Status } from '@/01-types/core';
 * ```
 * 
 * @更新履歴
 * - 2024-11-17: 初回作成
 */

/**
 * ID型
 * @description エンティティの一意識別子
 */
export type ID = string;

/**
 * 日付文字列型
 * @description ISO 8601形式の日付文字列 (YYYY-MM-DD)
 */
export type DateString = string;

/**
 * 日時文字列型
 * @description ISO 8601形式の日時文字列
 */
export type DateTimeString = string;

/**
 * 金額型
 * @description 0以上の数値
 */
export type Amount = number;

/**
 * 汎用ステータス型
 */
export type Status = 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled';

/**
 * エラー情報
 */
export interface ErrorInfo {
  code: string;
  message: string;
  field?: string;
  details?: unknown;
}

/**
 * ページネーション情報
 */
export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * ソート情報
 */
export interface SortInfo<T = string> {
  field: T;
  direction: 'asc' | 'desc';
}

/**
 * フィルタ条件の基底型
 */
export interface BaseFilter {
  dateFrom?: DateString;
  dateTo?: DateString;
  searchText?: string;
}

/**
 * API レスポンスの基底型
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ErrorInfo;
  timestamp: DateTimeString;
}

/**
 * 作成・更新情報を持つエンティティの基底型
 */
export interface BaseEntity {
  id: ID;
  createdAt: DateTimeString;
  updatedAt: DateTimeString;
  createdBy?: string;
  updatedBy?: string;
}

/**
 * 会計年度
 */
export interface FiscalYear {
  year: number;
  startDate: DateString;
  endDate: DateString;
  isCurrent: boolean;
}

/**
 * 期間指定
 */
export interface Period {
  startDate: DateString;
  endDate: DateString;
  label?: string;
}