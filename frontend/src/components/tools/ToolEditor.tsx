'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Save, Trash2, Copy, Code, Play } from 'lucide-react'
import { VoxButton } from '@/components/vox/VoxButton'
import { VoxBadge } from '@/components/vox/VoxBadge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { ToolSettingsSection } from './ToolSettingsSection'
import { ServerSettingsSection, type ServerConfig } from './ServerSettingsSection'
import { McpSettingsSection } from './McpSettingsSection'
import { MessagesSection, type ToolMessage } from './MessagesSection'
import { toolsApi } from '@/lib/api/tools'
import { credentialsApi } from '@/lib/api/credentials'
import { DEFAULT_SERVER_CONFIG, DEFAULT_MCP_CONFIG, TOOL_NAME_PATTERN } from '@/lib/constants/toolTypes'
import type { McpProtocol } from '@/lib/constants/toolTypes'
import type { Tool, Credential } from '@/lib/api/types'

export interface ToolEditorProps {
  toolId?: string | null
  clientId: string
  onSave?: (tool: Tool) => void
  onDelete?: (toolId: string) => void
}

interface ToolFormData {
  name: string
  description: string
  serverConfig: ServerConfig
  mcpConfig: {
    protocol: McpProtocol
  }
  messages: ToolMessage[]
}

export function ToolEditor({ toolId, clientId, onSave, onDelete }: ToolEditorProps) {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [credentials, setCredentials] = React.useState<Credential[]>([])
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  const [formData, setFormData] = React.useState<ToolFormData>({
    name: '',
    description: '',
    serverConfig: DEFAULT_SERVER_CONFIG,
    mcpConfig: DEFAULT_MCP_CONFIG,
    messages: [],
  })

  const isNewTool = !toolId

  // Load tool and credentials on mount
  React.useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // Load credentials
        const credsResponse = await credentialsApi.list(clientId)
        setCredentials(credsResponse.items)

        // Load existing tool if editing
        if (toolId) {
          const tool = await toolsApi.get(toolId)
          setFormData({
            name: tool.name,
            description: tool.description || '',
            serverConfig: JSON.parse(tool.server_config),
            mcpConfig: JSON.parse(tool.mcp_config),
            messages: tool.messages ? JSON.parse(tool.messages) : [],
          })
        }
      } catch (err) {
        console.error('Failed to load data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [toolId, clientId])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name) {
      newErrors.name = 'Tool name is required'
    } else if (!TOOL_NAME_PATTERN.test(formData.name)) {
      newErrors.name = 'Tool name can only contain letters, numbers, underscores, and hyphens'
    }

    if (!formData.serverConfig.url) {
      newErrors.url = 'Server URL is required'
    } else {
      try {
        new URL(formData.serverConfig.url)
      } catch {
        newErrors.url = 'Please enter a valid URL'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setSaving(true)
    try {
      const toolData = {
        client_id: clientId,
        name: formData.name,
        description: formData.description || null,
        type: 'mcp',
        server_config: JSON.stringify(formData.serverConfig),
        mcp_config: JSON.stringify(formData.mcpConfig),
        messages: formData.messages.length > 0 ? JSON.stringify(formData.messages) : null,
      }

      let tool: Tool
      if (isNewTool) {
        tool = await toolsApi.create(toolData)
        // Navigate to the new tool's edit page
        router.push(`/tools/${tool.id}`)
      } else {
        tool = await toolsApi.update(toolId!, {
          name: formData.name,
          description: formData.description || null,
          server_config: JSON.stringify(formData.serverConfig),
          mcp_config: JSON.stringify(formData.mcpConfig),
          messages: formData.messages.length > 0 ? JSON.stringify(formData.messages) : null,
        })
      }

      onSave?.(tool)
    } catch (err) {
      console.error('Failed to save tool:', err)
      setErrors({ submit: 'Failed to save tool. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!toolId || !confirm('Are you sure you want to delete this tool?')) return

    setDeleting(true)
    try {
      await toolsApi.delete(toolId)
      onDelete?.(toolId)
      router.push('/tools')
    } catch (err) {
      console.error('Failed to delete tool:', err)
      setErrors({ submit: 'Failed to delete tool. Please try again.' })
    } finally {
      setDeleting(false)
    }
  }

  const copyToolId = () => {
    if (toolId) {
      navigator.clipboard.writeText(toolId)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vox-idle" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-vox-idle/20 flex items-center justify-center">
            <Code className="h-4 w-4 text-vox-idle" />
          </div>
          <div>
            <h1 className="text-lg font-medium text-white">
              {isNewTool ? 'New Tool' : formData.name || 'Untitled Tool'}
            </h1>
            {toolId && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-mono">{toolId}</span>
                <VoxButton variant="ghost" size="sm" onClick={copyToolId} className="h-6 px-1">
                  <Copy className="h-3 w-3" />
                </VoxButton>
              </div>
            )}
          </div>
          <VoxBadge>MCP</VoxBadge>
        </div>

        <div className="flex items-center gap-2">
          {errors.submit && (
            <span className="text-sm text-red-400 mr-2">{errors.submit}</span>
          )}
          {!isNewTool && (
            <VoxButton
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="text-red-400 hover:text-red-300"
            >
              <Trash2 className="h-4 w-4" />
            </VoxButton>
          )}
          <VoxButton
            variant="outline"
            size="sm"
            disabled // Phase 2 feature
            title="Test tool (coming soon)"
          >
            <Play className="h-4 w-4 mr-1" />
            Test
          </VoxButton>
          <VoxButton
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-1" />
            {saving ? 'Saving...' : 'Save'}
          </VoxButton>
        </div>
      </div>

      {/* Section 1: Tool Settings */}
      <div className="p-6 rounded-lg bg-white/5 border border-white/10">
        <h2 className="text-sm font-medium text-white mb-4">Tool Settings</h2>
        <ToolSettingsSection
          name={formData.name}
          description={formData.description}
          onNameChange={(name) => setFormData({ ...formData, name })}
          onDescriptionChange={(description) => setFormData({ ...formData, description })}
          errors={{ name: errors.name }}
        />
      </div>

      {/* Sections 2-4: Accordion */}
      <Accordion type="multiple" defaultValue={['server']} className="space-y-2">
        {/* Section 2: Server Settings */}
        <AccordionItem value="server" className="rounded-lg bg-white/5 border border-white/10 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="text-sm font-medium">Server Settings</span>
          </AccordionTrigger>
          <AccordionContent>
            <ServerSettingsSection
              config={formData.serverConfig}
              onChange={(serverConfig) => setFormData({ ...formData, serverConfig })}
              credentials={credentials}
              errors={{ url: errors.url }}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Section 3: MCP Settings */}
        <AccordionItem value="mcp" className="rounded-lg bg-white/5 border border-white/10 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="text-sm font-medium">MCP Settings</span>
          </AccordionTrigger>
          <AccordionContent>
            <McpSettingsSection
              protocol={formData.mcpConfig.protocol}
              onProtocolChange={(protocol) =>
                setFormData({
                  ...formData,
                  mcpConfig: { ...formData.mcpConfig, protocol },
                })
              }
            />
          </AccordionContent>
        </AccordionItem>

        {/* Section 4: Messages */}
        <AccordionItem value="messages" className="rounded-lg bg-white/5 border border-white/10 px-6">
          <AccordionTrigger className="hover:no-underline">
            <span className="text-sm font-medium">Messages</span>
          </AccordionTrigger>
          <AccordionContent>
            <MessagesSection
              messages={formData.messages}
              onChange={(messages) => setFormData({ ...formData, messages })}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
