import React from 'react'
import ReactDOM from 'react-dom/client'
import SimpleApp from './SimpleApp'

// Simple main file without any complex imports
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SimpleApp />
  </React.StrictMode>,
)