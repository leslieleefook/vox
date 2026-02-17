/**
 * AssistantFormModal Component
 * Modal for creating and editing assistants
 */

'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { VoxCard, VoxButton, VoxInput } from '@/components/vox'
import type { Assistant, AssistantCreate, AssistantUpdate } from '@/lib/api'

interface AssistantFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: AssistantCreate | AssistantUpdate) => Promise<void>
  assistant?: Assistant | null
  clientId: string
  isLoading?: boolean
}

const DEFAULT_VOICE_OPTIONS = [
  { value: 'mallory', label: 'Mallory (Female)' },
  { value: 'wise_man', label: 'Wise Man (Male)' },
  { value: 'friendly_girl', label: 'Friendly Girl (Female)' },
]

const DEFAULT_MODEL_OPTIONS = [
  { value: 'groq/llama-3.1-8b-instant', label: 'Llama 3.1 8B (Groq) - Fast' },
  { value: 'meta-llama/llama-3.1-70b-instruct', label: 'Llama 3.1 70B (OpenRouter)' },
  { value: 'deepseek/deepseek-chat', label: 'DeepSeek Chat' },
]

export function AssistantFormModal({
  isOpen,
  onClose,
  onSubmit,
  assistant,
  clientId,
  isLoading = false,
}: AssistantFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    system_prompt: '',
    minimax_voice_id: 'mallory',
    llm_model: 'groq/llama-3.1-8b-instant',
    first_message: '',
  })
  const [error, setError] = useState<string | null>(null)

  // Populate form when editing
  useEffect(() => {
    if (assistant) {
      setFormData({
        name: assistant.name,
        system_prompt: assistant.system_prompt,
        minimax_voice_id: assistant.minimax_voice_id || 'mallory',
        llm_model: assistant.llm_model || 'groq/llama-3.1-8b-instant',
        first_message: assistant.first_message || '',
      })
    } else {
      // Reset form for new assistant
      setFormData({
        name: '',
        system_prompt: '',
        minimax_voice_id: 'mallory',
        llm_model: 'groq/llama-3.1-8b-instant',
        first_message: '',
      })
    }
    setError(null)
  }, [assistant, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.name.trim()) {
      setError('Name is required')
      return
    }
    if (!formData.system_prompt.trim()) {
      setError('System prompt is required')
      return
    }

    try {
      if (assistant) {
        // Update existing assistant
        await onSubmit({
          name: formData.name,
          system_prompt: formData.system_prompt,
          minimax_voice_id: formData.minimax_voice_id,
          llm_model: formData.llm_model,
          first_message: formData.first_message || null,
        })
      } else {
        // Create new assistant
        await onSubmit({
          name: formData.name,
          system_prompt: formData.system_prompt,
          client_id: clientId,
          minimax_voice_id: formData.minimax_voice_id,
          llm_model: formData.llm_model,
          first_message: formData.first_message || null,
        })
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose()
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-lg"
          >
            <VoxCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">
                  {assistant ? 'Edit Assistant' : 'Create Assistant'}
                </h2>
                <VoxButton variant="ghost" size="icon" onClick={onClose}>
                  <X size={18} />
                </VoxButton>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-vox-error/10 border border-vox-error/20 text-vox-error text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Name</label>
                  <VoxInput
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Customer Support"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">System Prompt</label>
                  <textarea
                    name="system_prompt"
                    value={formData.system_prompt}
                    onChange={handleChange}
                    placeholder="You are a helpful assistant..."
                    disabled={isLoading}
                    rows={4}
                    className="flex w-full rounded-lg border border-white/10 bg-white/5 backdrop-blur-md px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-vox-idle/50 focus:border-vox-idle/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">First Message (optional)</label>
                  <VoxInput
                    name="first_message"
                    value={formData.first_message}
                    onChange={handleChange}
                    placeholder="Hello! How can I help you today?"
                    disabled={isLoading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Voice</label>
                    <select
                      name="minimax_voice_id"
                      value={formData.minimax_voice_id}
                      onChange={handleChange}
                      disabled={isLoading}
                      className="flex h-10 w-full rounded-lg border border-white/10 bg-white/5 backdrop-blur-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-vox-idle/50 focus:border-vox-idle/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
                    >
                      {DEFAULT_VOICE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-slate-900">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-1">LLM Model</label>
                    <select
                      name="llm_model"
                      value={formData.llm_model}
                      onChange={handleChange}
                      disabled={isLoading}
                      className="flex h-10 w-full rounded-lg border border-white/10 bg-white/5 backdrop-blur-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-vox-idle/50 focus:border-vox-idle/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
                    >
                      {DEFAULT_MODEL_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-slate-900">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <VoxButton
                    type="button"
                    variant="ghost"
                    onClick={onClose}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Cancel
                  </VoxButton>
                  <VoxButton
                    type="submit"
                    variant="primary"
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        {assistant ? 'Saving...' : 'Creating...'}
                      </>
                    ) : assistant ? (
                      'Save Changes'
                    ) : (
                      'Create Assistant'
                    )}
                  </VoxButton>
                </div>
              </form>
            </VoxCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AssistantFormModal
