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
  Lightbulb,
  ArrowRight
} from 'lucide-react'
import { toast } from 'sonner'
import { Breadcrumbs } from '../components/Breadcrumbs'
import { Skeleton } from '@/components/ui/skeleton'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import isBetween from 'dayjs/plugin/isBetween'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'

dayjs.extend(utc)
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
  start_time: string
  end_time: string
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
  },
  {
    type: 'phone' as const,
    title: 'Phones',
    icon: Smartphone,
    description: 'Mobile devices for testing',
  },
  {
    type: 'laptop' as const,
    title: 'Laptops',
    icon: Laptop,
    description: 'Portable workstations',
  },
  {
    type: 'turf' as const,
    title: 'Turf',
    icon: Sprout,
    description: 'Outdoor recreational space',
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
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time
      })

      toast.success('Booking request submitted! Waiting for admin approval.')
      navigate('/dashboard/employee')
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to create booking'

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

  const now = dayjs.utc()
  const isToday = dayjs(selectedDate).isSame(now, 'day')

  const categorizedSlots = slots.reduce((acc, slot) => {
    const slotStart = dayjs.utc(slot.start_time)
    const isPast = isToday && slotStart.isBefore(now)
    if (isPast) acc.past.push(slot)
    else if (slot.available) acc.available.push(slot)
    else acc.booked.push(slot)
    return acc
  }, { available: [] as TimeSlot[], booked: [] as TimeSlot[], past: [] as TimeSlot[] })

  const availableCount = categorizedSlots.available.length
  const bookedCount = categorizedSlots.booked.length
  const pastCount = categorizedSlots.past.length

  // Format time in UTC - readable format
  const formatTime = (timeString: string) => {
    return dayjs.utc(timeString).format('h:mm A')
  }

  // Compact Slot card component
  const SlotCard = ({ 
    slot, 
    type, 
    isSelected = false, 
    onClick 
  }: { 
    slot: TimeSlot
    type: 'available' | 'booked' | 'past' | 'selected'
    isSelected?: boolean
    onClick?: () => void 
  }) => {
    const baseStyles = "relative p-3 rounded-xl border transition-all duration-200 group"
    
    const typeStyles = {
      available: `bg-neutral-50 border-neutral-200 hover:border-neutral-400 hover:shadow-md hover:bg-neutral-100 cursor-pointer`,
      selected: `bg-gradient-to-br from-emerald-500 to-emerald-600 border-emerald-500 shadow-lg shadow-emerald-200 cursor-pointer`,
      booked: `bg-gradient-to-br from-red-50 to-red-100 border-red-300 opacity-80 cursor-not-allowed`,
      past: `bg-neutral-100 border-neutral-200 opacity-50 cursor-not-allowed`
    }

    const actualType = isSelected ? 'selected' : type

    return (
      <div
        onClick={type === 'available' ? onClick : undefined}
        className={`${baseStyles} ${typeStyles[actualType]}`}
      >
        <div className="flex flex-col items-center gap-1.5">
          {/* Time display */}
          <div className="text-center">
            <div className={`font-semibold text-xs ${
              actualType === 'selected' ? 'text-white' : 
              actualType === 'booked' ? 'text-red-700' : 'text-neutral-800'
            }`}>
              {formatTime(slot.start_time)}
            </div>
            <div className={`flex items-center justify-center gap-1 my-0.5 ${
              actualType === 'selected' ? 'text-white/70' : 
              actualType === 'booked' ? 'text-red-400' : 'text-neutral-400'
            }`}>
              <ArrowRight className="w-3 h-3" />
            </div>
            <div className={`font-medium text-xs ${
              actualType === 'selected' ? 'text-white/90' : 
              actualType === 'booked' ? 'text-red-600' : 'text-neutral-600'
            }`}>
              {formatTime(slot.end_time)}
            </div>
          </div>

          {/* Duration badge */}
          <div className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
            actualType === 'selected' ? 'bg-white/20 text-white' :
            actualType === 'booked' ? 'bg-red-200 text-red-700' :
            actualType === 'available' ? 'bg-neutral-200 text-neutral-600' : 
            'bg-neutral-200 text-neutral-500'
          }`}>
            {duration === 0.5 ? '30m' : '1hr'}
          </div>

          {/* Status indicator */}
          {actualType === 'booked' && (
            <Badge variant="secondary" className="text-[10px] bg-red-100 text-red-700 border-0 px-1.5 py-0">
              Blocked
            </Badge>
          )}
          {actualType === 'past' && (
            <Badge variant="secondary" className="text-[10px] bg-neutral-200 text-neutral-500 border-0 px-1.5 py-0">
              Past
            </Badge>
          )}
          {isSelected && (
            <div className="flex items-center gap-0.5 text-white text-[10px] font-medium">
              <CheckCircle className="w-3 h-3" />
              Selected
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Breadcrumbs
        items={[
          { label: 'Employee Dashboard', href: '/dashboard/employee' },
          { label: 'Book Resource' }
        ]}
      />

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-neutral-900 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          Book a Resource
        </h1>
        <p className="text-neutral-500">
          Select a resource type and time slot for your booking
        </p>
      </div>

      {step !== 'category' && (
        <Button
          variant="outline"
          onClick={handleBack}
          className="mb-6 hover:bg-neutral-50 border-neutral-200 text-neutral-700"
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
                className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-neutral-200 hover:border-neutral-400 bg-white"
                onClick={() => handleCategorySelect(category.type)}
              >
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-20 h-20 bg-neutral-950 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                  <CardTitle className="text-xl text-neutral-900">
                    {category.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-neutral-500">
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
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">
            Select {resourceCategories.find(c => c.type === selectedCategory)?.title}
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <Card key={i} className="border-neutral-200">
                  <CardHeader><Skeleton className="h-6 w-3/4 mb-2" /><Skeleton className="h-4 w-1/2" /></CardHeader>
                  <CardContent><Skeleton className="h-20 w-full" /></CardContent>
                </Card>
              ))}
            </div>
          ) : resources.length === 0 ? (
            <Card className="text-center py-12 border-neutral-200">
              <CardContent>
                <AlertCircle className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">No resources available</h3>
                <p className="text-neutral-500">There are no active resources in this category.</p>
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
                    className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-neutral-200 hover:border-neutral-400 bg-white"
                    onClick={() => handleResourceSelect(resource)}
                  >
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-neutral-900 rounded-xl flex items-center justify-center shrink-0">
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg text-neutral-900">{resource.name}</CardTitle>
                          <p className="text-sm text-neutral-500 flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {resource.location}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {resource.description && (
                        <p className="text-sm text-neutral-500 mb-3">{resource.description}</p>
                      )}
                      <div className="bg-neutral-50 rounded-lg p-3 space-y-1 border border-neutral-100">
                        {resource.resource_type === 'meeting-room' && resource.properties?.capacity && (
                          <div className="flex justify-between text-sm">
                            <span className="text-neutral-500">Capacity</span>
                            <span className="font-medium text-neutral-900">{resource.properties.capacity} people</span>
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
                            <span className="text-neutral-500">Model</span>
                            <span className="font-medium text-neutral-900">
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
          <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-sm border-neutral-200 bg-white">
              <CardHeader className="bg-neutral-50 border-b border-neutral-100">
                <CardTitle className="text-lg text-neutral-900 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-neutral-500" />
                  Select Date & Duration
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-5">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-neutral-700">Date</label>
                  {/* Enhanced Calendar Container */}
                  <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      disabled={isDateDisabled}
                      className="w-full! p-0"
                      classNames={{
                        months: "flex flex-col w-full",
                        month: "space-y-4 w-full",
                        caption: "flex justify-center pt-4 pb-2 relative items-center",
                        caption_label: "text-base font-semibold text-neutral-900",
                        nav: "space-x-1 flex items-center",
                        nav_button: "h-9 w-9 bg-transparent p-0 opacity-70 hover:opacity-100 hover:bg-neutral-100 rounded-lg transition-colors inline-flex items-center justify-center",
                        nav_button_previous: "absolute left-2",
                        nav_button_next: "absolute right-2",
                        table: "w-full border-collapse",
                        head_row: "flex w-full",
                        head_cell: "text-neutral-500 rounded-md flex-1 font-medium text-sm py-3 text-center",
                        row: "flex w-full mt-1",
                        cell: "relative p-0.5 text-center text-sm focus-within:relative focus-within:z-20 flex-1",
                        day: "h-11 w-full p-0 font-normal rounded-lg hover:bg-neutral-100 transition-colors inline-flex items-center justify-center",
                        day_range_end: "day-range-end",
                        day_selected: "bg-neutral-900 text-white hover:bg-neutral-800 hover:text-white focus:bg-neutral-900 focus:text-white rounded-lg font-semibold",
                        day_today: "bg-emerald-50 text-emerald-700 font-semibold border-2 border-emerald-300",
                        day_outside: "text-neutral-300 opacity-50",
                        day_disabled: "text-neutral-300 opacity-40 cursor-not-allowed hover:bg-transparent",
                        day_hidden: "invisible",
                      }}
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <label className="text-sm font-medium text-neutral-700">Duration</label>
                  <Select value={String(duration)} onValueChange={(value) => setDuration(Number(value) as 0.5 | 1)}>
                    <SelectTrigger className="border-neutral-200 h-12 text-base bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent 
                      className="bg-white border border-neutral-200 shadow-lg"
                      position="popper"
                      side="bottom"
                      sideOffset={4}
                    >
                      <SelectItem value="0.5" className="text-base py-3 cursor-pointer hover:bg-neutral-50">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-neutral-500" />
                          30 minutes
                        </div>
                      </SelectItem>
                      <SelectItem value="1" className="text-base py-3 cursor-pointer hover:bg-neutral-50">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-neutral-500" />
                          1 hour
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Booking Hours</p>
                      <p className="text-xs text-blue-700 mt-1">
                        Mon-Fri, 9 AM - 6 PM . Weekends and holidays are blocked.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-neutral-200 bg-white">
              <CardHeader className="bg-neutral-50 border-b border-neutral-100">
                <CardTitle className="text-lg text-neutral-900 flex items-center gap-2">
                  <DoorOpen className="w-5 h-5 text-neutral-500" />
                  Selected Resource
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-neutral-900 rounded-xl flex items-center justify-center">
                    {(() => {
                      const category = resourceCategories.find(c => c.type === selectedCategory)
                      const Icon = category?.icon || DoorOpen
                      return <Icon className="w-6 h-6 text-white" />
                    })()}
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900">{selectedResource.name}</p>
                    <p className="text-sm text-neutral-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {selectedResource.location}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Legend Card */}
            <Card className="shadow-sm border-neutral-200 bg-white">
              <CardHeader className="bg-neutral-50 border-b border-neutral-100 py-3">
                <CardTitle className="text-sm text-neutral-700">Slot Legend</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-neutral-400" />
                    <span className="text-sm text-neutral-600">Available</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-sm text-neutral-600">Selected</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-sm text-neutral-600">Blocked</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-neutral-300" />
                    <span className="text-sm text-neutral-600">Past</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="shadow-sm border-neutral-200 bg-white">
              <CardHeader className="bg-neutral-50 border-b border-neutral-100">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2 text-neutral-900">
                      <Clock className="w-6 h-6 text-neutral-500" />
                      Available Time Slots
                    </CardTitle>
                    <CardDescription className="mt-2 text-neutral-500 flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      {dayjs(selectedDate).format('dddd, MMMM D, YYYY')}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge className="bg-neutral-100 text-neutral-700 border border-neutral-200 px-3 py-1">
                      {availableCount} Available
                    </Badge>
                    <Badge className="bg-red-100 text-red-700 border border-red-200 px-3 py-1">
                      {bookedCount} Blocked
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {loadingSlots ? (
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                      <Skeleton key={i} className="h-24 w-full rounded-xl" />
                    ))}
                  </div>
                ) : slots.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <XCircle className="w-8 h-8 text-neutral-400" />
                    </div>
                    <h3 className="text-lg font-medium text-neutral-900 mb-2">No slots available</h3>
                    <p className="text-neutral-500 max-w-sm mx-auto">Try selecting a different date or duration.</p>
                  </div>
                ) : (
                  <>
                    {/* Stats Overview - Compact */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-neutral-700">{availableCount}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">Available</p>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                        <p className="text-2xl font-bold text-red-600">{bookedCount}</p>
                        <p className="text-xs text-red-500 mt-0.5">Blocked</p>
                      </div>
                      {isToday && (
                        <div className="bg-neutral-100 border border-neutral-200 rounded-xl p-3 text-center">
                          <p className="text-2xl font-bold text-neutral-500">{pastCount}</p>
                          <p className="text-xs text-neutral-400 mt-0.5">Past</p>
                        </div>
                      )}
                    </div>

                    {/* Available Slots */}
                    {availableCount > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-neutral-500" /> 
                          Available Slots
                          <span className="ml-auto text-xs font-normal text-neutral-400">Click to select</span>
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {categorizedSlots.available.map((slot, index) => (
                            <SlotCard
                              key={index}
                              slot={slot}
                              type="available"
                              isSelected={selectedSlot?.start_time === slot.start_time}
                              onClick={() => setSelectedSlot(slot)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Booked/Blocked Slots */}
                    {bookedCount > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
                          <XCircle className="w-4 h-4" /> 
                          Blocked Slots
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {categorizedSlots.booked.map((slot, index) => (
                            <SlotCard key={index} slot={slot} type="booked" />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Past Slots */}
                    {isToday && pastCount > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-neutral-500 mb-3 flex items-center gap-2">
                          <Clock className="w-4 h-4" /> 
                          Past Slots
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {categorizedSlots.past.map((slot, index) => (
                            <SlotCard key={index} slot={slot} type="past" />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Booking Summary */}
                    {selectedSlot && (
                      <div className="bg-linear-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-2xl p-5 mt-6">
                        <h4 className="font-semibold text-emerald-800 mb-4 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                          Booking Summary
                        </h4>
                        <div className="grid grid-cols-2 gap-3 mb-5">
                          <div className="bg-white rounded-xl p-3 border border-emerald-100">
                            <p className="text-neutral-500 text-xs mb-1">Resource</p>
                            <p className="font-semibold text-neutral-900">{selectedResource.name}</p>
                          </div>
                          <div className="bg-white rounded-xl p-3 border border-emerald-100">
                            <p className="text-neutral-500 text-xs mb-1">Date</p>
                            <p className="font-semibold text-neutral-900">{dayjs(selectedDate).format('MMM D, YYYY')}</p>
                          </div>
                          <div className="bg-white rounded-xl p-3 border border-emerald-100">
                            <p className="text-neutral-500 text-xs mb-1">Time Slot</p>
                            <p className="font-semibold text-neutral-900 text-sm">
                              {formatTime(selectedSlot.start_time)} - {formatTime(selectedSlot.end_time)}
                            </p>
                          </div>
                          <div className="bg-white rounded-xl p-3 border border-emerald-100">
                            <p className="text-neutral-500 text-xs mb-1">Duration</p>
                            <p className="font-semibold text-neutral-900">{duration === 0.5 ? '30 minutes' : '1 hour'}</p>
                          </div>
                        </div>
                        <Button
                          onClick={handleBooking}
                          disabled={isBooking}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base font-semibold rounded-xl shadow-md"
                        >
                          {isBooking ? (
                            <>
                              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Submitting Request...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-5 h-5 mr-2" />
                              Confirm Booking
                            </>
                          )}
                        </Button>
                        <p className="text-xs text-emerald-700 mt-3 text-center flex items-center justify-center gap-1">
                          <Info className="w-3 h-3" />
                          Your request will be sent to admin for approval
                        </p>
                      </div>
                    )}

                    {availableCount === 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                        <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-amber-900">No available slots</p>
                          <p className="text-xs text-amber-700 mt-1">Try a different date or duration.</p>
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
        <DialogContent className="max-w-2xl bg-white border border-neutral-200">
          <DialogHeader>
            <DialogTitle className="text-xl text-amber-700 flex items-center gap-2">
              <AlertCircle className="w-6 h-6" />
              Alternative Options Available
            </DialogTitle>
            <DialogDescription className="text-neutral-500">
              The selected slot is no longer available. Here are some alternatives:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            {alternatives.resources.length > 0 && (
              <div>
                <h4 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                  <DoorOpen className="w-5 h-5 text-neutral-500" />
                  Similar Resources
                </h4>
                <div className="space-y-2">
                  {alternatives.resources.map((res) => (
                    <div key={res.id} className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 hover:border-neutral-300 transition-colors cursor-pointer">
                      <p className="font-medium text-neutral-900">{res.name}</p>
                      <p className="text-sm text-neutral-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {res.location}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {alternatives.slots.length > 0 && (
              <div>
                <h4 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-neutral-500" />
                  Available Time Slots
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {alternatives.slots.map((slot, idx) => (
                    <div key={idx} className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center hover:border-emerald-400 transition-colors cursor-pointer">
                      <p className="text-sm font-semibold text-emerald-700">{formatTime(slot.start)}</p>
                      <p className="text-xs text-emerald-600">{formatTime(slot.end)}</p>
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