// Legacy wrapper: use new unified types
// Re-export relevant types from the appropriate modules
export type { JournalStatus } from './journal'
// Remove circular dependency - these should be imported directly from journal.ts

