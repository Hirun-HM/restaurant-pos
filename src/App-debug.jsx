import React from 'react'

// Simple debug version of App to test if React is working
export default function App() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
      background: 'linear-gradient(to bottom right, #fefce8, #fffbeb, #fef9c3)',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ 
        fontSize: '2rem', 
        fontWeight: 'bold', 
        color: '#ca8a04',
        marginBottom: '1rem'
      }}>
        🍽️ Restaurant POS
      </h1>
      <p style={{ 
        fontSize: '1.2rem', 
        color: '#92400e',
        textAlign: 'center'
      }}>
        Debug Mode - React is Working!
      </p>
      <div style={{
        marginTop: '2rem',
        padding: '1rem 2rem',
        backgroundColor: '#FFD700',
        color: '#000',
        borderRadius: '0.5rem',
        fontWeight: 'bold'
      }}>
        ✅ App Successfully Loaded
      </div>
    </div>
  )
}
