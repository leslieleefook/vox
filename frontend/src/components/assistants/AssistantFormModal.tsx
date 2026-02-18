/**
 * AssistantFormModal Component
 * Modal for creating and editing assistants
 */

'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
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

const VOICE_OPTIONS = [
  { value: 'mallory', label: 'Mallory (Female)' },
  { value: 'wise_man', label: 'Wise Man (Male)' },
  { value: 'friendly_girl', label: 'Friendly Girl (Female)' },
  { value: 'seraphina', label: 'Seraphina (Female)' },
  { value: 'alex', label: 'Alex (Male)' },
]

const LLM_MODEL_OPTIONS = [
  { value: 'groq/llama-3.1-8b-instant', label: 'Llama 3.1 8B (Groq) - Fast' },
  { value: 'groq/llama-3.1-70b-versatile', label: 'Llama 3.1 70B (Groq)' },
  { value: 'meta-llama/llama-3.1-70b-instruct', label: 'Llama 3.1 70B (OpenRouter)' },
  { value: 'deepseek/deepseek-chat', label: 'DeepSeek Chat' },
  { value: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku (OpenRouter)' },
]

const STT_PROVIDER_OPTIONS = [
  { value: 'deepgram', label: 'Deepgram (Recommended)' },
  { value: 'whisper', label: 'OpenAI Whisper' },
  { value: 'assemblyai', label: 'AssemblyAI' },
]

const DEFAULT_STRUCTURED_OUTPUT = `{
  "type": "object",
  "properties": {
    "summary": { "type": "string" },
    "sentiment": { "type": "string", "enum": ["positive", "neutral", "negative"] },
    "action_items": {
      "type": "array",
      "items": { "type": "string" }
    }
  }
}`

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
    stt_provider: 'deepgram',
    structured_output_schema: '',
    webhook_url: '',
    first_message: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Populate form when editing
  useEffect(() => {
    if (assistant) {
      setFormData({
        name: assistant.name,
        system_prompt: assistant.system_prompt,
        minimax_voice_id: assistant.minimax_voice_id || 'mallory',
        llm_model: assistant.llm_model || 'groq/llama-3.1-8b-instant',
        stt_provider: assistant.stt_provider || 'deepgram',
        structured_output_schema: assistant.structured_output_schema || '',
        webhook_url: assistant.webhook_url || '',
        first_message: assistant.first_message || '',
      })
      // Show advanced if any advanced field has data
      if (assistant.structured_output_schema || assistant.webhook_url) {
        setShowAdvanced(true)
      }
    } else {
      // Reset form for new assistant
      setFormData({
        name: '',
        system_prompt: '',
        minimax_voice_id: 'mallory',
        llm_model: 'groq/llama-3.1-8b-instant',
        stt_provider: 'deepgram',
        structured_output_schema: '',
        webhook_url: '',
        first_message: '',
      })
      setShowAdvanced(false)
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

    // Validate JSON schema if provided
    if (formData.structured_output_schema.trim()) {
      try {
        JSON.parse(formData.structured_output_schema)
      } catch {
        setError('Structured output schema must be valid JSON')
        return
      }
    }

    // Validate webhook URL if provided
    if (formData.webhook_url.trim()) {
      try {
        new URL(formData.webhook_url)
      } catch {
        setError('Webhook URL must be a valid URL')
        return
      }
    }

    try {
      const baseData = {
        name: formData.name,
        system_prompt: formData.system_prompt,
        minimax_voice_id: formData.minimax_voice_id,
        llm_model: formData.llm_model,
        stt_provider: formData.stt_provider,
        structured_output_schema: formData.structured_output_schema.trim() || null,
        webhook_url: formData.webhook_url.trim() || null,
        first_message: formData.first_message.trim() || null,
      }

      if (assistant) {
        // Update existing assistant
        await onSubmit(baseData)
      } else {
        // Create new assistant
        await onSubmit({
          ...baseData,
          client_id: clientId,
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose()
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-2xl my-8"
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

                {/* Basic Settings */}
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

                {/* Voice & AI Settings */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Voice (TTS)</label>
                    <select
                      name="minimax_voice_id"
                      value={formData.minimax_voice_id}
                      onChange={handleChange}
                      disabled={isLoading}
                      className="flex h-10 w-full rounded-lg border border-white/10 bg-white/5 backdrop-blur-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-vox-idle/50 focus:border-vox-idle/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
                    >
                      {VOICE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-slate-900">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Speech-to-Text</label>
                    <select
                      name="stt_provider"
                      value={formData.stt_provider}
                      onChange={handleChange}
                      disabled={isLoading}
                      className="flex h-10 w-full rounded-lg border border-white/10 bg-white/5 backdrop-blur-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-vox-idle/50 focus:border-vox-idle/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
                    >
                      {STT_PROVIDER_OPTIONS.map((opt) => (
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
                      {LLM_MODEL_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-slate-900">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Advanced Settings Toggle */}
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  Advanced Settings (Structured Output & Webhooks)
                </button>

                {/* Advanced Settings */}
                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4 overflow-hidden"
                    >
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">
                          Structured Output Schema (JSON)
                        </label>
                        <textarea
                          name="structured_output_schema"
                          value={formData.structured_output_schema}
                          onChange={handleChange}
                          placeholder={DEFAULT_STRUCTURED_OUTPUT}
                          disabled={isLoading}
                          rows={6}
                          className="flex w-full rounded-lg border border-white/10 bg-white/5 backdrop-blur-md px-3 py-2 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-vox-idle/50 focus:border-vox-idle/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 resize-none"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          Define a JSON schema for structured call analysis output
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm text-slate-400 mb-1">
                          Webhook URL
                        </label>
                        <VoxInput
                          name="webhook_url"
                          value={formData.webhook_url}
                          onChange={handleChange}
                          placeholder="https://your-server.com/webhook/call-ended"
                          disabled={isLoading}
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          Receive POST requests with call analysis when calls end
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

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
