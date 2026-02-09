import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '../../lib/api'
import { bookingApprovalSchema, BookingApprovalFormValues } from '../../utils/validators'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Clock, CheckCircle, XCircle, Calendar, User, MapPin, Trash2, Filter
} from 'lucide-react'
import { toast } from 'sonner'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { TableSkeleton } from '../../components/TableSkeleton'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import dayjs from 'dayjs'

// Matches the ACTUAL API response shape from GET /bookings
interface Booking {
  id: number
  resource_id: number
  user_id: number
  start_time: string
  end_time: string
  status: string
  employee_id?: string
  employee_name?: string
  resource_name?: string
  approved_at?: string | null
  cancelled_at?: string | null
  checked_in_at?: string | null
  admin_note?: string | null
  created_at: string
  updated_at: string
  // Legacy nested shape (kept for backward compat)
  resource?: { id: number; name: string; resource_type: string; location?: string }
  user?: { id: number; name: string; email: string; employee_id?: string }
}

interface BookingsResponse {
  bookings: Booking[]
  total: number
  limit: number
  offset: number
  has_more: boolean
}

type BookingStatus = 'all' | 'pending' | 'approved' | 'checked_in' | 'completed' | 'rejected' | 'cancelled'

const statusConfig: Record<string, { label: string; color: string; icon: React.FC<any> }> = {
  all:        { label: 'All Bookings', color: 'bg-neutral-100 text-neutral-700 border-neutral-300', icon: Filter },
  pending:    { label: 'Pending',      color: 'bg-amber-50 text-amber-700 border-amber-200',       icon: Clock },
  approved:   { label: 'Approved',     color: 'bg-blue-50 text-blue-700 border-blue-200',          icon: CheckCircle },
  checked_in: { label: 'Checked In',   color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
  completed:  { label: 'Completed',    color: 'bg-violet-50 text-violet-700 border-violet-200',    icon: CheckCircle },
  rejected:   { label: 'Rejected',     color: 'bg-red-50 text-red-700 border-red-200',             icon: XCircle },
  cancelled:  { label: 'Cancelled',    color: 'bg-neutral-100 text-neutral-500 border-neutral-200', icon: XCircle },
}

const defaultStatusStyle = { label: 'Unknown', color: 'bg-neutral-100 text-neutral-500 border-neutral-200', icon: Filter }

function getStatusConfig(status: string) {
  return statusConfig[status] || defaultStatusStyle
}

// Helper to safely extract display fields from either flat or nested booking
function getBookingDisplay(b: Booking) {
  return {
    resourceName: b.resource_name || b.resource?.name || 'Unknown Resource',
    employeeName: b.employee_name || b.user?.name || 'Unknown',
    employeeId: b.employee_id || b.user?.employee_id || '',
    employeeEmail: b.user?.email || '',
    resourceLocation: b.resource?.location || '',
    employeeInitial: (b.employee_name || b.user?.name || 'U').charAt(0).toUpperCase(),
  }
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

  useEffect(() => { fetchBookings() }, [])

  const filteredBookings = activeStatus === 'all'
    ? bookings
    : bookings.filter(b => b.status === activeStatus)

  async function handleApprove(values: BookingApprovalFormValues) {
    if (!selectedBooking) return
    setIsProcessing(true)
    try {
      setBookings(prev => prev.map(b =>
        b.id === selectedBooking.id ? { ...b, status: 'approved', admin_note: values.admin_note } : b
      ))
      setOpenApprove(false)
      reset()
      toast.success('Approving booking...')
      await api.patch(`/bookings/${selectedBooking.id}`, { status: 'approved', admin_note: values.admin_note })
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
        b.id === selectedBooking.id ? { ...b, status: 'rejected', admin_note: values.admin_note } : b
      ))
      setOpenReject(false)
      reset()
      toast.success('Rejecting booking...')
      await api.patch(`/bookings/${selectedBooking.id}`, { status: 'rejected', admin_note: values.admin_note })
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
        <h1 className="text-4xl font-bold text-neutral-900 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          Bookings Management
        </h1>
        <p className="text-neutral-500">Review and manage resource booking requests</p>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {(Object.keys(statusConfig) as BookingStatus[]).map((status) => {
          const config = getStatusConfig(status)
          const count = status === 'all' ? bookings.length : bookings.filter(b => b.status === status).length
          const Icon = config.icon
          const isActive = activeStatus === status

          return (
            <Button
              key={status}
              variant={isActive ? 'default' : 'outline'}
              onClick={() => setActiveStatus(status)}
              className={`flex items-center gap-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-neutral-900 text-white hover:bg-neutral-800 shadow-md'
                  : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {config.label}
              <Badge variant="secondary" className={`${isActive ? 'bg-white/20 text-white' : 'bg-neutral-100'}`}>
                {count}
              </Badge>
            </Button>
          )
        })}
      </div>

      {/* Bookings Table */}
      <Card className="shadow-sm border-neutral-200 rounded-2xl overflow-hidden">
        <CardHeader className="bg-neutral-50 border-b border-neutral-100">
          <CardTitle className="text-lg text-neutral-900">
            {filteredBookings.length} {getStatusConfig(activeStatus).label}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6"><TableSkeleton rows={5} columns={6} /></div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-10 h-10 text-neutral-400" />
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                No {getStatusConfig(activeStatus).label.toLowerCase()} bookings
              </h3>
              <p className="text-neutral-500">
                {activeStatus === 'pending'
                  ? 'All caught up! No pending approvals.'
                  : `No bookings with status: ${getStatusConfig(activeStatus).label}`}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-50/50">
                  <TableHead className="text-neutral-600 font-semibold">Resource</TableHead>
                  <TableHead className="text-neutral-600 font-semibold">Employee</TableHead>
                  <TableHead className="text-neutral-600 font-semibold">Date & Time</TableHead>
                  <TableHead className="text-neutral-600 font-semibold">Status</TableHead>
                  <TableHead className="text-neutral-600 font-semibold">Created</TableHead>
                  <TableHead className="text-right text-neutral-600 font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => {
                  const display = getBookingDisplay(booking)
                  const style = getStatusConfig(booking.status)

                  return (
                    <TableRow
                      key={booking.id}
                      className="cursor-pointer hover:bg-neutral-50 transition-colors"
                      onClick={() => handleRowClick(booking)}
                    >
                      <TableCell>
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-neutral-100 border border-neutral-200 rounded-xl flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-5 h-5 text-neutral-500" />
                          </div>
                          <div>
                            <p className="font-medium text-neutral-900">{display.resourceName}</p>
                            {display.resourceLocation && (
                              <p className="text-sm text-neutral-500">{display.resourceLocation}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-neutral-900 rounded-full flex items-center justify-center text-white font-medium text-sm">
                            {display.employeeInitial}
                          </div>
                          <div>
                            <p className="font-medium text-neutral-900">{display.employeeName}</p>
                            <p className="text-xs text-neutral-500">{display.employeeId}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="w-3 h-3 text-neutral-400" />
                            <span className="font-medium text-neutral-900">
                              {dayjs(booking.start_time).format('MMM D, YYYY')}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-neutral-500">
                            <Clock className="w-3 h-3 text-neutral-400" />
                            {dayjs(booking.start_time).format('h:mm A')} – {dayjs(booking.end_time).format('h:mm A')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${style.color} border`}>
                          {booking.status.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-neutral-500">
                        {dayjs(booking.created_at).format('MMM D, h:mm A')}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {booking.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); setSelectedBooking(booking); setOpenApprove(true) }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => { e.stopPropagation(); setSelectedBooking(booking); setOpenReject(true) }}
                                className="border-red-200 text-red-600 hover:bg-red-50"
                              >
                                <XCircle className="w-4 h-4 mr-1" /> Reject
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => { e.stopPropagation(); setSelectedBooking(booking); setOpenDelete(true) }}
                            className="text-neutral-500 hover:text-red-600 hover:bg-neutral-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={openView} onOpenChange={setOpenView}>
        <DialogContent className="max-w-2xl bg-white border border-neutral-200 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-neutral-900">
              Booking Details
            </DialogTitle>
          </DialogHeader>
          {selectedBooking && (() => {
            const display = getBookingDisplay(selectedBooking)
            const style = getStatusConfig(selectedBooking.status)
            return (
              <div className="space-y-5 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100">
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Resource</p>
                    <p className="font-semibold text-neutral-900 text-lg">{display.resourceName}</p>
                    {display.resourceLocation && (
                      <p className="text-sm text-neutral-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" /> {display.resourceLocation}
                      </p>
                    )}
                  </div>
                  <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100">
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Employee</p>
                    <p className="font-semibold text-neutral-900 text-lg">{display.employeeName}</p>
                    <p className="text-sm text-neutral-500">{display.employeeId}</p>
                  </div>
                </div>

                <div className="bg-neutral-50 rounded-xl p-4 space-y-2 border border-neutral-100">
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Schedule</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">Date</span>
                    <span className="font-medium text-neutral-900">{dayjs(selectedBooking.start_time).format('MMMM D, YYYY')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">Time</span>
                    <span className="font-medium text-neutral-900">
                      {dayjs(selectedBooking.start_time).format('h:mm A')} – {dayjs(selectedBooking.end_time).format('h:mm A')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600">Duration</span>
                    <span className="font-medium text-neutral-900">
                      {dayjs(selectedBooking.end_time).diff(dayjs(selectedBooking.start_time), 'minute')} min
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-neutral-600">Status</span>
                  <Badge className={`${style.color} border text-sm py-1 px-3`}>
                    {selectedBooking.status.replace(/_/g, ' ')}
                  </Badge>
                  {selectedBooking.checked_in_at && (
                    <span className="text-sm text-neutral-500">
                      Checked in at {dayjs(selectedBooking.checked_in_at).format('h:mm A')}
                    </span>
                  )}
                </div>

                {selectedBooking.admin_note && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-sm font-medium text-amber-900 mb-1">Admin Note</p>
                    <p className="text-sm text-amber-800">{selectedBooking.admin_note}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  {selectedBooking.status === 'pending' && (
                    <>
                      <Button
                        onClick={() => { setOpenView(false); setOpenApprove(true) }}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" /> Approve
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => { setOpenView(false); setOpenReject(true) }}
                        className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-2" /> Reject
                      </Button>
                    </>
                  )}
                  <Button variant="outline" onClick={() => setOpenView(false)} className="flex-1 border-neutral-200">
                    Close
                  </Button>
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={openApprove} onOpenChange={setOpenApprove}>
        <DialogContent className="bg-white border border-neutral-200 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-emerald-700">Approve Booking</DialogTitle>
            <DialogDescription className="text-neutral-500">Add an optional note for the employee</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleApprove)} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="admin_note" className="text-neutral-700">Admin Note (Optional)</Label>
              <Textarea
                id="admin_note"
                placeholder="e.g., Approved. Please arrive 5 minutes early."
                {...register('admin_note')}
                disabled={isSubmitting || isProcessing}
                rows={4}
                className="border-neutral-200 focus:ring-neutral-400"
              />
              {errors.admin_note && <p className="text-sm text-red-600">{errors.admin_note.message}</p>}
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => { setOpenApprove(false); reset() }} disabled={isSubmitting || isProcessing} className="flex-1 border-neutral-200">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || isProcessing} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                {isSubmitting || isProcessing ? (
                  <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Approving...</>
                ) : (
                  <><CheckCircle className="w-4 h-4 mr-2" />Approve Booking</>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={openReject} onOpenChange={setOpenReject}>
        <DialogContent className="bg-white border border-neutral-200 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-red-700">Reject Booking</DialogTitle>
            <DialogDescription className="text-neutral-500">Please provide a reason for rejection</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleReject)} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="admin_note_reject" className="text-neutral-700">Reason for Rejection *</Label>
              <Textarea
                id="admin_note_reject"
                placeholder="e.g., Resource unavailable due to maintenance"
                {...register('admin_note')}
                disabled={isSubmitting || isProcessing}
                rows={4}
                className="border-neutral-200 focus:ring-neutral-400"
              />
              {errors.admin_note && <p className="text-sm text-red-600">{errors.admin_note.message}</p>}
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => { setOpenReject(false); reset() }} disabled={isSubmitting || isProcessing} className="flex-1 border-neutral-200">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || isProcessing} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                {isSubmitting || isProcessing ? (
                  <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Rejecting...</>
                ) : (
                  <><XCircle className="w-4 h-4 mr-2" />Reject Booking</>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent className="bg-white border border-neutral-200 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-red-700">Delete Booking</DialogTitle>
            <DialogDescription className="text-neutral-500">
              Are you sure you want to delete this booking? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={() => setOpenDelete(false)} disabled={isProcessing} className="flex-1 border-neutral-200">
              Cancel
            </Button>
            <Button onClick={handleDelete} disabled={isProcessing} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
              {isProcessing ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Deleting...</>
              ) : (
                <><Trash2 className="w-4 h-4 mr-2" />Delete</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Bookings