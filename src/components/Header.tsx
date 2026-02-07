import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/authStore'
import { api } from '../lib/api'
import { Button } from '@/components/ui/button'
import { LogOut, User } from 'lucide-react'
import { toast } from 'sonner'

const Header: React.FC = () => {
  const user = useAuth(state => state.user)
  const logout = useAuth(state => state.logout)
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function onLogout() {
    if (isLoggingOut) return

    setIsLoggingOut(true)

    // Optimistic update - logout immediately
    const previousState = {
      user: useAuth.getState().user,
      token: useAuth.getState().token,
      expires_at: useAuth.getState().expires_at
    }

    logout()
    navigate('/login', { replace: true })
    toast.success('Logged out successfully')

    // Call API in background
    try {
      await api.del('/auth/logout')
    } catch (err) {
      console.warn('Logout API call failed (already logged out client-side):', err)
      // Don't revert - user is already logged out client-side
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link 
          to="/" 
          className="text-2xl font-bold text-gray-900 hover:text-gray-700 transition-colors"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Smart Resource Allocation
        </Link>
        
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link 
                to="/profile" 
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
              >
                <User className="w-4 h-4" />
                <span className="font-medium">{user.name}</span>
              </Link>
              
              <Button
                onClick={onLogout}
                variant="outline"
                disabled={isLoggingOut}
                className="flex items-center gap-2 border-gray-300 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all"
              >
                {isLoggingOut ? (
                  <>
                    <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    Logging out...
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4" />
                    Logout
                  </>
                )}
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button className="bg-gray-800 hover:bg-gray-900 text-white">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header