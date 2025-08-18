// Test file to verify imports work correctly

// Test 1: Direct import from journal.ts
import { UnifiedJournal } from './01-types/journal'

console.log('Import test 1: UnifiedJournal imported successfully')

// Create a test instance to verify the type works
const testJournal: UnifiedJournal = {
  id: '1',
  journalNumber: 'TEST-001',
  date: '2024-01-01',
  description: 'Test Journal',
  division: 'KANRI',
  status: 'DRAFT',
  lines: [],
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
  totalDebit: 0,
  totalCredit: 0,
  isBalanced: true
}

console.log('Test journal created:', testJournal)

export { testJournal }