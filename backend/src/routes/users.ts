import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { pool } from '../db/config';
import { User } from '../types';
import { authenticateUser } from '../middleware/auth';
import { calculateUserProfileCompletion, calculateUserTrustScore, getUserProfileTasks } from '../utils/trust-score';

const router = Router();

// Update profile schema - accepts camelCase from frontend
const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  nationality: z.string().max(100).optional(),
  gender: z.enum(['male', 'female', 'non_binary', 'prefer_not_to_say']).optional(),
  languagePreferences: z.array(z.string()).optional(),
  currentCountry: z.string().max(100).optional(),
  currentCity: z.string().max(100).optional(),
  homeUniversity: z.string().max(255).optional(),
  destinationUniversity: z.string().max(255).optional(),
  studyField: z.string().max(255).optional(),
  studyLevel: z.enum(['bachelor', 'master', 'phd', 'exchange', 'other']).optional(),
  studyStartDate: z.string().optional(),
  studyEndDate: z.string().optional(),
  currentHousingType: z.enum(['student_home', 'shared_apartment', 'private_apartment', 'family', 'other']).optional(),
  monthlyRent: z.number().optional(),
  isCurrentlyRenting: z.boolean().optional(),
  hasLivedAbroadBefore: z.boolean().optional(),
});

// Get user profile
router.get('/profile', authenticateUser, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const result = await pool.query<User>(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const user = result.rows[0];

    // Get profile completion tasks
    const tasks = getUserProfileTasks(user);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          nationality: user.nationality,
          gender: user.gender,
          birthDate: user.birth_date,
          languagePreferences: user.language_preferences,
          currentCountry: user.current_country,
          currentCity: user.current_city,
          homeUniversity: user.home_university,
          destinationUniversity: user.destination_university,
          studyField: user.study_field,
          studyLevel: user.study_level,
          studyStartDate: user.study_start_date?.toISOString().split('T')[0],
          studyEndDate: user.study_end_date?.toISOString().split('T')[0],
          currentHousingType: user.current_housing_type,
          monthlyRent: user.monthly_rent,
          isCurrentlyRenting: user.is_currently_renting,
          hasLivedAbroadBefore: user.has_lived_abroad_before,
          trustScore: user.trust_score,
          profileCompletionPercentage: user.profile_completion_percentage,
          numberOfReviews: user.number_of_reviews,
          numberOfHelpfulVotesReceived: user.number_of_helpful_votes_received,
          lastActivityAt: user.last_activity_at,
          dataConsent: user.data_consent,
          anonymizedDataOptIn: user.anonymized_data_opt_in,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        },
        profile_tasks: tasks,
        profile_completion_percentage: user.profile_completion_percentage,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get profile',
    });
  }
});

