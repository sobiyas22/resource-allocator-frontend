import React, { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, LoginFormValues } from '../utils/validators'
import { api } from '../lib/api'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/authStore'
import { useAutoLogout } from '../hooks/AutoLogout'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import Header from '../components/Header'
import Input from '../components/Input'
import Button from '../components/Button'
import { Role } from '../types/auth'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Eye, EyeOff, LogIn } from 'lucide-react'

const Login: React.FC = () => {
  const navigate = useNavigate()
  const login = useAuth(state => state.login)
  const loadFromStorage = useAuth(state => state.loadFromStorage)
  const token = useAuth(state => state.token)
  const user = useAuth(state => state.user)
  const emailInputRef = useRef<HTMLInputElement>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  useAutoLogout()

  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  // Autofocus email input on mount
  useEffect(() => {
    emailInputRef.current?.focus()
  }, [])

  // If already logged in, route to role-based dashboard
  useEffect(() => {
    if (token && user) {
      if (user.role === Role.Admin) {
        navigate('/dashboard/admin', { replace: true })
      } else {
        navigate('/dashboard/employee', { replace: true })
      }
    }
  }, [token, user, navigate])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'Enter',
      ctrlKey: true,
      callback: () => handleSubmit(onSubmit)(),
      description: 'Submit login form'
    }
  ])

  async function onSubmit(values: LoginFormValues) {
    try {
      const res = await api.post<{
        token: string
        user: { id: number; name: string; email: string; role: Role }
        expires_at: string
      }>('/auth/login', values)

      login(res, rememberMe)
      toast.success(`Welcome back, ${res.user.name}!`)

      // Navigate based on role
      if (res.user.role === Role.Admin) {
        navigate('/dashboard/admin', { replace: true })
      } else {
        navigate('/dashboard/employee', { replace: true })
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Invalid email or password'
      setError('root', { message: errorMessage })
      toast.error(errorMessage)
    }
  }

  if (token && user) {
    return null // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen flex flex-col bg-linear-to-br from-gray-50 to-gray-100">
      <Header />
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-linear-to-r from-gray-800 to-gray-900 px-8 py-6 text-center">
              <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4">
                <LogIn className="w-8 h-8 text-gray-800" />
              </div>
              <h1 
                className="text-3xl font-bold text-white mb-2" 
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Welcome Back
              </h1>
              <p className="text-gray-300 text-sm">
                Sign in to manage your resources
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
              {errors.root && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                  {errors.root.message}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  {...register('email')}
                  ref={(e) => {
                    register('email').ref(e)
                    if (e) emailInputRef.current = e
                  }}
                  error={errors.email?.message}
                  disabled={isSubmitting}
                  className="h-11"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    {...register('password')}
                    error={errors.password?.message}
                    disabled={isSubmitting}
                    className="h-11 pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  disabled={isSubmitting}
                />
                <Label
                  htmlFor="rememberMe"
                  className="text-sm text-gray-600 cursor-pointer select-none"
                >
                  Remember me for 30 days
                </Label>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </span>
                )}
              </Button>

              <div className="text-center text-sm text-gray-500">
                Press <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs">Ctrl</kbd> + <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs">Enter</kbd> to login
              </div>
            </form>
          </div>

          {/* Footer Info */}
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              <strong>Note:</strong> Accounts are created by administrators only.
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Contact your system administrator if you need access.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Login