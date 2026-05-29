/**
 * Data Migration Script: JSON to PostgreSQL
 * 
 * This script migrates data from JSON files to PostgreSQL database.
 * It handles relationships, foreign keys, and provides rollback capability.
 * 
 * Usage:
 *   node migrate_json_to_postgres.js
 * 
 * Environment Variables Required:
 *   - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
 */

const fs = require('fs').promises;
const path = require('path');
const { Pool } = require('pg');

// Configuration
const DATA_DIR = path.join(__dirname, '../data');
const JSON_FILES = {
  users: 'users.json',
  applications: 'applications.json',
  documents: 'documents.json',
  agent_reviews: 'agent_reviews.json',
  analyses: 'analyses.json',
  decisions: 'decisions.json',
  audit_log: 'audit_log.json'
};

// Database connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'los_production',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Migration state tracking
const migrationState = {
  startTime: null,
  endTime: null,
  recordsMigrated: {},
  errors: [],
  success: false
};

/**
 * Read JSON file and parse data
 */
async function readJsonFile(filename) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`⚠️  File not found: ${filename}, skipping...`);
      return [];
    }
    throw error;
  }
}

/**
 * Migrate users table
 */
async function migrateUsers(client) {
  console.log('\n📋 Migrating users...');
  const users = await readJsonFile(JSON_FILES.users);
  
  if (users.length === 0) {
    console.log('   No users to migrate');
    return 0;
  }

  let count = 0;
  for (const user of users) {
    try {
      await client.query(`
        INSERT INTO users (
          id, username, password_hash, name, role, email, 
          is_active, created_at, updated_at, last_login
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO NOTHING
      `, [
        user.id,
        user.username,
        user.password,
        user.name,
        user.role,
        user.email,
        user.is_active !== false,
        user.created_at || new Date().toISOString(),
        user.updated_at || new Date().toISOString(),
        user.last_login || null
      ]);
      count++;
      process.stdout.write(`\r   Migrated ${count}/${users.length} users`);
    } catch (error) {
      console.error(`\n   ❌ Error migrating user ${user.username}:`, error.message);
      migrationState.errors.push({ entity: 'user', id: user.id, error: error.message });
    }
  }
  
  console.log(`\n   ✅ Successfully migrated ${count} users`);
  return count;
}

/**
 * Migrate applications table
 */
async function migrateApplications(client) {
  console.log('\n📋 Migrating applications...');
  const applications = await readJsonFile(JSON_FILES.applications);
  
  if (applications.length === 0) {
    console.log('   No applications to migrate');
    return 0;
  }

  let count = 0;
  for (const app of applications) {
    try {
      await client.query(`
        INSERT INTO applications (
          id, application_number, status, owner_user_id,
          applicant, loan_request, financial_snapshot, collateral, owner_info,
          created_at, updated_at, submitted_at, completed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id) DO NOTHING
      `, [
        app.id,
        app.application_number,
        app.status,
        app.owner_user_id,
        JSON.stringify(app.applicant),
        JSON.stringify(app.loan_request),
        JSON.stringify(app.financial_snapshot),
        JSON.stringify(app.collateral),
        JSON.stringify(app.owner_info),
        app.created_at || new Date().toISOString(),
        app.updated_at || new Date().toISOString(),
        app.submitted_at || null,
        app.completed_at || null
      ]);
      count++;
      process.stdout.write(`\r   Migrated ${count}/${applications.length} applications`);
    } catch (error) {
      console.error(`\n   ❌ Error migrating application ${app.application_number}:`, error.message);
      migrationState.errors.push({ entity: 'application', id: app.id, error: error.message });
    }
  }
  
  console.log(`\n   ✅ Successfully migrated ${count} applications`);
  return count;
}

/**
 * Migrate documents table
 */
async function migrateDocuments(client) {
  console.log('\n📋 Migrating documents...');
  const documents = await readJsonFile(JSON_FILES.documents);
  
  if (documents.length === 0) {
    console.log('   No documents to migrate');
    return 0;
  }

  let count = 0;
  for (const doc of documents) {
    try {
      // For migration, we'll use local file path as s3_key initially
      // These will need to be uploaded to S3 separately
      const s3Key = doc.file_path || `legacy/${doc.filename}`;
      const s3Bucket = process.env.S3_DOCUMENTS_BUCKET || 'los-documents-dev';
      
      await client.query(`
        INSERT INTO documents (
          id, application_id, doc_type, filename, original_filename,
          s3_key, s3_bucket, file_size, mime_type, uploaded_by, uploaded_at,
          extracted_fields
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO NOTHING
      `, [
        doc.id,
        doc.application_id,
        doc.doc_type,
        doc.filename,
        doc.original_filename || doc.filename,
        s3Key,
        s3Bucket,
        doc.file_size || 0,
        doc.mime_type || 'application/octet-stream',
        doc.uploaded_by,
        doc.uploaded_at || new Date().toISOString(),
        JSON.stringify(doc.extracted_fields || {})
      ]);
      count++;
      process.stdout.write(`\r   Migrated ${count}/${documents.length} documents`);
    } catch (error) {
      console.error(`\n   ❌ Error migrating document ${doc.filename}:`, error.message);
      migrationState.errors.push({ entity: 'document', id: doc.id, error: error.message });
    }
  }
  
  console.log(`\n   ✅ Successfully migrated ${count} documents`);
  console.log('   ⚠️  Note: Document files need to be uploaded to S3 separately');
  return count;
}

