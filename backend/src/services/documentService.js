const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;
const fileStorage = require('../utils/fileStorage');
const auditService = require('./auditService');

class DocumentService {
  constructor() {
    this.uploadsDir = path.join(__dirname, '../../data/uploads');
  }

  async ensureUploadsDir() {
    try {
      await fs.access(this.uploadsDir);
    } catch {
      await fs.mkdir(this.uploadsDir, { recursive: true });
    }
  }

  async create(documentData, userId, userName) {
    await this.ensureUploadsDir();

    const document = {
      id: uuidv4(),
      application_id: documentData.application_id,
      doc_type: documentData.doc_type,
      filename: documentData.filename,
      original_filename: documentData.original_filename,
      storage_path: documentData.storage_path,
      file_size: documentData.file_size,
      mime_type: documentData.mime_type,
      uploaded_by: userId,
      uploaded_at: new Date().toISOString(),
      extracted_fields: documentData.extracted_fields || {}
    };

    await fileStorage.append('documents', document);

    // Log upload
    await auditService.log({
      actor_id: userId,
      actor_name: userName,
      action: auditService.ACTIONS.UPLOAD_DOCUMENT,
      entity_type: 'Document',
      entity_id: document.id,
      after: document
    });

    return document;
  }

  async getByApplication(applicationId) {
    const documents = await fileStorage.read('documents');
    return documents.filter(doc => doc.application_id === applicationId);
  }

  async getById(id) {
    const document = await fileStorage.findById('documents', id);
    
    if (!document) {
      throw new Error('Document not found');
    }

    return document;
  }

  async delete(id, userId, userName) {
    const document = await this.getById(id);

    // Delete physical file
    try {
      await fs.unlink(document.storage_path);
    } catch (error) {
      console.error('Error deleting file:', error);
    }

    await fileStorage.delete('documents', id);

    // Log deletion
    await auditService.log({
      actor_id: userId,
      actor_name: userName,
      action: auditService.ACTIONS.DELETE_DOCUMENT,
      entity_type: 'Document',
      entity_id: id,
      before: document
    });

    return true;
  }

  async updateExtractedFields(id, extractedFields, userId, userName) {
    const result = await fileStorage.update('documents', id, {
      extracted_fields: extractedFields
    });

    // Log update
    await auditService.log({
      actor_id: userId,
      actor_name: userName,
      action: 'UPDATE_DOCUMENT_FIELDS',
      entity_type: 'Document',
      entity_id: id,
      before: { extracted_fields: result.old.extracted_fields },
      after: { extracted_fields: extractedFields }
    });

    return result.new;
  }

  async getRequiredDocuments() {
    const policyPath = path.join(__dirname, '../config/policy.json');
    const policyData = await fs.readFile(policyPath, 'utf8');
    const policy = JSON.parse(policyData);
    return policy.requiredDocuments;
  }

  async getDocumentChecklist(applicationId) {
    const requiredDocs = await this.getRequiredDocuments();
    const uploadedDocs = await this.getByApplication(applicationId);

    const checklist = requiredDocs.map(docType => {
      const uploaded = uploadedDocs.filter(doc => doc.doc_type === docType);
      return {
        doc_type: docType,
        required: true,
        uploaded: uploaded.length > 0,
        count: uploaded.length,
        documents: uploaded
      };
    });

    const totalRequired = requiredDocs.length;
    const totalUploaded = checklist.filter(item => item.uploaded).length;
    const completionPercentage = Math.round((totalUploaded / totalRequired) * 100);

    return {
      checklist,
      total_required: totalRequired,
      total_uploaded: totalUploaded,
      completion_percentage: completionPercentage,
      is_complete: totalUploaded === totalRequired
    };
  }

  async getMissingDocuments(applicationId) {
    const checklist = await this.getDocumentChecklist(applicationId);
    return checklist.checklist
      .filter(item => !item.uploaded)
      .map(item => item.doc_type);
  }

  // Mock document field extraction (simulates OCR/parsing)
  mockExtractFields(docType, filename) {
    const fields = {};

    switch (docType) {
      case 'Bank Statement':
        fields.total_credits = Math.floor(Math.random() * 500000) + 100000;
        fields.total_debits = Math.floor(Math.random() * 400000) + 80000;
        fields.ending_balance = Math.floor(Math.random() * 200000) + 50000;
        fields.statement_period = '3 months';
        fields.average_monthly_balance = Math.floor(fields.ending_balance * 0.8);
        break;

      case 'Financial Statement':
        fields.total_revenue = Math.floor(Math.random() * 1000000) + 200000;
        fields.total_expenses = Math.floor(Math.random() * 800000) + 150000;
        fields.net_income = fields.total_revenue - fields.total_expenses;
        fields.total_assets = Math.floor(Math.random() * 2000000) + 500000;
        fields.total_liabilities = Math.floor(Math.random() * 1000000) + 200000;
        fields.period = 'Annual';
        break;

      case 'ID/KYC':
        fields.id_type = 'Government ID';
        fields.id_number = 'XXXX-XXXX-XXXX';
        fields.name_on_id = 'Verified';
        fields.expiry_date = '2028-12-31';
        break;

      case 'Collateral Proof':
        fields.property_type = 'Real Estate';
        fields.assessed_value = Math.floor(Math.random() * 5000000) + 1000000;
        fields.location = 'Metro Manila';
        fields.title_number = 'TCT-XXXXX';
        break;

      default:
        fields.extracted = true;
        fields.notes = 'Document received';
    }

    return fields;
  }
}

module.exports = new DocumentService();

// Made with Bob
