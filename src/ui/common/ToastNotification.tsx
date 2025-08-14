import React, { useEffect } from 'react'

interface ToastNotificationProps {
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  onClose: () => void
  duration?: number
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ 
  type, 
  message, 
  onClose, 
  duration = 5000 
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)
    
    return () => clearTimeout(timer)
  }, [duration, onClose])
  
  const getClassName = () => {
    switch (type) {
      case 'success':
        return 'alert alert-success'
      case 'error':
        return 'alert alert-danger'
      case 'warning':
        return 'alert alert-warning'
      case 'info':
      default:
        return 'alert alert-info'
    }
  }
  
  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅'
      case 'error':
        return '❌'
      case 'warning':
        return '⚠️'
      case 'info':
      default:
        return 'ℹ️'
    }
  }
  
  return (
    <div 
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        maxWidth: '500px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div className={`${getClassName()} d-flex align-items-start`}>
        <span style={{ marginRight: '10px', fontSize: '1.2em' }}>{getIcon()}</span>
        <div style={{ flex: 1 }}>
          {message.split('\n').map((line, index) => (
            <div key={index}>{line}</div>
          ))}
        </div>
        <button 
          type="button" 
          className="btn-close" 
          aria-label="Close"
          onClick={onClose}
          style={{
            marginLeft: '10px',
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            fontSize: '1.2em'
          }}
        >
          ×
        </button>
      </div>
    </div>
  )
}