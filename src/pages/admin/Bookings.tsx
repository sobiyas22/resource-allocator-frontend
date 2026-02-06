import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '../../lib/api'
import { bookingApprovalSchema, BookingApprovalFormValues } from '../../utils/validators'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Clock, CheckCircle, XCircle, Eye, Calendar, User, AlertTriangle, Trash2 } from 'lucide-react'

interface Booking {
  id: number
  resource_id: number
  user_id: number
  start_time: string
  end_time: string
  status: 'pending' | 'approved' | 'rejected' | 'checked_in' | 'completed' | 'cancelled'
  checked_in_at?: string | null
  admin_note?: string | null
  created_at: string
  updated_at: string
  // Populated fields from relations
  resource?: {
    id: number
    name: string
    resource_type: string
    location?: string
  }
  resource_name?: string
  employee_name?: string
  employee_id?: string
}
interface BookingsResponse {
  bookings: Booking[]
  total: number
  limit: number
  offset: number
  has_more: boolean
}

type BookingStatus = 'all' | 'pending' | 'approved' | 'checked_in' | 'completed' | 'rejected' | 'cancelled'

const statusTabs = [
  { status: 'all' as const, label: 'All Bookings', color: 'gray' },
  { status: 'pending' as const, label: 'Pending', color: 'yellow' },
  { status: 'approved' as const, label: 'Approved', color: 'blue' },
  { status: 'checked_in' as const, label: 'Checked In', color: 'green' },
  { status: 'completed' as const, label: 'Completed', color: 'purple' },
  { status: 'rejected' as const, label: 'Rejected', color: 'red' },
]

