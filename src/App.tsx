import { Route, Routes } from 'react-router-dom'
import { MainDisplay } from '@/pages/MainDisplay'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainDisplay />} />
    </Routes>
  )
}
