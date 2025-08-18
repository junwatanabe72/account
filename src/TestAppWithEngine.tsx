import React, { useState } from 'react'
import { AccountingEngineSimple } from './02-core/AccountingEngineSimple'

// Test app with simplified AccountingEngine
export const TestAppWithEngine: React.FC = () => {
  const [engine] = useState(() => new AccountingEngineSimple())
  const [journals, setJournals] = useState<any[]>([])
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')

  const handleAddJournal = () => {
    if (description && amount) {
      engine.addJournal(
        new Date().toISOString().split('T')[0],
        description,
        parseFloat(amount)
      )
      setJournals([...engine.getJournals()])
      setDescription('')
      setAmount('')
    }
  }

  const handleClear = () => {
    engine.clearJournals()
    setJournals([])
  }

  const summary = engine.getSummary()

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Test App with Simple AccountingEngine</h1>
      
      <div style={{ 
        padding: '10px', 
        backgroundColor: '#e8f5e9', 
        borderRadius: '5px',
        marginBottom: '20px'
      }}>
        <h3>Engine Status</h3>
        <p>✅ Engine Name: {summary.engineName}</p>
        <p>✅ Version: {summary.version}</p>
        <p>✅ Journal Count: {summary.journalCount}</p>
        <p>✅ Total Amount: ¥{summary.totalAmount.toLocaleString()}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Add Journal Entry</h3>
        <div>
          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ marginRight: '10px', padding: '5px' }}
          />
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{ marginRight: '10px', padding: '5px' }}
          />
          <button onClick={handleAddJournal}>Add Journal</button>
          <button onClick={handleClear} style={{ marginLeft: '10px' }}>Clear All</button>
        </div>
      </div>

      <div>
        <h3>Journal List</h3>
        {journals.length === 0 ? (
          <p>No journals yet</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f0f0f0' }}>
                <th style={{ padding: '8px', textAlign: 'left' }}>Date</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Description</th>
                <th style={{ padding: '8px', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {journals.map((journal) => (
                <tr key={journal.id} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '8px' }}>{journal.date}</td>
                  <td style={{ padding: '8px' }}>{journal.description}</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>
                    ¥{journal.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default TestAppWithEngine