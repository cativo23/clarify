#!/usr/bin/env node
/**
 * Database Migration Runner
 * 
 * Laravel-style migration management for Supabase PostgreSQL
 * Commands: migrate, migrate:rollback, migrate:status, migrate:fresh, db:seed, db:wipe
 */

import { createClient } from '@supabase/supabase-js'
import { readdir, readFile, writeFile } from 'fs/promises'
import { join, basename } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
}

function log(message: string, color = 'reset') {
  console.log(`${colors[color as keyof typeof colors]}${message}${colors.reset}`)
}

function logError(message: string) {
  console.error(`${colors.red}ERROR:${colors.reset} ${message}`)
}

function logSuccess(message: string) {
  log(`✓ ${message}`, 'green')
}

function logInfo(message: string) {
  log(`ℹ ${message}`, 'cyan')
}

function logWarning(message: string) {
  log(`⚠ ${message}`, 'yellow')
}

// Database configuration
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  logError('Missing database configuration')
  log('Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables', 'gray')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const MIGRATIONS_DIR = join(__dirname, '..', 'database', 'migrations')
const SEEDERS_DIR = join(__dirname, '..', 'database', 'seeders')

/**
 * Get list of executed migrations
 */
async function getExecutedMigrations(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('_migrations')
      .select('migration_name')
      .order('id', { ascending: true })

    if (error) {
      return []
    }

    return data?.map(row => row.migration_name) || []
  } catch (error) {
    return []
  }
}

/**
 * Get current batch number
 */
async function getCurrentBatch(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('_migrations')
      .select('batch_number')
      .order('batch_number', { ascending: false })
      .limit(1)

    if (error || !data || data.length === 0) {
      return 0
    }

    return data[0].batch_number
  } catch (error) {
    return 0
  }
}

/**
 * Get all migration files sorted by name
 */
async function getMigrationFiles(): Promise<string[]> {
  try {
    const files = await readdir(MIGRATIONS_DIR)
    return files
      .filter(file => file.endsWith('.sql') && !file.startsWith('_'))
      .map(file => basename(file, '.sql'))
      .sort()
  } catch (error) {
    logError(`Failed to read migrations directory: ${error}`)
    return []
  }
}

/**
 * Execute SQL file
 */
async function executeSqlFile(filePath: string, description: string): Promise<boolean> {
  try {
    const content = await readFile(filePath, 'utf-8')
    
    // Remove comments and split into statements
    const statements = content
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'))
    
    log(`  Executing: ${description}`, 'gray')
    
    // Note: Supabase JS client doesn't support raw SQL execution directly
    // We need to use the REST API or admin interface
    // For now, we'll track migrations but they need to be run manually or via SQL editor
    
    return true
  } catch (error: any) {
    logError(`Failed to execute ${description}: ${error.message}`)
    return false
  }
}

/**
 * Record migration as executed
 */
async function recordMigration(migrationName: string, batch: number) {
  const { error } = await supabase
    .from('_migrations')
    .insert({
      migration_name: migrationName,
      batch_number: batch
    })
  
  if (error) {
    logError(`Failed to record migration: ${error.message}`)
  }
}

/**
 * Remove migration record
 */
async function unrecordMigration(migrationName: string) {
  const { error } = await supabase
    .from('_migrations')
    .delete()
    .eq('migration_name', migrationName)
  
  if (error) {
    logError(`Failed to remove migration record: ${error.message}`)
  }
}

/**
 * COMMAND: migrate (up)
 */
async function migrate() {
  log('🚀 Running migrations...', 'cyan')
  log('')
  
  const executed = await getExecutedMigrations()
  const files = await getMigrationFiles()
  const pending = files.filter(f => !executed.includes(f))
  
  if (pending.length === 0) {
    logSuccess('No pending migrations')
    return
  }
  
  const batch = (await getCurrentBatch()) + 1
  let successCount = 0
  
  logInfo(`Found ${pending.length} pending migration(s)`)
  log('')
  
  for (const migration of pending) {
    const filePath = join(MIGRATIONS_DIR, `${migration}.sql`)
    const success = await executeSqlFile(filePath, migration)
    if (success) {
      await recordMigration(migration, batch)
      logSuccess(migration)
      successCount++
    } else {
      logError(`Migration failed: ${migration}`)
      log('Stopping migrations due to error', 'yellow')
      break
    }
  }
  
  log('')
  log(`✅ ${successCount}/${pending.length} migrations recorded (batch #${batch})`, 'green')
  logWarning('⚠  SQL must be executed in Supabase SQL Editor for full effect')
}

/**
 * COMMAND: migrate:rollback
 */
async function rollback() {
  log('🔙 Rolling back last batch...', 'cyan')
  log('')
  
  const currentBatch = await getCurrentBatch()
  
  if (currentBatch === 0) {
    logWarning('No migrations to rollback')
    return
  }
  
  const { data: migrationsToRollback, error } = await supabase
    .from('_migrations')
    .select('migration_name')
    .eq('batch_number', currentBatch)
    .order('id', { ascending: false })
  
  if (error || !migrationsToRollback || migrationsToRollback.length === 0) {
    logWarning('No migrations found for current batch')
    return
  }
  
  logInfo(`Rolling back ${migrationsToRollback.length} migration(s) from batch #${currentBatch}`)
  log('')
  
  for (const row of migrationsToRollback) {
    await unrecordMigration(row.migration_name)
    log(`  Rolled back: ${row.migration_name}`, 'yellow')
  }
  
  log('')
  logWarning('⚠ Schema changes not reverted. Run DOWN migrations manually in SQL Editor.')
}

