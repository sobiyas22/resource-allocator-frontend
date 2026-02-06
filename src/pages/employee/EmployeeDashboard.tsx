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

            // Active bookings: approved or checked_in, with future or current times
            const now = new Date()
            const active = allBookings.filter(b =>
                (b.status === 'approved' || b.status === 'checked_in') &&
                new Date(b.end_time) > now
            ).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

            // Recent bookings: last 5 bookings of any status
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

    const canCheckIn = (booking: Booking) => {
        if (booking.status !== 'approved' || booking.checked_in_at) return false
        const now = new Date()
        const start = new Date(booking.start_time)
        const end = new Date(booking.end_time)
        // Can check in 15 mins before start time and before end time
        const checkInWindow = new Date(start.getTime() - 15 * 60 * 1000)
        return now >= checkInWindow && now <= end
    }

    return (
        <div className="max-w-6xl">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                    My Bookings
                </h1>
                <p className="text-gray-600">Manage your active bookings and check-in to resources</p>
            </div>

            {/* Message Banner */}
            {message && (
                <div className={`mb-6 p-4 rounded-lg border ${message.type === 'success'
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Quick Action */}
            <Card className="mb-8 border-gray-900 bg-linear-to-r from-gray-900 to-gray-800 text-white">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-semibold mb-1">Need to book a resource?</h3>
                            <p className="text-gray-300">Browse available resources and create a new booking</p>
                        </div>
                        <Button
                            onClick={() => navigate('/dashboard/employee/book')}
                            className="bg-white text-gray-900 hover:bg-gray-100"
                        >
                            <Calendar className="w-4 h-4 mr-2" />
                            Book Now
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Active Bookings */}
            <Card className="mb-8 border-gray-200 shadow-lg">
                <CardHeader className="border-b border-gray-100 bg-gray-50">
                    <CardTitle className="text-2xl text-gray-900">Active & Upcoming Bookings</CardTitle>
                    <CardDescription>Your approved bookings that need check-in</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    {loading ? (
                        <div className="text-center py-12 text-gray-500">Loading bookings...</div>
                    ) : activeBookings.length === 0 ? (
                        <div className="text-center py-12">
                            <AlertCircle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-500">No active bookings</p>
                            <p className="text-sm text-gray-400 mt-1">Your approved bookings will appear here</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {activeBookings.map((booking) => (
                                <div
                                    key={booking.id}
                                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3">
                                                <h4 className="text-lg font-semibold text-gray-900">
                                                    {booking?.resource_name || 'Unknown Resource'}
                                                </h4>
                                                <Badge variant="secondary" className={getStatusBadge(booking.status)}>
                                                    {booking.status.replace('_', ' ').toUpperCase()}
                                                </Badge>
                                                {booking.checked_in_at && (
                                                    <div className="flex items-center gap-1 text-green-600 text-sm">
                                                        <CheckCircle className="w-4 h-4" />
                                                        <span>Checked In</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>{new Date(booking.start_time).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-600">
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
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <MapPin className="w-4 h-4" />
                                                        <span>{booking.resource.location}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2 text-gray-600 capitalize">
                                                    {booking.resource?.resource_type?.replace('_', ' ') || '-'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 ml-4">
                                            {canCheckIn(booking) && (
                                                <Button
                                                    onClick={() => onCheckIn(booking)}
                                                    className="bg-green-600 hover:bg-green-700"
                                                >
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Check In
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                onClick={() => onViewDetails(booking)}
                                                className="border-gray-300"
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
            <Card className="border-gray-200 shadow-lg">
                <CardHeader className="border-b border-gray-100 bg-gray-50">
                    <CardTitle className="text-2xl text-gray-900">Recent Bookings</CardTitle>
                    <CardDescription>Your latest booking activity</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    {recentBookings.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">No recent bookings</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentBookings.map((booking) => (
                                <div
                                    key={booking.id}
                                    onClick={() => onViewDetails(booking)}
                                    className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium text-gray-900">{booking.resource?.name || 'Unknown'}</span>
                                                <Badge variant="secondary" className={`${getStatusBadge(booking.status)} text-xs`}>
                                                    {booking.status.replace('_', ' ').toUpperCase()}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                                <span>{new Date(booking.start_time).toLocaleString()}</span>
                                                {booking.checked_in_at && (
                                                    <div className="flex items-center gap-1 text-green-600">
                                                        <CheckCircle className="w-3 h-3" />
                                                        <span className="text-xs">Checked In</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <Eye className="w-4 h-4 text-gray-400" />
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
                                className="border-gray-300"
                            >
                                View All History
                            </Button>
                        </div>
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
                            </div>

                            {canCheckIn(selectedBooking) && (
                                <Button
                                    onClick={() => {
                                        onCheckIn(selectedBooking)
                                        setOpenView(false)
                                    }}
                                    className="w-full bg-green-600 hover:bg-green-700"
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