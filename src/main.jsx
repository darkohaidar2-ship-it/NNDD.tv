import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { DeviceProvider } from './context/DeviceContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <DeviceProvider>
        <App />
      </DeviceProvider>
    </ErrorBoundary>
  </StrictMode>,
)
