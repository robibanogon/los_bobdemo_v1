/**
 * Migration Runner
 * 
 * Executes database migrations in order and tracks which migrations have been applied.
 * Supports both SQL and JavaScript migrations.
 * 
 * Usage:
 *   node run_migration.js                    # Run all pending migrations
 *   node run_migration.js --rollback         # Rollback last migration
 *   node run_migration.js --status           # Show migration status
 *   node run_migration.js --force <name>     # Force run specific migration
 */

const fs = require('fs').promises;
const path = require('path');
const { Pool } = require('pg');
const crypto = require('crypto');

// Database connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'los_production',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const MIGRATIONS_DIR = __dirname;

/**
 * Calculate MD5 checksum of file content
 */
function calculateChecksum(content) {
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Ensure schema_migrations table exists
 */
async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      migration_name VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      checksum VARCHAR(64)
    )
  `);
}

/**
 * Get list of applied migrations
 */
async function getAppliedMigrations(client) {
  const result = await client.query(`
    SELECT migration_name, applied_at, checksum 
    FROM schema_migrations 
    ORDER BY migration_name
  `);
  return result.rows;
}

/**
 * Get list of migration files
 */
async function getMigrationFiles() {
  const files = await fs.readdir(MIGRATIONS_DIR);
  
  // Filter for migration files (SQL and JS, excluding this runner)
  const migrationFiles = files.filter(file => {
    return (file.endsWith('.sql') || 
            (file.endsWith('.js') && file !== 'run_migration.js')) &&
           file.match(/^\d{3}_/);
  }).sort();
  
  return migrationFiles;
}

/**
 * Execute SQL migration
 */
async function executeSqlMigration(client, filename) {
  const filePath = path.join(MIGRATIONS_DIR, filename);
  const content = await fs.readFile(filePath, 'utf8');
  const checksum = calculateChecksum(content);
  
  console.log(`\n📄 Executing SQL migration: ${filename}`);
  
  try {
    // Execute the SQL file
    await client.query(content);
    
    // Record migration (if not already recorded by the migration itself)
    await client.query(`
      INSERT INTO schema_migrations (migration_name, checksum)
      VALUES ($1, $2)
      ON CONFLICT (migration_name) DO UPDATE SET checksum = $2
    `, [filename, checksum]);
    
    console.log(`   ✅ Migration completed successfully`);
    return true;
  } catch (error) {
    console.error(`   ❌ Migration failed:`, error.message);
    throw error;
  }
}

/**
 * Execute JavaScript migration
 */
async function executeJsMigration(client, filename) {
  const filePath = path.join(MIGRATIONS_DIR, filename);
  const content = await fs.readFile(filePath, 'utf8');
  const checksum = calculateChecksum(content);
  
  console.log(`\n📜 Executing JavaScript migration: ${filename}`);
  
  try {
    // Require and execute the migration module
    const migration = require(filePath);
    
    if (typeof migration.runMigration === 'function') {
      await migration.runMigration();
    } else {
      throw new Error('Migration file must export a runMigration function');
    }
    
    // Record migration
    await client.query(`
      INSERT INTO schema_migrations (migration_name, checksum)
      VALUES ($1, $2)
      ON CONFLICT (migration_name) DO UPDATE SET checksum = $2
    `, [filename, checksum]);
    
    console.log(`   ✅ Migration completed successfully`);
    return true;
  } catch (error) {
    console.error(`   ❌ Migration failed:`, error.message);
    throw error;
  }
}

/**
 * Run all pending migrations
 */
async function runPendingMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║   Database Migration Runner                                ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    
    // Ensure migrations table exists
    await ensureMigrationsTable(client);
    
    // Get applied and available migrations
    const appliedMigrations = await getAppliedMigrations(client);
    const appliedNames = new Set(appliedMigrations.map(m => m.migration_name));
    const migrationFiles = await getMigrationFiles();
    
    // Find pending migrations
    const pendingMigrations = migrationFiles.filter(file => !appliedNames.has(file));
    
    if (pendingMigrations.length === 0) {
      console.log('\n✅ No pending migrations. Database is up to date.');
      return;
    }
    
    console.log(`\n📋 Found ${pendingMigrations.length} pending migration(s):`);
    pendingMigrations.forEach(file => console.log(`   - ${file}`));
    
    // Execute each pending migration
    for (const filename of pendingMigrations) {
      await client.query('BEGIN');
      
      try {
        if (filename.endsWith('.sql')) {
          await executeSqlMigration(client, filename);
        } else if (filename.endsWith('.js')) {
          await executeJsMigration(client, filename);
        }
        
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`\n❌ Migration failed and was rolled back: ${filename}`);
        throw error;
      }
    }
    
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║   All migrations completed successfully!                   ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
  } finally {
    client.release();
  }
}

/**
 * Show migration status
 */
async function showMigrationStatus() {
  const client = await pool.connect();
  
  try {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║   Migration Status                                         ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    await ensureMigrationsTable(client);
    
    const appliedMigrations = await getAppliedMigrations(client);
    const appliedNames = new Set(appliedMigrations.map(m => m.migration_name));
    const migrationFiles = await getMigrationFiles();
    
    console.log('Applied Migrations:');
    console.log('─────────────────────────────────────────────────────────────');
    
    if (appliedMigrations.length === 0) {
      console.log('   (none)');
    } else {
      appliedMigrations.forEach(m => {
        const date = new Date(m.applied_at).toLocaleString();
        console.log(`   ✅ ${m.migration_name}`);
        console.log(`      Applied: ${date}`);
        console.log(`      Checksum: ${m.checksum}`);
      });
    }
    
    const pendingMigrations = migrationFiles.filter(file => !appliedNames.has(file));
    
    console.log('\nPending Migrations:');
    console.log('─────────────────────────────────────────────────────────────');
    
    if (pendingMigrations.length === 0) {
      console.log('   (none)');
    } else {
      pendingMigrations.forEach(file => {
        console.log(`   ⏳ ${file}`);
      });
    }
    
    console.log('\n─────────────────────────────────────────────────────────────');
    console.log(`Total: ${appliedMigrations.length} applied, ${pendingMigrations.length} pending\n`);
    
  } finally {
    client.release();
  }
}

/**
 * Rollback last migration
 */
async function rollbackLastMigration() {
  const client = await pool.connect();
  
  try {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║   Rollback Last Migration                                  ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    await ensureMigrationsTable(client);
    
    // Get last applied migration
    const result = await client.query(`
      SELECT migration_name, applied_at 
      FROM schema_migrations 
      ORDER BY applied_at DESC 
      LIMIT 1
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ No migrations to rollback');
      return;
    }
    
    const lastMigration = result.rows[0];
    console.log(`⚠️  Rolling back: ${lastMigration.migration_name}`);
    console.log(`   Applied at: ${new Date(lastMigration.applied_at).toLocaleString()}\n`);
    
    // Check if migration has rollback function
    const filename = lastMigration.migration_name;
    
    if (filename.endsWith('.js')) {
      const filePath = path.join(MIGRATIONS_DIR, filename);
      const migration = require(filePath);
      
      if (typeof migration.rollbackMigration === 'function') {
        await client.query('BEGIN');
        
        try {
          await migration.rollbackMigration();
          
          // Remove from migrations table
          await client.query(`
            DELETE FROM schema_migrations 
            WHERE migration_name = $1
          `, [filename]);
          
          await client.query('COMMIT');
          console.log('✅ Rollback completed successfully\n');
        } catch (error) {
          await client.query('ROLLBACK');
          console.error('❌ Rollback failed:', error.message);
          throw error;
        }
      } else {
        console.log('⚠️  Migration does not support rollback');
        console.log('   Manual rollback required\n');
      }
    } else {
      console.log('⚠️  SQL migrations do not support automatic rollback');
      console.log('   Manual rollback required\n');
    }
    
  } finally {
    client.release();
  }
}

