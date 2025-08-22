/**
 * 銀行明細インポートサービス
 * Phase 14: 銀行入金処理と未収金管理
 */

import Papa from 'papaparse'
import { 
  BankTransaction, 
  ImportResult, 
  ImportError,
  BankFormatAdapter,
  ColumnMapping
} from '../../../types/payment'
import { JournalService } from '../core/JournalService'
import { AccountService } from '../core/AccountService'

type CSVRow = Record<string, string | number | undefined>

/**
 * 汎用銀行フォーマットアダプター
 */
class GenericBankAdapter implements BankFormatAdapter {
  bankCode = 'generic'
  bankName = '汎用フォーマット'

  getColumnMapping(): ColumnMapping {
    return {
      date: '日付',
      description: '摘要',
      deposit: '入金',
      withdrawal: '出金',
      balance: '残高'
    }
  }

  parse(rawData: CSVRow[]): BankTransaction[] {
    const mapping = this.getColumnMapping()
    return rawData.map((row, index) => {
      const depositAmount = this.parseAmount(row[mapping.deposit!])
      const withdrawalAmount = this.parseAmount(row[mapping.withdrawal!])
      
      return {
        id: this.generateTransactionId(row, index),
        date: this.parseDate(row[mapping.date]),
        description: row[mapping.description] || '',
        depositAmount,
        withdrawalAmount,
        amount: depositAmount - withdrawalAmount,
        balance: this.parseAmount(row[mapping.balance!]),
        bankCode: this.bankCode,
        transactionType: depositAmount > 0 ? 'deposit' : 'withdrawal',
        status: 'unprocessed'
      }
    })
  }

  validate(data: CSVRow): boolean {
    const mapping = this.getColumnMapping()
    return !!(data[mapping.date] && data[mapping.description])
  }

  private parseAmount(value: string | number | undefined): number {
    if (!value) return 0
    const cleaned = String(value).replace(/[,，\s]/g, '')
    return parseFloat(cleaned) || 0
  }

  private parseDate(value: string): string {
    // YYYY-MM-DD, YYYY/MM/DD, DD/MM/YYYY などに対応
    const dateStr = String(value).trim()
    
    // YYYY-MM-DD形式
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr
    }
    
    // YYYY/MM/DD形式
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(dateStr)) {
      return dateStr.replace(/\//g, '-')
    }
    
    // DD/MM/YYYY形式
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split('/')
      return `${year}-${month}-${day}`
    }
    
    // 和暦対応（令和6年4月25日 -> 2024-04-25）
    const reiwaMatch = dateStr.match(/令和(\d+)年(\d+)月(\d+)日/)
    if (reiwaMatch) {
      const year = 2018 + parseInt(reiwaMatch[1])
      const month = reiwaMatch[2].padStart(2, '0')
      const day = reiwaMatch[3].padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    return dateStr
  }

  private generateTransactionId(row: CSVRow, index: number): string {
    const hash = Object.values(row).join('_')
    return `txn_${Date.now()}_${index}_${this.simpleHash(hash)}`
  }

  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(36)
  }
}

/**
 * 三菱UFJ銀行アダプター
 */
class MUFGAdapter extends GenericBankAdapter {
  bankCode = 'mufg'
  bankName = '三菱UFJ銀行'

  getColumnMapping(): ColumnMapping {
    return {
      date: 'お取引日',
      description: '摘要',
      deposit: 'お預入れ',
      withdrawal: 'お引出し',
      balance: '残高'
    }
  }
}

/**
 * 三井住友銀行アダプター
 */
class SMBCAdapter extends GenericBankAdapter {
  bankCode = 'smbc'
  bankName = '三井住友銀行'

  getColumnMapping(): ColumnMapping {
    return {
      date: '取引日',
      description: '摘要',
      deposit: '入金額',
      withdrawal: '出金額',
      balance: '残高'
    }
  }
}

/**
 * みずほ銀行アダプター
 */
class MizuhoAdapter extends GenericBankAdapter {
  bankCode = 'mizuho'
  bankName = 'みずほ銀行'

  getColumnMapping(): ColumnMapping {
    return {
      date: '取引日',
      description: 'お取引内容',
      deposit: '入金',
      withdrawal: '出金',
      balance: '残高'
    }
  }
}

export class BankImportService {
  private adapters: Map<string, BankFormatAdapter>
  private importedTransactions: Map<string, BankTransaction> = new Map()

  constructor(
    private journalService: JournalService,
    private accountService: AccountService
  ) {
    // 銀行アダプターの登録
    this.adapters = new Map([
      ['generic', new GenericBankAdapter()],
      ['mufg', new MUFGAdapter()],
      ['smbc', new SMBCAdapter()],
      ['mizuho', new MizuhoAdapter()]
    ])

    this.loadFromStorage()
  }

