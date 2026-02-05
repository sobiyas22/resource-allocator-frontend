import React, { useEffect } from 'react'
import { useAuth } from '../store/authStore'
import { useNavigate } from 'react-router-dom'

const DashboardRedirect: React.FC = () => {
  const user = useAuth(state => state.user)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return
    const target = user.role === 'admin' ? '/dashboard/admin' : '/dashboard/employee'
    navigate(target, { replace: true })
  }, [user, navigate])

  return <div className="p-6">Redirecting to your dashboard...</div>
}

export default DashboardRedirect