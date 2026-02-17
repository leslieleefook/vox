'use client'

import * as React from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

interface VoxCardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'elevated' | 'active'
  glowColor?: 'idle' | 'active' | 'error' | 'none'
  children: React.ReactNode
}

const VoxCard = React.forwardRef<HTMLDivElement, VoxCardProps>(
  ({ className, variant = 'default', glowColor = 'none', children, ...props }, ref) => {
    const glowColors = {
      idle: 'hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]',
      active: 'shadow-[0_0_30px_rgba(6,182,212,0.4)]',
      error: 'shadow-[0_0_30px_rgba(251,113,133,0.4)]',
      none: '',
    }

    const variants = {
      default: 'bg-white/5 backdrop-blur-[16px]',
      elevated: 'bg-white/10 backdrop-blur-xl',
      active: 'bg-white/10 backdrop-blur-xl border-vox-active/30',
    }

    return (
      <motion.div
        ref={ref}
        className={cn(
          // Base styles
          'relative rounded-xl border border-white/10',
          'shadow-glass transition-all duration-300',
          // Top-left highlight
          'before:absolute before:inset-0 before:rounded-xl',
          'before:bg-gradient-to-br before:from-white/10 before:via-transparent before:to-transparent',
          'before:pointer-events-none',
          // Variants
          variants[variant],
          glowColors[glowColor],
          className
        )}
        whileHover={{
          scale: 1.01,
          backdropFilter: 'blur(24px)',
        }}
        transition={{ duration: 0.2 }}
        {...props}
      >
        {/* Dark overlay for legibility */}
        <div className="absolute inset-0 rounded-xl bg-black/20 pointer-events-none" />

        {/* Content */}
        <div className="relative z-10">{children}</div>
      </motion.div>
    )
  }
)
VoxCard.displayName = 'VoxCard'

export { VoxCard, type VoxCardProps }
