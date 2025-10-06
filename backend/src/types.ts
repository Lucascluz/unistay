// ============================================================================
// Core Entity Types (Database Models)
// ============================================================================

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;

  // Identity & demographics
  nationality?: string;
  gender?: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';
  birth_date?: Date;
  language_preferences?: string[];
  current_country?: string;
  current_city?: string;

  // Academic context
  home_university?: string;
  destination_university?: string;
  study_field?: string;
  study_level?: 'bachelor' | 'master' | 'phd' | 'exchange' | 'other';
  study_start_date?: Date;
  study_end_date?: Date;

  // Housing data
  current_housing_type?: 'student_home' | 'shared_apartment' | 'private_apartment' | 'family' | 'other';
  monthly_rent?: number;
  is_currently_renting?: boolean;
  has_lived_abroad_before?: boolean;

  // Platform engagement
  trust_score: number; // dynamically calculated
  profile_completion_percentage: number;
  number_of_reviews: number;
  number_of_helpful_votes_received: number;
  last_activity_at?: Date;

  // Data consent & analytics
  data_consent: boolean;
  anonymized_data_opt_in: boolean;

  created_at: Date;
  updated_at: Date;
}

export interface Company {
  id: string;
  name: string;
  email: string;
  password_hash: string;

  company_type: 'landlord' | 'housing_platform' | 'university' | 'agency' | 'residence';
  verification_status: 'pending' | 'verified' | 'rejected';
  verification_token?: string;
  verification_document_url?: string;

  // Business details
  tax_id?: string;
  website?: string;
  phone_number?: string;
  address?: string;
  country?: string;
  city?: string;

  // Metrics and behavior
  response_rate: number; // % of reviews responded
  average_response_time_hours?: number;
  average_rating?: number;
  number_of_reviews?: number;
  number_of_verified_reps?: number;
  data_completeness_score: number;
  trust_score: number;

  // Additional details
  housing_units?: number;
  capacity?: number;
  price_range?: [number, number];
  amenities?: string[];
  accepted_students_from?: string[]; // e.g., universities
  partnership_status?: 'none' | 'partner' | 'featured_partner';

  created_at: Date;
  updated_at: Date;
}

export interface CompanyRepresentative {
  id: string;
  company_id: string;
  user_email: string;
  role: string;
  is_primary: boolean;
  verified: boolean;
  verification_token?: string;
  verification_sent_at?: Date;
  last_login_at?: Date;

  // Engagement
  number_of_responses?: number;
  average_response_length?: number;

  created_at: Date;
}

export interface Review {
  id: string;
  user_id: string;
  location: string;
  property: string;
  rating: number; // 1–5
  review: string;

  // Additional review metadata
  category_tags?: string[]; // e.g., ['cleanliness', 'safety', 'location']
  sentiment_score?: number; // e.g., -1 to +1 NLP-generated
  language?: string;
  anonymous?: boolean;
  stay_start_date?: Date;
  stay_end_date?: Date;
  monthly_rent?: number;
  roommates_count?: number;
  utilities_included?: boolean;
  photos_urls?: string[];

  helpful: number;
  verified_stay?: boolean; // if matched to housing record

  created_at: Date;
  updated_at: Date;
}

