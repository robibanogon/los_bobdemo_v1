/**
 * User Repository
 * 
 * Handles all database operations for users table.
 * Implements repository pattern for clean separation of concerns.
 */

const { query, transaction } = require('../pool');

class UserRepository {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async create(userData) {
    const result = await query(`
      INSERT INTO users (
        username, password_hash, name, role, email, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      userData.username,
      userData.password_hash,
      userData.name,
      userData.role,
      userData.email,
      userData.is_active !== false
    ]);
    
    return result.rows[0];
  }

  /**
   * Find user by ID
   * @param {string} id - User ID
   * @returns {Promise<Object|null>} User or null
   */
  async findById(id) {
    const result = await query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    
    return result.rows[0] || null;
  }

  /**
   * Find user by username
   * @param {string} username - Username
   * @returns {Promise<Object|null>} User or null
   */
  async findByUsername(username) {
    const result = await query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    
    return result.rows[0] || null;
  }

  /**
   * Find user by email
   * @param {string} email - Email address
   * @returns {Promise<Object|null>} User or null
   */
  async findByEmail(email) {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    return result.rows[0] || null;
  }

  /**
   * Get all users with optional filters
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of users
   */
  async findAll(filters = {}) {
    let sql = 'SELECT * FROM users WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (filters.role) {
      sql += ` AND role = $${paramCount}`;
      params.push(filters.role);
      paramCount++;
    }

    if (filters.is_active !== undefined) {
      sql += ` AND is_active = $${paramCount}`;
      params.push(filters.is_active);
      paramCount++;
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);
    return result.rows;
  }

  /**
   * Update user
   * @param {string} id - User ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated user
   */
  async update(id, updates) {
    const allowedFields = ['name', 'email', 'role', 'is_active', 'password_hash'];
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(id);

    const result = await query(`
      UPDATE users 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0];
  }

  /**
   * Update last login timestamp
   * @param {string} id - User ID
   * @returns {Promise<Object>} Updated user
   */
  async updateLastLogin(id) {
    const result = await query(`
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id]);

    return result.rows[0];
  }

  /**
   * Delete user (soft delete by setting is_active to false)
   * @param {string} id - User ID
   * @returns {Promise<boolean>} True if deleted
   */
  async delete(id) {
    const result = await query(
      'UPDATE users SET is_active = false WHERE id = $1 RETURNING id',
      [id]
    );

    return result.rows.length > 0;
  }

  /**
   * Hard delete user (permanent deletion)
   * @param {string} id - User ID
   * @returns {Promise<boolean>} True if deleted
   */
  async hardDelete(id) {
    const result = await query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );

    return result.rows.length > 0;
  }

  /**
   * Check if username exists
   * @param {string} username - Username to check
   * @param {string} excludeId - User ID to exclude from check
   * @returns {Promise<boolean>} True if exists
   */
  async usernameExists(username, excludeId = null) {
    let sql = 'SELECT 1 FROM users WHERE username = $1';
    const params = [username];

    if (excludeId) {
      sql += ' AND id != $2';
      params.push(excludeId);
    }

    const result = await query(sql, params);
    return result.rows.length > 0;
  }

  /**
   * Check if email exists
   * @param {string} email - Email to check
   * @param {string} excludeId - User ID to exclude from check
   * @returns {Promise<boolean>} True if exists
   */
  async emailExists(email, excludeId = null) {
    let sql = 'SELECT 1 FROM users WHERE email = $1';
    const params = [email];

    if (excludeId) {
      sql += ' AND id != $2';
      params.push(excludeId);
    }

    const result = await query(sql, params);
    return result.rows.length > 0;
  }

  /**
   * Get user statistics by role
   * @returns {Promise<Object>} Statistics object
   */
  async getStatistics() {
    const result = await query(`
      SELECT 
        role,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE is_active = true) as active_count,
        COUNT(*) FILTER (WHERE last_login > NOW() - INTERVAL '30 days') as recent_login_count
      FROM users
      GROUP BY role
    `);

    return result.rows;
  }
}

module.exports = new UserRepository();

// Made with Bob
