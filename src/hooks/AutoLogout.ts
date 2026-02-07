import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/authStore'
import { toast } from 'sonner'

export function useAutoLogout() {
  const navigate = useNavigate()
  const logout = useAuth(state => state.logout)
  const isTokenExpired = useAuth(state => state.isTokenExpired)
  const isTokenExpiringSoon = useAuth(state => state.isTokenExpiringSoon)
  const expires_at = useAuth(state => state.expires_at)
  const hasShownWarning = useRef(false)

  useEffect(() => {
    if (!expires_at) return

    // Check immediately on mount
    if (isTokenExpired()) {
      logout()
      navigate('/login', { replace: true })
      toast.error('Your session has expired. Please login again.')
      return
    }

    // Check every minute
    const checkInterval = setInterval(() => {
      if (isTokenExpired()) {
        logout()
        navigate('/login', { replace: true })
        toast.error('Your session has expired. Please login again.')
        clearInterval(checkInterval)
      } else if (isTokenExpiringSoon() && !hasShownWarning.current) {
        toast.warning('Your session will expire soon. Please save your work.')
        hasShownWarning.current = true
      }
    }, 60000) // Check every 1 minute

    return () => clearInterval(checkInterval)
  }, [expires_at, isTokenExpired, isTokenExpiringSoon, logout, navigate])
}