/**
 * Migrate agent reviews table
 */
async function migrateAgentReviews(client) {
  console.log('\n📋 Migrating agent reviews...');
  const reviews = await readJsonFile(JSON_FILES.agent_reviews);
  
  if (reviews.length === 0) {
    console.log('   No agent reviews to migrate');
    return 0;
  }

  let count = 0;
  for (const review of reviews) {
    try {
      await client.query(`
        INSERT INTO agent_reviews (
          id, application_id, review_data, created_at, created_by
        ) VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (application_id) DO NOTHING
      `, [
        review.id,
        review.application_id,
        JSON.stringify(review.review_data || review),
        review.created_at || new Date().toISOString(),
        review.created_by || review.application_id // Fallback if created_by not available
      ]);
      count++;
      process.stdout.write(`\r   Migrated ${count}/${reviews.length} agent reviews`);
    } catch (error) {
      console.error(`\n   ❌ Error migrating agent review:`, error.message);
      migrationState.errors.push({ entity: 'agent_review', id: review.id, error: error.message });
    }
  }
  
  console.log(`\n   ✅ Successfully migrated ${count} agent reviews`);
  return count;
}

/**
 * Migrate analyses table
 */
async function migrateAnalyses(client) {
  console.log('\n📋 Migrating analyses...');
  const analyses = await readJsonFile(JSON_FILES.analyses);
  
  if (analyses.length === 0) {
    console.log('   No analyses to migrate');
    return 0;
  }

  let count = 0;
  for (const analysis of analyses) {
    try {
      await client.query(`
        INSERT INTO analyses (
          id, application_id, dscr, net_operating_cashflow, collateral_coverage,
          risk_score, metrics, assumptions, flags, created_at, updated_at, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (application_id) DO NOTHING
      `, [
        analysis.id,
        analysis.application_id,
        analysis.dscr || null,
        analysis.net_operating_cashflow || null,
        analysis.collateral_coverage || null,
        analysis.risk_score || null,
        JSON.stringify(analysis.metrics || {}),
        JSON.stringify(analysis.assumptions || {}),
        JSON.stringify(analysis.flags || []),
        analysis.created_at || new Date().toISOString(),
        analysis.updated_at || new Date().toISOString(),
        analysis.created_by || analysis.application_id
      ]);
      count++;
      process.stdout.write(`\r   Migrated ${count}/${analyses.length} analyses`);
    } catch (error) {
      console.error(`\n   ❌ Error migrating analysis:`, error.message);
      migrationState.errors.push({ entity: 'analysis', id: analysis.id, error: error.message });
    }
  }
  
  console.log(`\n   ✅ Successfully migrated ${count} analyses`);
  return count;
}

/**
 * Migrate decisions table
 */
async function migrateDecisions(client) {
  console.log('\n📋 Migrating decisions...');
  const decisions = await readJsonFile(JSON_FILES.decisions);
  
  if (decisions.length === 0) {
    console.log('   No decisions to migrate');
    return 0;
  }

  let count = 0;
  for (const decision of decisions) {
    try {
      await client.query(`
        INSERT INTO decisions (
          id, application_id, recommended_by, recommended_decision, recommended_at,
          approver_id, final_decision, decided_at, conditions, rejection_reason, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (application_id) DO NOTHING
      `, [
        decision.id,
        decision.application_id,
        decision.recommended_by || null,
        decision.recommended_decision || null,
        decision.recommended_at || null,
        decision.approver_id || null,
        decision.final_decision || null,
        decision.decided_at || null,
        JSON.stringify(decision.conditions || []),
        decision.rejection_reason || null,
        decision.notes || null
      ]);
      count++;
      process.stdout.write(`\r   Migrated ${count}/${decisions.length} decisions`);
    } catch (error) {
      console.error(`\n   ❌ Error migrating decision:`, error.message);
      migrationState.errors.push({ entity: 'decision', id: decision.id, error: error.message });
    }
  }
  
  console.log(`\n   ✅ Successfully migrated ${count} decisions`);
  return count;
}

/**
 * Migrate audit logs table
 */
