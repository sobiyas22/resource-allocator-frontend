import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Calendar, Smartphone, Laptop, Sprout, MapPin, Users, Clock, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'

interface Resource {
  id: number
  name: string
  resource_type: 'meeting-room' | 'phone' | 'laptop' | 'turf'
  location?: string
  is_active: boolean
  properties?: {
    capacity?: number
    model?: string
    os?: string
    projector?: boolean
  }
}

interface TimeSlot {
  start_time: string
  end_time: string
  available: boolean
}

interface AvailabilityResponse {
  resource_id: number
  resource_name: string
  query_date: string
  slot_duration_hours: number
  available_slots: TimeSlot[]
}

const resourceCategories = [
  {
    type: 'meeting-room' as const,
    title: 'Meeting Rooms',
    icon: Calendar,
    description: 'Conference and meeting spaces',
    color: 'from-gray-600 to-gray-700'
  },
  {
    type: 'phone' as const,
    title: 'Phones',
    icon: Smartphone,
    description: 'Mobile devices',
    color: 'from-gray-700 to-gray-800'
  },
  {
    type: 'laptop' as const,
    title: 'Laptops',
    icon: Laptop,
    description: 'Portable workstations',
    color: 'from-gray-800 to-gray-900'
  },
  {
    type: 'turf' as const,
    title: 'Turf',
    icon: Sprout,
    description: 'Outdoor space',
    color: 'from-gray-500 to-gray-600'
  }
]

