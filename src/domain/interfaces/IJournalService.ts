/**
 * JournalService インタフェース
 * 仕訳管理の抽象化層
 * 
 * 目的: サービス間の依存を抽象化し、テスタビリティを向上
 */

import { Journal } from '../services/JournalService'
import { CreateJournalResult } from '../../types'

export interface IJournalService {
  // 読み取り専用メソッド
  getJournals(): Journal[]
  getJournal(id: string): Journal | undefined
  
  // 作成・更新メソッド
  createJournal(journalData: any, options?: any): CreateJournalResult
  
  // ステータス管理（オプション）
  submitJournal?(id: string): boolean
  approveJournal?(id: string): boolean
  postJournalById?(id: string): boolean
  deleteJournal?(id: string): boolean
  updateJournal?(id: string, data: any): boolean
  
  // データアクセス
  journals?: Journal[]
}