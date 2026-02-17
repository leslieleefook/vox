'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const VoxInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-lg border border-white/10',
          'bg-white/5 backdrop-blur-md',
          'px-3 py-2 text-sm text-white tracking-readable',
          'placeholder:text-slate-500',
          'focus:outline-none focus:ring-2 focus:ring-vox-idle/50 focus:border-vox-idle/50',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-all duration-200',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
VoxInput.displayName = 'VoxInput'

export { VoxInput }
