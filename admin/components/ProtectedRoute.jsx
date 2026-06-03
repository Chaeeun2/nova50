import { Navigate, useLocation } from 'react-router-dom'
import MobileCheck from './MobileCheck'
import { useAuth } from '../contexts/AuthContext'
import { useMobile } from '../contexts/MobileContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const { isMobile } = useMobile()
  const location = useLocation()

  if (isMobile) {
    return <MobileCheck />
  }

  if (loading) {
    return <div className="admin-route-loading">Firebase 인증 확인 중...</div>
  }

  if (!user?.isAdmin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  return children
}
