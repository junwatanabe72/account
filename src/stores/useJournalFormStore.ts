import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { createJournalFormSlice, JournalFormSlice } from './slices/journal/journalFormSlice'

// 統合Store
export const useJournalFormStore = create<JournalFormSlice>()(
  devtools(
    (...args) => ({
      ...createJournalFormSlice(...args),
    }),
    {
      name: 'journal-form-store',
    }
  )
)