export interface ReviewResponse {
  id: string;
  review_id: string;
  user_id?: string;
  company_id?: string;
  response_text: string;
  is_company_response: boolean;
  response_sentiment_score?: number; // NLP metric
  helpful_votes?: number;

  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// Public Interfaces (Sanitized for Analytics/Export)
// ============================================================================

export interface UserPublic {
  id: string;
  name: string;
  email: string;
  nationality?: string;
  gender?: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';
  birthDate?: string;
  languagePreferences?: string[];
  currentCountry?: string;
  currentCity?: string;
  homeUniversity?: string;
  destinationUniversity?: string;
  studyField?: string;
  studyLevel?: 'bachelor' | 'master' | 'phd' | 'exchange' | 'other';
  studyStartDate?: string;
  studyEndDate?: string;
  currentHousingType?: 'student_home' | 'shared_apartment' | 'private_apartment' | 'family' | 'other';
  monthlyRent?: number;
  isCurrentlyRenting?: boolean;
  hasLivedAbroadBefore?: boolean;
  trustScore: number;
  profileCompletionPercentage: number;
  numberOfReviews: number;
  numberOfHelpfulVotesReceived: number;
  lastActivityAt?: string;
  dataConsent: boolean;
  anonymizedDataOptIn: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CompanyPublic {
  id: string;
  name: string;
  companyType: string;
  verificationStatus: string;
  trust_score: number;
  response_rate: number;
  average_rating?: number;
  data_completeness_score: number;
  country?: string;
  city?: string;
  website?: string;
  amenities?: string[];
  partnership_status?: string;
  createdAt: string;
}

export interface ReviewPublic {
  id: string;
  userId: string;
  author: string;
  authorTrustScore?: number;
  location: string;
  property: string;
  rating: number;
  review: string;
  category_tags?: string[];
  sentiment_score?: number;
  verified_stay?: boolean;
  helpful: number;
  anonymous?: boolean;
  stay_start_date?: string;
  stay_end_date?: string;
  monthly_rent?: number;
  createdAt: string;
  updatedAt?: string;
  responses?: ReviewResponsePublic[];
}

export interface ReviewResponsePublic {
  id: string;
  reviewId: string;
  authorName: string;
  authorType: 'user' | 'company';
  companyName?: string;
  companyType?: string;
  responseText: string;
  response_sentiment_score?: number;
  helpful_votes?: number;
  createdAt: string;
  updatedAt?: string;
}

// ============================================================================
// Trust & Quality Scoring Types
// ============================================================================

export interface TrustScoreFactors {
  profile_completion: number;
  verified_identity: boolean;
  review_consistency: number;
  engagement_level: number;
  helpful_votes_ratio: number;
  account_age_days: number;
}

export interface CompanyTrustScoreFactors {
  data_completeness: number;
  verification_status: 'pending' | 'verified' | 'rejected';
  response_rate: number;
  average_response_time_hours: number;
  review_rating_average: number;
  number_of_reviews: number;
  verified_representatives: number;
  account_age_days: number;
}

// ============================================================================
// Analytics & Behavioral Types
// ============================================================================

export interface UserBehaviorEvent {
  id: string;
  user_id: string;
  event_type: 'viewed_review' | 'reported_review' | 'updated_profile' | 'marked_helpful' | 'searched_location' | 'viewed_company';
  event_data?: Record<string, any>;
  timestamp: Date;
}

export interface AggregatedInsights {
  location: string;
  average_rent: number;
  average_rating: number;
  total_reviews: number;
  most_common_complaints: string[];
  most_common_praises: string[];
  sentiment_trend: number; // -1 to +1
  timestamp: Date;
}

export interface MobilityTrend {
  from_country: string;
  to_country: string;
  to_city: string;
  student_count: number;
  average_satisfaction: number;
  period: string; // e.g., '2025-Q1'
}

// ============================================================================
// Request/Response DTOs
// ============================================================================

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  nationality?: string;
  gender?: User['gender'];
  birth_date?: string;
  data_consent: boolean;
  anonymized_data_opt_in?: boolean;
}

export interface UpdateUserProfileRequest {
  name?: string;
  nationality?: string;
  gender?: User['gender'];
  language_preferences?: string[];
  current_country?: string;
  current_city?: string;
  home_university?: string;
  destination_university?: string;
  study_field?: string;
  study_level?: User['study_level'];
  study_start_date?: string;
  study_end_date?: string;
  current_housing_type?: User['current_housing_type'];
  monthly_rent?: number;
  is_currently_renting?: boolean;
  has_lived_abroad_before?: boolean;
}

export interface CreateCompanyRequest {
  name: string;
  email: string;
  password: string;
  company_type: Company['company_type'];
  tax_id?: string;
  website?: string;
  phone_number?: string;
  address?: string;
  country?: string;
  city?: string;
  verification_document_url?: string;
}

export interface UpdateCompanyProfileRequest {
  name?: string;
  website?: string;
  phone_number?: string;
  address?: string;
  country?: string;
  city?: string;
  housing_units?: number;
  capacity?: number;
  price_range?: [number, number];
  amenities?: string[];
  accepted_students_from?: string[];
}

export interface CreateReviewRequest {
  location: string;
  property: string;
  rating: number;
  review: string;
  category_tags?: string[];
  anonymous?: boolean;
  stay_start_date?: string;
  stay_end_date?: string;
  monthly_rent?: number;
  roommates_count?: number;
  utilities_included?: boolean;
  photos_urls?: string[];
}

export interface CreateReviewResponseRequest {
  review_id: string;
  response_text: string;
}

// ============================================================================
// Validation & Helper Types
// ============================================================================

export type StudyLevel = User['study_level'];
export type HousingType = User['current_housing_type'];
export type CompanyType = Company['company_type'];
export type VerificationStatus = Company['verification_status'];
export type PartnershipStatus = Company['partnership_status'];
export type Gender = User['gender'];

// ============================================================================
// Legacy Support (maintain backward compatibility)
// ============================================================================

/** @deprecated Use UserPublic instead */
