import React from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Welcome from './Pages/Welcome'
import UserDashboard from './Pages/User/Dashboard'
import AdminDashboard from './Pages/Admin/Dashboard'

export default function App() {
  return (
    <BrowserRouter basename="">
      <Routes>
        <Route path='/' element={<Welcome />} />
        <Route path='/user/dashboard' element={<UserDashboard />} />
        <Route path='/admin/dashboard' element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}
