import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import Header from '../../components/Header'

const linkClass = (isActive: boolean) =>
  `block px-3 py-2 rounded-md ${isActive ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`

const EmployeeLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1">
        <aside className="w-64 bg-white border-r p-4">
          <h3 className="text-lg font-semibold mb-4">Employee</h3>
          <nav className="flex flex-col gap-2">
            <NavLink to="/dashboard/employee/book" className={({ isActive }) => linkClass(isActive)}>Book Resource</NavLink>
            <NavLink to="/dashboard/employee/history" className={({ isActive }) => linkClass(isActive)}>Booking History</NavLink>
          </nav>
        </aside>

        <main className="flex-1 p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default EmployeeLayout