'use client'

import { useState } from 'react'
import { Plus, Search, MoreVertical, Phone, Trash2, Edit, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { VoxCard, VoxButton, VoxInput, PulseIndicator, VoxBadge } from '@/components/vox'
import { useAssistants } from '@/lib/hooks'
import { AssistantFormModal } from '@/components/assistants/AssistantFormModal'
import { ErrorState } from '@/components/ui/ErrorState'
import { AssistantsGridSkeleton } from '@/components/ui/LoadingSkeleton'
import type { Assistant, AssistantCreate, AssistantUpdate } from '@/lib/api'

// Default client ID for demo purposes
// In production, this would come from auth context
const DEFAULT_CLIENT_ID = 'df4ec656-3ed9-4f97-b94b-c79f9835ac95'

export default function AssistantsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAssistant, setEditingAssistant] = useState<Assistant | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const {
    assistants,
    isLoading,
    error,
    refetch,
    createAssistant,
    updateAssistant,
    deleteAssistant,
  } = useAssistants(DEFAULT_CLIENT_ID)

  const filteredAssistants = assistants.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreate = () => {
    setEditingAssistant(null)
    setIsModalOpen(true)
  }

  const handleEdit = (assistant: Assistant) => {
    setEditingAssistant(assistant)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assistant?')) return
    setDeletingId(id)
    try {
      await deleteAssistant(id)
    } catch (err) {
      console.error('Failed to delete assistant:', err)
      alert('Failed to delete assistant')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSubmit = async (data: AssistantCreate | AssistantUpdate) => {
    setIsSubmitting(true)
    try {
      if (editingAssistant) {
        await updateAssistant(editingAssistant.id, data as AssistantUpdate)
      } else {
        await createAssistant(data as AssistantCreate)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingAssistant(null)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-readable">Assistants</h1>
            <p className="text-slate-400 mt-1 tracking-readable">
              Manage your AI voice assistants
            </p>
          </div>
          <VoxButton variant="primary" disabled>
            <Plus size={18} />
            Create Assistant
          </VoxButton>
        </div>
        <AssistantsGridSkeleton />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-readable">Assistants</h1>
          <p className="text-slate-400 mt-1 tracking-readable">
            Manage your AI voice assistants
          </p>
        </div>
        <ErrorState message={error} onRetry={refetch} />
      </div>
    )
  }

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
        <VoxButton variant="primary" onClick={handleCreate}>
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
              glowColor="none"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <PulseIndicator
                    status="idle"
                    size="md"
                  />
                  <div>
                    <h3 className="font-semibold tracking-readable">
                      {assistant.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {assistant.llm_model.split('/')[1] || assistant.llm_model}
                    </p>
                  </div>
                </div>
                <VoxButton variant="ghost" size="icon">
                  <MoreVertical size={16} />
                </VoxButton>
              </div>

              <p className="text-sm text-slate-400 line-clamp-2 mb-4 tracking-readable">
                {assistant.system_prompt}
              </p>

              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-slate-500">No phone numbers assigned</span>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="text-sm">
                  <span className="text-slate-500">Created:</span>{' '}
                  <span className="text-white font-medium">
                    {new Date(assistant.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex gap-1">
                  <VoxButton
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(assistant)}
                    disabled={deletingId === assistant.id}
                  >
                    <Edit size={14} />
                  </VoxButton>
                  <VoxButton
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(assistant.id)}
                    disabled={deletingId === assistant.id}
                  >
                    {deletingId === assistant.id ? (
                      <Loader2 size={14} className="animate-spin text-vox-error" />
                    ) : (
                      <Trash2 size={14} className="text-vox-error" />
                    )}
                  </VoxButton>
                </div>
              </div>
            </VoxCard>
          </motion.div>
        ))}
      </div>

      {filteredAssistants.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400">
            {searchQuery ? 'No assistants found matching your search' : 'No assistants yet. Create your first assistant to get started.'}
          </p>
        </div>
      )}

      {/* Modal */}
      <AssistantFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        assistant={editingAssistant}
        clientId={DEFAULT_CLIENT_ID}
        isLoading={isSubmitting}
      />
    </div>
  )
}
