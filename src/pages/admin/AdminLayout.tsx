import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import Header from '../../components/Header'
import { LayoutDashboard, CalendarCheck, Users, Boxes } from 'lucide-react'

const navItems = [
  { to: '/dashboard/admin/overview', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/dashboard/admin/bookings', label: 'Manage Bookings', icon: CalendarCheck },
  { to: '/dashboard/admin/users', label: 'User Management', icon: Users },
  { to: '/dashboard/admin/resources', label: 'Manage Resources', icon: Boxes },
]

const linkClass = (isActive: boolean) =>
  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
    isActive
      ? 'bg-neutral-900 text-white shadow-md'
      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
  }`

const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <Header />
      <div className="flex flex-1">
        <aside className="w-64 bg-white border-r border-neutral-200 p-6 shadow-sm">
          <h3
            className="text-xl font-bold mb-6 text-neutral-900"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Admin Panel
          </h3>
          <nav className="flex flex-col gap-1.5">
            {navItems.map(item => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => linkClass(isActive)}>
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-8 overflow-auto">
          <Outlet />
        </main>
      </div>

      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet" />
    </div>
  )
}

export default AdminLayout