  /**
   * CSVファイルをインポート
   */
  async importCSV(
    file: File, 
    bankType: 'mufg' | 'smbc' | 'mizuho' | 'generic' = 'generic'
  ): Promise<ImportResult> {
    const batchId = this.generateBatchId()
    const errors: ImportError[] = []
    
    try {
      // CSV解析
      const rawData = await this.parseCSVFile(file)
      
      if (rawData.length === 0) {
        throw new Error('CSVファイルが空です')
      }

      // 銀行別フォーマット変換
      const adapter = this.adapters.get(bankType)
      if (!adapter) {
        throw new Error(`未対応の銀行タイプ: ${bankType}`)
      }

      // データ変換
      const transactions = adapter.parse(rawData)
      
      // バッチIDを設定
      transactions.forEach(txn => {
        txn.importBatchId = batchId
      })

      // 重複チェック
      const uniqueTransactions = this.filterDuplicates(transactions)
      const duplicateCount = transactions.length - uniqueTransactions.length

      // 検証
      uniqueTransactions.forEach((txn, index) => {
        const validationErrors = this.validateTransaction(txn, index)
        errors.push(...validationErrors)
      })

      // 保存
      uniqueTransactions.forEach(txn => {
        this.importedTransactions.set(txn.id, txn)
      })
      this.saveToStorage()

      return {
        batchId,
        total: rawData.length,
        imported: uniqueTransactions.length,
        duplicates: duplicateCount,
        errors,
        transactions: uniqueTransactions,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      errors.push({
        row: 0,
        message: error instanceof Error ? error.message : 'インポートエラー',
        severity: 'error'
      })

      return {
        batchId,
        total: 0,
        imported: 0,
        duplicates: 0,
        errors,
        transactions: [],
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * CSVファイルを解析
   */
  private parseCSVFile(file: File): Promise<CSVRow[]> {
    return new Promise((resolve, reject) => {
      // エンコーディングを自動判定
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const text = e.target?.result as string
        
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          encoding: 'UTF-8',
          complete: (results) => {
            if (results.errors.length > 0) {
              console.warn('CSV parsing warnings:', results.errors)
            }
            resolve(results.data)
          },
          error: (error) => {
            reject(new Error(`CSV解析エラー: ${error.message}`))
          }
        })
      }

      reader.onerror = () => {
        reject(new Error('ファイル読み込みエラー'))
      }

      // まずUTF-8で試し、失敗したらShift-JISで再試行
      reader.readAsText(file, 'UTF-8')
    })
  }

  /**
   * 重複をフィルタリング
   */
  private filterDuplicates(transactions: BankTransaction[]): BankTransaction[] {
    const seen = new Set<string>()
    const unique: BankTransaction[] = []

    for (const txn of transactions) {
      // 重複判定キー：日付 + 摘要 + 金額 + 残高
      const key = `${txn.date}_${txn.description}_${txn.amount}_${txn.balance}`
      
      if (!seen.has(key)) {
        seen.add(key)
        unique.push(txn)
      }
    }

    return unique
  }

  /**
   * トランザクションを検証
   */
  private validateTransaction(txn: BankTransaction, row: number): ImportError[] {
    const errors: ImportError[] = []

    // 日付検証
    if (!txn.date || !/^\d{4}-\d{2}-\d{2}$/.test(txn.date)) {
      errors.push({
        row,
        field: 'date',
        value: txn.date,
        message: '日付形式が不正です',
        severity: 'warning'
      })
    }

    // 金額検証
    if (isNaN(txn.amount)) {
      errors.push({
        row,
        field: 'amount',
        value: String(txn.amount),
        message: '金額が数値ではありません',
        severity: 'error'
      })
    }

    // 摘要検証
    if (!txn.description || txn.description.trim() === '') {
      errors.push({
        row,
        field: 'description',
        value: txn.description,
        message: '摘要が空です',
        severity: 'warning'
      })
    }

    return errors
  }

  /**
   * インポート済みトランザクションを取得
   */
  getImportedTransactions(batchId?: string): BankTransaction[] {
    const transactions = Array.from(this.importedTransactions.values())
    
    if (batchId) {
      return transactions.filter(txn => txn.importBatchId === batchId)
    }
    
    return transactions
  }

  /**
   * トランザクションのステータスを更新
   */
  updateTransactionStatus(
    transactionId: string, 
    status: BankTransaction['status'],
    journalId?: string
  ): void {
    const txn = this.importedTransactions.get(transactionId)
    if (txn) {
      txn.status = status
      if (journalId) {
        txn.matchedJournalId = journalId
      }
      this.saveToStorage()
    }
  }

  /**
   * バッチIDを生成
   */
  private generateBatchId(): string {
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
    const timeStr = now.toISOString().slice(11, 19).replace(/:/g, '')
    return `batch_${dateStr}_${timeStr}`
  }

  /**
   * LocalStorageから読み込み
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('bankTransactions')
      if (stored) {
        const data = JSON.parse(stored)
        data.forEach((txn: BankTransaction) => {
          this.importedTransactions.set(txn.id, txn)
        })
      }
    } catch (error) {
      console.error('Failed to load bank transactions from storage:', error)
    }
  }

  /**
   * LocalStorageに保存
   */
  private saveToStorage(): void {
    try {
      const data = Array.from(this.importedTransactions.values())
      localStorage.setItem('bankTransactions', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save bank transactions to storage:', error)
    }
  }

  /**
   * データをクリア（テスト用）
   */
  clearAll(): void {
    this.importedTransactions.clear()
    localStorage.removeItem('bankTransactions')
  }
}