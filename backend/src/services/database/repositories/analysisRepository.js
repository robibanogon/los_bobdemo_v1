/**
 * Analysis Repository
 * 
 * Handles all database operations for analyses table.
 */

const { query } = require('../pool');

class AnalysisRepository {
  /**
   * Create a new analysis
   * @param {Object} analysisData - Analysis data
   * @returns {Promise<Object>} Created analysis
   */
  async create(analysisData) {
    const result = await query(`
      INSERT INTO analyses (
        application_id, dscr, net_operating_cashflow, collateral_coverage,
        risk_score, metrics, assumptions, flags, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      analysisData.application_id,
      analysisData.dscr || null,
      analysisData.net_operating_cashflow || null,
      analysisData.collateral_coverage || null,
      analysisData.risk_score || null,
      JSON.stringify(analysisData.metrics || {}),
      JSON.stringify(analysisData.assumptions || {}),
      JSON.stringify(analysisData.flags || []),
      analysisData.created_by
    ]);
    
    return this.parseJsonFields(result.rows[0]);
  }

  /**
   * Find analysis by ID
   * @param {string} id - Analysis ID
   * @returns {Promise<Object|null>} Analysis or null
   */
  async findById(id) {
    const result = await query(
      'SELECT * FROM analyses WHERE id = $1',
      [id]
    );
    
    return result.rows[0] ? this.parseJsonFields(result.rows[0]) : null;
  }

  /**
   * Find analysis by application ID
   * @param {string} applicationId - Application ID
   * @returns {Promise<Object|null>} Analysis or null
   */
  async findByApplicationId(applicationId) {
    const result = await query(
      'SELECT * FROM analyses WHERE application_id = $1',
      [applicationId]
    );
    
    return result.rows[0] ? this.parseJsonFields(result.rows[0]) : null;
  }

  /**
   * Update analysis
   * @param {string} id - Analysis ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated analysis
   */
  async update(id, updates) {
    const allowedFields = [
      'dscr', 'net_operating_cashflow', 'collateral_coverage',
      'risk_score', 'metrics', 'assumptions', 'flags'
    ];
    
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        if (['metrics', 'assumptions', 'flags'].includes(key)) {
          fields.push(`${key} = $${paramCount}`);
          values.push(JSON.stringify(updates[key]));
        } else {
          fields.push(`${key} = $${paramCount}`);
          values.push(updates[key]);
        }
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(id);

    const result = await query(`
      UPDATE analyses 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      throw new Error('Analysis not found');
    }

    return this.parseJsonFields(result.rows[0]);
  }

  /**
   * Update analysis by application ID
   * @param {string} applicationId - Application ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated analysis
   */
  async updateByApplicationId(applicationId, updates) {
    const allowedFields = [
      'dscr', 'net_operating_cashflow', 'collateral_coverage',
      'risk_score', 'metrics', 'assumptions', 'flags'
    ];
    
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        if (['metrics', 'assumptions', 'flags'].includes(key)) {
          fields.push(`${key} = $${paramCount}`);
          values.push(JSON.stringify(updates[key]));
        } else {
          fields.push(`${key} = $${paramCount}`);
          values.push(updates[key]);
        }
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(applicationId);

    const result = await query(`
      UPDATE analyses 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE application_id = $${paramCount}
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      throw new Error('Analysis not found');
    }

    return this.parseJsonFields(result.rows[0]);
  }

  /**
   * Delete analysis
   * @param {string} id - Analysis ID
   * @returns {Promise<boolean>} True if deleted
   */
  async delete(id) {
    const result = await query(
      'DELETE FROM analyses WHERE id = $1 RETURNING id',
      [id]
    );

    return result.rows.length > 0;
  }

  /**
   * Delete analysis by application ID
   * @param {string} applicationId - Application ID
   * @returns {Promise<boolean>} True if deleted
   */
  async deleteByApplicationId(applicationId) {
    const result = await query(
      'DELETE FROM analyses WHERE application_id = $1 RETURNING id',
      [applicationId]
    );

    return result.rows.length > 0;
  }

  /**
   * Check if analysis exists for application
   * @param {string} applicationId - Application ID
   * @returns {Promise<boolean>} True if exists
   */
  async existsForApplication(applicationId) {
    const result = await query(
      'SELECT 1 FROM analyses WHERE application_id = $1',
      [applicationId]
    );

    return result.rows.length > 0;
  }

  /**
   * Get all analyses with optional filters
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of analyses
   */
  async findAll(filters = {}) {
    let sql = 'SELECT * FROM analyses WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (filters.created_by) {
      sql += ` AND created_by = $${paramCount}`;
      params.push(filters.created_by);
      paramCount++;
    }

    if (filters.min_risk_score !== undefined) {
      sql += ` AND risk_score >= $${paramCount}`;
      params.push(filters.min_risk_score);
      paramCount++;
    }

    if (filters.max_risk_score !== undefined) {
      sql += ` AND risk_score <= $${paramCount}`;
      params.push(filters.max_risk_score);
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
   * Get analysis statistics
   * @returns {Promise<Object>} Statistics object
   */
  async getStatistics() {
    const result = await query(`
      SELECT 
        COUNT(*) as total,
        AVG(dscr) as avg_dscr,
        AVG(risk_score) as avg_risk_score,
        AVG(collateral_coverage) as avg_collateral_coverage,
        COUNT(*) FILTER (WHERE risk_score < 30) as low_risk_count,
        COUNT(*) FILTER (WHERE risk_score >= 30 AND risk_score < 70) as medium_risk_count,
        COUNT(*) FILTER (WHERE risk_score >= 70) as high_risk_count
      FROM analyses
    `);

    return result.rows[0];
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
      metrics: typeof row.metrics === 'string' ? JSON.parse(row.metrics) : row.metrics,
      assumptions: typeof row.assumptions === 'string' ? JSON.parse(row.assumptions) : row.assumptions,
      flags: typeof row.flags === 'string' ? JSON.parse(row.flags) : row.flags
    };
  }
}

module.exports = new AnalysisRepository();

// Made with Bob
