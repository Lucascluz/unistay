# Database Migration System

## Overview

The UniStay backend uses an incremental migration system that tracks which migrations have been applied and only runs new ones.

## How It Works

1. **Migration Files**: All migration files are stored in `/backend/migrations/` as `.sql` files
2. **Naming Convention**: Files are named with a numeric prefix for ordering: `001_name.sql`, `002_name.sql`, etc.
3. **Tracking Table**: A `schema_migrations` table tracks which migrations have been executed
4. **Incremental**: Only runs migrations that haven't been executed yet
5. **Connection Test**: Always tests database connection before running migrations

## Usage

### Run All Pending Migrations

```bash
cd backend
pnpm migrate
```

This command will:
1. ✅ Test database connection
2. ✅ Create migrations tracking table (if needed)
3. ✅ Check which migrations have been run
4. ✅ Run only pending migrations in order
5. ✅ Record each successful migration

### Example Output

```
🚀 UniStay Database Migration Tool

==================================================
🔌 Testing database connection...
✅ Database connection successful!
   Server time: 2025-10-08 15:30:45.123+00
==================================================
✅ Migrations tracking table ready

📊 Migration Status:
   Total migrations: 3
   Already executed: 1
   Pending: 2

🔄 Running pending migrations:

   Running: 002_company_aliases.sql
   ✅ 002_company_aliases.sql completed
   Running: 003_add_email_verification.sql
   ✅ 003_add_email_verification.sql completed

==================================================
✅ All migrations completed successfully!
==================================================
```

## Migration Files

### Current Migrations

1. **001_core_schema.sql** - Core database schema (users, reviews, companies, etc.)
2. **002_company_aliases.sql** - Company alias system for handling alternative names
3. **003_add_email_verification.sql** - Email verification fields for users

### Adding New Migrations

1. Create a new `.sql` file in `/backend/migrations/`
2. Name it with the next number: `004_your_migration_name.sql`
3. Write your SQL (use transactions if needed with BEGIN/COMMIT)
4. Run `pnpm migrate`

Example:

```sql
-- Migration 004: Add user profile fields

BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);

CREATE INDEX IF NOT EXISTS idx_users_avatar ON users(avatar_url);

COMMIT;
```

## Server Startup

The server automatically tests the database connection on startup:

```bash
pnpm dev  # or pnpm start
```

Output:
```
🚀 Starting UniStay Backend Server

==================================================
🔌 Testing database connection...
✅ Database connection successful!
   Server time: 2025-10-08 15:30:45.123+00
==================================================

✅ Server running on http://localhost:3001
✅ Environment: development
✅ Health check: http://localhost:3001/health

💡 Tip: Run "pnpm migrate" to update database schema
```

## Production Deployment

### Render Deployment

After deploying to Render:

1. Go to your service's Shell tab
2. Run migrations:
   ```bash
   pnpm migrate
   ```

Or set it up to run automatically on deploy by adding to the Build Command:
```bash
pnpm install && pnpm run build && pnpm migrate
```

⚠️ **Note**: Running migrations in the build command works, but it's better to run them manually the first time to see the output and verify success.

## Troubleshooting

### Connection Failed

If you see:
```
❌ Database connection failed:
   connection refused
```

**Solutions:**
- Check `DATABASE_URL` in `.env` file
- Ensure PostgreSQL is running: `docker-compose up -d`
- For Render, verify the Internal Database URL is correct
- Check if SSL is required (automatically enabled in production)

### Migration Already Executed

If you manually ran SQL and need to mark it as executed:

```sql
-- Connect to your database
INSERT INTO schema_migrations (name) 
VALUES ('001_core_schema.sql');
```

### Reset Migrations (Development Only)

⚠️ **WARNING**: This will delete all data!

```bash
# Drop and recreate database
docker-compose down -v
docker-compose up -d

# Run all migrations from scratch
pnpm migrate
```

### Check Migration Status

Connect to your database and check:

```sql
-- See which migrations have been run
SELECT * FROM schema_migrations ORDER BY id;

-- See all tables
\dt

-- See table structure
\d users
```

## Best Practices

1. **Always use transactions** - Wrap changes in `BEGIN`/`COMMIT`
2. **Idempotent migrations** - Use `IF NOT EXISTS`, `IF EXISTS` to make migrations safe to re-run
3. **Never modify executed migrations** - Create a new migration to change existing schema
4. **Test locally first** - Always test migrations on your local database before production
5. **Backup before migrating** - In production, backup your database before running migrations
6. **Sequential numbering** - Use `001_`, `002_`, `003_` prefix for proper ordering

## Migration Tracking Table

The system creates a `schema_migrations` table:

```sql
CREATE TABLE schema_migrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

This tracks:
- Which migrations have been executed
- When they were executed
- Prevents duplicate execution

## Support

For issues with migrations:
1. Check the error message carefully
2. Review the SQL in the failing migration file
3. Test the SQL manually in your database
4. Check database logs for more details
5. Open an issue on GitHub with the error details
