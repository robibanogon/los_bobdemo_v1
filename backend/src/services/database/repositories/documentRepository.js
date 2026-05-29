/**
 * Document Repository
 * 
 * Handles all database operations for documents table.
 * Manages document metadata with S3 storage references.
 */

const { query, transaction } = require('../pool');

class DocumentRepository {
  /**
   * Create a new document record
   * @param {Object} documentData - Document data
   * @returns {Promise<Object>} Created document
   */
  async create(documentData) {
    const result = await query(`
      INSERT INTO documents (
        application_id, doc_type, filename, original_filename,
        s3_key, s3_bucket, file_size, mime_type, uploaded_by, extracted_fields
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      documentData.application_id,
      documentData.doc_type,
      documentData.filename,
      documentData.original_filename,
      documentData.s3_key,
      documentData.s3_bucket,
      documentData.file_size,
      documentData.mime_type,
      documentData.uploaded_by,
      JSON.stringify(documentData.extracted_fields || {})
    ]);
    
    return this.parseJsonFields(result.rows[0]);
  }

  /**
   * Find document by ID
   * @param {string} id - Document ID
   * @returns {Promise<Object|null>} Document or null
   */
  async findById(id) {
    const result = await query(
      'SELECT * FROM documents WHERE id = $1',
      [id]
    );
    
    return result.rows[0] ? this.parseJsonFields(result.rows[0]) : null;
  }

  /**
   * Find all documents for an application
   * @param {string} applicationId - Application ID
   * @returns {Promise<Array>} Array of documents
   */
  async findByApplicationId(applicationId) {
    const result = await query(
      'SELECT * FROM documents WHERE application_id = $1 ORDER BY uploaded_at DESC',
      [applicationId]
    );
    
    return result.rows.map(row => this.parseJsonFields(row));
  }

  /**
   * Find documents by type
   * @param {string} applicationId - Application ID
   * @param {string} docType - Document type
   * @returns {Promise<Array>} Array of documents
   */
  async findByType(applicationId, docType) {
    const result = await query(
      'SELECT * FROM documents WHERE application_id = $1 AND doc_type = $2 ORDER BY uploaded_at DESC',
      [applicationId, docType]
    );
    
    return result.rows.map(row => this.parseJsonFields(row));
  }

  /**
   * Get all documents with optional filters
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of documents
   */
  async findAll(filters = {}) {
    let sql = 'SELECT * FROM documents WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (filters.application_id) {
      sql += ` AND application_id = $${paramCount}`;
      params.push(filters.application_id);
      paramCount++;
    }

    if (filters.doc_type) {
      sql += ` AND doc_type = $${paramCount}`;
      params.push(filters.doc_type);
      paramCount++;
    }

    if (filters.uploaded_by) {
      sql += ` AND uploaded_by = $${paramCount}`;
      params.push(filters.uploaded_by);
      paramCount++;
    }

    sql += ' ORDER BY uploaded_at DESC';

    if (filters.limit) {
      sql += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
      paramCount++;
    }

    const result = await query(sql, params);
    return result.rows.map(row => this.parseJsonFields(row));
  }

  /**
   * Update document metadata
   * @param {string} id - Document ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated document
   */
  async update(id, updates) {
    const allowedFields = ['doc_type', 'extracted_fields'];
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        if (key === 'extracted_fields') {
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
      UPDATE documents 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      throw new Error('Document not found');
    }

    return this.parseJsonFields(result.rows[0]);
  }

  /**
   * Delete document
   * @param {string} id - Document ID
   * @returns {Promise<Object>} Deleted document info (for S3 cleanup)
   */
  async delete(id) {
    const result = await query(
      'DELETE FROM documents WHERE id = $1 RETURNING s3_key, s3_bucket',
      [id]
    );

    if (result.rows.length === 0) {
      throw new Error('Document not found');
    }

    return result.rows[0];
  }

  /**
   * Delete all documents for an application
   * @param {string} applicationId - Application ID
   * @returns {Promise<Array>} Array of deleted document info (for S3 cleanup)
   */
  async deleteByApplicationId(applicationId) {
    const result = await query(
      'DELETE FROM documents WHERE application_id = $1 RETURNING s3_key, s3_bucket',
      [applicationId]
    );

    return result.rows;
  }

  /**
   * Count documents by application
   * @param {string} applicationId - Application ID
   * @returns {Promise<number>} Document count
   */
  async countByApplicationId(applicationId) {
    const result = await query(
      'SELECT COUNT(*) as count FROM documents WHERE application_id = $1',
      [applicationId]
    );

    return parseInt(result.rows[0].count);
  }

  /**
   * Count documents by type
   * @param {string} applicationId - Application ID
   * @returns {Promise<Object>} Type counts
   */
  async countByType(applicationId) {
    const result = await query(`
      SELECT doc_type, COUNT(*) as count
      FROM documents
      WHERE application_id = $1
      GROUP BY doc_type
    `, [applicationId]);

    const counts = {};
    result.rows.forEach(row => {
      counts[row.doc_type] = parseInt(row.count);
    });

    return counts;
  }

  /**
   * Get total storage size for an application
   * @param {string} applicationId - Application ID
   * @returns {Promise<number>} Total size in bytes
   */
  async getTotalSize(applicationId) {
    const result = await query(
      'SELECT SUM(file_size) as total_size FROM documents WHERE application_id = $1',
      [applicationId]
    );

    return parseInt(result.rows[0].total_size || 0);
  }

  /**
   * Get document statistics
   * @returns {Promise<Object>} Statistics object
   */
  async getStatistics() {
    const result = await query(`
      SELECT 
        COUNT(*) as total_documents,
        COUNT(DISTINCT application_id) as applications_with_documents,
        SUM(file_size) as total_storage_bytes,
        AVG(file_size) as avg_file_size,
        MAX(file_size) as max_file_size
      FROM documents
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
      extracted_fields: typeof row.extracted_fields === 'string' 
        ? JSON.parse(row.extracted_fields) 
        : row.extracted_fields
    };
  }
}

module.exports = new DocumentRepository();

// Made with Bob
