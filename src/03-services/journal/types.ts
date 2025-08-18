// Separate types file to avoid circular dependencies

// Re-export types from journal.ts
export type { 
  UnifiedJournal as Journal,
  JournalLine as JournalDetail,
  UnifiedJournal,
  JournalLine,
  JournalStatus,
  Division,
  JournalInput,
  JournalValidation,
  JournalFilter,
  JournalSort
} from '../../01-types/journal'