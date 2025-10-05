/**
 * Reviews API endpoints
 */

import { apiClient } from './client';
import type {
  Review,
  CreateReviewRequest,
  GetReviewsParams,
  ReviewsResponse,
} from './types';

export const reviewsApi = {
  /**
   * Get reviews for a location with pagination and filters
   */
  getReviews: async (params: GetReviewsParams): Promise<ReviewsResponse> => {
    const queryParams = new URLSearchParams();
    
    if (params.location) queryParams.append('location', params.location);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);

    const queryString = queryParams.toString();
    const endpoint = `/reviews${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.get<ReviewsResponse>(endpoint);
  },

  /**
   * Get a single review by ID
   */
  getReviewById: async (id: string): Promise<Review> => {
    return apiClient.get<Review>(`/reviews/${id}`);
  },

  /**
   * Create a new review
   */
  createReview: async (data: CreateReviewRequest): Promise<Review> => {
    return apiClient.post<Review>('/reviews', data);
  },

  /**
   * Update an existing review (only if user owns it)
   */
  updateReview: async (id: string, data: Partial<CreateReviewRequest>): Promise<Review> => {
    return apiClient.put<Review>(`/reviews/${id}`, data);
  },

  /**
   * Delete a review (only if user owns it)
   */
  deleteReview: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/reviews/${id}`);
  },

  /**
   * Mark a review as helpful
   */
  markHelpful: async (id: string): Promise<{ helpful: number }> => {
    return apiClient.post<{ helpful: number }>(`/reviews/${id}/helpful`);
  },

  /**
   * Report a review
   */
  reportReview: async (id: string, reason: string): Promise<void> => {
    return apiClient.post<void>(`/reviews/${id}/report`, { reason });
  },

  /**
   * Get user's own reviews
   */
  getMyReviews: async (): Promise<Review[]> => {
    return apiClient.get<Review[]>('/reviews/me');
  },
};
