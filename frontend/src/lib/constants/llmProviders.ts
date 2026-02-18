/**
 * LLM Provider and Model Configuration
 * Defines available providers and their models for the assistant form
 */

// OpenRouter models (aggregates multiple providers)
export const OPENROUTER_MODELS = [
  { id: 'meta-llama/llama-3.1-70b-instruct', label: 'Llama 3.1 70B' },
  { id: 'meta-llama/llama-3.1-8b-instruct', label: 'Llama 3.1 8B' },
  { id: 'groq/llama-3.1-70b-versatile', label: 'Llama 3.1 70B (Groq)' },
  { id: 'groq/llama-3.1-8b-instant', label: 'Llama 3.1 8B (Groq Fast)' },
  { id: 'deepseek/deepseek-chat', label: 'DeepSeek Chat' },
  { id: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku' },
] as const

// OpenAI models (direct API)
export const OPENAI_MODELS = [
  { id: 'gpt-4o', label: 'GPT-4o' },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { id: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
] as const

// Anthropic models (direct API)
export const ANTHROPIC_MODELS = [
  { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
  { id: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
] as const

// Provider definitions
export const LLM_PROVIDERS = [
  {
    id: 'openrouter',
    label: 'OpenRouter',
    description: 'Multi-provider gateway (Llama, DeepSeek, Claude)',
    models: OPENROUTER_MODELS,
  },
  {
    id: 'openai',
    label: 'OpenAI',
    description: 'Direct GPT-4 API',
    models: OPENAI_MODELS,
  },
  {
    id: 'anthropic',
    label: 'Anthropic',
    description: 'Direct Claude API',
    models: ANTHROPIC_MODELS,
  },
] as const

export type LLMProviderId = (typeof LLM_PROVIDERS)[number]['id']
export type LLMModel = { id: string; label: string }

// First Message Mode options
export const FIRST_MESSAGE_MODES = [
  {
    id: 'assistant-first',
    label: 'Assistant First',
    description: 'Assistant speaks immediately when call connects',
  },
  {
    id: 'user-first',
    label: 'User First',
    description: 'Wait for user to speak before responding',
  },
  {
    id: 'wait-trigger',
    label: 'Wait for Trigger',
    description: 'Wait for specific trigger event before speaking',
  },
] as const

export type FirstMessageModeId = (typeof FIRST_MESSAGE_MODES)[number]['id']

// Default values
export const DEFAULT_LLM_PROVIDER: LLMProviderId = 'openrouter'
export const DEFAULT_LLM_MODEL = 'groq/llama-3.1-8b-instant'
export const DEFAULT_FIRST_MESSAGE_MODE: FirstMessageModeId = 'assistant-first'
export const DEFAULT_TEMPERATURE = 0.7
export const DEFAULT_MAX_TOKENS = 256

// Temperature constraints
export const TEMPERATURE_MIN = 0.0
export const TEMPERATURE_MAX = 2.0
export const TEMPERATURE_STEP = 0.1

// Max tokens constraints
export const MAX_TOKENS_MIN = 1
export const MAX_TOKENS_MAX = 32000

/**
 * Get models for a specific provider
 */
export function getModelsForProvider(providerId: LLMProviderId): readonly LLMModel[] {
  const provider = LLM_PROVIDERS.find((p) => p.id === providerId)
  return provider?.models ?? OPENROUTER_MODELS
}

/**
 * Get the first model ID for a provider
 */
export function getDefaultModelForProvider(providerId: LLMProviderId): string {
  const models = getModelsForProvider(providerId)
  return models[0]?.id ?? DEFAULT_LLM_MODEL
}

/**
 * Check if first message input should be disabled for a mode
 */
export function isFirstMessageDisabled(mode: FirstMessageModeId): boolean {
  return mode === 'user-first' || mode === 'wait-trigger'
}
