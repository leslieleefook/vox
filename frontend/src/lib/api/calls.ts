/**
 * Call Logs API Service
 * Fetch call logs with pagination
 */

import api from './client'
import type { CallLog, PaginatedResponse } from './types'

export interface CallLogsParams {
  clientId?: string
  assistantId?: string
  page?: number
  pageSize?: number
}

export const callsApi = {
  /**
   * Fetch call logs with pagination
   */
  async list(params: CallLogsParams = {}): Promise<PaginatedResponse<CallLog>> {
    const searchParams = new URLSearchParams()

    if (params.clientId) {
      searchParams.append('client_id', params.clientId)
    }
    if (params.assistantId) {
      searchParams.append('assistant_id', params.assistantId)
    }
    if (params.page) {
      searchParams.append('page', String(params.page))
    }
    if (params.pageSize) {
      searchParams.append('page_size', String(params.pageSize))
    }

    const query = searchParams.toString() ? `?${searchParams.toString()}` : ''
    return api.get<PaginatedResponse<CallLog>>(`/api/v1/call-logs${query}`)
  },

  /**
   * Fetch a single call log by ID
   */
  async get(id: string): Promise<CallLog> {
    return api.get<CallLog>(`/api/v1/call-logs/${id}`)
  },
}

export default callsApi
