import React, { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Calendar, Clock, CheckCircle, XCircle, MapPin, LogIn, Trash2 } from 'lucide-react'
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
  status: string
  employee_id?: string
  employee_name?: string
  resource_name?: string
  checked_in_at?: string | null
  admin_note?: string | null
  created_at: string
  resource?: { id: number; name: string; resource_type: string; location?: string }
}

type FilterStatus = 'all' | 'active' | 'past'

const statusConfig: Record<string, { color: string }> = {
  pending:    { color: 'bg-amber-50 text-amber-700 border-amber-200' },
  approved:   { color: 'bg-blue-50 text-blue-700 border-blue-200' },
  rejected:   { color: 'bg-red-50 text-red-700 border-red-200' },
  checked_in: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  completed:  { color: 'bg-violet-50 text-violet-700 border-violet-200' },
  cancelled:  { color: 'bg-neutral-100 text-neutral-500 border-neutral-200' },
}

const defaultColor = 'bg-neutral-100 text-neutral-500 border-neutral-200'

function getStatusColor(status: string) {
  return statusConfig[status]?.color || defaultColor
}

function getResourceName(b: Booking) {
  return b.resource_name || b.resource?.name || 'Unknown Resource'
}

function getResourceLocation(b: Booking) {
  return b.resource?.location || ''
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

  useEffect(() => { fetchBookings() }, [])

  const filteredBookings = bookings.filter(b => {
    if (filter === 'active') return ['pending', 'approved', 'checked_in'].includes(b.status) && dayjs(b.start_time).isAfter(dayjs())
    if (filter === 'past') return ['completed', 'rejected', 'cancelled'].includes(b.status) || dayjs(b.end_time).isBefore(dayjs())
    return true
  })

  async function handleCheckIn(booking: Booking) {
    setIsProcessing(true)
    try {
      setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: 'checked_in', checked_in_at: new Date().toISOString() } : b))
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
    return ['pending', 'approved'].includes(booking.status) && dayjs(booking.start_time).isAfter(dayjs())
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
        <h1 className="text-4xl font-bold text-neutral-900 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          My Bookings
        </h1>
        <p className="text-neutral-500">View and manage your resource bookings</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'active', 'past'] as FilterStatus[]).map(f => {
          const isActive = filter === f
          const count = f === 'all' ? bookings.length
            : f === 'active' ? bookings.filter(b => ['pending', 'approved', 'checked_in'].includes(b.status) && dayjs(b.start_time).isAfter(dayjs())).length
            : bookings.filter(b => ['completed', 'rejected', 'cancelled'].includes(b.status) || dayjs(b.end_time).isBefore(dayjs())).length
          const labels = { all: 'All', active: 'Active', past: 'Past' }
          return (
            <Button
              key={f}
              variant={isActive ? 'default' : 'outline'}
              onClick={() => setFilter(f)}
              className={isActive ? 'bg-neutral-900 text-white hover:bg-neutral-800' : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'}
            >
              {labels[f]} ({count})
            </Button>
          )
        })}
      </div>

      {/* Bookings Table */}
      <Card className="shadow-sm border-neutral-200 rounded-2xl overflow-hidden">
        <CardHeader className="bg-neutral-50 border-b border-neutral-100">
          <CardTitle className="text-neutral-900">{filteredBookings.length} Bookings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6"><TableSkeleton rows={5} columns={5} /></div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">No bookings yet</h3>
              <p className="text-neutral-500 mb-4">Start by booking a resource</p>
              <Button onClick={() => window.location.href = '/book'} className="bg-neutral-900 hover:bg-neutral-800 text-white">
                Book Resource
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-50/50">
                  <TableHead className="text-neutral-600 font-semibold">Resource</TableHead>
                  <TableHead className="text-neutral-600 font-semibold">Date & Time</TableHead>
                  <TableHead className="text-neutral-600 font-semibold">Status</TableHead>
                  <TableHead className="text-right text-neutral-600 font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow
                    key={booking.id}
                    className="cursor-pointer hover:bg-neutral-50 transition-colors"
                    onClick={() => handleRowClick(booking)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-neutral-100 border border-neutral-200 rounded-xl flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-neutral-500" />
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900">{getResourceName(booking)}</p>
                          {getResourceLocation(booking) && <p className="text-sm text-neutral-500">{getResourceLocation(booking)}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="w-3 h-3 text-neutral-400" />
                          <span className="font-medium">{dayjs(booking.start_time).format('MMM D, YYYY')}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-neutral-500">
                          <Clock className="w-3 h-3 text-neutral-400" />
                          {dayjs(booking.start_time).format('h:mm A')} – {dayjs(booking.end_time).format('h:mm A')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(booking.status)} border`}>
                        {booking.status.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {canCheckIn(booking) && (
                          <Button
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); setSelectedBooking(booking); setOpenCheckIn(true) }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <LogIn className="w-4 h-4 mr-1" /> Check In
                          </Button>
                        )}
                        {canCancel(booking) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => { e.stopPropagation(); setSelectedBooking(booking); setOpenCancel(true) }}
                            className="border-red-200 text-red-600 hover:bg-red-50"
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
        <DialogContent className="bg-white border border-neutral-200 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-neutral-900">Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4 mt-4">
              <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100">
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Resource</p>
                <p className="font-semibold text-neutral-900 text-lg">{getResourceName(selectedBooking)}</p>
                {getResourceLocation(selectedBooking) && (
                  <p className="text-sm text-neutral-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" /> {getResourceLocation(selectedBooking)}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-neutral-500 mb-1">Date</p>
                  <p className="font-medium text-neutral-900">{dayjs(selectedBooking.start_time).format('MMMM D, YYYY')}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500 mb-1">Time</p>
                  <p className="font-medium text-neutral-900">
                    {dayjs(selectedBooking.start_time).format('h:mm A')} – {dayjs(selectedBooking.end_time).format('h:mm A')}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-neutral-500 mb-1">Status</p>
                <Badge className={`${getStatusColor(selectedBooking.status)} border`}>
                  {selectedBooking.status.replace(/_/g, ' ')}
                </Badge>
              </div>

              {selectedBooking.admin_note && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-sm font-medium text-amber-900 mb-1">Admin Note</p>
                  <p className="text-sm text-amber-800">{selectedBooking.admin_note}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                {canCheckIn(selectedBooking) && (
                  <Button onClick={() => { setOpenView(false); setOpenCheckIn(true) }} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                    <LogIn className="w-4 h-4 mr-2" /> Check In
                  </Button>
                )}
                {canCancel(selectedBooking) && (
                  <Button variant="outline" onClick={() => { setOpenView(false); setOpenCancel(true) }} className="flex-1 border-red-200 text-red-600 hover:bg-red-50">
                    Cancel Booking
                  </Button>
                )}
                <Button variant="outline" onClick={() => setOpenView(false)} className="flex-1 border-neutral-200">Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Check-In Confirmation */}
      <AlertDialog open={openCheckIn} onOpenChange={setOpenCheckIn}>
        <AlertDialogContent className="bg-white border border-neutral-200 shadow-2xl rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-emerald-700">Check In</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-500">Are you sure you want to check in to this booking?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing} className="border-neutral-200">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedBooking && handleCheckIn(selectedBooking)}
              disabled={isProcessing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isProcessing ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Checking In...</> : 'Check In'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Confirmation */}
      <AlertDialog open={openCancel} onOpenChange={setOpenCancel}>
        <AlertDialogContent className="bg-white border border-neutral-200 shadow-2xl rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700">Cancel Booking</AlertDialogTitle>
            <AlertDialogDescription className="text-neutral-500">Are you sure you want to cancel this booking? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing} className="border-neutral-200">No, Keep It</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedBooking && handleCancel(selectedBooking)}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isProcessing ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Cancelling...</> : 'Yes, Cancel'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default BookingHistory