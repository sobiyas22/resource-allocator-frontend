export enum Role {
  Admin = 'admin',
  Employee = 'employee',
}

export interface User {
  employee_id?: string
  name: string
  email: string
  role: Role
}

export interface LoginResponse {
  token: string
  user: User
  expires_at: string
}