export type Role = 'admin' | 'employee'

export interface User {
  employee_id: string
  name: string
  email: string
  role: Role
}

export interface LoginResponse {
  token: string
  user: User
  expires_at: string
}