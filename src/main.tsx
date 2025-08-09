import React from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './ui/App'
import { ToastProvider } from './ui/Toast'

const container = document.getElementById('root')!
createRoot(container).render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>
)
