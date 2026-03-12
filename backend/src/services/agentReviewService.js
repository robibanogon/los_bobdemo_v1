const path = require('path');
const fs = require('fs').promises;
const fileStorage = require('../utils/fileStorage');
const documentService = require('./documentService');
const analysisService = require('./analysisService');
const auditService = require('./auditService');

class AgentReviewService {
  async loadPolicy() {
    const policyPath = path.join(__dirname, '../config/policy.json');
    const policyData = await fs.readFile(policyPath, 'utf8');
    return JSON.parse(policyData);
  }

  async runReview(applicationId, userId, userName) {
    const application = await fileStorage.findById('applications', applicationId);
    
    if (!application) {
      throw new Error('Application not found');
    }

    const policy = await this.loadPolicy();
    
    // Get documents
    const documents = await documentService.getByApplication(applicationId);
    const missingDocs = await documentService.getMissingDocuments(applicationId);
    
    // Extract fields from documents (mock)
    const extractedFields = this.extractFieldsFromDocuments(documents);
    
    // Check data quality
    const dataQualityWarnings = this.checkDataQuality(application, extractedFields);
    
    // Get or create analysis
    let analysis = await analysisService.getByApplication(applicationId);
    if (!analysis) {
      analysis = await analysisService.create(applicationId, userId, userName);
    }
    
    // Generate risk flags (top 3-5)
    const riskFlags = analysis.flags.slice(0, 5);
    
    // Make recommendation
    const recommendation = this.makeRecommendation(application, analysis, policy, missingDocs);
    
    const review = {
      application_id: applicationId,
      extracted_fields: extractedFields,
      missing_documents: missingDocs,
      data_quality_warnings: dataQualityWarnings,
      risk_flags: riskFlags,
      recommendation: recommendation.decision,
      recommendation_reason: recommendation.reason,
      recommended_conditions: recommendation.conditions,
      reviewed_at: new Date().toISOString(),
      reviewed_by: userId
    };

    // Log review
    await auditService.log({
      actor_id: userId,
      actor_name: userName,
      action: auditService.ACTIONS.RUN_AGENT_REVIEW,
      entity_type: 'Application',
      entity_id: applicationId,
      after: review
    });

    return review;
  }

  extractFieldsFromDocuments(documents) {
    const extracted = {};
    
    documents.forEach(doc => {
      if (doc.extracted_fields && Object.keys(doc.extracted_fields).length > 0) {
        extracted[doc.doc_type] = doc.extracted_fields;
      }
    });
    
    return extracted;
  }

  checkDataQuality(application, extractedFields) {
    const warnings = [];
    
    // Check for negative values
    if (application.financial_snapshot.monthly_revenue < 0) {
      warnings.push({
        field: 'monthly_revenue',
        severity: 'High',
        message: 'Monthly revenue cannot be negative'
      });
    }
    
    if (application.financial_snapshot.monthly_expenses < 0) {
      warnings.push({
        field: 'monthly_expenses',
        severity: 'High',
        message: 'Monthly expenses cannot be negative'
      });
    }
    
    // Check if expenses exceed revenue
    if (application.financial_snapshot.monthly_expenses > application.financial_snapshot.monthly_revenue) {
      warnings.push({
        field: 'financial_snapshot',
        severity: 'Medium',
        message: 'Monthly expenses exceed monthly revenue - negative cashflow'
      });
    }
    
    // Check collateral value vs loan amount
    if (application.collateral.estimated_value < application.loan_request.amount) {
      warnings.push({
        field: 'collateral',
        severity: 'Medium',
        message: 'Collateral value is less than loan amount'
      });
    }
    
    // Check if loan amount is reasonable
    if (application.loan_request.amount > application.financial_snapshot.monthly_revenue * 12) {
      warnings.push({
        field: 'loan_amount',
        severity: 'Medium',
        message: 'Loan amount exceeds annual revenue'
      });
    }
    
    // Check tenor
    if (application.loan_request.tenor_months < 6 || application.loan_request.tenor_months > 60) {
      warnings.push({
        field: 'tenor',
        severity: 'Low',
        message: 'Unusual loan tenor (typically 6-60 months)'
      });
    }
    
    // Check years in business
    if (application.applicant.years_in_business < 1) {
      warnings.push({
        field: 'years_in_business',
        severity: 'High',
        message: 'Business has less than 1 year of operating history'
      });
    }
    
    // Check credit score range
    if (application.owner_info.credit_score < 300 || application.owner_info.credit_score > 850) {
      warnings.push({
        field: 'credit_score',
        severity: 'High',
        message: 'Credit score outside valid range (300-850)'
      });
    }
    
    return warnings;
  }

