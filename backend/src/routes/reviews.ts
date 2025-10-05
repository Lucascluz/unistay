import { Router, Response } from 'express';
import { z } from 'zod';
import { pool } from '../db/config';
import { authMiddleware, optionalAuth, AuthRequest } from '../middleware/auth';
import { Review, ReviewPublic, ReviewResponse, ReviewResponsePublic, User, Company } from '../types';

const router = Router();

// Validation schema
const createReviewSchema = z.object({
  location: z.string().min(1).max(255),
  property: z.string().min(1).max(255),
  rating: z.number().int().min(1).max(5),
  review: z.string().min(10).max(5000),
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

// Helper to convert DB review to public format
async function toPublicReview(review: Review, includeResponses: boolean = false): Promise<ReviewPublic> {
  const userResult = await pool.query(
    'SELECT name, trust_score FROM users WHERE id = $1',
    [review.user_id]
  );
  
  const publicReview: ReviewPublic = {
    id: review.id,
    userId: review.user_id,
    author: userResult.rows[0]?.name || 'Unknown',
    authorTrustScore: userResult.rows[0]?.trust_score,
    location: review.location,
    property: review.property,
    rating: review.rating,
    review: review.review,
    helpful: review.helpful,
    createdAt: review.created_at.toISOString(),
    updatedAt: review.updated_at.toISOString(),
  };

  if (includeResponses) {
    const responsesResult = await pool.query<ReviewResponse>(
      'SELECT * FROM review_responses WHERE review_id = $1 ORDER BY created_at ASC',
      [review.id]
    );
    
    publicReview.responses = await Promise.all(
      responsesResult.rows.map(response => toPublicResponse(response))
    );
  }

  return publicReview;
}

// Get reviews with filters
router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const location = req.query.location as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortBy = (req.query.sortBy as string) || 'recent';
    const includeResponses = (req.query.includeResponses as string) === 'true';
    const offset = (page - 1) * limit;

    let orderBy = 'created_at DESC';
    if (sortBy === 'rating') {
      orderBy = 'rating DESC, created_at DESC';
    } else if (sortBy === 'helpful') {
      orderBy = 'helpful DESC, created_at DESC';
    }

    let query = `SELECT * FROM reviews`;
    let countQuery = `SELECT COUNT(*) FROM reviews`;
    const params: any[] = [];
    
    if (location) {
      query += ` WHERE location = $1`;
      countQuery += ` WHERE location = $1`;
      params.push(location);
    }

    query += ` ORDER BY ${orderBy} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const [reviewsResult, countResult] = await Promise.all([
      pool.query<Review>(query, params),
      pool.query(countQuery, location ? [location] : []),
    ]);

    const total = parseInt(countResult.rows[0].count);
    const reviews = await Promise.all(
      reviewsResult.rows.map(review => toPublicReview(review, includeResponses))
    );

    res.json({
      success: true,
      data: {
        reviews,
        total,
        page,
        limit,
        hasMore: total > page * limit,
      },
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch reviews',
    });
  }
});

// Create review (requires auth)
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { location, property, rating, review } = createReviewSchema.parse(req.body);

    const result = await pool.query<Review>(
      `INSERT INTO reviews (user_id, location, property, rating, review)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.userId, location, property, rating, review]
    );

    const newReview = await toPublicReview(result.rows[0]);

    res.status(201).json({
      success: true,
      data: newReview,
      message: 'Review created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.errors[0].message,
      });
    }

    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create review',
    });
  }
});

// Mark review as helpful
router.post('/:id/helpful', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await pool.query(
      'UPDATE reviews SET helpful = helpful + 1 WHERE id = $1',
      [id]
    );

    res.json({
      success: true,
      message: 'Review marked as helpful',
    });
  } catch (error) {
    console.error('Mark helpful error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update review',
    });
  }
});

export default router;
