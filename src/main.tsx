import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import { Hub } from './components/Hub'
import { GamePage } from './components/GamePage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Hub />} />
        <Route path="/:game" element={<GamePage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
