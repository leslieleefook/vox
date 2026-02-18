'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ProtocolCardProps {
  id: string
  label: string
  description: string
  selected: boolean
  onSelect: (id: string) => void
  disabled?: boolean
}

export function ProtocolCard({
  id,
  label,
  description,
  selected,
  onSelect,
  disabled = false,
}: ProtocolCardProps) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onSelect(id)}
      disabled={disabled}
      className={cn(
        'flex flex-col items-start p-4 rounded-lg border text-left transition-all',
        'w-full min-w-[140px]',
        selected
          ? 'border-vox-idle bg-vox-idle/10 shadow-[0_0_20px_rgba(139,92,246,0.2)]'
          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <div
          className={cn(
            'w-4 h-4 rounded-full border-2 flex items-center justify-center',
            selected
              ? 'border-vox-idle bg-vox-idle'
              : 'border-white/30'
          )}
        >
          {selected && (
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
          )}
        </div>
        <span className="font-medium text-white">{label}</span>
      </div>
      <p className="text-xs text-slate-400 ml-6">{description}</p>
    </button>
  )
}
