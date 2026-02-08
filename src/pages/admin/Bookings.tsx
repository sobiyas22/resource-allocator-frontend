import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '../../lib/api'
import { bookingApprovalSchema, BookingApprovalFormValues } from '../../utils/validators'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  User, 
  MapPin,
  Trash2,
  Filter
} from 'lucide-react'
import { toast } from 'sonner'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { TableSkeleton } from '../../components/TableSkeleton'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import dayjs from 'dayjs'

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
  resource?: {
    id: number
    name: string
    resource_type: string
    location?: string
  }
  user?: {
    id: number
    name: string
    email: string
    employee_id?: string
  }
}

interface BookingsResponse {
  bookings: Booking[]
  total: number
  limit: number
  offset: number
  has_more: boolean
}

type BookingStatus = 'all' | 'pending' | 'approved' | 'checked_in' | 'completed' | 'rejected' | 'cancelled'

const statusConfig = {
  all: { label: 'All Bookings', color: 'bg-gray-100 text-gray-700 border-gray-300', icon: Filter },
  pending: { label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-300', icon: Clock },
  approved: { label: 'Approved', color: 'bg-indigo-50 text-indigo-700 border-indigo-300', icon: CheckCircle },
  checked_in: { label: 'Checked In', color: 'bg-emerald-50 text-emerald-700 border-emerald-300', icon: CheckCircle },
  completed: { label: 'Completed', color: 'bg-purple-50 text-purple-700 border-purple-300', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-rose-50 text-rose-700 border-rose-300', icon: XCircle },
  cancelled: { label: 'Cancelled', color: 'bg-gray-50 text-gray-600 border-gray-300', icon: XCircle },
}

const Bookings: React.FC = () => {
  const [openView, setOpenView] = useState(false)
  const [openApprove, setOpenApprove] = useState(false)
  const [openReject, setOpenReject] = useState(false)
  const [openDelete, setOpenDelete] = useState(false)

  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [activeStatus, setActiveStatus] = useState<BookingStatus>('all')
  const [isProcessing, setIsProcessing] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<BookingApprovalFormValues>({
    resolver: zodResolver(bookingApprovalSchema)
  })

  useKeyboardShortcuts([
    {
      key: 'Escape',
      callback: () => {
        if (openView) setOpenView(false)
        if (openApprove) setOpenApprove(false)
        if (openReject) setOpenReject(false)
        if (openDelete) setOpenDelete(false)
      }
    }
  ])

  async function fetchBookings() {
    setLoading(true)
    try {
      const res = await api.get<BookingsResponse>('/bookings')
      setBookings(res.bookings || [])
    } catch (err: any) {
      console.error('Failed to fetch bookings:', err)
      toast.error('Failed to fetch bookings')
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  const filteredBookings = activeStatus === 'all' 
    ? bookings 
    : bookings.filter(b => b.status === activeStatus)

  async function handleApprove(values: BookingApprovalFormValues) {
    if (!selectedBooking) return

    setIsProcessing(true)
    try {
      // Optimistic update
      setBookings(prev => prev.map(b => 
        b.id === selectedBooking.id 
          ? { ...b, status: 'approved', admin_note: values.admin_note }
          : b
      ))
      setOpenApprove(false)
      reset()
      toast.success('Approving booking...')

      await api.patch(`/bookings/${selectedBooking.id}`, {
        status: 'approved',
        admin_note: values.admin_note
      })
      
      await fetchBookings()
      toast.success('Booking approved successfully!')
    } catch (err: any) {
      await fetchBookings()
      toast.error(err.message || 'Failed to approve booking')
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleReject(values: BookingApprovalFormValues) {
    if (!selectedBooking) return

    setIsProcessing(true)
    try {
      setBookings(prev => prev.map(b => 
        b.id === selectedBooking.id 
          ? { ...b, status: 'rejected', admin_note: values.admin_note }
          : b
      ))
      setOpenReject(false)
      reset()
      toast.success('Rejecting booking...')

      await api.patch(`/bookings/${selectedBooking.id}`, {
        status: 'rejected',
        admin_note: values.admin_note
      })
      
      await fetchBookings()
      toast.success('Booking rejected!')
    } catch (err: any) {
      await fetchBookings()
      toast.error(err.message || 'Failed to reject booking')
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleDelete() {
    if (!selectedBooking) return

    setIsProcessing(true)
    try {
      setBookings(prev => prev.filter(b => b.id !== selectedBooking.id))
      setOpenDelete(false)
      toast.success('Deleting booking...')

      await api.del(`/bookings/${selectedBooking.id}`)
      toast.success('Booking deleted!')
    } catch (err: any) {
      await fetchBookings()
      toast.error(err.message || 'Failed to delete booking')
    } finally {
      setIsProcessing(false)
    }
  }

  function handleRowClick(booking: Booking) {
    setSelectedBooking(booking)
    setOpenView(true)
  }

  return (
    <div className="max-w-7xl">
      <Breadcrumbs 
        items={[
          { label: 'Admin Dashboard', href: '/dashboard/admin' },
          { label: 'Bookings Management' }
        ]} 
      />

      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          Bookings Management
        </h1>
        <p className="text-gray-600">
          Review and manage resource booking requests
        </p>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {(Object.keys(statusConfig) as BookingStatus[]).map((status) => {
          const config = statusConfig[status]
          const count = status === 'all' ? bookings.length : bookings.filter(b => b.status === status).length
          const Icon = config.icon
          const isActive = activeStatus === status

          return (
            <Button
              key={status}
              variant={isActive ? "default" : "outline"}
              onClick={() => setActiveStatus(status)}
              className={`flex items-center gap-2 whitespace-nowrap transition-all ${
                isActive 
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg' 
                  : 'hover:bg-indigo-50 hover:border-indigo-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {config.label}
              <Badge variant="secondary" className={`${isActive ? 'bg-white/20 text-white' : ''}`}>
                {count}
              </Badge>
            </Button>
          )
        })}
      </div>

      {/* Bookings Table */}
      <Card className="shadow-lg border-gray-200">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
          <CardTitle className="text-xl text-gray-900">
            {filteredBookings.length} {statusConfig[activeStatus].label}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6">
              <TableSkeleton rows={5} columns={6} />
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-10 h-10 text-indigo-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No {statusConfig[activeStatus].label.toLowerCase()} bookings
              </h3>
              <p className="text-gray-600">
                {activeStatus === 'pending' 
                  ? 'All caught up! No pending approvals.'
                  : `No bookings with status: ${statusConfig[activeStatus].label}`
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Resource</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
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
                      <div className="flex items-start gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{booking.resource?.name}</p>
                          <p className="text-sm text-gray-500">{booking.resource?.location}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                          {booking.user?.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{booking.user?.name}</p>
                          <p className="text-xs text-gray-500">{booking.user?.employee_id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {dayjs(booking.start_time).format('MMM D, YYYY')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {dayjs(booking.start_time).format('h:mm A')} - {dayjs(booking.end_time).format('h:mm A')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statusConfig[booking.status]?.color || statusConfig.all.color} border`}>
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {dayjs(booking.created_at).format('MMM D, h:mm A')}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {booking.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedBooking(booking)
                                setOpenApprove(true)
                              }}
                              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedBooking(booking)
                                setOpenReject(true)
                              }}
                              className="border-rose-300 text-rose-600 hover:bg-rose-50"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedBooking(booking)
                            setOpenDelete(true)
                          }}
                          className="text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
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
        <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Booking Details
            </DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-600 text-sm">Resource</Label>
                  <div className="bg-indigo-50 rounded-lg p-3">
                    <p className="font-semibold text-gray-900">{selectedBooking.resource?.name}</p>
                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {selectedBooking.resource?.location}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-600 text-sm">Employee</Label>
                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="font-semibold text-gray-900">{selectedBooking.user?.name}</p>
                    <p className="text-sm text-gray-600">{selectedBooking.user?.email}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-600 text-sm">Date & Time</Label>
                <div className="bg-purple-50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Date</span>
                    <span className="font-medium text-gray-900">
                      {dayjs(selectedBooking.start_time).format('MMMM D, YYYY')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Time</span>
                    <span className="font-medium text-gray-900">
                      {dayjs(selectedBooking.start_time).format('h:mm A')} - {dayjs(selectedBooking.end_time).format('h:mm A')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Duration</span>
                    <span className="font-medium text-gray-900">
                      {dayjs(selectedBooking.end_time).diff(dayjs(selectedBooking.start_time), 'minute')} minutes
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-600 text-sm">Status</Label>
                <div className="flex items-center gap-2">
                  <Badge className={`${statusConfig[selectedBooking.status]?.color || statusConfig.all.color} border text-base py-1 px-3`}>
                    {selectedBooking.status}
                  </Badge>
                  {selectedBooking.checked_in_at && (
                    <span className="text-sm text-gray-600">
                      Checked in at {dayjs(selectedBooking.checked_in_at).format('h:mm A')}
                    </span>
                  )}
                </div>
              </div>

              {selectedBooking.admin_note && (
                <div className="space-y-2">
                  <Label className="text-gray-600 text-sm">Admin Note</Label>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-gray-900">{selectedBooking.admin_note}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                {selectedBooking.status === 'pending' && (
                  <>
                    <Button
                      onClick={() => {
                        setOpenView(false)
                        setOpenApprove(true)
                      }}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setOpenView(false)
                        setOpenReject(true)
                      }}
                      className="flex-1 border-rose-300 text-rose-600 hover:bg-rose-50"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  onClick={() => setOpenView(false)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={openApprove} onOpenChange={setOpenApprove}>
        <DialogContent className="bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-xl text-emerald-600">Approve Booking</DialogTitle>
            <DialogDescription>
              Add an optional note for the employee
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleApprove)} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="admin_note">Admin Note (Optional)</Label>
              <Textarea
                id="admin_note"
                placeholder="e.g., Approved. Please arrive 5 minutes early."
                {...register('admin_note')}
                disabled={isSubmitting || isProcessing}
                rows={4}
              />
              {errors.admin_note && (
                <p className="text-sm text-red-600">{errors.admin_note.message}</p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpenApprove(false)
                  reset()
                }}
                disabled={isSubmitting || isProcessing}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isProcessing}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
              >
                {isSubmitting || isProcessing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Booking
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={openReject} onOpenChange={setOpenReject}>
        <DialogContent className="bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-xl text-rose-600">Reject Booking</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejection
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleReject)} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="admin_note_reject">Reason for Rejection *</Label>
              <Textarea
                id="admin_note_reject"
                placeholder="e.g., Resource unavailable due to maintenance"
                {...register('admin_note')}
                disabled={isSubmitting || isProcessing}
                rows={4}
              />
              {errors.admin_note && (
                <p className="text-sm text-red-600">{errors.admin_note.message}</p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpenReject(false)
                  reset()
                }}
                disabled={isSubmitting || isProcessing}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isProcessing}
                className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
              >
                {isSubmitting || isProcessing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Booking
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent className="bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-xl text-rose-600">Delete Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this booking? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setOpenDelete(false)}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isProcessing}
              className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
            >
              {isProcessing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Bookings