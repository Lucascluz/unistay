# UniStay Frontend

Modern, responsive frontend for UniStay built with React Router, TypeScript, and TailwindCSS.

## Tech Stack

- **Framework**: React 19 + React Router 7
- **Language**: TypeScript
- **Styling**: TailwindCSS 4
- **UI Components**: Radix UI + shadcn/ui
- **Icons**: Lucide React
- **Build Tool**: Vite

## Features

- 🚀 Server-side rendering (SSR)
- ⚡️ Hot Module Replacement (HMR)
- 📦 Optimized asset bundling
- 🔄 Type-safe API client
- 🎨 Beautiful, accessible UI components
- � Responsive design
- � Secure authentication flow

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

Install the dependencies:

```bash
pnpm install
```

### Configuration

Create a `.env` file in the root directory:

```env
# Backend API URL
VITE_API_URL=http://localhost:3001/api
```

For production, set this to your deployed backend URL.

### Development

Start the development server with HMR:

```bash
pnpm run dev
```

Your application will be available at `http://localhost:5173`.

## Building for Production

Create a production build:

```bash
pnpm run build
```

This creates optimized client and server bundles in the `build/` directory.

## Project Structure

```
frontend/
├── app/
│   ├── routes/              # Page routes
│   │   ├── home.tsx         # Landing page
│   │   ├── login.tsx        # User login
│   │   ├── register.tsx     # User registration
│   │   ├── profile.tsx      # User profile
│   │   ├── reviews.$location.tsx  # Reviews by location
│   │   ├── company.*.tsx    # Company pages
│   │   └── admin.*.tsx      # Admin pages
│   │
│   ├── components/          # Reusable components
│   │   ├── ui/             # Base UI components (shadcn/ui)
│   │   ├── CompanySearch.tsx
│   │   ├── ReviewResponses.tsx
│   │   ├── TrustScoreBadge.tsx
│   │   └── ...
│   │
│   ├── lib/                # Utilities and hooks
│   │   ├── api/           # API client
│   │   │   ├── client.ts  # Axios instance
│   │   │   ├── auth.ts    # Auth endpoints
│   │   │   ├── reviews.ts # Review endpoints
│   │   │   └── ...
│   │   ├── auth.tsx       # Auth context
│   │   ├── useReviews.ts  # Review hooks
│   │   └── utils.ts       # Utilities
│   │
│   ├── root.tsx           # Root layout
│   ├── routes.ts          # Route configuration
│   └── app.css            # Global styles
│
├── public/                 # Static assets
└── package.json
```

## Deployment

### Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure:
   - **Root Directory**: `frontend`
   - **Build Command**: `pnpm install && pnpm run build`
   - **Start Command**: `pnpm start`
4. Add environment variable:
   ```
   VITE_API_URL=https://your-backend-url.com/api
   ```

### Docker Deployment

Build and run using Docker:

```bash
docker build -t unistay-frontend .
docker run -p 3000:3000 unistay-frontend
```

The containerized application can be deployed to any platform that supports Docker:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### Environment Variables

For production, make sure to set:

```env
VITE_API_URL=https://your-backend-url.com/api
```

The `VITE_` prefix is required for Vite to expose the variable to the client.

## Styling

This template uses [Tailwind CSS](https://tailwindcss.com/) v4 for styling.

### UI Components

Base components are built with [Radix UI](https://www.radix-ui.com/) and styled with TailwindCSS, following the [shadcn/ui](https://ui.shadcn.com/) approach.

Available components in `app/components/ui/`:
- Button
- Card
- Input
- Label
- Dialog
- Badge
- Tabs
- Textarea

### Adding New Components

To add new UI components, you can:
1. Copy from shadcn/ui documentation
2. Place in `app/components/ui/`
3. Adjust styling as needed

## API Client

The API client is located in `app/lib/api/` and provides type-safe methods for all backend endpoints.

### Usage Example

```typescript
import { reviewsApi } from '~/lib/api';

// Get reviews for a location
const reviews = await reviewsApi.getByLocation('Lisbon');

// Create a review (requires auth)
const newReview = await reviewsApi.create({
  location: 'Lisbon',
  property: 'Student House',
  rating: 5,
  review: 'Great place!'
});
```

### Authentication

The API client automatically includes JWT tokens from localStorage in requests. The auth context (`app/lib/auth.tsx`) manages authentication state.

## Development Tips

### Type Safety

- All API responses are typed in `app/lib/api/types.ts`
- Components use TypeScript interfaces for props
- React Router provides type-safe route parameters

### Hot Reload

The development server supports hot module replacement. Changes to files will automatically reload the browser.

### Debugging

- React DevTools extension recommended
- Network tab for API requests
- Check browser console for errors

## Troubleshooting

### API Connection Issues

If you get connection errors:
1. Check backend is running (`http://localhost:3001`)
2. Verify `VITE_API_URL` in `.env`
3. Check CORS settings in backend
4. Check browser console for error details

### Build Errors

If build fails:
1. Delete `node_modules` and reinstall: `rm -rf node_modules && pnpm install`
2. Clear build cache: `rm -rf build .react-router`
3. Check TypeScript errors: `pnpm typecheck`

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## License

ISC