import { getAuth } from '../store//authStore'

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'

type RequestInitExtended = RequestInit & { body?: any }

async function request<T>(path: string, opts: RequestInitExtended = {}): Promise<T> {
  const url = `${BASE}${path}`
  const token = getAuth().token

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(opts.headers as Record<string, string> | undefined),
  }

  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(url, {
    ...opts,
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || res.statusText)
  }

  const contentType = res.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return (await res.json()) as T
  }

  // For DELETE / 204 responses with no body
  return {} as T
}


export const api = {
  post: <T = any>(path: string, body?: any) => request<T>(path, { method: 'POST', body }),
  get: <T = any>(path: string) => request<T>(path, { method: 'GET' }),
  put: <T = any>(path: string, body?: any) => request<T>(path, { method: 'PUT', body }),
  patch: <T = any>(path: string, body?: any) => request<T>(path, { method: 'PATCH', body }),
  del: <T = any>(path: string) => request<T>(path, { method: 'DELETE' })
}