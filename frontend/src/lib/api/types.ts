/**
 * TypeScript interfaces for Vox API responses
 * Based on backend Pydantic schemas
 */

export interface Client {
  id: string
  name: string
  api_key: string
  webhook_url: string | null
  created_at: string
  updated_at: string
}

export interface Assistant {
  id: string
  client_id: string
  name: string
  system_prompt: string
  minimax_voice_id: string
  tts_model: string
  tts_is_manual_id: boolean
  llm_model: string
  stt_provider: string
  structured_output_schema: string | null
  webhook_url: string | null
  first_message: string | null
  // Model Configuration fields
  llm_provider: string
  first_message_mode: string
  temperature: number
  max_tokens: number
  rag_file_ids: string | null
  created_at: string
  updated_at: string
}

export interface AssistantCreate {
  name: string
  system_prompt: string
  client_id: string
  minimax_voice_id?: string
  tts_model?: string
  tts_is_manual_id?: boolean
  llm_model?: string
  stt_provider?: string
  structured_output_schema?: string | null
  webhook_url?: string | null
  first_message?: string | null
  // Model Configuration fields
  llm_provider?: string
  first_message_mode?: string
  temperature?: number
  max_tokens?: number
  rag_file_ids?: string | null
}

export interface AssistantUpdate {
  name?: string
  system_prompt?: string
  minimax_voice_id?: string
  tts_model?: string
  tts_is_manual_id?: boolean
  llm_model?: string
  stt_provider?: string
  structured_output_schema?: string | null
  webhook_url?: string | null
  first_message?: string | null
  // Model Configuration fields
  llm_provider?: string
  first_message_mode?: string
  temperature?: number
  max_tokens?: number
  rag_file_ids?: string | null
}

export interface PhoneNumber {
  e164_number: string
  assistant_id: string
  asterisk_context: string
  created_at: string
}

export interface PhoneNumberCreate {
  e164_number: string
  assistant_id: string
  asterisk_context?: string
}

export interface CallLog {
  id: string
  client_id: string
  assistant_id: string | null
  phone_number: string
  caller_id: string
  transcript: string | null
  latency_ms: number | null
  duration_seconds: number | null
  status: string
  room_name: string | null
  created_at: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

export interface HealthResponse {
  status: string
  database: string
  redis: string
  version: string
}

// API Error type
export interface ApiError {
  detail: string
}

// Tool types
export interface ServerConfig {
  url: string
  timeoutSeconds: number
  credentialId: string | null
  headers: Array<{ key: string; value: string }>
  encryption: {
    paths: string[]
  }
}

export interface McpConfig {
  protocol: 'shttp' | 'sse'
}

export interface ToolMessage {
  trigger: 'on_start' | 'on_success' | 'on_error'
  message: string
}

export interface Tool {
  id: string
  client_id: string
  name: string
  description: string | null
  type: string
  server_config: string // JSON string
  mcp_config: string // JSON string
  messages: string | null // JSON string
  created_at: string
  updated_at: string
}

export interface ToolCreate {
  client_id: string
  name: string
  description?: string | null
  type?: string
  server_config: string
  mcp_config: string
  messages?: string | null
}

export interface ToolUpdate {
  name?: string
  description?: string | null
  type?: string
  server_config?: string
  mcp_config?: string
  messages?: string | null
}

// Credential types
export interface Credential {
  id: string
  client_id: string
  name: string
  type: string
  created_at: string
  updated_at: string
}

export interface CredentialCreate {
  client_id: string
  name: string
  type: string
  value: string
}

export interface CredentialUpdate {
  name?: string
  type?: string
  value?: string
}

export interface CredentialListResponse {
  items: Credential[]
  total: number
}
