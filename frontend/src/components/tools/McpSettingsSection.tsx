'use client'

import * as React from 'react'
import { ProtocolCard } from './ProtocolCard'
import { PROTOCOL_OPTIONS } from '@/lib/constants/toolTypes'
import type { McpProtocol } from '@/lib/constants/toolTypes'

export interface McpSettingsSectionProps {
  protocol: McpProtocol
  onProtocolChange: (protocol: McpProtocol) => void
  disabled?: boolean
}

export function McpSettingsSection({
  protocol,
  onProtocolChange,
  disabled = false,
}: McpSettingsSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-white">MCP Protocol</label>
        <p className="text-xs text-slate-500 mt-1">
          Select the communication protocol for this MCP tool.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {PROTOCOL_OPTIONS.map((option) => (
          <ProtocolCard
            key={option.id}
            id={option.id}
            label={option.label}
            description={option.description}
            selected={protocol === option.id}
            onSelect={(id) => onProtocolChange(id as McpProtocol)}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  )
}
