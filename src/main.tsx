import React from 'react'
import ReactDOM from 'react-dom/client'
import TestAppWithEngine from './TestAppWithEngine'

// Test with simplified AccountingEngine
console.log('Loading Test App with Simple AccountingEngine...')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TestAppWithEngine />
  </React.StrictMode>,
)