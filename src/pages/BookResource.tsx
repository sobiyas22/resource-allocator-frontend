import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DoorOpen,
  Smartphone,
  Laptop,
  Sprout,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Lightbulb
} from 'lucide-react'
import { toast } from 'sonner'
import { Breadcrumbs } from '../components/Breadcrumbs'
import { Skeleton } from '@/components/ui/skeleton'
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'

dayjs.extend(isBetween)
dayjs.extend(isSameOrAfter)

interface Resource {
  id: number
  name: string
  resource_type: string
  location: string
  description?: string
  is_active: boolean
  properties: Record<string, any>
}

interface AvailabilityResponse {
  resource_id: number
  resource_name: string
  query_date: string
  slot_duration_hours: number
  available_slots: TimeSlot[]
}

interface TimeSlot {
  start: string
  end: string
  available: boolean
}

interface AlternativeResource {
  id: number
  name: string
  resource_type: string
  location: string
}

interface AlternativeSlot {
  start: string
  end: string
}

type ResourceType = 'meeting_room' | 'phone' | 'laptop' | 'turf'

const resourceCategories = [
  {
    type: 'meeting_room' as const,
    title: 'Meeting Rooms',
    icon: DoorOpen,
    description: 'Conference spaces with projectors',
    gradient: 'from-indigo-500 to-purple-500'
  },
  {
    type: 'phone' as const,
    title: 'Phones',
    icon: Smartphone,
    description: 'Mobile devices for testing',
    gradient: 'from-emerald-500 to-teal-500'
  },
  {
    type: 'laptop' as const,
    title: 'Laptops',
    icon: Laptop,
    description: 'Portable workstations',
    gradient: 'from-amber-500 to-orange-500'
  },
  {
    type: 'turf' as const,
    title: 'Turf',
    icon: Sprout,
    description: 'Outdoor recreational space',
    gradient: 'from-green-500 to-lime-500'
  }
]

