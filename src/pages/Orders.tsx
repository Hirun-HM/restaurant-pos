import { useState } from 'react'
import './Orders.css'

interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
}

interface Order {
  id: string
  tableNumber: number
  items: OrderItem[]
  status: 'pending' | 'preparing' | 'ready' | 'served'
  timestamp: Date
  total: number
}

const sampleOrders: Order[] = [
  {
    id: '001',
    tableNumber: 5,
    items: [
      { id: '1', name: 'Grilled Salmon', quantity: 2, price: 24.99 },
      { id: '2', name: 'Caesar Salad', quantity: 1, price: 12.99 },
    ],
    status: 'preparing',
    timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    total: 62.97,
  },
  {
    id: '002',
    tableNumber: 3,
    items: [
      { id: '4', name: 'Beef Tenderloin', quantity: 1, price: 32.99 },
    ],
    status: 'pending',
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    total: 32.99,
  },
  {
    id: '003',
    tableNumber: 8,
    items: [
      { id: '2', name: 'Caesar Salad', quantity: 2, price: 12.99 },
      { id: '3', name: 'Chocolate Cake', quantity: 2, price: 8.99 },
    ],
    status: 'ready',
    timestamp: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
    total: 43.96,
  },
]

export const Orders = () => {
  const [orders, setOrders] = useState<Order[]>(sampleOrders)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const statusOptions = [
    { value: 'all', label: 'All Orders', color: '#6c757d' },
    { value: 'pending', label: 'Pending', color: '#ffc107' },
    { value: 'preparing', label: 'Preparing', color: '#17a2b8' },
    { value: 'ready', label: 'Ready', color: '#28a745' },
    { value: 'served', label: 'Served', color: '#6c757d' },
  ]

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === statusFilter)

  const updateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    )
  }

  const getStatusColor = (status: Order['status']) => {
    const statusOption = statusOptions.find(option => option.value === status)
    return statusOption?.color || '#6c757d'
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    const hours = Math.floor(diffInMinutes / 60)
    return `${hours}h ${diffInMinutes % 60}m ago`
  }

  return (
    <div className="orders">
      <div className="orders-header">
        <h2>Order Management</h2>
        <div className="orders-summary">
          <span>Active Orders: {orders.filter(o => o.status !== 'served').length}</span>
        </div>
      </div>

      <div className="status-filter">
        {statusOptions.map(option => (
          <button
            key={option.value}
            className={`status-btn ${statusFilter === option.value ? 'active' : ''}`}
            style={{ 
              backgroundColor: statusFilter === option.value ? option.color : 'transparent',
              borderColor: option.color,
              color: statusFilter === option.value ? 'white' : option.color
            }}
            onClick={() => setStatusFilter(option.value)}
          >
            {option.label}
            {option.value !== 'all' && (
              <span className="status-count">
                ({orders.filter(o => o.status === option.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="orders-grid">
        {filteredOrders.map(order => (
          <div key={order.id} className="order-card">
            <div className="order-header">
              <div className="order-info">
                <h3>Order #{order.id}</h3>
                <span className="table-number">Table {order.tableNumber}</span>
              </div>
              <div className="order-time">{formatTime(order.timestamp)}</div>
            </div>

            <div className="order-items">
              {order.items.map(item => (
                <div key={`${order.id}-${item.id}`} className="order-item">
                  <span className="item-quantity">{item.quantity}x</span>
                  <span className="item-name">{item.name}</span>
                  <span className="item-price">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="order-footer">
              <div className="order-total">
                Total: <strong>${order.total.toFixed(2)}</strong>
              </div>
              <div className="order-actions">
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(order.status) }}
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
                {order.status === 'pending' && (
                  <button 
                    className="action-btn preparing"
                    onClick={() => updateOrderStatus(order.id, 'preparing')}
                  >
                    Start Preparing
                  </button>
                )}
                {order.status === 'preparing' && (
                  <button 
                    className="action-btn ready"
                    onClick={() => updateOrderStatus(order.id, 'ready')}
                  >
                    Mark Ready
                  </button>
                )}
                {order.status === 'ready' && (
                  <button 
                    className="action-btn served"
                    onClick={() => updateOrderStatus(order.id, 'served')}
                  >
                    Mark Served
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="empty-state">
          <p>No orders found with the current filter.</p>
        </div>
      )}
    </div>
  )
}
