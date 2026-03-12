# Comprehensive Test Plan for LOS Application
**Version:** 2.0  
**Date:** March 12, 2026  
**Status:** Ready for Execution

---

## Overview

This test plan covers comprehensive testing of all newly implemented features in the Loan Origination System (LOS) application, including:
- Document Upload UI
- Agent Review Display
- Credit Analysis View
- Decision Workflow UI
- Credit Memo Viewer
- Application Form (Create/Edit)
- Status Transitions
- End-to-End Workflows

---

## Test Environment

### Prerequisites
- Backend server running on http://localhost:3001
- Frontend application running on http://localhost:5173
- Demo data seeded (30 applications)
- All 4 user roles available for testing

### Test Users
| Username | Password | Role | Purpose |
|----------|----------|------|---------|
| rm1 | password123 | RM | Create/edit applications, upload documents |
| analyst1 | password123 | Credit Analyst | Review applications, submit recommendations |
| approver1 | password123 | Approver | Finalize decisions |
| admin | admin123 | Admin | Override and configuration |

---

## Test Execution Strategy

### Phase 1: Component-Level Testing (TC074-TC115)
Test each new component individually to verify functionality.

### Phase 2: Integration Testing (TC116-TC128)
Test interactions between components and workflows.

### Phase 3: End-to-End Testing (TC129-TC130)
Test complete application lifecycle across multiple roles.

---

## Detailed Test Cases

### 📄 Document Upload UI (TC074-TC081)

**Component:** `DocumentUpload.jsx` (371 lines)  
**Route:** `/applications/:id/documents`  
**Priority:** High

#### Test Cases

**TC074: Document upload page loads**
- **Steps:**
  1. Login as RM (rm1/password123)
  2. Navigate to Applications list
  3. Click on any Draft application
  4. Click "📄 Manage Documents" button
- **Expected:** Document upload interface displays with:
  - File selection input
  - Document type dropdown
  - Upload button
  - Document list (if any exist)
  - Completion checklist
  - Progress bar

**TC075: File selection works**
- **Steps:**
  1. On document upload page
  2. Click file input or drag-and-drop area
  3. Select a test file (PDF, JPG, or PNG)
- **Expected:** File name appears in input field

**TC076: Document type dropdown**
- **Steps:**
  1. Click document type dropdown
  2. Verify all options present
- **Expected:** Dropdown shows:
  - Bank Statement
  - Financial Statement
  - ID/KYC
  - Collateral Proof
  - Other

**TC077: Upload button functional**
- **Steps:**
  1. Select a file
  2. Choose document type
  3. Click "Upload Document" button
- **Expected:**
  - Loading state shows during upload
  - Success toast notification appears
  - Document appears in list below
  - File input clears for next upload

**TC078: Document list displays**
- **Steps:**
  1. After uploading documents
  2. Verify document list shows all uploads
- **Expected:** Each document shows:
  - Filename
  - Document type
  - Upload timestamp
  - Uploader name
  - Delete button

**TC079: Delete document works**
- **Steps:**
  1. Click delete button on a document
  2. Confirm deletion in dialog
- **Expected:**
  - Confirmation dialog appears
  - Document removed from list
  - Success toast notification
  - Checklist updates

**TC080: Completion checklist**
- **Steps:**
  1. View required documents checklist
  2. Upload documents of different types
  3. Observe checklist updates
- **Expected:**
  - Shows all required document types
  - Checkmarks appear for uploaded types
  - Missing documents highlighted

**TC081: Progress bar display**
- **Steps:**
  1. View progress bar at top of page
  2. Upload documents and observe changes
- **Expected:**
  - Progress bar shows percentage (e.g., "60% Complete")
  - Updates in real-time as documents uploaded
  - Visual indicator (color/fill) changes

---

### 🔍 Agent Review Display (TC082-TC089)

**Component:** `AgentReview.jsx` (283 lines)  
**Route:** `/applications/:id/review`  
**Priority:** High

#### Test Cases

