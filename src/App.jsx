import React from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Welcome from './Pages/Welcome'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path = '/restaurant-pos/' element={<Welcome/>}/>
      </Routes>
    </BrowserRouter>
  )
}
