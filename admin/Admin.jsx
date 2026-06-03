import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './contexts/AuthContext'
import { MobileProvider } from './contexts/MobileContext'
import Login from './pages/Login'
import MainPageManager from './pages/MainPageManager'
import AboutManager from './pages/AboutManager'
import WorksManager from './pages/WorksManager'
import CareerManager from './pages/CareerManager'
import ContactManager from './pages/ContactManager'
import './styles/admin.css'

export default function AdminApp() {
  return (
    <MobileProvider>
      <AuthProvider>
        <Routes>
          <Route path="login" element={<Login />} />
          <Route index element={<Navigate to="/admin/mainpage" replace />} />
          <Route
            path="mainpage"
            element={
              <ProtectedRoute>
                <MainPageManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="about"
            element={
              <ProtectedRoute>
                <AboutManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="works"
            element={
              <ProtectedRoute>
                <WorksManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="career"
            element={
              <ProtectedRoute>
                <CareerManager />
              </ProtectedRoute>
            }
          />
          <Route
            path="contact"
            element={
              <ProtectedRoute>
                <ContactManager />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/admin/mainpage" replace />} />
        </Routes>
      </AuthProvider>
    </MobileProvider>
  )
}
