/**
 * User API endpoints for profile management
 */

import { apiClient } from './client';
import type { 
  User,
  UpdateUserProfileRequest,
  ProfileCompletionTask
} from './types';

export interface UserProfileResponse {
  user: User;
  profile_tasks: ProfileCompletionTask[];
}

export interface TrustScoreResponse {
  trust_score: number;
  factors: {
    profile_completion: number;
    verified_identity: boolean;
    review_consistency: number;
    engagement_level: number;
    helpful_votes_ratio: number;
    account_age_days: number;
  };
  breakdown: Record<string, number>;
  level: 'New' | 'Growing' | 'Established' | 'Trusted';
}

export const userApi = {
  /**
   * Get current user's full profile with completion tasks
   */
  getProfile: async (): Promise<UserProfileResponse> => {
    return apiClient.get<UserProfileResponse>('/users/profile');
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: UpdateUserProfileRequest): Promise<{ user: User; message: string }> => {
    return apiClient.put<{ user: User; message: string }>('/users/profile', data);
  },

  /**
   * Get detailed trust score breakdown
   */
  getTrustScore: async (): Promise<TrustScoreResponse> => {
    return apiClient.get<TrustScoreResponse>('/users/trust-score');
  },
};
