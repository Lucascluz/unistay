import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { pool } from '../db/config';
import type { 
  CompanyAlias, 
  CompanyAliasSuggestion,
  AliasType 
} from '../types/aliases';

const router = Router();

// Simple admin auth middleware (same as admin.ts)
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

// Validation schemas
const createAliasSchema = z.object({
  alias_name: z.string().min(1).max(255),
  company_id: z.string().uuid().optional(),
  alias_type: z.enum([
    'common_name',
    'abbreviation',
    'misspelling',
    'translation',
    'former_name',
    'local_name'
  ]).optional(),
  priority: z.number().int().min(0).max(1000).optional(),
});

const updateAliasSchema = z.object({
  alias_name: z.string().min(1).max(255).optional(),
  company_id: z.string().uuid().nullable().optional(),
  alias_type: z.enum([
    'common_name',
    'abbreviation',
    'misspelling',
    'translation',
    'former_name',
    'local_name'
  ]).optional(),
  priority: z.number().int().min(0).max(1000).optional(),
  is_active: z.boolean().optional(),
});

const linkAliasSchema = z.object({
  company_id: z.string().uuid(),
});

const reviewSuggestionSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  admin_notes: z.string().optional(),
  create_alias: z.boolean().optional(), // If approved, create the alias
  company_id: z.string().uuid().optional(), // Link to this company
});

// ============================================================================
// ADMIN ENDPOINTS - Alias Management
// ============================================================================

/**
 * GET /api/admin/aliases
 * List all aliases with optional filtering
 */
router.get('/aliases', adminAuth, async (req: Request, res: Response) => {
  try {
    const { 
      company_id, 
      unlinked, 
      alias_type, 
      search,
      page = '1',
      limit = '50'
    } = req.query;

    let query = `
      SELECT 
        ca.*,
        c.name as company_name,
        a.name as created_by_name
      FROM company_aliases ca
      LEFT JOIN companies c ON ca.company_id = c.id
      LEFT JOIN admins a ON ca.created_by = a.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (company_id) {
      query += ` AND ca.company_id = $${paramCount}`;
      params.push(company_id);
      paramCount++;
    }

    if (unlinked === 'true') {
      query += ` AND ca.company_id IS NULL`;
    }

    if (alias_type) {
      query += ` AND ca.alias_type = $${paramCount}`;
      params.push(alias_type);
      paramCount++;
    }

    if (search) {
      query += ` AND ca.alias_name_normalized LIKE $${paramCount}`;
      params.push(`%${String(search).toLowerCase()}%`);
      paramCount++;
    }

    query += ` ORDER BY ca.priority DESC, ca.usage_count DESC, ca.created_at DESC`;
    
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit as string), offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) 
      FROM company_aliases ca
      WHERE 1=1
    `;
    const countParams: any[] = [];
    let countParamCount = 1;

    if (company_id) {
      countQuery += ` AND ca.company_id = $${countParamCount}`;
      countParams.push(company_id);
      countParamCount++;
    }

    if (unlinked === 'true') {
      countQuery += ` AND ca.company_id IS NULL`;
    }

    if (alias_type) {
      countQuery += ` AND ca.alias_type = $${countParamCount}`;
      countParams.push(alias_type);
      countParamCount++;
    }

    if (search) {
      countQuery += ` AND ca.alias_name_normalized LIKE $${countParamCount}`;
      countParams.push(`%${String(search).toLowerCase()}%`);
    }

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      success: true,
      data: {
        aliases: result.rows,
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      },
    });
  } catch (error) {
    console.error('Get aliases error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get aliases',
    });
  }
});

/**
 * POST /api/admin/aliases
 * Create a new alias (can be unlinked for pre-registration)
 */
router.post('/aliases', adminAuth, async (req: Request, res: Response) => {
  try {
    const data = createAliasSchema.parse(req.body);

    // Check if alias already exists
    const existingAlias = await pool.query(
      'SELECT id, company_id FROM company_aliases WHERE alias_name_normalized = LOWER(TRIM($1)) AND is_active = true',
      [data.alias_name]
    );

    if (existingAlias.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Alias already exists',
        message: 'An active alias with this name already exists',
        existing_alias_id: existingAlias.rows[0].id,
        linked_company_id: existingAlias.rows[0].company_id,
      });
    }

    // If company_id provided, verify it exists
    if (data.company_id) {
      const companyCheck = await pool.query(
        'SELECT id FROM companies WHERE id = $1',
        [data.company_id]
      );

      if (companyCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Company not found',
        });
      }
    }

    const result = await pool.query<CompanyAlias>(
      `INSERT INTO company_aliases (
        alias_name,
        alias_name_normalized,
        company_id,
        alias_type,
        priority,
        created_by
      ) VALUES ($1, LOWER(TRIM($2)), $3, $4, $5, NULL)
      RETURNING *`,
      [
        data.alias_name,
        data.alias_name,
        data.company_id || null,
        data.alias_type || 'common_name',
        data.priority || 50,
      ]
    );

    res.status(201).json({
      success: true,
      data: {
        alias: result.rows[0],
        message: data.company_id 
          ? 'Alias created and linked to company'
          : 'Alias created (unlinked - can be linked to company later)',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Create alias error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create alias',
    });
  }
});

/**
 * PUT /api/admin/aliases/:id
 * Update an alias
 */
