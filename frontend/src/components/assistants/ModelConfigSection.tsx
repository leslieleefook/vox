/**
 * ModelConfigSection Component
 * Collapsible accordion for LLM model configuration with:
 * - Provider/Model coupled dropdowns (OpenRouter, OpenAI, Anthropic)
 * - First Message Mode selection
 * - System Prompt textarea with AI Generate button (placeholder)
 * - Temperature slider + synchronized input
 * - Max Tokens input
 * - Files/RAG placeholder for future implementation
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronDown, ChevronUp, Sparkles, FileText } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { VoxInput, VoxSlider } from '@/components/vox'
import {
  LLM_PROVIDERS,
  FIRST_MESSAGE_MODES,
  getModelsForProvider,
  getDefaultModelForProvider,
  isFirstMessageDisabled,
  DEFAULT_LLM_PROVIDER,
  DEFAULT_FIRST_MESSAGE_MODE,
  DEFAULT_TEMPERATURE,
  DEFAULT_MAX_TOKENS,
  TEMPERATURE_MIN,
  TEMPERATURE_MAX,
  TEMPERATURE_STEP,
  MAX_TOKENS_MIN,
  MAX_TOKENS_MAX,
  type LLMProviderId,
  type FirstMessageModeId,
} from '@/lib/constants/llmProviders'

interface ModelConfigSectionProps {
  llmProvider: string
  llmModel: string
  firstMessageMode: string
  firstMessage: string
  systemPrompt: string
  temperature: number
  maxTokens: number
  onChange: (field: string, value: string | number) => void
  disabled?: boolean
}

export function ModelConfigSection({
  llmProvider,
  llmModel,
  firstMessageMode,
  firstMessage,
  systemPrompt,
  temperature,
  maxTokens,
  onChange,
  disabled = false,
}: ModelConfigSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Auto-expand if advanced settings are non-default
  useEffect(() => {
    const hasNonDefaults =
      llmProvider !== DEFAULT_LLM_PROVIDER ||
      firstMessageMode !== DEFAULT_FIRST_MESSAGE_MODE ||
      temperature !== DEFAULT_TEMPERATURE ||
      maxTokens !== DEFAULT_MAX_TOKENS ||
      systemPrompt.trim().length > 0

    if (hasNonDefaults) {
      setIsExpanded(true)
    }
  }, [llmProvider, firstMessageMode, temperature, maxTokens, systemPrompt])

  // Handle provider change - reset model to first available for new provider
  const handleProviderChange = useCallback(
    (newProvider: LLMProviderId) => {
      onChange('llm_provider', newProvider)
      // Auto-reset model to first available for the new provider
      const defaultModel = getDefaultModelForProvider(newProvider)
      onChange('llm_model', defaultModel)
    },
    [onChange]
  )

  const glassSelectClasses =
    'flex h-10 w-full rounded-lg border border-white/10 bg-white/5 backdrop-blur-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-vox-idle/50 focus:border-vox-idle/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200'

  const currentModels = getModelsForProvider(llmProvider as LLMProviderId)
  const isFirstMessageInputDisabled =
    isFirstMessageDisabled(firstMessageMode as FirstMessageModeId) || disabled

  return (
    <div className="space-y-3">
      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
      >
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        Model Configuration
      </button>

      {/* Collapsible Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pl-4 space-y-4 border-l border-white/10">
              {/* Row 1: Provider & Model Dropdowns */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    LLM Provider
                  </label>
                  <select
                    name="llm_provider"
                    value={llmProvider}
                    onChange={(e) =>
                      handleProviderChange(e.target.value as LLMProviderId)
                    }
                    disabled={disabled}
                    className={glassSelectClasses}
                  >
                    {LLM_PROVIDERS.map((provider) => (
                      <option
                        key={provider.id}
                        value={provider.id}
                        className="bg-slate-900"
                      >
                        {provider.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Model
                  </label>
                  <select
                    name="llm_model"
                    value={llmModel}
                    onChange={(e) => onChange('llm_model', e.target.value)}
                    disabled={disabled}
                    className={glassSelectClasses}
                  >
                    {currentModels.map((model) => (
                      <option
                        key={model.id}
                        value={model.id}
                        className="bg-slate-900"
                      >
                        {model.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: First Message Mode */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  First Message Mode
                </label>
                <select
                  name="first_message_mode"
                  value={firstMessageMode}
                  onChange={(e) => onChange('first_message_mode', e.target.value)}
                  disabled={disabled}
                  className={glassSelectClasses}
                >
                  {FIRST_MESSAGE_MODES.map((mode) => (
                    <option
                      key={mode.id}
                      value={mode.id}
                      className="bg-slate-900"
                    >
                      {mode.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  {FIRST_MESSAGE_MODES.find((m) => m.id === firstMessageMode)
                    ?.description ?? ''}
                </p>
              </div>

              {/* Row 3: First Message Input (conditional) */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  First Message
                </label>
                <VoxInput
                  name="first_message"
                  value={firstMessage}
                  onChange={(e) => onChange('first_message', e.target.value)}
                  placeholder="Hello! How can I help you today?"
                  disabled={isFirstMessageInputDisabled}
                />
                {isFirstMessageDisabled(
                  firstMessageMode as FirstMessageModeId
                ) && (
                  <p className="text-xs text-slate-500 mt-1">
                    Disabled in {firstMessageMode.replace('-', ' ')} mode
                  </p>
                )}
              </div>

              {/* Row 4: System Prompt Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm text-slate-400">System Prompt</label>
                  <button
                    type="button"
                    disabled
                    className="flex items-center gap-1 text-xs text-slate-500 cursor-not-allowed"
                    title="AI generation coming in Phase 2"
                  >
                    <Sparkles size={12} />
                    <span>Generate</span>
                  </button>
                </div>
                <textarea
                  name="system_prompt"
                  value={systemPrompt}
                  onChange={(e) => onChange('system_prompt', e.target.value)}
                  placeholder="You are a helpful voice assistant..."
                  disabled={disabled}
                  rows={4}
                  className="flex w-full rounded-lg border border-white/10 bg-white/5 backdrop-blur-md px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-vox-idle/50 focus:border-vox-idle/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 resize-y"
                />
              </div>

              {/* Row 5: Files (RAG) - Disabled Placeholder */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FileText size={14} className="text-slate-500" />
                  <label className="text-sm text-slate-500">
                    Knowledge Files (RAG)
                  </label>
                </div>
                <div className="flex h-10 w-full rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-sm text-slate-600 cursor-not-allowed">
                  <span className="flex items-center gap-2">
                    <span>Coming in Phase 2</span>
                  </span>
                </div>
              </div>

              {/* Row 6: Max Tokens & Temperature */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Max Tokens
                  </label>
                  <input
                    type="number"
                    name="max_tokens"
                    value={maxTokens}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10)
                      if (!isNaN(val)) {
                        const clamped = Math.min(
                          MAX_TOKENS_MAX,
                          Math.max(MAX_TOKENS_MIN, val)
                        )
                        onChange('max_tokens', clamped)
                      }
                    }}
                    onBlur={(e) => {
                      const val = parseInt(e.target.value, 10)
                      if (isNaN(val)) {
                        onChange('max_tokens', DEFAULT_MAX_TOKENS)
                      } else {
                        const clamped = Math.min(
                          MAX_TOKENS_MAX,
                          Math.max(MAX_TOKENS_MIN, val)
                        )
                        onChange('max_tokens', clamped)
                      }
                    }}
                    min={MAX_TOKENS_MIN}
                    max={MAX_TOKENS_MAX}
                    disabled={disabled}
                    className="flex h-10 w-full rounded-lg border border-white/10 bg-white/5 backdrop-blur-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-vox-idle/50 focus:border-vox-idle/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Response length limit
                  </p>
                </div>

                <VoxSlider
                  name="temperature"
                  value={temperature}
                  onChange={(val) => onChange('temperature', val)}
                  min={TEMPERATURE_MIN}
                  max={TEMPERATURE_MAX}
                  step={TEMPERATURE_STEP}
                  disabled={disabled}
                  label="Temperature"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ModelConfigSection
