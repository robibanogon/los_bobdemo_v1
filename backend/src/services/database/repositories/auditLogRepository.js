/**
 * Audit Log Repository
 * 
 * Handles all database operations for audit_logs table.
 */

const { query } = require('../pool');

class AuditLogRepository {
  /**
   * Create a new audit log entry
   * @param {Object} logData - Log data
   * @returns {Promise<Object>} Created log entry
   */
  async create(logData) {
    const result = await query(`
      INSERT INTO audit_logs (
        actor_id, actor_name, action, entity_type, entity_id,
        before_state, after_state, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      logData.actor_id || null,
      logData.actor_name,
      logData.action,
      logData.entity_type,
      logData.entity_id || null,
      logData.before_state ? JSON.stringify(logData.before_state) : null,
      logData.after_state ? JSON.stringify(logData.after_state) : null,
      logData.ip_address || null,
      logData.user_agent || null
    ]);
    
    return this.parseJsonFields(result.rows[0]);
  }

  /**
   * Find log by ID
   * @param {string} id - Log ID
   * @returns {Promise<Object|null>} Log or null
   */
  async findById(id) {
    const result = await query(
      'SELECT * FROM audit_logs WHERE id = $1',
      [id]
    );
    
    return result.rows[0] ? this.parseJsonFields(result.rows[0]) : null;
  }

  /**
   * Get all logs with optional filters
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of logs
   */
  async findAll(filters = {}) {
    let sql = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (filters.actor_id) {
      sql += ` AND actor_id = $${paramCount}`;
      params.push(filters.actor_id);
      paramCount++;
    }

    if (filters.action) {
      sql += ` AND action = $${paramCount}`;
      params.push(filters.action);
      paramCount++;
    }

    if (filters.entity_type) {
      sql += ` AND entity_type = $${paramCount}`;
      params.push(filters.entity_type);
      paramCount++;
    }

    if (filters.entity_id) {
      sql += ` AND entity_id = $${paramCount}`;
      params.push(filters.entity_id);
      paramCount++;
    }

    if (filters.start_date) {
      sql += ` AND timestamp >= $${paramCount}`;
      params.push(filters.start_date);
      paramCount++;
    }

    if (filters.end_date) {
      sql += ` AND timestamp <= $${paramCount}`;
      params.push(filters.end_date);
      paramCount++;
    }

    sql += ' ORDER BY timestamp DESC';

    if (filters.limit) {
      sql += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
      paramCount++;
    }

    if (filters.offset) {
      sql += ` OFFSET $${paramCount}`;
      params.push(filters.offset);
    }

    const result = await query(sql, params);
    return result.rows.map(row => this.parseJsonFields(row));
  }

  /**
   * Get logs for a specific entity
   * @param {string} entityType - Entity type
   * @param {string} entityId - Entity ID
   * @param {number} limit - Maximum number of logs to return
   * @returns {Promise<Array>} Array of logs
   */
  async findByEntity(entityType, entityId, limit = 50) {
    const result = await query(`
      SELECT * FROM audit_logs
      WHERE entity_type = $1 AND entity_id = $2
      ORDER BY timestamp DESC
      LIMIT $3
    `, [entityType, entityId, limit]);

    return result.rows.map(row => this.parseJsonFields(row));
  }

  /**
   * Get logs by actor
   * @param {string} actorId - Actor user ID
   * @param {number} limit - Maximum number of logs to return
   * @returns {Promise<Array>} Array of logs
   */
  async findByActor(actorId, limit = 50) {
    const result = await query(`
      SELECT * FROM audit_logs
      WHERE actor_id = $1
      ORDER BY timestamp DESC
      LIMIT $2
    `, [actorId, limit]);

    return result.rows.map(row => this.parseJsonFields(row));
  }

  /**
   * Get logs by action
   * @param {string} action - Action name
   * @param {number} limit - Maximum number of logs to return
   * @returns {Promise<Array>} Array of logs
   */
  async findByAction(action, limit = 50) {
    const result = await query(`
      SELECT * FROM audit_logs
      WHERE action = $1
      ORDER BY timestamp DESC
      LIMIT $2
    `, [action, limit]);

    return result.rows.map(row => this.parseJsonFields(row));
  }

  /**
   * Get logs within date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {number} limit - Maximum number of logs to return
   * @returns {Promise<Array>} Array of logs
   */
  async findByDateRange(startDate, endDate, limit = 1000) {
    const result = await query(`
      SELECT * FROM audit_logs
      WHERE timestamp >= $1 AND timestamp <= $2
      ORDER BY timestamp DESC
      LIMIT $3
    `, [startDate, endDate, limit]);

    return result.rows.map(row => this.parseJsonFields(row));
  }

  /**
   * Count logs by filters
   * @param {Object} filters - Filter options
   * @returns {Promise<number>} Count of logs
   */
  async count(filters = {}) {
    let sql = 'SELECT COUNT(*) as count FROM audit_logs WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (filters.actor_id) {
      sql += ` AND actor_id = $${paramCount}`;
      params.push(filters.actor_id);
      paramCount++;
    }

    if (filters.action) {
      sql += ` AND action = $${paramCount}`;
      params.push(filters.action);
      paramCount++;
    }

    if (filters.entity_type) {
      sql += ` AND entity_type = $${paramCount}`;
      params.push(filters.entity_type);
      paramCount++;
    }

    if (filters.start_date) {
      sql += ` AND timestamp >= $${paramCount}`;
      params.push(filters.start_date);
      paramCount++;
    }

    if (filters.end_date) {
      sql += ` AND timestamp <= $${paramCount}`;
      params.push(filters.end_date);
    }

    const result = await query(sql, params);
    return parseInt(result.rows[0].count);
  }

  /**
   * Get audit statistics
   * @param {Date} startDate - Start date (optional)
   * @param {Date} endDate - End date (optional)
   * @returns {Promise<Object>} Statistics object
   */
  async getStatistics(startDate = null, endDate = null) {
    let sql = `
      SELECT 
        COUNT(*) as total_logs,
        COUNT(DISTINCT actor_id) as unique_actors,
        COUNT(DISTINCT entity_id) as unique_entities,
        COUNT(*) FILTER (WHERE timestamp > NOW() - INTERVAL '24 hours') as last_24h,
        COUNT(*) FILTER (WHERE timestamp > NOW() - INTERVAL '7 days') as last_7d,
        COUNT(*) FILTER (WHERE timestamp > NOW() - INTERVAL '30 days') as last_30d
      FROM audit_logs
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;

    if (startDate) {
      sql += ` AND timestamp >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      sql += ` AND timestamp <= $${paramCount}`;
      params.push(endDate);
    }

    const result = await query(sql, params);
    return result.rows[0];
  }

  /**
   * Get action statistics
   * @param {Date} startDate - Start date (optional)
   * @param {Date} endDate - End date (optional)
   * @returns {Promise<Array>} Array of action counts
   */
  async getActionStatistics(startDate = null, endDate = null) {
    let sql = `
      SELECT 
        action,
        COUNT(*) as count
      FROM audit_logs
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;

    if (startDate) {
      sql += ` AND timestamp >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      sql += ` AND timestamp <= $${paramCount}`;
      params.push(endDate);
    }

    sql += ' GROUP BY action ORDER BY count DESC';

    const result = await query(sql, params);
    return result.rows;
  }

  /**
   * Delete old logs (for cleanup)
   * @param {Date} beforeDate - Delete logs before this date
   * @returns {Promise<number>} Number of deleted logs
   */
  async deleteOldLogs(beforeDate) {
    const result = await query(
      'DELETE FROM audit_logs WHERE timestamp < $1 RETURNING id',
      [beforeDate]
    );

    return result.rows.length;
  }

  /**
   * Parse JSONB fields from database row
   * @param {Object} row - Database row
   * @returns {Object} Parsed row
   */
  parseJsonFields(row) {
    if (!row) return null;

    return {
      ...row,
      before_state: row.before_state && typeof row.before_state === 'string' 
        ? JSON.parse(row.before_state) 
        : row.before_state,
      after_state: row.after_state && typeof row.after_state === 'string' 
        ? JSON.parse(row.after_state) 
        : row.after_state
    };
  }
}

module.exports = new AuditLogRepository();

// Made with Bob
