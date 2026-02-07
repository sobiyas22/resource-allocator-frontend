import axios, { AxiosError, AxiosRequestConfig } from 'axios'
import config from '../config'
import { useAuth } from '../store/authStore'

const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: config.apiTimeout,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (requestConfig:any) => {
    const token = useAuth.getState().token
    if (token && requestConfig.headers) {
      requestConfig.headers.Authorization = `Bearer ${token}`
    }
    return requestConfig
  },
  (error:any) => Promise.reject(error)
)

// Response interceptor - Handle errors & token refresh
apiClient.interceptors.response.use(
  (response:any) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      // Check if token is expired
      const { expires_at, logout } = useAuth.getState()
      if (expires_at) {
        const expiryTime = new Date(expires_at).getTime()
        const now = Date.now()

        if (now >= expiryTime) {
          // Token expired, logout user
          logout()
          window.location.href = '/login'
          return Promise.reject(new Error('Session expired. Please login again.'))
        }
      }
    }

    // Handle network errors
    if (!error.response) {
      return Promise.reject(new Error('Network error. Please check your connection.'))
    }

    // Handle other errors
    const errorMessage = 
      (error.response?.data as any)?.error || 
      (error.response?.data as any)?.message ||
      error.message ||
      'An unexpected error occurred'

    return Promise.reject(new Error(errorMessage))
  }
)

// API helper functions
export const api = {
  get: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.get<T>(url, config)
    return response.data
  },

  post: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.post<T>(url, data, config)
    return response.data
  },

  patch: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.patch<T>(url, data, config)
    return response.data
  },

  put: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.put<T>(url, data, config)
    return response.data
  },

  del: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.delete<T>(url, config)
    return response.data
  },
}

export default apiClient