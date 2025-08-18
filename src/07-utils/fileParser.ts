// ファイル解析ユーティリティ（修正版）
import * as XLSX from 'xlsx'
import Papa from 'papaparse'

export type FileFormat = 'csv' | 'tsv' | 'excel' | 'text' | 'unknown'

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

export class FileParseError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'FileParseError'
  }
}

export class FileParser {
  static detectFormat(file: File): FileFormat {
    const ext = (file.name.split('.').pop() || '').toLowerCase()
    if (ext === 'csv') return 'csv'
    if (ext === 'tsv' || ext === 'tab') return 'tsv'
    if (ext === 'xlsx' || ext === 'xls') return 'excel'
    if (ext === 'txt') return 'text'
    return 'unknown'
  }

  static validateFileSize(file: File, maxSizeInMB: number): boolean {
    return file.size <= maxSizeInMB * 1024 * 1024
  }

  static getFileInfo(file: File) {
    const mb = file.size / (1024 * 1024)
    const size = mb >= 1 ? `${mb.toFixed(2)} MB` : `${(file.size / 1024).toFixed(0)} KB`
    return { size }
  }

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
        case 'unknown':
          return await this.parseText(file, metadata)
      }
    } catch (e) {
      throw new FileParseError(
        `ファイル解析に失敗しました: ${e instanceof Error ? e.message : 'Unknown error'}`,
        'PARSE_ERROR'
      )
    }
  }

  private static async parseCsv(file: File, metadata: ParsedFileData['metadata']): Promise<ParsedFileData> {
    return new Promise((resolve, reject) => {
      Papa.parse<string[]>(file as any, {
        encoding: 'UTF-8',
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const rows = results.data as unknown as string[][]
            const rawText = this.arrayToText(rows)
            resolve({
              format: 'csv',
              rawText,
              structured: {
                headers: rows.length > 0 ? rows[0] : undefined,
                rows
              },
              encoding: 'UTF-8',
              metadata
            })
          } catch (err) {
            reject(err)
          }
        },
        error: () => {
          // Fallback: try Shift-JIS
          Papa.parse<string[]>(file as any, {
            encoding: 'Shift-JIS',
            skipEmptyLines: true,
            complete: (retry) => {
              const rows = retry.data as unknown as string[][]
              const rawText = this.arrayToText(rows)
              resolve({
                format: 'csv',
                rawText,
                structured: {
                  headers: rows.length > 0 ? rows[0] : undefined,
                  rows
                },
                encoding: 'Shift-JIS',
                metadata
              })
            },
            error: (err) => reject(new Error(`CSV解析エラー: ${err.message}`))
          })
        }
      })
    })
  }

  private static async parseTsv(file: File, metadata: ParsedFileData['metadata']): Promise<ParsedFileData> {
    return new Promise((resolve, reject) => {
      Papa.parse<string[]>(file as any, {
        delimiter: '\t',
        encoding: 'UTF-8',
        skipEmptyLines: true,
        complete: (results) => {
          const rows = results.data as unknown as string[][]
          const rawText = this.arrayToText(rows)
          resolve({
            format: 'tsv',
            rawText,
            structured: {
              headers: rows.length > 0 ? rows[0] : undefined,
              rows
            },
            encoding: 'UTF-8',
            metadata
          })
        },
        error: (err) => reject(new Error(`TSV解析エラー: ${err.message}`))
      })
    })
  }

  private static async parseExcel(file: File, metadata: ParsedFileData['metadata']): Promise<ParsedFileData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = e.target?.result as ArrayBuffer
          const workbook = XLSX.read(data, { type: 'array' })
          const firstSheetName = workbook.SheetNames[0]
          if (!firstSheetName) throw new Error('Excelファイルにシートが見つかりません')
          const worksheet = workbook.Sheets[firstSheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false }) as string[][]
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
        } catch (err) {
          reject(new Error(`Excel解析エラー: ${err instanceof Error ? err.message : 'Unknown error'}`))
        }
      }
      reader.onerror = () => reject(new Error('ファイル読み込みエラー'))
      reader.readAsArrayBuffer(file)
    })
  }

  private static async parseText(file: File, metadata: ParsedFileData['metadata']): Promise<ParsedFileData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const rawText = (e.target?.result as string) || ''
          if (!rawText) throw new Error('ファイルの内容が空です')
          let structured: ParsedFileData['structured'] | undefined
          const lines = rawText.split(/\r?\n/).filter(l => l.trim().length > 0)
          if (lines.length > 0) {
            const first = lines[0]
            const comma = (first.match(/,/g) || []).length
            const tab = (first.match(/\t/g) || []).length
            if (comma > 0 || tab > 0) {
              const delim = tab > comma ? '\t' : ','
              const rows = lines.map(line => line.split(delim))
              structured = { headers: rows[0], rows }
            }
          }
          resolve({ format: 'text', rawText, structured, encoding: 'UTF-8', metadata })
        } catch (err) {
          reject(err)
        }
      }
      reader.onerror = () => reject(new Error('ファイル読み込みエラー'))
      reader.readAsText(file)
    })
  }

  private static arrayToText(rows: string[][]): string {
    return rows.map(r => r.map(v => (v ?? '').toString()).join(',')).join('\n')
  }
}

export const fileParserUtils = {
  validateParsedData(parsed: ParsedFileData): { isValid: boolean; warnings: string[]; errors: string[] } {
    const warnings: string[] = []
    const errors: string[] = []
    if (!parsed.rawText || parsed.rawText.trim().length === 0) {
      errors.push('内容が空です')
    }
    if (parsed.structured) {
      const rows = parsed.structured.rows || []
      if (rows.length === 0) errors.push('データ行がありません')
      if (rows.length > 10000) warnings.push('行数が多いため処理に時間がかかる可能性があります')
    }
    return { isValid: errors.length === 0, warnings, errors }
  }
}

