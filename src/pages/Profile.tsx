import React, { useEffect, useState } from 'react'
import Header from '../components/Header'
import { api } from '../lib/api'
import { useAuth } from '../store/authStore'
import { User } from '../types/auth'

const Profile: React.FC = () => {
  const storeUser = useAuth(state => state.user)
  const setUser = useAuth(state => state.setUser)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setLocalUser] = useState<User | null>(storeUser ?? null)

  useEffect(() => {
    // If we already have user in store, show it immediately
    if (storeUser) {
      setLocalUser(storeUser)
      return
    }

    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await api.get<User>('/auth/me')
        if (!mounted) return
        setLocalUser(res)
        setUser(res)
      } catch (err: any) {
        setError(err.message || String(err))
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [storeUser, setUser])

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold">Profile</h1>

        {loading && <p className="mt-4">Loading...</p>}
        {error && <p className="mt-4 text-red-600">Error: {error}</p>}

        {user && (
          <div className="mt-6 bg-white p-4 rounded shadow max-w-md">
            <dl>
              <div className="mb-3">
                <dt className="text-sm text-gray-500">Employee ID</dt>
                <dd className="font-medium">{user.employee_id}</dd>
              </div>
              <div className="mb-3">
                <dt className="text-sm text-gray-500">Name</dt>
                <dd className="font-medium">{user.name}</dd>
              </div>
              <div className="mb-3">
                <dt className="text-sm text-gray-500">Email</dt>
                <dd className="font-medium">{user.email}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-500">Role</dt>
                <dd className="font-medium">{user.role}</dd>
              </div>
            </dl>
          </div>
        )}
      </main>
    </div>
  )
}

export default Profile