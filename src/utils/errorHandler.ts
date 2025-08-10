import { ERROR_CODES, ERROR_MESSAGES } from '../constants'

// エラーレスポンスの型定義
export interface ErrorResponse {
  success: false
  errors: string[]
  code?: string
}

// 成功レスポンスの型定義
export interface SuccessResponse<T = unknown> {
  success: true
  data?: T
}

// 統合レスポンス型
export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse

// エラーハンドリングクラス
export class ErrorHandler {
  static createError(message: string, code?: string): ErrorResponse {
    return {
      success: false,
      errors: [message],
      code
    }
  }
  
  static createSuccess<T>(data?: T): SuccessResponse<T> {
    return {
      success: true,
      data
    }
  }
  
  static isError(response: ApiResponse): response is ErrorResponse {
    return !response.success
  }
  
  static getErrorMessage(response: ApiResponse | any): string {
    if (!response) return '不明なエラーが発生しました'
    
    if (ErrorHandler.isError(response)) {
      return response.errors.join(', ')
    }
    
    if (response.error) {
      return response.error
    }
    
    if (response.message) {
      return response.message
    }
    
    return '不明なエラーが発生しました'
  }
  
  // 共通エラーハンドラー
  static handleError(error: unknown): ErrorResponse {
    if (error instanceof Error) {
      return ErrorHandler.createError(error.message)
    }
    
    if (typeof error === 'string') {
      return ErrorHandler.createError(error)
    }
    
    return ErrorHandler.createError(ERROR_MESSAGES.VALIDATION_ERROR)
  }
}

// UIエラー表示用のユーティリティ
export const showError = (error: unknown, toast?: any) => {
  const message = error instanceof Error ? error.message :
                  typeof error === 'string' ? error :
                  ERROR_MESSAGES.VALIDATION_ERROR
  
  if (toast) {
    toast.show(message, 'danger')
  } else {
    alert(message)
  }
}

// 成功メッセージ表示用のユーティリティ
export const showSuccess = (message: string, toast?: any) => {
  if (toast) {
    toast.show(message, 'success')
  } else {
    alert(message)
  }
}