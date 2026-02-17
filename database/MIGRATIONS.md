# Database Migrations & Seeders Guide

Laravel-style database migration system for Clarify using Supabase PostgreSQL.

## 📋 Overview

This system provides:
- **Version control** for database schema
- **Rollback capabilities** for safe deployments
- **Seeders** for demo/test data
- **CLI commands** for common operations

## 🚀 Quick Start

### First Time Setup

```bash
# Install dependencies
npm install

# Set environment variables (copy from .env.example)
cp .env.example .env

# Run all migrations
npm run db:migrate

# Seed demo data (optional, for development)
npm run db:seed
```

## 📖 Available Commands

### Migrations

| Command | Description |
|---------|-------------|
| `npm run db:migrate` | Run all pending migrations |
| `npm run db:status` | Show migration status (executed/pending) |
| `npm run db:rollback` | Rollback last batch of migrations |
| `npm run db:fresh -- --force` | Reset migrations table |
| `npm run db:refresh -- --force` | Wipe all data + re-migrate + seed |

### Seeders

| Command | Description |
|---------|-------------|
| `npm run db:seed` | Run all seeders (demo data) |
| `npm run db:wipe -- --force` | Delete all data from tables |

### Create New Migration

```bash
npm run migrate:make create_users_table
# Creates: database/migrations/20260217120000_create_users_table.sql
```

## 📁 File Structure

```
database/
├── migrations/
│   ├── 000_create_migrations_table.sql    # Migration tracking (auto-run)
│   ├── 20260216000001_fix_credit_...sql   # C1: Atomic credit deduction
│   ├── 20260217000001_atomic_credit_...sql # H4: Atomic credit increment
│   └── ...
├── seeders/
│   ├── 001_demo_users.seeder.sql          # Demo users & analyses
│   ├── 002_pricing_tables.seeder.sql      # AI model pricing
│   └── ...
└── MIGRATIONS.md                          # This file
```

## 🔧 Migration File Format

```sql
-- Migration: Description of what this does
-- Date: 2026-02-17
-- Description: Detailed description of changes

-- UP migration (applied when running migrate)
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    credits INTEGER DEFAULT 0
);

-- DOWN migration (for rollback - manual execution required)
-- DROP TABLE users;
```

### Naming Convention

```
{YYYYMMDDHHMMSS}_{snake_case_description}.sql
```

Example: `20260217120000_add_users_table.sql`

## 🌱 Seeders

Seeders populate your database with test/demo data.

### Example: Creating a Seeder

```sql
-- database/seeders/003_test_contracts.seeder.sql
-- Database Seeder: Test Contracts
-- Purpose: Create sample contract analyses for testing

INSERT INTO analyses (user_id, contract_name, file_url, status)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Test Contract 1', 'contracts/test/1.pdf', 'completed'),
    ('00000000-0000-0000-0000-000000000001', 'Test Contract 2', 'contracts/test/2.pdf', 'completed');
```

## 🔄 Development Workflow

### Starting Fresh

```bash
# Wipe database and start over
npm run db:refresh -- --force

# Or manually:
npm run db:wipe -- --force
npm run db:fresh -- --force
npm run db:migrate
npm run db:seed
```

### Adding a New Feature

1. **Create migration:**
   ```bash
   npm run migrate:make add_contract_version_field
   ```

2. **Edit the migration file** in `database/migrations/`

3. **Run migration:**
   ```bash
   npm run db:migrate
   ```

4. **Update seeders** if new tables need demo data

5. **Commit** migration files to git

## 🛠️ Supabase Setup

### Local Development

1. Start Supabase locally or use cloud instance
2. Get credentials from `.env.example`
3. Set in `.env`:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_KEY=your-service-role-key
   ```

### Production

**Important:** Always backup before running migrations in production!

```bash
# 1. Create backup (via Supabase dashboard or pg_dump)
# 2. Run migrations
npm run db:migrate

# 3. Verify
npm run db:status

# 4. DO NOT run seeders in production (demo data only)
```

## 📝 Migration Best Practices

1. **Never edit executed migrations** - Create new ones instead
2. **Use descriptive names** - Future you will thank you
3. **Test migrations locally** before production
4. **Include DOWN migrations** as comments for rollback reference
5. **One concern per migration** - Keep them focused
6. **Use transactions** for multi-statement migrations

## 🔍 Troubleshooting

### Migration Fails

```bash
# Check status
npm run db:status

# Rollback last batch
npm run db:rollback

# Fix the migration file and re-run
npm run db:migrate
```

### "Table doesn't exist" Error

The migration system tracks migrations but SQL must be executed in Supabase SQL Editor for full effect. For complex migrations:

1. Copy the SQL from the migration file
2. Paste into Supabase SQL Editor
3. Execute manually
4. Run `npm run db:migrate` to record it

### Reset Everything

```bash
# Warning: This deletes all data!
npm run db:refresh -- --force
```

## 📚 Related Documentation

- [Security Report](./SECURITY_CONSOLIDATED_REPORT.md)
- [Architecture](./ARCHITECTURE.md)
- [Supabase Setup](./SUPABASE_SETUP.md)

## 🆘 Need Help?

1. Check migration status: `npm run db:status`
2. Review migration files in `database/migrations/`
3. Check Supabase dashboard for table structure
4. Review logs in `docker compose logs` or `.nuxt/dev/`
