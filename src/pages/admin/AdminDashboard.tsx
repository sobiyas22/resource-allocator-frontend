import React, { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import {
  TrendingUp, Users, Calendar, DoorOpen,
  AlertTriangle, CheckCircle, Clock, Activity
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import dayjs from 'dayjs'

// Updated interfaces to match actual API responses
interface ResourceUsage {
  resource_id: number
  resource_name: string
  resource_type?: string
  total_bookings: number
  checked_in_count?: number
  utilization_rate?: number
}

interface UserBooking {
  user_id: number
  user_name: string
  total_approved_bookings: number
}

interface PeakHour {
  hour: string | number
  bookings?: number
  booking_count?: number
}

interface DashboardStats {
  totalUsers: number
  totalResources: number
  totalBookings: number
  pendingBookings: number
  approvedBookings: number
  todayBookings: number
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0, totalResources: 0, totalBookings: 0,
    pendingBookings: 0, approvedBookings: 0, todayBookings: 0
  })
  const [resourceUsage, setResourceUsage] = useState<ResourceUsage[]>([])
  const [userBookings, setUserBookings] = useState<UserBooking[]>([])
  const [peakHours, setPeakHours] = useState<PeakHour[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchDashboardData() }, [])

  async function fetchDashboardData() {
    setLoading(true)
    try {
      const [usersRes, resourcesRes, bookingsRes, resourceUsageRes, userBookingsRes, peakHoursRes] = await Promise.all([
        api.get<{ users: any[]; total: number }>('/users'),
        api.get<{ resources: any[]; total: number }>('/resources'),
        api.get<{ bookings: any[]; total: number }>('/bookings'),
        api.get<{ data: ResourceUsage[] }>('/reports/resource_usage'),
        api.get<{ data: UserBooking[] }>('/reports/user_bookings'),
        api.get<{ data: PeakHour[] }>('/reports/peak_hours')
      ])

      const bookings = bookingsRes.bookings || []
      const today = dayjs().format('YYYY-MM-DD')

      setStats({
        totalUsers: usersRes.total || 0,
        totalResources: resourcesRes.total || 0,
        totalBookings: bookingsRes.total || 0,
        pendingBookings: bookings.filter((b: any) => b.status === 'pending').length,
        approvedBookings: bookings.filter((b: any) => b.status === 'approved').length,
        todayBookings: bookings.filter((b: any) => dayjs(b.start_time).format('YYYY-MM-DD') === today).length
      })

      setResourceUsage(resourceUsageRes.data || [])
      setUserBookings((userBookingsRes.data || []).slice(0, 10))
      setPeakHours(peakHoursRes.data || [])
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Safe data transforms — handle both API shapes
  const utilizationData = resourceUsage.map(r => ({
    name: r.resource_name,
    bookings: r.total_bookings,
    utilization: r.utilization_rate != null ? parseFloat((r.utilization_rate * 100).toFixed(2)) : null,
    checkins: r.checked_in_count ?? 0
  }))

  // Peak hours API can return { hour: "9:00", bookings: 2 } or { hour: 9, booking_count: 2 }
  const peakHoursData = peakHours.map(p => ({
    hour: typeof p.hour === 'number' ? `${p.hour}:00` : p.hour,
    bookings: p.bookings ?? p.booking_count ?? 0
  }))

  const riskScoreData = resourceUsage.map(r => {
    const rate = r.utilization_rate ?? 0
    let risk = 'Normal'
    let color = '#22c55e' // green
    if (rate < 0.2) { risk = 'Underutilized'; color = '#f59e0b' }
    else if (rate > 0.8) { risk = 'Overbooked'; color = '#ef4444' }
    else if (rate > 0.6) { risk = 'High Demand'; color = '#404040' }
    return { name: r.resource_name, utilization: rate * 100, risk, color }
  })

  const metrics = [
    { title: 'Total Users', value: stats.totalUsers, sub: 'Registered employees', icon: Users, accent: 'border-l-neutral-900' },
    { title: 'Total Resources', value: stats.totalResources, sub: 'Available resources', icon: DoorOpen, accent: 'border-l-neutral-600' },
    { title: 'Total Bookings', value: stats.totalBookings, sub: 'All time bookings', icon: Calendar, accent: 'border-l-neutral-400' },
    { title: 'Pending Approval', value: stats.pendingBookings, sub: 'Awaiting admin action', icon: Clock, accent: 'border-l-amber-500' },
    { title: 'Approved', value: stats.approvedBookings, sub: 'Active approved bookings', icon: CheckCircle, accent: 'border-l-emerald-500' },
    { title: "Today's Bookings", value: stats.todayBookings, sub: 'Scheduled for today', icon: Activity, accent: 'border-l-blue-500' },
  ]

  return (
    <div className="max-w-7xl">
      <Breadcrumbs items={[{ label: 'Admin Dashboard' }]} />

      <div className="mb-10">
        <h1
          className="text-4xl font-bold text-neutral-900 mb-2"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Analytics Dashboard
        </h1>
        <p className="text-neutral-500">
          Real-time insights into resource utilization and booking patterns
        </p>
      </div>

      {loading ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map(i => (
              <Card key={i} className="border-neutral-200 rounded-2xl">
                <CardHeader><Skeleton className="h-5 w-28" /></CardHeader>
                <CardContent><Skeleton className="h-10 w-20" /></CardContent>
              </Card>
            ))}
          </div>
          <Card className="border-neutral-200 rounded-2xl">
            <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
            <CardContent><Skeleton className="h-75 w-full" /></CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-8">
          {/* ── Key Metrics ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {metrics.map((m, i) => (
              <Card
                key={i}
                className={`border-l-4 ${m.accent} shadow-sm hover:shadow-lg transition-all duration-200 border-neutral-200 rounded-2xl bg-white`}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-neutral-500 tracking-wide uppercase">
                    {m.title}
                  </CardTitle>
                  <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center">
                    <m.icon className="w-5 h-5 text-neutral-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-extrabold text-neutral-900 tracking-tight">{m.value}</div>
                  <p className="text-xs text-neutral-400 mt-1.5">{m.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ── Resource Booking Volume Chart ── */}
          <Card className="shadow-sm border-neutral-200 rounded-2xl overflow-hidden bg-white">
            <CardHeader className="bg-neutral-50/80 border-b border-neutral-100 py-5">
              <CardTitle className="flex items-center gap-2 text-neutral-900">
                <TrendingUp className="w-5 h-5 text-neutral-500" />
                Resource Booking Volume
              </CardTitle>
              <CardDescription className="text-neutral-500">
                Number of total bookings per resource
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-8 pb-4">
              {utilizationData.length === 0 ? (
                <div className="text-center py-16 text-neutral-400">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                  <p className="font-medium">No resource data available</p>
                  <p className="text-sm mt-1">Bookings will appear here once resources are used</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={360}>
                  <BarChart data={utilizationData} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                    <XAxis
                      dataKey="name"
                      angle={-35}
                      textAnchor="end"
                      height={90}
                      tick={{ fill: '#737373', fontSize: 12 }}
                      axisLine={{ stroke: '#d4d4d4' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#737373', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e5e5',
                        borderRadius: '12px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                        padding: '12px 16px'
                      }}
                      cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: 16 }} />
                    <Bar dataKey="bookings" name="Total Bookings" fill="#171717" radius={[8, 8, 0, 0]} />
                    {utilizationData.some(d => d.utilization != null) && (
                      <Bar dataKey="utilization" name="Utilization %" fill="#a3a3a3" radius={[8, 8, 0, 0]} />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* ── Peak Hours Analysis ── */}
          <Card className="shadow-sm border-neutral-200 rounded-2xl overflow-hidden bg-white">
            <CardHeader className="bg-neutral-50/80 border-b border-neutral-100 py-5">
              <CardTitle className="flex items-center gap-2 text-neutral-900">
                <Clock className="w-5 h-5 text-neutral-500" />
                Peak Hours Analysis
              </CardTitle>
              <CardDescription className="text-neutral-500">
                Booking distribution throughout the day
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-8 pb-4">
              {peakHoursData.length === 0 ? (
                <div className="text-center py-16 text-neutral-400">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                  <p className="font-medium">No peak hours data available</p>
                  <p className="text-sm mt-1">Data will populate as bookings are made</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={peakHoursData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                    <XAxis
                      dataKey="hour"
                      tick={{ fill: '#737373', fontSize: 12 }}
                      axisLine={{ stroke: '#d4d4d4' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#737373', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e5e5',
                        borderRadius: '12px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
                      }}
                    />
                    <Legend wrapperStyle={{ paddingTop: 16 }} />
                    <Line
                      type="monotone"
                      dataKey="bookings"
                      name="Bookings"
                      stroke="#171717"
                      strokeWidth={3}
                      dot={{ fill: '#171717', r: 5, strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 7, fill: '#171717', stroke: '#fff', strokeWidth: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* ── Risk Score & Top Users — side by side ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Resource Risk Score */}
            <Card className="shadow-sm border-neutral-200 rounded-2xl overflow-hidden bg-white">
              <CardHeader className="bg-neutral-50/80 border-b border-neutral-100 py-5">
                <CardTitle className="flex items-center gap-2 text-neutral-900">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Resource Risk Score
                </CardTitle>
                <CardDescription className="text-neutral-500">
                  Identifies underutilized and overbooked resources
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {riskScoreData.length === 0 ? (
                  <div className="text-center py-16 text-neutral-400">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                    <p className="font-medium">No risk data available</p>
                    <p className="text-sm mt-1">Risk scores appear when resources have utilization data</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {riskScoreData.map((item, index) => (
                      <div key={index} className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-neutral-800">{item.name}</span>
                          <Badge
                            style={{ backgroundColor: item.color }}
                            className="text-white text-xs font-medium px-2.5 py-0.5 rounded-full"
                          >
                            {item.risk}
                          </Badge>
                        </div>
                        <div className="w-full bg-neutral-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="h-2.5 rounded-full transition-all duration-700 ease-out"
                            style={{
                              width: `${Math.max(item.utilization, 3)}%`,
                              backgroundColor: item.color
                            }}
                          />
                        </div>
                        <p className="text-xs text-neutral-400">{item.utilization.toFixed(1)}% utilized</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Users by Bookings */}
            <Card className="shadow-sm border-neutral-200 rounded-2xl overflow-hidden bg-white">
              <CardHeader className="bg-neutral-50/80 border-b border-neutral-100 py-5">
                <CardTitle className="flex items-center gap-2 text-neutral-900">
                  <Users className="w-5 h-5 text-neutral-500" />
                  Top Users by Bookings
                </CardTitle>
                <CardDescription className="text-neutral-500">
                  Most active employees
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {userBookings.length === 0 ? (
                  <div className="text-center py-16 text-neutral-400">
                    <Users className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                    <p className="font-medium">No user booking data available</p>
                    <p className="text-sm mt-1">Users with approved bookings will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userBookings.map((user, index) => (
                      <div
                        key={user.user_id}
                        className="flex items-center justify-between p-3.5 bg-neutral-50 rounded-xl border border-neutral-100 hover:border-neutral-200 hover:shadow-sm transition-all duration-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`
                            w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm
                            ${index === 0
                              ? 'bg-neutral-900 text-white'
                              : index === 1
                                ? 'bg-neutral-700 text-white'
                                : index === 2
                                  ? 'bg-neutral-500 text-white'
                                  : 'bg-neutral-200 text-neutral-700'}
                          `}>
                            {index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}
                          </div>
                          <div>
                            <span className="font-semibold text-neutral-900 text-sm">{user.user_name}</span>
                          </div>
                        </div>
                        <Badge className="bg-neutral-900 text-white text-xs font-medium px-3 py-1 rounded-full">
                          {user.total_approved_bookings} booking{user.total_approved_bookings !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Booking Status Distribution ── */}
          {stats.totalBookings > 0 && (
            <Card className="shadow-sm border-neutral-200 rounded-2xl overflow-hidden bg-white">
              <CardHeader className="bg-neutral-50/80 border-b border-neutral-100 py-5">
                <CardTitle className="flex items-center gap-2 text-neutral-900">
                  <Activity className="w-5 h-5 text-neutral-500" />
                  Booking Status Distribution
                </CardTitle>
                <CardDescription className="text-neutral-500">
                  Overview of all booking statuses
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 pb-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center hover:shadow-sm transition-shadow">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                    <p className="text-3xl font-extrabold text-amber-700">{stats.pendingBookings}</p>
                    <p className="text-sm text-amber-600 mt-1 font-medium">Pending</p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center hover:shadow-sm transition-shadow">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    <p className="text-3xl font-extrabold text-emerald-700">{stats.approvedBookings}</p>
                    <p className="text-sm text-emerald-600 mt-1 font-medium">Approved</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-center hover:shadow-sm transition-shadow">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-3xl font-extrabold text-blue-700">{stats.todayBookings}</p>
                    <p className="text-sm text-blue-600 mt-1 font-medium">Today</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

export default AdminDashboard