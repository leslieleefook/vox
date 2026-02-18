/**
 * VoiceConfigSection Component
 * Collapsible accordion for voice configuration with:
 * - MiniMax voice selection (expanded list)
 * - Model selection (speech-02-turbo, speech-02-hd)
 * - Manual Voice ID toggle for cloned voices
 */

'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { VoxInput } from '@/components/vox'
import {
  MINIMAX_VOICE_OPTIONS,
  TTS_MODEL_OPTIONS,
  DEFAULT_VOICE_ID,
  DEFAULT_TTS_MODEL,
} from '@/lib/constants/minimaxVoices'

interface VoiceConfigSectionProps {
  voiceId: string
  ttsModel: string
  isManualId: boolean
  onChange: (field: string, value: string | boolean) => void
  disabled?: boolean
}

export function VoiceConfigSection({
  voiceId,
  ttsModel,
  isManualId,
  onChange,
  disabled = false,
}: VoiceConfigSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Auto-expand if manual mode is enabled
  useEffect(() => {
    if (isManualId) {
      setIsExpanded(true)
    }
  }, [isManualId])

  const glassSelectClasses =
    'flex h-10 w-full rounded-lg border border-white/10 bg-white/5 backdrop-blur-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-vox-idle/50 focus:border-vox-idle/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200'

  return (
    <div className="space-y-3">
      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
      >
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        Voice Configuration
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
              {/* Manual Voice ID Toggle */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="tts_is_manual_id"
                  checked={isManualId}
                  onChange={(e) => onChange('tts_is_manual_id', e.target.checked)}
                  disabled={disabled}
                  className="h-4 w-4 rounded border-white/20 bg-white/5 text-vox-idle focus:ring-vox-idle/50"
                />
                <label
                  htmlFor="tts_is_manual_id"
                  className="text-sm text-slate-300 cursor-pointer"
                >
                  Use Custom Voice ID (for cloned voices)
                </label>
              </div>

              {/* Voice Selection - Conditional */}
              {isManualId ? (
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Custom Voice ID
                  </label>
                  <VoxInput
                    name="minimax_voice_id"
                    value={voiceId}
                    onChange={(e) => onChange('minimax_voice_id', e.target.value)}
                    placeholder="e.g., voice-abc123def456"
                    disabled={disabled}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Enter the voice ID from your MiniMax cloned voice
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Voice (TTS)
                  </label>
                  <select
                    name="minimax_voice_id"
                    value={voiceId}
                    onChange={(e) => onChange('minimax_voice_id', e.target.value)}
                    disabled={disabled}
                    className={glassSelectClasses}
                  >
                    {MINIMAX_VOICE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-slate-900">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* TTS Model Selection */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  TTS Model
                </label>
                <select
                  name="tts_model"
                  value={ttsModel}
                  onChange={(e) => onChange('tts_model', e.target.value)}
                  disabled={disabled}
                  className={glassSelectClasses}
                >
                  {TTS_MODEL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-slate-900">
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Turbo: Faster latency | HD: Higher quality
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default VoiceConfigSection
