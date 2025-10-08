# UniStay Backend

Simple and maintainable Node.js + Express + TypeScript backend for UniStay.

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Authentication**: JWT + bcrypt
- **Validation**: Zod
- **Email**: Resend API

## Getting Started

### Prerequisites

- Node.js 18+ (or use nvm: `nvm use`)
- Docker & Docker Compose
- pnpm (recommended) or npm

### Installation

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Start PostgreSQL database**:
   ```bash
   docker-compose up -d
   ```

3. **Run database migrations**:
   ```bash
   pnpm run migrate
   ```

4. **Start development server**:
   ```bash
   pnpm run dev
   ```

The API will be available at `http://localhost:3001`

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Authentication
- `POST /api/auth/register` - Register new user
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }
  ```

- `POST /api/auth/login` - Login user
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```

### Reviews
- `GET /api/reviews` - Get all reviews (with optional filters)
  - Query params: `location`, `page`, `limit`, `sortBy` (recent|rating|helpful)
  
- `POST /api/reviews` - Create review (requires auth)
  ```json
  {
    "location": "Lisbon",
    "property": "Student House Central",
    "rating": 5,
    "review": "Amazing place to study..."
  }
  ```

- `POST /api/reviews/:id/helpful` - Mark review as helpful

### Locations
- `GET /api/locations` - Get all locations with stats
- `GET /api/locations/:location` - Get specific location stats

## Database Schema

### Users Table
```sql
- id (UUID, PK)
- name (VARCHAR)
- email (VARCHAR, UNIQUE)
- password_hash (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Reviews Table
```sql
- id (UUID, PK)
- user_id (UUID, FK -> users.id)
- location (VARCHAR)
- property (VARCHAR)
- rating (INTEGER, 1-5)
- review (TEXT)
- helpful (INTEGER)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://studystay:studystay123@localhost:5432/studystay

# JWT - Generate strong random keys for production!
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Email - Get your API key from https://resend.com
RESEND=your-resend-api-key
FROM_EMAIL=noreply@yourdomain.com
FRONTEND_URL=http://localhost:5173

# Admin - Generate strong random key for production!
ADMIN_SECRET_KEY=your-admin-secret-key-change-in-production
```

**⚠️ SECURITY WARNING**: Never commit the `.env` file! Always use strong random keys in production.

## Development Commands

```bash
# Start dev server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run migrations
npm run migrate

# Generate admin secret key
npm run generate:admin-key

# Seed admin user (for testing)
npm run seed:admin

# Start database
docker-compose up -d

# Stop database
docker-compose down

# View database logs
docker-compose logs -f postgres
```

## Admin System

The backend includes a complete admin verification system for reviewing and managing company registrations.

### Setup Admin Access

1. **Generate an admin key**:
   ```bash
   npm run generate:admin-key
   ```

2. **Add to .env file**:
   ```bash
   ADMIN_SECRET_KEY=your-generated-key-here
   ```

3. **Access admin endpoints** with the `x-admin-key` header:
   ```bash
   curl http://localhost:3001/api/admin/companies/pending \
     -H "x-admin-key: your-key-here"
   ```

### Admin API Endpoints

All admin endpoints require the `x-admin-key` header.

- `GET /api/admin/companies/pending` - Get pending company requests
- `GET /api/admin/companies?status=verified` - Get companies by status
- `GET /api/admin/companies/:id` - Get company details with history
- `POST /api/admin/companies/verify` - Approve/reject company
  ```json
  {
    "companyId": "uuid",
    "status": "verified",
    "notes": "Optional notes"
  }
  ```
- `GET /api/admin/stats` - Get admin statistics
- `DELETE /api/admin/responses/:id` - Delete response (moderation)

### Admin Database Tables

**admins**:
- Stores admin user accounts with roles
- Supports 'admin' and 'super_admin' roles

**company_verification_actions**:
- Logs all verification decisions
- Tracks which admin made the decision
- Stores notes for audit trail

For more details, see `ADMIN_README.md` in the project root.

## Database Management

### Connect to PostgreSQL
```bash
docker exec -it studystay-db psql -U studystay -d studystay
```

### Useful SQL Commands
```sql
-- List all tables
\dt

-- View table structure
\d users
\d reviews

-- Count reviews
SELECT COUNT(*) FROM reviews;

-- View all users
SELECT id, name, email, created_at FROM users;
```

## Project Structure

```
backend/
├── src/
│   ├── db/
│   │   ├── config.ts          # Database connection
│   │   └── migrate.ts         # Database migrations
│   ├── middleware/
│   │   └── auth.ts            # Authentication middleware
│   ├── routes/
│   │   ├── auth.ts            # Auth endpoints
│   │   ├── reviews.ts         # Review endpoints
│   │   └── locations.ts       # Location endpoints
│   ├── utils/
│   │   └── jwt.ts             # JWT helper functions
│   ├── types.ts               # TypeScript types
│   └── index.ts               # Express app entry point
├── docker-compose.yml         # PostgreSQL container
├── package.json
└── tsconfig.json
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error type",
  "message": "Human-readable error message"
}
```

Success responses:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

## Security Notes

- Passwords are hashed with bcrypt (10 rounds)
- JWT tokens are used for authentication
- CORS is enabled for development
- Input validation with Zod schemas
- SQL injection protection via parameterized queries

## Production Considerations

Before deploying to production:

1. **Environment Variables**:
   - Generate strong random keys:
     ```bash
     node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
     ```
   - Use the generated keys for `JWT_SECRET` and `ADMIN_SECRET_KEY`
   - Get a Resend API key from https://resend.com
   - Set `NODE_ENV=production`

2. **Database**:
   - Use a managed PostgreSQL service (Render, AWS RDS, etc.)
   - Set up automated backups
   - Use connection pooling

3. **Security**:
   - Enable HTTPS only
   - Configure CORS for your frontend domain only
   - Add rate limiting (e.g., express-rate-limit)
   - Set up request logging (Morgan, Winston)
   - Keep dependencies updated

4. **Monitoring**:
   - Set up error tracking (Sentry, etc.)
   - Monitor API performance
   - Set up health check endpoint monitoring

5. **Migrations**:
   - Run all migrations on first deploy:
     ```bash
     pnpm run migrate
     pnpm run migrate:aliases
     pnpm run migrate:email-verification
     ```

See the main [README.md](../README.md) for Render deployment instructions.

## Troubleshooting

### Database connection issues
```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart database
docker-compose restart postgres
```

### Port already in use
```bash
# Change PORT in .env or kill process using port 3001
lsof -ti:3001 | xargs kill
```

## License

ISC
