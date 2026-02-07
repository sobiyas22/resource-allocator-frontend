import { create } from 'zustand'
import { User, LoginResponse } from '../types/auth'
import config from '../config'

type AuthState = {
  token: string | null
  user: User | null
  expires_at: string | null
  rememberMe: boolean
  login: (data: LoginResponse, rememberMe?: boolean) => void
  logout: () => void
  loadFromStorage: () => void
  setUser: (user: User | null) => void
  isTokenExpired: () => boolean
  isTokenExpiringSoon: () => boolean
  setRememberMe: (remember: boolean) => void
}

export const useAuth = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  expires_at: null,
  rememberMe: false,

  login: (data, rememberMe = false) => {
    set({
      token: data.token,
      user: data.user,
      expires_at: data.expires_at,
      rememberMe
    })
    
    const authData = {
      token: data.token,
      user: data.user,
      expires_at: data.expires_at,
      rememberMe
    }

    if (rememberMe) {
      localStorage.setItem(config.tokenKey, JSON.stringify(authData))
    } else {
      sessionStorage.setItem(config.tokenKey, JSON.stringify(authData))
    }
  },

  logout: () => {
    set({ token: null, user: null, expires_at: null, rememberMe: false })
    localStorage.removeItem(config.tokenKey)
    sessionStorage.removeItem(config.tokenKey)
  },

  loadFromStorage: () => {
    try {
      const localStored = localStorage.getItem(config.tokenKey)
      const sessionStored = sessionStorage.getItem(config.tokenKey)
      const stored = localStored || sessionStored

      if (stored) {
        const data = JSON.parse(stored)
        
        // Check if token is expired
        if (data.expires_at) {
          const expiryTime = new Date(data.expires_at).getTime()
          const now = Date.now()

          if (now >= expiryTime) {
            // Token expired, clear storage
            get().logout()
            return
          }
        }

        set({
          token: data.token,
          user: data.user,
          expires_at: data.expires_at,
          rememberMe: data.rememberMe || false
        })
      }
    } catch (error) {
      console.error('Failed to load auth from storage:', error)
      get().logout()
    }
  },

  setUser: (user) => {
    set({ user })
    const localStored = localStorage.getItem(config.tokenKey)
    const sessionStored = sessionStorage.getItem(config.tokenKey)
    const stored = localStored || sessionStored
    
    if (stored) {
      const data = JSON.parse(stored)
      data.user = user
      const storageToUse = localStored ? localStorage : sessionStorage
      storageToUse.setItem(config.tokenKey, JSON.stringify(data))
    }
  },

  setRememberMe: (remember) => {
    set({ rememberMe: remember })
  },

  isTokenExpired: () => {
    const { expires_at } = get()
    if (!expires_at) return true

    const expiryTime = new Date(expires_at).getTime()
    const now = Date.now()
    return now >= expiryTime
  },

  isTokenExpiringSoon: () => {
    const { expires_at } = get()
    if (!expires_at) return true

    const expiryTime = new Date(expires_at).getTime()
    const now = Date.now()
    const buffer = config.tokenExpiryBuffer

    return now >= (expiryTime - buffer)
  },
}))