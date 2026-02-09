import React, { useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { api } from '../../lib/api'
import { resourceSchema, ResourceFormValues, ResourceType } from '../../utils/validators'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import {
  Plus,
  Edit,
  Trash2,
  DoorOpen,
  Smartphone,
  Laptop as LaptopIcon,
  Sprout,
  MapPin,
  Eye,
  Search
} from 'lucide-react'
import { toast } from 'sonner'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { TableSkeleton } from '../../components/TableSkeleton'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import { DynamicPropertyFields } from '../../components/DynamicPropertyFields'

interface Resource {
  id: number
  name: string
  resource_type: ResourceType
  description?: string
  location: string
  is_active: boolean
  properties: Record<string, any>
  created_at: string
}

interface ResourcesResponse {
  resources: Resource[]
  total: number
  limit: number
  offset: number
  has_more: boolean
}

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
  const [openDelete, setOpenDelete] = useState(false)

  const [meetingRooms, setMeetingRooms] = useState<Resource[]>([])
  const [phones, setPhones] = useState<Resource[]>([])
  const [laptops, setLaptops] = useState<Resource[]>([])
  const [turfs, setTurfs] = useState<Resource[]>([])

  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<ResourceType>('meeting_room')
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const nameInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      resource_type: 'meeting_room',
      name: '',
      is_active: true,
      properties: {}
    }
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
    defaultValues: {
      resource_type: 'meeting_room',
      name: '',
      is_active: true,
      properties: {}
    }
  })

  const type = watch('resource_type')
  const editType = watchEdit('resource_type')

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'n',
      ctrlKey: true,
      callback: () => {
        if (!openCreate && !openEdit && !openView) {
          setOpenCreate(true)
          setTimeout(() => nameInputRef.current?.focus(), 100)
        }
      }
    },
    {
      key: 'Escape',
      callback: () => {
        if (openCreate) setOpenCreate(false)
        if (openEdit) setOpenEdit(false)
        if (openView) setOpenView(false)
        if (openDelete) setOpenDelete(false)
      }
    }
  ])

  async function fetchResources() {
    setLoading(true)
    try {
      let allResources: Resource[] = []
      let offset = 0
      const limit = 100
      let hasMore = true

      while (hasMore) {
        const res = await api.get<ResourcesResponse>(`/resources?limit=${limit}&offset=${offset}`)

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

      setMeetingRooms(allResources.filter(r => r.resource_type === 'meeting_room'))
      setPhones(allResources.filter(r => r.resource_type === 'phone'))
      setLaptops(allResources.filter(r => r.resource_type === 'laptop'))
      setTurfs(allResources.filter(r => r.resource_type === 'turf'))
    } catch (err) {
      console.error('Failed to fetch resources:', err)
      toast.error('Failed to fetch resources')
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

  useEffect(() => {
    if (openCreate) {
      setTimeout(() => nameInputRef.current?.focus(), 100)
    }
  }, [openCreate])

  async function onSubmit(values: ResourceFormValues) {
    try {
      const payload = {
        ...values,
        resource_type: toApiResourceType(values.resource_type)
      }

      // Optimistic update
      const tempResource: Resource = {
        id: Date.now(),
        ...values,
        created_at: new Date().toISOString()
      }

      if (values.resource_type === 'meeting_room') {
        setMeetingRooms(prev => [tempResource, ...prev])
      } else if (values.resource_type === 'phone') {
        setPhones(prev => [tempResource, ...prev])
      } else if (values.resource_type === 'laptop') {
        setLaptops(prev => [tempResource, ...prev])
      } else if (values.resource_type === 'turf') {
        setTurfs(prev => [tempResource, ...prev])
      }

      setOpenCreate(false)
      reset()
      toast.success('Creating resource...')

      await api.post('/resources', payload)
      await fetchResources()
      toast.success('Resource created successfully!')
    } catch (err: any) {
      // Revert optimistic update
      await fetchResources()
      toast.error(err.message || 'Failed to create resource')
      setOpenCreate(true)
    }
  }

  async function onEdit(values: ResourceFormValues) {
    if (!selectedResource) return

    try {
      const payload = {
        ...values,
        resource_type: toApiResourceType(values.resource_type)
      }

      // Optimistic update
      const updatedResource = {
        ...selectedResource,
        ...values
      }

      const updateList = (prev: Resource[]) =>
        prev.map(r => r.id === selectedResource.id ? updatedResource : r)

      if (values.resource_type === 'meeting_room') {
        setMeetingRooms(updateList)
      } else if (values.resource_type === 'phone') {
        setPhones(updateList)
      } else if (values.resource_type === 'laptop') {
        setLaptops(updateList)
      } else if (values.resource_type === 'turf') {
        setTurfs(updateList)
      }

      setOpenEdit(false)
      setSelectedResource(null)
      resetEdit()
      toast.success('Updating resource...')

      await api.patch(`/resources/${selectedResource.id}`, payload)
      await fetchResources()
      toast.success('Resource updated successfully!')
    } catch (err: any) {
      await fetchResources()
      toast.error(err.message || 'Failed to update resource')
      setOpenEdit(true)
    }
  }

  async function handleDelete() {
    if (!resourceToDelete) return

    setIsDeleting(true)

    try {
      // Optimistic update
      const removeFromList = (prev: Resource[]) =>
        prev.filter(r => r.id !== resourceToDelete.id)

      if (resourceToDelete.resource_type === 'meeting_room') {
        setMeetingRooms(removeFromList)
      } else if (resourceToDelete.resource_type === 'phone') {
        setPhones(removeFromList)
      } else if (resourceToDelete.resource_type === 'laptop') {
        setLaptops(removeFromList)
      } else if (resourceToDelete.resource_type === 'turf') {
        setTurfs(removeFromList)
      }

      setOpenDelete(false)
      setResourceToDelete(null)
      toast.success('Deleting resource...')

      await api.del(`/resources/${resourceToDelete.id}`)
      toast.success('Resource deleted successfully!')
    } catch (err: any) {
      await fetchResources()
      toast.error(err.message || 'Failed to delete resource')
    } finally {
      setIsDeleting(false)
    }
  }

  async function toggleActive(resource: Resource) {
    try {
      const newStatus = !resource.is_active

      // Optimistic update
      const updateList = (prev: Resource[]) =>
        prev.map(r => r.id === resource.id ? { ...r, is_active: newStatus } : r)

      if (resource.resource_type === 'meeting_room') {
        setMeetingRooms(updateList)
      } else if (resource.resource_type === 'phone') {
        setPhones(updateList)
      } else if (resource.resource_type === 'laptop') {
        setLaptops(updateList)
      } else if (resource.resource_type === 'turf') {
        setTurfs(updateList)
      }

      toast.success(`${newStatus ? 'Activating' : 'Deactivating'} resource...`)

      await api.patch(`/resources/${resource.id}`, {
        is_active: newStatus,
        resource_type: toApiResourceType(resource.resource_type)
      })

      toast.success(`Resource ${newStatus ? 'activated' : 'deactivated'} successfully!`)
    } catch (err: any) {
      await fetchResources()
      toast.error(err.message || 'Failed to update resource')
    }
  }

  function openEditDialog(resource: Resource) {
    setSelectedResource(resource)
    resetEdit({
      name: resource.name,
      resource_type: resource.resource_type,
      description: resource.description || '',
      location: resource.location,
      is_active: resource.is_active,
      properties: resource.properties || {}
    })
    setOpenEdit(true)
  }

  function openViewDialog(resource: Resource) {
    setSelectedResource(resource)
    setOpenView(true)
  }

  function openDeleteDialog(resource: Resource) {
    setResourceToDelete(resource)
    setOpenDelete(true)
  }

  const getResourceIcon = (type: ResourceType) => {
    switch (type) {
      case 'meeting_room': return DoorOpen
      case 'phone': return Smartphone
      case 'laptop': return LaptopIcon
      case 'turf': return Sprout
    }
  }

  const getResourceList = () => {
    let list: Resource[] = []
    switch (activeTab) {
      case 'meeting_room': list = meetingRooms; break
      case 'phone': list = phones; break
      case 'laptop': list = laptops; break
      case 'turf': list = turfs; break
    }

    if (!searchQuery.trim()) return list

    const query = searchQuery.toLowerCase()
    return list.filter(r =>
      r.name.toLowerCase().includes(query) ||
      r.location.toLowerCase().includes(query) ||
      r.description?.toLowerCase().includes(query)
    )
  }

  const filteredList = getResourceList()

  return (
    <div className="max-w-7xl">
      <Breadcrumbs
        items={[
          { label: 'Admin Dashboard', href: '/dashboard/admin' },
          { label: 'Resource Management' }
        ]}
      />

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          Resource Management
        </h1>
        <p className="text-gray-600">
          Manage meeting rooms, phones, laptops, and turfs
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Button onClick={() => setOpenCreate(true)} className="bg-gray-700 hover:bg-gray-800 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Resource
          <kbd className="ml-2 px-2 py-0.5 text-xs bg-gray-700 rounded">Ctrl+N</kbd>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v as ResourceType)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="meeting_room" className="flex items-center gap-2">
            <DoorOpen className="w-4 h-4" />
            Meeting Rooms ({meetingRooms.length})
          </TabsTrigger>
          <TabsTrigger value="phone" className="flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            Phones ({phones.length})
          </TabsTrigger>
          <TabsTrigger value="laptop" className="flex items-center gap-2">
            <LaptopIcon className="w-4 h-4" />
            Laptops ({laptops.length})
          </TabsTrigger>
          <TabsTrigger value="turf" className="flex items-center gap-2">
            <Sprout className="w-4 h-4" />
            Turfs ({turfs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle>
                {filteredList.length} {activeTab.replace('_', ' ').toUpperCase()}
                {searchQuery && ` (filtered)`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <TableSkeleton rows={5} columns={5} />
              ) : filteredList.length === 0 ? (
                <div className="text-center py-12">
                  {React.createElement(getResourceIcon(activeTab), { className: "w-12 h-12 text-gray-400 mx-auto mb-4" })}
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchQuery ? 'No resources found' : 'No resources yet'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchQuery
                      ? 'Try adjusting your search'
                      : `Create your first ${activeTab.replace('_', ' ')}`
                    }
                  </p>
                  {!searchQuery && (
                    <Button onClick={() => setOpenCreate(true)} className="bg-gray-700 hover:bg-gray-800 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Resource
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Properties</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredList.map((resource) => {
                      const Icon = getResourceIcon(resource.resource_type)
                      return (
                        <TableRow key={resource.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">{resource.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="w-4 h-4" />
                              {resource.location}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={resource.is_active}
                                onCheckedChange={() => toggleActive(resource)}
                              />
                              <Badge variant={resource.is_active ? 'default' : 'secondary'}>
                                {resource.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-600">
                              {resource.resource_type === 'meeting_room' && (
                                <span>Capacity: {resource.properties?.capacity || 'N/A'}</span>
                              )}
                              {resource.resource_type === 'phone' && (
                                <span>{resource.properties?.brand} {resource.properties?.model}</span>
                              )}
                              {resource.resource_type === 'laptop' && (
                                <span>{resource.properties?.brand} {resource.properties?.model}</span>
                              )}
                              {resource.resource_type === 'turf' && (
                                <span>{resource.properties?.area_sqft} sq ft</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openViewDialog(resource)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(resource)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeleteDialog(resource)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>Create New Resource</DialogTitle>
            <DialogDescription>
              Add a new resource to the system
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <div className="space-y-2 ">
              <Label htmlFor="resource_type">Resource Type</Label>
              <Select

                defaultValue="meeting_room"
                onValueChange={(value) => setValue('resource_type', value as ResourceType)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="meeting_room">Meeting Room</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="laptop">Laptop</SelectItem>
                  <SelectItem value="turf">Turf</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Conference Room A"
                {...register('name')}
                ref={(e) => {
                  register('name').ref(e)
                  if (e) nameInputRef.current = e
                }}
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                placeholder="e.g., 3rd Floor, East Wing"
                {...register('location')}
                disabled={isSubmitting}
              />
              {errors.location && (
                <p className="text-sm text-red-600">{errors.location.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional description"
                {...register('description')}
                disabled={isSubmitting}
                rows={3}
              />
            </div>

            {/* <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                defaultChecked={true}
                onCheckedChange={(checked:any) => setValue('is_active', checked)}
                disabled={isSubmitting}
              />
              <Label htmlFor="is_active">Active</Label>
            </div> */}

            <DynamicPropertyFields
              resourceType={type}
              register={register}
              setValue={setValue}
              errors={errors}
              disabled={isSubmitting}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpenCreate(false)
                  reset()
                }}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gray-800 hover:bg-gray-900"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Resource'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
            <DialogDescription>
              Update resource details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit(onEdit)} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="edit_name">Name *</Label>
              <Input
                id="edit_name"
                placeholder="e.g., Conference Room A"
                {...registerEdit('name')}
                disabled={isEditing}
              />
              {editErrors.name && (
                <p className="text-sm text-red-600">{editErrors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_location">Location *</Label>
              <Input
                id="edit_location"
                placeholder="e.g., 3rd Floor, East Wing"
                {...registerEdit('location')}
                disabled={isEditing}
              />
              {editErrors.location && (
                <p className="text-sm text-red-600">{editErrors.location.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_description">Description</Label>
              <Textarea
                id="edit_description"
                placeholder="Optional description"
                {...registerEdit('description')}
                disabled={isEditing}
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit_is_active"
                checked={watchEdit('is_active')}
                onCheckedChange={(checked: boolean) => setEditValue('is_active', checked)}
                disabled={isEditing}
              />
              <Label htmlFor="edit_is_active">
                {watchEdit('is_active') ? 'Active' : 'Inactive'}
              </Label>
            </div>


            <DynamicPropertyFields
              resourceType={editType}
              register={registerEdit}
              setValue={setEditValue}
              errors={editErrors}
              disabled={isEditing}
              defaultValues={selectedResource?.properties || {}}
            />

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpenEdit(false)
                  setSelectedResource(null)
                  resetEdit()
                }}
                disabled={isEditing}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isEditing}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
              >
                {isEditing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  'Update Resource'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={openView} onOpenChange={setOpenView}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Resource Details</DialogTitle>
          </DialogHeader>
          {selectedResource && (
            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-gray-600">Name</Label>
                <p className="font-medium">{selectedResource.name}</p>
              </div>
              <div>
                <Label className="text-gray-600">Type</Label>
                <p className="font-medium capitalize">{selectedResource.resource_type.replace('_', ' ')}</p>
              </div>
              <div>
                <Label className="text-gray-600">Location</Label>
                <p className="font-medium">{selectedResource.location}</p>
              </div>
              {selectedResource.description && (
                <div>
                  <Label className="text-gray-600">Description</Label>
                  <p className="font-medium">{selectedResource.description}</p>
                </div>
              )}
              <div>
                <Label className="text-gray-600">Status</Label>
                <p>
                  <Badge variant={selectedResource.is_active ? 'default' : 'secondary'}>
                    {selectedResource.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </p>
              </div>
              <div>
                <Label className="text-gray-600">Properties</Label>
                <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto">
                  {JSON.stringify(selectedResource.properties, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{resourceToDelete?.name}</strong>?
              This will also cancel all associated bookings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default Resources