/**
 * Assistants API Service
 * CRUD operations for assistants
 */

import api from './client'
import type { Assistant, AssistantCreate, AssistantUpdate, PhoneNumber, PhoneNumberCreate } from './types'

export const assistantsApi = {
  /**
   * Fetch all assistants, optionally filtered by client_id
   */
  async list(clientId?: string): Promise<Assistant[]> {
    const params = new URLSearchParams()
    if (clientId) {
      params.append('client_id', clientId)
    }
    const query = params.toString() ? `?${params.toString()}` : ''
    return api.get<Assistant[]>(`/api/v1/assistants${query}`)
  },

  /**
   * Fetch a single assistant by ID
   */
  async get(id: string): Promise<Assistant> {
    return api.get<Assistant>(`/api/v1/assistants/${id}`)
  },

  /**
   * Create a new assistant
   */
  async create(data: AssistantCreate): Promise<Assistant> {
    return api.post<Assistant>('/api/v1/assistants', data)
  },

  /**
   * Update an existing assistant
   */
  async update(id: string, data: AssistantUpdate): Promise<Assistant> {
    return api.patch<Assistant>(`/api/v1/assistants/${id}`, data)
  },

  /**
   * Delete an assistant
   */
  async delete(id: string): Promise<void> {
    return api.delete(`/api/v1/assistants/${id}`)
  },

  /**
   * Get phone numbers for an assistant
   */
  async getPhoneNumbers(assistantId: string): Promise<PhoneNumber[]> {
    return api.get<PhoneNumber[]>(`/api/v1/phone-numbers?assistant_id=${assistantId}`)
  },

  /**
   * Assign a phone number to an assistant
   */
  async assignPhoneNumber(data: PhoneNumberCreate): Promise<PhoneNumber> {
    return api.post<PhoneNumber>('/api/v1/phone-numbers', data)
  },

  /**
   * Unassign a phone number
   */
  async unassignPhoneNumber(e164Number: string): Promise<void> {
    return api.delete(`/api/v1/phone-numbers/${encodeURIComponent(e164Number)}`)
  },
}

export default assistantsApi
