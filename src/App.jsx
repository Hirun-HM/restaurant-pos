import React from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Welcome from './Pages/Welcome'
import UserDashboard from './Pages/User/Dashboard'
import AdminDashboard from './Pages/Admin/Dashboard'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/restaurant-pos/' element={<Welcome />} />
        <Route path='/restaurant-pos/user/dashboard' element={<UserDashboard />} />
        <Route path='/restaurant-pos/admin/dashboard' element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}
