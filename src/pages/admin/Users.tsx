import React, { useState, useEffect, useRef } from 'react'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { UserPlus, Mail, Shield, User as UserIcon, Trash2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { TableSkeleton } from '../../components/TableSkeleton'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'

interface User {
  id: number
  employee_id: string
  name: string
  email: string
  role: 'admin' | 'employee'
  created_at: string
}

interface UsersResponse {
  users: User[]
  total: number
  limit: number
  offset: number
  has_more: boolean
}

const Users: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const emailInputRef = useRef<HTMLInputElement>(null)

  const { 
    register, 
    handleSubmit, 
    reset, 
    formState: { errors, isSubmitting }, 
    setValue 
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: 'employee'
    }
  })

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'n',
      ctrlKey: true,
      callback: () => {
        if (!open) {
          setOpen(true)
          setTimeout(() => emailInputRef.current?.focus(), 100)
        }
      },
      description: 'Create new user'
    },
    {
      key: 'Escape',
      callback: () => {
        if (open) setOpen(false)
        if (deleteDialogOpen) setDeleteDialogOpen(false)
      },
      description: 'Close dialogs'
    }
  ])

  async function fetchUsers() {
    setLoading(true)
    try {
      const res = await api.get<UsersResponse>('/users')
      setUsers(res.users || [])
      setFilteredUsers(res.users || [])
    } catch (err: any) {
      console.error('Failed to fetch users:', err)
      setUsers([])
      setFilteredUsers([])
      toast.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Filter users based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = users.filter(user => 
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.employee_id.toLowerCase().includes(query)
    )
    setFilteredUsers(filtered)
  }, [searchQuery, users])

  // Focus email input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => emailInputRef.current?.focus(), 100)
    }
  }, [open])

  async function onSubmit(values: UserFormValues) {
    try {
      // Optimistic update
      const tempUser: User = {
        id: Date.now(), // Temporary ID
        employee_id: values.employee_id,
        name: values.name,
        email: values.email,
        role: values.role as 'admin' | 'employee',
        created_at: new Date().toISOString()
      }

      setUsers(prev => [tempUser, ...prev])
      setOpen(false)
      reset()
      toast.success('Creating user...')

      // Actual API call
      await api.post('/users', values)
      
      // Refresh to get actual data
      await fetchUsers()
      toast.success('User created successfully!')
    } catch (err: any) {
      // Revert optimistic update
      setUsers(prev => prev.filter(u => u.id !== Date.now()))
      
      const errorMessage = err.message || 'Failed to create user'
      
      // Handle specific validation errors
      if (errorMessage.includes('email') || errorMessage.includes('Email')) {
        toast.error('Email already exists or is invalid')
      } else if (errorMessage.includes('employee_id')) {
        toast.error('Employee ID already exists')
      } else {
        toast.error(errorMessage)
      }
      
      setOpen(true) // Reopen dialog so user can fix errors
    }
  }

  async function handleDelete(user: User) {
    setIsDeleting(true)

    try {
      // Optimistic update
      const previousUsers = [...users]
      setUsers(prev => prev.filter(u => u.id !== user.id))
      setDeleteDialogOpen(false)
      setUserToDelete(null)
      toast.success('Deleting user...')

      // Actual API call
      await api.del(`/users/${user.id}`)
      toast.success('User deleted successfully!')
    } catch (err: any) {
      // Revert optimistic update
      await fetchUsers()
      
      const errorMessage = err.message || 'Failed to delete user'
      toast.error(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  function openDeleteDialog(user: User) {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  return (
    <div className="max-w-6xl">
      {/* Breadcrumbs */}
      <Breadcrumbs 
        items={[
          { label: 'Admin Dashboard', href: '/dashboard/admin' },
          { label: 'User Management' }
        ]} 
      />

      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          User Management
        </h1>
        <p className="text-gray-600">
          Create and manage employee accounts
        </p>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search users by name, email, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Create User Button */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gray-700 hover:bg-gray-800 text-white">
              <UserPlus className="w-4 h-4 mr-2" />
              Create User
              <kbd className="ml-2 px-2 py-0.5 text-xs bg-gray-700 rounded">Ctrl+N</kbd>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-white">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new employee or admin to the system
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="employee_id">Employee ID</Label>
                <Input
                  id="employee_id"
                  placeholder="e.g., EMP001"
                  {...register('employee_id')}
                  disabled={isSubmitting}
                />
                {errors.employee_id && (
                  <p className="text-sm text-red-600">{errors.employee_id.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  {...register('name')}
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@company.com"
                  {...register('email')}
                  ref={(e) => {
                    register('email').ref(e)
                    if (e) emailInputRef.current = e
                  }}
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Temporary Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min 6 characters"
                  {...register('password')}
                  disabled={isSubmitting}
                />
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  defaultValue="employee"
                  onValueChange={(value) => setValue('role', value as 'admin' | 'employee')}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className='bg-white'>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-sm text-red-600">{errors.role.message}</p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOpen(false)
                    reset()
                  }}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gray-800 hover:bg-gray-900 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    'Create User'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>All Users ({filteredUsers.length})</span>
            {searchQuery && (
              <span className="text-sm font-normal text-gray-500">
                Filtered from {users.length} total
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={5} columns={5} />
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'No users found' : 'No users yet'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery 
                  ? 'Try adjusting your search query'
                  : 'Create your first user to get started'
                }
              </p>
              {!searchQuery && (
                <Button onClick={() => setOpen(true)} className="bg-gray-800 hover:bg-gray-900">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create User
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-sm">{user.employee_id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={user.role === 'admin' ? 'default' : 'secondary'}
                        className={user.role === 'admin' ? 'bg-gray-600 text-white' : ''}
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(user)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{userToDelete?.name}</strong>?
              This action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToDelete && handleDelete(userToDelete)}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default Users