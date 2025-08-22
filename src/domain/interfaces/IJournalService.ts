/**
 * JournalService インタフェース
 * 仕訳管理の抽象化層
 * 
 * 目的: サービス間の依存を抽象化し、テスタビリティを向上
 */

// 循環参照を避けるため、型定義は types から import
import { CreateJournalResult } from '../../types'
import { JournalInterface } from '../../types/services'
import { Result } from '../../types/core'
import { JournalEntry } from '../../types/validation'

/**
 * Journal creation input type
 * TODO: Phase 5で完全な型定義に移行
 */
export interface CreateJournalInput {
  date: string
  description: string
  division: string
  details: Array<{
    accountCode: string
    debitAmount?: number | null
    creditAmount?: number | null
    description?: string
  }>
}

/**
 * Journal creation options
 */
export interface CreateJournalOptions {
  skipValidation?: boolean
  autoPost?: boolean
  source?: 'manual' | 'import' | 'api'
}

export interface IJournalService {
  // 読み取り専用メソッド
  getJournals(): JournalInterface[]
  getJournal(id: string): JournalInterface | undefined
  
  // 作成・更新メソッド (Phase 4: any型を具体的な型に置き換え)
  createJournal(
    journalData: CreateJournalInput | JournalEntry, 
    options?: CreateJournalOptions
  ): CreateJournalResult
  
  // ステータス管理（オプション）
  // 戻り値型を統一（CreateJournalResult | boolean で柔軟に対応）
  submitJournal?(id: string): CreateJournalResult | boolean
  approveJournal?(id: string): CreateJournalResult | boolean
  postJournalById?(id: string): CreateJournalResult | boolean
  deleteJournal?(id: string): CreateJournalResult | boolean
  updateJournal?(
    id: string, 
    data: Partial<CreateJournalInput>
  ): CreateJournalResult | boolean
  
  // データアクセス
  journals?: JournalInterface[]
}