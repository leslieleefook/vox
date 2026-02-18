'use client'

import * as React from 'react'
import { Info, Lock } from 'lucide-react'
import { VoxInput } from '@/components/vox/VoxInput'
import { VoxButton } from '@/components/vox/VoxButton'
import { DynamicList } from './DynamicList'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { cn } from '@/lib/utils'
import { TIMEOUT_MIN, TIMEOUT_MAX } from '@/lib/constants/toolTypes'
import type { Credential } from '@/lib/api/types'

export interface ServerConfig {
  url: string
  timeoutSeconds: number
  credentialId: string | null
  headers: Array<{ key: string; value: string }>
  encryption: {
    paths: string[]
  }
}

export interface ServerSettingsSectionProps {
  config: ServerConfig
  onChange: (config: ServerConfig) => void
  credentials: Credential[]
  onAddCredential?: () => void
  errors?: {
    url?: string
    timeoutSeconds?: string
  }
  disabled?: boolean
}

export function ServerSettingsSection({
  config,
  onChange,
  credentials,
  onAddCredential,
  errors,
  disabled = false,
}: ServerSettingsSectionProps) {
  const [urlTouched, setUrlTouched] = React.useState(false)

  const validateUrl = (value: string) => {
    if (!value) return 'Server URL is required'
    try {
      const url = new URL(value)
      if (!['http:', 'https:'].includes(url.protocol)) {
        return 'URL must start with http:// or https://'
      }
    } catch {
      return 'Please enter a valid URL'
    }
    return undefined
  }

  const urlError = urlTouched ? validateUrl(config.url) : errors?.url

  const updateConfig = (updates: Partial<ServerConfig>) => {
    onChange({ ...config, ...updates })
  }

  const handleTimeoutChange = (value: string) => {
    const num = parseInt(value, 10)
    if (isNaN(num)) {
      updateConfig({ timeoutSeconds: TIMEOUT_MIN })
    } else {
      const clamped = Math.max(TIMEOUT_MIN, Math.min(TIMEOUT_MAX, num))
      updateConfig({ timeoutSeconds: clamped })
    }
  }

  return (
    <div className="space-y-4">
      {/* Server URL */}
      <div className="space-y-2">
        <label htmlFor="server-url" className="text-sm font-medium text-white">
          Server URL
        </label>
        <VoxInput
          id="server-url"
          value={config.url}
          onChange={(e) => updateConfig({ url: e.target.value })}
          onBlur={() => setUrlTouched(true)}
          placeholder="https://api.example.com/function"
          disabled={disabled}
          className={cn(urlError && 'border-red-500/50 focus:ring-red-500/50')}
        />
        {urlError && (
          <p className="text-xs text-red-400">{urlError}</p>
        )}
      </div>

      {/* Timeout */}
      <div className="space-y-2">
        <label htmlFor="timeout" className="text-sm font-medium text-white">
          Timeout (seconds)
        </label>
        <VoxInput
          id="timeout"
          type="number"
          min={TIMEOUT_MIN}
          max={TIMEOUT_MAX}
          value={config.timeoutSeconds}
          onChange={(e) => handleTimeoutChange(e.target.value)}
          disabled={disabled}
          className="w-32"
        />
        <p className="text-xs text-slate-500">
          Request timeout between {TIMEOUT_MIN}-{TIMEOUT_MAX} seconds
        </p>
      </div>

      {/* Authorization */}
      <div className="space-y-2">
        <label htmlFor="credential" className="text-sm font-medium text-white">
          Authorization
        </label>
        <div className="flex gap-2">
          <select
            id="credential"
            value={config.credentialId || ''}
            onChange={(e) => updateConfig({ credentialId: e.target.value || null })}
            disabled={disabled}
            className={cn(
              'flex h-10 flex-1 rounded-lg border border-white/10',
              'bg-white/5 backdrop-blur-md',
              'px-3 py-2 text-sm text-white',
              'focus:outline-none focus:ring-2 focus:ring-vox-idle/50',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            <option value="">No authorization</option>
            {credentials.map((cred) => (
              <option key={cred.id} value={cred.id}>
                {cred.name} ({cred.type})
              </option>
            ))}
          </select>
          {onAddCredential && (
            <VoxButton
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddCredential}
              disabled={disabled}
            >
              + Create
            </VoxButton>
          )}
        </div>
        {credentials.length === 0 && (
          <p className="text-xs text-slate-500">
            No credentials configured. Create one to enable authentication.
          </p>
        )}
      </div>

      {/* HTTP Headers */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-white">HTTP Headers</label>
        <DynamicList
          items={config.headers}
          onChange={(headers) => updateConfig({ headers })}
          addButtonText="Add Header"
          createNewItem={() => ({ key: '', value: '' })}
          emptyStateText="No custom headers configured"
          disabled={disabled}
          renderItem={(header, index, onChange) => (
            <div className="flex gap-2">
              <VoxInput
                placeholder="Header name"
                value={header.key}
                onChange={(e) => onChange({ ...header, key: e.target.value })}
                disabled={disabled}
                className="flex-1"
              />
              <VoxInput
                placeholder="Value"
                value={header.value}
                onChange={(e) => onChange({ ...header, value: e.target.value })}
                disabled={disabled}
                className="flex-1"
              />
            </div>
          )}
        />
      </div>

      {/* Encryption Settings (Nested Accordion) */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="encryption" className="border-0">
          <AccordionTrigger className="py-2 text-sm hover:no-underline">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-slate-400" />
              <span>Encryption Settings</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Info className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-300">
                  Specify JSON paths for fields that should be encrypted before sending to the tool.
                  Use dot notation (e.g., <code className="text-blue-200">user.ssn</code> or{' '}
                  <code className="text-blue-200">payment.cardNumber</code>).
                </p>
              </div>

              <DynamicList
                items={config.encryption.paths}
                onChange={(paths) =>
                  updateConfig({
                    encryption: { ...config.encryption, paths },
                  })
                }
                addButtonText="Add Encryption Path"
                createNewItem={() => ''}
                emptyStateText="No encrypted paths configured"
                disabled={disabled}
                renderItem={(path, index, onChange) => (
                  <VoxInput
                    placeholder="e.g., user.ssn"
                    value={path}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                  />
                )}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
