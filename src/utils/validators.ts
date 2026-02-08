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


// Booking Schema for Create Booking Form
export const bookingSchema = z.object({
  resource_id: z.number({ message: 'Resource is required' }),
  start_time: z.string().min(1, { message: 'Start time is required' }),
  end_time: z.string().min(1, { message: 'End time is required' })
})

export type BookingFormValues = z.infer<typeof bookingSchema>

// Booking Approval Schema
export const bookingApprovalSchema = z.object({
  admin_note: z.string().max(500, 'Note too long').optional()
})

export type BookingApprovalFormValues = z.infer<typeof bookingApprovalSchema>
// Resource Type Schema
export const resourceTypeSchema = z.enum(['meeting_room', 'phone', 'laptop', 'turf'])
export type ResourceType = z.infer<typeof resourceTypeSchema>

// Base Resource Schema
export const resourceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  resource_type: resourceTypeSchema,
  description: z.string().max(500, 'Description too long').optional(),
  location: z.string().min(1, 'Location is required').max(100, 'Location too long'),
  is_active: z.boolean().default(true),
  properties: z.record(z.string(), z.any()).optional().default({})
})

export type ResourceFormValues = z.infer<typeof resourceSchema>

// Property validation per resource type
export const meetingRoomPropertiesSchema = z.object({
  capacity: z.number().min(1, 'Capacity must be at least 1').max(1000, 'Capacity too high'),
  has_projector: z.boolean().optional(),
  has_whiteboard: z.boolean().optional(),
  has_video_conference: z.boolean().optional()
})

export const phonePropertiesSchema = z.object({
  brand: z.string().min(1, 'Brand is required'),
  model: z.string().min(1, 'Model is required'),
  phone_number: z.string().optional()
})

export const laptopPropertiesSchema = z.object({
  brand: z.string().min(1, 'Brand is required'),
  model: z.string().min(1, 'Model is required'),
  processor: z.string().optional(),
  ram_gb: z.number().min(1).optional(),
  storage_type: z.enum(['HDD', 'SSD']).optional()
})

export const turfPropertiesSchema = z.object({
  area_sqft: z.number().min(1, 'Area must be positive'),
  max_participants: z.number().min(1, 'Must allow at least 1 participant'),
  has_lighting: z.boolean().optional(),
  surface_type: z.string().optional()
})

