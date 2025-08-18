// Test importing from JournalService-minimal

import { JournalService, Journal, JournalDetail } from './03-services/journal/JournalService-minimal'

console.log('✅ Successfully imported JournalService, Journal, and JournalDetail')

// Test creating an instance
const service = new JournalService()

// Test creating a journal
const testJournal: Journal = {
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

service.addJournal(testJournal)
console.log('✅ Added journal to service')
console.log('Journals in service:', service.getJournals())

export { service }