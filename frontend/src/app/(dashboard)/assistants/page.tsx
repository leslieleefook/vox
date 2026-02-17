'use client'

import { useState } from 'react'
import { Plus, Search, MoreVertical, Phone, Trash2, Edit } from 'lucide-react'
import { motion } from 'framer-motion'
import { VoxCard, VoxButton, VoxInput, PulseIndicator, VoxBadge } from '@/components/vox'

// Mock data - would come from API
const mockAssistants = [
  {
    id: '1',
    name: 'Customer Support',
    systemPrompt: 'You are a helpful customer support agent...',
    voiceId: 'mallory',
    llmModel: 'meta-llama/llama-3.1-70b-instruct',
    phoneNumbers: ['+18685551234'],
    status: 'active',
    callsToday: 47,
  },
  {
    id: '2',
    name: 'Sales Assistant',
    systemPrompt: 'You are a friendly sales representative...',
    voiceId: 'wise_man',
    llmModel: 'deepseek/deepseek-chat',
    phoneNumbers: ['+18685555678'],
    status: 'idle',
    callsToday: 12,
  },
  {
    id: '3',
    name: 'Appointment Scheduler',
    systemPrompt: 'You help customers schedule appointments...',
    voiceId: 'mallory',
    llmModel: 'meta-llama/llama-3.1-70b-instruct',
    phoneNumbers: [],
    status: 'idle',
    callsToday: 0,
  },
]

export default function AssistantsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [assistants, setAssistants] = useState(mockAssistants)

  const filteredAssistants = assistants.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-readable">Assistants</h1>
          <p className="text-slate-400 mt-1 tracking-readable">
            Manage your AI voice assistants
          </p>
        </div>
        <VoxButton variant="primary">
          <Plus size={18} />
          Create Assistant
        </VoxButton>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
        />
        <VoxInput
          placeholder="Search assistants..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Assistants Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredAssistants.map((assistant, index) => (
          <motion.div
            key={assistant.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <VoxCard
              className="p-5 h-full cursor-pointer"
              glowColor={assistant.status === 'active' ? 'active' : 'none'}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <PulseIndicator
                    status={assistant.status === 'active' ? 'active' : 'idle'}
                    size="md"
                  />
                  <div>
                    <h3 className="font-semibold tracking-readable">
                      {assistant.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {assistant.llmModel.split('/')[1]}
                    </p>
                  </div>
                </div>
                <VoxButton variant="ghost" size="icon">
                  <MoreVertical size={16} />
                </VoxButton>
              </div>

              <p className="text-sm text-slate-400 line-clamp-2 mb-4 tracking-readable">
                {assistant.systemPrompt}
              </p>

              <div className="flex items-center gap-2 mb-4">
                {assistant.phoneNumbers.length > 0 ? (
                  assistant.phoneNumbers.map((num) => (
                    <VoxBadge key={num} variant="default">
                      <Phone size={12} className="mr-1" />
                      {num}
                    </VoxBadge>
                  ))
                ) : (
                  <span className="text-xs text-slate-500">No phone numbers</span>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="text-sm">
                  <span className="text-slate-500">Today:</span>{' '}
                  <span className="text-white font-medium">
                    {assistant.callsToday} calls
                  </span>
                </div>
                <div className="flex gap-1">
                  <VoxButton variant="ghost" size="icon">
                    <Edit size={14} />
                  </VoxButton>
                  <VoxButton variant="ghost" size="icon">
                    <Trash2 size={14} className="text-vox-error" />
                  </VoxButton>
                </div>
              </div>
            </VoxCard>
          </motion.div>
        ))}
      </div>

      {filteredAssistants.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400">No assistants found</p>
        </div>
      )}
    </div>
  )
}
