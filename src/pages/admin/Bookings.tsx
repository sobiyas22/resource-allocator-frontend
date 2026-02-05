import React from 'react'

const AdminBookings: React.FC = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Bookings</h1>
      <p className="text-sm text-gray-600">Booking management will allow admins to view, filter and modify bookings, check-ins and releases.</p>

      <div className="mt-6 bg-white p-4 rounded shadow">
        <p className="text-sm text-gray-700">Bookings list and controls coming soon. You can integrate GET /bookings and PATCH endpoints here to approve, cancel or force-release bookings.</p>
      </div>
    </div>
  )
}

export default AdminBookings