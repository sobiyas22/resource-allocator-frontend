import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' })
})

export type LoginFormValues = z.infer<typeof loginSchema>



// User Schema for Create User Form
export const userSchema = z.object({
  employee_id: z.string().min(1, { message: 'Employee ID is required' }),
  name: z.string().min(1, { message: 'Name is required' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  role: z.enum(['admin', 'employee'], { message: 'Role must be either admin or employee' })
})

export type UserFormValues = z.infer<typeof userSchema>


export const resourceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  resource_type: z.enum(['meeting_room', 'phone', 'laptop', 'turf']),
  location: z.string().optional(),
  is_active: z.boolean().default(true),
  properties: z.object({
    capacity: z.union([z.string(), z.number()]).optional(),
    model: z.string().optional(),
    phone_number: z.string().optional(),
    os: z.string().optional(),
    ram: z.string().optional(), // ✅ Add this line
    storage: z.string().optional(), // ✅ Add this if you need it too
    serial_number: z.string().optional(), // ✅ Add this if you need it too
    projector: z.boolean().optional(),
  }).optional(),
})

export type ResourceFormValues = z.infer<typeof resourceSchema>



// Booking Schema for Create Booking Form
export const bookingSchema = z.object({
  resource_id: z.number({ message: 'Resource is required' }),
  start_time: z.string().min(1, { message: 'Start time is required' }),
  end_time: z.string().min(1, { message: 'End time is required' })
})

export type BookingFormValues = z.infer<typeof bookingSchema>

// Booking Approval Schema
export const bookingApprovalSchema = z.object({
  status: z.enum(['approved', 'rejected'], { message: 'Status must be approved or rejected' }),
  admin_note: z.string().optional()
})

export type BookingApprovalFormValues = z.infer<typeof bookingApprovalSchema>

