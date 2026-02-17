-- Migrations Tracking Table
-- This table tracks which migrations have been executed
-- Created: February 17, 2026

CREATE TABLE IF NOT EXISTS _migrations (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL UNIQUE,
    batch_number INTEGER NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_migrations_batch ON _migrations(batch_number);
CREATE INDEX IF NOT EXISTS idx_migrations_name ON _migrations(migration_name);

-- Comments for documentation
COMMENT ON TABLE _migrations IS 'Tracks database migration history';
COMMENT ON COLUMN _migrations.migration_name IS 'Name of the migration file (without .sql extension)';
COMMENT ON COLUMN _migrations.batch_number IS 'Batch number for grouping migrations run together';
COMMENT ON COLUMN _migrations.executed_at IS 'Timestamp when migration was executed';