**TC082: Agent review page loads**
- **Steps:**
  1. Login as RM or Analyst
  2. Navigate to a Submitted application
  3. Click "Run Agent Review" button
  4. Wait for review to complete
  5. Click "View Agent Review" button
- **Expected:** Agent review page displays with all sections

**TC083: Run review button works**
- **Steps:**
  1. On application detail page (Submitted status)
  2. Click "Run Agent Review" button
- **Expected:**
  - Loading state shows
  - API call completes
  - Success toast notification
  - Status changes to "In Review"
  - "View Agent Review" button appears

**TC084: Extracted fields display**
- **Steps:**
  1. On agent review page
  2. Scroll to "Extracted Fields" section
- **Expected:**
  - Shows mock OCR data from documents
  - Fields organized by document type
  - Data formatted properly

**TC085: Missing documents list**
- **Steps:**
  1. View "Missing Documents" section
- **Expected:**
  - Lists all required documents not yet uploaded
  - Clear indication of what's missing
  - Color-coded (red/warning)

**TC086: Data quality warnings**
- **Steps:**
  1. View "Data Quality Warnings" section
- **Expected:** Shows warnings such as:
  - Negative revenue
  - Collateral value too low
  - Inconsistent data
  - Missing information

**TC087: Risk flags display**
- **Steps:**
  1. View "Risk Flags" section
- **Expected:**
  - Shows top 3-5 risk factors
  - Color-coded by severity (red/yellow/green)
  - Clear descriptions
  - Severity indicators

**TC088: Recommendation display**
- **Steps:**
  1. View "Recommendation" section at bottom
- **Expected:**
  - Clear decision: Approve / Review / Reject
  - Reasoning provided
  - Confidence level or score

**TC089: Conditions display**
- **Steps:**
  1. View "Recommended Conditions" section
- **Expected:**
  - Lists pre-disbursement conditions
  - Lists post-disbursement conditions
  - Conditions are specific and actionable

---

### 📊 Credit Analysis View (TC090-TC098)

**Component:** `CreditAnalysis.jsx` (304 lines)  
**Route:** `/applications/:id/analysis`  
**Priority:** High

#### Test Cases

**TC090: Analysis page loads**
- **Steps:**
  1. Login as Analyst or Approver
  2. Navigate to In Review application
  3. Click "View Credit Analysis" button
- **Expected:** Credit analysis page displays with all metrics

**TC091: DSCR calculation display**
- **Steps:**
  1. View DSCR section
- **Expected:**
  - DSCR value displayed (e.g., "1.45")
  - Threshold comparison (e.g., "Min: 1.2")
  - Visual indicator (✓ or ✗)
  - Color coding (green if pass, red if fail)

**TC092: Net cashflow display**
- **Steps:**
  1. View Net Operating Cashflow section
- **Expected:**
  - Cashflow amount in PHP
  - Calculation breakdown (Revenue - Expenses)
  - Positive/negative indicator

**TC093: Collateral coverage display**
- **Steps:**
  1. View Collateral Coverage section
- **Expected:**
  - Coverage percentage (e.g., "150%")
  - Threshold comparison (e.g., "Min: 120%")
  - Visual indicator
  - Color coding

**TC094: Risk score display**
- **Steps:**
  1. View Risk Score section
- **Expected:**
  - Score 0-100 displayed prominently
  - Color-coded gauge or indicator
  - Risk level label (Low/Medium/High)
  - Score interpretation

**TC095: Financial breakdown**
- **Steps:**
  1. View Financial Details section
- **Expected:** Shows:
  - Monthly Revenue
  - Monthly Expenses
  - Existing Debt Payment
  - Net Income
  - All formatted as currency

**TC096: Risk flags list**
- **Steps:**
  1. View Risk Flags section
- **Expected:**
  - All identified risks listed
  - Matches agent review flags
  - Severity indicators
  - Mitigation suggestions

**TC097: Assumptions display**
- **Steps:**
  1. View Assumptions & Notes section
- **Expected:**
  - Analyst assumptions displayed
  - Notes field visible
  - Editable if user has permission
  - Save button if editable

**TC098: Threshold indicators**
- **Steps:**
  1. Review all metrics
  2. Check visual indicators
