const { format } = require('date-fns');
const fileStorage = require('../utils/fileStorage');
const auditService = require('./auditService');
const analysisService = require('./analysisService');
const decisionService = require('./decisionService');

class MemoService {
  async generateMemo(applicationId, userId, userName) {
    const application = await fileStorage.findById('applications', applicationId);
    
    if (!application) {
      throw new Error('Application not found');
    }

    const analysis = await analysisService.getByApplication(applicationId);
    const decision = await decisionService.getByApplication(applicationId);
    const auditLog = await auditService.getByApplication(applicationId);

    // Get user details
    const owner = await fileStorage.findById('users', application.owner_user_id);
    const analyst = decision?.recommended_by ? await fileStorage.findById('users', decision.recommended_by) : null;
    const approver = decision?.approver_id ? await fileStorage.findById('users', decision.approver_id) : null;

    const memoData = {
      application,
      analysis,
      decision,
      owner,
      analyst,
      approver,
      auditLog: auditLog.slice(0, 10), // Last 10 actions
      generated_at: new Date().toISOString(),
      generated_by: userName
    };

    const html = this.generateHTML(memoData);

    // Log memo generation
    await auditService.log({
      actor_id: userId,
      actor_name: userName,
      action: auditService.ACTIONS.GENERATE_MEMO,
      entity_type: 'Application',
      entity_id: applicationId,
      metadata: {
        memo_generated: true
      }
    });

    return {
      html,
      data: memoData
    };
  }

