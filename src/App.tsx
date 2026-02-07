import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/Landing'
import LoginPage from './pages/Login'
import ProtectedRoute from './routes/ProtectedRoute'
import AdminLayout from './pages/admin/AdminLayout'
import AdminUsers from './pages/admin/Users'
import AdminResources from './pages/admin/Resources'
import Bookings from './pages/admin/Bookings'
import EmployeeLayout from './pages/employee/EmployeeLayout'
import BookingHistory from './pages/employee/BookingHistory'
import BookResource from './pages/BookResource'
import EmployeeDashboard from './pages/employee/EmployeeDashboard'
import DashboardRedirect from './pages/DashboardRedirect' // keeps /dashboard redirect behavior
import Unauthorized from './pages/Unauthorized'
import Profile from './pages/Profile'
import { Role } from './types/auth'

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Generic /dashboard path -> redirect to role-specific dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardRedirect />
          </ProtectedRoute>
        }
      />

      {/* Admin nested routes */}
      <Route
        path="/dashboard/admin/*"
        element={
          <ProtectedRoute allowedRoles={[Role.Admin]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="bookings" replace />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="resources" element={<AdminResources />} />
        <Route path="book" element={<BookResource />} />
        <Route path="bookings" element={<Bookings />} />
      </Route>

      {/* Employee nested routes */}
      <Route
        path="/dashboard/employee/*"
        element={
          <ProtectedRoute allowedRoles={[Role.Employee]}>
            <EmployeeLayout />
          </ProtectedRoute>
        }
      />
      <Route path="/dashboard/employee" element={<EmployeeLayout />}>
        <Route index element={<EmployeeDashboard />} />
        <Route path="book" element={<BookResource />} />
        <Route path="history" element={<BookingHistory />} />
      </Route>


      {/* Profile */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App