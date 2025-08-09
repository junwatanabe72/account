import React, { createContext, useContext, useMemo, useState } from 'react'

type ToastKind = 'success' | 'info' | 'warning' | 'danger'

type ToastItem = { id: number; kind: ToastKind; message: string }

type ToastContextType = {
  show: (message: string, kind?: ToastKind) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ToastItem[]>([])
  const show = (message: string, kind: ToastKind = 'info') => {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setItems(prev => [...prev, { id, kind, message }])
    setTimeout(() => setItems(prev => prev.filter(i => i.id !== id)), 4000)
  }
  const value = useMemo(() => ({ show }), [])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div style={{ position: 'fixed', right: 12, top: 12, zIndex: 2000, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map(i => (
          <div key={i.id} className={`alert alert-${i.kind} shadow`} style={{ margin: 0, padding: '8px 12px' }}>{i.message}</div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
