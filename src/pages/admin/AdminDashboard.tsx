import React, { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  DoorOpen,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import dayjs from 'dayjs'

interface ResourceUsage {
  resource_id: number
  resource_name: string
  total_bookings: number
  checked_in_count: number
  utilization_rate: number
}

interface UserBooking {
  user_id: number
  user_name: string
  total_approved_bookings: number
}

interface PeakHour {
  hour: number
  booking_count: number
}

interface DashboardStats {
  totalUsers: number
  totalResources: number
  totalBookings: number
  pendingBookings: number
  approvedBookings: number
  todayBookings: number
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4']

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalResources: 0,
    totalBookings: 0,
    pendingBookings: 0,
    approvedBookings: 0,
    todayBookings: 0
  })
  const [resourceUsage, setResourceUsage] = useState<ResourceUsage[]>([])
  const [userBookings, setUserBookings] = useState<UserBooking[]>([])
  const [peakHours, setPeakHours] = useState<PeakHour[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    setLoading(true)
    try {
      // Fetch all data in parallel
      const [usersRes, resourcesRes, bookingsRes, resourceUsageRes, userBookingsRes, peakHoursRes] = await Promise.all([
        api.get<{ users: any[]; total: number }>('/users'),
        api.get<{ resources: any[]; total: number }>('/resources'),
        api.get<{ bookings: any[]; total: number }>('/bookings'),
        api.get<{ data: ResourceUsage[] }>('/reports/resource_usage'),
        api.get<{ data: UserBooking[] }>('/reports/user_bookings'),
        api.get<{ data: PeakHour[] }>('/reports/peak_hours')
      ])

      // Calculate stats
      const bookings = bookingsRes.bookings || []
      const today = dayjs().format('YYYY-MM-DD')
      
      setStats({
        totalUsers: usersRes.total || 0,
        totalResources: resourcesRes.total || 0,
        totalBookings: bookingsRes.total || 0,
        pendingBookings: bookings.filter(b => b.status === 'pending').length,
        approvedBookings: bookings.filter(b => b.status === 'approved').length,
        todayBookings: bookings.filter(b => dayjs(b.start_time).format('YYYY-MM-DD') === today).length
      })

      setResourceUsage(resourceUsageRes.data || [])
      setUserBookings(userBookingsRes.data.slice(0, 10) || []) // Top 10 users
      setPeakHours(peakHoursRes.data || [])
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  const utilizationData = resourceUsage.map(r => ({
    name: r.resource_name,
    utilization: parseFloat((r.utilization_rate * 100).toFixed(2)),
    bookings: r.total_bookings,
    checkins: r.checked_in_count
  }))

  const peakHoursData = peakHours.map(p => ({
    hour: `${p.hour}:00`,
    bookings: p.booking_count
  }))

  const riskScoreData = resourceUsage.map(r => {
    let risk = 'Low'
    let color = '#10b981' // green
    
    if (r.utilization_rate < 0.2) {
      risk = 'Underutilized'
      color = '#f59e0b' // amber
    } else if (r.utilization_rate > 0.8) {
      risk = 'Overbooked'
      color = '#ef4444' // red
    } else if (r.utilization_rate > 0.6) {
      risk = 'High Demand'
      color = '#6366f1' // indigo
    }

    return {
      name: r.resource_name,
      utilization: r.utilization_rate * 100,
      risk,
      color
    }
  })

  return (
    <div className="max-w-7xl">
      <Breadcrumbs 
        items={[
          { label: 'Admin Dashboard' }
        ]} 
      />

      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          Analytics Dashboard
        </h1>
        <p className="text-gray-600">
          Real-time insights into resource utilization and booking patterns
        </p>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-12 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-l-4 border-indigo-500 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
                <Users className="w-5 h-5 text-indigo-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.totalUsers}</div>
                <p className="text-xs text-gray-500 mt-1">Registered employees</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-purple-500 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Resources</CardTitle>
                <DoorOpen className="w-5 h-5 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.totalResources}</div>
                <p className="text-xs text-gray-500 mt-1">Available resources</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-emerald-500 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Bookings</CardTitle>
                <Calendar className="w-5 h-5 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.totalBookings}</div>
                <p className="text-xs text-gray-500 mt-1">All time bookings</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-amber-500 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Pending Approval</CardTitle>
                <Clock className="w-5 h-5 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.pendingBookings}</div>
                <p className="text-xs text-gray-500 mt-1">Awaiting admin action</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-blue-500 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Approved Today</CardTitle>
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.approvedBookings}</div>
                <p className="text-xs text-gray-500 mt-1">Active approved bookings</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-rose-500 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Today's Bookings</CardTitle>
                <Activity className="w-5 h-5 text-rose-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stats.todayBookings}</div>
                <p className="text-xs text-gray-500 mt-1">Scheduled for today</p>
              </CardContent>
            </Card>
          </div>

          {/* Resource Utilization */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                Resource Utilization Rate
              </CardTitle>
              <CardDescription>
                Percentage of bookings that resulted in actual check-ins
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {utilizationData.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No utilization data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={utilizationData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={100}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <YAxis tick={{ fill: '#6b7280' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="utilization" name="Utilization %" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} />
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Peak Hours Analysis */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                Peak Hours Analysis
              </CardTitle>
              <CardDescription>
                Booking distribution throughout the day
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {peakHoursData.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No peak hours data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={peakHoursData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="hour" tick={{ fill: '#6b7280' }} />
                    <YAxis tick={{ fill: '#6b7280' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="bookings" 
                      name="Bookings" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      dot={{ fill: '#10b981', r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Risk Score Heatmap & Top Users */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Score Heatmap */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  Resource Risk Score
                </CardTitle>
                <CardDescription>
                  Identifies underutilized and overbooked resources
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {riskScoreData.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No risk data available
                  </div>
                ) : (
                  <div className="space-y-4">
                    {riskScoreData.map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">{item.name}</span>
                          <Badge 
                            style={{ backgroundColor: item.color }}
                            className="text-white"
                          >
                            {item.risk}
                          </Badge>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className="h-3 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${item.utilization}%`,
                              backgroundColor: item.color
                            }}
                          />
                        </div>
                        <p className="text-xs text-gray-500">{item.utilization.toFixed(1)}% utilized</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Users */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  Top Users by Bookings
                </CardTitle>
                <CardDescription>
                  Most active employees
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {userBookings.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No user booking data available
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userBookings.map((user, index) => (
                      <div 
                        key={user.user_id} 
                        className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center font-bold text-white
                            ${index === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 
                              index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                              index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700' :
                              'bg-gradient-to-br from-purple-400 to-pink-500'}
                          `}>
                            {index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}
                          </div>
                          <span className="font-medium text-gray-900">{user.user_name}</span>
                        </div>
                        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                          {user.total_approved_bookings} bookings
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Booking Status Distribution */}
          {stats.totalBookings > 0 && (
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Booking Status Distribution
                </CardTitle>
                <CardDescription>
                  Overview of all booking statuses
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-amber-700">{stats.pendingBookings}</p>
                    <p className="text-sm text-amber-600 mt-1">Pending</p>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-indigo-700">{stats.approvedBookings}</p>
                    <p className="text-sm text-indigo-600 mt-1">Approved</p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-emerald-700">{stats.todayBookings}</p>
                    <p className="text-sm text-emerald-600 mt-1">Today</p>
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