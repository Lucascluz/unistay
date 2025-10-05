/**
 * Custom React hooks for working with locations
 */

import { useState, useEffect } from 'react';
import { locationsApi, type LocationStats } from './api';

/**
 * Hook for fetching location statistics
 */
export function useLocationStats(location: string) {
  const [stats, setStats] = useState<LocationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!location) {
      setIsLoading(false);
      return;
    }

    const fetchStats = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await locationsApi.getLocationStats(location);
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch location stats');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [location]);

  return {
    stats,
    isLoading,
    error,
  };
}

/**
 * Hook for searching locations
 */
export function useLocationSearch() {
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const search = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const locations = await locationsApi.searchLocations(query);
      setResults(locations);
    } catch (err) {
      console.error('Location search failed:', err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    results,
    isLoading,
    search,
  };
}

/**
 * Hook for fetching popular locations
 */
export function usePopularLocations(limit: number = 10) {
  const [locations, setLocations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPopular = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await locationsApi.getPopularLocations(limit);
        setLocations(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch popular locations');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPopular();
  }, [limit]);

  return {
    locations,
    isLoading,
    error,
  };
}