  generateHTML(data) {
    const { application, analysis, decision, owner, analyst, approver, auditLog, generated_at, generated_by } = data;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Credit Memo - ${application.application_number}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .memo-container {
            background: white;
            padding: 40px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #2c3e50;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #2c3e50;
            margin: 0;
            font-size: 28px;
        }
        .header .app-number {
            color: #7f8c8d;
            font-size: 14px;
            margin-top: 5px;
        }
        .section {
            margin-bottom: 30px;
        }
        .section-title {
            background: #34495e;
            color: white;
            padding: 10px 15px;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
        }
        .info-item {
            padding: 10px;
            background: #ecf0f1;
            border-left: 4px solid #3498db;
        }
        .info-label {
            font-weight: bold;
            color: #2c3e50;
            font-size: 12px;
            text-transform: uppercase;
        }
        .info-value {
            color: #34495e;
            font-size: 16px;
            margin-top: 5px;
        }
        .metrics {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin: 20px 0;
        }
        .metric-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .metric-card.good {
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
        }
        .metric-card.warning {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }
        .metric-label {
            font-size: 12px;
            opacity: 0.9;
            text-transform: uppercase;
        }
        .metric-value {
            font-size: 28px;
            font-weight: bold;
            margin: 10px 0;
        }
        .risk-flags {
            list-style: none;
            padding: 0;
        }
        .risk-flag {
            padding: 10px;
            margin-bottom: 10px;
            border-radius: 4px;
            border-left: 4px solid;
        }
        .risk-flag.high {
            background: #fee;
            border-color: #e74c3c;
        }
        .risk-flag.medium {
            background: #fef5e7;
            border-color: #f39c12;
        }
        .risk-flag.low {
            background: #eef;
            border-color: #3498db;
        }
        .conditions {
            list-style: none;
            padding: 0;
        }
        .condition {
            padding: 10px;
            margin-bottom: 8px;
            background: #e8f8f5;
            border-left: 4px solid #16a085;
        }
        .decision-box {
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
            text-align: center;
            font-size: 24px;
            font-weight: bold;
        }
        .decision-box.approved {
            background: #d5f4e6;
            color: #27ae60;
            border: 2px solid #27ae60;
        }
        .decision-box.rejected {
            background: #fadbd8;
            color: #e74c3c;
            border: 2px solid #e74c3c;
        }
        .audit-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
        }
        .audit-table th {
            background: #34495e;
            color: white;
            padding: 10px;
            text-align: left;
        }
        .audit-table td {
            padding: 8px;
            border-bottom: 1px solid #ddd;
        }
        .audit-table tr:hover {
            background: #f8f9fa;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #ecf0f1;
            text-align: center;
            color: #7f8c8d;
            font-size: 12px;
        }
        @media print {
            body {
                background: white;
            }
            .memo-container {
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    <div class="memo-container">
        <div class="header">
            <h1>CREDIT MEMO</h1>
            <div class="app-number">${application.application_number}</div>
            <div class="app-number">Generated: ${format(new Date(generated_at), 'MMMM dd, yyyy HH:mm')}</div>
        </div>

        <!-- Applicant Summary -->
        <div class="section">
            <div class="section-title">Applicant Information</div>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Legal Name</div>
                    <div class="info-value">${application.applicant.legal_name}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Business Type</div>
                    <div class="info-value">${application.applicant.business_type}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Industry</div>
                    <div class="info-value">${application.applicant.industry}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Years in Business</div>
                    <div class="info-value">${application.applicant.years_in_business} years</div>
                </div>
            </div>
        </div>

        <!-- Loan Request Summary -->
        <div class="section">
            <div class="section-title">Loan Request</div>
            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Loan Amount</div>
                    <div class="info-value">₱${application.loan_request.amount.toLocaleString()}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Tenor</div>
                    <div class="info-value">${application.loan_request.tenor_months} months</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Purpose</div>
                    <div class="info-value">${application.loan_request.purpose}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Repayment Type</div>
                    <div class="info-value">${application.loan_request.repayment_type}</div>
                </div>
            </div>
        </div>

        <!-- Financial Analysis -->
        ${analysis ? `
        <div class="section">
            <div class="section-title">Financial Analysis</div>
            <div class="metrics">
                <div class="metric-card ${analysis.dscr >= 1.2 ? 'good' : 'warning'}">
                    <div class="metric-label">DSCR</div>
                    <div class="metric-value">${analysis.dscr.toFixed(2)}</div>
                </div>
                <div class="metric-card ${analysis.net_cashflow > 0 ? 'good' : 'warning'}">
                    <div class="metric-label">Net Cashflow</div>
                    <div class="metric-value">₱${Math.abs(analysis.net_cashflow).toLocaleString()}</div>
                </div>
                <div class="metric-card ${analysis.collateral_coverage >= 120 ? 'good' : 'warning'}">
                    <div class="metric-label">Collateral Coverage</div>
                    <div class="metric-value">${analysis.collateral_coverage.toFixed(0)}%</div>
                </div>
                <div class="metric-card ${analysis.risk_score >= 70 ? 'good' : analysis.risk_score >= 50 ? '' : 'warning'}">
                    <div class="metric-label">Risk Score</div>
                    <div class="metric-value">${analysis.risk_score}</div>
                </div>
            </div>

            <div class="info-grid">
                <div class="info-item">
                    <div class="info-label">Monthly Revenue</div>
                    <div class="info-value">₱${application.financial_snapshot.monthly_revenue.toLocaleString()}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Monthly Expenses</div>
                    <div class="info-value">₱${application.financial_snapshot.monthly_expenses.toLocaleString()}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Existing Debt Payment</div>
                    <div class="info-value">₱${application.financial_snapshot.existing_debt_payment.toLocaleString()}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Credit Score</div>
                    <div class="info-value">${application.owner_info.credit_score}</div>
                </div>
            </div>
        </div>
        ` : ''}

        <!-- Risk Flags -->
        ${analysis && analysis.flags.length > 0 ? `
        <div class="section">
            <div class="section-title">Key Risks & Mitigations</div>
            <ul class="risk-flags">
                ${analysis.flags.map(flag => `
                    <li class="risk-flag ${flag.severity.toLowerCase()}">
                        <strong>${flag.type.replace(/_/g, ' ')}</strong> (${flag.severity})<br>
                        ${flag.message}
                    </li>
                `).join('')}
            </ul>
        </div>
        ` : ''}

        <!-- Decision -->
        ${decision ? `
        <div class="section">
            <div class="section-title">Decision</div>
            
            ${decision.final_decision ? `
                <div class="decision-box ${decision.final_decision.toLowerCase()}">
                    ${decision.final_decision.toUpperCase()}
                </div>
            ` : ''}

            ${decision.recommended_decision ? `
                <div class="info-item">
                    <div class="info-label">Analyst Recommendation</div>
                    <div class="info-value">${decision.recommended_decision}</div>
                </div>
            ` : ''}

            ${decision.recommendation_notes ? `
                <div class="info-item">
                    <div class="info-label">Recommendation Notes</div>
                    <div class="info-value">${decision.recommendation_notes}</div>
                </div>
            ` : ''}

            ${decision.rejection_reason ? `
                <div class="info-item">
                    <div class="info-label">Rejection Reason</div>
                    <div class="info-value">${decision.rejection_reason}</div>
                </div>
            ` : ''}

            ${decision.conditions && decision.conditions.length > 0 ? `
                <div style="margin-top: 20px;">
                    <strong>Conditions:</strong>
                    <ul class="conditions">
                        ${decision.conditions.map(cond => `
                            <li class="condition">
                                <strong>${cond.type}:</strong> ${cond.condition}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}
        </div>
        ` : ''}

        <!-- Audit Summary -->
        <div class="section">
            <div class="section-title">Audit Trail Summary</div>
            <table class="audit-table">
                <thead>
                    <tr>
                        <th>Date/Time</th>
                        <th>User</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${auditLog.map(log => `
                        <tr>
                            <td>${format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm')}</td>
                            <td>${log.actor_name}</td>
                            <td>${log.action.replace(/_/g, ' ')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <!-- Signatories -->
        <div class="section">
            <div class="section-title">Signatories</div>
            <div class="info-grid">
                ${owner ? `
                    <div class="info-item">
                        <div class="info-label">Relationship Manager</div>
                        <div class="info-value">${owner.name}</div>
                    </div>
                ` : ''}
                ${analyst ? `
                    <div class="info-item">
                        <div class="info-label">Credit Analyst</div>
                        <div class="info-value">${analyst.name}</div>
                    </div>
                ` : ''}
                ${approver ? `
                    <div class="info-item">
                        <div class="info-label">Approver</div>
                        <div class="info-value">${approver.name}</div>
                    </div>
                ` : ''}
                <div class="info-item">
                    <div class="info-label">Memo Generated By</div>
                    <div class="info-value">${generated_by}</div>
                </div>
            </div>
        </div>

        <div class="footer">
            <p><strong>CONFIDENTIAL</strong> - This credit memo contains confidential information and is intended solely for authorized personnel.</p>
            <p>Generated by Loan Origination System | ${format(new Date(generated_at), 'MMMM dd, yyyy HH:mm:ss')}</p>
        </div>
    </div>
</body>
</html>
    `.trim();
  }
}

module.exports = new MemoService();

// Made with Bob
