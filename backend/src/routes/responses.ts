import { Router, Response } from 'express';
import { z } from 'zod';
import { pool } from '../db/config';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { ReviewResponse, ReviewResponsePublic, User, Company } from '../types';

const router = Router();

// Validation schema
const createResponseSchema = z.object({
  reviewId: z.string().uuid(),
  responseText: z.string().min(10).max(2000),
});

// Helper to convert DB response to public format
async function toPublicResponse(response: ReviewResponse): Promise<ReviewResponsePublic> {
  let authorName = 'Unknown';
  let authorType: 'user' | 'company' = 'user';
  let companyName: string | undefined;
  let companyType: string | undefined;

  if (response.is_company_response && response.company_id) {
    authorType = 'company';
    const companyResult = await pool.query<Company>(
      'SELECT name, company_type FROM companies WHERE id = $1',
      [response.company_id]
    );
    if (companyResult.rows.length > 0) {
      authorName = companyResult.rows[0].name;
      companyName = companyResult.rows[0].name;
      companyType = companyResult.rows[0].company_type;
    }
  } else if (response.user_id) {
    const userResult = await pool.query<User>(
      'SELECT name FROM users WHERE id = $1',
      [response.user_id]
    );
    if (userResult.rows.length > 0) {
      authorName = userResult.rows[0].name;
    }
  }

  return {
    id: response.id,
    reviewId: response.review_id,
    authorName,
    authorType,
    companyName,
    companyType,
    responseText: response.response_text,
    createdAt: response.created_at.toISOString(),
    updatedAt: response.updated_at.toISOString(),
  };
}

// Get responses for a review
router.get('/review/:reviewId', async (req: AuthRequest, res: Response) => {
  try {
    const { reviewId } = req.params;

    const result = await pool.query<ReviewResponse>(
      'SELECT * FROM review_responses WHERE review_id = $1 ORDER BY created_at ASC',
      [reviewId]
    );

    const responses = await Promise.all(
      result.rows.map(response => toPublicResponse(response))
    );

    res.json({
      success: true,
      data: responses,
    });
  } catch (error) {
    console.error('Get responses error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch responses',
    });
  }
});

// Create response as regular user (requires auth)
router.post('/user', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { reviewId, responseText } = createResponseSchema.parse(req.body);

    // Check if review exists
    const reviewCheck = await pool.query(
      'SELECT id FROM reviews WHERE id = $1',
      [reviewId]
    );

    if (reviewCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Review not found',
        message: 'The review does not exist',
      });
    }

    // Create response
    const result = await pool.query<ReviewResponse>(
      `INSERT INTO review_responses (review_id, user_id, response_text, is_company_response)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [reviewId, req.userId, responseText, false]
    );

    const newResponse = await toPublicResponse(result.rows[0]);

    res.status(201).json({
      success: true,
      data: newResponse,
      message: 'Response created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.errors[0].message,
      });
    }

    console.error('Create user response error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create response',
    });
  }
});

// Create response as company (requires company auth and verification)
router.post('/company', async (req: AuthRequest, res: Response) => {
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

    if (decoded.type !== 'company') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only verified companies can respond to reviews',
      });
    }

    const { reviewId, responseText } = createResponseSchema.parse(req.body);

    // Verify company is verified
    const companyCheck = await pool.query<Company>(
      'SELECT id, verification_status FROM companies WHERE id = $1',
      [decoded.userId]
    );

    if (companyCheck.rows.length === 0 || companyCheck.rows[0].verification_status !== 'verified') {
      return res.status(403).json({
        success: false,
        error: 'Company not verified',
        message: 'Your company must be verified to respond to reviews',
      });
    }

    // Check if review exists
    const reviewCheck = await pool.query(
      'SELECT id, location, property FROM reviews WHERE id = $1',
      [reviewId]
    );

    if (reviewCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Review not found',
        message: 'The review does not exist',
      });
    }

    // Check if company already responded to this review
    const existingResponse = await pool.query(
      'SELECT id FROM review_responses WHERE review_id = $1 AND company_id = $2',
      [reviewId, decoded.userId]
    );

    if (existingResponse.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Already responded',
        message: 'Your company has already responded to this review',
      });
    }

    // Create response
    const result = await pool.query<ReviewResponse>(
      `INSERT INTO review_responses (review_id, company_id, response_text, is_company_response)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [reviewId, decoded.userId, responseText, true]
    );

    const newResponse = await toPublicResponse(result.rows[0]);

    res.status(201).json({
      success: true,
      data: newResponse,
      message: 'Company response created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.errors[0].message,
      });
    }

    console.error('Create company response error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create response',
    });
  }
});

// Update response (only by author)
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { responseText } = z.object({
      responseText: z.string().min(10).max(2000),
    }).parse(req.body);

    // Check ownership
    const existingResponse = await pool.query<ReviewResponse>(
      'SELECT * FROM review_responses WHERE id = $1',
      [id]
    );

    if (existingResponse.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Response not found',
        message: 'The response does not exist',
      });
    }

    const response = existingResponse.rows[0];

    // Verify ownership
    if (response.user_id !== req.userId && response.company_id !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You can only edit your own responses',
      });
    }

    // Update response
    const result = await pool.query<ReviewResponse>(
      `UPDATE review_responses 
       SET response_text = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [responseText, id]
    );

    const updatedResponse = await toPublicResponse(result.rows[0]);

    res.json({
      success: true,
      data: updatedResponse,
      message: 'Response updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.errors[0].message,
      });
    }

    console.error('Update response error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update response',
    });
  }
});

// Delete response (only by author)
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check ownership
    const existingResponse = await pool.query<ReviewResponse>(
      'SELECT * FROM review_responses WHERE id = $1',
      [id]
    );

    if (existingResponse.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Response not found',
        message: 'The response does not exist',
      });
    }

    const response = existingResponse.rows[0];

    // Verify ownership
    if (response.user_id !== req.userId && response.company_id !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You can only delete your own responses',
      });
    }

    // Delete response
    await pool.query('DELETE FROM review_responses WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Response deleted successfully',
    });
  } catch (error) {
    console.error('Delete response error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete response',
    });
  }
});

export default router;