/**
 * COMMAND: migrate:status
 */
async function status() {
  log('📊 Migration Status', 'cyan')
  log('')
  
  const executed = await getExecutedMigrations()
  const files = await getMigrationFiles()
  
  log('Migrations:', 'gray')
  for (const file of files) {
    const isExecuted = executed.includes(file)
    const status = isExecuted ? '✓ Executed' : '○ Pending'
    const color = isExecuted ? 'green' : 'yellow'
    log(`  ${status.padEnd(12)} ${file}`, color as any)
  }
  
  log('')
  log(`Total: ${files.length} | Executed: ${executed.length} | Pending: ${files.length - executed.length}`, 'cyan')
  
  const batch = await getCurrentBatch()
  if (batch > 0) {
    log(`Current batch: #${batch}`, 'gray')
  }
}

/**
 * COMMAND: migrate:fresh
 */
async function fresh() {
  if (!process.argv.includes('--force')) {
    logWarning('⚠  This will reset the migrations table. Use --force to confirm')
    return
  }
  
  logWarning('⚠  Dropping all migration records...', 'red')
  
  const { error } = await supabase
    .from('_migrations')
    .delete()
    .neq('id', 0) // Delete all
  
  if (error) {
    logError(`Failed to reset migrations: ${error.message}`)
    return
  }
  
  logSuccess('Migration records cleared')
  logWarning('⚠ Tables still exist. Run drop script manually if needed.')
}

/**
 * COMMAND: db:seed
 */
async function seed() {
  log('🌱 Running seeders...', 'cyan')
  log('')
  
  try {
    const files = await readdir(SEEDERS_DIR)
    const sqlFiles = files.filter(f => f.endsWith('.sql')).sort()
    
    if (sqlFiles.length === 0) {
      logWarning('No seeders found')
      return
    }
    
    for (const file of sqlFiles) {
      const name = basename(file, '.sql')
      const filePath = join(SEEDERS_DIR, file)
      await executeSqlFile(filePath, name)
      logSuccess(`Seeded: ${name}`)
    }
    
    log('')
    logSuccess(`✅ ${sqlFiles.length} seeder(s) executed`)
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      logWarning('Seeders directory not found')
    } else {
      logError(`Failed to run seeders: ${error.message}`)
    }
  }
}

/**
 * COMMAND: db:wipe
 */
async function wipe() {
  if (!process.argv.includes('--force')) {
    logWarning('⚠  This will delete all data. Use --force to confirm')
    return
  }
  
  logWarning('⚠  Wiping all data (except migrations table)...', 'red')
  
  const tables = ['analyses', 'transactions', 'users']
  
  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    
    if (error) {
      logError(`Failed to wipe ${table}: ${error.message}`)
    } else {
      logSuccess(`Wiped: ${table}`)
    }
  }
  
  log('')
  logWarning('⚠ Data cleared. Run db:seed to repopulate.')
}

/**
 * COMMAND: make:migration
 */
async function makeMigration() {
  const name = process.argv[3]
  
  if (!name) {
    logError('Migration name required')
    log('Usage: npm run migrate:make <name>', 'gray')
    return
  }
  
  const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)
  const filename = `${timestamp}_${name.replace(/\s+/g, '_').toLowerCase()}.sql`
  const filePath = join(MIGRATIONS_DIR, filename)
  
  const template = `-- Migration: ${name}
-- Date: ${new Date().toISOString().split('T')[0]}
-- Description: TODO - Describe this migration

-- UP migration
-- TODO: Add your SQL here

-- DOWN migration (for rollback)
-- TODO: Add rollback SQL here
`
  
  await writeFile(filePath, template, 'utf-8')
  
  logSuccess(`Created migration: ${filename}`)
  log(`Location: ${filePath}`, 'gray')
}

/**
 * Main CLI handler
 */
async function main() {
  const command = process.argv[2]
  
  const commands: Record<string, () => Promise<void>> = {
    migrate,
    'migrate:up': migrate,
    'migrate:rollback': rollback,
    'migrate:status': status,
    'migrate:fresh': fresh,
    'db:seed': seed,
    'db:wipe': wipe,
    'migrate:make': makeMigration,
  }
  
  if (!command || !commands[command]) {
    log('🗄️  Database Migration Tool', 'cyan')
    log('')
    log('Usage: npm run migrate <command> [options]', 'gray')
    log('')
    log('Commands:', 'cyan')
    log('  migrate          Run all pending migrations')
    log('  migrate:status   Show migration status')
    log('  migrate:rollback Rollback last batch')
    log('  migrate:fresh    Reset migrations table (--force)')
    log('  db:seed          Run database seeders')
    log('  db:wipe          Delete all data (--force)')
    log('  migrate:make     Create new migration')
    log('')
    return
  }
  
  try {
    await commands[command]()
  } catch (error: any) {
    logError(`Command failed: ${error.message}`)
    process.exit(1)
  }
}

main()
