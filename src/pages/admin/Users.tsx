import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '../../lib/api'
import { userSchema, UserFormValues } from '../../utils/validators'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { UserPlus, Mail, Shield, User } from 'lucide-react'

interface User {
  id: string
  employee_id: string
  name: string
  email: string
  role: 'admin' | 'employee'
  created_at?: string
}

const Users: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting }, setValue } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: 'employee'
    }
  })

  async function fetchUsers() {
    setLoading(true)
    try {
      const res = await api.get<{ users: User[]; total: number }>('/users')
      setUsers(res.users || [])
    } catch (err: any) {
      console.error('Failed to fetch users:', err)
      setUsers([])
      setMessage({ type: 'error', text: 'Failed to fetch users' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  async function onSubmit(values: UserFormValues) {
    setMessage(null)
    try {
      await api.post('/users', values)
      setMessage({ type: 'success', text: 'User created successfully!' })
      reset()
      setOpen(false)
      fetchUsers() // Refresh the list
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to create user' })
    }
  }

  return (
    <div className="max-w-6xl">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          User Management
        </h1>
        <p className="text-gray-600">Manage system users and their permissions</p>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Users Table Card */}
      <Card className="border-gray-200 shadow-lg">
        <CardHeader className="border-b border-gray-100 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <CardTitle className="text-2xl text-gray-900">Users</CardTitle>
              <Badge variant="secondary" className="bg-gray-200 text-gray-800">
                {users.length} {users.length === 1 ? 'user' : 'users'}
              </Badge>
            </div>
            
            {/* Add User Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gray-900 hover:bg-gray-800 text-white">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add New User
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-125 bg-white">
                <DialogHeader>
                  <DialogTitle className="text-2xl" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Create New User
                  </DialogTitle>
                  <DialogDescription>
                    Add a new user to the system. Fill in all required fields.
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="employee_id">Employee ID</Label>
                    <Input 
                      id="employee_id"
                      {...register('employee_id')} 
                      placeholder="EMP001"
                      className="w-full"
                    />
                    {errors.employee_id && (
                      <p className="text-xs text-red-600">{errors.employee_id.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name"
                      {...register('name')} 
                      placeholder="John Doe"
                      className="w-full"
                    />
                    {errors.name && (
                      <p className="text-xs text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email"
                      type="email"
                      {...register('email')} 
                      placeholder="john@company.com"
                      className="w-full"
                    />
                    {errors.email && (
                      <p className="text-xs text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password"
                      type="password"
                      {...register('password')} 
                      placeholder="••••••••"
                      className="w-full"
                    />
                    {errors.password && (
                      <p className="text-xs text-red-600">{errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select 
                      onValueChange={(value) => setValue('role', value as 'employee')}
                      defaultValue="employee"
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="employee">Employee</SelectItem>
                        {/* <SelectItem value="admin">Admin</SelectItem> */}
                      </SelectContent>
                    </Select>
                    {errors.role && (
                      <p className="text-xs text-red-600">{errors.role.message}</p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setOpen(false)}
                      className="flex-1 cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="flex-1 bg-green-700 hover:bg-green-600 cursor-pointer"
                    >
                      {isSubmitting ? 'Creating...' : 'Create User'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No users found</p>
              <p className="text-sm text-gray-400 mt-1">Click "Add New User" to create one</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-semibold text-gray-900">Employee ID</TableHead>
                  <TableHead className="font-semibold text-gray-900">Name</TableHead>
                  <TableHead className="font-semibold text-gray-900">Email</TableHead>
                  <TableHead className="font-semibold text-gray-900">Role</TableHead>
                  <TableHead className="font-semibold text-gray-900">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium text-gray-900">{user.employee_id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="text-gray-900">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4" />
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={user.role === 'admin' ? 'default' : 'secondary'}
                        className={user.role === 'admin' ? 'bg-green-300 hover:bg-green-200' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Users