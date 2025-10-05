import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { pool } from '../db/config';
import { Company } from '../types';

const router = Router();

// Simple admin auth middleware (in production, use proper admin authentication)
const adminAuth = (req: Request, res: Response, next: Function) => {
  const adminKey = req.headers['x-admin-key'];
  
  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'Invalid admin credentials',
    });
  }
  
  next();
};

const verifyCompanySchema = z.object({
  companyId: z.string().uuid(),
  status: z.enum(['verified', 'rejected']),
  notes: z.string().optional(),
});

const addRepresentativeSchema = z.object({
  companyId: z.string().uuid(),
  userEmail: z.string().email(),
  role: z.string().min(1).max(100),
  isPrimary: z.boolean().default(false),
});

const updateRepresentativeSchema = z.object({
  representativeId: z.string().uuid(),
  role: z.string().min(1).max(100).optional(),
  isPrimary: z.boolean().optional(),
  verified: z.boolean().optional(),
});

// Get pending companies
router.get('/companies/pending', adminAuth, async (req: Request, res: Response) => {
  try {
    const result = await pool.query<Company>(
      `SELECT id, name, email, company_type, tax_id, website, verification_document_url, created_at
       FROM companies 
       WHERE verification_status = 'pending'
       ORDER BY created_at ASC`
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get pending companies error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch pending companies',
    });
  }
});

// Get all companies
router.get('/companies', adminAuth, async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    
    let query = `SELECT id, name, email, company_type, verification_status, tax_id, website, created_at
                 FROM companies`;
    const params: any[] = [];
    
    if (status) {
      query += ` WHERE verification_status = $1`;
      params.push(status);
    }
    
    query += ` ORDER BY created_at DESC`;
    
    const result = await pool.query<Company>(query, params);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch companies',
    });
  }
});

// Get company details with representatives
router.get('/companies/:id', adminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [companyResult, repsResult, actionsResult] = await Promise.all([
      pool.query<Company>('SELECT * FROM companies WHERE id = $1', [id]),
      pool.query(
        'SELECT * FROM company_representatives WHERE company_id = $1 ORDER BY created_at DESC',
        [id]
      ),
      pool.query(
        `SELECT cva.*, a.name as admin_name, a.email as admin_email
         FROM company_verification_actions cva
         LEFT JOIN admins a ON cva.admin_id = a.id
         WHERE cva.company_id = $1
         ORDER BY cva.created_at DESC`,
        [id]
      ),
    ]);

    if (companyResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Company not found',
        message: 'The company does not exist',
      });
    }

    res.json({
      success: true,
      data: {
        company: companyResult.rows[0],
        representatives: repsResult.rows,
        verificationHistory: actionsResult.rows,
      },
    });
  } catch (error) {
    console.error('Get company details error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch company details',
    });
  }
});

// Verify or reject company
router.post('/companies/verify', adminAuth, async (req: Request, res: Response) => {
  try {
    const { companyId, status, notes } = verifyCompanySchema.parse(req.body);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update company status
      const result = await client.query<Company>(
        `UPDATE companies 
         SET verification_status = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 
         RETURNING id, name, email, company_type, verification_status`,
        [status, companyId]
      );

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          error: 'Company not found',
          message: 'The company does not exist',
        });
      }

      // Log the verification action
      await client.query(
        `INSERT INTO company_verification_actions (company_id, action, notes)
         VALUES ($1, $2, $3)`,
        [companyId, status, notes || null]
      );

      await client.query('COMMIT');

      // In production, send email notification to the company
      // sendVerificationEmail(company.email, status, notes);

      res.json({
        success: true,
        data: result.rows[0],
        message: `Company ${status === 'verified' ? 'verified' : 'rejected'} successfully`,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.errors[0].message,
      });
    }

    console.error('Verify company error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to verify company',
    });
  }
});

