import React from 'react'
import { App } from './ui/AppWithSidebar'
import { createRoot } from 'react-dom/client'
import { ToastProvider } from './ui/Toast'
import './ui/styles/theme.css'
import './ui/styles/responsive.css'
import './ui/styles/tabs.css'
import './ui/styles/forms.css'
import './ui/styles/data-display.css'

const container = document.getElementById('root')!
createRoot(container).render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>
)