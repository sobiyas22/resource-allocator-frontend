import React, { useEffect, useState } from 'react'
import Header from '../components/Header'
import { api } from '../lib/api'
import { useAuth } from '../store/authStore'
import { User } from '../types/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User as UserIcon, Mail, Shield, Hash, Calendar } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

const Profile: React.FC = () => {
  const storeUser = useAuth(state => state.user)
  const setUser = useAuth(state => state.setUser)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setLocalUser] = useState<User | null>(storeUser ?? null)

  useEffect(() => {
    if (storeUser) { setLocalUser(storeUser); return }
    let mounted = true
    async function load() {
      setLoading(true); setError(null)
      try {
        const res = await api.get<User>('/auth/me')
        if (!mounted) return
        setLocalUser(res); setUser(res)
      } catch (err: any) { setError(err.message || String(err)) }
      finally { setLoading(false) }
    }
    load()
    return () => { mounted = false }
  }, [storeUser, setUser])

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <Header />
      <main className="flex-1 p-8">
        <div className="max-w-lg mx-auto">
          <h1
            className="text-3xl font-bold text-neutral-900 mb-8"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            My Profile
          </h1>

          {loading && (
            <Card className="rounded-2xl border-neutral-200">
              <CardContent className="p-6 space-y-4">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-6 w-full" />)}
              </CardContent>
            </Card>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              Error: {error}
            </div>
          )}

          {user && (
            <Card className="rounded-2xl border-neutral-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-neutral-900 text-white p-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-neutral-900 font-bold text-2xl">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <CardTitle className="text-xl text-white">{user.name}</CardTitle>
                    <p className="text-neutral-300 text-sm mt-1">{user.email}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center justify-between py-3 border-b border-neutral-100">
                  <div className="flex items-center gap-2 text-neutral-500 text-sm">
                    <Hash className="w-4 h-4" /> Employee ID
                  </div>
                  <span className="font-mono font-semibold text-neutral-900">{user.employee_id}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-neutral-100">
                  <div className="flex items-center gap-2 text-neutral-500 text-sm">
                    <UserIcon className="w-4 h-4" /> Name
                  </div>
                  <span className="font-semibold text-neutral-900">{user.name}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-neutral-100">
                  <div className="flex items-center gap-2 text-neutral-500 text-sm">
                    <Mail className="w-4 h-4" /> Email
                  </div>
                  <span className="font-medium text-neutral-900">{user.email}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2 text-neutral-500 text-sm">
                    <Shield className="w-4 h-4" /> Role
                  </div>
                  <Badge className="bg-neutral-900 text-white rounded-full px-3 capitalize">
                    {user.role}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}

export default Profile