// Get all responses (for moderation)
router.get('/responses', adminAuth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const companyOnly = req.query.companyOnly === 'true';

    let query = `
      SELECT 
        rr.*,
        r.location,
        r.property,
        CASE 
          WHEN rr.is_company_response THEN c.name
          ELSE u.name
        END as author_name
      FROM review_responses rr
      LEFT JOIN reviews r ON rr.review_id = r.id
      LEFT JOIN users u ON rr.user_id = u.id
      LEFT JOIN companies c ON rr.company_id = c.id
    `;
    
    if (companyOnly) {
      query += ` WHERE rr.is_company_response = true`;
    }
    
    query += ` ORDER BY rr.created_at DESC LIMIT $1 OFFSET $2`;

    const [responsesResult, countResult] = await Promise.all([
      pool.query(query, [limit, offset]),
      pool.query(
        `SELECT COUNT(*) FROM review_responses${companyOnly ? ' WHERE is_company_response = true' : ''}`
      ),
    ]);

    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        responses: responsesResult.rows,
        total,
        page,
        limit,
        hasMore: total > page * limit,
      },
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

// Delete response (moderation)
router.delete('/responses/:id', adminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM review_responses WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Response not found',
        message: 'The response does not exist',
      });
    }

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

// Get statistics
router.get('/stats', adminAuth, async (req: Request, res: Response) => {
  try {
    const [
      companiesStats,
      responsesStats,
      recentActivity,
    ] = await Promise.all([
      pool.query(`
        SELECT 
          verification_status,
          COUNT(*) as count
        FROM companies
        GROUP BY verification_status
      `),
      pool.query(`
        SELECT 
          is_company_response,
          COUNT(*) as count
        FROM review_responses
        GROUP BY is_company_response
      `),
      pool.query(`
        SELECT 
          'company_registered' as type,
          name as description,
          created_at
        FROM companies
        ORDER BY created_at DESC
        LIMIT 10
      `),
    ]);

    res.json({
      success: true,
      data: {
        companies: companiesStats.rows,
        responses: responsesStats.rows,
        recentActivity: recentActivity.rows,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch statistics',
    });
  }
});

// Get all representatives
router.get('/representatives', adminAuth, async (req: Request, res: Response) => {
  try {
    const companyId = req.query.companyId as string | undefined;
    
    let query = `
      SELECT 
        cr.*,
        c.name as company_name,
        c.email as company_email
      FROM company_representatives cr
      JOIN companies c ON cr.company_id = c.id
    `;
    const params: any[] = [];
    
    if (companyId) {
      query += ` WHERE cr.company_id = $1`;
      params.push(companyId);
    }
    
    query += ` ORDER BY cr.created_at DESC`;
    
    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get representatives error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch representatives',
    });
  }
});

// Add representative to company
router.post('/representatives', adminAuth, async (req: Request, res: Response) => {
  try {
    const { companyId, userEmail, role, isPrimary } = addRepresentativeSchema.parse(req.body);

    // Check if company exists and is verified
    const companyResult = await pool.query(
      'SELECT id, name, verification_status FROM companies WHERE id = $1',
      [companyId]
    );

    if (companyResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Company not found',
        message: 'The company does not exist',
      });
    }

    const company = companyResult.rows[0];

    // Check if representative already exists
    const existingRep = await pool.query(
      'SELECT id FROM company_representatives WHERE company_id = $1 AND user_email = $2',
      [companyId, userEmail]
    );

    if (existingRep.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Representative already exists',
        message: 'This email is already a representative for this company',
      });
    }

    // Generate verification token
    const crypto = require('crypto');
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Insert representative
    const result = await pool.query(
      `INSERT INTO company_representatives (company_id, user_email, role, is_primary, verified, verification_token, verification_sent_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
       RETURNING *`,
      [companyId, userEmail, role, isPrimary, true, verificationToken] // Auto-verified when added by admin
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Representative added successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.errors[0].message,
      });
    }

    console.error('Add representative error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to add representative',
    });
  }
});

