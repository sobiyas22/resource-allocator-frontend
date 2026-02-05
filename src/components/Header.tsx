import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/authStore'
import { api } from '../lib/api'
import { Button } from '@/components/ui/button'
import { LogOut, User } from 'lucide-react'

const Header: React.FC = () => {
  const user = useAuth(state => state.user)
  const logout = useAuth(state => state.logout)
  const navigate = useNavigate()

  async function onLogout() {
    try {
      await api.del('/auth/logout')
    } catch (err) {
      console.warn('Logout request failed:', err)
    } finally {
      logout()
      navigate('/login', { replace: true })
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
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <User className="w-4 h-4" />
                <span className="font-medium">{user.name}</span>
              </Link>
              
              <span className="px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-700 rounded-full">
                {user.role.toUpperCase()}
              </span>
              
              <Button 
                onClick={onLogout} 
                variant="outline"
                size="sm"
                className="border-gray-300 hover:bg-gray-100"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button 
                variant="outline"
                size="sm"
                className="border-gray-300 hover:bg-gray-100"
              >
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link 
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap" 
        rel="stylesheet" 
      />
    </header>
  )
}

export default Header