const BookResource: React.FC = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState<'category' | 'resource' | 'slots'>('category')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [duration, setDuration] = useState<0.5 | 1>(1)
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [isBooking, setIsBooking] = useState(false)
  const [holidays, setHolidays] = useState<string[]>([])
  const [showAlternatives, setShowAlternatives] = useState(false)
  const [alternatives, setAlternatives] = useState<{
    resources: AlternativeResource[]
    slots: AlternativeSlot[]
  }>({ resources: [], slots: [] })

  useEffect(() => {
    fetchHolidays()
  }, [])

  async function fetchHolidays() {
    try {
      // const res = await api.get<{ holidays: { holiday_date: string }[] }>('/holidays')
      // setHolidays(res.holidays.map(h => h.holiday_date))
      setHolidays([])
    } catch (err) {
      console.error('Failed to fetch holidays:', err)
    }
  }

  async function fetchResourcesByType(type: string) {
    setLoading(true)
    try {
      const apiType = type === 'meeting_room' ? 'meeting-room' : type
      const res = await api.get<{ resources: Resource[] }>(`/resources?resource_type=${apiType}&is_active=true`)
      setResources(res.resources || [])
    } catch (err: any) {
      toast.error('Failed to load resources')
      setResources([])
    } finally {
      setLoading(false)
    }
  }

  async function fetchAvailableSlots() {
    if (!selectedResource) return

    setLoadingSlots(true)
    try {
      const dateStr = dayjs(selectedDate).format('YYYY-MM-DD')
      const res = await api.get<AvailabilityResponse>(
        `/resources/${selectedResource.id}/availability?date=${dateStr}&duration=${duration}`
      )
      
      // Backend returns: { resource_id, resource_name, query_date, slot_duration_hours, available_slots }
      setSlots(res.available_slots || [])
    } catch (err: any) {
      toast.error('Failed to load available slots')
      setSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  useEffect(() => {
    if (selectedResource && selectedDate) {
      fetchAvailableSlots()
    }
  }, [selectedResource, selectedDate, duration])

  function handleCategorySelect(type: string) {
    setSelectedCategory(type)
    setStep('resource')
    fetchResourcesByType(type)
  }

  function handleResourceSelect(resource: Resource) {
    setSelectedResource(resource)
    setStep('slots')
  }

  function handleBack() {
    if (step === 'resource') {
      setStep('category')
      setSelectedCategory(null)
      setResources([])
    } else if (step === 'slots') {
      setStep('resource')
      setSelectedResource(null)
      setSlots([])
      setSelectedSlot(null)
      setAlternatives({ resources: [], slots: [] })
      setShowAlternatives(false)
    }
  }

  async function handleBooking() {
    if (!selectedSlot || !selectedResource) return

    setIsBooking(true)
    try {
      toast.success('Creating booking request...')

      await api.post('/bookings', {
        resource_id: selectedResource.id,
        start_time: selectedSlot.start,
        end_time: selectedSlot.end
      })

      toast.success('Booking request submitted! Waiting for admin approval.')
      navigate('/dashboard/employee/bookings')
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to create booking'
      
      // Backend returns alternatives on conflict
      if (err.response?.data?.suggestions) {
        const { available_resources, available_slots } = err.response.data.suggestions
        setAlternatives({
          resources: available_resources || [],
          slots: available_slots || []
        })
        setShowAlternatives(true)
        toast.error('This slot is no longer available. Check alternatives below.')
      } else if (errorMsg.includes('overlap') || errorMsg.includes('booked')) {
        toast.error('This slot is no longer available. Please select another.')
        fetchAvailableSlots()
      } else {
        toast.error(errorMsg)
      }
    } finally {
      setIsBooking(false)
    }
  }

  const isDateDisabled = (date: Date) => {
    const day = date.getDay()
    if (day === 0 || day === 6) return true
    
    const dateStr = dayjs(date).format('YYYY-MM-DD')
    if (holidays.includes(dateStr)) return true
    
    if (dayjs(date).isBefore(dayjs(), 'day')) return true
    
    return false
  }

  const now = dayjs()
  const isToday = dayjs(selectedDate).isSame(now, 'day')
  
  // Categorize slots
  const categorizedSlots = slots.reduce((acc, slot) => {
    const slotStart = dayjs(slot.start)
    const isPast = isToday && slotStart.isBefore(now)
    
    if (isPast) {
      acc.past.push(slot)
    } else if (slot.available) {
      acc.available.push(slot)
    } else {
      acc.booked.push(slot)
    }
    
    return acc
  }, { available: [] as TimeSlot[], booked: [] as TimeSlot[], past: [] as TimeSlot[] })

  const availableCount = categorizedSlots.available.length
  const bookedCount = categorizedSlots.booked.length
  const pastCount = categorizedSlots.past.length

  return (
    <div className="max-w-6xl mx-auto">
      <Breadcrumbs 
        items={[
          { label: 'Employee Dashboard', href: '/dashboard/employee' },
          { label: 'Book Resource' }
        ]} 
      />

      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          Book a Resource
        </h1>
        <p className="text-gray-600">
          Select a resource type and time slot for your booking
        </p>
      </div>

      {step !== 'category' && (
        <Button
          variant="outline"
          onClick={handleBack}
          className="mb-6 hover:bg-indigo-50 border-indigo-200"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      )}

      {/* Step 1: Category Selection */}
      {step === 'category' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {resourceCategories.map((category) => {
            const Icon = category.icon
            return (
              <Card
                key={category.type}
                className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-indigo-300"
                onClick={() => handleCategorySelect(category.type)}
              >
                <CardHeader className="text-center pb-4">
                  <div className={`mx-auto w-20 h-20 bg-gradient-to-br ${category.gradient} rounded-2xl flex items-center justify-center mb-4 shadow-lg`}>
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                  <CardTitle className="text-xl text-gray-900">
                    {category.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-gray-600">
                    {category.description}
                  </CardDescription>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Step 2: Resource Selection */}
      {step === 'resource' && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Select {resourceCategories.find(c => c.type === selectedCategory)?.title}
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : resources.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No resources available
                </h3>
                <p className="text-gray-600">
                  There are no active resources in this category.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.map((resource) => {
                const category = resourceCategories.find(c => c.type === selectedCategory)
                const Icon = category?.icon || DoorOpen
                
                return (
                  <Card
                    key={resource.id}
                    className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-indigo-300"
                    onClick={() => handleResourceSelect(resource)}
                  >
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <div className={`w-12 h-12 bg-gradient-to-br ${category?.gradient} rounded-xl flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg text-gray-900">{resource.name}</CardTitle>
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {resource.location}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {resource.description && (
                        <p className="text-sm text-gray-600 mb-3">{resource.description}</p>
                      )}
                      <div className="bg-indigo-50 rounded-lg p-3 space-y-1">
                        {resource.resource_type === 'meeting-room' && resource.properties?.capacity && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Capacity</span>
                            <span className="font-medium text-gray-900">{resource.properties.capacity} people</span>
                          </div>
                        )}
                        {resource.resource_type === 'meeting-room' && resource.properties?.has_projector && (
                          <div className="text-sm text-emerald-600 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Projector available
                          </div>
                        )}
                        {(resource.resource_type === 'phone' || resource.resource_type === 'laptop') && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Model</span>
                            <span className="font-medium text-gray-900">
                              {resource.properties?.brand} {resource.properties?.model}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Slot Selection */}
      {step === 'slots' && selectedResource && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Calendar & Settings */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-lg border-indigo-200">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                <CardTitle className="text-lg">Select Date & Duration</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Date</label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    disabled={isDateDisabled}
                    className="rounded-md border"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Duration</label>
                  <Select
                    value={String(duration)}
                    onValueChange={(value) => setDuration(Number(value) as 0.5 | 1)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.5">30 minutes</SelectItem>
                      <SelectItem value="1">1 hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-800">
                      Bookings are available Mon-Fri, 9 AM - 6 PM. Weekends and holidays are blocked.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Selected Resource Info */}
            <Card className="shadow-lg border-indigo-200">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                <CardTitle className="text-lg">Selected Resource</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-semibold text-gray-900">{selectedResource.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-medium text-gray-900 flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-indigo-600" />
                      {selectedResource.location}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Time Slots */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-indigo-200">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="w-5 h-5 text-indigo-600" />
                      Time Slots - {dayjs(selectedDate).format('MMMM D, YYYY')}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Click on an available slot to select it
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {loadingSlots ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : slots.length === 0 ? (
                  <div className="text-center py-12">
                    <XCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No slots available
                    </h3>
                    <p className="text-gray-600">
                      Try selecting a different date or duration.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-emerald-700">{availableCount}</p>
                        <p className="text-xs text-emerald-600 mt-1">Available</p>
                      </div>
                      <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-rose-700">{bookedCount}</p>
                        <p className="text-xs text-rose-600 mt-1">Booked</p>
                      </div>
                      {isToday && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-gray-700">{pastCount}</p>
                          <p className="text-xs text-gray-600 mt-1">Past</p>
                        </div>
                      )}
                    </div>

                    {/* Available Slots */}
                    {availableCount > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-emerald-700 mb-3 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Available Slots ({availableCount})
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {categorizedSlots.available.map((slot, index) => {
                            const isSelected = selectedSlot?.start === slot.start
                            
                            return (
                              <button
                                key={index}
                                onClick={() => setSelectedSlot(slot)}
                                className={`
                                  p-4 rounded-xl border-2 transition-all duration-200
                                  ${isSelected 
                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-indigo-500 shadow-lg scale-105' 
                                    : 'bg-white border-emerald-200 hover:border-indigo-400 hover:bg-indigo-50 hover:scale-105'
                                  }
                                `}
                              >
                                <div className="flex flex-col items-center gap-1">
                                  <Clock className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-emerald-600'}`} />
                                  <span className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                                    {dayjs(slot.start).format('h:mm A')}
                                  </span>
                                  <span className={`text-xs ${isSelected ? 'text-white/90' : 'text-gray-500'}`}>
                                    {duration === 0.5 ? '30 min' : '1 hour'}
                                  </span>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Booked Slots */}
                    {bookedCount > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-rose-700 mb-3 flex items-center gap-2">
                          <XCircle className="w-4 h-4" />
                          Booked Slots ({bookedCount})
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {categorizedSlots.booked.map((slot, index) => (
                            <div
                              key={index}
                              className="p-4 rounded-xl border-2 bg-rose-50 border-rose-200 opacity-60 cursor-not-allowed"
                            >
                              <div className="flex flex-col items-center gap-1">
                                <Clock className="w-5 h-5 text-rose-400" />
                                <span className="font-semibold text-sm text-gray-700">
                                  {dayjs(slot.start).format('h:mm A')}
                                </span>
                                <Badge variant="secondary" className="text-xs bg-rose-200 text-rose-700">
                                  Booked
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Past Slots (Today only) */}
                    {isToday && pastCount > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Past Slots ({pastCount})
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {categorizedSlots.past.map((slot, index) => (
                            <div
                              key={index}
                              className="p-4 rounded-xl border-2 bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed"
                            >
                              <div className="flex flex-col items-center gap-1">
                                <Clock className="w-5 h-5 text-gray-400" />
                                <span className="font-semibold text-sm text-gray-600">
                                  {dayjs(slot.start).format('h:mm A')}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  Past
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Booking Summary */}
                    {selectedSlot && (
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-6 mt-6">
                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                          Booking Summary
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Resource</span>
                            <span className="font-medium text-gray-900">{selectedResource.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Date</span>
                            <span className="font-medium text-gray-900">
                              {dayjs(selectedDate).format('MMMM D, YYYY')}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Time</span>
                            <span className="font-medium text-gray-900">
                              {dayjs(selectedSlot.start).format('h:mm A')} - {dayjs(selectedSlot.end).format('h:mm A')}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Duration</span>
                            <span className="font-medium text-gray-900">{duration === 0.5 ? '30 minutes' : '1 hour'}</span>
                          </div>
                        </div>
                        <Button
                          onClick={handleBooking}
                          disabled={isBooking}
                          className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-12"
                        >
                          {isBooking ? (
                            <>
                              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Submitting Request...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-5 h-5 mr-2" />
                              Submit Booking Request
                            </>
                          )}
                        </Button>
                        <p className="text-xs text-gray-600 mt-3 text-center">
                          Your request will be sent to admin for approval
                        </p>
                      </div>
                    )}

                    {/* No available slots message */}
                    {availableCount === 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                        <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-amber-900">No available slots for this date</p>
                          <p className="text-xs text-amber-700 mt-1">
                            Try selecting a different date or duration to find available slots.
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Alternatives Dialog */}
      <Dialog open={showAlternatives} onOpenChange={setShowAlternatives}>
        <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-xl text-amber-600">Alternative Options Available</DialogTitle>
            <DialogDescription>
              The selected slot is no longer available. Here are some alternatives:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            {alternatives.resources.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Similar Resources</h4>
                <div className="space-y-2">
                  {alternatives.resources.map((res) => (
                    <div key={res.id} className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                      <p className="font-medium text-gray-900">{res.name}</p>
                      <p className="text-sm text-gray-600">{res.location}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {alternatives.slots.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Available Time Slots</h4>
                <div className="grid grid-cols-3 gap-2">
                  {alternatives.slots.map((slot, idx) => (
                    <div key={idx} className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-center">
                      <p className="text-sm font-medium text-emerald-700">
                        {dayjs(slot.start).format('h:mm A')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default BookResource