// Update representative
router.patch('/representatives/:id', adminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role, isPrimary, verified } = updateRepresentativeSchema.parse(req.body);

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (role !== undefined) {
      updates.push(`role = $${paramCount++}`);
      values.push(role);
    }

    if (isPrimary !== undefined) {
      updates.push(`is_primary = $${paramCount++}`);
      values.push(isPrimary);
    }

    if (verified !== undefined) {
      updates.push(`verified = $${paramCount++}`);
      values.push(verified);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No updates provided',
        message: 'Please provide at least one field to update',
      });
    }

    values.push(id);
    const query = `
      UPDATE company_representatives 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Representative not found',
        message: 'The representative does not exist',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Representative updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.errors[0].message,
      });
    }

    console.error('Update representative error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update representative',
    });
  }
});

// Delete representative
router.delete('/representatives/:id', adminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM company_representatives WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Representative not found',
        message: 'The representative does not exist',
      });
    }

    res.json({
      success: true,
      message: 'Representative deleted successfully',
    });
  } catch (error) {
    console.error('Delete representative error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete representative',
    });
  }
});

// Get all reviews with filters (for moderation)
router.get('/reviews', adminAuth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const location = req.query.location as string | undefined;
    const userId = req.query.userId as string | undefined;
    const minRating = req.query.minRating ? parseInt(req.query.minRating as string) : undefined;
    const maxRating = req.query.maxRating ? parseInt(req.query.maxRating as string) : undefined;

    let query = `
      SELECT 
        r.*,
        u.name as user_name,
        u.email as user_email,
        (SELECT COUNT(*) FROM review_responses WHERE review_id = r.id) as response_count
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (location) {
      query += ` AND r.location ILIKE $${paramCount++}`;
      params.push(`%${location}%`);
    }

    if (userId) {
      query += ` AND r.user_id = $${paramCount++}`;
      params.push(userId);
    }

    if (minRating !== undefined) {
      query += ` AND r.rating >= $${paramCount++}`;
      params.push(minRating);
    }

    if (maxRating !== undefined) {
      query += ` AND r.rating <= $${paramCount++}`;
      params.push(maxRating);
    }

    query += ` ORDER BY r.created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
    params.push(limit, offset);

    const [reviewsResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(
        `SELECT COUNT(*) FROM reviews r WHERE 1=1${
          location ? ` AND r.location ILIKE '%${location}%'` : ''
        }${userId ? ` AND r.user_id = '${userId}'` : ''}${
          minRating !== undefined ? ` AND r.rating >= ${minRating}` : ''
        }${maxRating !== undefined ? ` AND r.rating <= ${maxRating}` : ''}`
      ),
    ]);

    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        reviews: reviewsResult.rows,
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

// Delete review (moderation)
router.delete('/reviews/:id', adminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM reviews WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Review not found',
        message: 'The review does not exist',
      });
    }

    res.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to delete review',
    });
  }
});

// Get review details with responses
router.get('/reviews/:id', adminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [reviewResult, responsesResult] = await Promise.all([
      pool.query(
        `SELECT 
          r.*,
          u.name as user_name,
          u.email as user_email
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.id = $1`,
        [id]
      ),
      pool.query(
        `SELECT 
          rr.*,
          CASE 
            WHEN rr.is_company_response THEN c.name
            ELSE u.name
          END as author_name,
          CASE 
            WHEN rr.is_company_response THEN c.email
            ELSE u.email
          END as author_email
        FROM review_responses rr
        LEFT JOIN users u ON rr.user_id = u.id
        LEFT JOIN companies c ON rr.company_id = c.id
        WHERE rr.review_id = $1
        ORDER BY rr.created_at ASC`,
        [id]
      ),
    ]);

    if (reviewResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Review not found',
        message: 'The review does not exist',
      });
    }

    res.json({
      success: true,
      data: {
        review: reviewResult.rows[0],
        responses: responsesResult.rows,
      },
    });
  } catch (error) {
    console.error('Get review details error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch review details',
    });
  }
});

export default router;
