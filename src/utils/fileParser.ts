// ファイル解析ユーティリティ

import * as XLSX from 'xlsx'
import Papa from 'papaparse'

// ファイル形式の種類
export type FileFormat = 'csv' | 'tsv' | 'excel' | 'text' | 'unknown'

// 解析結果の型
export interface ParsedFileData {
  format: FileFormat
  rawText: string
  structured?: {
    headers?: string[]
    rows: string[][]
  }
  encoding?: string
  metadata: {
    fileName: string
    fileSize: number
    lastModified?: Date
  }
}

// ファイル解析エラー
export class FileParseError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'FileParseError'
  }
}

// ファイル解析クラス
export class FileParser {
  
  // ファイル形式の判定
  static detectFormat(file: File): FileFormat {
    const extension = file.name.toLowerCase().split('.').pop()
    
    switch (extension) {
      case 'csv':
        return 'csv'
      case 'tsv':
      case 'tab':
        return 'tsv'
      case 'xlsx':
      case 'xls':
        return 'excel'
      case 'txt':
        return 'text'
      default:
        return 'unknown'
    }
  }

  // メインの解析メソッド
  static async parseFile(file: File): Promise<ParsedFileData> {
    const format = this.detectFormat(file)
    
    const metadata = {
      fileName: file.name,
      fileSize: file.size,
      lastModified: new Date(file.lastModified)
    }

    try {
      switch (format) {
        case 'csv':
          return await this.parseCsv(file, metadata)
        case 'tsv':
          return await this.parseTsv(file, metadata)
        case 'excel':
          return await this.parseExcel(file, metadata)
        case 'text':
          return await this.parseText(file, metadata)
        default:
          // 不明な形式もテキストとして試行
          return await this.parseText(file, metadata)
      }
    } catch (error) {
      throw new FileParseError(
        `ファイル解析に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PARSE_ERROR'
      )
    }
  }

  // CSV解析
  private static async parseCsv(file: File, metadata: ParsedFileData['metadata']): Promise<ParsedFileData> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        encoding: 'UTF-8',
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const rawText = this.arrayToText(results.data as string[][])
            
            resolve({
              format: 'csv',
              rawText,
              structured: {
                headers: results.data.length > 0 ? results.data[0] as string[] : undefined,
                rows: results.data as string[][]
              },
              encoding: 'UTF-8',
              metadata
            })
          } catch (error) {
            reject(error)
          }
        },
        error: (error) => {
          // Shift-JISで再試行
          Papa.parse(file, {
            encoding: 'Shift-JIS',
            skipEmptyLines: true,
            complete: (results) => {
              const rawText = this.arrayToText(results.data as string[][])
              
              resolve({
                format: 'csv',
                rawText,
                structured: {
                  headers: results.data.length > 0 ? results.data[0] as string[] : undefined,
                  rows: results.data as string[][]
                },
                encoding: 'Shift-JIS',
                metadata
              })
            },
            error: (retryError) => {
              reject(new Error(`CSV解析エラー: ${retryError.message}`))
            }
          })
        }
      })
    })
  }

  // TSV解析
  private static async parseTsv(file: File, metadata: ParsedFileData['metadata']): Promise<ParsedFileData> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        delimiter: '\t',
        encoding: 'UTF-8',
        skipEmptyLines: true,
        complete: (results) => {
          const rawText = this.arrayToText(results.data as string[][])
          
          resolve({
            format: 'tsv',
            rawText,
            structured: {
              headers: results.data.length > 0 ? results.data[0] as string[] : undefined,
              rows: results.data as string[][]
            },
            encoding: 'UTF-8',
            metadata
          })
        },
        error: (error) => {
          reject(new Error(`TSV解析エラー: ${error.message}`))
        }
      })
    })
  }

  // Excel解析
  private static async parseExcel(file: File, metadata: ParsedFileData['metadata']): Promise<ParsedFileData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result as ArrayBuffer
          const workbook = XLSX.read(data, { type: 'array' })
          
          // 最初のシートを取得
          const firstSheetName = workbook.SheetNames[0]
          if (!firstSheetName) {
            reject(new Error('Excelファイルにシートが見つかりません'))
            return
          }
          
          const worksheet = workbook.Sheets[firstSheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            raw: false,
            dateNF: 'yyyy-mm-dd'
          }) as string[][]
          
          const rawText = this.arrayToText(jsonData)
          
          resolve({
            format: 'excel',
            rawText,
            structured: {
              headers: jsonData.length > 0 ? jsonData[0] : undefined,
              rows: jsonData
            },
            metadata
          })
        } catch (error) {
          reject(new Error(`Excel解析エラー: ${error instanceof Error ? error.message : 'Unknown error'}`))
        }
      }
      
      reader.onerror = () => {
        reject(new Error('ファイル読み込みエラー'))
      }
      
      reader.readAsArrayBuffer(file)
    })
  }

  // テキスト解析
  private static async parseText(file: File, metadata: ParsedFileData['metadata']): Promise<ParsedFileData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          let rawText = e.target?.result as string
          
          if (!rawText) {
            reject(new Error('ファイルの内容が空です'))
            return
          }

          // 構造化データの試行（カンマ区切りかタブ区切りか判定）
          let structured: ParsedFileData['structured'] | undefined
          
          const lines = rawText.split('\n').filter(line => line.trim())
          if (lines.length > 0) {
            // カンマ区切りの可能性をチェック
            const firstLine = lines[0]
            const commaCount = (firstLine.match(/,/g) || []).length
            const tabCount = (firstLine.match(/\t/g) || []).length
            
            if (commaCount > 0 || tabCount > 0) {
              const delimiter = tabCount > commaCount ? '\t' : ','
              const rows = lines.map(line => line.split(delimiter))
              
              structured = {
                headers: rows[0],
                rows
              }
            }
          }
          
          resolve({
            format: 'text',
            rawText,
            structured,
            encoding: 'UTF-8',
            metadata
          })
        } catch (error) {
          reject(new Error(`テキスト解析エラー: ${error instanceof Error ? error.message : 'Unknown error'}`))
        }
      }
      
      reader.onerror = () => {
        reject(new Error('ファイル読み込みエラー'))
      }
      
      // UTF-8で読み込み
      reader.readAsText(file, 'UTF-8')
    })
  }

  // 配列をテキスト形式に変換
  private static arrayToText(data: string[][]): string {
    return data
      .filter(row => row.some(cell => cell?.toString().trim()))
      .map(row => row.join('\t'))
      .join('\n')
  }

  // ファイルサイズの制限チェック
  static validateFileSize(file: File, maxSizeInMB: number = 10): boolean {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024
    return file.size <= maxSizeInBytes
  }

  // 対応ファイル形式のチェック
  static isSupportedFormat(file: File): boolean {
    const format = this.detectFormat(file)
    return format !== 'unknown'
  }

  // ファイル情報の取得
  static getFileInfo(file: File): {
    name: string
    size: string
    type: string
    lastModified: string
  } {
    const formatSize = (bytes: number): string => {
      if (bytes < 1024) return `${bytes} B`
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    const formatDate = (timestamp: number): string => {
      return new Date(timestamp).toLocaleString('ja-JP')
    }

    return {
      name: file.name,
      size: formatSize(file.size),
      type: file.type || 'unknown',
      lastModified: formatDate(file.lastModified)
    }
  }
}

// ユーティリティ関数
export const fileParserUtils = {
  // サンプルデータの生成（テスト用）
  generateSampleCsv(): string {
    return `日付,摘要,出金,入金,残高
2024/01/05,管理費　ヤマダタロウ,,25000,125000
2024/01/05,管理費　サトウハナコ,,25000,150000
2024/01/10,清掃業務　○○清掃,50000,,100000
2024/01/15,水道料金,15000,,85000
2024/01/20,電気料金,12000,,73000`
  },

  // データの妥当性チェック
  validateParsedData(data: ParsedFileData): {
    isValid: boolean
    warnings: string[]
    errors: string[]
  } {
    const warnings: string[] = []
    const errors: string[] = []

    // 基本チェック
    if (!data.rawText.trim()) {
      errors.push('ファイルの内容が空です')
    }

    if (data.structured && data.structured.rows.length === 0) {
      errors.push('データ行が見つかりません')
    }

    // 構造化データのチェック
    if (data.structured) {
      const { rows } = data.structured
      
      // 行の長さの一貫性チェック
      if (rows.length > 1) {
        const firstRowLength = rows[0]?.length || 0
        const inconsistentRows = rows.filter(row => row.length !== firstRowLength)
        
        if (inconsistentRows.length > 0) {
          warnings.push(`${inconsistentRows.length}行で列数が異なります`)
        }
      }

      // 日付列の検出試行
      const potentialDateColumns = this.detectDateColumns(rows)
      if (potentialDateColumns.length === 0) {
        warnings.push('日付列が検出されませんでした')
      }

      // 数値列の検出試行
      const potentialAmountColumns = this.detectAmountColumns(rows)
      if (potentialAmountColumns.length === 0) {
        warnings.push('金額列が検出されませんでした')
      }
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors
    }
  },

  // 日付列の検出
  detectDateColumns(rows: string[][]): number[] {
    if (rows.length < 2) return []
    
    const dateColumns: number[] = []
    const colCount = Math.max(...rows.map(row => row.length))
    
    for (let col = 0; col < colCount; col++) {
      const values = rows.slice(1, 6).map(row => row[col]) // 最初の5行をサンプル
      const dateCount = values.filter(value => {
        if (!value) return false
        
        // 日付パターンのチェック
        const datePatterns = [
          /^\d{4}[/-]\d{1,2}[/-]\d{1,2}$/,
          /^\d{4}年\d{1,2}月\d{1,2}日$/,
          /^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/
        ]
        
        return datePatterns.some(pattern => pattern.test(value.trim()))
      }).length
      
      if (dateCount >= values.length * 0.6) { // 60%以上が日付形式
        dateColumns.push(col)
      }
    }
    
    return dateColumns
  },

  // 金額列の検出
  detectAmountColumns(rows: string[][]): number[] {
    if (rows.length < 2) return []
    
    const amountColumns: number[] = []
    const colCount = Math.max(...rows.map(row => row.length))
    
    for (let col = 0; col < colCount; col++) {
      const values = rows.slice(1, 6).map(row => row[col]) // 最初の5行をサンプル
      const numberCount = values.filter(value => {
        if (!value) return false
        
        // カンマ区切りの数字や円マークを含む数字をチェック
        const cleanValue = value.replace(/[,円￥]/g, '').trim()
        return !isNaN(Number(cleanValue)) && cleanValue !== ''
      }).length
      
      if (numberCount >= values.length * 0.6) { // 60%以上が数値形式
        amountColumns.push(col)
      }
    }
    
    return amountColumns
  }
}