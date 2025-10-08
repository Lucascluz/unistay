/**
 * TypeScript types for API requests and responses
 * Enhanced with trust scoring, demographics, and analytics support
 */

// ============================================================================
// User & Auth Types
// ============================================================================

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  
  // Identity & demographics
  nationality?: string;
  gender?: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';
  birthDate?: string;
  languagePreferences?: string[];
  currentCountry?: string;
  currentCity?: string;

  // Academic context
  homeUniversity?: string;
  destinationUniversity?: string;
  studyField?: string;
  studyLevel?: 'bachelor' | 'master' | 'phd' | 'exchange' | 'other';
  studyStartDate?: string;
  studyEndDate?: string;

  // Housing data
  currentHousingType?: 'student_home' | 'shared_apartment' | 'private_apartment' | 'family' | 'other';
  monthlyRent?: number;
  isCurrentlyRenting?: boolean;
  hasLivedAbroadBefore?: boolean;

  // Platform engagement
  trustScore: number;
  profileCompletionPercentage: number;
  numberOfReviews: number;
  numberOfHelpfulVotesReceived: number;
  lastActivityAt?: string;

  // Data consent
  dataConsent: boolean;
  anonymizedDataOptIn: boolean;

  createdAt?: string;
  updatedAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  nationality?: string;
  gender?: User['gender'];
  birthDate?: string;
  dataConsent: boolean;
  anonymizedDataOptIn?: boolean;
}

export interface UpdateUserProfileRequest {
  name?: string;
  nationality?: string;
  gender?: User['gender'];
  languagePreferences?: string[];
  currentCountry?: string;
  currentCity?: string;
  homeUniversity?: string;
  destinationUniversity?: string;
  studyField?: string;
  studyLevel?: User['studyLevel'];
  studyStartDate?: string;
  studyEndDate?: string;
  currentHousingType?: User['currentHousingType'];
  monthlyRent?: number;
  isCurrentlyRenting?: boolean;
  hasLivedAbroadBefore?: boolean;
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
  companyType: 'landlord' | 'housing_platform' | 'university' | 'agency' | 'residence';
  verificationStatus: 'pending' | 'verified' | 'rejected';
  
  // Business details
  taxId?: string;
  website?: string;
  phoneNumber?: string;
  address?: string;
  country?: string;
  city?: string;

  // Metrics and behavior
  responseRate: number;
  averageResponseTimeHours?: number;
  averageRating?: number;
  numberOfReviews?: number;
  numberOfVerifiedReps?: number;
  dataCompletenessScore: number;
  trustScore: number;

  // Additional details
  housingUnits?: number;
  capacity?: number;
  priceRange?: [number, number];
  amenities?: string[];
  acceptedStudentsFrom?: string[];
  partnershipStatus?: 'none' | 'partner' | 'featured_partner';

  createdAt: string;
  updatedAt?: string;
}

export interface CompanyRegisterRequest {
  name: string;
  email: string;
  password: string;
  companyType: Company['companyType'];
  taxId?: string;
  website?: string;
  phoneNumber?: string;
  address?: string;
  country?: string;
  city?: string;
  verificationDocumentUrl?: string;
}

export interface UpdateCompanyProfileRequest {
  name?: string;
  website?: string;
  phoneNumber?: string;
  address?: string;
  country?: string;
  city?: string;
  housingUnits?: number;
  capacity?: number;
  priceRange?: [number, number];
  amenities?: string[];
  acceptedStudentsFrom?: string[];
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
  last_login_at?: string;
  number_of_responses?: number;
  average_response_length?: number;
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
  responseSentimentScore?: number;
  helpfulVotes?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Review {
  id: string;
  userId: string;
  author: string;
  authorTrustScore?: number;
  location: string;
  property: string;
  rating: number;
  review: string;
  
  // Enhanced metadata
  categoryTags?: string[];
  sentimentScore?: number;
  language?: string;
  anonymous?: boolean;
  stayStartDate?: string;
  stayEndDate?: string;
  monthlyRent?: number;
  roommatesCount?: number;
  utilitiesIncluded?: boolean;
  photosUrls?: string[];
  
  helpful: number;
  verifiedStay?: boolean;
  
  createdAt: string;
  updatedAt?: string;
  responses?: ReviewResponse[];
}

export interface CreateReviewRequest {
  location: string;
  property: string;
  rating: number;
  review: string;
  categoryTags?: string[];
  anonymous?: boolean;
  stayStartDate?: string;
  stayEndDate?: string;
  monthlyRent?: number;
  roommatesCount?: number;
  utilitiesIncluded?: boolean;
  photosUrls?: string[];
}

export interface GetReviewsParams {
  location?: string;
  page?: number;
  limit?: number;
  sortBy?: 'recent' | 'rating' | 'helpful';
  includeResponses?: boolean;
  minRating?: number;
  maxRating?: number;
  verifiedOnly?: boolean;
  categoryTags?: string[];
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
// Location & Analytics Types
// ============================================================================

export interface LocationStats {
  location: string;
  averageRating: number;
  totalReviews: number;
  recommendationRate: number;
  totalProperties: number;
  averageRent?: number;
  mostCommonComplaints?: string[];
  mostCommonPraises?: string[];
  sentimentTrend?: number;
}

export interface AggregatedInsights {
  location: string;
  averageRent: number;
  averageRating: number;
  totalReviews: number;
  mostCommonComplaints: string[];
  mostCommonPraises: string[];
  sentimentTrend: number;
  timestamp: string;
}

export interface MobilityTrend {
  fromCountry: string;
  toCountry: string;
  toCity: string;
  studentCount: number;
  averageSatisfaction: number;
  period: string;
}

// ============================================================================
// Trust Score & Quality Types
// ============================================================================

export interface TrustScoreFactors {
  profileCompletion: number;
  verifiedIdentity: boolean;
  reviewConsistency: number;
  engagementLevel: number;
  helpfulVotesRatio: number;
  accountAgeDays: number;
}

export interface ProfileCompletionTask {
  field: string;
  label: string;
  completed: boolean;
  weight: number;
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

// ============================================================================
// Type Guards
// ============================================================================

export function isApiError(response: any): response is ApiErrorResponse {
  return response && response.success === false && typeof response.error === 'string';
}

export function isApiSuccess<T>(response: any): response is ApiSuccessResponse<T> {
  return response && response.success === true;
}

// ============================================================================
// Helper Types
// ============================================================================

export type StudyLevel = User['studyLevel'];
export type HousingType = User['currentHousingType'];
export type CompanyType = Company['companyType'];
export type VerificationStatus = Company['verificationStatus'];
export type PartnershipStatus = Company['partnershipStatus'];
export type Gender = User['gender'];

