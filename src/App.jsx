import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import MainPage from './pages/MainPage'
import AboutPage from './pages/AboutPage'
import WorksPage from './pages/WorksPage'
import CareerPage from './pages/CareerPage'
import ContactPage from './pages/ContactPage'
import AdminApp from '../admin/Admin'
import { getSeoForPath } from './config/seo'
import { applySeo } from './utils/applySeo'

function App() {
  const location = useLocation()

  useEffect(() => {
    applySeo(getSeoForPath(location.pathname))
  }, [location.pathname])

  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/works" element={<WorksPage />} />
      <Route path="/career" element={<CareerPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/admin/*" element={<AdminApp />} />
      <Route path="*" element={<MainPage />} />
    </Routes>
  )
}

export default App