const BookResource: React.FC = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState<'category' | 'resource' | 'slots'>('category')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [resources, setResources] = useState<Resource[]>([])
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null)
  const [selectedSlots, setSelectedSlots] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [conflictDialog, setConflictDialog] = useState(false)
  const [conflictData, setConflictData] = useState<any>(null)

  async function fetchResources(type: string) {
    setLoading(true)
    try {
      const res = await api.get<{ resources: Resource[] }>(`/resources?resource_type=${type}`)
      setResources(res.resources || [])
    } catch (err: any) {
      console.error('Failed to fetch resources:', err)
      setResources([])
    } finally {
      setLoading(false)
    }
  }

  async function fetchAvailability() {
    if (!selectedResource || !selectedDate) return
    setLoading(true)
    try {
      // Fetch for 0.5 hour (30 min) slots
      const res = await api.get<AvailabilityResponse>(
        `/resources/${selectedResource.id}/availability?date=${selectedDate}&duration=0.5`
      )
      setAvailability(res)
      setSelectedSlots([])
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Failed to fetch availability' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (step === 'slots' && selectedResource && selectedDate) {
      fetchAvailability()
    }
  }, [step, selectedResource, selectedDate])

  function handleCategorySelect(type: string) {
    setSelectedCategory(type)
    fetchResources(type)
    setStep('resource')
  }

  function handleResourceSelect(resource: Resource) {
    setSelectedResource(resource)
    setStep('slots')
  }

  function handleBack() {
    if (step === 'slots') {
      setStep('resource')
      setSelectedResource(null)
      setAvailability(null)
      setSelectedSlots([])
    } else if (step === 'resource') {
      setStep('category')
      setSelectedCategory(null)
      setResources([])
    }
  }

  function handleSlotClick(index: number) {
    if (!availability?.available_slots[index]?.available) return

    setSelectedSlots(prev => {
      // If already selected, deselect
      if (prev.includes(index)) {
        return prev.filter(i => i !== index)
      }

      // Check if this creates a continuous range
      if (prev.length === 0) {
        return [index]
      }

      const newSelection = [...prev, index].sort((a, b) => a - b)
      
      // Check if continuous
      let isContinuous = true
      for (let i = 1; i < newSelection.length; i++) {
        if (newSelection[i] !== newSelection[i - 1] + 1) {
          isContinuous = false
          break
        }
      }

      // If not continuous, deselect all and select only the new one
      if (!isContinuous) {
        return [index]
      }

      return newSelection
    })
  }

  function getSelectedTimeRange(): { start: string; end: string; duration: number } | null {
    if (!availability || selectedSlots.length === 0) return null

    const sortedSlots = [...selectedSlots].sort((a, b) => a - b)
    const firstSlot = availability.available_slots[sortedSlots[0]]
    const lastSlot = availability.available_slots[sortedSlots[sortedSlots.length - 1]]

    if (!firstSlot || !lastSlot) return null

    return {
      start: firstSlot.start_time,
      end: lastSlot.end_time,
      duration: selectedSlots.length * 0.5 // Each slot is 30 mins
    }
  }

  async function handleBooking() {
    const timeRange = getSelectedTimeRange()
    if (!timeRange || !selectedResource) return

    setBookingLoading(true)
    setMessage(null)
    try {
      await api.post('/bookings', {
        resource_id: selectedResource.id,
        start_time: timeRange.start,
        end_time: timeRange.end
      })
      setMessage({ type: 'success', text: 'Booking created successfully! Waiting for admin approval.' })
      setTimeout(() => {
        navigate('/dashboard/employee')
      }, 2000)
    } catch (err: any) {
      // Handle 422 conflict with suggestions
      if (err.message && err.message.includes('suggestions')) {
        try {
          const errorData = JSON.parse(err.message)
          setConflictData(errorData)
          setConflictDialog(true)
        } catch {
          setMessage({ type: 'error', text: err.message || 'Booking failed' })
        }
      } else {
        setMessage({ type: 'error', text: err.message || 'Failed to create booking' })
      }
    } finally {
      setBookingLoading(false)
    }
  }

  const selectedCategoryData = resourceCategories.find(c => c.type === selectedCategory)
  const timeRange = getSelectedTimeRange()

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          {step !== 'category' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="border-gray-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              Book Resource
            </h1>
            <p className="text-gray-600">
              {step === 'category' && 'Select a resource category'}
              {step === 'resource' && `Choose a ${selectedCategoryData?.title.toLowerCase()}`}
              {step === 'slots' && 'Select your time slots'}
            </p>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className={step === 'category' ? 'text-gray-900 font-semibold' : ''}>Category</span>
          <span>/</span>
          <span className={step === 'resource' ? 'text-gray-900 font-semibold' : ''}>Resource</span>
          <span>/</span>
          <span className={step === 'slots' ? 'text-gray-900 font-semibold' : ''}>Time Slots</span>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Step 1: Category Selection */}
      {step === 'category' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {resourceCategories.map((category) => {
            const Icon = category.icon
            
            return (
              <Card
                key={category.type}
                className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-gray-200"
                onClick={() => handleCategorySelect(category.type)}
              >
                <CardHeader className="text-center pb-4">
                  <div className={`mx-auto w-16 h-16 bg-linear-to-br ${category.color} rounded-2xl flex items-center justify-center mb-4 shadow-md`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl text-gray-900">
                    {category.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription>{category.description}</CardDescription>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Step 2: Resource Selection */}
      {step === 'resource' && (
        <div>
          <Card className="border-gray-200 shadow-lg">
            <CardHeader className="border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3">
                {selectedCategoryData && (
                  <>
                    <div className={`w-10 h-10 bg-linear-to-br ${selectedCategoryData.color} rounded-lg flex items-center justify-center`}>
                      <selectedCategoryData.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-gray-900">{selectedCategoryData.title}</CardTitle>
                      <CardDescription>Select a resource to check availability</CardDescription>
                    </div>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <div className="text-center py-12 text-gray-500">Loading resources...</div>
              ) : resources.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No resources available</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {resources.map((resource) => (
                    <Card
                      key={resource.id}
                      className="cursor-pointer hover:shadow-lg transition-all border-gray-200 hover:border-gray-900"
                      onClick={() => handleResourceSelect(resource)}
                    >
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">{resource.name}</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          {resource.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3 h-3" />
                              {resource.location}
                            </div>
                          )}
                          {resource.properties?.capacity && (
                            <div className="flex items-center gap-2">
                              <Users className="w-3 h-3" />
                              Capacity: {resource.properties.capacity}
                            </div>
                          )}
                          {resource.properties?.model && (
                            <div className="text-gray-600">
                              {resource.properties.model}
                            </div>
                          )}
                          {resource.properties?.os && (
                            <div className="text-gray-600">
                              OS: {resource.properties.os}
                            </div>
                          )}
                        </div>
                        <div className="mt-3">
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Available
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Slot Selection (BookMyShow Style) */}
      {step === 'slots' && selectedResource && (
        <div className="space-y-6">
          {/* Date Picker */}
          <Card className="border-gray-200 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-6">
                <div className="flex-1">
                  <Label htmlFor="booking_date" className="text-base font-semibold text-gray-900 mb-2 block">
                    Select Date
                  </Label>
                  <Input
                    id="booking_date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full"
                  />
                </div>
                <div className="flex-1">
                  <div className="text-base font-semibold text-gray-900 mb-2">Resource</div>
                  <div className="text-gray-900">{selectedResource.name}</div>
                  {selectedResource.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <MapPin className="w-3 h-3" />
                      {selectedResource.location}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Time Slots Grid */}
          <Card className="border-gray-200 shadow-lg">
            <CardHeader className="border-b border-gray-100 bg-gray-50">
              <CardTitle className="text-2xl text-gray-900">Available Time Slots</CardTitle>
              <CardDescription>
                Click on slots to select. Each slot is 30 minutes. Select continuous slots for longer duration.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <div className="text-center py-12 text-gray-500">Loading availability...</div>
              ) : !availability ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No availability data</p>
                </div>
              ) : (
                <div>
                  {/* Legend */}
                  <div className="flex items-center gap-6 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-green-500 rounded border-2 border-green-600"></div>
                      <span className="text-sm text-gray-700">Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-red-400 rounded border-2 border-red-500"></div>
                      <span className="text-sm text-gray-700">Booked</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-500 rounded border-2 border-blue-600"></div>
                      <span className="text-sm text-gray-700">Selected</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-300 rounded border-2 border-gray-400"></div>
                      <span className="text-sm text-gray-700">Past Time</span>
                    </div>
                  </div>

                  {/* Slots Grid */}
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                    {availability.available_slots.map((slot, index) => {
                      // Parse the date string properly
                      const startTime = new Date(slot.start_time)
                      const isPast = startTime < new Date()
                      const isSelected = selectedSlots.includes(index)
                      const isAvailable = slot.available && !isPast

                      // Format time safely
                      const timeString = !isNaN(startTime.getTime()) 
                        ? startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
                        : '--:--'

                      let bgColor = 'bg-gray-300 border-gray-400 cursor-not-allowed'
                      if (isPast) {
                        bgColor = 'bg-gray-300 border-gray-400 cursor-not-allowed'
                      } else if (isSelected) {
                        bgColor = 'bg-blue-500 border-blue-600 text-white cursor-pointer hover:bg-blue-600'
                      } else if (slot.available) {
                        bgColor = 'bg-green-500 border-green-600 text-white cursor-pointer hover:bg-green-600'
                      } else {
                        bgColor = 'bg-red-400 border-red-500 cursor-not-allowed'
                      }

                      return (
                        <div
                          key={index}
                          onClick={() => handleSlotClick(index)}
                          className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center transition-all ${bgColor} ${
                            isAvailable ? 'hover:scale-105' : ''
                          }`}
                        >
                          <div className="text-xs font-semibold">
                            {timeString}
                          </div>
                          <div className="text-[10px] opacity-80">
                            30m
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Selected Time Summary */}
                  {timeRange && (
                    <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold text-gray-700 mb-1">Selected Time</div>
                          <div className="flex items-center gap-3 text-gray-900">
                            <Clock className="w-5 h-5" />
                            <span className="font-semibold text-lg">
                              {new Date(timeRange.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(timeRange.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              {timeRange.duration} {timeRange.duration === 1 ? 'hour' : 'hours'}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          onClick={handleBooking}
                          disabled={bookingLoading}
                          className="bg-gray-800 hover:bg-gray-700 px-8 text-white cursor-pointer"
                        >
                          {bookingLoading ? 'Booking...' : 'Confirm Booking'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {selectedSlots.length === 0 && (
                    <div className="mt-6 text-center p-6 bg-gray-50 rounded-lg">
                      <p className="text-gray-600">Select time slots to create a booking</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Conflict Dialog */}
      <Dialog open={conflictDialog} onOpenChange={setConflictDialog}>
        <DialogContent className="bg-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-red-600 flex items-center gap-2">
              <AlertCircle className="w-6 h-6" />
              Booking Conflict
            </DialogTitle>
            <DialogDescription>
              This time slot is already booked. Here are some alternatives:
            </DialogDescription>
          </DialogHeader>

          {conflictData && (
            <div className="space-y-4 mt-4">
              {/* Error Messages */}
              {conflictData.errors && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  {conflictData.errors.map((error: string, idx: number) => (
                    <p key={idx} className="text-red-800 text-sm">{error}</p>
                  ))}
                </div>
              )}

              {/* Alternative Resources */}
              {conflictData.suggestions?.available_resources && conflictData.suggestions.available_resources.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Alternative Resources</h4>
                  <div className="space-y-2">
                    {conflictData.suggestions.available_resources.map((resource: any) => (
                      <div
                        key={resource.id}
                        className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          setSelectedResource(resource)
                          setConflictDialog(false)
                          fetchAvailability()
                        }}
                      >
                        <div className="font-medium text-gray-900">{resource.name}</div>
                        {resource.location && (
                          <div className="text-sm text-gray-600">{resource.location}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Alternative Time Slots */}
              {conflictData.suggestions?.available_slots && conflictData.suggestions.available_slots.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Alternative Time Slots</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {conflictData.suggestions.available_slots.slice(0, 6).map((slot: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 border border-green-200 bg-green-50 rounded-lg text-center"
                      >
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(slot.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(slot.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <Badge variant="secondary" className="mt-1 bg-green-100 text-green-800 text-xs">
                          Available
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={() => setConflictDialog(false)}
                className="w-full bg-gray-900 hover:bg-gray-800"
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default BookResource