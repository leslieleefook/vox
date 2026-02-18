'use client'

import * as React from 'react'
import { Plus } from 'lucide-react'
import { VoxInput } from '@/components/vox/VoxInput'
import { VoxButton } from '@/components/vox/VoxButton'
import { VoxBadge } from '@/components/vox/VoxBadge'
import { cn } from '@/lib/utils'
import { MESSAGE_TRIGGER_OPTIONS } from '@/lib/constants/toolTypes'
import type { MessageTrigger } from '@/lib/constants/toolTypes'

export interface ToolMessage {
  trigger: MessageTrigger
  message: string
}

export interface MessagesSectionProps {
  messages: ToolMessage[]
  onChange: (messages: ToolMessage[]) => void
  disabled?: boolean
}

const TRIGGER_COLORS: Record<MessageTrigger, string> = {
  on_start: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  on_success: 'bg-green-500/20 text-green-300 border-green-500/30',
  on_error: 'bg-red-500/20 text-red-300 border-red-500/30',
}

export function MessagesSection({
  messages,
  onChange,
  disabled = false,
}: MessagesSectionProps) {
  const [selectedTrigger, setSelectedTrigger] = React.useState<MessageTrigger | null>(null)

  const availableTriggers = MESSAGE_TRIGGER_OPTIONS.filter(
    (option) => !messages.some((m) => m.trigger === option.id)
  )

  const addMessage = (trigger: MessageTrigger) => {
    onChange([...messages, { trigger, message: '' }])
    setSelectedTrigger(null)
  }

  const updateMessage = (index: number, message: string) => {
    const newMessages = [...messages]
    newMessages[index] = { ...newMessages[index], message }
    onChange(newMessages)
  }

  const removeMessage = (index: number) => {
    onChange(messages.filter((_, i) => i !== index))
  }

  const getTriggerLabel = (trigger: MessageTrigger) => {
    return MESSAGE_TRIGGER_OPTIONS.find((o) => o.id === trigger)?.label || trigger
  }

  // Sort messages by trigger order
  const sortedMessages = [...messages].sort((a, b) => {
    const order = MESSAGE_TRIGGER_OPTIONS.map((o) => o.id)
    return order.indexOf(a.trigger) - order.indexOf(b.trigger)
  })

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-white">Conversational Messages</label>
        <p className="text-xs text-slate-500 mt-1">
          Configure messages that the assistant will say during tool execution.
        </p>
      </div>

      {/* Existing messages */}
      {sortedMessages.length > 0 && (
        <div className="space-y-3">
          {sortedMessages.map((msg, index) => (
            <div key={msg.trigger} className="space-y-2">
              <div className="flex items-center justify-between">
                <VoxBadge className={cn('border', TRIGGER_COLORS[msg.trigger])}>
                  {getTriggerLabel(msg.trigger)}
                </VoxBadge>
                {!disabled && (
                  <VoxButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMessage(messages.findIndex((m) => m.trigger === msg.trigger))}
                    className="text-slate-400 hover:text-red-400"
                  >
                    Remove
                  </VoxButton>
                )}
              </div>
              <VoxInput
                placeholder={`Message when tool ${msg.trigger.replace('on_', '')}...`}
                value={msg.message}
                onChange={(e) => updateMessage(messages.findIndex((m) => m.trigger === msg.trigger), e.target.value)}
                disabled={disabled}
              />
            </div>
          ))}
        </div>
      )}

      {/* Add message dropdown */}
      {!disabled && availableTriggers.length > 0 && (
        <div className="space-y-2">
          {selectedTrigger ? (
            <div className="flex gap-2">
              <select
                value={selectedTrigger}
                onChange={(e) => setSelectedTrigger(e.target.value as MessageTrigger)}
                className={cn(
                  'flex h-10 flex-1 rounded-lg border border-white/10',
                  'bg-white/5 backdrop-blur-md',
                  'px-3 py-2 text-sm text-white',
                  'focus:outline-none focus:ring-2 focus:ring-vox-idle/50'
                )}
              >
                {availableTriggers.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              <VoxButton
                type="button"
                variant="primary"
                size="sm"
                onClick={() => addMessage(selectedTrigger)}
              >
                Add
              </VoxButton>
              <VoxButton
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTrigger(null)}
              >
                Cancel
              </VoxButton>
            </div>
          ) : (
            <VoxButton
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedTrigger(availableTriggers[0].id)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Message
            </VoxButton>
          )}
        </div>
      )}

      {messages.length === 0 && (
        <p className="text-xs text-slate-500">
          No messages configured. Add messages to provide feedback during tool execution.
        </p>
      )}
    </div>
  )
}