- **Expected:**
  - Green checkmark (✓) for metrics meeting thresholds
  - Red X (✗) for metrics failing thresholds
  - Consistent visual language

---

### ⚖️ Decision Workflow UI (TC099-TC107)

**Component:** `DecisionWorkflow.jsx` (485 lines)  
**Route:** `/applications/:id/decision`  
**Priority:** High

#### Test Cases

**TC099: Decision page loads**
- **Steps:**
  1. Login as Analyst
  2. Navigate to In Review application
  3. Click "Make Decision" button
- **Expected:** Decision workflow page displays

**TC100: Analyst recommendation form**
- **Steps:**
  1. As Analyst, view decision page
- **Expected:**
  - Recommendation form visible
  - Decision options available
  - Conditions input field
  - Submit button

**TC101: Recommendation options**
- **Steps:**
  1. View recommendation options
- **Expected:** Three options:
  - Approve
  - Review (need more info)
  - Reject

**TC102: Conditions input**
- **Steps:**
  1. Select "Approve" recommendation
  2. Add conditions using input field
  3. Click "Add Condition" button
  4. Add multiple conditions
  5. Remove a condition
- **Expected:**
  - Can add multiple conditions
  - Each condition has remove button
  - Conditions list updates dynamically

**TC103: Approver decision form**
- **Steps:**
  1. Logout and login as Approver
  2. Navigate to application with analyst recommendation
  3. View decision page
- **Expected:**
  - Analyst recommendation displayed (read-only)
  - Approver decision form visible
  - Final decision options
  - Submit button

**TC104: Final decision options**
- **Steps:**
  1. As Approver, view decision options
- **Expected:** Two options:
  - Approve (with conditions)
  - Reject (with reason)
- If Reject selected:
  - Rejection reason textarea appears

**TC105: RBAC enforcement**
- **Steps:**
  1. Test as different roles
  2. Verify access restrictions
- **Expected:**
  - RM: Cannot access decision page
  - Analyst: Can submit recommendation only
  - Approver: Can finalize decision only
  - Admin: Can override

**TC106: Read-only after finalization**
- **Steps:**
  1. As Approver, finalize decision
  2. Try to access decision page again
- **Expected:**
  - Decision displayed as read-only
  - No edit buttons
  - Message: "Decision finalized"

**TC107: Submit button works**
- **Steps:**
  1. Fill out decision form
  2. Click Submit button
- **Expected:**
  - Confirmation dialog appears
  - Loading state during submission
  - Success toast notification
  - Redirect to application detail
  - Status updated

---

### 📋 Credit Memo Viewer (TC108-TC115)

**Component:** `CreditMemo.jsx` (155 lines)  
**Route:** `/applications/:id/memo`  
**Priority:** High

#### Test Cases

**TC108: Memo viewer page loads**
- **Steps:**
  1. Login as any role
  2. Navigate to Approved or Rejected application
  3. Click "📄 View Credit Memo" button
- **Expected:** Credit memo viewer page displays

**TC109: Generate memo button**
- **Steps:**
  1. On memo viewer page
  2. Click "Generate Credit Memo" button
- **Expected:**
  - Loading state shows
  - API call completes
  - Memo displays in iframe
  - Success toast notification

**TC110: Memo content display**
- **Steps:**
  1. After generating memo
  2. View iframe content
- **Expected:**
  - HTML memo displays properly
  - All formatting preserved
  - Professional layout
  - Readable fonts and spacing

**TC111: Memo sections complete**
- **Steps:**
  1. Review memo content
  2. Verify all sections present
- **Expected:** Memo includes:
  - Header with title and date
  - Applicant Summary
  - Loan Request Summary
  - Financial Analysis (DSCR, cashflow, collateral)
  - Key Risks and Mitigations
  - Decision and Conditions
  - Audit Summary (who did what)
  - Signatories section

**TC112: Print functionality**
- **Steps:**
  1. Click "Print" button
- **Expected:**
  - Browser print dialog opens
  - Memo formatted for printing
  - Page breaks appropriate

**TC113: Download functionality**
- **Steps:**
  1. Click "Download" button
