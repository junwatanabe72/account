import React from 'react'
import { App } from './ui/app/AppWithSidebar'
import { createRoot } from 'react-dom/client'
import { ToastProvider } from './ui/common/Toast'
import './ui/styles/theme.css'
import './ui/styles/responsive.css'
import './ui/styles/tabs.css'
import './ui/styles/forms.css'
import './ui/styles/data-display.css'
import './ui/styles/theme-unified.css'  // 最後に読み込んで優先度を上げる

const container = document.getElementById('root')!
createRoot(container).render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>
)