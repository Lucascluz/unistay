import { useState, useEffect } from "react";
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
import { locationsApi } from "~/lib/api/locations";
import type { LocationStats } from "~/lib/api/types";
import { ReviewResponses } from "~/components/ReviewResponses";
import { TrustScoreBadge } from "~/components/TrustScoreBadge";
import { CompanySearch } from "~/components/CompanySearch";
import { searchApi, type SearchResult } from "~/lib/api/aliases";
import { ArrowRight, Info } from "lucide-react";

export function meta({ params }: { params: { location: string } }) {
  return [
    { title: `${params.location} - Student Housing Reviews | UniStay` },
    { name: "description", content: `Read honest reviews from students about housing in ${params.location}` },
  ];
}

export default function ReviewsPage() {
  const { location } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  const decodedLocation = decodeURIComponent(location || "");

  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewData, setReviewData] = useState({
    property: "",
    rating: 5,
    review: "",
  });
  const [selectedCompany, setSelectedCompany] = useState<SearchResult | null>(null);
  const [locationStats, setLocationStats] = useState<LocationStats | null>(null);
  const [isResolvingAlias, setIsResolvingAlias] = useState(true);
  const [aliasInfo, setAliasInfo] = useState<{
    is_alias: boolean;
    matched_alias?: string;
    alias_type?: string;
    canonical_name: string;
  } | null>(null);

  // Use the custom hooks
  const { reviews, isLoading, error, hasMore, total, loadMore, refresh } = useReviews(decodedLocation);
  const { createReview, isSubmitting, error: submitError } = useCreateReview();
  const { markHelpful, loading: markingHelpful } = useMarkHelpful();

  // Check if the location is an alias and redirect to canonical name
  useEffect(() => {
    const resolveLocationName = async () => {
      try {
        setIsResolvingAlias(true);
        const resolution = await searchApi.resolveLocation(decodedLocation);
        
        if (resolution.should_redirect && resolution.canonical_name !== decodedLocation) {
          // Redirect to the canonical company name
          navigate(`/reviews/${encodeURIComponent(resolution.canonical_name)}`, { replace: true });
        } else {
          // Store alias info to show user if it's an alias match
          setAliasInfo({
            is_alias: resolution.is_alias,
            matched_alias: resolution.matched_alias,
            alias_type: resolution.alias_type,
            canonical_name: resolution.canonical_name,
          });
          setIsResolvingAlias(false);
        }
      } catch (err) {
        console.error('Failed to resolve location:', err);
        // Continue anyway, just don't redirect
        setIsResolvingAlias(false);
      }
    };

    if (decodedLocation) {
      resolveLocationName();
    }
  }, [decodedLocation, navigate]);

  // Fetch location stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await locationsApi.getLocationStats(decodedLocation);
        setLocationStats(stats);
      } catch (err) {
        console.error('Failed to fetch location stats:', err);
      }
    };
    
    if (decodedLocation && !isResolvingAlias) {
      fetchStats();
    }
  }, [decodedLocation, isResolvingAlias]);

  const handleWriteReview = () => {
    if (!isLoggedIn) {
      // Redirect to login with return URL
      navigate(`/login?redirect=/reviews/${encodeURIComponent(decodedLocation)}`);
    } else {
      setIsReviewDialogOpen(true);
      setSelectedCompany(null);
      setReviewData({ property: "", rating: 5, review: "" });
    }
  };

  const handleCompanySelect = (company: SearchResult) => {
    setSelectedCompany(company);
    setReviewData({ ...reviewData, property: company.company_name });
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
      // Reset form
      setReviewData({ property: "", rating: 5, review: "" });
      // Refresh reviews list
      refresh();
    } catch (err) {
      console.error('Failed to submit review:', err);
    }
  };

  const handleMarkHelpful = async (reviewId: string) => {
    await markHelpful(reviewId);
    // Refresh to get updated helpful count
    refresh();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} year${years > 1 ? 's' : ''} ago`;
    }
  };

  // Show loading state while resolving alias
  if (isResolvingAlias) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Checking location...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div 
              className="flex items-center gap-2 sm:gap-4 cursor-pointer"
              onClick={() => navigate("/")}
            >
              <img 
                src="/study-stay-logo.png" 
                alt="UniStay Logo" 
                className="h-10 w-10 sm:h-16 sm:w-16 md:h-24 md:w-24 object-contain"
              />
              <span className="text-2xl sm:text-3xl md:text-5xl font-bold text-gray-900 dark:text-white">UniStay</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {isLoggedIn && (
                <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 hidden md:block">
                  Hi, {user?.name}
                </span>
              )}
              <Button variant="outline" size="sm" onClick={() => navigate("/")} className="text-xs sm:text-sm px-2 sm:px-4">
                <span className="hidden sm:inline">Back to Search</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-5xl mx-auto">
          {/* Alias Redirect Notice */}
          {aliasInfo?.is_alias && aliasInfo.matched_alias && (
            <Card className="p-3 sm:p-4 mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2 sm:gap-3">
                <Info className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm sm:text-base font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    Alternative Name Detected
                  </h3>
                  <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200">
                    We recognized "{aliasInfo.matched_alias}" as{' '}
                    {aliasInfo.alias_type === 'abbreviation' ? 'an abbreviation' : 
                     aliasInfo.alias_type === 'common_name' ? 'a common name' :
                     aliasInfo.alias_type === 'misspelling' ? 'a common misspelling' :
                     aliasInfo.alias_type === 'translation' ? 'a translation' :
                     aliasInfo.alias_type === 'former_name' ? 'a former name' :
                     aliasInfo.alias_type === 'local_name' ? 'a local name' : 'an alternative name'}{' '}
                    for <strong>{aliasInfo.canonical_name}</strong>. 
                    You're now viewing all reviews for this location.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Location Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Student Housing in {decodedLocation}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              {total > 0 ? `Read ${total} honest review${total !== 1 ? 's' : ''} from students` : 'Be the first to review!'}
            </p>
          </div>

          {/* Stats Overview */}
          {locationStats && (
            <Card className="p-6 mb-8 bg-white dark:bg-gray-900">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {locationStats.averageRating.toFixed(1)}
                    </span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-6 h-6 ${
                            i < Math.floor(locationStats.averageRating) ? "text-green-500" : "text-gray-300"
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
                    Based on {locationStats.totalReviews} review{locationStats.totalReviews !== 1 ? 's' : ''}
                  </p>
                </div>

                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {Math.round(locationStats.recommendationRate)}%
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Would recommend to other students
                  </p>
                </div>

                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {locationStats.totalProperties}
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

          {/* Error state */}
          {error && (
            <Card className="p-6 mb-6 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
              <p className="text-red-600 dark:text-red-400">
                Failed to load reviews. Please try again later.
              </p>
            </Card>
          )}

          {/* Loading state */}
          {isLoading && reviews.length === 0 && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading reviews...</p>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && reviews.length === 0 && !error && (
            <Card className="p-12 text-center bg-white dark:bg-gray-900">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No reviews yet for {decodedLocation}
              </p>
              <Button onClick={handleWriteReview}>
                Be the first to review!
              </Button>
            </Card>
          )}

          {/* Reviews List */}
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id} className="p-6 bg-white dark:bg-gray-900">
                <div className="flex flex-col gap-4">
                  {/* Review Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {review.author.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {review.author}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(review.createdAt)}
                            </div>
                          </div>
                          {review.authorTrustScore !== undefined && (
                            <TrustScoreBadge score={review.authorTrustScore} size="sm" />
                          )}
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
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleMarkHelpful(review.id)}
                      disabled={markingHelpful === review.id}
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

                  {/* Review Responses */}
                  <ReviewResponses 
                    reviewId={review.id} 
                    responses={review.responses}
                    onResponseAdded={refresh}
                  />
                </div>
              </Card>
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="mt-8 text-center">
              <Button 
                variant="outline" 
                size="lg" 
                onClick={loadMore}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Load More Reviews'}
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
          
          {submitError && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md p-3 text-sm text-red-600 dark:text-red-400">
              {submitError}
            </div>
          )}
          
          <form onSubmit={handleSubmitReview} className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label htmlFor="property">Company / Property Name</Label>
              <CompanySearch
                onSelect={handleCompanySelect}
                placeholder="Search for a company (e.g., IPG, student housing platform, university...)"
                initialValue={reviewData.property}
                showSuggestions={true}
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Search using the official name, abbreviations, or common variations. 
                {selectedCompany && selectedCompany.matched_alias !== selectedCompany.company_name && (
                  <span className="text-green-600"> ✓ Matched via alias: "{selectedCompany.matched_alias}"</span>
                )}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Or enter a custom name if not found in the search results
              </p>
              <Input
                id="property-fallback"
                placeholder="Enter custom property name if not found"
                value={reviewData.property}
                onChange={(e) => setReviewData({ ...reviewData, property: e.target.value })}
                required
                className="mt-2"
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
