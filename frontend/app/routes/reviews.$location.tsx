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
// Removed import of missing Route type

export function meta({ params }: { params: { location: string } }) {
  return [
    { title: `${params.location} - Student Housing Reviews | StudentStay` },
    { name: "description", content: `Read honest student housing reviews for ${params.location}` },
  ];
}

// Mock data - replace with real data from your backend
const mockReviews = [
  {
    id: 1,
    author: "Sarah M.",
    rating: 5,
    date: "2 weeks ago",
    property: "Campus Residences",
    review: "Amazing place to live! Close to campus, great facilities, and the community is wonderful. Would definitely recommend to other students.",
    helpful: 24,
  },
  {
    id: 2,
    author: "John D.",
    rating: 4,
    date: "1 month ago",
    property: "Student Apartments Downtown",
    review: "Good location and reasonable price. The apartment is a bit small but perfect for students. Management is responsive to maintenance requests.",
    helpful: 18,
  },
  {
    id: 3,
    author: "Emma L.",
    rating: 3,
    date: "2 months ago",
    property: "University Housing Block A",
    review: "Decent place but could use some updates. The location is great and it's affordable. Internet connection could be better.",
    helpful: 12,
  },
];

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

  const averageRating = 4.2;
  const totalReviews = mockReviews.length;

  const handleWriteReview = () => {
    if (!isLoggedIn) {
      // Redirect to login with return URL
      navigate(`/login?redirect=/reviews/${encodeURIComponent(decodedLocation)}`);
    } else {
      setIsReviewDialogOpen(true);
    }
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Submit review to backend
    console.log("Submitting review:", reviewData);
    setIsReviewDialogOpen(false);
    // Reset form
    setReviewData({ property: "", rating: 5, review: "" });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate("/")}
            >
              <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">StudentStay</span>
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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Location Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Student Housing in {decodedLocation}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Read {totalReviews} honest reviews from students
            </p>
          </div>

          {/* Stats Overview */}
          <Card className="p-6 mb-8 bg-white dark:bg-gray-900">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {averageRating}
                  </span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-6 h-6 ${
                          i < Math.floor(averageRating) ? "text-green-500" : "text-gray-300"
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
                  Based on {totalReviews} reviews
                </p>
              </div>

              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  85%
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Would recommend to other students
                </p>
              </div>

              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  42
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Properties reviewed
                </p>
              </div>
            </div>
          </Card>

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

          {/* Reviews List */}
          <div className="space-y-4">
            {mockReviews.map((review) => (
              <Card key={review.id} className="p-6 bg-white dark:bg-gray-900">
                <div className="flex flex-col gap-4">
                  {/* Review Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {isLoggedIn ? review.author.charAt(0) : "?"}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {isLoggedIn ? review.author : "Anonymous User"}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {review.date}
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
                    <button className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1">
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
                    <button className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                      Reply
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Load More */}
          <div className="mt-8 text-center">
            <Button variant="outline" size="lg">
              Load More Reviews
            </Button>
          </div>
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
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Submit Review
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
