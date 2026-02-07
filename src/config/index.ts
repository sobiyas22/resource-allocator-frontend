const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  apiTimeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  tokenKey: import.meta.env.VITE_TOKEN_KEY || 'sra_auth',
  tokenExpiryBuffer: Number(import.meta.env.VITE_TOKEN_EXPIRY_BUFFER) || 300000, // 5 min before expiry
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
} as const

export default config