import React, { useEffect } from 'react'
import { useAuth } from '../store/authStore'
import { Navigate, useLocation } from 'react-router-dom'
import { Role } from '../types/auth'

type Props = {
  children: React.ReactNode
  allowedRoles?: Role[] // if omitted, any authenticated user can access
}

const ProtectedRoute: React.FC<Props> = ({ children, allowedRoles }) => {
  const token = useAuth(state => state.token)
  const user = useAuth(state => state.user)
  const loadFromStorage = useAuth(state => state.loadFromStorage)
  const location = useLocation()

  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  if (!token) {
    // Not authenticated -> send to login
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Authenticated but not authorized -> redirect to their own dashboard
    const redirectTo = user.role === 'admin' ? '/dashboard/admin' : '/dashboard/employee'
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}

export default ProtectedRoute