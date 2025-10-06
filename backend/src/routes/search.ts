import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { pool } from '../db/config';
import { optionalAuth } from '../middleware/auth';
import type { CompanySearchResult } from '../types/aliases';

const router = Router();

/**
 * GET /api/search/companies
 * Search for companies using aliases (public endpoint)
 */
router.get('/companies', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { q, limit = '10' } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Search query required',
      });
    }

    const searchTerm = q.trim();

    if (searchTerm.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters',
      });
    }

    // Use the database function for efficient search
    const result = await pool.query<CompanySearchResult>(
      `SELECT * FROM search_companies_by_alias($1) LIMIT $2`,
      [searchTerm, parseInt(limit as string)]
    );

    // Get full company details for matches
    if (result.rows.length > 0) {
      const companyIds = result.rows.map(r => r.company_id);
      const companies = await pool.query(
        `SELECT 
          id, name, company_type, verification_status,
          average_rating, number_of_reviews, response_rate
         FROM companies 
         WHERE id = ANY($1)`,
        [companyIds]
      );

      // Merge search results with company details
      const enrichedResults = result.rows.map(searchResult => {
        const company = companies.rows.find(c => c.id === searchResult.company_id);
        return {
          ...searchResult,
          company: company || null,
        };
      });

      res.json({
        success: true,
        data: {
          results: enrichedResults,
          query: searchTerm,
          count: enrichedResults.length,
        },
      });
    } else {
      // No results - suggest creating an alias suggestion
      res.json({
        success: true,
        data: {
          results: [],
          query: searchTerm,
          count: 0,
          suggestion: {
            message: 'No matching companies found. You can suggest this name to our team.',
            can_suggest: true,
          },
        },
      });
    }
  } catch (error) {
    console.error('Search companies error:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed',
    });
  }
});

/**
 * GET /api/search/companies/:id/aliases
 * Get all aliases for a specific company
 */
router.get('/companies/:id/aliases', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        id, alias_name, alias_type, priority, usage_count
       FROM company_aliases
       WHERE company_id = $1 AND is_active = true
       ORDER BY priority DESC, usage_count DESC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        aliases: result.rows,
        company_id: id,
      },
    });
  } catch (error) {
    console.error('Get company aliases error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get aliases',
    });
  }
});

/**
 * POST /api/search/suggest-alias
 * User suggests a new company name/alias
 */
router.post('/suggest-alias', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { suggested_name, context, potential_company_id } = req.body;

    if (!suggested_name || typeof suggested_name !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Suggested name required',
      });
    }

    const userId = (req as any).userId || null;

    // Check if this name already exists as an alias
    const existingAlias = await pool.query(
      'SELECT id, company_id FROM company_aliases WHERE alias_name_normalized = LOWER(TRIM($1)) AND is_active = true',
      [suggested_name]
    );

    if (existingAlias.rows.length > 0) {
      return res.json({
        success: true,
        data: {
          message: 'This name already exists',
          existing_alias: existingAlias.rows[0],
          should_use_existing: true,
        },
      });
    }

    // Create suggestion
    const result = await pool.query(
      `INSERT INTO company_alias_suggestions (
        suggested_name,
        suggested_name_normalized,
        suggested_by_user_id,
        context,
        potential_company_id,
        status
      ) VALUES ($1, LOWER(TRIM($1)), $2, $3, $4, 'pending')
      RETURNING *`,
      [suggested_name, userId, context || null, potential_company_id || null]
    );

    res.status(201).json({
      success: true,
      data: {
        suggestion: result.rows[0],
        message: 'Thank you! Your suggestion will be reviewed by our team.',
      },
    });
  } catch (error) {
    console.error('Create suggestion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create suggestion',
    });
  }
});

/**
 * GET /api/search/resolve-location
 * Resolve a location name to its canonical form (checking aliases)
 * Returns the canonical company name if the location is an alias
 */
router.get('/resolve-location', async (req: Request, res: Response) => {
  try {
    const { location } = req.query;

    if (!location || typeof location !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Location parameter required',
      });
    }

    const locationName = location.trim();

    // First, check if this location name exactly matches a company name
    const directMatch = await pool.query(
      `SELECT id, name FROM companies WHERE LOWER(name) = LOWER($1) AND verification_status = 'verified'`,
      [locationName]
    );

    if (directMatch.rows.length > 0) {
      // Direct match - no redirect needed
      return res.json({
        success: true,
        data: {
          is_alias: false,
          canonical_name: directMatch.rows[0].name,
          company_id: directMatch.rows[0].id,
          should_redirect: false,
        },
      });
    }

    // Check if it's an alias
    const aliasMatch = await pool.query(
      `SELECT 
        ca.id as alias_id,
        ca.alias_name,
        ca.alias_type,
        c.id as company_id,
        c.name as company_name
       FROM company_aliases ca
       JOIN companies c ON ca.company_id = c.id
       WHERE ca.alias_name_normalized = LOWER(TRIM($1)) 
         AND ca.is_active = true
         AND c.verification_status = 'verified'
       ORDER BY ca.priority DESC, ca.usage_count DESC
       LIMIT 1`,
      [locationName]
    );

    if (aliasMatch.rows.length > 0) {
      const alias = aliasMatch.rows[0];
      
      // Track alias usage
      await pool.query(
        `UPDATE company_aliases 
         SET usage_count = usage_count + 1, last_used_at = NOW()
         WHERE id = $1`,
        [alias.alias_id]
      );

      return res.json({
        success: true,
        data: {
          is_alias: true,
          matched_alias: alias.alias_name,
          alias_type: alias.alias_type,
          canonical_name: alias.company_name,
          company_id: alias.company_id,
          should_redirect: true,
        },
      });
    }

    // No match found
    res.json({
      success: true,
      data: {
        is_alias: false,
        canonical_name: locationName,
        should_redirect: false,
        not_found: true,
      },
    });
  } catch (error) {
    console.error('Resolve location error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve location',
    });
  }
});

/**
 * POST /api/search/track-alias-usage
 * Track when an alias is used (for analytics)
 */
router.post('/track-alias-usage', async (req: Request, res: Response) => {
  try {
    const { alias_id } = req.body;

    if (!alias_id) {
      return res.status(400).json({
        success: false,
        error: 'Alias ID required',
      });
    }

    await pool.query(
      `UPDATE company_aliases 
       SET usage_count = usage_count + 1, last_used_at = NOW()
       WHERE id = $1`,
      [alias_id]
    );

    res.json({
      success: true,
      data: { message: 'Usage tracked' },
    });
  } catch (error) {
    console.error('Track usage error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track usage',
    });
  }
});

export default router;
