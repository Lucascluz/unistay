import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import crypto from 'crypto';
import { pool } from '../db/config';
import { generateToken } from '../utils/jwt';
import { User, UserPublic } from '../types';
import { calculateUserProfileCompletion, calculateUserTrustScore } from '../utils/trust-score';
import { sendVerificationEmail } from '../utils/email';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().max(255),
  password: z.string().min(6).max(100),
  // Optional demographic fields - convert empty strings to undefined
  nationality: z.string().max(100).optional().or(z.literal("")).transform(val => val === "" ? undefined : val),
  gender: z.enum(['male', 'female', 'non_binary', 'prefer_not_to_say']).optional(),
  birthDate: z.string().optional().or(z.literal("")).transform(val => val === "" ? undefined : val), // ISO date string
  languagePreferences: z.array(z.string()).optional(),
  currentCountry: z.string().max(100).optional().or(z.literal("")).transform(val => val === "" ? undefined : val),
  currentCity: z.string().max(100).optional().or(z.literal("")).transform(val => val === "" ? undefined : val),
  // Academic fields
  homeUniversity: z.string().max(255).optional().or(z.literal("")).transform(val => val === "" ? undefined : val),
  destinationUniversity: z.string().max(255).optional().or(z.literal("")).transform(val => val === "" ? undefined : val),
  studyField: z.string().max(255).optional().or(z.literal("")).transform(val => val === "" ? undefined : val),
  studyLevel: z.enum(['bachelor', 'master', 'phd', 'exchange', 'other']).optional(),
  studyStartDate: z.string().optional().or(z.literal("")).transform(val => val === "" ? undefined : val),
  studyEndDate: z.string().optional().or(z.literal("")).transform(val => val === "" ? undefined : val),
  // Housing fields
  currentHousingType: z.enum(['student_home', 'shared_apartment', 'private_apartment', 'family', 'other']).optional(),
  monthlyRent: z.number().optional(),
  isCurrentlyRenting: z.boolean().optional(),
  hasLivedAbroadBefore: z.boolean().optional(),
  // Required consent
  dataConsent: z.boolean(),
  anonymizedDataOptIn: z.boolean().optional(),
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
    emailVerified: user.email_verified,
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
    console.log('📝 Registration request received:', JSON.stringify(req.body, null, 2));
    
    const data = registerSchema.parse(req.body);
    const { 
      name, email, password, nationality, gender, birthDate, 
      languagePreferences, currentCountry, currentCity,
      homeUniversity, destinationUniversity, studyField, studyLevel,
      studyStartDate, studyEndDate, currentHousingType, monthlyRent,
      isCurrentlyRenting, hasLivedAbroadBefore,
      dataConsent, anonymizedDataOptIn 
    } = data;

    console.log('✅ Validation passed:', { name, email, dataConsent });

    // Validate data consent
    if (!dataConsent) {
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

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Calculate initial metrics
    const profileData = {
      name,
      email,
      nationality,
      gender,
      birth_date: birthDate ? new Date(birthDate) : undefined,
      language_preferences: languagePreferences,
      current_country: currentCountry,
      current_city: currentCity,
      home_university: homeUniversity,
      destination_university: destinationUniversity,
      study_field: studyField,
      study_level: studyLevel,
      study_start_date: studyStartDate ? new Date(studyStartDate) : undefined,
      study_end_date: studyEndDate ? new Date(studyEndDate) : undefined,
      current_housing_type: currentHousingType,
      monthly_rent: monthlyRent,
      is_currently_renting: isCurrentlyRenting,
      has_lived_abroad_before: hasLivedAbroadBefore,
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
        language_preferences, current_country, current_city,
        home_university, destination_university, study_field, study_level,
        study_start_date, study_end_date, current_housing_type, monthly_rent,
        is_currently_renting, has_lived_abroad_before,
        data_consent, anonymized_data_opt_in, trust_score, 
        profile_completion_percentage, number_of_reviews,
        number_of_helpful_votes_received, email_verified,
        verification_token, verification_token_expires_at,
        created_at, updated_at
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, 0, 0, false, $24, $25, NOW(), NOW())
       RETURNING *`,
      [
        name, 
        email, 
        passwordHash,
        nationality || null,
        gender || null,
        birthDate ? new Date(birthDate) : null,
        languagePreferences || null,
        currentCountry || null,
        currentCity || null,
        homeUniversity || null,
        destinationUniversity || null,
        studyField || null,
        studyLevel || null,
        studyStartDate ? new Date(studyStartDate) : null,
        studyEndDate ? new Date(studyEndDate) : null,
        currentHousingType || null,
        monthlyRent || null,
        isCurrentlyRenting || false,
        hasLivedAbroadBefore || false,
        dataConsent,
        anonymizedDataOptIn || false,
        trust_score,
        profile_completion,
        verificationToken,
        verificationTokenExpiresAt
      ]
    );

    const user = result.rows[0];

    // Send verification email
    const emailSent = await sendVerificationEmail(email, name, verificationToken);
    
    if (!emailSent) {
      console.error('Failed to send verification email to:', email);
      // Don't fail registration if email fails, but log it
    }

    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: toPublicUser(user),
      },
      message: 'Registration successful! Please check your email to verify your account.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Validation error:', error.errors);
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.errors[0].message,
        details: error.errors,
      });
    }

    console.error('❌ Register error:', error);
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

// Verify email
router.get('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid token',
        message: 'Verification token is required',
      });
    }

    // Find user with this verification token
    const result = await pool.query<User>(
      `SELECT * FROM users 
       WHERE verification_token = $1 
       AND verification_token_expires_at > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired token',
        message: 'This verification link is invalid or has expired. Please request a new one.',
      });
    }

    const user = result.rows[0];

    // Check if already verified
    if (user.email_verified) {
      return res.status(400).json({
        success: false,
        error: 'Already verified',
        message: 'This email address has already been verified.',
      });
    }

    // Update user as verified
    await pool.query(
      `UPDATE users 
       SET email_verified = true, 
           verification_token = NULL,
           verification_token_expires_at = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [user.id]
    );

    res.json({
      success: true,
      message: 'Email verified successfully! You can now log in.',
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to verify email',
    });
  }
});

// Resend verification email
router.post('/resend-verification', async (req: Request, res: Response) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);

    // Find user
    const result = await pool.query<User>(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'No account found with this email address',
      });
    }

    const user = result.rows[0];

    // Check if already verified
    if (user.email_verified) {
      return res.status(400).json({
        success: false,
        error: 'Already verified',
        message: 'This email address has already been verified',
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new token
    await pool.query(
      `UPDATE users 
       SET verification_token = $1,
           verification_token_expires_at = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [verificationToken, verificationTokenExpiresAt, user.id]
    );

    // Send verification email
    const emailSent = await sendVerificationEmail(email, user.name, verificationToken);

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        error: 'Email sending failed',
        message: 'Failed to send verification email. Please try again later.',
      });
    }

    res.json({
      success: true,
      message: 'Verification email sent! Please check your inbox.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.errors[0].message,
      });
    }

    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to resend verification email',
    });
  }
});

export default router;