- **Expected:**
  - File download initiates
  - Filename format: `credit-memo-APP-2026-XXXX.html`
  - File opens correctly in browser

**TC114: Regenerate memo**
- **Steps:**
  1. View existing memo
  2. Click "Regenerate" button
- **Expected:**
  - Confirmation dialog
  - New memo generated with latest data
  - Iframe updates with new content

**TC115: Memo formatting**
- **Steps:**
  1. Review memo visual appearance
- **Expected:**
  - Professional styling
  - Proper headings hierarchy
  - Tables formatted correctly
  - Currency values formatted
  - Print-ready layout

---

### 📝 Application Form Testing (TC116-TC123)

**Component:** `ApplicationForm.jsx` (598 lines)  
**Routes:** `/applications/new`, `/applications/:id/edit`  
**Priority:** High

#### Test Cases

**TC116: Create new application**
- **Steps:**
  1. Login as RM
  2. Click "+ Create Application"
  3. Fill all required fields:
     - Applicant: Legal Name, Business Type, Industry, Years
     - Loan: Amount, Tenor, Purpose, Repayment Type
     - Financial: Revenue, Expenses, Debt Payment
     - Collateral: Type, Value
     - Owner: Name, ID, Credit Score
  4. Click "Create Application"
- **Expected:**
  - All fields accept input
  - Dropdowns work correctly
  - Currency fields format properly
  - Success toast notification
  - Redirect to application detail
  - New application appears in list

**TC117: Form validation on submit**
- **Steps:**
  1. On create form
  2. Leave required fields empty
  3. Click "Create Application"
- **Expected:**
  - Form does not submit
  - Error messages appear for missing fields
  - Fields highlighted in red
  - Error toast notification

**TC118: Edit existing application**
- **Steps:**
  1. Navigate to Draft application
  2. Click "Edit Application"
  3. Modify some fields
  4. Click "Update Application"
- **Expected:**
  - Form loads with existing data
  - Can modify all fields
  - Changes save successfully
  - Success toast notification
  - Updated data displays on detail page

**TC119: Currency input formatting**
- **Steps:**
  1. Enter values in currency fields
  2. Tab out of field
- **Expected:**
  - Values format with ₱ symbol
  - Thousands separators added
  - Decimal places handled correctly

**TC120: Dropdown selections save**
- **Steps:**
  1. Select values from all dropdowns
  2. Save form
  3. Reload page
- **Expected:**
  - All dropdown values persist
  - Correct options selected on reload

**TC121: Cancel button works**
- **Steps:**
  1. Make changes to form
  2. Click "Cancel" button
- **Expected:**
  - Confirmation dialog (if changes made)
  - Returns to previous page
  - Changes not saved

**TC122: Success notification**
- **Steps:**
  1. Successfully save form
- **Expected:**
  - Green success toast appears
  - Message: "Application created successfully" or "Application updated successfully"
  - Auto-dismisses after 5 seconds

**TC123: Error handling**
- **Steps:**
  1. Simulate API error (disconnect backend)
  2. Try to save form
- **Expected:**
  - Red error toast appears
  - Error message displayed
  - Form remains editable
  - Can retry submission

---

### 🔄 Status Transitions Testing (TC124-TC128)

**Priority:** High

#### Test Cases

**TC124: Submit for review**
- **Steps:**
  1. As RM, navigate to Draft application
  2. Click "Submit for Review" button
  3. Confirm in dialog
- **Expected:**
  - Confirmation dialog appears
  - Status changes: Draft → Submitted
  - Success toast notification
  - "Submit" button disappears
  - "Run Agent Review" button appears

**TC125: Run agent review**
- **Steps:**
  1. On Submitted application
  2. Click "Run Agent Review" button
- **Expected:**
  - Loading state shows
  - Status changes: Submitted → In Review
  - Success toast notification
  - "View Agent Review" button appears

**TC126: Approve application**
- **Steps:**
  1. As Approver, navigate to In Review application
  2. Go to Decision page
  3. Select "Approve" with conditions
  4. Submit decision
