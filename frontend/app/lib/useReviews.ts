/**
 * Custom React hooks for working with reviews
 */

import { useState, useEffect } from 'react';
import { reviewsApi, type Review, type GetReviewsParams, type CreateReviewRequest } from './api';

/**
 * Hook for fetching and managing reviews for a location
 */
export function useReviews(location: string, initialParams?: Omit<GetReviewsParams, 'location'>) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchReviews = async (currentPage: number = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await reviewsApi.getReviews({
        location,
        page: currentPage,
        limit: initialParams?.limit || 10,
        sortBy: initialParams?.sortBy || 'recent',
        includeResponses: true, // Always include responses
      });

      if (currentPage === 1) {
        setReviews(response.reviews);
      } else {
        setReviews(prev => [...prev, ...response.reviews]);
      }

      setHasMore(response.hasMore);
      setTotal(response.total);
      setPage(currentPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (location) {
      fetchReviews(1);
    }
  }, [location]);

  const loadMore = () => {
    if (!isLoading && hasMore) {
      fetchReviews(page + 1);
    }
  };

  const refresh = () => {
    fetchReviews(1);
  };

  return {
    reviews,
    isLoading,
    error,
    hasMore,
    total,
    loadMore,
    refresh,
  };
}

/**
 * Hook for creating a new review
 */
export function useCreateReview() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createReview = async (data: CreateReviewRequest): Promise<Review | null> => {
    setIsSubmitting(true);
    setError(null);

    try {
      const review = await reviewsApi.createReview(data);
      return review;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create review';
      setError(errorMessage);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    createReview,
    isSubmitting,
    error,
  };
}

/**
 * Hook for marking reviews as helpful
 */
export function useMarkHelpful() {
  const [loading, setLoading] = useState<string | null>(null);

  const markHelpful = async (reviewId: string): Promise<number | null> => {
    setLoading(reviewId);

    try {
      const result = await reviewsApi.markHelpful(reviewId);
      return result.helpful;
    } catch (err) {
      console.error('Failed to mark review as helpful:', err);
      return null;
    } finally {
      setLoading(null);
    }
  };

  return {
    markHelpful,
    loading,
  };
}
