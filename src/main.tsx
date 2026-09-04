import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MainDisplay } from '@/pages/MainDisplay'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MainDisplay />
  </StrictMode>,
)
