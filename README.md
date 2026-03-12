# Loan Origination System (LOS) - MVP Demo

A comprehensive web application for processing SME loan applications in the Philippines, featuring end-to-end workflow from intake to credit memo generation with complete audit trail.

## 🎯 Features

- **Complete Loan Workflow**: Application intake → Document upload → Automated credit analysis → Decision approval → Credit memo generation
- **Role-Based Access Control**: RM, Credit Analyst, Approver, and Admin roles
- **Automated Credit Analysis**: DSCR, cashflow, collateral coverage, and risk scoring
- **Agent Review System**: Automated document validation and risk flag generation
- **Decision Management**: Analyst recommendations and approver final decisions
- **Credit Memo Export**: Professional HTML credit memos
- **Complete Audit Trail**: All actions logged with before/after states
- **File-Based Storage**: No database required - uses JSON files

## 📋 Prerequisites

- **Node.js** v18 or higher
- **npm** or **yarn**
- Modern web browser (Chrome, Firefox, Safari, Edge)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd los_bobdemo
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 4. Initialize and Seed Demo Data

```bash
cd ../backend
npm run seed
```

This will create:
- 30 sample applications with varied statuses
- Mock document metadata
- Credit analyses
- Decisions for approved/rejected applications

### 5. Start the Backend Server

```bash
npm start
# or for development with auto-reload:
npm run dev
```

The backend API will start on `http://localhost:3001`

### 6. Start the Frontend (in a new terminal)

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:5173`

## 👥 Demo Users

| Username | Password | Role | Capabilities |
|----------|----------|------|--------------|
| `rm1` | `password123` | Relationship Manager | Create applications, upload documents, submit for review |
| `analyst1` | `password123` | Credit Analyst | Review analysis, edit assumptions, submit recommendations |
| `approver1` | `password123` | Approver | Approve/reject applications, add conditions |
| `admin` | `admin123` | Admin | Full access, policy configuration |

## 📖 Demo Walkthrough

### Scenario 1: Complete Loan Application Flow (15 minutes)

#### Step 1: Login as RM
1. Open `http://localhost:5173`
2. Login with `rm1` / `password123`
3. You'll see the dashboard with application statistics

#### Step 2: Create New Application
1. Click "Create New Application"
2. Fill in the application form:
   - **Applicant**: Business name, type, industry, years in business
   - **Loan Request**: Amount, tenor, purpose, repayment type
   - **Financial Snapshot**: Monthly revenue, expenses, existing debt
   - **Collateral**: Type and estimated value
   - **Owner Info**: Name, ID number, credit score
3. Click "Save as Draft"

#### Step 3: Upload Documents
1. Navigate to the "Documents" tab
2. Upload required documents:
   - Bank Statement
   - Financial Statement
   - ID/KYC
   - Collateral Proof
3. Check the completion percentage

#### Step 4: Submit Application
1. Once all required documents are uploaded
2. Click "Submit Application"
3. Status changes to "Submitted"

#### Step 5: Run Agent Review
1. Click "Run Agent Review" button
2. Review the automated analysis:
   - Extracted fields from documents
   - Missing documents (if any)
   - Data quality warnings
   - Risk flags
   - Recommended decision

#### Step 6: Login as Credit Analyst
1. Logout and login with `analyst1` / `password123`
2. Find the submitted application
3. Navigate to "Analysis" tab

#### Step 7: Review Credit Analysis
1. Review calculated metrics:
   - DSCR (Debt Service Coverage Ratio)
   - Net Operating Cashflow
   - Collateral Coverage %
   - Risk Score (0-100)
2. Edit assumptions if needed
3. Add analyst notes

#### Step 8: Submit Recommendation
1. Navigate to "Decision" tab
2. Select recommendation: Approve / Reject / Need More Info
3. Add recommendation notes
4. Click "Submit Recommendation"

#### Step 9: Login as Approver
1. Logout and login with `approver1` / `password123`
2. Find the application with recommendation

#### Step 10: Finalize Decision
1. Review the analyst's recommendation
2. Make final decision:
   - **If Approving**: Add conditions (pre/post-disbursement)
   - **If Rejecting**: Add rejection reason
3. Click "Finalize Decision"
4. Application status changes to "Approved" or "Rejected"

#### Step 11: Generate Credit Memo
1. Navigate to "Credit Memo" tab
2. Click "Generate Credit Memo"
3. Review the comprehensive HTML memo including:
   - Applicant summary
   - Loan request details
   - Financial analysis
   - Risk flags
   - Decision and conditions
   - Audit trail
4. Export to HTML or print

#### Step 12: View Audit Log
1. Navigate to "Audit" tab
2. Review complete history of all actions
3. See who did what and when
4. View before/after states for edits

### Scenario 2: Explore Existing Applications

The seed data includes 30 applications in various states:
- **5 Draft**: Can be edited and deleted
- **5 Submitted**: Awaiting review
- **5 In Review**: Analysis in progress
- **5 Approved**: Ready for disbursement
- **3 Rejected**: Did not meet criteria
- **7 Completed**: Simulated disbursement done

Explore these to see different scenarios without creating new ones.

## 🏗️ Architecture

### Backend (Node.js + Express)

```
backend/
├── src/
│   ├── config/          # Policy configuration
│   ├── middleware/      # Auth, validation
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic
│   │   ├── authService.js
│   │   ├── applicationService.js
│   │   ├── documentService.js
│   │   ├── analysisService.js
│   │   ├── agentReviewService.js
│   │   ├── decisionService.js
│   │   ├── memoService.js
│   │   └── auditService.js
│   └── utils/           # File storage, helpers
├── data/                # JSON data files
│   ├── users.json
│   ├── applications.json
│   ├── documents.json
│   ├── analyses.json
│   ├── decisions.json
│   ├── audit_log.json
│   └── uploads/         # Uploaded files
└── server.js            # Express server
```

