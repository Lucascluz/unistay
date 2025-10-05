/**
 * TypeScript types for API requests and responses
 */

// ============================================================================
// User & Auth Types
// ============================================================================

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ============================================================================
// Review Types
// ============================================================================

export interface Review {
  id: string;
  userId: string;
  author: string;
  location: string;
  property: string;
  rating: number;
  review: string;
  helpful: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateReviewRequest {
  location: string;
  property: string;
  rating: number;
  review: string;
}

export interface GetReviewsParams {
  location?: string;
  page?: number;
  limit?: number;
  sortBy?: 'recent' | 'rating' | 'helpful';
}

export interface ReviewsResponse {
  reviews: Review[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============================================================================
// Location Types
// ============================================================================

export interface LocationStats {
  location: string;
  averageRating: number;
  totalReviews: number;
  recommendationRate: number;
  totalProperties: number;
}

// ============================================================================
// Common Response Types
// ============================================================================

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  message: string;
  statusCode?: number;
}
