import React, { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../store/authStore'
import { useAutoLogout } from '../hooks/AutoLogout'
import { Role } from '../types/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: Role[]
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles 
}) => {
  const token = useAuth(state => state.token)
  const user = useAuth(state => state.user)
  const loadFromStorage = useAuth(state => state.loadFromStorage)
  const isTokenExpired = useAuth(state => state.isTokenExpired)

  useAutoLogout()

  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  // Check if token is expired
  if (isTokenExpired()) {
    return <Navigate to="/login" replace />
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute