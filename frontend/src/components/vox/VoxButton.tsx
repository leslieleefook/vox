'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium tracking-readable transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vox-idle focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 hover:border-white/30 active:scale-95',
        primary:
          'bg-vox-idle text-white hover:bg-vox-idle/80 shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] active:scale-95',
        destructive:
          'bg-vox-error text-white hover:bg-vox-error/80 shadow-[0_0_20px_rgba(251,113,133,0.3)] active:scale-95',
        ghost:
          'text-slate-400 hover:text-white hover:bg-white/5 active:scale-95',
        outline:
          'border border-white/20 bg-transparent text-white hover:bg-white/5 hover:border-white/30 active:scale-95',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const VoxButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
VoxButton.displayName = 'VoxButton'

export { VoxButton, buttonVariants }
