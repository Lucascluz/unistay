/**
 * Example: How to integrate the API adapters into the reviews page
 * 
 * This file demonstrates how to replace mock data with real API calls
 * using the custom hooks provided.
 */

import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { useAuth } from "~/lib/auth";
import { useReviews, useCreateReview, useMarkHelpful } from "~/lib/useReviews";
import { useLocationStats } from "~/lib/useLocations";

export default function ReviewsPageWithAPI() {
  const { location } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  const decodedLocation = decodeURIComponent(location || "");

  // Fetch reviews using the custom hook
  const { reviews, isLoading: reviewsLoading, hasMore, loadMore, refresh } = 
    useReviews(decodedLocation, { limit: 10, sortBy: 'recent' });

  // Fetch location stats using the custom hook
  const { stats, isLoading: statsLoading } = useLocationStats(decodedLocation);

  // Hook for creating reviews
  const { createReview, isSubmitting } = useCreateReview();

  // Hook for marking reviews as helpful
  const { markHelpful, loading: helpfulLoading } = useMarkHelpful();

  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewData, setReviewData] = useState({
    property: "",
    rating: 5,
    review: "",
  });

  const handleWriteReview = () => {
    if (!isLoggedIn) {
      navigate(`/login?redirect=/reviews/${encodeURIComponent(decodedLocation)}`);
    } else {
      setIsReviewDialogOpen(true);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createReview({
        location: decodedLocation,
        property: reviewData.property,
        rating: reviewData.rating,
        review: reviewData.review,
      });
      
      setIsReviewDialogOpen(false);
      setReviewData({ property: "", rating: 5, review: "" });
      
      // Refresh the reviews list
      refresh();
    } catch (error) {
      console.error('Failed to submit review:', error);
      // Error is already handled by the hook
    }
  };

  const handleMarkHelpful = async (reviewId: string) => {
    if (!isLoggedIn) {
      navigate(`/login?redirect=/reviews/${encodeURIComponent(decodedLocation)}`);
      return;
    }
    
    await markHelpful(reviewId);
    // Optionally refresh to get updated counts
    refresh();
  };

  // Show loading state
  if (reviewsLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header - same as original */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center gap-6 cursor-pointer"
              onClick={() => navigate("/")}
            >
              <img 
                src="/study-stay-logo.png" 
                alt="StudentStay Logo" 
                className="h-40 w-40 object-contain"
              />
              <span className="text-6xl font-bold text-gray-900 dark:text-white">StudentStay</span>
            </div>
            <div className="flex items-center gap-3">
              {isLoggedIn && (
                <span className="text-sm text-gray-700 dark:text-gray-300 hidden sm:block">
                  Hi, {user?.name}
                </span>
              )}
              <Button variant="outline" onClick={() => navigate("/")}>
                Back to Search
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Location Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Student Housing in {decodedLocation}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Read {stats?.totalReviews || 0} honest reviews from students
            </p>
          </div>

          {/* Stats Overview - Using real data from API */}
          {stats && (
            <Card className="p-6 mb-8 bg-white dark:bg-gray-900">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {stats.averageRating.toFixed(1)}
                    </span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-6 h-6 ${
                            i < Math.floor(stats.averageRating) ? "text-green-500" : "text-gray-300"
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Based on {stats.totalReviews} reviews
                  </p>
                </div>

                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {stats.recommendationRate}%
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Would recommend to other students
                  </p>
                </div>

                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {stats.totalProperties}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Properties reviewed
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Add Review Button */}
          <div className="mb-6 flex items-center gap-4">
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleWriteReview}
            >
              Write a Review
            </Button>
            {!isLoggedIn && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Sign in to write a review
              </p>
            )}
          </div>

          {/* Reviews List - Using real data */}
          {reviews.length === 0 ? (
            <Card className="p-12 text-center bg-white dark:bg-gray-900">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No reviews yet for {decodedLocation}
              </p>
              <Button onClick={handleWriteReview}>
                Be the first to write a review
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id} className="p-6 bg-white dark:bg-gray-900">
                  <div className="flex flex-col gap-4">
                    {/* Review Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {review.author.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {review.author}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="mb-2">
                          {review.property}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-5 h-5 ${
                              i < review.rating ? "text-green-500" : "text-gray-300"
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>

                    {/* Review Content */}
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {review.review}
                    </p>

                    {/* Review Footer */}
                    <div className="flex items-center gap-4 pt-2 border-t border-gray-200 dark:border-gray-800">
                      <button 
                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1"
                        onClick={() => handleMarkHelpful(review.id)}
                        disabled={helpfulLoading === review.id}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                          />
                        </svg>
                        Helpful ({review.helpful})
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Load More */}
          {hasMore && (
            <div className="mt-8 text-center">
              <Button 
                variant="outline" 
                size="lg"
                onClick={loadMore}
                disabled={reviewsLoading}
              >
                {reviewsLoading ? 'Loading...' : 'Load More Reviews'}
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Write Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
            <DialogDescription>
              Share your experience with student housing in {decodedLocation}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitReview} className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label htmlFor="property">Property Name</Label>
              <Input
                id="property"
                placeholder="e.g., Campus Residences"
                value={reviewData.property}
                onChange={(e) => setReviewData({ ...reviewData, property: e.target.value })}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rating">Rating</Label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewData({ ...reviewData, rating: star })}
                    className="focus:outline-none"
                    disabled={isSubmitting}
                  >
                    <svg
                      className={`w-8 h-8 ${
                        star <= reviewData.rating ? "text-green-500" : "text-gray-300"
                      } hover:text-green-400 transition-colors`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  {reviewData.rating} star{reviewData.rating !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="review">Your Review</Label>
              <Textarea
                id="review"
                placeholder="Share your experience with this property..."
                value={reviewData.review}
                onChange={(e) => setReviewData({ ...reviewData, review: e.target.value })}
                required
                rows={6}
                className="resize-none"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Be honest and constructive. Help other students make informed decisions.
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsReviewDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
