import React, { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Calendar, Clock, Eye, CheckCircle, XCircle, MapPin } from 'lucide-react'

interface Booking {
  id: number
  resource_id: number
  start_time: string
  end_time: string
  status: 'pending' | 'approved' | 'rejected' | 'checked_in' | 'completed' | 'cancelled'
  checked_in_at?: string | null
  admin_note?: string | null
  created_at: string
  resource?: {
    id: number
    name: string
    resource_type: string
    location?: string
  }
}

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected' | 'checked_in' | 'completed' | 'cancelled'

const BookingHistory: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [openView, setOpenView] = useState(false)

  async function fetchBookings() {
    setLoading(true)
    try {
      const res = await api.get<{ bookings: Booking[] }>('/bookings')
      const allBookings = (res.bookings || []).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setBookings(allBookings)
    } catch (err: any) {
      console.error('Failed to fetch bookings:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  async function onViewDetails(booking: Booking) {
    try {
      const res = await api.get<Booking>(`/bookings/${booking.id}`)
      setSelectedBooking(res)
      setOpenView(true)
    } catch (err: any) {
      console.error('Failed to fetch booking details')
    }
  }

  const filteredBookings = filterStatus === 'all' 
    ? bookings 
    : bookings.filter(b => b.status === filterStatus)

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      checked_in: 'bg-green-100 text-green-800',
      completed: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-gray-100 text-gray-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const statusFilters: FilterStatus[] = ['all', 'pending', 'approved', 'checked_in', 'completed', 'rejected', 'cancelled']

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          Booking History
        </h1>
        <p className="text-gray-600">View all your past and current bookings</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {statusFilters.map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filterStatus === status
                ? 'bg-gray-900 text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'
            }`}
          >
            {status.replace('_', ' ').toUpperCase()}
            <Badge 
              variant="secondary" 
              className={`ml-2 ${filterStatus === status ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}
            >
              {status === 'all' ? bookings.length : bookings.filter(b => b.status === status).length}
            </Badge>
          </button>
        ))}
      </div>

      {/* Bookings Table */}
      <Card className="border-gray-200 shadow-lg">
        <CardHeader className="border-b border-gray-100 bg-gray-50">
          <CardTitle className="text-2xl text-gray-900">
            {filterStatus === 'all' ? 'All Bookings' : `${filterStatus.replace('_', ' ')} Bookings`.toUpperCase()}
          </CardTitle>
          <CardDescription>
            {filteredBookings.length} {filteredBookings.length === 1 ? 'booking' : 'bookings'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading bookings...</div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No bookings found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-semibold text-gray-900">Resource</TableHead>
                  <TableHead className="font-semibold text-gray-900">Date & Time</TableHead>
                  <TableHead className="font-semibold text-gray-900">Location</TableHead>
                  <TableHead className="font-semibold text-gray-900">Status</TableHead>
                  <TableHead className="font-semibold text-gray-900">Checked In</TableHead>
                  <TableHead className="font-semibold text-gray-900 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow 
                    key={booking.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => onViewDetails(booking)}
                  >
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{booking.resource?.name || 'Unknown'}</div>
                        <div className="text-sm text-gray-500 capitalize">
                          {booking.resource?.resource_type?.replace('_', ' ') || '-'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="w-3 h-3" />
                          {new Date(booking.start_time).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Clock className="w-3 h-3" />
                          {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(booking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        {booking.resource?.location || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getStatusBadge(booking.status)}>
                        {booking.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {booking.checked_in_at ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm">Yes</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-gray-400">
                          <XCircle className="w-4 h-4" />
                          <span className="text-sm">No</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onViewDetails(booking)
                          }}
                          className="border-gray-300"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={openView} onOpenChange={setOpenView}>
        <DialogContent className="bg-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">Booking Details</DialogTitle>
            <DialogDescription>Complete information about your booking</DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4 mt-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Resource</div>
                    <div className="font-medium text-gray-900">{selectedBooking.resource?.name}</div>
                    <div className="text-sm text-gray-600 capitalize">
                      {selectedBooking.resource?.resource_type?.replace('_', ' ')}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Status</div>
                    <Badge variant="secondary" className={getStatusBadge(selectedBooking.status)}>
                      {selectedBooking.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Start Time</div>
                    <div className="text-sm text-gray-900">{new Date(selectedBooking.start_time).toLocaleString()}</div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">End Time</div>
                    <div className="text-sm text-gray-900">{new Date(selectedBooking.end_time).toLocaleString()}</div>
                  </div>

                  {selectedBooking.resource?.location && (
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Location</div>
                      <div className="text-sm text-gray-900">{selectedBooking.resource.location}</div>
                    </div>
                  )}

                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Checked In</div>
                    {selectedBooking.checked_in_at ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">{new Date(selectedBooking.checked_in_at).toLocaleString()}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-500">
                        <XCircle className="w-4 h-4" />
                        <span className="text-sm">Not checked in</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedBooking.admin_note && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Admin Note</div>
                    <div className="bg-white p-3 rounded border border-gray-200 text-sm text-gray-900">
                      {selectedBooking.admin_note}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Booked On</div>
                    <div className="text-sm text-gray-900">{new Date(selectedBooking.created_at).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default BookingHistory