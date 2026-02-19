/**
 * ToolsSelectionSection Component
 * Collapsible accordion section for selecting tools to associate with an assistant.
 * Displays available tools as checkboxes with name and description.
 */

'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Loader2, Wrench } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toolsApi } from '@/lib/api/tools'
import type { ToolBrief } from '@/lib/api/types'

interface ToolsSelectionSectionProps {
  selectedToolIds: string[]
  clientId: string
  onChange: (toolIds: string[]) => void
  disabled?: boolean
}

export function ToolsSelectionSection({
  selectedToolIds,
  clientId,
  onChange,
  disabled = false,
}: ToolsSelectionSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [tools, setTools] = useState<ToolBrief[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch available tools when expanded
  useEffect(() => {
    if (isExpanded && clientId && tools.length === 0) {
      fetchTools()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded, clientId])

  // Auto-expand if tools are already selected
  useEffect(() => {
    if (selectedToolIds.length > 0) {
      setIsExpanded(true)
    }
  }, [selectedToolIds.length])

  const fetchTools = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const toolList = await toolsApi.listBrief(clientId)
      setTools(toolList)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tools')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggle = (toolId: string) => {
    if (selectedToolIds.includes(toolId)) {
      onChange(selectedToolIds.filter((id) => id !== toolId))
    } else {
      onChange([...selectedToolIds, toolId])
    }
  }

  return (
    <div className="space-y-3">
      {/* Toggle Button */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
      >
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        MCP Tools
        {selectedToolIds.length > 0 && (
          <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-vox-idle/20 text-vox-idle">
            {selectedToolIds.length} selected
          </span>
        )}
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
            <div className="pl-4 space-y-3 border-l border-white/10">
              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Loader2 size={16} className="animate-spin" />
                  Loading tools...
                </div>
              )}

              {error && (
                <div className="p-2 rounded-lg bg-vox-error/10 border border-vox-error/20 text-vox-error text-sm">
                  {error}
                </div>
              )}

              {!isLoading && !error && tools.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-4 text-center">
                  <Wrench size={24} className="text-slate-500" />
                  <p className="text-sm text-slate-500">No tools available</p>
                  <p className="text-xs text-slate-600">
                    Create tools in the Tools page first
                  </p>
                </div>
              )}

              {!isLoading && !error && tools.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 mb-2">
                    Select MCP tools to enable for this assistant
                  </p>
                  {tools.map((tool) => (
                    <label
                      key={tool.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedToolIds.includes(tool.id)}
                        onChange={() => handleToggle(tool.id)}
                        disabled={disabled}
                        className="h-4 w-4 rounded border-white/20 bg-white/5 text-vox-idle focus:ring-vox-idle/50"
                      />
                      <span className="text-sm text-slate-300">{tool.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ToolsSelectionSection
