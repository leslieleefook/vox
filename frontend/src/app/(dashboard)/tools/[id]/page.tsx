'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { VoxButton } from '@/components/vox/VoxButton'
import { ToolEditor } from '@/components/tools/ToolEditor'
import type { Tool } from '@/lib/api/types'

// Default client ID - should be from auth context in production
const DEFAULT_CLIENT_ID = 'df4ec656-3ed9-4f97-b94b-c79f9835ac95'

export default function ToolEditorPage() {
  const params = useParams()
  const router = useRouter()
  const toolId = params.id as string

  const isNewTool = toolId === 'new'

  const handleSave = (tool: Tool) => {
    console.log('Tool saved:', tool)
  }

  const handleDelete = (deletedId: string) => {
    console.log('Tool deleted:', deletedId)
    router.push('/tools')
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/tools"
        className="inline-flex items-center text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Tools
      </Link>

      {/* Editor */}
      <ToolEditor
        toolId={isNewTool ? null : toolId}
        clientId={DEFAULT_CLIENT_ID}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  )
}
