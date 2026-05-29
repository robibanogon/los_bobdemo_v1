/**
 * PostgreSQL Connection Pool
 * 
 * Manages database connections with automatic retry logic and health checks.
 * Uses environment variables for configuration.
 */

const { Pool } = require('pg');

// Connection configuration from environment variables
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'los_production',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  
  // Pool configuration
  max: parseInt(process.env.DB_POOL_MAX || '20'),
  min: parseInt(process.env.DB_POOL_MIN || '2'),
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000'),
  
  // SSL configuration for production
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
  } : false,
  
  // Application name for monitoring
  application_name: process.env.DB_APPLICATION_NAME || 'los-backend'
};

// Create connection pool
const pool = new Pool(config);

// Connection event handlers
pool.on('connect', (client) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔌 New database connection established');
  }
});

pool.on('acquire', (client) => {
  if (process.env.NODE_ENV === 'development') {
    // console.log('📥 Connection acquired from pool');
  }
});

pool.on('remove', (client) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📤 Connection removed from pool');
  }
});

pool.on('error', (err, client) => {
  console.error('❌ Unexpected database error:', err);
  // Don't exit the process, let the pool handle reconnection
});

/**
 * Test database connection
 * @returns {Promise<boolean>} True if connection successful
 */
async function testConnection() {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query('SELECT NOW() as now, version() as version');
    
    console.log('✅ Database connection successful');
    console.log(`   Time: ${result.rows[0].now}`);
    console.log(`   Version: ${result.rows[0].version.split(',')[0]}`);
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
}

/**
 * Health check for database connection
 * @returns {Promise<Object>} Health status object
 */
async function healthCheck() {
  const startTime = Date.now();
  let client;
  
  try {
    client = await pool.connect();
    await client.query('SELECT 1');
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTime,
      poolSize: pool.totalCount,
      idleConnections: pool.idleCount,
      waitingClients: pool.waitingCount
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      responseTime: Date.now() - startTime
    };
  } finally {
    if (client) {
      client.release();
    }
  }
}

/**
 * Execute a query with automatic connection management
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
async function query(text, params) {
  const start = Date.now();
  
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (process.env.NODE_ENV === 'development' && duration > 1000) {
      console.warn(`⚠️  Slow query (${duration}ms):`, text.substring(0, 100));
    }
    
    return result;
  } catch (error) {
    console.error('❌ Query error:', error.message);
    console.error('   Query:', text.substring(0, 100));
    throw error;
  }
}

/**
 * Execute a transaction with automatic rollback on error
 * @param {Function} callback - Async function that receives client
 * @returns {Promise<any>} Result from callback
 */
async function transaction(callback) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get a client from the pool for manual transaction management
 * Remember to call client.release() when done!
 * @returns {Promise<Object>} Database client
 */
async function getClient() {
  return await pool.connect();
}

/**
 * Gracefully close all connections in the pool
 * @returns {Promise<void>}
 */
async function close() {
  console.log('🔌 Closing database connection pool...');
  await pool.end();
  console.log('✅ Database connection pool closed');
}

/**
 * Get pool statistics
 * @returns {Object} Pool statistics
 */
function getPoolStats() {
  return {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount
  };
}

/**
 * Retry connection with exponential backoff
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} initialDelay - Initial delay in milliseconds
 * @returns {Promise<boolean>} True if connection successful
 */
async function retryConnection(maxRetries = 5, initialDelay = 1000) {
  let retries = 0;
  let delay = initialDelay;
  
  while (retries < maxRetries) {
    const connected = await testConnection();
    
    if (connected) {
      return true;
    }
    
    retries++;
    if (retries < maxRetries) {
      console.log(`⏳ Retrying connection in ${delay}ms... (attempt ${retries}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
  
  console.error(`❌ Failed to connect after ${maxRetries} attempts`);
  return false;
}

// Export pool and utility functions
module.exports = {
  pool,
  query,
  transaction,
  getClient,
  testConnection,
  healthCheck,
  close,
  getPoolStats,
  retryConnection
};

// Made with Bob
