import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import crypto from 'crypto';
import { pool } from '../db/config';
import { generateToken } from '../utils/jwt';
import { Company, CompanyPublic, CompanyRepresentative } from '../types';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Validation schemas
const registerCompanySchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().max(255),
  password: z.string().min(8).max(100),
  companyType: z.enum(['landlord', 'housing_platform', 'university']),
  taxId: z.string().optional(),
  website: z.string().url().optional(),
  verificationDocumentUrl: z.string().url().optional(),
});

const loginCompanySchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const addRepresentativeSchema = z.object({
  userEmail: z.string().email(),
  role: z.string().min(1).max(100),
  isPrimary: z.boolean().default(false),
});

const verifyRepresentativeSchema = z.object({
  token: z.string(),
});

// Helper to convert DB company to public format
function toPublicCompany(company: Company): CompanyPublic {
  return {
    id: company.id,
    name: company.name,
    email: company.email,
    companyType: company.company_type,
    verificationStatus: company.verification_status,
    website: company.website,
    createdAt: company.created_at.toISOString(),
  };
}

// Register company
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, companyType, taxId, website, verificationDocumentUrl } = 
      registerCompanySchema.parse(req.body);

    // Check if company exists
    const existingCompany = await pool.query(
      'SELECT id FROM companies WHERE email = $1',
      [email]
    );

    if (existingCompany.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Company already exists',
        message: 'A company with this email already exists',
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create company
    const result = await pool.query<Company>(
      `INSERT INTO companies (name, email, password_hash, company_type, tax_id, website, verification_document_url, verification_token, verification_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [name, email, passwordHash, companyType, taxId, website, verificationDocumentUrl, verificationToken, 'pending']
    );

    const company = result.rows[0];

    res.status(201).json({
      success: true,
      data: {
        company: toPublicCompany(company),
        message: 'Company registered successfully. Verification is pending.',
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

    console.error('Register company error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to register company',
    });
  }
});

// Login company
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = loginCompanySchema.parse(req.body);

    // Find company
    const result = await pool.query<Company>(
      'SELECT * FROM companies WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Invalid email or password',
      });
    }

    const company = result.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, company.password_hash);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Invalid email or password',
      });
    }

    // Check verification status
    if (company.verification_status !== 'verified') {
      return res.status(403).json({
        success: false,
        error: 'Company not verified',
        message: `Company verification is ${company.verification_status}. Please wait for admin approval.`,
      });
    }

    const token = generateToken(company.id, 'company');

    res.json({
      success: true,
      data: {
        token,
        company: toPublicCompany(company),
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

    console.error('Login company error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to login',
    });
  }
});

// Get current company (requires auth)
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

    if (decoded.type !== 'company') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Invalid token type',
      });
    }

    // Get company from database
    const result = await pool.query<Company>(
      'SELECT * FROM companies WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Company not found',
        message: 'Company does not exist',
      });
    }

    const company = result.rows[0];

    // Get representatives
    const repsResult = await pool.query<CompanyRepresentative>(
      'SELECT * FROM company_representatives WHERE company_id = $1',
      [company.id]
    );

    res.json({
      success: true,
      data: {
        company: toPublicCompany(company),
        representatives: repsResult.rows,
      },
    });
  } catch (error) {
    console.error('Get current company error:', error);
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
});

// Add company representative (requires company auth)
router.post('/representatives', async (req: Request, res: Response) => {
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
        message: 'Only companies can add representatives',
      });
    }

    const { userEmail, role, isPrimary } = addRepresentativeSchema.parse(req.body);

    // Check if representative already exists
    const existing = await pool.query(
      'SELECT id FROM company_representatives WHERE company_id = $1 AND user_email = $2',
      [decoded.userId, userEmail]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Representative already exists',
        message: 'This email is already registered as a representative',
      });
    }

    // Create representative (automatically verified)
    const result = await pool.query<CompanyRepresentative>(
      `INSERT INTO company_representatives (company_id, user_email, role, is_primary, verified)
       VALUES ($1, $2, $3, $4, true)
       RETURNING *`,
      [decoded.userId, userEmail, role, isPrimary]
    );

    res.status(201).json({
      success: true,
      data: {
        representative: result.rows[0],
        message: 'Representative added successfully.',
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

    console.error('Add representative error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to add representative',
    });
  }
});

// Verify representative
router.post('/representatives/verify', async (req: Request, res: Response) => {
  try {
    const { token } = verifyRepresentativeSchema.parse(req.body);

    const result = await pool.query<CompanyRepresentative>(
      'UPDATE company_representatives SET verified = true WHERE verification_token = $1 RETURNING *',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid token',
        message: 'Verification token is invalid or expired',
      });
    }

    res.json({
      success: true,
      message: 'Representative verified successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.errors[0].message,
      });
    }

    console.error('Verify representative error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to verify representative',
    });
  }
});

// Check if user is verified representative of a company
router.get('/representatives/check/:email', async (req: Request, res: Response) => {
  try {
    const { email } = req.params;

    const result = await pool.query(
      `SELECT cr.*, c.name as company_name, c.company_type, c.verification_status
       FROM company_representatives cr
       JOIN companies c ON cr.company_id = c.id
       WHERE cr.user_email = $1 AND cr.verified = true AND c.verification_status = 'verified'`,
      [email]
    );

    res.json({
      success: true,
      data: {
        isRepresentative: result.rows.length > 0,
        companies: result.rows,
      },
    });
  } catch (error) {
    console.error('Check representative error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to check representative status',
    });
  }
});

// Delete representative (requires company auth)
router.delete('/representatives/:id', async (req: Request, res: Response) => {
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
        message: 'Only companies can delete representatives',
      });
    }

    const { id } = req.params;

    // Check if representative belongs to this company
    const checkResult = await pool.query(
      'SELECT id, is_primary FROM company_representatives WHERE id = $1 AND company_id = $2',
      [id, decoded.userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Representative not found',
        message: 'Representative not found or does not belong to this company',
      });
    }

    const representative = checkResult.rows[0];

    if (representative.is_primary) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete primary representative',
        message: 'Primary representatives cannot be deleted',
      });
    }

    // Delete representative
    await pool.query(
      'DELETE FROM company_representatives WHERE id = $1',
      [id]
    );

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

// Get reviews for company's locations (requires company auth)
router.get('/reviews', async (req: Request, res: Response) => {
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
        message: 'Only companies can view their reviews',
      });
    }

    // For now, return empty array since we don't have locations table yet
    // This feature will be implemented once we have a proper locations system
    res.json({
      success: true,
      data: {
        reviews: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      },
    });
  } catch (error) {
    console.error('Get company reviews error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get reviews',
    });
  }
});

export default router;
