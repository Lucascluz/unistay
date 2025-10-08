-- ========================================
-- UniStay Database Verification Script
-- Run this in DBeaver/pgAdmin SQL Editor
-- ========================================

-- 1. List all tables in public schema
SELECT 
    schemaname as schema,
    tablename as table_name,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Check migration status
SELECT 
    id,
    name,
    executed_at
FROM schema_migrations
ORDER BY id;

-- 3. Count records in each table
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'companies', COUNT(*) FROM companies
UNION ALL
SELECT 'company_representatives', COUNT(*) FROM company_representatives
UNION ALL
SELECT 'reviews', COUNT(*) FROM reviews
UNION ALL
SELECT 'review_responses', COUNT(*) FROM review_responses
UNION ALL
SELECT 'company_aliases', COUNT(*) FROM company_aliases
UNION ALL
SELECT 'company_alias_suggestions', COUNT(*) FROM company_alias_suggestions
UNION ALL
SELECT 'admins', COUNT(*) FROM admins
UNION ALL
SELECT 'company_verification_actions', COUNT(*) FROM company_verification_actions
ORDER BY table_name;

-- 4. View users table structure
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- 5. View companies table structure
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'companies'
ORDER BY ordinal_position;

-- 6. View reviews table structure
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'reviews'
ORDER BY ordinal_position;

-- 7. Check all indexes
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 8. Check all foreign key constraints
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- 9. Database size and statistics
SELECT
    pg_size_pretty(pg_database_size(current_database())) as database_size,
    current_database() as database_name,
    current_user as current_user,
    version() as postgresql_version;

-- 10. Check for any sample data (if you've added any)
-- Users
SELECT id, name, email, created_at FROM users LIMIT 5;

-- Companies
SELECT id, name, email, verified, created_at FROM companies LIMIT 5;

-- Reviews
SELECT id, location, property, rating, LEFT(review, 50) as review_excerpt, created_at FROM reviews LIMIT 5;
