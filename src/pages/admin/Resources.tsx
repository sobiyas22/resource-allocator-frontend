import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {api}  from '../../lib/api'
import { resourceSchema, ResourceFormValues } from '../../utils/validators'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Smartphone, Laptop, Sprout, MapPin, Users, Monitor, Trash, Edit, Eye, Calendar } from 'lucide-react'
import { formatISO } from 'date-fns'

type ResourceType = 'meeting_room' | 'phone' | 'laptop' | 'turf'

interface Resource {
    id: number
    name: string
    resource_type: ResourceType
    description?: string | null
    location?: string | null
    is_active: boolean
    properties?: Record<string, any> | null
    created_at: string
    updated_at: string
}

interface ResourcesResponse {
    resources: any[]
    total: number
    limit: number
    offset: number
    has_more: boolean
}

const resourceTabs = [
    {
        type: 'meeting_room' as const,
        title: 'Meeting Rooms',
        icon: Calendar,
        canAdd: true
    },
    {
        type: 'phone' as const,
        title: 'Phones',
        icon: Smartphone,
        canAdd: true
    },
    {
        type: 'laptop' as const,
        title: 'Laptops',
        icon: Laptop,
        canAdd: true
    },
    {
        type: 'turf' as const,
        title: 'Turf',
        icon: Sprout,
        canAdd: false
    }
]

const fromApiResourceType = (type: string): ResourceType => {
    if (type === 'meeting-room') return 'meeting_room'
    return type as ResourceType
}

const toApiResourceType = (type: ResourceType) =>
    type === 'meeting_room' ? 'meeting-room' : type

