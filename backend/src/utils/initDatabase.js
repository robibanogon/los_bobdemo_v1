/**
 * Database Initialization Utility
 * 
 * Initializes database connection and runs pending migrations on startup.
 * Provides graceful shutdown handling.
 */

const { testConnection, retryConnection, close, healthCheck } = require('../services/database/pool');
const { runPendingMigrations } = require('../../migrations/run_migration');

/**
 * Initialize database connection and run migrations
 * @param {Object} options - Initialization options
 * @returns {Promise<boolean>} True if initialization successful
 */
async function initDatabase(options = {}) {
  const {
    runMigrations = true,
    maxRetries = 5,
    retryDelay = 1000
  } = options;

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   Database Initialization                                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Test database connection with retry logic
    console.log('🔌 Connecting to database...');
    const connected = await retryConnection(maxRetries, retryDelay);

    if (!connected) {
      throw new Error('Failed to connect to database after multiple attempts');
    }

    // Run pending migrations if enabled
    if (runMigrations) {
      console.log('\n📋 Checking for pending migrations...');
      try {
        await runPendingMigrations();
      } catch (error) {
        console.error('⚠️  Migration error:', error.message);
        console.log('   Continuing with existing schema...\n');
      }
    }

    // Perform health check
    console.log('🏥 Performing health check...');
    const health = await healthCheck();
    
    if (health.status === 'healthy') {
      console.log('✅ Database health check passed');
      console.log(`   Pool size: ${health.poolSize}`);
      console.log(`   Idle connections: ${health.idleConnections}`);
      console.log(`   Response time: ${health.responseTime}ms\n`);
    } else {
      console.warn('⚠️  Database health check failed:', health.error);
    }

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║   Database initialization completed successfully!         ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    return true;
  } catch (error) {
    console.error('\n❌ Database initialization failed:', error.message);
    console.error('   Stack:', error.stack);
    return false;
  }
}

/**
 * Gracefully close database connections
 * @returns {Promise<void>}
 */
async function closeDatabase() {
  console.log('\n🔌 Closing database connections...');
  try {
    await close();
    console.log('✅ Database connections closed successfully\n');
  } catch (error) {
    console.error('❌ Error closing database connections:', error.message);
  }
}

/**
 * Setup graceful shutdown handlers
 */
function setupGracefulShutdown() {
  // Handle SIGTERM (e.g., from Docker, Kubernetes)
  process.on('SIGTERM', async () => {
    console.log('\n📡 SIGTERM signal received');
    await closeDatabase();
    process.exit(0);
  });

  // Handle SIGINT (e.g., Ctrl+C)
  process.on('SIGINT', async () => {
    console.log('\n📡 SIGINT signal received');
    await closeDatabase();
    process.exit(0);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', async (error) => {
    console.error('\n❌ Uncaught Exception:', error);
    await closeDatabase();
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', async (reason, promise) => {
    console.error('\n❌ Unhandled Rejection at:', promise, 'reason:', reason);
    await closeDatabase();
    process.exit(1);
  });
}

module.exports = {
  initDatabase,
  closeDatabase,
  setupGracefulShutdown
};

// Made with Bob
