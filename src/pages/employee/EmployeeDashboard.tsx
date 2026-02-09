import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, CheckCircle, XCircle, Eye, MapPin, AlertCircle } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

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
    resource_name?: string
    user?: {
        id: number
        name: string
        email: string
    }
}

const statusBadgeStyles: Record<string, string> = {
    pending:    'bg-amber-50 text-amber-700 border border-amber-200',
    approved:   'bg-blue-50 text-blue-700 border border-blue-200',
    rejected:   'bg-red-50 text-red-700 border border-red-200',
    checked_in: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    completed:  'bg-violet-50 text-violet-700 border border-violet-200',
    cancelled:  'bg-neutral-100 text-neutral-500 border border-neutral-200',
}

const EmployeeDashboard: React.FC = () => {
    const navigate = useNavigate()
    const [activeBookings, setActiveBookings] = useState<Booking[]>([])
    const [recentBookings, setRecentBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
    const [openView, setOpenView] = useState(false)

    async function fetchMyBookings() {
        setLoading(true)
        try {
            const res = await api.get<{ bookings: Booking[] }>('/bookings')
            const allBookings = res.bookings || []

            const now = new Date()
            const active = allBookings.filter(b =>
                (b.status === 'approved' || b.status === 'checked_in') &&
                new Date(b.end_time) > now
            ).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

            const recent = allBookings
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 5)

            setActiveBookings(active)
            setRecentBookings(recent)
        } catch (err: any) {
            console.error('Failed to fetch bookings:', err)
            setMessage({ type: 'error', text: 'Failed to fetch bookings' })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMyBookings()
    }, [])

    async function onCheckIn(booking: Booking) {
        if (!confirm(`Check in for ${booking.resource?.name}?`)) return

        setMessage(null)
        try {
            await api.post(`/bookings/${booking.id}/check_in`, {})
            setMessage({ type: 'success', text: 'Checked in successfully!' })
            fetchMyBookings()
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to check in' })
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

    const getStatusBadge = (status: string) => {
        return statusBadgeStyles[status] || 'bg-neutral-100 text-neutral-500 border border-neutral-200'
    }

    const canCheckIn = (booking: Booking) => {
        if (booking.status !== 'approved' || booking.checked_in_at) return false
        const now = new Date()
        const start = new Date(booking.start_time)
        const end = new Date(booking.end_time)
        const checkInWindow = new Date(start.getTime() - 15 * 60 * 1000)
        return now >= checkInWindow && now <= end
    }

    return (
        <div className="max-w-6xl">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-neutral-900 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                    My Bookings
                </h1>
                <p className="text-neutral-500">Manage your active bookings and check-in to resources</p>
            </div>

            {/* Message Banner */}
            {message && (
                <div className={`mb-6 p-4 rounded-lg border ${message.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Quick Action */}
            <Card className="mb-8 border-neutral-800 bg-neutral-950 text-white">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-semibold mb-1">Need to book a resource?</h3>
                            <p className="text-neutral-400">Browse available resources and create a new booking</p>
                        </div>
                        <Button
                            onClick={() => navigate('/dashboard/employee/book')}
                            className="bg-white text-neutral-900 hover:bg-neutral-200 font-semibold"
                        >
                            <Calendar className="w-4 h-4 mr-2" />
                            Book Now
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Active Bookings */}
            <Card className="mb-8 border-neutral-200 shadow-sm">
                <CardHeader className="border-b border-neutral-100 bg-neutral-50/50">
                    <CardTitle className="text-2xl text-neutral-900">Active & Upcoming Bookings</CardTitle>
                    <CardDescription className="text-neutral-500">Your approved bookings that need check-in</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    {loading ? (
                        <div className="text-center py-12 text-neutral-400">Loading bookings...</div>
                    ) : activeBookings.length === 0 ? (
                        <div className="text-center py-12">
                            <AlertCircle className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
                            <p className="text-neutral-500">No active bookings</p>
                            <p className="text-sm text-neutral-400 mt-1">Your approved bookings will appear here</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {activeBookings.map((booking) => (
                                <div
                                    key={booking.id}
                                    className="border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3">
                                                <h4 className="text-lg font-semibold text-neutral-900">
                                                    {booking?.resource_name || 'Unknown Resource'}
                                                </h4>
                                                <Badge variant="secondary" className={getStatusBadge(booking.status)}>
                                                    {booking.status.replace('_', ' ').toUpperCase()}
                                                </Badge>
                                                {booking.checked_in_at && (
                                                    <div className="flex items-center gap-1 text-emerald-600 text-sm">
                                                        <CheckCircle className="w-4 h-4" />
                                                        <span>Checked In</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div className="flex items-center gap-2 text-neutral-500">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>{new Date(booking.start_time).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-neutral-500">
                                                    <Clock className="w-4 h-4" />
                                                    <span>
                                                        {new Date(booking.start_time).toLocaleTimeString([], {
                                                            hour: '2-digit', minute: '2-digit', hour12: true,
                                                            timeZone: 'Asia/Kolkata'
                                                        })} - {new Date(booking.end_time).toLocaleTimeString([], {
                                                            hour: '2-digit', minute: '2-digit', hour12: true,
                                                            timeZone: 'Asia/Kolkata'
                                                        })}
                                                    </span>
                                                </div>
                                                {booking.resource?.location && (
                                                    <div className="flex items-center gap-2 text-neutral-500">
                                                        <MapPin className="w-4 h-4" />
                                                        <span>{booking.resource.location}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2 text-neutral-500 capitalize">
                                                    {booking.resource?.resource_type?.replace('_', ' ') || '-'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 ml-4">
                                            {canCheckIn(booking) && (
                                                <Button
                                                    onClick={() => onCheckIn(booking)}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                                >
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Check In
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                onClick={() => onViewDetails(booking)}
                                                className="border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                                            >
                                                <Eye className="w-4 h-4 mr-2" />
                                                View Details
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Recent Bookings */}
            <Card className="border-neutral-200 shadow-sm">
                <CardHeader className="border-b border-neutral-100 bg-neutral-50/50">
                    <CardTitle className="text-2xl text-neutral-900">Recent Bookings</CardTitle>
                    <CardDescription className="text-neutral-500">Your latest booking activity</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    {recentBookings.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-neutral-400">No recent bookings</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentBookings.map((booking) => (
                                <div
                                    key={booking.id}
                                    onClick={() => onViewDetails(booking)}
                                    className="border border-neutral-200 rounded-lg p-3 hover:bg-neutral-50 cursor-pointer transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium text-neutral-900">{booking.resource?.name || 'Unknown'}</span>
                                                <Badge variant="secondary" className={`${getStatusBadge(booking.status)} text-xs`}>
                                                    {booking.status.replace('_', ' ').toUpperCase()}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-neutral-500">
                                                <span>{new Date(booking.start_time).toLocaleString()}</span>
                                                {booking.checked_in_at && (
                                                    <div className="flex items-center gap-1 text-emerald-600">
                                                        <CheckCircle className="w-3 h-3" />
                                                        <span className="text-xs">Checked In</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <Eye className="w-4 h-4 text-neutral-300" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {recentBookings.length > 0 && (
                        <div className="mt-4 text-center">
                            <Button
                                variant="outline"
                                onClick={() => navigate('/dashboard/employee/history')}
                                className="border-neutral-300 text-neutral-600 hover:bg-neutral-50"
                            >
                                View All History
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* View Details Dialog */}
            <Dialog open={openView} onOpenChange={setOpenView}>
                <DialogContent className="bg-white max-w-2xl border border-neutral-200">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-semibold text-neutral-900">Booking Details</DialogTitle>
                        <DialogDescription className="text-neutral-500">Complete information about your booking</DialogDescription>
                    </DialogHeader>

                    {selectedBooking && (
                        <div className="space-y-4 mt-4">
                            <div className="bg-neutral-50 p-4 rounded-lg space-y-4 border border-neutral-100">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-xs font-semibold text-neutral-400 uppercase mb-1">Resource</div>
                                        <div className="font-medium text-neutral-900">{selectedBooking.resource?.name}</div>
                                        <div className="text-sm text-neutral-500 capitalize">
                                            {selectedBooking.resource?.resource_type?.replace('_', ' ')}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-xs font-semibold text-neutral-400 uppercase mb-1">Status</div>
                                        <Badge variant="secondary" className={getStatusBadge(selectedBooking.status)}>
                                            {selectedBooking.status.replace('_', ' ').toUpperCase()}
                                        </Badge>
                                    </div>

                                    <div>
                                        <div className="text-xs font-semibold text-neutral-400 uppercase mb-1">Start Time</div>
                                        <div className="text-sm text-neutral-900">{new Date(selectedBooking.start_time).toLocaleString()}</div>
                                    </div>

                                    <div>
                                        <div className="text-xs font-semibold text-neutral-400 uppercase mb-1">End Time</div>
                                        <div className="text-sm text-neutral-900">{new Date(selectedBooking.end_time).toLocaleString()}</div>
                                    </div>

                                    {selectedBooking.resource?.location && (
                                        <div>
                                            <div className="text-xs font-semibold text-neutral-400 uppercase mb-1">Location</div>
                                            <div className="text-sm text-neutral-900">{selectedBooking.resource.location}</div>
                                        </div>
                                    )}

                                    <div>
                                        <div className="text-xs font-semibold text-neutral-400 uppercase mb-1">Checked In</div>
                                        {selectedBooking.checked_in_at ? (
                                            <div className="flex items-center gap-2 text-emerald-600">
                                                <CheckCircle className="w-4 h-4" />
                                                <span className="text-sm">{new Date(selectedBooking.checked_in_at).toLocaleString()}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-neutral-400">
                                                <XCircle className="w-4 h-4" />
                                                <span className="text-sm">Not checked in</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {selectedBooking.admin_note && (
                                    <div className="pt-4 border-t border-neutral-200">
                                        <div className="text-xs font-semibold text-neutral-400 uppercase mb-2">Admin Note</div>
                                        <div className="bg-white p-3 rounded border border-neutral-200 text-sm text-neutral-900">
                                            {selectedBooking.admin_note}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {canCheckIn(selectedBooking) && (
                                <Button
                                    onClick={() => {
                                        onCheckIn(selectedBooking)
                                        setOpenView(false)
                                    }}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Check In Now
                                </Button>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default EmployeeDashboard