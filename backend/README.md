# StudyStay Backend

Simple and maintainable Node.js + Express + TypeScript backend for StudyStay MVP.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express
- **Language**: TypeScript
- **Database**: PostgreSQL (Docker)
- **Authentication**: JWT + bcrypt
- **Validation**: Zod

## Getting Started

### Prerequisites

- Node.js 18+ (or use nvm: `nvm use`)
- Docker & Docker Compose
- npm or pnpm

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start PostgreSQL database**:
   ```bash
   docker-compose up -d
   ```

3. **Run database migrations**:
   ```bash
   npm run migrate
   ```

4. **Start development server**:
   ```bash
   npm run dev
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

Copy `.env.example` to `.env` and adjust as needed:

```env
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://studystay:studystay123@localhost:5432/studystay
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```

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

# Start database
docker-compose up -d

# Stop database
docker-compose down

# View database logs
docker-compose logs -f postgres
```

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

Before deploying:
1. Change `JWT_SECRET` to a strong random string
2. Update `DATABASE_URL` to production database
3. Set `NODE_ENV=production`
4. Enable HTTPS
5. Configure proper CORS origins
6. Set up database backups
7. Add rate limiting
8. Add request logging (Morgan, Winston)

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

MIT
