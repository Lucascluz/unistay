import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { pool } from '../db/config';
import { generateToken } from '../utils/jwt';
import { User, UserPublic } from '../types';
import { calculateUserProfileCompletion, calculateUserTrustScore } from '../utils/trust-score';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().max(255),
  password: z.string().min(6).max(100),
  // Optional demographic fields
  nationality: z.string().max(100).optional(),
  gender: z.enum(['male', 'female', 'non_binary', 'prefer_not_to_say']).optional(),
  birth_date: z.string().optional(), // ISO date string
  // Required consent
  data_consent: z.boolean(),
  anonymized_data_opt_in: z.boolean().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Helper to convert DB user to public format
function toPublicUser(user: User): UserPublic {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    nationality: user.nationality,
    gender: user.gender,
    birthDate: user.birth_date?.toISOString().split('T')[0],
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
    lastActivityAt: user.last_activity_at?.toISOString(),
    dataConsent: user.data_consent,
    anonymizedDataOptIn: user.anonymized_data_opt_in,
    createdAt: user.created_at.toISOString(),
    updatedAt: user.updated_at?.toISOString(),
  };
}

// Register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);
    const { name, email, password, nationality, gender, birth_date, data_consent, anonymized_data_opt_in } = data;

    // Validate data consent
    if (!data_consent) {
      return res.status(400).json({
        success: false,
        error: 'Data consent required',
        message: 'You must consent to data processing to register',
      });
    }

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'User already exists',
        message: 'A user with this email already exists',
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Calculate initial metrics
    const profileData = {
      name,
      email,
      nationality,
      gender,
      birth_date: birth_date ? new Date(birth_date) : undefined
    };
    
    const profile_completion = calculateUserProfileCompletion(profileData);
    const trust_score = calculateUserTrustScore(profileData, {
      profile_completion,
      account_age_days: 0,
      engagement_level: 0,
      helpful_votes_ratio: 0,
      review_consistency: 50,
      verified_identity: false
    });

    // Create user with enhanced fields
    const result = await pool.query<User>(
      `INSERT INTO users (
        name, email, password_hash, nationality, gender, birth_date,
        data_consent, anonymized_data_opt_in, trust_score, 
        profile_completion_percentage, number_of_reviews,
        number_of_helpful_votes_received, created_at, updated_at
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0, 0, NOW(), NOW())
       RETURNING *`,
      [
        name, 
        email, 
        passwordHash,
        nationality || null,
        gender || null,
        birth_date ? new Date(birth_date) : null,
        data_consent,
        anonymized_data_opt_in || false,
        trust_score,
        profile_completion
      ]
    );

    const user = result.rows[0];
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: toPublicUser(user),
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

    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to register user',
    });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Find user
    const result = await pool.query<User>(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Invalid email or password',
      });
    }

    const user = result.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user.id);

    res.json({
      success: true,
      data: {
        token,
        user: toPublicUser(user),
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

    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to login',
    });
  }
});

// Get current user
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'No token provided',
      });
    }

    const token = authHeader.substring(7);
    const { verifyToken } = require('../utils/jwt');
    const decoded = verifyToken(token);

    // Get user from database
    const result = await pool.query<User>(
      'SELECT * FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User does not exist',
      });
    }

    res.json({
      success: true,
      data: toPublicUser(result.rows[0]),
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
});

// Logout (optional - mainly client-side)
router.post('/logout', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

export default router;
