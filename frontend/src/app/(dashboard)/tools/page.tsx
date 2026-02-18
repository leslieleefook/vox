'use client'

import * as React from 'react'
import Link from 'next/link'
import { Plus, Code, Trash2 } from 'lucide-react'
import { VoxButton } from '@/components/vox/VoxButton'
import { VoxCard } from '@/components/vox/VoxCard'
import { VoxBadge } from '@/components/vox/VoxBadge'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { toolsApi } from '@/lib/api/tools'
import type { Tool } from '@/lib/api/types'

// Default client ID - should be from auth context in production
const DEFAULT_CLIENT_ID = 'df4ec656-3ed9-4f97-b94b-c79f9835ac95'

export default function ToolsPage() {
  const [tools, setTools] = React.useState<Tool[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const loadTools = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await toolsApi.list(DEFAULT_CLIENT_ID)
      setTools(response.items)
    } catch (err) {
      console.error('Failed to load tools:', err)
      setError('Failed to load tools. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadTools()
  }, [loadTools])

  const handleDeleteTool = async (toolId: string) => {
    if (!confirm('Are you sure you want to delete this tool?')) return

    try {
      await toolsApi.delete(toolId)
      setTools(tools.filter((t) => t.id !== toolId))
    } catch (err) {
      console.error('Failed to delete tool:', err)
      alert('Failed to delete tool. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Tools</h1>
            <p className="text-slate-400 text-sm mt-1">
              Configure external tools/APIs for your voice assistants
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <LoadingSkeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={loadTools}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Tools</h1>
          <p className="text-slate-400 text-sm mt-1">
            Configure external tools/APIs for your voice assistants
          </p>
        </div>
        <Link href="/tools/new">
          <VoxButton variant="primary">
            <Plus className="h-4 w-4 mr-1" />
            Create Tool
          </VoxButton>
        </Link>
      </div>

      {/* Tools Grid */}
      {tools.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
            <Code className="h-8 w-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No tools configured</h3>
          <p className="text-slate-400 text-sm mb-4">
            Create your first tool to enable your assistants to interact with external APIs.
          </p>
          <Link href="/tools/new">
            <VoxButton variant="primary">
              <Plus className="h-4 w-4 mr-1" />
              Create Your First Tool
            </VoxButton>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool) => (
            <Link key={tool.id} href={`/tools/${tool.id}`}>
              <VoxCard className="h-full hover:border-vox-idle/50 transition-colors cursor-pointer group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-vox-idle/20 flex items-center justify-center">
                      <Code className="h-4 w-4 text-vox-idle" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white group-hover:text-vox-idle transition-colors">
                        {tool.name}
                      </h3>
                    </div>
                  </div>
                  <VoxBadge>{tool.type.toUpperCase()}</VoxBadge>
                </div>

                <p className="text-sm text-slate-400 line-clamp-2 mb-4">
                  {tool.description || 'No description provided'}
                </p>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Created {new Date(tool.created_at).toLocaleDateString()}
                  </span>
                  <VoxButton
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault()
                      handleDeleteTool(tool.id)
                    }}
                    className="text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </VoxButton>
                </div>
              </VoxCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
