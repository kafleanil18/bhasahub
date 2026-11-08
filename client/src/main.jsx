import { StrictMode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import './styles/design-system.css'
import { clearLegacyPassword } from './auth/rememberedEmail'

// Migrate every returning visitor, including users who are already signed in.
try { clearLegacyPassword(window.localStorage); } catch { /* Storage may be disabled. */ }

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

