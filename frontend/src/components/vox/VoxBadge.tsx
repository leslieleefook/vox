'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface VoxBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error'
}

const VoxBadge = React.forwardRef<HTMLSpanElement, VoxBadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default: 'bg-white/10 text-slate-300 border-white/10',
      success: 'bg-green-500/20 text-green-400 border-green-500/30',
      warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      error: 'bg-vox-error/20 text-vox-error border-vox-error/30',
    }

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-readable border',
          variants[variant],
          className
        )}
        {...props}
      />
    )
  }
)
VoxBadge.displayName = 'VoxBadge'

export { VoxBadge, type VoxBadgeProps }
