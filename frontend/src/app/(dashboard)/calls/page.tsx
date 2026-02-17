'use client'

import { useState } from 'react'
import { Search, Phone, Clock, ArrowUpDown } from 'lucide-react'
import { motion } from 'framer-motion'
import { VoxCard, VoxInput, VoxBadge } from '@/components/vox'

// Mock data - would come from API
const mockCalls = [
  {
    id: '1',
    phoneNumber: '+18685551234',
    callerId: '+18687770001',
    assistant: 'Customer Support',
    duration: 245,
    latency: 680,
    status: 'completed',
    transcript: 'Hello, I need help with my order...',
    timestamp: new Date('2024-01-15T10:30:00'),
  },
  {
    id: '2',
    phoneNumber: '+18685555678',
    callerId: '+18687770002',
    assistant: 'Sales Assistant',
    duration: 180,
    latency: 720,
    status: 'completed',
    transcript: 'Hi, I am interested in your product...',
    timestamp: new Date('2024-01-15T10:15:00'),
  },
  {
    id: '3',
    phoneNumber: '+18685551234',
    callerId: '+18687770003',
    assistant: 'Customer Support',
    duration: 0,
    latency: null,
    status: 'missed',
    transcript: null,
    timestamp: new Date('2024-01-15T09:45:00'),
  },
]

export default function CallsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [calls] = useState(mockCalls)

  const filteredCalls = calls.filter(
    (c) =>
      c.phoneNumber.includes(searchQuery) ||
      c.callerId.includes(searchQuery) ||
      c.assistant.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
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
            placeholder="Search by phone or assistant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <VoxBadge variant="default" className="self-center">
          Last 7 days
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
                  Assistant
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
                    {call.timestamp.toLocaleTimeString()}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-slate-500" />
                      <span className="text-sm">{call.phoneNumber}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-400">
                    {call.callerId}
                  </td>
                  <td className="p-4 text-sm">{call.assistant}</td>
                  <td className="p-4 text-sm">
                    {call.duration > 0 ? formatDuration(call.duration) : '-'}
                  </td>
                  <td className="p-4 text-sm">
                    {call.latency ? `${call.latency}ms` : '-'}
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
      </VoxCard>

      {filteredCalls.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400">No calls found</p>
        </div>
      )}
    </div>
  )
}
