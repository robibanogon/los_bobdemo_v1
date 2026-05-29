/**
 * Decision Repository
 * 
 * Handles all database operations for decisions table.
 */

const { query } = require('../pool');

class DecisionRepository {
  /**
   * Create a new decision
   * @param {Object} decisionData - Decision data
   * @returns {Promise<Object>} Created decision
   */
  async create(decisionData) {
    const result = await query(`
      INSERT INTO decisions (
        application_id, recommended_by, recommended_decision, recommended_at,
        approver_id, final_decision, decided_at, conditions, rejection_reason, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      decisionData.application_id,
      decisionData.recommended_by || null,
      decisionData.recommended_decision || null,
      decisionData.recommended_at || null,
      decisionData.approver_id || null,
      decisionData.final_decision || null,
      decisionData.decided_at || null,
      JSON.stringify(decisionData.conditions || []),
      decisionData.rejection_reason || null,
      decisionData.notes || null
    ]);
    
    return this.parseJsonFields(result.rows[0]);
  }

  /**
   * Find decision by ID
   * @param {string} id - Decision ID
   * @returns {Promise<Object|null>} Decision or null
   */
  async findById(id) {
    const result = await query(
      'SELECT * FROM decisions WHERE id = $1',
      [id]
    );
    
    return result.rows[0] ? this.parseJsonFields(result.rows[0]) : null;
  }

  /**
   * Find decision by application ID
   * @param {string} applicationId - Application ID
   * @returns {Promise<Object|null>} Decision or null
   */
  async findByApplicationId(applicationId) {
    const result = await query(
      'SELECT * FROM decisions WHERE application_id = $1',
      [applicationId]
    );
    
    return result.rows[0] ? this.parseJsonFields(result.rows[0]) : null;
  }

  /**
   * Update decision
   * @param {string} id - Decision ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated decision
   */
  async update(id, updates) {
    const allowedFields = [
      'recommended_by', 'recommended_decision', 'recommended_at',
      'approver_id', 'final_decision', 'decided_at', 
      'conditions', 'rejection_reason', 'notes'
    ];
    
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        if (key === 'conditions') {
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
      UPDATE decisions 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      throw new Error('Decision not found');
    }

    return this.parseJsonFields(result.rows[0]);
  }

  /**
   * Update decision by application ID
   * @param {string} applicationId - Application ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated decision
   */
  async updateByApplicationId(applicationId, updates) {
    const allowedFields = [
      'recommended_by', 'recommended_decision', 'recommended_at',
      'approver_id', 'final_decision', 'decided_at', 
      'conditions', 'rejection_reason', 'notes'
    ];
    
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        if (key === 'conditions') {
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
      UPDATE decisions 
      SET ${fields.join(', ')}
      WHERE application_id = $${paramCount}
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      throw new Error('Decision not found');
    }

    return this.parseJsonFields(result.rows[0]);
  }

  /**
   * Set recommendation
   * @param {string} applicationId - Application ID
   * @param {string} recommendedBy - User ID who recommended
   * @param {string} recommendedDecision - Recommended decision
   * @param {string} notes - Optional notes
   * @returns {Promise<Object>} Updated decision
   */
  async setRecommendation(applicationId, recommendedBy, recommendedDecision, notes = null) {
    const updates = {
      recommended_by: recommendedBy,
      recommended_decision: recommendedDecision,
      recommended_at: new Date().toISOString(),
      notes
    };

    // Try to update existing decision
    const existing = await this.findByApplicationId(applicationId);
    
    if (existing) {
      return this.updateByApplicationId(applicationId, updates);
    } else {
      // Create new decision
      return this.create({
        application_id: applicationId,
        ...updates
      });
    }
  }

  /**
   * Set final decision
   * @param {string} applicationId - Application ID
   * @param {string} approverId - User ID who approved
   * @param {string} finalDecision - Final decision
   * @param {Array} conditions - Approval conditions
   * @param {string} rejectionReason - Rejection reason if rejected
   * @param {string} notes - Optional notes
   * @returns {Promise<Object>} Updated decision
   */
  async setFinalDecision(applicationId, approverId, finalDecision, conditions = [], rejectionReason = null, notes = null) {
    const updates = {
      approver_id: approverId,
      final_decision: finalDecision,
      decided_at: new Date().toISOString(),
      conditions,
      rejection_reason: rejectionReason,
      notes
    };

    const existing = await this.findByApplicationId(applicationId);
    
    if (existing) {
      return this.updateByApplicationId(applicationId, updates);
    } else {
      return this.create({
        application_id: applicationId,
        ...updates
      });
    }
  }

  /**
   * Delete decision
   * @param {string} id - Decision ID
   * @returns {Promise<boolean>} True if deleted
   */
  async delete(id) {
    const result = await query(
      'DELETE FROM decisions WHERE id = $1 RETURNING id',
      [id]
    );

    return result.rows.length > 0;
  }

  /**
   * Delete decision by application ID
   * @param {string} applicationId - Application ID
   * @returns {Promise<boolean>} True if deleted
   */
  async deleteByApplicationId(applicationId) {
    const result = await query(
      'DELETE FROM decisions WHERE application_id = $1 RETURNING id',
      [applicationId]
    );

    return result.rows.length > 0;
  }

  /**
   * Check if decision exists for application
   * @param {string} applicationId - Application ID
   * @returns {Promise<boolean>} True if exists
   */
  async existsForApplication(applicationId) {
    const result = await query(
      'SELECT 1 FROM decisions WHERE application_id = $1',
      [applicationId]
    );

    return result.rows.length > 0;
  }

  /**
   * Get all decisions with optional filters
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of decisions
   */
  async findAll(filters = {}) {
    let sql = 'SELECT * FROM decisions WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (filters.recommended_by) {
      sql += ` AND recommended_by = $${paramCount}`;
      params.push(filters.recommended_by);
      paramCount++;
    }

    if (filters.approver_id) {
      sql += ` AND approver_id = $${paramCount}`;
      params.push(filters.approver_id);
      paramCount++;
    }

    if (filters.final_decision) {
      sql += ` AND final_decision = $${paramCount}`;
      params.push(filters.final_decision);
      paramCount++;
    }

    sql += ' ORDER BY decided_at DESC NULLS LAST';

    if (filters.limit) {
      sql += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }

    const result = await query(sql, params);
    return result.rows.map(row => this.parseJsonFields(row));
  }

  /**
   * Get decision statistics
   * @returns {Promise<Object>} Statistics object
   */
  async getStatistics() {
    const result = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE final_decision = 'Approved') as approved_count,
        COUNT(*) FILTER (WHERE final_decision = 'Rejected') as rejected_count,
        COUNT(*) FILTER (WHERE final_decision IS NULL) as pending_count,
        COUNT(*) FILTER (WHERE recommended_decision IS NOT NULL) as recommended_count
      FROM decisions
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
      conditions: typeof row.conditions === 'string' ? JSON.parse(row.conditions) : row.conditions
    };
  }
}

module.exports = new DecisionRepository();

// Made with Bob
