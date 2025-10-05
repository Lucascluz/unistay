/**
 * Review Responses API endpoints
 */

import { apiClient } from './client';
import type {
  ReviewResponse,
  CreateResponseRequest,
} from './types';

export const responsesApi = {
  /**
   * Get all responses for a review
   */
  getResponsesForReview: async (reviewId: string): Promise<ReviewResponse[]> => {
    return apiClient.get<ReviewResponse[]>(`/responses/review/${reviewId}`);
  },

  /**
   * Create a response as a regular user
   */
  createUserResponse: async (data: CreateResponseRequest): Promise<ReviewResponse> => {
    return apiClient.post<ReviewResponse>('/responses/user', data);
  },

  /**
   * Create a response as a company
   */
  createCompanyResponse: async (data: CreateResponseRequest): Promise<ReviewResponse> => {
    return apiClient.post<ReviewResponse>('/responses/company', data);
  },

  /**
   * Update a response
   */
  updateResponse: async (id: string, responseText: string): Promise<ReviewResponse> => {
    return apiClient.put<ReviewResponse>(`/responses/${id}`, { responseText });
  },

  /**
   * Delete a response
   */
  deleteResponse: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/responses/${id}`);
  },
};
