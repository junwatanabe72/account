// Legacy wrapper: use new unified types
// Re-export relevant types from the appropriate modules
export type { TransactionData, TransactionItem } from './core'
// Remove circular dependency - UnifiedJournal should be imported directly from journal.ts