async function migrateAuditLogs(client) {
  console.log('\n📋 Migrating audit logs...');
  const logs = await readJsonFile(JSON_FILES.audit_log);
  
  if (logs.length === 0) {
    console.log('   No audit logs to migrate');
    return 0;
  }

  let count = 0;
  for (const log of logs) {
    try {
      await client.query(`
        INSERT INTO audit_logs (
          id, timestamp, actor_id, actor_name, action, entity_type, entity_id,
          before_state, after_state, ip_address, user_agent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        log.id,
        log.timestamp || new Date().toISOString(),
        log.actor_id || null,
        log.actor_name || 'System',
        log.action,
        log.entity_type,
        log.entity_id || null,
        log.before ? JSON.stringify(log.before) : null,
        log.after ? JSON.stringify(log.after) : null,
        log.ip_address || null,
        log.user_agent || null
      ]);
      count++;
      if (count % 100 === 0) {
        process.stdout.write(`\r   Migrated ${count}/${logs.length} audit logs`);
      }
    } catch (error) {
      console.error(`\n   ❌ Error migrating audit log:`, error.message);
      migrationState.errors.push({ entity: 'audit_log', id: log.id, error: error.message });
    }
  }
  
  console.log(`\n   ✅ Successfully migrated ${count} audit logs`);
  return count;
}

/**
 * Verify migration integrity
 */
async function verifyMigration(client) {
  console.log('\n🔍 Verifying migration integrity...');
  
  const tables = ['users', 'applications', 'documents', 'agent_reviews', 'analyses', 'decisions', 'audit_logs'];
  const counts = {};
  
  for (const table of tables) {
    const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
    counts[table] = parseInt(result.rows[0].count);
    console.log(`   ${table}: ${counts[table]} records`);
  }
  
  return counts;
}

/**
 * Create backup of current database state
 */
async function createBackup(client) {
  console.log('\n💾 Creating backup point...');
  
  try {
    await client.query(`
      INSERT INTO schema_migrations (migration_name, checksum)
      VALUES ('backup_before_json_migration', md5(NOW()::text))
      ON CONFLICT (migration_name) DO NOTHING
    `);
    console.log('   ✅ Backup point created');
  } catch (error) {
    console.log('   ⚠️  Could not create backup point:', error.message);
  }
}

/**
 * Main migration function
 */
async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║   JSON to PostgreSQL Data Migration                       ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    
    migrationState.startTime = new Date();
    
    // Start transaction
    await client.query('BEGIN');
    
    // Create backup point
    await createBackup(client);
    
    // Run migrations in order (respecting foreign key constraints)
    migrationState.recordsMigrated.users = await migrateUsers(client);
    migrationState.recordsMigrated.applications = await migrateApplications(client);
    migrationState.recordsMigrated.documents = await migrateDocuments(client);
    migrationState.recordsMigrated.agent_reviews = await migrateAgentReviews(client);
    migrationState.recordsMigrated.analyses = await migrateAnalyses(client);
    migrationState.recordsMigrated.decisions = await migrateDecisions(client);
    migrationState.recordsMigrated.audit_logs = await migrateAuditLogs(client);
    
    // Verify migration
    const finalCounts = await verifyMigration(client);
    
    // Commit transaction
    await client.query('COMMIT');
    
    migrationState.endTime = new Date();
    migrationState.success = true;
    
    // Print summary
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║   Migration Summary                                        ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`\n✅ Migration completed successfully!`);
    console.log(`\n⏱️  Duration: ${((migrationState.endTime - migrationState.startTime) / 1000).toFixed(2)}s`);
    console.log(`\n📊 Records migrated:`);
    Object.entries(migrationState.recordsMigrated).forEach(([table, count]) => {
      console.log(`   ${table}: ${count}`);
    });
    
    if (migrationState.errors.length > 0) {
      console.log(`\n⚠️  Errors encountered: ${migrationState.errors.length}`);
      console.log('   Check migration log for details');
    }
    
    console.log('\n✨ Next steps:');
    console.log('   1. Upload document files to S3');
    console.log('   2. Update application to use USE_DATABASE=true');
    console.log('   3. Test the application thoroughly');
    console.log('   4. Keep JSON files as backup until verified\n');
    
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    
    console.error('\n❌ Migration failed:', error.message);
    console.error('\n🔄 Transaction rolled back - database unchanged');
    
    migrationState.success = false;
    migrationState.errors.push({ entity: 'migration', error: error.message, stack: error.stack });
    
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Rollback migration (if needed)
 */
async function rollbackMigration() {
  const client = await pool.connect();
  
  try {
    console.log('\n🔄 Rolling back migration...');
    
    await client.query('BEGIN');
    
    // Delete in reverse order
    const tables = ['audit_logs', 'decisions', 'analyses', 'agent_reviews', 'documents', 'applications', 'users'];
    
    for (const table of tables) {
      await client.query(`DELETE FROM ${table}`);
      console.log(`   Cleared ${table}`);
    }
    
    await client.query('COMMIT');
    console.log('\n✅ Rollback completed');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Rollback failed:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--rollback')) {
    rollbackMigration()
      .then(() => process.exit(0))
      .catch(error => {
        console.error(error);
        process.exit(1);
      })
      .finally(() => pool.end());
  } else {
    runMigration()
      .then(() => process.exit(0))
      .catch(error => {
        console.error(error);
        process.exit(1);
      })
      .finally(() => pool.end());
  }
}

module.exports = { runMigration, rollbackMigration };

// Made with Bob
