/**
 * Application Repository
 * 
 * Handles all database operations for applications table.
 * Manages JSONB fields for flexible application data structure.
 */

const { query, transaction } = require('../pool');

class ApplicationRepository {
  /**
   * Create a new application
   * @param {Object} applicationData - Application data
   * @returns {Promise<Object>} Created application
   */
  async create(applicationData) {
    const result = await query(`
      INSERT INTO applications (
        application_number, status, owner_user_id,
        applicant, loan_request, financial_snapshot, collateral, owner_info,
        submitted_at, completed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      applicationData.application_number,
      applicationData.status,
      applicationData.owner_user_id,
      JSON.stringify(applicationData.applicant),
      JSON.stringify(applicationData.loan_request),
      JSON.stringify(applicationData.financial_snapshot),
      JSON.stringify(applicationData.collateral),
      JSON.stringify(applicationData.owner_info),
      applicationData.submitted_at || null,
      applicationData.completed_at || null
    ]);
    
    return this.parseJsonFields(result.rows[0]);
  }

  /**
   * Find application by ID
   * @param {string} id - Application ID
   * @returns {Promise<Object|null>} Application or null
   */
  async findById(id) {
    const result = await query(
      'SELECT * FROM applications WHERE id = $1',
      [id]
    );
    
    return result.rows[0] ? this.parseJsonFields(result.rows[0]) : null;
  }

  /**
   * Find application by application number
   * @param {string} applicationNumber - Application number
   * @returns {Promise<Object|null>} Application or null
   */
  async findByApplicationNumber(applicationNumber) {
    const result = await query(
      'SELECT * FROM applications WHERE application_number = $1',
      [applicationNumber]
    );
    
    return result.rows[0] ? this.parseJsonFields(result.rows[0]) : null;
  }

  /**
   * Get all applications with optional filters
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of applications
   */
  async findAll(filters = {}) {
    let sql = 'SELECT * FROM applications WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (filters.status) {
      sql += ` AND status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters.owner_user_id) {
      sql += ` AND owner_user_id = $${paramCount}`;
      params.push(filters.owner_user_id);
      paramCount++;
    }

    if (filters.search) {
      sql += ` AND (
        application_number ILIKE $${paramCount} OR
        applicant->>'legal_name' ILIKE $${paramCount}
      )`;
      params.push(`%${filters.search}%`);
      paramCount++;
    }

    // Date range filters
    if (filters.created_after) {
      sql += ` AND created_at >= $${paramCount}`;
      params.push(filters.created_after);
      paramCount++;
    }

    if (filters.created_before) {
      sql += ` AND created_at <= $${paramCount}`;
      params.push(filters.created_before);
      paramCount++;
    }

    sql += ' ORDER BY updated_at DESC';

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
   * Update application
   * @param {string} id - Application ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated application
   */
  async update(id, updates) {
    const allowedFields = [
      'status', 'applicant', 'loan_request', 'financial_snapshot',
      'collateral', 'owner_info', 'submitted_at', 'completed_at'
    ];
    
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        // Handle JSONB fields
        if (['applicant', 'loan_request', 'financial_snapshot', 'collateral', 'owner_info'].includes(key)) {
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
      UPDATE applications 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      throw new Error('Application not found');
    }

    return this.parseJsonFields(result.rows[0]);
  }

  /**
   * Update application status
   * @param {string} id - Application ID
   * @param {string} status - New status
   * @param {Object} additionalUpdates - Additional fields to update
   * @returns {Promise<Object>} Updated application
   */
  async updateStatus(id, status, additionalUpdates = {}) {
    const updates = { status, ...additionalUpdates };
    return this.update(id, updates);
  }

  /**
   * Delete application
   * @param {string} id - Application ID
   * @returns {Promise<boolean>} True if deleted
   */
  async delete(id) {
    const result = await query(
      'DELETE FROM applications WHERE id = $1 RETURNING id',
      [id]
    );

    return result.rows.length > 0;
  }

  /**
   * Get applications by status
   * @param {string} status - Application status
   * @returns {Promise<Array>} Array of applications
   */
  async findByStatus(status) {
    const result = await query(
      'SELECT * FROM applications WHERE status = $1 ORDER BY updated_at DESC',
      [status]
    );

    return result.rows.map(row => this.parseJsonFields(row));
  }

  /**
   * Get applications by owner
   * @param {string} ownerId - Owner user ID
   * @returns {Promise<Array>} Array of applications
   */
  async findByOwner(ownerId) {
    const result = await query(
      'SELECT * FROM applications WHERE owner_user_id = $1 ORDER BY updated_at DESC',
      [ownerId]
    );

    return result.rows.map(row => this.parseJsonFields(row));
  }

  /**
   * Count applications by status
   * @returns {Promise<Object>} Status counts
   */
  async countByStatus() {
    const result = await query(`
      SELECT status, COUNT(*) as count
      FROM applications
      GROUP BY status
    `);

    const counts = {};
    result.rows.forEach(row => {
      counts[row.status] = parseInt(row.count);
    });

    return counts;
  }

  /**
   * Get application statistics
   * @returns {Promise<Object>} Statistics object
   */
  async getStatistics() {
    const result = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'Draft') as draft_count,
        COUNT(*) FILTER (WHERE status = 'Submitted') as submitted_count,
        COUNT(*) FILTER (WHERE status = 'In Review') as in_review_count,
        COUNT(*) FILTER (WHERE status = 'Approved') as approved_count,
        COUNT(*) FILTER (WHERE status = 'Rejected') as rejected_count,
        COUNT(*) FILTER (WHERE status = 'Completed') as completed_count,
        SUM((loan_request->>'amount')::numeric) as total_amount,
        AVG((loan_request->>'amount')::numeric) as avg_amount,
        MIN((loan_request->>'amount')::numeric) as min_amount,
        MAX((loan_request->>'amount')::numeric) as max_amount
      FROM applications
    `);

    return result.rows[0];
  }

  /**
   * Search applications by applicant name or application number
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Array of applications
   */
  async search(searchTerm) {
    const result = await query(`
      SELECT * FROM applications
      WHERE 
        application_number ILIKE $1 OR
        applicant->>'legal_name' ILIKE $1
      ORDER BY updated_at DESC
      LIMIT 50
    `, [`%${searchTerm}%`]);

    return result.rows.map(row => this.parseJsonFields(row));
  }

  /**
   * Get applications with related data counts
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of applications with counts
   */
  async findAllWithCounts(filters = {}) {
    let sql = `
      SELECT 
        a.*,
        COUNT(DISTINCT d.id) as document_count,
        EXISTS(SELECT 1 FROM agent_reviews ar WHERE ar.application_id = a.id) as has_agent_review,
        EXISTS(SELECT 1 FROM analyses an WHERE an.application_id = a.id) as has_analysis,
        EXISTS(SELECT 1 FROM decisions dc WHERE dc.application_id = a.id) as has_decision
      FROM applications a
      LEFT JOIN documents d ON d.application_id = a.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;

    if (filters.status) {
      sql += ` AND a.status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters.owner_user_id) {
      sql += ` AND a.owner_user_id = $${paramCount}`;
      params.push(filters.owner_user_id);
      paramCount++;
    }

    sql += ' GROUP BY a.id ORDER BY a.updated_at DESC';

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
      applicant: typeof row.applicant === 'string' ? JSON.parse(row.applicant) : row.applicant,
      loan_request: typeof row.loan_request === 'string' ? JSON.parse(row.loan_request) : row.loan_request,
      financial_snapshot: typeof row.financial_snapshot === 'string' ? JSON.parse(row.financial_snapshot) : row.financial_snapshot,
      collateral: typeof row.collateral === 'string' ? JSON.parse(row.collateral) : row.collateral,
      owner_info: typeof row.owner_info === 'string' ? JSON.parse(row.owner_info) : row.owner_info
    };
  }

  /**
   * Generate next application number
   * @returns {Promise<string>} Next application number
   */
  async generateApplicationNumber() {
    const year = new Date().getFullYear();
    const result = await query(`
      SELECT COUNT(*) as count
      FROM applications
      WHERE application_number LIKE $1
    `, [`APP-${year}-%`]);

    const count = parseInt(result.rows[0].count);
    return `APP-${year}-${String(count + 1).padStart(4, '0')}`;
  }
}

module.exports = new ApplicationRepository();

// Made with Bob
