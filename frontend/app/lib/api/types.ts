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
// Company Types
// ============================================================================

export interface Company {
  id: string;
  name: string;
  email: string;
  companyType: 'landlord' | 'housing_platform' | 'university';
  verificationStatus: 'pending' | 'verified' | 'rejected';
  website?: string;
  createdAt: string;
}

export interface CompanyRegisterRequest {
  name: string;
  email: string;
  password: string;
  companyType: 'landlord' | 'housing_platform' | 'university';
  taxId?: string;
  website?: string;
  verificationDocumentUrl?: string;
}

export interface CompanyLoginRequest {
  email: string;
  password: string;
}

export interface CompanyAuthResponse {
  token: string;
  company: Company;
}

export interface CompanyRepresentative {
  id: string;
  company_id: string;
  user_email: string;
  role: string;
  is_primary: boolean;
  verified: boolean;
  created_at: string;
}

export interface AddRepresentativeRequest {
  userEmail: string;
  role: string;
  isPrimary?: boolean;
}

// ============================================================================
// Review Types
// ============================================================================

export interface ReviewResponse {
  id: string;
  reviewId: string;
  authorName: string;
  authorType: 'user' | 'company';
  companyName?: string;
  companyType?: string;
  responseText: string;
  createdAt: string;
  updatedAt?: string;
}

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
  responses?: ReviewResponse[];
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
  includeResponses?: boolean;
}

export interface ReviewsResponse {
  reviews: Review[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface CreateResponseRequest {
  reviewId: string;
  responseText: string;
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
