import React, { useEffect, useState } from 'react'
import { api } from '../../lib/api'

type Booking = {
  id: string
  resource_name: string
  resource_type: string
  start: string
  end: string
  status: 'booked' | 'checked_in' | 'cancelled' | 'expired'
}

const History: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        // Placeholder: try GET /bookings (your API may be different)
        const res = await api.get<Booking[]>('/bookings')
        if (!mounted) return
        setBookings(res)
      } catch (err: any) {
        // If endpoint not available yet, show friendly message
        setError('Could not load bookings. If backend is not ready, this will remain empty.')
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Booking History</h1>

      <div className="bg-white p-4 rounded shadow">
        {loading && <p>Loading...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && bookings.length === 0 && !error && (
          <p className="text-sm text-gray-600">No bookings found. Your past bookings will show here.</p>
        )}

        {bookings.length > 0 && (
          <ul className="space-y-3">
            {bookings.map(b => (
              <li key={b.id} className="p-3 border rounded">
                <div className="flex justify-between">
                  <div>
                    <div className="font-medium">{b.resource_name} ({b.resource_type})</div>
                    <div className="text-sm text-gray-600">{new Date(b.start).toLocaleString()} — {new Date(b.end).toLocaleString()}</div>
                  </div>
                  <div className="text-sm">
                    <span className={`px-2 py-1 rounded ${b.status === 'checked_in' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{b.status}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default History