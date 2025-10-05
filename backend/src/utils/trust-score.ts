/**
 * Trust Score Calculation Utilities
 * 
 * Calculates trust scores for users and companies based on multiple factors
 * to improve data quality and enable better analytics.
 */

import type { User, Company, TrustScoreFactors, CompanyTrustScoreFactors } from '../types';

// ============================================================================
// User Trust Score Calculation
// ============================================================================

/**
 * Calculate profile completion percentage for a user
 */
export function calculateUserProfileCompletion(user: Partial<User>): number {
  const fields = [
    'name', 'email', 'nationality', 'gender', 'birth_date',
    'language_preferences', 'current_country', 'current_city',
    'home_university', 'destination_university', 'study_field',
    'study_level', 'study_start_date', 'study_end_date',
    'current_housing_type', 'monthly_rent', 'is_currently_renting',
    'has_lived_abroad_before'
  ];

  const filledFields = fields.filter(field => {
    const value = user[field as keyof User];
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null && value !== '';
  });

  return Math.round((filledFields.length / fields.length) * 100);
}

/**
 * Calculate trust score for a user (0-100)
 * 
 * Factors:
 * - Profile completion: 30%
 * - Review consistency: 25%
 * - Engagement level: 20%
 * - Helpful votes ratio: 15%
 * - Account age: 10%
 */
export function calculateUserTrustScore(
  user: Partial<User>,
  factors: Partial<TrustScoreFactors>
): number {
  const weights = {
    profile_completion: 0.30,
    review_consistency: 0.25,
    engagement_level: 0.20,
    helpful_votes_ratio: 0.15,
    account_age: 0.10
  };

  // Profile completion (0-100)
  const profileScore = factors.profile_completion || calculateUserProfileCompletion(user);

  // Review consistency (0-100)
  // Higher score if reviews are not all extreme (all 1s or all 5s)
  const reviewConsistency = factors.review_consistency || 50;

  // Engagement level (0-100)
  // Based on number of reviews and helpful votes given
  const engagementScore = factors.engagement_level || 
    Math.min(100, ((user.number_of_reviews || 0) * 10) + 
    ((factors.helpful_votes_ratio || 0) * 50));

  // Helpful votes ratio (0-100)
  const helpfulVotesScore = Math.min(100, (factors.helpful_votes_ratio || 0) * 100);

  // Account age bonus (0-100)
  const accountAgeScore = Math.min(100, (factors.account_age_days || 0) / 3.65); // Max at ~1 year

  const trustScore = 
    (profileScore * weights.profile_completion) +
    (reviewConsistency * weights.review_consistency) +
    (engagementScore * weights.engagement_level) +
    (helpfulVotesScore * weights.helpful_votes_ratio) +
    (accountAgeScore * weights.account_age);

  return Math.round(trustScore);
}

// ============================================================================
// Company Trust Score Calculation
// ============================================================================

/**
 * Calculate data completeness percentage for a company
 */
export function calculateCompanyDataCompleteness(company: Partial<Company>): number {
  const fields = [
    'name', 'email', 'company_type', 'tax_id', 'website',
    'phone_number', 'address', 'country', 'city',
    'housing_units', 'capacity', 'price_range', 'amenities',
    'accepted_students_from'
  ];

  const filledFields = fields.filter(field => {
    const value = company[field as keyof Company];
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null && value !== '';
  });

  return Math.round((filledFields.length / fields.length) * 100);
}

/**
 * Calculate trust score for a company (0-100)
 * 
 * Factors:
 * - Verification status: 25%
 * - Data completeness: 20%
 * - Response rate: 20%
 * - Average rating: 15%
 * - Response time: 10%
 * - Number of reviews: 5%
 * - Verified representatives: 3%
 * - Account age: 2%
 */
export function calculateCompanyTrustScore(
  company: Partial<Company>,
  factors: Partial<CompanyTrustScoreFactors>
): number {
  const weights = {
    verification_status: 0.25,
    data_completeness: 0.20,
    response_rate: 0.20,
    average_rating: 0.15,
    response_time: 0.10,
    number_of_reviews: 0.05,
    verified_reps: 0.03,
    account_age: 0.02
  };

  // Verification status (0-100)
  const verificationScore = 
    company.verification_status === 'verified' ? 100 :
    company.verification_status === 'pending' ? 50 : 0;

  // Data completeness (0-100)
  const dataCompletenessScore = factors.data_completeness || 
    calculateCompanyDataCompleteness(company);

  // Response rate (0-100)
  const responseRateScore = (company.response_rate || 0) * 100;

  // Average rating (0-100)
  const ratingScore = ((company.average_rating || 0) / 5) * 100;

  // Response time (0-100) - lower is better
  // Excellent: < 24h, Good: < 72h, Poor: > 168h
  const responseTimeHours = company.average_response_time_hours || 168;
  const responseTimeScore = Math.max(0, 100 - (responseTimeHours / 168) * 100);

  // Number of reviews bonus (0-100)
  const reviewsScore = Math.min(100, ((company.number_of_reviews || 0) / 50) * 100);

  // Verified representatives bonus (0-100)
  const verifiedRepsScore = Math.min(100, ((company.number_of_verified_reps || 0) / 5) * 100);

  // Account age bonus (0-100)
  const accountAgeScore = Math.min(100, (factors.account_age_days || 0) / 3.65);

  const trustScore = 
    (verificationScore * weights.verification_status) +
    (dataCompletenessScore * weights.data_completeness) +
    (responseRateScore * weights.response_rate) +
    (ratingScore * weights.average_rating) +
    (responseTimeScore * weights.response_time) +
    (reviewsScore * weights.number_of_reviews) +
    (verifiedRepsScore * weights.verified_reps) +
    (accountAgeScore * weights.account_age);

  return Math.round(trustScore);
}

