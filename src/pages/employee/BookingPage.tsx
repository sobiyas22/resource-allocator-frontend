import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '../../lib/api'

const bookingSchema = z.object({
  resource_type: z.enum(['meeting_room', 'phone', 'laptop', 'turf']),
  resource_id: z.string().optional(),
  date: z.string().min(1),
  start_time: z.string().min(1),
  duration_min: z.number().refine(v => v === 30 || v === 60, 'Duration must be 30 or 60')
})
type FormValues = z.infer<typeof bookingSchema>

const BookingPage: React.FC = () => {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { resource_type: 'meeting_room', duration_min: 30 }
  })
  const [message, setMessage] = useState<string | null>(null)

  async function onSubmit(values: FormValues) {
    setMessage(null)
    try {
      // Example endpoint - your backend may differ. This is a placeholder.
      const payload = { ...values }
      const res = await api.post('/bookings', payload)
      setMessage('Booking created.')
      console.log('booking response', res)
    } catch (err: any) {
      setMessage('Failed to create booking: ' + (err.message || String(err)))
    }
  }

  const selectedType = watch('resource_type')

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Book Resource</h1>

      <section className="max-w-lg bg-white p-4 rounded shadow">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="block text-sm">Resource type</label>
            <select {...register('resource_type')} className="w-full border px-2 py-1 rounded">
              <option value="meeting_room">Meeting Room</option>
              <option value="phone">Phone</option>
              <option value="laptop">Laptop</option>
              <option value="turf">Turf (single)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm">Date</label>
            <input type="date" {...register('date')} className="w-full border px-2 py-1 rounded" />
            {errors.date && <p className="text-xs text-red-600">{errors.date.message}</p>}
          </div>

          <div>
            <label className="block text-sm">Start time</label>
            <input type="time" {...register('start_time')} className="w-full border px-2 py-1 rounded" />
            {errors.start_time && <p className="text-xs text-red-600">{errors.start_time.message}</p>}
          </div>

          <div>
            <label className="block text-sm">Duration</label>
            <select {...register('duration_min')} className="w-full border px-2 py-1 rounded">
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
            </select>
            {errors.duration_min && <p className="text-xs text-red-600">{errors.duration_min.message}</p>}
          </div>

          <div className="pt-2">
            <button type="submit" disabled={isSubmitting} className="px-3 py-1 rounded bg-indigo-600 text-white disabled:opacity-60">
              Book
            </button>
          </div>
        </form>

        {message && <p className="mt-3 text-sm text-gray-700">{message}</p>}

        <div className="mt-4 text-sm text-gray-600">
          <p>Selected resource type: <strong>{selectedType}</strong></p>
          <p className="mt-2">Note: Booking UI will evolve into a seat-style grid for meeting rooms (movie-theatre like) in the next iteration.</p>
        </div>
      </section>
    </div>
  )
}

export default BookingPage