const Bookings: React.FC = () => {
  const [openView, setOpenView] = useState(false)
  const [openApprove, setOpenApprove] = useState(false)
  const [openReject, setOpenReject] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<BookingStatus>('pending')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)

  const { register: registerApprove, handleSubmit: handleSubmitApprove, reset: resetApprove, formState: { errors: errorsApprove, isSubmitting: isApprovingSubmitting } } = useForm<BookingApprovalFormValues>({
    resolver: zodResolver(bookingApprovalSchema),
    defaultValues: { status: 'approved' }
  })

  const { register: registerReject, handleSubmit: handleSubmitReject, reset: resetReject, formState: { errors: errorsReject, isSubmitting: isRejectingSubmitting } } = useForm<BookingApprovalFormValues>({
    resolver: zodResolver(bookingApprovalSchema),
    defaultValues: { status: 'rejected' }
  })

  async function fetchBookings() {
    setLoading(true)
    try {
      let allBookings: Booking[] = []
      let offset = 0
      const limit = 50
      let hasMore = true

      while (hasMore) {
        const res = await api.get<BookingsResponse>(`/bookings?limit=${limit}&offset=${offset}`)
        
        if (res.bookings && Array.isArray(res.bookings)) {
          allBookings = [...allBookings, ...res.bookings]
          hasMore = res.has_more || false
          offset += limit
        } else {
          hasMore = false
        }
      }

      setBookings(allBookings)
    } catch (err: any) {
      console.error('Failed to fetch bookings:', err)
      setBookings([])
      setMessage({ type: 'error', text: 'Failed to fetch bookings' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  async function onApprove(values: BookingApprovalFormValues) {
    if (!selectedBooking) return
    setMessage(null)
    try {
      await api.patch(`/bookings/${selectedBooking.id}`, {
        status: 'approved',
        admin_note: values.admin_note || ''
      })
      setMessage({ type: 'success', text: 'Booking approved successfully!' })
      setOpenApprove(false)
      resetApprove()
      fetchBookings()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to approve booking' })
    }
  }

  async function onReject(values: BookingApprovalFormValues) {
    if (!selectedBooking) return
    setMessage(null)
    try {
      await api.patch(`/bookings/${selectedBooking.id}`, {
        status: 'rejected',
        admin_note: values.admin_note || ''
      })
      setMessage({ type: 'success', text: 'Booking rejected successfully!' })
      setOpenReject(false)
      resetReject()
      fetchBookings()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to reject booking' })
    }
  }

  async function onCheckIn(booking: Booking) {
    if (!confirm(`Check in ${booking.employee_name} for ${booking.resource?.name}?`)) return
    
    setMessage(null)
    try {
      await api.post(`/bookings/${booking.id}/check_in`, {})
      setMessage({ type: 'success', text: 'Checked in successfully!' })
      fetchBookings()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to check in' })
    }
  }

  async function onReleaseExpired() {
    if (!confirm('Release all expired un-checked-in bookings?')) return
    
    setMessage(null)
    try {
      await api.post('/bookings/release_expired', {})
      setMessage({ type: 'success', text: 'Expired bookings released successfully!' })
      fetchBookings()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to release expired bookings' })
    }
  }

  async function onDelete(booking: Booking) {
    if (!confirm(`Delete booking for ${booking.employee_name}?`)) return
    
    setMessage(null)
    try {
      await api.del(`/bookings/${booking.id}`)
      setMessage({ type: 'success', text: 'Booking deleted successfully!' })
      setOpenView(false)
      fetchBookings()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete booking' })
    }
  }

  async function onViewDetails(booking: Booking) {
    try {
      const res = await api.get<Booking>(`/bookings/${booking.id}`)
      setSelectedBooking(res)
      setOpenView(true)
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Failed to fetch booking details' })
    }
  }

  const filteredBookings = activeTab === 'all' 
    ? bookings 
    : bookings.filter(b => b.status === activeTab)

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

  const getBookingCount = (status: BookingStatus) => {
    if (status === 'all') return bookings.length
    return bookings.filter(b => b.status === status).length
  }

  const isExpired = (booking: Booking) => {
    return new Date(booking.start_time) < new Date() && booking.status === 'approved' && !booking.checked_in_at
  }

  return (
    <div className="max-w-7xl">
      {/* Header Section */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            Booking Management
          </h1>
          <p className="text-gray-600">Manage and approve resource booking requests</p>
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={onReleaseExpired}
            variant="outline"
            className="border-orange-300 text-orange-600 hover:bg-orange-50"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Release Expired
          </Button>
          <Button className="bg-gray-900 hover:bg-gray-800 text-white">
            <Calendar className="w-4 h-4 mr-2" />
            New Booking
          </Button>
        </div>
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

      {/* Tabs and Table Card */}
      <Card className="border-gray-200 shadow-lg">
        <CardHeader className="border-b border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            {/* Status Tabs */}
            <div className="flex gap-2 flex-wrap">
              {statusTabs.map((tab) => {
                const isActive = activeTab === tab.status
                const count = getBookingCount(tab.status)

                return (
                  <button
                    key={tab.status}
                    onClick={() => setActiveTab(tab.status)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      isActive
                        ? 'bg-gray-900 text-white shadow-md'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="font-medium">{tab.label}</span>
                    <Badge 
                      variant="secondary" 
                      className={`${
                        isActive ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {count}
                    </Badge>
                  </button>
                )
              })}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading bookings...</div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No bookings found</p>
              <p className="text-sm text-gray-400 mt-1">
                {activeTab === 'pending' ? 'No pending approval requests' : 'No bookings in this category'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="font-semibold text-gray-900">Employee</TableHead>
                    <TableHead className="font-semibold text-gray-900">Resource</TableHead>
                    <TableHead className="font-semibold text-gray-900">Start Time</TableHead>
                    <TableHead className="font-semibold text-gray-900">End Time</TableHead>
                    <TableHead className="font-semibold text-gray-900">Status</TableHead>
                    <TableHead className="font-semibold text-gray-900">Checked In</TableHead>
                    <TableHead className="font-semibold text-gray-900 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => (
                    <TableRow 
                      key={booking.id} 
                      className={`hover:bg-gray-50 ${isExpired(booking) ? 'bg-orange-50' : ''}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <div>
                            <div className="font-medium text-gray-900">{booking?.employee_name|| 'Unknown'}</div>
                            <div className="text-sm text-gray-500">{booking?.employee_id || '-'}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{booking?.resource_name || 'Unknown'}</div>
                          {/* <div className="text-sm text-gray-500 capitalize">
                            {booking?.resource_type?.replace('_', ' ') || '-'}
                          </div> */}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(booking.start_time).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(booking.end_time).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={getStatusBadge(booking.status)}>
                          {booking.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        {isExpired(booking) && (
                          <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-800">
                            EXPIRED
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {booking.checked_in_at ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm">
                              {new Date(booking.checked_in_at).toLocaleTimeString()}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-gray-400">
                            <XCircle className="w-4 h-4" />
                            <span className="text-sm">Not checked in</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewDetails(booking)}
                            className="border-gray-300"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={openView} onOpenChange={setOpenView}>
        <DialogContent className="bg-white max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">Booking Details</DialogTitle>
            <DialogDescription>Complete information about this booking</DialogDescription>
          </DialogHeader>

          {selectedBooking ? (
            <div className="space-y-6 mt-4">
              <div className="bg-gray-50 p-6 rounded-lg space-y-6">
                {/* Employee & Resource Info */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Employee</div>
                      <div className="font-medium text-gray-900 text-lg">{selectedBooking?.employee_name || 'Unknown'}</div>
                      <div className="text-sm text-gray-600">{ '-'}</div>
                      <div className="text-sm text-gray-600">ID: {selectedBooking?.employee_id || '-'}</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Resource</div>
                      <div className="font-medium text-gray-900 text-lg">{selectedBooking?.resource_name || 'Unknown'}</div>
                      <div className="text-sm text-gray-600 capitalize">
                        {selectedBooking.resource?.resource_type?.replace('_', ' ') || '-'}
                      </div>
                      {selectedBooking.resource?.location && (
                        <div className="text-sm text-gray-600">📍 {selectedBooking.resource.location}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Booking Times */}
                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-200">
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Start Time</div>
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(selectedBooking.start_time).toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">End Time</div>
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(selectedBooking.end_time).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Status Info */}
                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-200">
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Status</div>
                    <Badge variant="secondary" className={getStatusBadge(selectedBooking.status)}>
                      {selectedBooking.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Checked In</div>
                    {selectedBooking.checked_in_at ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {new Date(selectedBooking.checked_in_at).toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-500">
                        <XCircle className="w-4 h-4" />
                        <span className="text-sm">Not checked in</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Admin Note */}
                {selectedBooking.admin_note && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Admin Note</div>
                    <div className="bg-white p-3 rounded border border-gray-200 text-sm text-gray-900">
                      {selectedBooking.admin_note}
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-200">
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Created At</div>
                    <div className="text-sm text-gray-900">
                      {new Date(selectedBooking.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Updated At</div>
                    <div className="text-sm text-gray-900">
                      {new Date(selectedBooking.updated_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {selectedBooking.status === 'pending' && (
                  <div className="flex gap-3">
                    <Button
                      onClick={() => {
                        setOpenApprove(true)
                        setOpenView(false)
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Booking
                    </Button>
                    <Button
                      onClick={() => {
                        setOpenReject(true)
                        setOpenView(false)
                      }}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject Booking
                    </Button>
                  </div>
                )}

                {selectedBooking.status === 'approved' && !selectedBooking.checked_in_at && (
                  <Button
                    onClick={() => onCheckIn(selectedBooking)}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Check In
                  </Button>
                )}

                <Button
                  onClick={() => onDelete(selectedBooking)}
                  variant="outline"
                  className="w-full border-red-300 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Booking
                </Button>
              </div>
            </div>
          ) : (
            <div>Loading...</div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={openApprove} onOpenChange={setOpenApprove}>
        <DialogContent className="bg-white sm:max-w-[125">
          <DialogHeader>
            <DialogTitle className="text-2xl">Approve Booking</DialogTitle>
            <DialogDescription>
              Approve the booking request for {selectedBooking?.employee_name}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitApprove(onApprove)} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="admin_note_approve">Admin Note (Optional)</Label>
              <Textarea
                id="admin_note_approve"
                {...registerApprove('admin_note')}
                placeholder="Add any notes or instructions..."
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenApprove(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isApprovingSubmitting}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isApprovingSubmitting ? 'Approving...' : 'Approve Booking'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={openReject} onOpenChange={setOpenReject}>
        <DialogContent className="bg-white sm:max-w-125">
          <DialogHeader>
            <DialogTitle className="text-2xl text-red-600">Reject Booking</DialogTitle>
            <DialogDescription>
              Reject the booking request for {selectedBooking?.employee_name}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitReject(onReject)} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="admin_note_reject">Reason for Rejection (Optional)</Label>
              <Textarea
                id="admin_note_reject"
                {...registerReject('admin_note')}
                placeholder="Explain why this booking is being rejected..."
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenReject(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isRejectingSubmitting}
                variant="destructive"
                className="flex-1"
              >
                {isRejectingSubmitting ? 'Rejecting...' : 'Reject Booking'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Bookings