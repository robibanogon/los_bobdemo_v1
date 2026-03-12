const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;
const fileStorage = require('../utils/fileStorage');
const auditService = require('./auditService');

class AnalysisService {
  async loadPolicy() {
    const policyPath = path.join(__dirname, '../config/policy.json');
    const policyData = await fs.readFile(policyPath, 'utf8');
    return JSON.parse(policyData);
  }

  calculateDSCR(application) {
    // DSCR = Net Operating Income / Total Debt Service
    const monthlyRevenue = application.financial_snapshot.monthly_revenue;
    const monthlyExpenses = application.financial_snapshot.monthly_expenses;
    const existingDebtPayment = application.financial_snapshot.existing_debt_payment;
    
    const netOperatingIncome = monthlyRevenue - monthlyExpenses;
    
    // Calculate proposed loan payment (simple monthly payment)
    const loanAmount = application.loan_request.amount;
    const tenorMonths = application.loan_request.tenor_months;
    const proposedPayment = loanAmount / tenorMonths; // Simplified, no interest
    
    const totalDebtService = existingDebtPayment + proposedPayment;
    
    if (totalDebtService === 0) return 0;
    
    return netOperatingIncome / totalDebtService;
  }

  calculateNetCashflow(application) {
    const monthlyRevenue = application.financial_snapshot.monthly_revenue;
    const monthlyExpenses = application.financial_snapshot.monthly_expenses;
    return monthlyRevenue - monthlyExpenses;
  }

  calculateCollateralCoverage(application) {
    const collateralValue = application.collateral.estimated_value;
    const loanAmount = application.loan_request.amount;
    
    if (loanAmount === 0) return 0;
    
    return (collateralValue / loanAmount) * 100;
  }

  calculateRiskScore(application, policy) {
    // Risk score: 0 (highest risk) to 100 (lowest risk)
    const weights = policy.riskWeights;
    
    // DSCR score (0-100)
    const dscr = this.calculateDSCR(application);
    const dscrScore = Math.min(100, (dscr / policy.thresholds.minDSCR) * 100);
    
    // Credit score (0-100)
    const creditScore = application.owner_info.credit_score;
    const creditScoreNormalized = Math.min(100, (creditScore / 850) * 100);
    
    // Years in business score (0-100)
    const yearsInBusiness = application.applicant.years_in_business;
    const yearsScore = Math.min(100, (yearsInBusiness / 10) * 100);
    
    // Collateral coverage score (0-100)
    const collateralCoverage = this.calculateCollateralCoverage(application);
    const collateralScore = Math.min(100, (collateralCoverage / policy.thresholds.minCollateralCoverage) * 100);
    
    // Weighted average
    const riskScore = 
      (dscrScore * weights.dscr) +
      (creditScoreNormalized * weights.creditScore) +
      (yearsScore * weights.yearsInBusiness) +
      (collateralScore * weights.collateralCoverage);
    
    return Math.round(riskScore);
  }

