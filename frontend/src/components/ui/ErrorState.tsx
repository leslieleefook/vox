/**
 * ErrorState Component
 * Displays error messages with retry action
 */

'use client'

import { AlertCircle, RefreshCw } from 'lucide-react'
import { VoxButton } from '@/components/vox'

interface ErrorStateProps {
  message: string
  onRetry?: () => void
  retryText?: string
}

export function ErrorState({ message, onRetry, retryText = 'Try again' }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-vox-error/10 p-4 mb-4">
        <AlertCircle className="h-8 w-8 text-vox-error" />
      </div>
      <p className="text-slate-300 mb-4 max-w-md">{message}</p>
      {onRetry && (
        <VoxButton variant="outline" onClick={onRetry}>
          <RefreshCw size={16} />
          {retryText}
        </VoxButton>
      )}
    </div>
  )
}

export default ErrorState
