import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import Header from '../../components/Header'

const linkClass = (isActive: boolean) =>
  `block px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
    isActive 
      ? 'bg-gray-900 text-white shadow-md' 
      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
  }`

const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-linear-to-br from-gray-50 via-gray-100 to-gray-50">
      <Header />
      <div className="flex flex-1">
        <aside className="w-64 bg-white border-r border-gray-200 p-6 shadow-sm">
          <h3 className="text-xl font-bold mb-6 text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
            Admin Panel
          </h3>
          <nav className="flex flex-col gap-2">
            <NavLink to="/dashboard/admin/users" className={({ isActive }) => linkClass(isActive)}>
              User Management
            </NavLink>
            <NavLink to="/dashboard/admin/resources" className={({ isActive }) => linkClass(isActive)}>
              Manage Resources
            </NavLink>
            <NavLink to="/dashboard/admin/bookings" className={({ isActive }) => linkClass(isActive)}>
              Bookings
            </NavLink>
          </nav>
        </aside>

        <main className="flex-1 p-8 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link 
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap" 
        rel="stylesheet" 
      />
    </div>
  )
}

export default AdminLayout