  generateRiskFlags(application, policy) {
    const flags = [];
    const thresholds = policy.thresholds;
    
    // Check DSCR
    const dscr = this.calculateDSCR(application);
    if (dscr < thresholds.minDSCR) {
      flags.push({
        type: 'DSCR_BELOW_MINIMUM',
        severity: 'High',
        message: `DSCR of ${dscr.toFixed(2)} is below minimum threshold of ${thresholds.minDSCR}`
      });
    }
    
    // Check credit score
    if (application.owner_info.credit_score < thresholds.minCreditScore) {
      flags.push({
        type: 'LOW_CREDIT_SCORE',
        severity: 'High',
        message: `Credit score of ${application.owner_info.credit_score} is below minimum of ${thresholds.minCreditScore}`
      });
    }
    
    // Check years in business
    if (application.applicant.years_in_business < thresholds.minYearsInBusiness) {
      flags.push({
        type: 'INSUFFICIENT_BUSINESS_HISTORY',
        severity: 'Medium',
        message: `${application.applicant.years_in_business} years in business is below minimum of ${thresholds.minYearsInBusiness}`
      });
    }
    
    // Check collateral coverage
    const collateralCoverage = this.calculateCollateralCoverage(application);
    if (collateralCoverage < thresholds.minCollateralCoverage) {
      flags.push({
        type: 'INSUFFICIENT_COLLATERAL',
        severity: 'High',
        message: `Collateral coverage of ${collateralCoverage.toFixed(0)}% is below minimum of ${thresholds.minCollateralCoverage}%`
      });
    }
    
    // Check loan amount
    if (application.loan_request.amount > thresholds.maxLoanAmount) {
      flags.push({
        type: 'EXCEEDS_MAX_LOAN_AMOUNT',
        severity: 'High',
        message: `Loan amount of ₱${application.loan_request.amount.toLocaleString()} exceeds maximum of ₱${thresholds.maxLoanAmount.toLocaleString()}`
      });
    }
    
    // Check negative cashflow
    const netCashflow = this.calculateNetCashflow(application);
    if (netCashflow < 0) {
      flags.push({
        type: 'NEGATIVE_CASHFLOW',
        severity: 'High',
        message: `Negative monthly cashflow of ₱${netCashflow.toLocaleString()}`
      });
    }
    
    // Check if revenue is suspiciously low
    if (application.financial_snapshot.monthly_revenue < 10000) {
      flags.push({
        type: 'LOW_REVENUE',
        severity: 'Medium',
        message: `Monthly revenue of ₱${application.financial_snapshot.monthly_revenue.toLocaleString()} seems unusually low`
      });
    }
    
    return flags;
  }

  async create(applicationId, userId, userName) {
    const application = await fileStorage.findById('applications', applicationId);
    
    if (!application) {
      throw new Error('Application not found');
    }

    const policy = await this.loadPolicy();
    
    const analysis = {
      id: uuidv4(),
      application_id: applicationId,
      dscr: this.calculateDSCR(application),
      net_cashflow: this.calculateNetCashflow(application),
      collateral_coverage: this.calculateCollateralCoverage(application),
      risk_score: this.calculateRiskScore(application, policy),
      flags: this.generateRiskFlags(application, policy),
      assumptions: {
        interest_rate: 0, // Simplified for demo
        default_rate: 2,
        recovery_rate: 70
      },
      notes: '',
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await fileStorage.append('analyses', analysis);

    // Log creation
    await auditService.log({
      actor_id: userId,
      actor_name: userName,
      action: auditService.ACTIONS.CREATE_ANALYSIS,
      entity_type: 'Analysis',
      entity_id: analysis.id,
      after: analysis
    });

    return analysis;
  }

  async getByApplication(applicationId) {
    const analyses = await fileStorage.read('analyses');
    const appAnalyses = analyses.filter(a => a.application_id === applicationId);
    
    // Return the most recent one
    if (appAnalyses.length === 0) return null;
    
    return appAnalyses.sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    )[0];
  }

  async updateAssumptions(analysisId, assumptions, notes, userId, userName) {
    const analysis = await fileStorage.findById('analyses', analysisId);
    
    if (!analysis) {
      throw new Error('Analysis not found');
    }

    const updates = {
      assumptions: { ...analysis.assumptions, ...assumptions },
      notes: notes !== undefined ? notes : analysis.notes,
      updated_at: new Date().toISOString()
    };

    const result = await fileStorage.update('analyses', analysisId, updates);

    // Log update
    await auditService.log({
      actor_id: userId,
      actor_name: userName,
      action: auditService.ACTIONS.UPDATE_ASSUMPTIONS,
      entity_type: 'Analysis',
      entity_id: analysisId,
      before: {
        assumptions: analysis.assumptions,
        notes: analysis.notes
      },
      after: {
        assumptions: updates.assumptions,
        notes: updates.notes
      }
    });

    return result.new;
  }

  async recalculate(applicationId, userId, userName) {
    // Delete old analysis and create new one
    const oldAnalysis = await this.getByApplication(applicationId);
    
    if (oldAnalysis) {
      await fileStorage.delete('analyses', oldAnalysis.id);
    }

    return this.create(applicationId, userId, userName);
  }
}

module.exports = new AnalysisService();

// Made with Bob
