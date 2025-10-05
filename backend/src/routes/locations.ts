import { Router, Request, Response } from 'express';
import { pool } from '../db/config';

const router = Router();

interface LocationStatsRow {
  location: string;
  avg_rating: string;
  total_reviews: string;
  total_properties: string;
}

// Get location statistics
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query<LocationStatsRow>(`
      SELECT 
        location,
        ROUND(AVG(rating)::numeric, 1) as avg_rating,
        COUNT(*)::int as total_reviews,
        COUNT(DISTINCT property)::int as total_properties
      FROM reviews
      GROUP BY location
      ORDER BY total_reviews DESC
    `);

    const locations = result.rows.map(row => ({
      location: row.location,
      averageRating: parseFloat(row.avg_rating),
      totalReviews: parseInt(row.total_reviews),
      recommendationRate: parseFloat(row.avg_rating) / 5 * 100, // Simple calculation
      totalProperties: parseInt(row.total_properties),
    }));

    res.json({
      success: true,
      data: locations,
    });
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch locations',
    });
  }
});

// Get single location stats
router.get('/:location', async (req: Request, res: Response) => {
  try {
    const { location } = req.params;

    const result = await pool.query<LocationStatsRow>(`
      SELECT 
        location,
        ROUND(AVG(rating)::numeric, 1) as avg_rating,
        COUNT(*)::int as total_reviews,
        COUNT(DISTINCT property)::int as total_properties
      FROM reviews
      WHERE location = $1
      GROUP BY location
    `, [location]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Location not found',
      });
    }

    const row = result.rows[0];
    const stats = {
      location: row.location,
      averageRating: parseFloat(row.avg_rating),
      totalReviews: parseInt(row.total_reviews),
      recommendationRate: parseFloat(row.avg_rating) / 5 * 100,
      totalProperties: parseInt(row.total_properties),
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get location error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch location',
    });
  }
});

export default router;
