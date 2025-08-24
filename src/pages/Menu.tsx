import { useState } from 'react'
import './Menu.css'

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  available: boolean
  image?: string
}

const sampleMenuItems: MenuItem[] = [
  {
    id: '1',
    name: 'Grilled Salmon',
    description: 'Fresh Atlantic salmon with herbs and lemon',
    price: 24.99,
    category: 'Main Course',
    available: true,
  },
  {
    id: '2',
    name: 'Caesar Salad',
    description: 'Crisp romaine lettuce with parmesan and croutons',
    price: 12.99,
    category: 'Appetizer',
    available: true,
  },
  {
    id: '3',
    name: 'Chocolate Cake',
    description: 'Rich chocolate cake with berry compote',
    price: 8.99,
    category: 'Dessert',
    available: false,
  },
  {
    id: '4',
    name: 'Beef Tenderloin',
    description: 'Premium cut with roasted vegetables',
    price: 32.99,
    category: 'Main Course',
    available: true,
  },
]

export const Menu = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(sampleMenuItems)
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [showAddForm, setShowAddForm] = useState(false)

  const categories = ['All', ...Array.from(new Set(menuItems.map(item => item.category)))]

  const filteredItems = selectedCategory === 'All' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory)

  const toggleAvailability = (id: string) => {
    setMenuItems(items =>
      items.map(item =>
        item.id === id ? { ...item, available: !item.available } : item
      )
    )
  }

  return (
    <div className="menu">
      <div className="menu-header">
        <h2>Menu Management</h2>
        <button 
          className="add-item-btn"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          ➕ Add New Item
        </button>
      </div>

      <div className="menu-controls">
        <div className="category-filter">
          {categories.map(category => (
            <button
              key={category}
              className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {showAddForm && (
        <div className="add-form-overlay">
          <div className="add-form">
            <h3>Add New Menu Item</h3>
            <p>Form implementation would go here...</p>
            <button onClick={() => setShowAddForm(false)}>Close</button>
          </div>
        </div>
      )}

      <div className="menu-grid">
        {filteredItems.map(item => (
          <div key={item.id} className={`menu-item ${!item.available ? 'unavailable' : ''}`}>
            <div className="item-header">
              <h3>{item.name}</h3>
              <span className="item-price">${item.price}</span>
            </div>
            <p className="item-description">{item.description}</p>
            <div className="item-footer">
              <span className="item-category">{item.category}</span>
              <button
                className={`availability-btn ${item.available ? 'available' : 'unavailable'}`}
                onClick={() => toggleAvailability(item.id)}
              >
                {item.available ? '✅ Available' : '❌ Unavailable'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="empty-state">
          <p>No items found in this category.</p>
        </div>
      )}
    </div>
  )
}
