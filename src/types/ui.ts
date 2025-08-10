// UIコンポーネント用の型定義

// Toast通知タイプ
export type ToastType = 'success' | 'info' | 'warning' | 'danger'

// Toast通知データ
export interface ToastNotification {
  id: number
  message: string
  type: ToastType
}

// タブタイプ
export type TabType = 'journal' | 'ledger' | 'reports' | 'settings' | 'statements'

// レポートタイプ
export type ReportType = 'trial-balance' | 'income-statement' | 'balance-sheet' | 'division-accounting'

// 仕訳フォームの行データ
export interface JournalFormRow {
  debit?: string
  debitAmount?: number
  credit?: string
  creditAmount?: number
}

// フィルター条件
export interface JournalFilter {
  startDate?: string
  endDate?: string
  accountCode?: string
  description?: string
  status?: string
}

// エクスポートオプション
export interface ExportOptions {
  format: 'csv' | 'excel' | 'json'
  includeHeaders: boolean
  dateRange?: {
    start: string
    end: string
  }
}

// 設定データ
export interface Settings {
  companyName?: string
  fiscalYearStart?: string
  displayOptions?: {
    showAccountCodes: boolean
    showDivisions: boolean
    dateFormat: string
  }
}

// モーダルプロパティ
export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
}

// テーブルカラム定義
export interface TableColumn<T> {
  key: keyof T
  label: string
  width?: string
  align?: 'left' | 'center' | 'right'
  format?: (value: any) => string
}

// ページネーション
export interface Pagination {
  currentPage: number
  pageSize: number
  totalItems: number
  totalPages: number
}

// ソート設定
export interface SortConfig {
  key: string
  direction: 'asc' | 'desc'
}

// エラー情報
export interface ErrorInfo {
  code: string
  message: string
  field?: string
  details?: any
}

// 検証結果
export interface ValidationResult {
  isValid: boolean
  errors: ErrorInfo[]
}

// アクション結果
export interface ActionResult<T = any> {
  success: boolean
  data?: T
  error?: ErrorInfo
}

// チャートデータ
export interface ChartData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    backgroundColor?: string
    borderColor?: string
  }>
}

// 期間選択オプション
export interface PeriodOption {
  value: string
  label: string
  startDate: () => string
  endDate: () => string
}

// プリント設定
export interface PrintOptions {
  title: string
  landscape?: boolean
  margins?: {
    top: number
    right: number
    bottom: number
    left: number
  }
  headerText?: string
  footerText?: string
}