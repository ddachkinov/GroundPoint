# Database Migrations

## Current Status

The Prisma schema has been updated with authentication fields, but migrations cannot be run automatically in this environment due to network restrictions preventing Prisma engine downloads.

## Manual Migration

A migration SQL file has been created at:
```
backend/prisma/migrations/20251113000000_add_auth_fields_and_refresh_tokens/migration.sql
```

### To apply the migration manually:

#### Using Docker Compose (Recommended):

```bash
# Start PostgreSQL
docker-compose up -d postgres

# Apply migration
docker-compose exec postgres psql -U groundpoint -d groundpoint_dev -f /path/to/migration.sql

# Or connect and paste SQL directly
docker-compose exec postgres psql -U groundpoint groundpoint_dev
```

#### Using local PostgreSQL:

```bash
psql -U groundpoint -d groundpoint_dev -f backend/prisma/migrations/20251113000000_add_auth_fields_and_refresh_tokens/migration.sql
```

### When Prisma CLI is available:

```bash
cd backend
npm run prisma:migrate  # or: npx prisma migrate dev
npm run prisma:generate  # Generate Prisma Client
```

## Schema Changes in This Migration

### Added to `users` table:
- `email_verification_token` (TEXT, nullable) - Hashed token for email verification
- `email_verification_token_expires_at` (TIMESTAMP, nullable) - Token expiration
- `password_reset_token` (TEXT, nullable) - Hashed token for password reset
- `password_reset_token_expires_at` (TIMESTAMP, nullable) - Token expiration

### New `refresh_tokens` table:
- `id` (TEXT, primary key) - UUID
- `token` (TEXT, unique, indexed) - Hashed refresh token
- `user_id` (TEXT, indexed, foreign key to users) - Token owner
- `expires_at` (TIMESTAMP) - Token expiration
- `created_at` (TIMESTAMP, default now) - Creation timestamp

### Indexes:
- Unique index on `refresh_tokens.token`
- Index on `refresh_tokens.user_id`
- Index on `refresh_tokens.token`

### Foreign Keys:
- `refresh_tokens.user_id` → `users.id` (CASCADE on delete)

## Next Steps

After running the migration:
1. Generate Prisma Client: `npm run prisma:generate`
2. Test database connection
3. Test authentication endpoints
4. Run integration tests

## Notes

- Migration is idempotent (can be run multiple times safely if using `IF NOT EXISTS` clauses)
- Backup database before running migrations in production
- All token fields are nullable to allow existing users to continue functioning