const Resources: React.FC = () => {
    const [openCreate, setOpenCreate] = useState(false)
    const [openEdit, setOpenEdit] = useState(false)
    const [openView, setOpenView] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    // Separate state for each resource type
    const [meetingRooms, setMeetingRooms] = useState<Resource[]>([])
    const [phones, setPhones] = useState<Resource[]>([])
    const [laptops, setLaptops] = useState<Resource[]>([])
    const [turfs, setTurfs] = useState<Resource[]>([])

    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<ResourceType>('meeting_room')
    const [selectedResource, setSelectedResource] = useState<Resource | null>(null)

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors, isSubmitting },
        setValue,
    } = useForm<ResourceFormValues>({
        resolver: zodResolver(resourceSchema),
        defaultValues: { resource_type: 'meeting_room', name: '', is_active: true, properties: {} }
    })

    const {
        register: registerEdit,
        handleSubmit: handleSubmitEdit,
        watch: watchEdit,
        reset: resetEdit,
        formState: { errors: editErrors, isSubmitting: isEditing },
        setValue: setEditValue
    } = useForm<ResourceFormValues>({
        resolver: zodResolver(resourceSchema),
        defaultValues: { resource_type: 'meeting_room', name: '', is_active: true, properties: {} }
    })

    const type = watch('resource_type')
    const editType = watchEdit('resource_type')

    async function fetchResources() {
        setLoading(true)
        try {
            let allResources: Resource[] = []
            let offset = 0
            const limit = 10
            let hasMore = true

            while (hasMore) {
                const res = await api.get<ResourcesResponse>(`/resources?limit=${limit}&offset=${offset}`)
                // console.log('Resources API response:', res.resources)

                if (res.resources && Array.isArray(res.resources)) {
                    const normalizedResources = res.resources.map((r: any) => ({
                        ...r,
                        resource_type: fromApiResourceType(r.resource_type),
                    }))
                    allResources = [...allResources, ...normalizedResources]

                    hasMore = res.has_more || false
                    offset += limit
                } else {
                    hasMore = false
                }
            }

            // console.log('All resources fetched:', allResources)

            // Separate resources by type
            setMeetingRooms(allResources.filter(r => r.resource_type === 'meeting_room'))
            setPhones(allResources.filter(r => r.resource_type === 'phone'))
            setLaptops(allResources.filter(r => r.resource_type === 'laptop'))
            setTurfs(allResources.filter(r => r.resource_type === 'turf'))
        } catch (err) {
            console.error('Failed to fetch resources:', err)
            setMeetingRooms([])
            setPhones([])
            setLaptops([])
            setTurfs([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchResources()
    }, [])

    // Get current resources based on active tab
    const getCurrentResources = () => {
        switch (activeTab) {
            case 'meeting_room': return meetingRooms
            case 'phone': return phones
            case 'laptop': return laptops
            case 'turf': return turfs
            default: return []
        }
    }

    const currentResources = getCurrentResources()
    const currentTab = resourceTabs.find(t => t.type === activeTab)

    async function onCreate(values: ResourceFormValues) {
        setMessage(null)
        try {
            await api.post('/resources', {
                name: values.name,
                resource_type: toApiResourceType(values.resource_type),
                location: values.location,
                is_active: true,
                properties: values.properties || {}
            })
            setMessage({ type: 'success', text: 'Resource created successfully!' })
            reset({ resource_type: values.resource_type, name: '', properties: {}, location: '', is_active: true })
            setOpenCreate(false)
            fetchResources()
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to create resource' })
        }
    }

    async function openEditDialog(resource: Resource) {
        setSelectedResource(resource)
        resetEditForm(resource)
        setOpenView(false) // Close view dialog
        setOpenEdit(true)
    }

    function resetEditForm(resource?: Resource) {
        if (!resource) {
            resetEdit()
            return
        }
        setEditValue('name', resource.name)
        setEditValue('resource_type', resource.resource_type as any)
        setEditValue('location', resource.location || '')
        setEditValue('is_active', resource.is_active ?? true)
        setEditValue('properties', resource.properties || {})
    }

    async function onEdit(values: ResourceFormValues) {
        if (!selectedResource) return
        setMessage(null)
        try {
            await api.patch(`/resources/${selectedResource.id}`, {
                name: values.name,
                resource_type: toApiResourceType(values.resource_type),
                location: values.location,
                is_active: values.is_active,
                properties: values.properties || {}
            })
            setMessage({ type: 'success', text: 'Resource updated successfully!' })
            setOpenEdit(false)
            fetchResources()
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to update resource' })
        }
    }

    async function onDelete(resource: Resource) {
        if (!confirm(`Are you sure you want to archive "${resource.name}"?`)) return

        try {
            await api.del(`/resources/${resource.id}`)
            setOpenView(false)

            if (resource.resource_type === 'meeting_room') {
                setMeetingRooms((prev) => prev.filter((r) => r.id !== resource.id))
            } else if (resource.resource_type === 'phone') {
                setPhones((prev) => prev.filter((r) => r.id !== resource.id))
            } else if (resource.resource_type === 'laptop') {
                setLaptops((prev) => prev.filter((r) => r.id !== resource.id))
            } else if (resource.resource_type === 'turf') {
                setTurfs((prev) => prev.filter((r) => r.id !== resource.id))
            }

            if (selectedResource?.id === resource.id) {
                setSelectedResource(null)
            }

            if (selectedResource?.id === resource.id) {
                setSelectedResource(null)
            }
            setMessage({ type: 'success', text: 'Resource archived/deleted' })

            await fetchResources()

        } catch (err: any) {
            console.error(err)
            setMessage({ type: 'error', text: err?.message || 'Failed to archive resource' })
        }
    }


    async function onView(resource: Resource) {
        try {
            const res = await api.get(`/resources/${resource.id}`)
            const normalized = {
                ...res,
                resource_type: fromApiResourceType(res.resource_type)
            }
            setSelectedResource(normalized)
            setOpenView(true)
        } catch (err: any) {
            setMessage({ type: 'error', text: 'Failed to fetch resource details' })
        }
    }

    const prop = (r: Resource, key: string) => {
        return r.properties?.[key] ?? (r as any)[key] ?? '-'
    }

    return (
        <div className="max-w-7xl">
            {/* Header Section */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Manage Resources
                </h1>
                <p className="text-gray-600">Organize and track all your organizational resources</p>
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

            {/* Tabs and Table Card */}
            <Card className="border-gray-200 shadow-lg">
                <CardHeader className="border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center justify-between">
                        {/* Tabs */}
                        <div className="flex gap-2">
                            {resourceTabs.map((tab) => {
                                const Icon = tab.icon
                                const isActive = activeTab === tab.type
                                const count = tab.type === 'meeting_room' ? meetingRooms.length :
                                    tab.type === 'phone' ? phones.length :
                                        tab.type === 'laptop' ? laptops.length :
                                            turfs.length

                                return (
                                    <button
                                        key={tab.type}
                                        onClick={() => setActiveTab(tab.type)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${isActive
                                            ? 'bg-gray-900 text-white shadow-md'
                                            : 'bg-white text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span className="font-medium">{tab.title}</span>
                                        <Badge variant="secondary" className={`${isActive ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}>
                                            {count}
                                        </Badge>
                                    </button>
                                )
                            })}
                        </div>

                        {/* Add Button - Only show if current tab allows adding */}
                        {currentTab?.canAdd && (
                            <Dialog
                                open={openCreate}
                                onOpenChange={(open) => {
                                    setOpenCreate(open)
                                    if (!open) {
                                        reset({
                                            resource_type: activeTab,
                                            name: '',
                                            location: '',
                                            is_active: true,
                                            properties: {}
                                        })
                                    } else {
                                        setValue('resource_type', activeTab)
                                    }
                                }}
                            >
                                <DialogTrigger asChild>
                                    <Button className="bg-gray-900 hover:bg-gray-800 text-white">
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add {currentTab?.title}
                                    </Button>
                                </DialogTrigger>

                                <DialogContent className="sm:max-w-125 bg-white">
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl" style={{ fontFamily: "'Playfair Display', serif" }}>
                                            Add New {currentTab?.title}
                                        </DialogTitle>
                                        <DialogDescription>
                                            Create a new resource in the system.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <form onSubmit={handleSubmit(onCreate)} className="space-y-4 mt-4">
                                        <div className="space-y-2 bg-white">
                                            <Label htmlFor="resource_type">Resource Type</Label>
                                            <Select
                                                value={type}
                                                onValueChange={(value) => setValue('resource_type', value as any, { shouldDirty: true })}
                                            >
                                                <SelectTrigger className="w-full bg-white">
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white z-50 shadow-lg border">
                                                    <SelectItem value="meeting_room">Meeting Room</SelectItem>
                                                    <SelectItem value="phone">Phone</SelectItem>
                                                    <SelectItem value="laptop">Laptop</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="name">Name / Identifier</Label>
                                            <Input
                                                id="name"
                                                {...register('name')}
                                                placeholder="e.g., Conference Room A"
                                                className="w-full"
                                            />
                                            {errors.name && (
                                                <p className="text-xs text-red-600">{errors.name.message}</p>
                                            )}
                                        </div>

                                        {type === 'meeting_room' && (
                                            <>
                                                <div className="space-y-2">
                                                    <Label htmlFor="properties.capacity">Capacity</Label>
                                                    <Input
                                                        id="capacity"
                                                        {...register('properties.capacity' as const)}
                                                        placeholder="10"
                                                        type="number"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="location">Location</Label>
                                                    <Input
                                                        id="location"
                                                        {...register('location')}
                                                        placeholder="2nd Floor, Building A"
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {type === 'phone' && (
                                            <>
                                                <div className="space-y-2">
                                                    <Label htmlFor="properties.os">Operating System</Label>
                                                    <Input
                                                        id="os"
                                                        {...register('properties.os' as const)}
                                                        placeholder="Android 13"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="properties.ram">RAM</Label>
                                                    <Input
                                                        id="ram"
                                                        {...register('properties.ram' as any)}
                                                        placeholder="12GB"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="location">Location</Label>
                                                    <Input
                                                        id="location"
                                                        {...register('location')}
                                                        placeholder="IT Storage"
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {type === 'laptop' && (
                                            <>
                                                <div className="space-y-2">
                                                    <Label htmlFor="properties.os">Operating System</Label>
                                                    <Input
                                                        id="os"
                                                        {...register('properties.os' as const)}
                                                        placeholder="Ubuntu 22.04"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="properties.ram">RAM</Label>
                                                    <Input
                                                        id="ram"
                                                        {...register('properties.ram' as any)}
                                                        placeholder="8GB"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="location">Location</Label>
                                                    <Input
                                                        id="location"
                                                        {...register('location')}
                                                        placeholder="IT Storage"
                                                    />
                                                </div>
                                            </>
                                        )}

                                        <div className="flex gap-3 pt-4">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setOpenCreate(false)}
                                                className="flex-1"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="flex-1 bg-green-500 hover:bg-green-400"
                                            >
                                                {isSubmitting ? 'Creating...' : 'Create Resource'}
                                            </Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {loading ? (
                        <div className="text-center py-12 text-gray-500">Loading resources...</div>
                    ) : currentResources.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                                {currentTab && <currentTab.icon className="w-8 h-8 text-gray-400" />}
                            </div>
                            <p className="text-gray-500">No {currentTab?.title.toLowerCase()} found</p>
                            {currentTab?.canAdd && (
                                <p className="text-sm text-gray-400 mt-1">Click "Add" to create one</p>
                            )}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50 hover:bg-gray-50">
                                    <TableHead className="font-semibold text-gray-900">Name</TableHead>
                                    {activeTab === 'meeting_room' && (
                                        <>
                                            <TableHead className="font-semibold text-gray-900">Capacity</TableHead>
                                            <TableHead className="font-semibold text-gray-900">Location</TableHead>
                                        </>
                                    )}
                                    {activeTab === 'phone' && (
                                        <>
                                            <TableHead className="font-semibold text-gray-900">OS</TableHead>
                                            <TableHead className="font-semibold text-gray-900">RAM</TableHead>
                                        </>
                                    )}
                                    {activeTab === 'laptop' && (
                                        <>
                                            <TableHead className="font-semibold text-gray-900">OS</TableHead>
                                            <TableHead className="font-semibold text-gray-900">RAM</TableHead>
                                        </>
                                    )}
                                    {activeTab === 'turf' && (
                                        <>
                                            <TableHead className="font-semibold text-gray-900">Location</TableHead>
                                            <TableHead className="font-semibold text-gray-900">Capacity</TableHead>
                                        </>
                                    )}
                                    <TableHead className="font-semibold text-gray-900">Status</TableHead>
                                    <TableHead className="font-semibold text-gray-900 text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {currentResources.map((resource) => (
                                    <TableRow key={resource.id} className="hover:bg-gray-50">
                                        <TableCell className="font-medium text-gray-900">{resource.name}</TableCell>
                                        {activeTab === 'meeting_room' && (
                                            <>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <Users className="w-4 h-4" />
                                                        {prop(resource, 'capacity') || '-'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <MapPin className="w-4 h-4" />
                                                        {resource.location || '-'}
                                                    </div>
                                                </TableCell>
                                            </>
                                        )}
                                        {activeTab === 'phone' && (
                                            <>
                                                <TableCell className="text-gray-600">{prop(resource, 'os') || '-'}</TableCell>
                                                <TableCell className="text-gray-600">{prop(resource, 'ram') || '-'}</TableCell>
                                            </>
                                        )}
                                        {activeTab === 'laptop' && (
                                            <>
                                                <TableCell className="text-gray-600">{prop(resource, 'os') || '-'}</TableCell>
                                                <TableCell className="text-gray-600">{prop(resource, 'ram') || '-'}</TableCell>
                                            </>
                                        )}
                                        {activeTab === 'turf' && (
                                            <>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <MapPin className="w-4 h-4" />
                                                        {resource.location || '-'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <Users className="w-4 h-4" />
                                                        {prop(resource, 'capacity') || '-'}
                                                    </div>
                                                </TableCell>
                                            </>
                                        )}
                                        <TableCell>
                                            <Badge
                                                variant="secondary"
                                                className={`${resource.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                                            >
                                                {resource.is_active ? 'Active' : 'Archived'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center justify-center">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => onView(resource)}
                                                    className="text-gray-700 hover:text-gray-900"
                                                >
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    View Details
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

            {/* Edit Dialog */}
            <Dialog open={openEdit} onOpenChange={setOpenEdit}>
                <DialogContent className='bg-white'>
                    <DialogHeader>
                        <DialogTitle>Edit Resource</DialogTitle>
                        <DialogDescription>Modify resource details</DialogDescription>
                    </DialogHeader>

                    {selectedResource ? (
                        <form onSubmit={handleSubmitEdit(onEdit)} className="bg-white space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label>Resource Type</Label>
                                <Select
                                    onValueChange={(value) => setEditValue('resource_type', value as any)}
                                    defaultValue={selectedResource.resource_type}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="meeting_room">Meeting Room</SelectItem>
                                        <SelectItem value="phone">Phone</SelectItem>
                                        <SelectItem value="laptop">Laptop</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Name</Label>
                                <Input {...registerEdit('name' as any)} defaultValue={selectedResource.name} />
                                {editErrors.name && <p className="text-xs text-red-600">{editErrors.name.message}</p>}
                            </div>

                            {editType === 'meeting_room' && (
                                <>
                                    <div className="space-y-2">
                                        <Label>Capacity</Label>
                                        <Input {...registerEdit('properties.capacity' as const)} defaultValue={selectedResource.properties?.capacity as any} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Location</Label>
                                        <Input {...registerEdit('location' as any)} defaultValue={selectedResource.location as any} />
                                    </div>
                                </>
                            )}

                            {editType === 'phone' && (
                                <>
                                    <div className="space-y-2">
                                        <Label>Operating System</Label>
                                        <Input {...registerEdit('properties.os' as const)} defaultValue={selectedResource.properties?.os as any} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>RAM</Label>
                                        <Input {...registerEdit('properties.ram' as any)} defaultValue={selectedResource.properties?.ram as any} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Location</Label>
                                        <Input {...registerEdit('location' as any)} defaultValue={selectedResource.location as any} />
                                    </div>
                                </>
                            )}

                            {editType === 'laptop' && (
                                <>
                                    <div className="space-y-2">
                                        <Label>Operating System</Label>
                                        <Input {...registerEdit('properties.os' as const)} defaultValue={selectedResource.properties?.os as any} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>RAM</Label>
                                        <Input {...registerEdit('properties.ram' as any)} defaultValue={selectedResource.properties?.ram as any} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Location</Label>
                                        <Input {...registerEdit('location' as any)} defaultValue={selectedResource.location as any} />
                                    </div>
                                </>
                            )}

                            <div className="flex gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={() => setOpenEdit(false)} className="flex-1">Cancel</Button>
                                <Button type="submit" disabled={isEditing} className="flex-1 bg-gray-400 hover:bg-gray-500">{isEditing ? 'Saving...' : 'Save changes'}</Button>
                            </div>
                        </form>
                    ) : (
                        <div>Loading...</div>
                    )}
                </DialogContent>
            </Dialog>

            {/* View Dialog */}
            <Dialog open={openView} onOpenChange={setOpenView}>
                <DialogContent className="bg-white max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-semibold">Resource Details</DialogTitle>
                        <DialogDescription>Complete information about this resource</DialogDescription>
                    </DialogHeader>

                    {selectedResource ? (
                        <div className="space-y-6 mt-4">
                            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Name</div>
                                        <div className="font-medium text-gray-900">{selectedResource.name}</div>
                                    </div>

                                    <div>
                                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Type</div>
                                        <div className="font-medium text-gray-900 capitalize">{selectedResource.resource_type.replace('_', ' ')}</div>
                                    </div>

                                    <div>
                                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Location</div>
                                        <div className="font-medium text-gray-900">{selectedResource.location || '-'}</div>
                                    </div>

                                    <div>
                                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Status</div>
                                        <Badge
                                            variant="secondary"
                                            className={`${selectedResource.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                                        >
                                            {selectedResource.is_active ? 'Active' : 'Archived'}
                                        </Badge>
                                    </div>
                                </div>

                                {selectedResource.properties && Object.keys(selectedResource.properties).length > 0 && (
                                    <div>
                                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Properties</div>
                                        <div className="bg-white rounded border border-gray-200 divide-y divide-gray-200">
                                            {Object.entries(selectedResource.properties).map(([key, value]) => (
                                                <div key={key} className="flex justify-between py-2 px-3">
                                                    <span className="text-sm font-medium text-gray-600 capitalize">{key.replace('_', ' ')}</span>
                                                    <span className="text-sm text-gray-900">{value || '-'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                                    <div>
                                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Created At</div>
                                        <div className="text-sm text-gray-900">{selectedResource.created_at ? new Date(selectedResource.created_at).toLocaleString() : '-'}</div>
                                    </div>

                                    <div>
                                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Updated At</div>
                                        <div className="text-sm text-gray-900">{selectedResource.updated_at ? new Date(selectedResource.updated_at).toLocaleString() : '-'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons - Only show for non-turf resources */}
                            {selectedResource.resource_type !== 'turf' && (
                                <div className="flex gap-3 pt-2">
                                    <Button
                                        variant="default"
                                        onClick={() => openEditDialog(selectedResource)}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                                    >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit Resource
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => onDelete(selectedResource)}
                                        className="flex-1"
                                    >
                                        <Trash className="w-4 h-4 mr-2" />
                                        Delete Resource
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>Loading...</div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default Resources