// Update user profile
router.put('/profile', authenticateUser, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const updates = updateProfileSchema.parse(req.body);

    // Get current user data
    const currentUser = await pool.query<User>(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (currentUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Map camelCase to snake_case for database
    const fieldMapping: Record<string, string> = {
      name: 'name',
      nationality: 'nationality',
      gender: 'gender',
      languagePreferences: 'language_preferences',
      currentCountry: 'current_country',
      currentCity: 'current_city',
      homeUniversity: 'home_university',
      destinationUniversity: 'destination_university',
      studyField: 'study_field',
      studyLevel: 'study_level',
      studyStartDate: 'study_start_date',
      studyEndDate: 'study_end_date',
      currentHousingType: 'current_housing_type',
      monthlyRent: 'monthly_rent',
      isCurrentlyRenting: 'is_currently_renting',
      hasLivedAbroadBefore: 'has_lived_abroad_before',
    };

    // Build dynamic update query
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    // Convert updates to snake_case for database
    const dbUpdates: Record<string, any> = {};
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbField = fieldMapping[key] || key;
        dbUpdates[dbField] = value;
        
        // Handle date conversions
        if (dbField === 'study_start_date' || dbField === 'study_end_date') {
          fields.push(`${dbField} = $${paramCount}`);
          values.push(new Date(value as string));
        } else {
          fields.push(`${dbField} = $${paramCount}`);
          values.push(value);
        }
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update',
      });
    }

    // Merge current user with updates for calculation
    const updatedUserData: Partial<User> = { 
      ...currentUser.rows[0],
      ...dbUpdates,
      study_start_date: dbUpdates.study_start_date ? new Date(dbUpdates.study_start_date) : currentUser.rows[0].study_start_date,
      study_end_date: dbUpdates.study_end_date ? new Date(dbUpdates.study_end_date) : currentUser.rows[0].study_end_date,
    };

    // Recalculate metrics
    const profile_completion = calculateUserProfileCompletion(updatedUserData);

    const accountAgeDays = Math.floor(
      (Date.now() - new Date(currentUser.rows[0].created_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    const trust_score = calculateUserTrustScore(updatedUserData, {
      profile_completion,
      account_age_days: accountAgeDays,
      engagement_level: Math.min(100, (updatedUserData.number_of_reviews || 0) * 10),
      helpful_votes_ratio: (updatedUserData.number_of_helpful_votes_received || 0) / Math.max(1, updatedUserData.number_of_reviews || 1),
      review_consistency: 75, // TODO: Calculate from actual review variance
      verified_identity: false, // TODO: Implement email verification
    });

    // Add calculated fields
    fields.push(`profile_completion_percentage = $${paramCount}`);
    values.push(profile_completion);
    paramCount++;

    fields.push(`trust_score = $${paramCount}`);
    values.push(trust_score);
    paramCount++;

    fields.push(`updated_at = NOW()`);
    fields.push(`last_activity_at = NOW()`);

    values.push(userId);

    // Update user
    const result = await pool.query<User>(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    const user = result.rows[0];

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          nationality: user.nationality,
          gender: user.gender,
          birthDate: user.birth_date,
          languagePreferences: user.language_preferences,
          currentCountry: user.current_country,
          currentCity: user.current_city,
          homeUniversity: user.home_university,
          destinationUniversity: user.destination_university,
          studyField: user.study_field,
          studyLevel: user.study_level,
          studyStartDate: user.study_start_date?.toISOString().split('T')[0],
          studyEndDate: user.study_end_date?.toISOString().split('T')[0],
          currentHousingType: user.current_housing_type,
          monthlyRent: user.monthly_rent,
          isCurrentlyRenting: user.is_currently_renting,
          hasLivedAbroadBefore: user.has_lived_abroad_before,
          trustScore: user.trust_score,
          profileCompletionPercentage: user.profile_completion_percentage,
          numberOfReviews: user.number_of_reviews,
          numberOfHelpfulVotesReceived: user.number_of_helpful_votes_received,
          lastActivityAt: user.last_activity_at,
          dataConsent: user.data_consent,
          anonymizedDataOptIn: user.anonymized_data_opt_in,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        },
        message: 'Profile updated successfully',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.errors[0].message,
      });
    }

    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
    });
  }
});

// Get trust score breakdown
router.get('/trust-score', authenticateUser, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const result = await pool.query<User>(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const user = result.rows[0];

    const accountAgeDays = Math.floor(
      (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    const factors = {
      profile_completion: user.profile_completion_percentage,
      verified_identity: false, // TODO: Implement
      review_consistency: 75, // TODO: Calculate
      engagement_level: Math.min(100, (user.number_of_reviews || 0) * 10),
      helpful_votes_ratio: (user.number_of_helpful_votes_received || 0) / Math.max(1, user.number_of_reviews || 1),
      account_age_days: accountAgeDays,
    };

    res.json({
      success: true,
      data: {
        trust_score: user.trust_score,
        factors,
        breakdown: {
          'Profile Completion (30%)': Math.round(factors.profile_completion * 0.30),
          'Review Consistency (25%)': Math.round(75 * 0.25),
          'Engagement Level (20%)': Math.round(factors.engagement_level * 0.20),
          'Helpful Votes (15%)': Math.round(factors.helpful_votes_ratio * 100 * 0.15),
          'Account Age (10%)': Math.round(Math.min(100, accountAgeDays / 3.65) * 0.10),
        },
        level: user.trust_score >= 80 ? 'Trusted' : user.trust_score >= 60 ? 'Established' : user.trust_score >= 40 ? 'Growing' : 'New',
      },
    });
  } catch (error) {
    console.error('Get trust score error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get trust score',
    });
  }
});

export default router;