router.put('/aliases/:id', adminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateAliasSchema.parse(req.body);

    // Check if alias exists
    const existingAlias = await pool.query(
      'SELECT * FROM company_aliases WHERE id = $1',
      [id]
    );

    if (existingAlias.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Alias not found',
      });
    }

    // If updating company_id, verify it exists
    if (data.company_id) {
      const companyCheck = await pool.query(
        'SELECT id FROM companies WHERE id = $1',
        [data.company_id]
      );

      if (companyCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Company not found',
        });
      }
    }

    // Build update query
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.alias_name !== undefined) {
      fields.push(`alias_name = $${paramCount}`);
      values.push(data.alias_name);
      paramCount++;
    }

    if (data.company_id !== undefined) {
      fields.push(`company_id = $${paramCount}`);
      values.push(data.company_id);
      paramCount++;
    }

    if (data.alias_type !== undefined) {
      fields.push(`alias_type = $${paramCount}`);
      values.push(data.alias_type);
      paramCount++;
    }

    if (data.priority !== undefined) {
      fields.push(`priority = $${paramCount}`);
      values.push(data.priority);
      paramCount++;
    }

    if (data.is_active !== undefined) {
      fields.push(`is_active = $${paramCount}`);
      values.push(data.is_active);
      paramCount++;
    }

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update',
      });
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await pool.query<CompanyAlias>(
      `UPDATE company_aliases SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    res.json({
      success: true,
      data: {
        alias: result.rows[0],
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Update alias error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update alias',
    });
  }
});

/**
 * POST /api/admin/aliases/:id/link
 * Link an unlinked alias to a company
 */
router.post('/aliases/:id/link', adminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = linkAliasSchema.parse(req.body);

    // Check if alias exists and is unlinked
    const aliasCheck = await pool.query(
      'SELECT * FROM company_aliases WHERE id = $1',
      [id]
    );

    if (aliasCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Alias not found',
      });
    }

    // Verify company exists
    const companyCheck = await pool.query(
      'SELECT id, name FROM companies WHERE id = $1',
      [data.company_id]
    );

    if (companyCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Company not found',
      });
    }

    // Link the alias
    const result = await pool.query<CompanyAlias>(
      `UPDATE company_aliases 
       SET company_id = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [data.company_id, id]
    );

    res.json({
      success: true,
      data: {
        alias: result.rows[0],
        company: companyCheck.rows[0],
        message: `Alias linked to ${companyCheck.rows[0].name}`,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Link alias error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to link alias',
    });
  }
});

/**
 * DELETE /api/admin/aliases/:id
 * Delete or deactivate an alias
 */
router.delete('/aliases/:id', adminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;

    if (permanent === 'true') {
      // Permanent delete
      await pool.query('DELETE FROM company_aliases WHERE id = $1', [id]);
    } else {
      // Soft delete (deactivate)
      await pool.query(
        'UPDATE company_aliases SET is_active = false, updated_at = NOW() WHERE id = $1',
        [id]
      );
    }

    res.json({
      success: true,
      data: {
        message: permanent === 'true' ? 'Alias permanently deleted' : 'Alias deactivated',
      },
    });
  } catch (error) {
    console.error('Delete alias error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete alias',
    });
  }
});

// ============================================================================
// ALIAS SUGGESTIONS - User-submitted names to be reviewed
// ============================================================================

/**
 * GET /api/admin/alias-suggestions
 * Get pending alias suggestions from users
 */
router.get('/alias-suggestions', adminAuth, async (req: Request, res: Response) => {
  try {
    const { status = 'pending', page = '1', limit = '50' } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const result = await pool.query<CompanyAliasSuggestion>(
      `SELECT 
        cas.*,
        u.name as suggested_by_name,
        c.name as potential_company_name,
        a.name as reviewed_by_name
       FROM company_alias_suggestions cas
       LEFT JOIN users u ON cas.suggested_by_user_id = u.id
       LEFT JOIN companies c ON cas.potential_company_id = c.id
       LEFT JOIN admins a ON cas.reviewed_by = a.id
       WHERE cas.status = $1
       ORDER BY cas.created_at DESC
       LIMIT $2 OFFSET $3`,
      [status, parseInt(limit as string), offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM company_alias_suggestions WHERE status = $1',
      [status]
    );

    res.json({
      success: true,
      data: {
        suggestions: result.rows,
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      },
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get suggestions',
    });
  }
});

/**
 * POST /api/admin/alias-suggestions/:id/review
 * Review a suggestion (approve/reject)
 */
router.post('/alias-suggestions/:id/review', adminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = reviewSuggestionSchema.parse(req.body);

    // Get the suggestion
    const suggestionResult = await pool.query<CompanyAliasSuggestion>(
      'SELECT * FROM company_alias_suggestions WHERE id = $1',
      [id]
    );

    if (suggestionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Suggestion not found',
      });
    }

    const suggestion = suggestionResult.rows[0];

    // Update suggestion status
    await pool.query(
      `UPDATE company_alias_suggestions 
       SET status = $1, reviewed_by = NULL, reviewed_at = NOW(), admin_notes = $2
       WHERE id = $3`,
      [data.status, data.admin_notes || null, id]
    );

    // If approved and create_alias is true, create the alias
    if (data.status === 'approved' && data.create_alias) {
      const companyId = data.company_id || suggestion.potential_company_id;

      if (!companyId) {
        return res.status(400).json({
          success: false,
          error: 'Company ID required to create alias',
        });
      }

      await pool.query(
        `INSERT INTO company_aliases (
          alias_name,
          alias_name_normalized,
          company_id,
          alias_type,
          priority,
          created_by
        ) VALUES ($1, LOWER(TRIM($2)), $3, 'common_name', 50, NULL)
        ON CONFLICT (alias_name_normalized) WHERE is_active = true DO NOTHING`,
        [suggestion.suggested_name, suggestion.suggested_name, companyId]
      );
    }

    res.json({
      success: true,
      data: {
        message: `Suggestion ${data.status}`,
        alias_created: data.status === 'approved' && data.create_alias,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    console.error('Review suggestion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to review suggestion',
    });
  }
});

export default router;
