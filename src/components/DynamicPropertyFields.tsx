import React from 'react'
import { UseFormRegister, UseFormSetValue, FieldErrors } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ResourceFormValues, ResourceType } from '../utils/validators'

interface DynamicPropertyFieldsProps {
  resourceType: ResourceType
  register: UseFormRegister<ResourceFormValues>
  setValue: UseFormSetValue<ResourceFormValues>
  errors: FieldErrors<ResourceFormValues>
  disabled?: boolean
  defaultValues?: Record<string, any>
}

export function DynamicPropertyFields({
  resourceType,
  register,
  setValue,
  errors,
  disabled = false,
  defaultValues = {}
}: DynamicPropertyFieldsProps) {
  
  const [localValues, setLocalValues] = React.useState(defaultValues)

  const handleCheckboxChange = (field: string, checked: boolean) => {
    const newValues = { ...localValues, [field]: checked }
    setLocalValues(newValues)
    setValue('properties', newValues)
  }

  const handleInputChange = (field: string, value: any) => {
    const newValues = { ...localValues, [field]: value }
    setLocalValues(newValues)
    setValue('properties', newValues)
  }

  React.useEffect(() => {
    setLocalValues(defaultValues)
  }, [defaultValues])

  if (resourceType === 'meeting_room') {
    return (
      <div className="space-y-4 border-t pt-4">
        <h3 className="font-medium text-gray-900">Meeting Room Properties</h3>
        
        <div className="space-y-2">
          <Label htmlFor="capacity">Capacity *</Label>
          <Input
            id="capacity"
            type="number"
            min="1"
            placeholder="e.g., 10"
            defaultValue={defaultValues.capacity}
            onChange={(e) => handleInputChange('capacity', parseInt(e.target.value) || 0)}
            disabled={disabled}
          />
          {errors.properties?.capacity && (
            <p className="text-sm text-red-600">{String(errors.properties.capacity.message)}</p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="has_projector"
            checked={localValues.has_projector || false}
            onCheckedChange={(checked) => handleCheckboxChange('has_projector', checked === true)}
            disabled={disabled}
          />
          <Label htmlFor="has_projector" className="cursor-pointer">Has Projector</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="has_whiteboard"
            checked={localValues.has_whiteboard || false}
            onCheckedChange={(checked) => handleCheckboxChange('has_whiteboard', checked === true)}
            disabled={disabled}
          />
          <Label htmlFor="has_whiteboard" className="cursor-pointer">Has Whiteboard</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="has_video_conference"
            checked={localValues.has_video_conference || false}
            onCheckedChange={(checked) => handleCheckboxChange('has_video_conference', checked === true)}
            disabled={disabled}
          />
          <Label htmlFor="has_video_conference" className="cursor-pointer">Has Video Conference</Label>
        </div>
      </div>
    )
  }

  if (resourceType === 'phone') {
    return (
      <div className="space-y-4 border-t pt-4">
        <h3 className="font-medium text-gray-900">Phone Properties</h3>
        
        <div className="space-y-2">
          <Label htmlFor="brand">Brand *</Label>
          <Input
            id="brand"
            placeholder="e.g., Apple, Samsung"
            defaultValue={defaultValues.brand}
            onChange={(e) => handleInputChange('brand', e.target.value)}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="model">Model *</Label>
          <Input
            id="model"
            placeholder="e.g., iPhone 14 Pro"
            defaultValue={defaultValues.model}
            onChange={(e) => handleInputChange('model', e.target.value)}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone_number">Phone Number</Label>
          <Input
            id="phone_number"
            placeholder="e.g., +1234567890"
            defaultValue={defaultValues.phone_number}
            onChange={(e) => handleInputChange('phone_number', e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>
    )
  }

  if (resourceType === 'laptop') {
    return (
      <div className="space-y-4 border-t pt-4">
        <h3 className="font-medium text-gray-900">Laptop Properties</h3>
        
        <div className="space-y-2">
          <Label htmlFor="brand">Brand *</Label>
          <Input
            id="brand"
            placeholder="e.g., Dell, HP, Apple"
            defaultValue={defaultValues.brand}
            onChange={(e) => handleInputChange('brand', e.target.value)}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="model">Model *</Label>
          <Input
            id="model"
            placeholder="e.g., MacBook Pro 16"
            defaultValue={defaultValues.model}
            onChange={(e) => handleInputChange('model', e.target.value)}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="processor">Processor</Label>
          <Input
            id="processor"
            placeholder="e.g., Intel i7, M2"
            defaultValue={defaultValues.processor}
            onChange={(e) => handleInputChange('processor', e.target.value)}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ram_gb">RAM (GB)</Label>
          <Input
            id="ram_gb"
            type="number"
            min="1"
            placeholder="e.g., 16"
            defaultValue={defaultValues.ram_gb}
            onChange={(e) => handleInputChange('ram_gb', parseInt(e.target.value) || 0)}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="storage_type">Storage Type</Label>
          <Select
            defaultValue={defaultValues.storage_type || 'SSD'}
            onValueChange={(value) => handleInputChange('storage_type', value)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="HDD">HDD</SelectItem>
              <SelectItem value="SSD">SSD</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    )
  }

  if (resourceType === 'turf') {
    return (
      <div className="space-y-4 border-t pt-4">
        <h3 className="font-medium text-gray-900">Turf Properties</h3>
        
        <div className="space-y-2">
          <Label htmlFor="area_sqft">Area (sq ft) *</Label>
          <Input
            id="area_sqft"
            type="number"
            min="1"
            placeholder="e.g., 5000"
            defaultValue={defaultValues.area_sqft}
            onChange={(e) => handleInputChange('area_sqft', parseInt(e.target.value) || 0)}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="max_participants">Max Participants *</Label>
          <Input
            id="max_participants"
            type="number"
            min="1"
            placeholder="e.g., 20"
            defaultValue={defaultValues.max_participants}
            onChange={(e) => handleInputChange('max_participants', parseInt(e.target.value) || 0)}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="surface_type">Surface Type</Label>
          <Input
            id="surface_type"
            placeholder="e.g., Artificial Grass, Natural Grass"
            defaultValue={defaultValues.surface_type}
            onChange={(e) => handleInputChange('surface_type', e.target.value)}
            disabled={disabled}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="has_lighting"
            checked={localValues.has_lighting || false}
            onCheckedChange={(checked) => handleCheckboxChange('has_lighting', checked === true)}
            disabled={disabled}
          />
          <Label htmlFor="has_lighting" className="cursor-pointer">Has Lighting</Label>
        </div>
      </div>
    )
  }

  return null
}