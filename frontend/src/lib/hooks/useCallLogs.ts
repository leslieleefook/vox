/**
 * useCallLogs Hook
 * Fetches call logs with pagination and loading/error states
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { callsApi, ApiError, type CallLog, type PaginatedResponse } from '@/lib/api'

interface UseCallLogsParams {
  clientId?: string
  assistantId?: string
  initialPage?: number
  pageSize?: number
}

interface UseCallLogsState {
  calls: CallLog[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  isLoading: boolean
  error: string | null
}

interface UseCallLogsActions {
  refetch: () => Promise<void>
  goToPage: (page: number) => Promise<void>
  nextPage: () => Promise<void>
  prevPage: () => Promise<void>
}

type UseCallLogsReturn = UseCallLogsState & UseCallLogsActions

export function useCallLogs(params: UseCallLogsParams = {}): UseCallLogsReturn {
  const { clientId, assistantId, initialPage = 1, pageSize = 20 } = params

  const [state, setState] = useState<UseCallLogsState>({
    calls: [],
    total: 0,
    page: initialPage,
    pageSize,
    totalPages: 0,
    isLoading: true,
    error: null,
  })

  const fetchCalls = useCallback(async (page: number) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))
    try {
      const response: PaginatedResponse<CallLog> = await callsApi.list({
        clientId,
        assistantId,
        page,
        pageSize,
      })
      setState({
        calls: response.items,
        total: response.total,
        page: response.page,
        pageSize: response.page_size,
        totalPages: Math.ceil(response.total / response.page_size),
        isLoading: false,
        error: null,
      })
    } catch (err) {
      const message = err instanceof ApiError ? err.detail : 'Failed to fetch call logs'
      setState((prev) => ({ ...prev, isLoading: false, error: message }))
    }
  }, [clientId, assistantId, pageSize])

  useEffect(() => {
    fetchCalls(state.page)
  }, [fetchCalls]) // eslint-disable-line react-hooks/exhaustive-deps

  const refetch = useCallback(async () => {
    await fetchCalls(state.page)
  }, [fetchCalls, state.page])

  const goToPage = useCallback(async (page: number) => {
    if (page < 1) return
    await fetchCalls(page)
  }, [fetchCalls])

  const nextPage = useCallback(async () => {
    if (state.page < state.totalPages) {
      await fetchCalls(state.page + 1)
    }
  }, [fetchCalls, state.page, state.totalPages])

  const prevPage = useCallback(async () => {
    if (state.page > 1) {
      await fetchCalls(state.page - 1)
    }
  }, [fetchCalls, state.page])

  return {
    ...state,
    refetch,
    goToPage,
    nextPage,
    prevPage,
  }
}

export default useCallLogs
