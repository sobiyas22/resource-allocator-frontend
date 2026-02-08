import React, { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Calendar, Clock, Eye, CheckCircle, XCircle, MapPin, LogIn, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { TableSkeleton } from '../../components/TableSkeleton'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import dayjs from 'dayjs'

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

type FilterStatus = 'all' | 'active' | 'past'

const statusConfig = {
  pending: { color: 'bg-amber-50 text-amber-700 border-amber-300' },
  approved: { color: 'bg-indigo-50 text-indigo-700 border-indigo-300' },
  rejected: { color: 'bg-rose-50 text-rose-700 border-rose-300' },
  checked_in: { color: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
  completed: { color: 'bg-purple-50 text-purple-700 border-purple-300' },
  cancelled: { color: 'bg-gray-50 text-gray-600 border-gray-300' },
}

const BookingHistory: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [openView, setOpenView] = useState(false)
  const [openCheckIn, setOpenCheckIn] = useState(false)
  const [openCancel, setOpenCancel] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  useKeyboardShortcuts([
    {
      key: 'Escape',
      callback: () => {
        if (openView) setOpenView(false)
        if (openCheckIn) setOpenCheckIn(false)
        if (openCancel) setOpenCancel(false)
      }
    }
  ])

  async function fetchBookings() {
    setLoading(true)
    try {
      const res = await api.get<{ bookings: Booking[] }>('/bookings')
      setBookings(res.bookings || [])
    } catch (err: any) {
      toast.error('Failed to load bookings')
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  const filteredBookings = bookings.filter(b => {
    if (filter === 'active') {
      return ['pending', 'approved', 'checked_in'].includes(b.status) && 
             dayjs(b.start_time).isAfter(dayjs())
    }
    if (filter === 'past') {
      return ['completed', 'rejected', 'cancelled'].includes(b.status) ||
             dayjs(b.end_time).isBefore(dayjs())
    }
    return true
  })

  async function handleCheckIn(booking: Booking) {
    setIsProcessing(true)
    try {
      setBookings(prev => prev.map(b => 
        b.id === booking.id ? { ...b, status: 'checked_in', checked_in_at: new Date().toISOString() } : b
      ))
      setOpenCheckIn(false)
      toast.success('Checking in...')

      await api.post(`/bookings/${booking.id}/check_in`)
      await fetchBookings()
      toast.success('Checked in successfully!')
    } catch (err: any) {
      await fetchBookings()
      toast.error(err.message || 'Failed to check in')
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleCancel(booking: Booking) {
    setIsProcessing(true)
    try {
      setBookings(prev => prev.filter(b => b.id !== booking.id))
      setOpenCancel(false)
      toast.success('Cancelling booking...')

      await api.del(`/bookings/${booking.id}`)
      toast.success('Booking cancelled!')
    } catch (err: any) {
      await fetchBookings()
      toast.error(err.message || 'Failed to cancel booking')
    } finally {
      setIsProcessing(false)
    }
  }

  function handleRowClick(booking: Booking) {
    setSelectedBooking(booking)
    setOpenView(true)
  }

  const canCheckIn = (booking: Booking) => {
    if (booking.status !== 'approved') return false
    const now = dayjs()
    const start = dayjs(booking.start_time)
    const minutesUntilStart = start.diff(now, 'minute')
    return minutesUntilStart <= 15 && minutesUntilStart >= -15
  }

  const canCancel = (booking: Booking) => {
    return ['pending', 'approved'].includes(booking.status) && 
           dayjs(booking.start_time).isAfter(dayjs())
  }

  return (
    <div className="max-w-7xl">
      <Breadcrumbs 
        items={[
          { label: 'Employee Dashboard', href: '/dashboard/employee' },
          { label: 'My Bookings' }
        ]} 
      />

      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          My Bookings
        </h1>
        <p className="text-gray-600">
          View and manage your resource bookings
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          className={filter === 'all' ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'hover:bg-indigo-50'}
        >
          All ({bookings.length})
        </Button>
        <Button
          variant={filter === 'active' ? 'default' : 'outline'}
          onClick={() => setFilter('active')}
          className={filter === 'active' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'hover:bg-emerald-50'}
        >
          Active ({bookings.filter(b => ['pending', 'approved', 'checked_in'].includes(b.status) && dayjs(b.start_time).isAfter(dayjs())).length})
        </Button>
        <Button
          variant={filter === 'past' ? 'default' : 'outline'}
          onClick={() => setFilter('past')}
          className={filter === 'past' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'hover:bg-purple-50'}
        >
          Past ({bookings.filter(b => ['completed', 'rejected', 'cancelled'].includes(b.status) || dayjs(b.end_time).isBefore(dayjs())).length})
        </Button>
      </div>

      {/* Bookings Table */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
          <CardTitle>
            {filteredBookings.length} Bookings
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6">
              <TableSkeleton rows={5} columns={5} />
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No bookings yet
              </h3>
              <p className="text-gray-600 mb-4">
                Start by booking a resource
              </p>
              <Button
                onClick={() => window.location.href = '/book'}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                Book Resource
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Resource</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow 
                    key={booking.id}
                    className="cursor-pointer hover:bg-indigo-50/50 transition-colors"
                    onClick={() => handleRowClick(booking)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{booking.resource?.name}</p>
                          <p className="text-sm text-gray-500">{booking.resource?.location}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="font-medium">{dayjs(booking.start_time).format('MMM D, YYYY')}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {dayjs(booking.start_time).format('h:mm A')} - {dayjs(booking.end_time).format('h:mm A')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statusConfig[booking.status].color} border`}>
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {canCheckIn(booking) && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedBooking(booking)
                              setOpenCheckIn(true)
                            }}
                            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                          >
                            <LogIn className="w-4 h-4 mr-1" />
                            Check In
                          </Button>
                        )}
                        {canCancel(booking) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedBooking(booking)
                              setOpenCancel(true)
                            }}
                            className="border-rose-300 text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={openView} onOpenChange={setOpenView}>
        <DialogContent className="bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Booking Details
            </DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4 mt-4">
              <div className="bg-indigo-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Resource</p>
                <p className="font-semibold text-gray-900 text-lg">{selectedBooking.resource?.name}</p>
                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" />
                  {selectedBooking.resource?.location}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Date</p>
                  <p className="font-medium text-gray-900">{dayjs(selectedBooking.start_time).format('MMMM D, YYYY')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Time</p>
                  <p className="font-medium text-gray-900">
                    {dayjs(selectedBooking.start_time).format('h:mm A')} - {dayjs(selectedBooking.end_time).format('h:mm A')}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Status</p>
                <Badge className={`${statusConfig[selectedBooking.status].color} border`}>
                  {selectedBooking.status}
                </Badge>
              </div>

              {selectedBooking.admin_note && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-amber-900 mb-1">Admin Note</p>
                  <p className="text-sm text-amber-800">{selectedBooking.admin_note}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                {canCheckIn(selectedBooking) && (
                  <Button
                    onClick={() => {
                      setOpenView(false)
                      setOpenCheckIn(true)
                    }}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Check In
                  </Button>
                )}
                {canCancel(selectedBooking) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setOpenView(false)
                      setOpenCancel(true)
                    }}
                    className="flex-1 border-rose-300 text-rose-600 hover:bg-rose-50"
                  >
                    Cancel Booking
                  </Button>
                )}
                <Button variant="outline" onClick={() => setOpenView(false)} className="flex-1">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Check-In Confirmation */}
      <AlertDialog open={openCheckIn} onOpenChange={setOpenCheckIn}>
        <AlertDialogContent className="bg-white/95 backdrop-blur-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-emerald-600">Check In</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to check in to this booking?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedBooking && handleCheckIn(selectedBooking)}
              disabled={isProcessing}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
            >
              {isProcessing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Checking In...
                </>
              ) : (
                'Check In'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Confirmation */}
      <AlertDialog open={openCancel} onOpenChange={setOpenCancel}>
        <AlertDialogContent className="bg-white/95 backdrop-blur-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-rose-600">Cancel Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>No, Keep It</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedBooking && handleCancel(selectedBooking)}
              disabled={isProcessing}
              className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
            >
              {isProcessing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Cancelling...
                </>
              ) : (
                'Yes, Cancel'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default BookingHistory