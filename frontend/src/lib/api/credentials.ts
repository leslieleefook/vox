/**
 * Credentials API Service
 * CRUD operations for secure credentials
 */

import api from './client'
import type { Credential, CredentialCreate, CredentialUpdate, CredentialListResponse } from './types'

export const credentialsApi = {
  /**
   * Fetch all credentials for a client
   */
  async list(clientId?: string): Promise<CredentialListResponse> {
    const params = new URLSearchParams()
    if (clientId) {
      params.append('client_id', clientId)
    }
    const query = params.toString() ? `?${params.toString()}` : ''
    return api.get<CredentialListResponse>(`/api/v1/credentials${query}`)
  },

  /**
   * Fetch a single credential by ID (without value)
   */
  async get(id: string): Promise<Credential> {
    return api.get<Credential>(`/api/v1/credentials/${id}`)
  },

  /**
   * Create a new credential
   */
  async create(data: CredentialCreate): Promise<Credential> {
    return api.post<Credential>('/api/v1/credentials', data)
  },

  /**
   * Update an existing credential
   */
  async update(id: string, data: CredentialUpdate): Promise<Credential> {
    return api.patch<Credential>(`/api/v1/credentials/${id}`, data)
  },

  /**
   * Delete a credential
   */
  async delete(id: string): Promise<void> {
    return api.delete(`/api/v1/credentials/${id}`)
  },
}

export default credentialsApi
