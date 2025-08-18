import React from 'react'
import { App } from './05-ui/pages/app/AppWithSidebar'
import { createRoot } from 'react-dom/client'
import { ToastProvider } from './05-ui/components/common/Toast'
import './05-ui/components/styles/theme.css'
import './05-ui/components/styles/responsive.css'
import './05-ui/components/styles/tabs.css'
import './05-ui/components/styles/forms.css'
import './05-ui/components/styles/data-display.css'

const container = document.getElementById('root')!
createRoot(container).render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>
)