import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, LoginFormValues } from '../utils/validators'
import { api } from '../lib/api'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/authStore'
import Header from '../components/Header'
import Input from '../components/Input'
import Button from '../components/Button'
import { Role } from '../types/auth'

const Login: React.FC = () => {
  const navigate = useNavigate()
  const login = useAuth(state => state.login)
  const loadFromStorage = useAuth(state => state.loadFromStorage)
  const token = useAuth(state => state.token)
  const user = useAuth(state => state.user)

  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  // If already logged in, route to role-based dashboard
  useEffect(() => {
    if (token && user) {
      const target = user.role === 'admin' ? '/dashboard/admin' : '/dashboard/employee'
      navigate(target, { replace: true })
    }
  }, [token, user, navigate])

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema)
  })

  async function onSubmit(values: LoginFormValues) {
    console.log('Login payload:', values)
    try {
      const res = await api.post<{ token: string; user: any; expires_at: string }>('/auth/login', values)
      login(res)
      const role: Role = res.user.role
      const target = role === 'admin' ? '/dashboard/admin' : '/dashboard/employee'
      navigate(target, { replace: true })
    } catch (err: any) {
      alert('Login failed: ' + (err.message || err))
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md p-6 bg-white rounded-md shadow">
          <h2 className="text-2xl font-semibold mb-4">Login</h2>

          <Input label="Email" {...register('email')} error={errors.email?.message?.toString()} />
          <Input label="Password" type="password" {...register('password')} error={errors.password?.message?.toString()} />

          <div className="mt-4">
            <Button type="submit" disabled={isSubmitting}>Sign in</Button>
          </div>
        </form>
      </main>
    </div>
  )
}

export default Login