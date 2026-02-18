import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { seedIfEmpty } from './db/seeds'

// Seed la BD con los 4 escenarios vacíos en el primer arranque
seedIfEmpty().catch(console.error)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
