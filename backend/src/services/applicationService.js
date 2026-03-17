const { v4: uuidv4 } = require('uuid');
const fileStorage = require('../utils/fileStorage');
const auditService = require('./auditService');

class ApplicationService {
  // Status constants
  static STATUS = {
    DRAFT: 'Draft',
    SUBMITTED: 'Submitted',
    IN_REVIEW: 'In Review',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    COMPLETED: 'Completed'
  };

  // Valid status transitions
  static TRANSITIONS = {
    'Draft': ['Submitted'],
    'Submitted': ['In Review'],
    'In Review': ['Approved', 'Rejected'],
    'Approved': ['Completed'],
    'Rejected': [],
    'Completed': []
  };

  async generateApplicationNumber() {
    const applications = await fileStorage.read('applications');
    const year = new Date().getFullYear();
    const count = applications.filter(app => 
      app.application_number.startsWith(`APP-${year}`)
    ).length;
    return `APP-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  async create(applicationData, userId, userName) {
    const application = {
      id: uuidv4(),
      application_number: await this.generateApplicationNumber(),
      status: ApplicationService.STATUS.DRAFT,
      owner_user_id: userId,
      
      applicant: {
        legal_name: applicationData.applicant.legal_name,
        business_type: applicationData.applicant.business_type,
        industry: applicationData.applicant.industry,
        years_in_business: applicationData.applicant.years_in_business
      },
      
      loan_request: {
        amount: applicationData.loan_request.amount,
        tenor_months: applicationData.loan_request.tenor_months,
        purpose: applicationData.loan_request.purpose,
        repayment_type: applicationData.loan_request.repayment_type
      },
      
      financial_snapshot: {
        monthly_revenue: applicationData.financial_snapshot.monthly_revenue,
        monthly_expenses: applicationData.financial_snapshot.monthly_expenses,
        existing_debt_payment: applicationData.financial_snapshot.existing_debt_payment
      },
      
      collateral: {
        type: applicationData.collateral.type,
        estimated_value: applicationData.collateral.estimated_value
      },
      
      owner_info: {
        name: applicationData.owner_info.name,
        id_number: applicationData.owner_info.id_number,
        credit_score: applicationData.owner_info.credit_score
      },
      
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      submitted_at: null,
      completed_at: null
    };

    await fileStorage.append('applications', application);

    // Log creation
    await auditService.log({
      actor_id: userId,
      actor_name: userName,
      action: auditService.ACTIONS.CREATE_APPLICATION,
      entity_type: 'Application',
      entity_id: application.id,
      after: application
    });

    return application;
  }

  async getAll(filters = {}) {
    let applications = await fileStorage.read('applications');

    if (filters.status) {
      applications = applications.filter(app => app.status === filters.status);
    }

    if (filters.owner_user_id) {
      applications = applications.filter(app => app.owner_user_id === filters.owner_user_id);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      applications = applications.filter(app => 
        app.applicant.legal_name.toLowerCase().includes(searchLower) ||
        app.application_number.toLowerCase().includes(searchLower)
      );
    }

    // Sort by updated_at descending
    return applications.sort((a, b) => 
      new Date(b.updated_at) - new Date(a.updated_at)
    );
  }

  async getById(id) {
    const application = await fileStorage.findById('applications', id);
    
    if (!application) {
      throw new Error('Application not found');
    }

    return application;
  }

  async update(id, updates, userId, userName) {
    const application = await this.getById(id);

    // Check if application can be edited
    if (application.status !== ApplicationService.STATUS.DRAFT) {
      throw new Error('Only Draft applications can be fully edited');
    }

    const result = await fileStorage.update('applications', id, updates);

    // Log update
    await auditService.log({
      actor_id: userId,
      actor_name: userName,
      action: auditService.ACTIONS.UPDATE_APPLICATION,
      entity_type: 'Application',
      entity_id: id,
      before: result.old,
      after: result.new
    });

    return result.new;
  }

  async delete(id, userId, userName) {
    const application = await this.getById(id);

    // Only allow deletion of Draft applications
    if (application.status !== ApplicationService.STATUS.DRAFT) {
      throw new Error('Only Draft applications can be deleted');
    }

    await fileStorage.delete('applications', id);

    // Log deletion
    await auditService.log({
      actor_id: userId,
      actor_name: userName,
      action: auditService.ACTIONS.DELETE_APPLICATION,
      entity_type: 'Application',
      entity_id: id,
      before: application
    });

    return true;
  }

  async changeStatus(id, newStatus, userId, userName) {
    const application = await this.getById(id);
    const currentStatus = application.status;

    // Validate transition
    const allowedTransitions = ApplicationService.TRANSITIONS[currentStatus];
    if (!allowedTransitions.includes(newStatus)) {
      throw new Error(`Cannot transition from ${currentStatus} to ${newStatus}`);
    }

    const updates = { 
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    if (newStatus === ApplicationService.STATUS.SUBMITTED) {
      updates.submitted_at = new Date().toISOString();
    }

    if (newStatus === ApplicationService.STATUS.COMPLETED) {
      updates.completed_at = new Date().toISOString();
    }

    const result = await fileStorage.update('applications', id, updates);

    // Log status change
    await auditService.log({
      actor_id: userId,
      actor_name: userName,
      action: `CHANGE_STATUS_TO_${newStatus.toUpperCase().replace(' ', '_')}`,
      entity_type: 'Application',
      entity_id: id,
      before: { status: currentStatus },
      after: { status: newStatus }
    });

    return result.new;
  }

  async submit(id, userId, userName) {
    return this.changeStatus(id, ApplicationService.STATUS.SUBMITTED, userId, userName);
  }

  async moveToReview(id, userId, userName) {
    return this.changeStatus(id, ApplicationService.STATUS.IN_REVIEW, userId, userName);
  }

  async approve(id, userId, userName) {
    return this.changeStatus(id, ApplicationService.STATUS.APPROVED, userId, userName);
  }

  async reject(id, userId, userName) {
    return this.changeStatus(id, ApplicationService.STATUS.REJECTED, userId, userName);
  }

  async complete(id, userId, userName) {
    return this.changeStatus(id, ApplicationService.STATUS.COMPLETED, userId, userName);
  }

  async updateStatus(id, status, userId, userName) {
    // Generic status update method that accepts any valid status
    return this.changeStatus(id, status, userId, userName);
  }

  async getStatistics() {
    const applications = await fileStorage.read('applications');
    
    const stats = {
      total: applications.length,
      by_status: {},
      total_amount: 0,
      avg_amount: 0
    };

    // Count by status
    Object.values(ApplicationService.STATUS).forEach(status => {
      stats.by_status[status] = applications.filter(app => app.status === status).length;
    });

    // Calculate amounts
    if (applications.length > 0) {
      stats.total_amount = applications.reduce((sum, app) => sum + app.loan_request.amount, 0);
      stats.avg_amount = stats.total_amount / applications.length;
    }

    return stats;
  }
}

module.exports = new ApplicationService();

// Made with Bob
