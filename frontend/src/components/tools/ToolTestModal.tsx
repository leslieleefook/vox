'use client'

import * as React from 'react'
import { Play, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { VoxButton } from '@/components/vox/VoxButton'
import { toolsApi } from '@/lib/api/tools'
import type { ToolTestResponse } from '@/lib/api/types'

export interface ToolTestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  toolId: string
  toolName: string
}

export function ToolTestModal({ open, onOpenChange, toolId, toolName }: ToolTestModalProps) {
  const [testing, setTesting] = React.useState(false)
  const [parameters, setParameters] = React.useState('{\n  \n}')
  const [result, setResult] = React.useState<ToolTestResponse | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  const handleTest = async () => {
    setTesting(true)
    setError(null)
    setResult(null)

    let parsedParams: Record<string, unknown> | undefined
    if (parameters.trim() && parameters.trim() !== '{\n  \n}') {
      try {
        parsedParams = JSON.parse(parameters)
      } catch {
        setError('Invalid JSON in parameters')
        setTesting(false)
        return
      }
    }

    try {
      const response = await toolsApi.test(toolId, parsedParams)
      setResult(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test failed')
    } finally {
      setTesting(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    // Reset state when closing
    setTimeout(() => {
      setResult(null)
      setError(null)
    }, 200)
  }

  const getStatusIcon = () => {
    if (!result) return null

    if (result.success) {
      return <CheckCircle className="h-5 w-5 text-green-400" />
    }

    switch (result.error_type) {
      case 'timeout':
        return <Clock className="h-5 w-5 text-yellow-400" />
      case 'connection':
      case 'auth':
        return <AlertTriangle className="h-5 w-5 text-orange-400" />
      default:
        return <XCircle className="h-5 w-5 text-red-400" />
    }
  }

  const getStatusColor = () => {
    if (!result) return ''
    return result.success ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Test Tool: {toolName}</DialogTitle>
          <DialogDescription>
            Send a test request to this tool&apos;s server endpoint to verify connectivity and configuration.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Parameters Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">Test Parameters (JSON)</label>
            <textarea
              value={parameters}
              onChange={(e) => setParameters(e.target.value)}
              className="w-full h-32 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-vox-idle focus:border-transparent placeholder:text-slate-500"
              placeholder='{"key": "value"}'
            />
            <p className="text-xs text-slate-500">
              Optional JSON payload to send with the test request.
            </p>
          </div>

          {/* Error State */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-400" />
                <span className="text-sm text-red-400">{error}</span>
              </div>
            </div>
          )}

          {/* Result Display */}
          {result && (
            <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
              <div className="flex items-center gap-2 mb-3">
                {getStatusIcon()}
                <span className="font-medium text-white">
                  {result.success ? 'Test Successful' : 'Test Failed'}
                </span>
                {result.response_time_ms && (
                  <span className="text-xs text-slate-400 ml-auto">
                    {result.response_time_ms}ms
                  </span>
                )}
              </div>

              {/* Status Code */}
              {result.status_code && (
                <div className="mb-2">
                  <span className="text-xs text-slate-400">Status Code: </span>
                  <span className={`text-sm font-mono ${
                    result.status_code >= 200 && result.status_code < 300
                      ? 'text-green-400'
                      : 'text-orange-400'
                  }`}>
                    {result.status_code}
                  </span>
                </div>
              )}

              {/* Error Message */}
              {result.error && (
                <div className="mb-3">
                  <span className="text-xs text-slate-400">Error: </span>
                  <span className="text-sm text-red-400">{result.error}</span>
                </div>
              )}

              {/* Response Body */}
              {result.response_body && (
                <div className="space-y-1">
                  <span className="text-xs text-slate-400">Response:</span>
                  <pre className="p-3 rounded bg-black/30 text-xs font-mono text-slate-300 overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap break-all">
                    {result.response_body}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <VoxButton variant="ghost" onClick={handleClose}>
            Cancel
          </VoxButton>
          <VoxButton
            variant="primary"
            onClick={handleTest}
            disabled={testing}
          >
            <Play className="h-4 w-4 mr-1" />
            {testing ? 'Testing...' : 'Run Test'}
          </VoxButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
