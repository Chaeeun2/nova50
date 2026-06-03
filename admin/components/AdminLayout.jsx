import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './AdminLayout.css'

const navItems = [
  { label: 'Main', path: '/admin/mainpage' },
  { label: 'About', path: '/admin/about' },
  { label: 'Works', path: '/admin/works' },
  { label: 'Career', path: '/admin/career' },
  { label: 'Contact', path: '/admin/contact' },
]

export default function AdminLayout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2>NOVA50 Admin</h2>
        <nav>
          <ul>
            {navItems.map((item) => (
              <li className={location.pathname === item.path ? 'active' : ''} key={item.path}>
                <Link to={item.path}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <button className="admin-sidebar-logout" type="button" onClick={handleLogout}>
          로그아웃
        </button>
      </aside>
      <div className="admin-content-wrapper">{children}</div>
    </div>
  )
}
