import React, { useState } from 'react'

// Simple test app without AccountingEngine
export const SimpleApp: React.FC = () => {
  const [count, setCount] = useState(0)
  const [message, setMessage] = useState('Hello, World!')

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Simple Test App (No AccountingEngine)</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Counter Test</h2>
        <p>Count: {count}</p>
        <button onClick={() => setCount(count + 1)}>Increment</button>
        <button onClick={() => setCount(count - 1)} style={{ marginLeft: '10px' }}>Decrement</button>
        <button onClick={() => setCount(0)} style={{ marginLeft: '10px' }}>Reset</button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Message Test</h2>
        <p>{message}</p>
        <input 
          type="text" 
          value={message} 
          onChange={(e) => setMessage(e.target.value)}
          style={{ width: '300px', padding: '5px' }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Component Status</h2>
        <p>✅ React is working</p>
        <p>✅ State management is working</p>
        <p>✅ Event handlers are working</p>
      </div>

      <div style={{ 
        padding: '10px', 
        backgroundColor: '#f0f0f0', 
        borderRadius: '5px',
        marginTop: '20px'
      }}>
        <p><strong>Test Summary:</strong></p>
        <p>This app is running without AccountingEngine to verify basic React functionality.</p>
        <p>Time: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  )
}

export default SimpleApp