import { StateCreator } from 'zustand'
import { UIState, StoreState } from '../types'

export interface UISlice extends UIState {
  showToast: (type: UIState['toastMessage']['type'], message: string) => void
  hideToast: () => void
  clearError: () => void
  setLoading: (isLoading: boolean) => void
}

export const createUISlice: StateCreator<
  StoreState,
  [],
  [],
  UISlice
> = (set) => ({
  // 初期状態
  isLoading: false,
  error: null,
  toastMessage: null,
  
  // アクション
  showToast: (type, message) => {
    set({ 
      toastMessage: { type, message } 
    })
    
    // 5秒後に自動的に非表示
    setTimeout(() => {
      set(state => {
        // 同じメッセージの場合のみクリア（新しいメッセージで上書きされていない場合）
        if (state.toastMessage?.message === message) {
          return { toastMessage: null }
        }
        return state
      })
    }, 5000)
  },
  
  hideToast: () => {
    set({ toastMessage: null })
  },
  
  clearError: () => {
    set({ error: null })
  },
  
  setLoading: (isLoading) => {
    set({ isLoading })
  }
})