/**
 * Tools API Service
 * CRUD operations for MCP tools
 */

import api from './client'
import type { Tool, ToolCreate, ToolUpdate, PaginatedResponse, ToolBrief, ToolTestRequest, ToolTestResponse } from './types'

export const toolsApi = {
  /**
   * Fetch all tools with pagination
   */
  async list(clientId?: string, page = 1, pageSize = 20): Promise<PaginatedResponse<Tool>> {
    const params = new URLSearchParams()
    if (clientId) {
      params.append('client_id', clientId)
    }
    params.append('page', page.toString())
    params.append('page_size', pageSize.toString())
    const query = params.toString() ? `?${params.toString()}` : ''
    return api.get<PaginatedResponse<Tool>>(`/api/v1/tools${query}`)
  },

  /**
   * Fetch brief list of tools (id and name only) for selection dropdowns
   */
  async listBrief(clientId?: string): Promise<ToolBrief[]> {
    const response = await this.list(clientId, 1, 1000)
    return response.items.map((tool) => ({
      id: tool.id,
      name: tool.name,
    }))
  },

  /**
   * Fetch a single tool by ID
   */
  async get(id: string): Promise<Tool> {
    return api.get<Tool>(`/api/v1/tools/${id}`)
  },

  /**
   * Create a new tool
   */
  async create(data: ToolCreate): Promise<Tool> {
    return api.post<Tool>('/api/v1/tools', data)
  },

  /**
   * Update an existing tool
   */
  async update(id: string, data: ToolUpdate): Promise<Tool> {
    return api.patch<Tool>(`/api/v1/tools/${id}`, data)
  },

  /**
   * Delete a tool
   */
  async delete(id: string): Promise<void> {
    return api.delete(`/api/v1/tools/${id}`)
  },

  /**
   * Test a tool by making a request to its configured server
   */
  async test(id: string, parameters?: Record<string, unknown>): Promise<ToolTestResponse> {
    const body: ToolTestRequest = parameters ? { parameters } : {}
    return api.post<ToolTestResponse>(`/api/v1/tools/${id}/test`, body)
  },
}

export default toolsApi
