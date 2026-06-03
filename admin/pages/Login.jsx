import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MobileCheck from '../components/MobileCheck'
import { useAuth } from '../contexts/AuthContext'
import { useMobile } from '../contexts/MobileContext'
import '../styles/admin.css'

export default function Login() {
  const navigate = useNavigate()
  const { isMobile } = useMobile()
  const { loading: authLoading, login, user } = useAuth()
  const [credentials, setCredentials] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && user?.isAdmin) {
      navigate('/admin/mainpage', { replace: true })
    }
  }, [authLoading, navigate, user])

  const handleLogin = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await login(credentials.email, credentials.password)
    } catch (loginError) {
      setError(loginError.message || '로그인에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (isMobile) {
    return <MobileCheck />
  }

  if (authLoading) {
    return (
      <div className="admin-login">
        <div className="admin-form">
          <h2 className="admin-page-title">NOVA50 Admin</h2>
          <div>로딩 중...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-login">
      <form className="admin-form" onSubmit={handleLogin}>
        <h2 className="admin-page-title">NOVA50 Admin</h2>
        <div className="admin-login-guide">관리자 계정은 제작사에 문의 바랍니다.</div>
        {error && <div className="admin-error-message">{error}</div>}

        <div className="admin-form-group admin-login-field">
          <label htmlFor="email">이메일</label>
          <input
            id="email"
            className="admin-input"
            type="email"
            value={credentials.email}
            autoComplete="username"
            required
            onChange={(event) => setCredentials({ ...credentials, email: event.target.value })}
          />
        </div>

        <div className="admin-form-group admin-login-field">
          <label htmlFor="password">비밀번호</label>
          <input
            id="password"
            className="admin-input"
            type="password"
            value={credentials.password}
            autoComplete="current-password"
            required
            onChange={(event) => setCredentials({ ...credentials, password: event.target.value })}
          />
        </div>

        <button className="admin-button" type="submit" disabled={loading}>
          {loading ? '로그인 중...' : '관리자 로그인'}
        </button>
      </form>
    </div>
  )
}