  makeRecommendation(application, analysis, policy, missingDocs) {
    const thresholds = policy.thresholds;
    const reasons = [];
    let decision = 'Approve';
    
    // Check if documents are complete
    if (missingDocs.length > 0) {
      decision = 'Review';
      reasons.push(`Missing required documents: ${missingDocs.join(', ')}`);
    }
    
    // Check critical thresholds
    if (analysis.dscr < thresholds.minDSCR) {
      decision = 'Reject';
      reasons.push(`DSCR of ${analysis.dscr.toFixed(2)} is below minimum ${thresholds.minDSCR}`);
    }
    
    if (application.owner_info.credit_score < thresholds.minCreditScore) {
      decision = 'Reject';
      reasons.push(`Credit score of ${application.owner_info.credit_score} is below minimum ${thresholds.minCreditScore}`);
    }
    
    if (application.applicant.years_in_business < thresholds.minYearsInBusiness) {
      if (decision === 'Approve') decision = 'Review';
      reasons.push(`Only ${application.applicant.years_in_business} years in business (minimum ${thresholds.minYearsInBusiness})`);
    }
    
    if (application.loan_request.amount > thresholds.maxLoanAmount) {
      decision = 'Reject';
      reasons.push(`Loan amount ₱${application.loan_request.amount.toLocaleString()} exceeds maximum ₱${thresholds.maxLoanAmount.toLocaleString()}`);
    }
    
    // Check collateral coverage
    if (analysis.collateral_coverage < thresholds.minCollateralCoverage) {
      if (decision === 'Approve') decision = 'Review';
      reasons.push(`Collateral coverage of ${analysis.collateral_coverage.toFixed(0)}% is below minimum ${thresholds.minCollateralCoverage}%`);
    }
    
    // Check risk score
    if (analysis.risk_score < 50) {
      if (decision === 'Approve') decision = 'Review';
      reasons.push(`Risk score of ${analysis.risk_score} indicates elevated risk`);
    }
    
    // Generate conditions
    const conditions = this.generateConditions(application, analysis, policy, decision);
    
    // If no issues found
    if (reasons.length === 0) {
      reasons.push('All criteria met. Application meets policy requirements.');
    }
    
    return {
      decision,
      reason: reasons.join('; '),
      conditions
    };
  }

  generateConditions(application, analysis, policy, decision) {
    const conditions = [];
    
    if (decision === 'Approve' || decision === 'Review') {
      // Add standard conditions
      conditions.push(...policy.standardConditions);
      
      // Add specific conditions based on analysis
      if (analysis.collateral_coverage < 150) {
        conditions.push({
          condition: 'Additional collateral or personal guarantee required',
          type: 'Pre-disbursement'
        });
      }
      
      if (analysis.dscr < 1.5) {
        conditions.push({
          condition: 'Monthly monitoring of cashflow for first 6 months',
          type: 'Post-disbursement'
        });
      }
      
      if (application.applicant.years_in_business < 5) {
        conditions.push({
          condition: 'Quarterly business performance review',
          type: 'Post-disbursement'
        });
      }
      
      if (application.loan_request.amount > 200000) {
        conditions.push({
          condition: 'Site visit and business verification',
          type: 'Pre-disbursement'
        });
      }
    }
    
    return conditions;
  }
}

module.exports = new AgentReviewService();

// Made with Bob
