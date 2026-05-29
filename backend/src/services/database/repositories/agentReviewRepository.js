/**
 * Agent Review Repository
 * 
 * Handles all database operations for agent_reviews table.
 */

const { query } = require('../pool');

class AgentReviewRepository {
  /**
   * Create a new agent review
   * @param {Object} reviewData - Review data
   * @returns {Promise<Object>} Created review
   */
  async create(reviewData) {
    const result = await query(`
      INSERT INTO agent_reviews (
        application_id, review_data, created_by
      ) VALUES ($1, $2, $3)
      RETURNING *
    `, [
      reviewData.application_id,
      JSON.stringify(reviewData.review_data),
      reviewData.created_by
    ]);
    
    return this.parseJsonFields(result.rows[0]);
  }

  /**
   * Find review by ID
   * @param {string} id - Review ID
   * @returns {Promise<Object|null>} Review or null
   */
  async findById(id) {
    const result = await query(
      'SELECT * FROM agent_reviews WHERE id = $1',
      [id]
    );
    
    return result.rows[0] ? this.parseJsonFields(result.rows[0]) : null;
  }

  /**
   * Find review by application ID
   * @param {string} applicationId - Application ID
   * @returns {Promise<Object|null>} Review or null
   */
  async findByApplicationId(applicationId) {
    const result = await query(
      'SELECT * FROM agent_reviews WHERE application_id = $1',
      [applicationId]
    );
    
    return result.rows[0] ? this.parseJsonFields(result.rows[0]) : null;
  }

  /**
   * Update review
   * @param {string} id - Review ID
   * @param {Object} reviewData - Updated review data
   * @returns {Promise<Object>} Updated review
   */
  async update(id, reviewData) {
    const result = await query(`
      UPDATE agent_reviews 
      SET review_data = $1
      WHERE id = $2
      RETURNING *
    `, [JSON.stringify(reviewData), id]);

    if (result.rows.length === 0) {
      throw new Error('Agent review not found');
    }

    return this.parseJsonFields(result.rows[0]);
  }

  /**
   * Update review by application ID
   * @param {string} applicationId - Application ID
   * @param {Object} reviewData - Updated review data
   * @returns {Promise<Object>} Updated review
   */
  async updateByApplicationId(applicationId, reviewData) {
    const result = await query(`
      UPDATE agent_reviews 
      SET review_data = $1
      WHERE application_id = $2
      RETURNING *
    `, [JSON.stringify(reviewData), applicationId]);

    if (result.rows.length === 0) {
      throw new Error('Agent review not found');
    }

    return this.parseJsonFields(result.rows[0]);
  }

  /**
   * Delete review
   * @param {string} id - Review ID
   * @returns {Promise<boolean>} True if deleted
   */
  async delete(id) {
    const result = await query(
      'DELETE FROM agent_reviews WHERE id = $1 RETURNING id',
      [id]
    );

    return result.rows.length > 0;
  }

  /**
   * Delete review by application ID
   * @param {string} applicationId - Application ID
   * @returns {Promise<boolean>} True if deleted
   */
  async deleteByApplicationId(applicationId) {
    const result = await query(
      'DELETE FROM agent_reviews WHERE application_id = $1 RETURNING id',
      [applicationId]
    );

    return result.rows.length > 0;
  }

  /**
   * Check if review exists for application
   * @param {string} applicationId - Application ID
   * @returns {Promise<boolean>} True if exists
   */
  async existsForApplication(applicationId) {
    const result = await query(
      'SELECT 1 FROM agent_reviews WHERE application_id = $1',
      [applicationId]
    );

    return result.rows.length > 0;
  }

  /**
   * Get all reviews with optional filters
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of reviews
   */
  async findAll(filters = {}) {
    let sql = 'SELECT * FROM agent_reviews WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (filters.created_by) {
      sql += ` AND created_by = $${paramCount}`;
      params.push(filters.created_by);
      paramCount++;
    }

    sql += ' ORDER BY created_at DESC';

    if (filters.limit) {
      sql += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }

    const result = await query(sql, params);
    return result.rows.map(row => this.parseJsonFields(row));
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
      review_data: typeof row.review_data === 'string' 
        ? JSON.parse(row.review_data) 
        : row.review_data
    };
  }
}

module.exports = new AgentReviewRepository();

// Made with Bob
