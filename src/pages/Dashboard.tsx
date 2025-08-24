import { useState, useEffect } from 'react'
import './Dashboard.css'

interface DashboardStats {
  todayOrders: number
  todayRevenue: number
  activeOrders: number
  menuItems: number
}

export const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    todayOrders: 0,
    todayRevenue: 0,
    activeOrders: 0,
    menuItems: 0,
  })

  useEffect(() => {
    // Simulate loading dashboard data
    setStats({
      todayOrders: 47,
      todayRevenue: 1247.50,
      activeOrders: 8,
      menuItems: 125,
    })
  }, [])

  const statCards = [
    {
      title: "Today's Orders",
      value: stats.todayOrders,
      icon: '📋',
      color: '#3498db',
    },
    {
      title: "Today's Revenue",
      value: `$${stats.todayRevenue.toFixed(2)}`,
      icon: '💰',
      color: '#2ecc71',
    },
    {
      title: 'Active Orders',
      value: stats.activeOrders,
      icon: '🔥',
      color: '#e74c3c',
    },
    {
      title: 'Menu Items',
      value: stats.menuItems,
      icon: '🍽️',
      color: '#f39c12',
    },
  ]

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Restaurant Dashboard</h2>
        <p>Welcome back! Here's what's happening at your restaurant today.</p>
      </div>
      
      <div className="stats-grid">
        {statCards.map((stat) => (
          <div key={stat.title} className="stat-card" style={{ borderColor: stat.color }}>
            <div className="stat-icon" style={{ backgroundColor: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-content">
              <h3>{stat.title}</h3>
              <p className="stat-value">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <button className="action-btn">
            <span>➕</span>{' '}
            New Order
          </button>
          <button className="action-btn">
            <span>📝</span>{' '}
            Add Menu Item
          </button>
          <button className="action-btn">
            <span>📊</span>{' '}
            View Reports
          </button>
          <button className="action-btn">
            <span>⚙️</span>{' '}
            Settings
          </button>
        </div>
      </div>
    </div>
  )
}
