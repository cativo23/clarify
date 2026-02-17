-- Run this ONCE in Supabase SQL Editor to initialize the migration system
-- This creates the tracking table used by npm run db:migrate

CREATE TABLE IF NOT EXISTS _migrations (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL UNIQUE,
    batch_number INTEGER NOT NULL,
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_migrations_batch ON _migrations(batch_number);
CREATE INDEX IF NOT EXISTS idx_migrations_name ON _migrations(migration_name);

COMMENT ON TABLE _migrations IS 'Tracks database migration history';
COMMENT ON COLUMN _migrations.migration_name IS 'Name of the migration file (without .sql extension)';
COMMENT ON COLUMN _migrations.batch_number IS 'Batch number for grouping migrations run together';