// ============================================================================
// Review Quality Scoring
// ============================================================================

/**
 * Calculate review quality score based on various factors
 */
export interface ReviewQualityFactors {
  review_length: number;
  has_photos: boolean;
  has_category_tags: boolean;
  verified_stay: boolean;
  has_detailed_info: boolean; // rent, dates, roommates, etc.
  sentiment_consistency: number; // sentiment vs rating alignment
}

export function calculateReviewQualityScore(factors: ReviewQualityFactors): number {
  const weights = {
    length: 0.20,
    photos: 0.15,
    tags: 0.15,
    verified: 0.25,
    detailed: 0.15,
    consistency: 0.10
  };

  // Length score (0-100) - optimal around 200-500 chars
  const lengthScore = Math.min(100, (factors.review_length / 300) * 100);

  // Photos score (0-100)
  const photosScore = factors.has_photos ? 100 : 0;

  // Tags score (0-100)
  const tagsScore = factors.has_category_tags ? 100 : 0;

  // Verified stay score (0-100)
  const verifiedScore = factors.verified_stay ? 100 : 0;

  // Detailed info score (0-100)
  const detailedScore = factors.has_detailed_info ? 100 : 0;

  // Sentiment consistency (0-100)
  const consistencyScore = factors.sentiment_consistency * 100;

  const qualityScore = 
    (lengthScore * weights.length) +
    (photosScore * weights.photos) +
    (tagsScore * weights.tags) +
    (verifiedScore * weights.verified) +
    (detailedScore * weights.detailed) +
    (consistencyScore * weights.consistency);

  return Math.round(qualityScore);
}

// ============================================================================
// Gamification Helper
// ============================================================================

export interface ProfileCompletionTask {
  field: string;
  label: string;
  completed: boolean;
  weight: number;
}

/**
 * Get profile completion tasks for gamification
 */
export function getUserProfileTasks(user: Partial<User>): ProfileCompletionTask[] {
  return [
    { field: 'nationality', label: 'Add your nationality', completed: !!user.nationality, weight: 5 },
    { field: 'birth_date', label: 'Add your birth date', completed: !!user.birth_date, weight: 3 },
    { field: 'language_preferences', label: 'Set language preferences', completed: !!user.language_preferences?.length, weight: 3 },
    { field: 'current_city', label: 'Add your current city', completed: !!user.current_city, weight: 5 },
    { field: 'home_university', label: 'Add your home university', completed: !!user.home_university, weight: 8 },
    { field: 'destination_university', label: 'Add your destination university', completed: !!user.destination_university, weight: 8 },
    { field: 'study_field', label: 'Add your field of study', completed: !!user.study_field, weight: 5 },
    { field: 'study_level', label: 'Add your study level', completed: !!user.study_level, weight: 3 },
    { field: 'current_housing_type', label: 'Add your current housing type', completed: !!user.current_housing_type, weight: 5 },
    { field: 'monthly_rent', label: 'Add your monthly rent', completed: !!user.monthly_rent, weight: 3 },
  ];
}

export function getCompanyProfileTasks(company: Partial<Company>): ProfileCompletionTask[] {
  return [
    { field: 'tax_id', label: 'Add tax ID', completed: !!company.tax_id, weight: 10 },
    { field: 'website', label: 'Add website URL', completed: !!company.website, weight: 5 },
    { field: 'phone_number', label: 'Add phone number', completed: !!company.phone_number, weight: 5 },
    { field: 'address', label: 'Add address', completed: !!company.address, weight: 8 },
    { field: 'city', label: 'Add city', completed: !!company.city, weight: 5 },
    { field: 'country', label: 'Add country', completed: !!company.country, weight: 5 },
    { field: 'housing_units', label: 'Add number of housing units', completed: !!company.housing_units, weight: 5 },
    { field: 'capacity', label: 'Add capacity', completed: !!company.capacity, weight: 5 },
    { field: 'price_range', label: 'Add price range', completed: !!company.price_range, weight: 8 },
    { field: 'amenities', label: 'Add amenities', completed: !!company.amenities?.length, weight: 8 },
  ];
}
