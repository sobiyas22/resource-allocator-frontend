import create from 'zustand'
import { User, LoginResponse } from '../types/auth'

type AuthState = {
  token: string | null
  user: User | null
  expires_at: string | null
  login: (data: LoginResponse) => void
  logout: () => void
  loadFromStorage: () => void
  setUser: (user: User | null) => void
}

const STORAGE_KEY = 'sra_auth'

export const useAuth = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  expires_at: null,
  login: (data) => {
    set({
      token: data.token,
      user: data.user,
      expires_at: data.expires_at
    })
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        token: data.token,
        user: data.user,
        expires_at: data.expires_at
      })
    )
  },
  logout: () => {
    set({ token: null, user: null, expires_at: null })
    localStorage.removeItem(STORAGE_KEY)
  },
  loadFromStorage: () => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw)
      if (parsed?.token) {
        set({
          token: parsed.token,
          user: parsed.user,
          expires_at: parsed.expires_at
        })
      }
    } catch (e) {
      localStorage.removeItem(STORAGE_KEY)
    }
  },
  setUser: (user) => {
    set({ user })
    // keep token/expires_at unchanged; also keep storage in sync
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        parsed.user = user
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
      } catch {
        // ignore
      }
    }
  }
}))

// helper to access token synchronously from api wrapper
export function getAuth() {
  const state = useAuth.getState()
  return { token: state.token, user: state.user }
}