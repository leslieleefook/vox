'use client'

import * as React from 'react'
import { VoxInput } from '@/components/vox/VoxInput'
import { cn } from '@/lib/utils'
import { TOOL_NAME_PATTERN, DESCRIPTION_MAX_LENGTH } from '@/lib/constants/toolTypes'

export interface ToolSettingsSectionProps {
  name: string
  description: string
  onNameChange: (name: string) => void
  onDescriptionChange: (description: string) => void
  errors?: {
    name?: string
    description?: string
  }
  disabled?: boolean
}

export function ToolSettingsSection({
  name,
  description,
  onNameChange,
  onDescriptionChange,
  errors,
  disabled = false,
}: ToolSettingsSectionProps) {
  const [nameTouched, setNameTouched] = React.useState(false)

  const handleNameBlur = () => {
    setNameTouched(true)
  }

  const validateName = (value: string) => {
    if (!value) return 'Tool name is required'
    if (!TOOL_NAME_PATTERN.test(value)) {
      return 'Tool name can only contain letters, numbers, underscores, and hyphens'
    }
    return undefined
  }

  const nameError = nameTouched ? validateName(name) : errors?.name

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="tool-name" className="text-sm font-medium text-white">
          Tool Name
        </label>
        <VoxInput
          id="tool-name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          onBlur={handleNameBlur}
          placeholder="e.g., get_weather_data"
          disabled={disabled}
          className={cn(nameError && 'border-red-500/50 focus:ring-red-500/50')}
        />
        {nameError && (
          <p className="text-xs text-red-400">{nameError}</p>
        )}
        <p className="text-xs text-slate-500">
          Function name used to call this tool. Use snake_case or kebab-case.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="tool-description" className="text-sm font-medium text-white">
            Description
          </label>
          <span className="text-xs text-slate-500">
            {description.length}/{DESCRIPTION_MAX_LENGTH}
          </span>
        </div>
        <textarea
          id="tool-description"
          value={description}
          onChange={(e) => {
            if (e.target.value.length <= DESCRIPTION_MAX_LENGTH) {
              onDescriptionChange(e.target.value)
            }
          }}
          placeholder="Describe what this tool does and when it should be used..."
          disabled={disabled}
          rows={3}
          className={cn(
            'flex w-full rounded-lg border border-white/10',
            'bg-white/5 backdrop-blur-md',
            'px-3 py-2 text-sm text-white tracking-readable',
            'placeholder:text-slate-500',
            'focus:outline-none focus:ring-2 focus:ring-vox-idle/50 focus:border-vox-idle/50',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-all duration-200 resize-none'
          )}
        />
      </div>
    </div>
  )
}
