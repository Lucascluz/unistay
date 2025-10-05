/**
 * Locations API endpoints
 */

import { apiClient } from './client';
import type { LocationStats } from './types';

export const locationsApi = {
  /**
   * Get all locations with their statistics
   */
  getAllLocations: async (): Promise<LocationStats[]> => {
    return apiClient.get<LocationStats[]>('/locations');
  },

  /**
   * Get statistics for a specific location
   */
  getLocationStats: async (location: string): Promise<LocationStats> => {
    return apiClient.get<LocationStats>(`/locations/${encodeURIComponent(location)}`);
  },
};
