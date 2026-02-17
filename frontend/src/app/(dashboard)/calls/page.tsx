'use client'

import { useState } from 'react'
import { Search, Phone, Clock, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { VoxCard, VoxInput, VoxBadge, VoxButton } from '@/components/vox'
import { useCallLogs } from '@/lib/hooks'
import { ErrorState } from '@/components/ui/ErrorState'
import { CallsTableSkeleton } from '@/components/ui/LoadingSkeleton'

// Default client ID for demo purposes
// In production, this would come from auth context
const DEFAULT_CLIENT_ID = '00000000-0000-0000-0000-000000000001'

export default function CallsPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const {
    calls,
    total,
    page,
    totalPages,
    isLoading,
    error,
    refetch,
    goToPage,
    nextPage,
    prevPage,
  } = useCallLogs({ clientId: DEFAULT_CLIENT_ID, pageSize: 10 })

  const filteredCalls = calls.filter(
    (c) =>
      c.phone_number.includes(searchQuery) ||
      c.caller_id.includes(searchQuery) ||
      (c.transcript && c.transcript.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatLatency = (ms: number | null) => {
    if (!ms) return '-'
    return `${ms}ms`
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-readable">Call Logs</h1>
          <p className="text-slate-400 mt-1 tracking-readable">
            View and analyze your call history
          </p>
        </div>
        <VoxCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-slate-400 font-medium tracking-readable">Time</th>
                  <th className="text-left p-4 text-slate-400 font-medium tracking-readable">Phone</th>
                  <th className="text-left p-4 text-slate-400 font-medium tracking-readable">Caller</th>
                  <th className="text-left p-4 text-slate-400 font-medium tracking-readable">Duration</th>
                  <th className="text-left p-4 text-slate-400 font-medium tracking-readable">Latency</th>
                  <th className="text-left p-4 text-slate-400 font-medium tracking-readable">Status</th>
                </tr>
              </thead>
              <tbody>
                <CallsTableSkeleton rows={5} />
              </tbody>
            </table>
          </div>
        </VoxCard>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-readable">Call Logs</h1>
          <p className="text-slate-400 mt-1 tracking-readable">
            View and analyze your call history
          </p>
        </div>
        <ErrorState message={error} onRetry={refetch} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-readable">Call Logs</h1>
        <p className="text-slate-400 mt-1 tracking-readable">
          View and analyze your call history
        </p>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <VoxInput
            placeholder="Search by phone or transcript..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <VoxBadge variant="default" className="self-center">
          {total} total calls
        </VoxBadge>
      </div>

      {/* Calls Table */}
      <VoxCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-slate-400 font-medium tracking-readable">
                  <div className="flex items-center gap-2">
                    <Clock size={14} />
                    Time
                    <ArrowUpDown size={12} />
                  </div>
                </th>
                <th className="text-left p-4 text-slate-400 font-medium tracking-readable">
                  Phone
                </th>
                <th className="text-left p-4 text-slate-400 font-medium tracking-readable">
                  Caller
                </th>
                <th className="text-left p-4 text-slate-400 font-medium tracking-readable">
                  Duration
                </th>
                <th className="text-left p-4 text-slate-400 font-medium tracking-readable">
                  Latency
                </th>
                <th className="text-left p-4 text-slate-400 font-medium tracking-readable">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCalls.map((call, index) => (
                <motion.tr
                  key={call.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-white/5 hover:bg-white/5 cursor-pointer"
                >
                  <td className="p-4 text-sm">
                    {new Date(call.created_at).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-slate-500" />
                      <span className="text-sm">{call.phone_number}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-400">
                    {call.caller_id}
                  </td>
                  <td className="p-4 text-sm">
                    {formatDuration(call.duration_seconds)}
                  </td>
                  <td className="p-4 text-sm">
                    {formatLatency(call.latency_ms)}
                  </td>
                  <td className="p-4">
                    <VoxBadge
                      variant={
                        call.status === 'completed' ? 'success' : 'error'
                      }
                    >
                      {call.status}
                    </VoxBadge>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-white/10">
            <p className="text-sm text-slate-400">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <VoxButton
                variant="ghost"
                size="sm"
                onClick={prevPage}
                disabled={page <= 1}
              >
                <ChevronLeft size={16} />
                Previous
              </VoxButton>
              <VoxButton
                variant="ghost"
                size="sm"
                onClick={nextPage}
                disabled={page >= totalPages}
              >
                Next
                <ChevronRight size={16} />
              </VoxButton>
            </div>
          </div>
        )}
      </VoxCard>

      {filteredCalls.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-slate-400">
            {searchQuery ? 'No calls found matching your search' : 'No call logs yet. Calls will appear here once they are made.'}
          </p>
        </div>
      )}
    </div>
  )
}
