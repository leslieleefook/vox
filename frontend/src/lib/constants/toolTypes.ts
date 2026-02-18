/**
 * Tool Types and Constants
 * Definitions for MCP tools configuration
 */

// Protocol types for MCP
export type McpProtocol = 'shttp' | 'sse'

// Message trigger types
export type MessageTrigger = 'on_start' | 'on_success' | 'on_error'

// Credential types
export type CredentialType = 'bearer' | 'api_key' | 'basic'

// Tool type
export type ToolType = 'mcp'

// Protocol options for UI
export const PROTOCOL_OPTIONS: Array<{
  id: McpProtocol
  label: string
  description: string
}> = [
  {
    id: 'shttp',
    label: 'SHTTP',
    description: 'Standard HTTP request/response protocol',
  },
  {
    id: 'sse',
    label: 'SSE',
    description: 'Server-Sent Events for streaming responses',
  },
]

// Message trigger options for UI
export const MESSAGE_TRIGGER_OPTIONS: Array<{
  id: MessageTrigger
  label: string
  description: string
}> = [
  {
    id: 'on_start',
    label: 'On Start',
    description: 'Message played when the tool starts executing',
  },
  {
    id: 'on_success',
    label: 'On Success',
    description: 'Message played when the tool completes successfully',
  },
  {
    id: 'on_error',
    label: 'On Error',
    description: 'Message played when the tool encounters an error',
  },
]

// Credential type options for UI
export const CREDENTIAL_TYPE_OPTIONS: Array<{
  id: CredentialType
  label: string
  description: string
}> = [
  {
    id: 'bearer',
    label: 'Bearer Token',
    description: 'OAuth 2.0 Bearer token authentication',
  },
  {
    id: 'api_key',
    label: 'API Key',
    description: 'Simple API key in header or query parameter',
  },
  {
    id: 'basic',
    label: 'Basic Auth',
    description: 'Username and password authentication',
  },
]

// Default values
export const DEFAULT_SERVER_CONFIG = {
  url: '',
  timeoutSeconds: 20,
  credentialId: null,
  headers: [] as Array<{ key: string; value: string }>,
  encryption: {
    paths: [] as string[],
  },
}

export const DEFAULT_MCP_CONFIG = {
  protocol: 'shttp' as McpProtocol,
}

// Tool name validation pattern (alphanumeric, underscore, hyphen only)
export const TOOL_NAME_PATTERN = /^[a-zA-Z0-9_-]+$/

// Timeout limits
export const TIMEOUT_MIN = 1
export const TIMEOUT_MAX = 300

// Description max length
export const DESCRIPTION_MAX_LENGTH = 1000