- **Expected:**
  - Status changes: In Review → Approved
  - Success toast notification
  - "Generate Credit Memo" button appears

**TC127: Reject application**
- **Steps:**
  1. As Approver, navigate to In Review application
  2. Go to Decision page
  3. Select "Reject" with reason
  4. Submit decision
- **Expected:**
  - Status changes: In Review → Rejected
  - Success toast notification
  - Rejection reason saved
  - "Generate Credit Memo" button appears

**TC128: Complete application**
- **Steps:**
  1. Navigate to Approved application
  2. Click "Mark as Completed" (if available)
- **Expected:**
  - Status changes: Approved → Completed
  - Success toast notification
  - Simulates disbursement

---

### 🔗 Integration & E2E Testing (TC129-TC130)

**Priority:** Critical

#### Test Cases

**TC129: End-to-end workflow**
- **Steps:**
  1. **As RM:**
     - Create new application
     - Upload required documents
     - Submit for review
  2. **As Analyst:**
     - Run agent review
     - View analysis
     - Submit recommendation (Approve)
  3. **As Approver:**
     - Review recommendation
     - Finalize decision (Approve with conditions)
  4. **As RM:**
     - Generate credit memo
     - View and download memo
- **Expected:**
  - Complete workflow executes smoothly
  - All status transitions work
  - Data persists correctly
  - Audit trail captures all actions
  - No errors or issues

**TC130: Multi-role workflow**
- **Steps:**
  1. Test workflow with role switching
  2. Verify RBAC at each step
  3. Ensure proper handoffs between roles
- **Expected:**
  - Each role can only perform authorized actions
  - Workflow progresses logically
  - No permission errors
  - Audit log shows all actors

---

## Test Data Requirements

### Applications Needed
- **Draft applications:** For create/edit/submit testing
- **Submitted applications:** For agent review testing
- **In Review applications:** For analysis/decision testing
- **Approved applications:** For memo generation testing
- **Rejected applications:** For memo generation testing

### Documents Needed
- Sample PDF files (bank statements, financial statements)
- Sample image files (ID scans, collateral photos)
- Various file sizes (small, medium, large)

### Test Scenarios
1. **Good Application:** Meets all thresholds, should approve
2. **Borderline Application:** Some risks, should review
3. **Poor Application:** Fails thresholds, should reject

---

## Success Criteria

### Component Level
- ✅ All UI components render correctly
- ✅ All buttons and inputs functional
- ✅ Data displays accurately
- ✅ Loading states work
- ✅ Error handling works

### Integration Level
- ✅ Components communicate correctly
- ✅ Data flows between pages
- ✅ Status transitions work
- ✅ RBAC enforced properly

### End-to-End Level
- ✅ Complete workflow executes
- ✅ Multi-role collaboration works
- ✅ Audit trail complete
- ✅ No data loss or corruption

---

## Defect Tracking

All defects found during testing should be logged in `QA/test_cases_and_issues.csv` with:
- Issue ID (ISS###)
- Category (Bug/Enhancement)
- Description
- Priority (Critical/High/Medium/Low)
- Steps to reproduce
- Expected vs Actual result

---

## Test Execution Schedule

### Day 1: Component Testing
- Document Upload (TC074-TC081)
- Agent Review (TC082-TC089)

### Day 2: Component Testing
- Credit Analysis (TC090-TC098)
- Decision Workflow (TC099-TC107)

### Day 3: Component Testing
- Credit Memo (TC108-TC115)
- Application Form (TC116-TC123)

### Day 4: Integration Testing
- Status Transitions (TC124-TC128)
- Cross-component workflows

### Day 5: E2E Testing
- Complete workflows (TC129-TC130)
- Regression testing
- Final verification

---

## Sign-Off

**Test Plan Prepared By:** QA Engineer (Bob)  
**Date:** March 12, 2026  
**Status:** Ready for Execution  
**Total Test Cases:** 57 new test cases (TC074-TC130)

---

**Next Steps:**
1. Execute test cases in order
2. Log results in CSV file
3. Report defects immediately
4. Update test status as completed
5. Prepare final test report