import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/authStore'
import { api } from '../lib/api'
import { Button } from '@/components/ui/button'
import { GlobalSearch } from './GlobalSearch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, User, ChevronDown, Mail, Shield, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { NotificationCenter } from './NotificationCenter'

const Header: React.FC = () => {
  const user = useAuth(state => state.user)
  const logout = useAuth(state => state.logout)
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function onLogout() {
    if (isLoggingOut) return

    setIsLoggingOut(true)
    logout()
    navigate('/login', { replace: true })
    toast.success('Logged out successfully')

    try {
      await api.del('/auth/logout')
    } catch (err) {
      console.warn('Logout API call failed:', err)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link 
          to="/" 
          className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hover:from-indigo-700 hover:to-purple-700 transition-all"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Smart Resource Allocation
        </Link>
        
        <div className="flex items-center gap-4">
          <GlobalSearch />
          <NotificationCenter />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 border-gray-300 hover:bg-indigo-50 hover:border-indigo-300 transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-gray-700">{user.name}</span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 bg-white">
                <DropdownMenuLabel className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                
                <DropdownMenuSeparator />
                
                <div className="px-2 py-2">
                  <div className="bg-indigo-50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Role</span>
                      <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500">
                        <Shield className="w-3 h-3 mr-1" />
                        {user.role}
                      </Badge>
                    </div>
                    {(user as any).employee_id && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Employee ID</span>
                        <span className="text-sm font-mono font-medium text-gray-900">
                          {(user as any).employee_id}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Member Since</span>
                      <span className="text-sm font-medium text-gray-900 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date((user as any).created_at || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={onLogout}
                  disabled={isLoggingOut}
                  className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
                >
                  {isLoggingOut ? (
                    <>
                      <span className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-2" />
                      Logging out...
                    </>
                  ) : (
                    <>
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login">
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
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