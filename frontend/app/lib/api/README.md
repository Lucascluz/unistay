# API Integration Guide

This directory contains the API adapter layer for the StudentStay frontend application. It provides a clean, type-safe interface for communicating with the backend API.

## Structure

```
app/lib/api/
├── client.ts       # Base API client with HTTP methods
├── types.ts        # TypeScript types for API requests/responses
├── auth.ts         # Authentication endpoints
├── reviews.ts      # Reviews endpoints
├── locations.ts    # Locations endpoints
└── index.ts        # Main exports
```

## Configuration

Set your backend API URL in `.env`:

```bash
VITE_API_URL=http://localhost:8000/api
```

If not set, it defaults to `http://localhost:8000/api`.

## Usage Examples

### Authentication

```tsx
import { authApi } from '~/lib/api';

// Register
const { user, token } = await authApi.register({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123'
});

// Login
const { user, token } = await authApi.login({
  email: 'john@example.com',
  password: 'password123'
});

// Get current user
const user = await authApi.getCurrentUser();

// Logout
await authApi.logout();
```

### Reviews

```tsx
import { reviewsApi } from '~/lib/api';

// Get reviews for a location
const { reviews, total, hasMore } = await reviewsApi.getReviews({
  location: 'Amsterdam',
  page: 1,
  limit: 10,
  sortBy: 'recent'
});

// Create a review
const review = await reviewsApi.createReview({
  location: 'Amsterdam',
  property: 'Student Housing Complex',
  rating: 5,
  review: 'Great place to live!'
});

// Mark review as helpful
await reviewsApi.markHelpful(reviewId);

// Get user's reviews
const myReviews = await reviewsApi.getMyReviews();
```

### Locations

```tsx
import { locationsApi } from '~/lib/api';

// Get location statistics
const stats = await locationsApi.getLocationStats('Amsterdam');
// Returns: { averageRating, totalReviews, recommendationRate, totalProperties }

// Search locations
const locations = await locationsApi.searchLocations('amster');

// Get popular locations
const popular = await locationsApi.getPopularLocations(10);
```

## Custom Hooks

For easier integration in React components, use the provided custom hooks:

### useReviews Hook

```tsx
import { useReviews } from '~/lib/useReviews';

function ReviewsPage() {
  const { reviews, isLoading, error, hasMore, total, loadMore, refresh } = 
    useReviews('Amsterdam', { limit: 10, sortBy: 'recent' });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {reviews.map(review => (
        <ReviewCard key={review.id} review={review} />
      ))}
      {hasMore && <button onClick={loadMore}>Load More</button>}
    </div>
  );
}
```

### useCreateReview Hook

```tsx
import { useCreateReview } from '~/lib/useReviews';

function ReviewForm() {
  const { createReview, isSubmitting, error } = useCreateReview();

  const handleSubmit = async (data) => {
    try {
      const review = await createReview(data);
      console.log('Review created:', review);
      // Handle success
    } catch (err) {
      // Error is already set in the hook
      console.error('Failed to create review');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit Review'}
      </button>
      {error && <p>{error}</p>}
    </form>
  );
}
```

### useLocationStats Hook

```tsx
import { useLocationStats } from '~/lib/useLocations';

function LocationStats({ location }) {
  const { stats, isLoading, error } = useLocationStats(location);

  if (isLoading) return <div>Loading stats...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <p>Average Rating: {stats.averageRating}</p>
      <p>Total Reviews: {stats.totalReviews}</p>
      <p>Recommendation Rate: {stats.recommendationRate}%</p>
    </div>
  );
}
```

### useMarkHelpful Hook

```tsx
import { useMarkHelpful } from '~/lib/useReviews';

function ReviewCard({ review }) {
  const { markHelpful, loading } = useMarkHelpful();
  const [helpfulCount, setHelpfulCount] = useState(review.helpful);

  const handleMarkHelpful = async () => {
    const newCount = await markHelpful(review.id);
    if (newCount !== null) {
      setHelpfulCount(newCount);
    }
  };

  return (
    <button 
      onClick={handleMarkHelpful} 
      disabled={loading === review.id}
    >
      Helpful ({helpfulCount})
    </button>
  );
}
```

## Error Handling

The API client throws `ApiError` instances with detailed information:

```tsx
import { ApiError } from '~/lib/api';

try {
  await authApi.login({ email, password });
} catch (error) {
  if (error instanceof ApiError) {
    console.log('Status:', error.status);
    console.log('Message:', error.message);
    console.log('Data:', error.data);
    
    // Handle specific status codes
    if (error.status === 401) {
      // Unauthorized
    } else if (error.status === 404) {
      // Not found
    }
  }
}
```

## Authentication Flow

The API client automatically:
1. Adds JWT tokens to requests from `localStorage.getItem('token')`
2. Includes `Authorization: Bearer <token>` header
3. Handles 401 responses for expired tokens

The `AuthProvider` in `app/lib/auth.tsx` manages:
- Token storage in localStorage
- User state
- Automatic token validation on app load
- Login/logout/register flows

## Type Safety

All API responses and requests are fully typed:

```tsx
import type { Review, CreateReviewRequest, User } from '~/lib/api';

const reviewData: CreateReviewRequest = {
  location: 'Amsterdam',
  property: 'Student Apartments',
  rating: 5,
  review: 'Excellent!'
};

const review: Review = await reviewsApi.createReview(reviewData);
```

## Benefits

✅ **Separation of Concerns** - API logic separate from UI components  
✅ **Type Safety** - Full TypeScript support with IntelliSense  
✅ **Centralized Error Handling** - Consistent error handling across the app  
✅ **Automatic Authentication** - Token management built-in  
✅ **Easy Testing** - Mock the API layer in tests  
✅ **Reusability** - Share API calls across components  
✅ **Maintainability** - Single source of truth for endpoints

## Backend API Expected Format

The backend should return responses in this format:

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "statusCode": 400
}
```

### Authentication Response
```json
{
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

## Migration Guide

To migrate your existing code to use the API adapters:

### Before (Mock Data)
```tsx
const [isLoading, setIsLoading] = useState(false);

const login = async (email: string, password: string) => {
  setIsLoading(true);
  // Mock API call
  await new Promise(resolve => setTimeout(resolve, 500));
  setUser({ id: '1', name: 'User', email });
  setIsLoading(false);
};
```

### After (Real API)
```tsx
import { authApi } from '~/lib/api';

const login = async (email: string, password: string) => {
  const { user, token } = await authApi.login({ email, password });
  setUser(user);
  localStorage.setItem('token', token);
};
```

## Next Steps

1. Create your `.env` file based on `.env.example`
2. Update your backend API to match the expected endpoints
3. Test the API integration with your backend
4. Replace mock data in components with real API calls using the provided hooks

Happy coding! 🚀
