import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar, Clock, MapPin, Users, Check, X, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

const IST_TIMEZONE = 'Asia/Kolkata'

interface Resource {
  id: number
  name: string
  resource_type: string
  location?: string
  is_active: boolean
  properties?: { capacity?: number }
}

interface AvailableSlot {
  start_time: string
  end_time: string
  available: boolean
}

interface AvailabilityResponse {
  resource_id: number
  resource_name: string
  query_date: string
  slot_duration_hours: number
  available_slots: AvailableSlot[]
}

interface AlternativeResource {
  id: number
  name: string
  resource_type: string
  location?: string
}

interface BookingError {
  errors: string[]
  suggestions?: {
    available_resources?: AlternativeResource[]
    available_slots?: AvailableSlot[]
  }
}

const BookingPage: React.FC = () => {
  const navigate = useNavigate()
  const [resources, setResources] = useState<Resource[]>([])
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null)
  const [loading, setLoading] = useState(false)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [alternativeResources, setAlternativeResources] = useState<AlternativeResource[]>([])
  const [alternativeSlots, setAlternativeSlots] = useState<AvailableSlot[]>([])

  useEffect(() => {
    fetchResources()
  }, [])

  useEffect(() => {
    if (selectedResource && selectedDate) {
      fetchAvailability()
    }
  }, [selectedResource, selectedDate])

  async function fetchResources() {
    try {
      const res = await api.get<{ resources: Resource[]; total: number }>('/resources')
      const activeResources = (res.resources || []).filter(r => r.is_active)
      setResources(activeResources)
    } catch (err: any) {
      console.error('Failed to fetch resources:', err)
      toast.error('Failed to load resources')
    }
  }

  async function fetchAvailability() {
    if (!selectedResource) return
    
    setLoading(true)
    setAlternativeResources([])
    setAlternativeSlots([])
    setSelectedSlot(null)
    
    try {
      const res = await api.get<AvailabilityResponse>(
        `/resources/${selectedResource.id}/availability?date=${selectedDate}&duration=1.0`
      )
      setAvailability(res)
    } catch (err: any) {
      console.error('Failed to fetch availability:', err)
      toast.error('Failed to load availability')
      setAvailability(null)
    } finally {
      setLoading(false)
    }
  }

  async function handleBooking() {
    if (!selectedResource || !selectedSlot) {
      toast.error('Please select a resource and time slot')
      return
    }

    setBookingLoading(true)
    setAlternativeResources([])
    setAlternativeSlots([])

    try {
      await api.post('/bookings', {
        resource_id: selectedResource.id,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
      })

      toast.success('Booking created successfully! Awaiting admin approval.')
      
      // Navigate based on user role
      setTimeout(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        if (user.role === 'admin') {
          navigate('/dashboard/admin/bookings')
        } else {
          navigate('/dashboard/employee')
        }
      }, 1500)
    } catch (err: any) {
      console.error('Booking failed:', err)
      
      // Handle 422 with suggestions
      if (err.response?.status === 422 && err.response?.data) {
        const errorData = err.response.data as BookingError
        
        toast.error(errorData.errors?.[0] || 'Time slot not available')
        
        if (errorData.suggestions?.available_resources) {
          setAlternativeResources(errorData.suggestions.available_resources)
        }
        if (errorData.suggestions?.available_slots) {
          setAlternativeSlots(errorData.suggestions.available_slots)
        }
      } else {
        toast.error(err.message || 'Failed to create booking')
      }
    } finally {
      setBookingLoading(false)
    }
  }

  function getSlotStatus(slot: AvailableSlot): 'available' | 'booked' | 'past' | 'current' {
    const now = dayjs().tz(IST_TIMEZONE)
    const slotStart = dayjs(slot.start_time).tz(IST_TIMEZONE)
    const slotEnd = dayjs(slot.end_time).tz(IST_TIMEZONE)

    if (slotEnd.isBefore(now)) return 'past'
    if (slotStart.isBefore(now) && slotEnd.isAfter(now)) return 'current'
    if (!slot.available) return 'booked'
    return 'available'
  }

  function getSlotBadge(status: 'available' | 'booked' | 'past' | 'current') {
    const configs = {
      available: { 
        label: 'Available', 
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
        icon: Check 
      },
      booked: { 
        label: 'Booked', 
        className: 'bg-red-50 text-red-700 border-red-200',
        icon: X 
      },
      past: { 
        label: 'Past', 
        className: 'bg-neutral-100 text-neutral-400 border-neutral-200',
        icon: Clock 
      },
      current: { 
        label: 'In Progress', 
        className: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: Clock 
      },
    }
    return configs[status]
  }

  const groupedResources = resources.reduce((acc, resource) => {
    const type = resource.resource_type || 'other'
    if (!acc[type]) acc[type] = []
    acc[type].push(resource)
    return acc
  }, {} as Record<string, Resource[]>)

  const minDate = dayjs().format('YYYY-MM-DD')
  const maxDate = dayjs().add(30, 'day').format('YYYY-MM-DD')

  return (
    <div className="max-w-7xl">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Book Resource' }
        ]}
      />

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-neutral-900 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          Book a Resource
        </h1>
        <p className="text-neutral-500">Select a resource and available time slot</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Selection Panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-sm border-neutral-200 rounded-xl">
            <CardHeader className="bg-neutral-50 border-b border-neutral-100 rounded-t-xl">
              <CardTitle className="text-lg text-neutral-900">Select Resource</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-neutral-700 font-medium">Resource</Label>
                <Select 
                  value={selectedResource?.id.toString() || ''} 
                  onValueChange={(value) => {
                    const resource = resources.find(r => r.id.toString() === value)
                    setSelectedResource(resource || null)
                  }}
                >
                  <SelectTrigger className="w-full border-neutral-200 rounded-lg">
                    <SelectValue placeholder="Choose a resource..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-neutral-200 rounded-lg shadow-xl">
                    {Object.entries(groupedResources).map(([type, items]) => (
                      <div key={type}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                          {type.replace(/-|_/g, ' ')}
                        </div>
                        {items.map(resource => (
                          <SelectItem 
                            key={resource.id} 
                            value={resource.id.toString()}
                            className="cursor-pointer hover:bg-neutral-50"
                          >
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-neutral-400" />
                              <div>
                                <div className="font-medium text-neutral-900">{resource.name}</div>
                                {resource.location && (
                                  <div className="text-xs text-neutral-500">{resource.location}</div>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedResource && (
                <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-100">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-neutral-900 rounded-lg flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-neutral-900">{selectedResource.name}</p>
                      {selectedResource.location && (
                        <p className="text-sm text-neutral-500">{selectedResource.location}</p>
                      )}
                      {selectedResource.properties?.capacity && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-neutral-600">
                          <Users className="w-3 h-3" />
                          Capacity: {selectedResource.properties.capacity}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-neutral-700 font-medium">Date</Label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={minDate}
                  max={maxDate}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-400 text-neutral-900"
                />
                <p className="text-xs text-neutral-500">
                  {dayjs(selectedDate).format('dddd, MMMM D, YYYY')}
                </p>
              </div>
            </CardContent>
          </Card>

          {selectedSlot && (
            <Card className="shadow-sm border-emerald-200 rounded-xl bg-emerald-50">
              <CardHeader className="bg-emerald-100 border-b border-emerald-200 rounded-t-xl">
                <CardTitle className="text-lg text-emerald-900">Selected Slot</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-900">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">
                      {dayjs(selectedSlot.start_time).tz(IST_TIMEZONE).format('MMM D, YYYY')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-900">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">
                      {dayjs(selectedSlot.start_time).tz(IST_TIMEZONE).format('h:mm A')} - {dayjs(selectedSlot.end_time).tz(IST_TIMEZONE).format('h:mm A')} IST
                    </span>
                  </div>
                  <Button
                    onClick={handleBooking}
                    disabled={bookingLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-2"
                  >
                    {bookingLoading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Creating Booking...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Confirm Booking
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Time Slots Panel */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm border-neutral-200 rounded-xl">
            <CardHeader className="bg-neutral-50 border-b border-neutral-100 rounded-t-xl">
              <CardTitle className="text-lg text-neutral-900">
                Available Time Slots {selectedResource && `- ${selectedResource.name}`}
              </CardTitle>
              <p className="text-sm text-neutral-500 mt-1">
                All times displayed in IST (Indian Standard Time)
              </p>
            </CardHeader>
            <CardContent className="p-6">
              {!selectedResource ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-neutral-400" />
                  </div>
                  <p className="text-neutral-500">Select a resource to view available time slots</p>
                </div>
              ) : loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="h-20 bg-neutral-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : !availability || availability.available_slots.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X className="w-8 h-8 text-neutral-400" />
                  </div>
                  <p className="text-neutral-500">No availability data for this date</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availability.available_slots.map((slot, idx) => {
                    const status = getSlotStatus(slot)
                    const config = getSlotBadge(status)
                    const Icon = config.icon
                    const isSelected = selectedSlot?.start_time === slot.start_time
                    const isDisabled = status !== 'available'

                    return (
                      <button
                        key={idx}
                        onClick={() => !isDisabled && setSelectedSlot(slot)}
                        disabled={isDisabled}
                        className={`
                          relative p-4 rounded-xl border-2 transition-all duration-200 text-left
                          ${isSelected 
                            ? 'border-emerald-500 bg-emerald-50 shadow-md' 
                            : isDisabled 
                              ? 'border-neutral-200 bg-neutral-50 cursor-not-allowed opacity-60'
                              : 'border-neutral-200 hover:border-neutral-400 hover:shadow-sm cursor-pointer'
                          }
                        `}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className={`w-4 h-4 ${isSelected ? 'text-emerald-600' : 'text-neutral-400'}`} />
                              <span className={`font-semibold ${isSelected ? 'text-emerald-900' : 'text-neutral-900'}`}>
                                {dayjs(slot.start_time).tz(IST_TIMEZONE).format('h:mm A')} - {dayjs(slot.end_time).tz(IST_TIMEZONE).format('h:mm A')}
                              </span>
                            </div>
                            <div className="text-xs text-neutral-500">IST</div>
                          </div>
                          <Badge className={`${config.className} border shrink-0`}>
                            <Icon className="w-3 h-3 mr-1" />
                            {config.label}
                          </Badge>
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Alternative Suggestions */}
              {(alternativeResources.length > 0 || alternativeSlots.length > 0) && (
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-amber-900 mb-2">Alternative Suggestions</p>
                      
                      {alternativeResources.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm text-amber-800 mb-2">Similar resources available:</p>
                          <div className="flex flex-wrap gap-2">
                            {alternativeResources.map(alt => (
                              <Button
                                key={alt.id}
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const resource = resources.find(r => r.id === alt.id)
                                  if (resource) setSelectedResource(resource)
                                  setAlternativeResources([])
                                  setAlternativeSlots([])
                                }}
                                className="border-amber-300 text-amber-900 hover:bg-amber-100"
                              >
                                {alt.name}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {alternativeSlots.length > 0 && (
                        <div>
                          <p className="text-sm text-amber-800 mb-2">Other available slots:</p>
                          <div className="grid grid-cols-2 gap-2">
                            {alternativeSlots.slice(0, 4).map((slot, idx) => (
                              <Button
                                key={idx}
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedSlot(slot)
                                  setAlternativeSlots([])
                                }}
                                className="border-amber-300 text-amber-900 hover:bg-amber-100 text-xs"
                              >
                                {dayjs(slot.start_time).tz(IST_TIMEZONE).format('h:mm A')} - {dayjs(slot.end_time).tz(IST_TIMEZONE).format('h:mm A')}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default BookingPage