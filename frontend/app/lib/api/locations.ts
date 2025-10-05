/**
 * Locations API endpoints
 */

import { apiClient } from './client';
import type { LocationStats } from './types';

export const locationsApi = {
  /**
   * Get statistics for a specific location
   */
  getLocationStats: async (location: string): Promise<LocationStats> => {
    return apiClient.get<LocationStats>(`/locations/${encodeURIComponent(location)}/stats`);
  },

  /**
   * Get list of popular locations
   */
  getPopularLocations: async (limit: number = 10): Promise<string[]> => {
    return apiClient.get<string[]>(`/locations/popular?limit=${limit}`);
  },

  /**
   * Search for locations by query
   */
  searchLocations: async (query: string): Promise<string[]> => {
    return apiClient.get<string[]>(`/locations/search?q=${encodeURIComponent(query)}`);
  },

  /**
   * Get all unique locations with reviews
   */
  getAllLocations: async (): Promise<string[]> => {
    return apiClient.get<string[]>('/locations');
  },
};
