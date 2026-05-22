import MainPage from './pages/MainPage'
import AboutPage from './pages/AboutPage'
import WorksPage from './pages/WorksPage'
import CareerPage from './pages/CareerPage'
import ContactPage from './pages/ContactPage'

function App() {
  if (window.location.pathname === '/about') {
    return <AboutPage />
  }

  if (window.location.pathname === '/works') {
    return <WorksPage />
  }

  if (window.location.pathname === '/career') {
    return <CareerPage />
  }

  if (window.location.pathname === '/contact') {
    return <ContactPage />
  }

  return <MainPage />
}

export default App
