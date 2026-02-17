/**
 * LoadingSkeleton Component
 * Displays animated loading placeholders
 */

'use client'

import { cn } from '@/lib/utils'

interface LoadingSkeletonProps {
  className?: string
}

export function LoadingSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-white/10',
        className
      )}
    />
  )
}

export function AssistantCardSkeleton() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <LoadingSkeleton className="h-4 w-4 rounded-full" />
          <div>
            <LoadingSkeleton className="h-5 w-32 mb-1" />
            <LoadingSkeleton className="h-3 w-24" />
          </div>
        </div>
        <LoadingSkeleton className="h-8 w-8 rounded-lg" />
      </div>
      <LoadingSkeleton className="h-4 w-full mb-2" />
      <LoadingSkeleton className="h-4 w-3/4 mb-4" />
      <div className="flex gap-2 mb-4">
        <LoadingSkeleton className="h-6 w-24 rounded-full" />
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <LoadingSkeleton className="h-4 w-20" />
        <div className="flex gap-1">
          <LoadingSkeleton className="h-8 w-8 rounded-lg" />
          <LoadingSkeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export function AssistantsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <AssistantCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function TableRowSkeleton({ columns = 7 }: { columns?: number }) {
  return (
    <tr className="border-b border-white/5">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <LoadingSkeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  )
}

export function CallsTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} columns={7} />
      ))}
    </>
  )
}
