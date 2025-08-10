// マスターデータ関連の型定義

// 区分所有者詳細情報
export interface UnitOwnerDetail {
  id: string
  unitNumber: string // 部屋番号
  ownerInfo: {
    name: string
    nameKana?: string
    postalCode?: string
    address?: string
    phone?: string
    mobile?: string
    email?: string
    emergencyContact?: string
    emergencyPhone?: string
  }
  residentInfo?: {
    name?: string
    nameKana?: string
    phone?: string
    mobile?: string
    relationship?: string // 所有者との関係
  }
  bankAccount?: {
    bankName: string
    branchName: string
    accountType: '普通' | '当座'
    accountNumber: string
    accountHolder: string
  }
  fees: {
    managementFee: number // 管理費
    reserveFund: number // 修繕積立金
    parkingFee?: number // 駐車場代
    bicycleParkingFee?: number // 駐輪場代
    otherFees?: Array<{
      name: string
      amount: number
    }>
  }
  status: {
    isActive: boolean
    moveInDate?: string
    moveOutDate?: string
    remarks?: string
  }
  paymentHistory?: {
    lastPaymentDate?: string
    unpaidAmount?: number // 未収金
    prepaidAmount?: number // 前受金
  }
}

// 共用施設契約情報
export interface FacilityContract {
  id: string
  facilityType: 'parking' | 'bicycleParking' | 'storageRoom' | 'other'
  facilityNumber: string // 区画番号
  contractInfo: {
    unitNumber?: string // 契約部屋番号
    contractorName?: string
    startDate?: string
    endDate?: string
    monthlyFee: number
    status: 'vacant' | 'occupied' | 'reserved' | 'maintenance'
  }
  location?: {
    floor?: string
    area?: string
    size?: string
  }
  nextAvailableDate?: string
  remarks?: string
}

// 業者・発注先情報
export interface VendorDetail {
  id: string
  vendorInfo: {
    name: string
    nameKana?: string
    registrationNumber?: string // 法人番号
    representativeName?: string
    postalCode?: string
    address?: string
    phone?: string
    fax?: string
    email?: string
    website?: string
  }
  bankAccount?: {
    bankName: string
    branchName: string
    accountType: '普通' | '当座'
    accountNumber: string
    accountHolder: string
  }
  contractInfo: {
    contractType: 'regular' | 'spot' | 'annual'
    serviceCategory: string // 清掃、設備点検、修繕等
    contractStartDate?: string
    contractEndDate?: string
    paymentTerms?: string // 支払条件
    paymentSchedule?: 'monthly' | 'quarterly' | 'annual' | 'ondemand'
    standardAmount?: number
  }
  documents?: Array<{
    id: string
    documentType: 'contract' | 'invoice' | 'quote' | 'report' | 'other'
    fileName: string
    uploadDate: string
    filePath?: string
    description?: string
  }>
  paymentHistory?: Array<{
    date: string
    amount: number
    description: string
    invoiceNumber?: string
  }>
  evaluations?: {
    rating?: number // 1-5
    lastEvaluationDate?: string
    notes?: string
  }
  isActive: boolean
}

// 自動仕訳ルール
export interface AutoJournalRule {
  id: string
  ruleName: string
  priority: number // ルールの優先順位
  conditions: {
    transactionType?: 'income' | 'expense'
    amountRange?: {
      min?: number
      max?: number
    }
    descriptionPatterns?: string[] // 摘要に含まれるキーワード
    vendorName?: string
    bankAccountPattern?: string
    datePattern?: {
      dayOfMonth?: number[] // 特定の日付
      monthlyRecurring?: boolean
    }
  }
  actions: {
    debitAccount: string
    creditAccount: string
    division?: string
    auxiliaryCode?: string
    description?: string
    taxRate?: number
  }
  isActive: boolean
  createdAt: string
  updatedAt: string
  usageCount: number // 使用回数
  lastUsedAt?: string
}

// 銀行明細インポート設定
export interface BankStatementImportConfig {
  bankName: string
  csvFormat: {
    encoding: 'UTF-8' | 'Shift-JIS'
    delimiter: ',' | '\t' | ';'
    hasHeader: boolean
    columns: {
      date: number
      description: number
      withdrawal?: number
      deposit?: number
      balance?: number
      category?: number
      memo?: number
    }
    dateFormat: string // 'YYYY/MM/DD', 'YYYY-MM-DD', etc.
  }
}

// 銀行明細データ
export interface BankTransaction {
  id: string
  date: string
  description: string
  amount: number // 正: 入金, 負: 出金
  balance?: number
  category?: string
  memo?: string
  matched?: boolean // 仕訳と照合済みか
  journalId?: string // 紐付けられた仕訳ID
}

// LLM仕訳提案
export interface JournalSuggestion {
  transactionId: string
  confidence: number // 0-100 信頼度
  suggestedJournal: {
    date: string
    description: string
    debitAccount: string
    debitAccountName?: string
    creditAccount: string
    creditAccountName?: string
    amount: number
    division?: string
    auxiliaryCode?: string
    memo?: string
  }
  reasoning?: string // LLMの判断理由
  alternativeSuggestions?: Array<{
    debitAccount: string
    creditAccount: string
    confidence: number
  }>
}