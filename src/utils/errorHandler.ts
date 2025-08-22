import { ERROR_CODES, ERROR_MESSAGES } from '../constants'
import { isObject } from '../types/core'

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
  
  static getErrorMessage(response: ApiResponse | unknown): string {
    if (!response) return '不明なエラーが発生しました'
    
    if (ErrorHandler.isError(response)) {
      return response.errors.join(', ')
    }
    
    if (isObject(response)) {
      if ('error' in response && typeof response.error === 'string') {
        return response.error
      }
      
      if ('message' in response && typeof response.message === 'string') {
        return response.message
      }
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

// Toastインターフェース
interface ToastInterface {
  show(message: string, type: 'success' | 'danger' | 'warning' | 'info'): void
}

// UIエラー表示用のユーティリティ
export const showError = (error: unknown, toast?: ToastInterface) => {
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
export const showSuccess = (message: string, toast?: ToastInterface) => {
  if (toast) {
    toast.show(message, 'success')
  } else {
    alert(message)
  }
}