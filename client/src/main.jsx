import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Development-only startup diagnostics
if (import.meta.env.DEV) {
  console.log('=== Frontend Startup ===');
  console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
  console.log('Frontend Port: 5173');
  console.log('API Debug Mode:', import.meta.env.VITE_API_DEBUG === 'true' ? 'ENABLED' : 'DISABLED');
  console.log('========================');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