### Frontend (React + Vite)

```
frontend/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/           # Page components
│   ├── services/        # API client
│   ├── context/         # Auth context
│   └── utils/           # Helper functions
└── public/              # Static assets
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Applications
- `GET /api/applications` - List applications (with filters)
- `GET /api/applications/:id` - Get application details
- `POST /api/applications` - Create application
- `PUT /api/applications/:id` - Update application
- `DELETE /api/applications/:id` - Delete application
- `POST /api/applications/:id/submit` - Submit application
- `POST /api/applications/:id/complete` - Mark as completed

### Documents
- `GET /api/applications/:id/documents` - List documents
- `POST /api/applications/:id/documents` - Upload document
- `GET /api/documents/:id/download` - Download document
- `DELETE /api/documents/:id` - Delete document
- `GET /api/applications/:id/documents/checklist` - Get checklist

### Agent Review
- `POST /api/applications/:id/agent-review` - Run agent review

### Analysis
- `GET /api/applications/:id/analysis` - Get analysis
- `POST /api/applications/:id/analysis` - Create/recalculate analysis
- `PUT /api/applications/:id/analysis/assumptions` - Update assumptions

### Decision
- `GET /api/applications/:id/decision` - Get decision
- `POST /api/applications/:id/decision/recommend` - Submit recommendation
- `POST /api/applications/:id/decision/finalize` - Finalize decision

### Credit Memo
- `GET /api/applications/:id/memo` - Generate credit memo

### Audit Log
- `GET /api/audit` - Get audit logs (with filters)
- `GET /api/applications/:id/audit` - Get application audit log

### Configuration
- `GET /api/config/policy` - Get policy thresholds
- `PUT /api/config/policy` - Update policy (Admin only)

## 📊 Business Rules

### Policy Thresholds (Configurable)

```json
{
  "minDSCR": 1.2,
  "minCollateralCoverage": 120,
  "maxLoanAmount": 300000,
  "minYearsInBusiness": 3,
  "minCreditScore": 650
}
```

### Decision Logic

- **Reject** if:
  - DSCR < minimum threshold
  - Credit score < minimum threshold
  - Loan amount > maximum threshold
  
- **Review** if:
  - Years in business < minimum threshold
  - Collateral coverage < minimum threshold
  - Risk score < 50
  
- **Approve** if:
  - All criteria met
  - No critical risk flags

### Status Workflow

```
Draft → Submitted → In Review → Approved/Rejected → Completed
```

**Rules:**
- Only Draft can be fully edited
- Submitted/In Review: Only notes/assumptions can be edited (logged)
- Approved/Rejected: Read-only (Admin override available)

## 🔐 Security Notes

**⚠️ This is a DEMO application. Do NOT use in production without:**

1. Implementing proper password hashing (bcrypt is used but with demo passwords)
2. Using environment variables for secrets
3. Adding rate limiting
4. Implementing HTTPS
5. Adding input sanitization
6. Implementing proper session management
7. Adding CSRF protection
8. Conducting security audit

## 🧪 Testing

### Manual Testing Checklist

- [ ] Login with all user roles
- [ ] Create new application
- [ ] Upload documents
- [ ] Run agent review
- [ ] View credit analysis
- [ ] Submit recommendation (as analyst)
- [ ] Approve/reject (as approver)
- [ ] Generate credit memo
- [ ] View audit log
- [ ] Filter applications by status
- [ ] Search applications
- [ ] Edit draft application
- [ ] Delete draft application
- [ ] Update policy thresholds (as admin)

## 📝 Data Model

### Application
- Applicant information (name, business type, industry, years)
- Loan request (amount, tenor, purpose, repayment type)
- Financial snapshot (revenue, expenses, debt payment)
- Collateral (type, value)
- Owner info (name, ID, credit score)

### Document
- Application reference
- Document type
- File metadata
- Extracted fields (mock OCR results)

### Analysis
- DSCR calculation
- Net cashflow
- Collateral coverage
- Risk score (0-100)
- Risk flags
- Assumptions (editable)

### Decision
- Analyst recommendation
- Approver final decision
- Conditions (pre/post-disbursement)
- Rejection reason

### Audit Log
- Timestamp
- Actor (user)
- Action type
- Entity reference
- Before/after states

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port 3001 is already in use
lsof -i :3001
# Kill the process if needed
kill -9 <PID>
```

### Frontend won't start
```bash
# Check if port 5173 is already in use
lsof -i :5173
# Kill the process if needed
kill -9 <PID>
```

### Data files corrupted
```bash
# Delete data files and re-seed
cd backend
rm -rf data/*.json
npm run seed
```

### Missing dependencies
```bash
# Reinstall all dependencies
cd backend && rm -rf node_modules && npm install
cd ../frontend && rm -rf node_modules && npm install
```

## 📚 Additional Resources

- [Requirements Document](Requirements.md) - Full MVP requirements
- [Architecture Plan](PLAN.md) - Detailed implementation plan
- [API Documentation](backend/API.md) - Complete API reference (if created)

## 🤝 Contributing

This is a demo application. For production use, consider:
- Adding comprehensive unit tests
- Implementing integration tests
- Adding E2E tests with Playwright/Cypress
- Implementing proper error handling
- Adding logging framework
- Implementing monitoring
- Adding performance optimization
- Implementing caching strategy

## 📄 License

MIT License - This is a demo application for educational purposes.

## 👨‍💻 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the demo walkthrough
3. Check the audit log for error details
4. Review browser console for frontend errors
5. Check backend terminal for API errors

---

**Built with ❤️ for SME lending in the Philippines**