import { Link, useLocation } from 'react-router-dom'
import './Header.css'

export const Header = () => {
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/menu', label: 'Menu', icon: '📝' },
    { path: '/orders', label: 'Orders', icon: '🛒' },
  ]

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <h1>🍽️ RestaurantPOS</h1>
        </div>
        <nav className="nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