/**
 * Force run a specific migration
 */
async function forceRunMigration(migrationName) {
  const client = await pool.connect();
  
  try {
    console.log(`\n🔧 Force running migration: ${migrationName}\n`);
    
    await ensureMigrationsTable(client);
    await client.query('BEGIN');
    
    try {
      if (migrationName.endsWith('.sql')) {
        await executeSqlMigration(client, migrationName);
      } else if (migrationName.endsWith('.js')) {
        await executeJsMigration(client, migrationName);
      } else {
        throw new Error('Migration must be a .sql or .js file');
      }
      
      await client.query('COMMIT');
      console.log('\n✅ Migration forced successfully\n');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
    
  } finally {
    client.release();
  }
}

/**
 * Test database connection
 */
async function testConnection() {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  // Test connection first
  console.log('\n🔌 Testing database connection...');
  const connected = await testConnection();
  
  if (!connected) {
    console.error('\n❌ Cannot proceed without database connection');
    console.error('   Please check your database configuration\n');
    process.exit(1);
  }
  
  try {
    if (args.includes('--status')) {
      await showMigrationStatus();
    } else if (args.includes('--rollback')) {
      await rollbackLastMigration();
    } else if (args.includes('--force')) {
      const migrationIndex = args.indexOf('--force') + 1;
      if (migrationIndex >= args.length) {
        console.error('❌ Please specify migration name after --force');
        process.exit(1);
      }
      await forceRunMigration(args[migrationIndex]);
    } else {
      await runPendingMigrations();
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (process.env.NODE_ENV === 'development') {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  runPendingMigrations,
  showMigrationStatus,
  rollbackLastMigration,
  forceRunMigration
};

// Made with Bob
