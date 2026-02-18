'use client'

import * as React from 'react'
import { Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { VoxButton } from '@/components/vox/VoxButton'

export interface DynamicListProps<T> {
  items: T[]
  onChange: (items: T[]) => void
  renderItem: (item: T, index: number, onChange: (item: T) => void) => React.ReactNode
  addButtonText: string
  createNewItem: () => T
  emptyStateText?: string
  className?: string
  disabled?: boolean
}

export function DynamicList<T>({
  items,
  onChange,
  renderItem,
  addButtonText,
  createNewItem,
  emptyStateText,
  className,
  disabled = false,
}: DynamicListProps<T>) {
  const handleItemChange = (index: number, updatedItem: T) => {
    const newItems = [...items]
    newItems[index] = updatedItem
    onChange(newItems)
  }

  const handleAddItem = () => {
    onChange([...items, createNewItem()])
  }

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    onChange(newItems)
  }

  return (
    <div className={cn('space-y-3', className)}>
      {items.length === 0 && emptyStateText && (
        <p className="text-sm text-slate-500 py-2">{emptyStateText}</p>
      )}

      {items.map((item, index) => (
        <div key={index} className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            {renderItem(item, index, (updatedItem) =>
              handleItemChange(index, updatedItem)
            )}
          </div>
          {!disabled && (
            <VoxButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveItem(index)}
              className="text-slate-400 hover:text-red-400 shrink-0"
            >
              <X className="h-4 w-4" />
            </VoxButton>
          )}
        </div>
      ))}

      {!disabled && (
        <VoxButton
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddItem}
          className="mt-2"
        >
          <Plus className="h-4 w-4 mr-1" />
          {addButtonText}
        </VoxButton>
      )}
    </div>
  )
}
