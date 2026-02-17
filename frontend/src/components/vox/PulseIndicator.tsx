'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface PulseIndicatorProps {
  status: 'idle' | 'active' | 'error'
  size?: 'sm' | 'md' | 'lg'
  audioLevel?: number // 0-1 for live audio visualization
  className?: string
}

const PulseIndicator = React.forwardRef<HTMLDivElement, PulseIndicatorProps>(
  ({ status, size = 'md', audioLevel = 0, className }, ref) => {
    const colors = {
      idle: 'bg-vox-idle',
      active: 'bg-vox-active',
      error: 'bg-vox-error',
    }

    const glowColors = {
      idle: 'shadow-[0_0_15px_rgba(139,92,246,0.6)]',
      active: 'shadow-[0_0_20px_rgba(6,182,212,0.8)]',
      error: 'shadow-[0_0_15px_rgba(251,113,133,0.6)]',
    }

    const sizes = {
      sm: 'w-2 h-2',
      md: 'w-3 h-3',
      lg: 'w-4 h-4',
    }

    // Scale based on audio level for active status
    const scale = status === 'active' ? 1 + audioLevel * 0.5 : 1

    return (
      <div ref={ref} className={cn('relative', className)}>
        {/* Outer pulse ring */}
        {status === 'active' && (
          <motion.div
            className={cn(
              'absolute inset-0 rounded-full',
              colors[status],
              'opacity-30'
            )}
            animate={{
              scale: [1, 1.5 + audioLevel, 1],
              opacity: [0.3, 0, 0.3],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}

        {/* Main indicator */}
        <motion.div
          className={cn(
            'relative rounded-full',
            sizes[size],
            colors[status],
            glowColors[status]
          )}
          animate={{
            scale,
          }}
          transition={{
            duration: 0.1,
          }}
        />
      </div>
    )
  }
)
PulseIndicator.displayName = 'PulseIndicator'

export { PulseIndicator, type PulseIndicatorProps }
