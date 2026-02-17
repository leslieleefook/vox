/**
 * useAssistants Hook
 * Fetches and manages assistants with loading/error states
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { assistantsApi, ApiError } from '@/lib/api'
import type { Assistant, AssistantCreate, AssistantUpdate } from '@/lib/api'

interface UseAssistantsState {
  assistants: Assistant[]
  isLoading: boolean
  error: string | null
}

interface UseAssistantsActions {
  refetch: () => Promise<void>
  createAssistant: (data: AssistantCreate) => Promise<Assistant>
  updateAssistant: (id: string, data: AssistantUpdate) => Promise<Assistant>
  deleteAssistant: (id: string) => Promise<void>
}

type UseAssistantsReturn = UseAssistantsState & UseAssistantsActions

export function useAssistants(clientId?: string): UseAssistantsReturn {
  const [state, setState] = useState<UseAssistantsState>({
    assistants: [],
    isLoading: true,
    error: null,
  })

  const fetchAssistants = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))
    try {
      const assistants = await assistantsApi.list(clientId)
      setState({ assistants, isLoading: false, error: null })
    } catch (err) {
      const message = err instanceof ApiError ? err.detail : 'Failed to fetch assistants'
      setState((prev) => ({ ...prev, isLoading: false, error: message }))
    }
  }, [clientId])

  useEffect(() => {
    fetchAssistants()
  }, [fetchAssistants])

  const createAssistant = useCallback(async (data: AssistantCreate): Promise<Assistant> => {
    const assistant = await assistantsApi.create(data)
    setState((prev) => ({
      ...prev,
      assistants: [...prev.assistants, assistant],
    }))
    return assistant
  }, [])

  const updateAssistant = useCallback(async (id: string, data: AssistantUpdate): Promise<Assistant> => {
    const assistant = await assistantsApi.update(id, data)
    setState((prev) => ({
      ...prev,
      assistants: prev.assistants.map((a) => (a.id === id ? assistant : a)),
    }))
    return assistant
  }, [])

  const deleteAssistant = useCallback(async (id: string): Promise<void> => {
    await assistantsApi.delete(id)
    setState((prev) => ({
      ...prev,
      assistants: prev.assistants.filter((a) => a.id !== id),
    }))
  }, [])

  return {
    ...state,
    refetch: fetchAssistants,
    createAssistant,
    updateAssistant,
    deleteAssistant,
  }
}

export default useAssistants
