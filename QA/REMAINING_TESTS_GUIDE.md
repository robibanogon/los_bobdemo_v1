# Remaining Tests Execution Guide
**Date:** March 16, 2026  
**Purpose:** Manual testing guide for remaining untested features  
**Prerequisites:** Backend running on port 3001, Frontend running on port 5173

---

## Test Execution Summary

**Total Remaining Tests:** 68  
**Categories:**
- Document Upload Functionality: 7 tests
- Agent Review Functionality: 6 tests  
- Decision Workflow: 9 tests
- Credit Memo: 8 tests
- Application Form: 8 tests
- Status Transitions: 5 tests
- Audit Log: 6 tests (already passed in previous sessions)
- Integration Tests: 2 tests

---

## Phase 1: Document Upload Functionality (7 Tests)

### Prerequisites
- Login as RM (rm1/password123)
- Navigate to a Draft application (e.g., APP-2026-0001)
- Click "Manage Documents" button

### TC075: File Selection Works
**Test ID:** TC075  
**Priority:** High  
**Steps:**
1. On Document Upload page, locate "Upload New Document" section
2. Click "Choose File" button
3. Select a test file from your computer (any PDF, JPG, or PNG)
4. Verify file name appears next to button

**Expected Result:** File name displays after selection  
**Pass Criteria:** File input shows selected filename

---

### TC076: Document Type Dropdown
**Test ID:** TC076  
**Priority:** High  
**Steps:**
1. Click "Document Type" dropdown
2. Verify all options are present:
   - Bank Statement
   - Financial Statement
   - ID/KYC
   - Collateral Proof
   - Other

**Expected Result:** All 5 document types available  
**Pass Criteria:** Dropdown shows all required types

---

### TC077: Upload Button Functional
**Test ID:** TC077  
**Priority:** High  
**Steps:**
1. Select a file (e.g., test.pdf)
2. Choose document type (e.g., "Bank Statement")
3. Click "Upload Document" button
4. Observe loading state
5. Wait for completion

**Expected Result:** 
- Button shows loading state during upload
- Success toast notification appears
- Document appears in list below

**Pass Criteria:** Upload completes successfully with feedback

---

### TC078: Document List Displays
**Test ID:** TC078  
**Priority:** Medium  
**Steps:**
1. After uploading document, scroll to "Uploaded Documents" section
2. Verify document appears in list with:
   - Filename
   - Document type
   - Upload date/time
   - Uploader name
   - Delete button

**Expected Result:** Document displays with all metadata  
**Pass Criteria:** All document information visible

---

### TC079: Delete Document Works
**Test ID:** TC079  
**Priority:** Medium  
**Steps:**
1. Locate uploaded document in list
2. Click "Delete" button (red)
3. Verify confirmation dialog appears
4. Click "Confirm" or "OK"
5. Verify document removed from list

**Expected Result:** 
- Confirmation dialog shows
- Document deleted after confirmation
- Success toast appears

**Pass Criteria:** Document successfully removed

---

### TC080: Completion Checklist
**Test ID:** TC080  
**Priority:** Medium  
**Steps:**
1. View "Document Checklist" section at top
2. Note initial completion percentage (e.g., 0%)
3. Upload a "Bank Statement" document
4. Verify checklist updates:
   - Bank Statement shows checkmark (✓)
   - Completion percentage increases (e.g., 25%)
5. Upload remaining required documents
6. Verify 100% completion when all uploaded

**Expected Result:** 
- Checklist updates in real-time
- Percentage reflects completion
- Visual indicators (✓) appear

**Pass Criteria:** Checklist accurately tracks uploads

---

### TC081: Progress Bar Display
**Test ID:** TC081  
**Priority:** Low  
**Steps:**
1. Observe progress bar in Document Checklist
2. Note visual representation of completion
3. Upload documents and watch progress increase

**Expected Result:** Progress bar fills as documents uploaded  
**Pass Criteria:** Visual progress indicator works

---

## Phase 2: Agent Review Functionality (6 Tests)

### Prerequisites
- Login as RM or Analyst
- Navigate to a Submitted application
- Click "Run Agent Review" button (if available)
- Or navigate to existing In Review application

### TC083: Run Review Button Works
**Test ID:** TC083  
**Priority:** High  
**Steps:**
1. On Application Detail page (Submitted status)
2. Locate "Run Agent Review" button
3. Click button
4. Observe loading state
5. Wait for completion
6. Verify status changes to "In Review"

**Expected Result:** 
- Button triggers review process
- Loading indicator shows
- Status updates to "In Review"
- Success toast appears

**Pass Criteria:** Review runs successfully

---

### TC084: Extracted Fields Display
**Test ID:** TC084  
**Priority:** Medium  
**Steps:**
1. Navigate to Agent Review page (/applications/:id/review)
2. Locate "Extracted Fields" section
3. Verify fields display:
   - Total Credits
   - Total Debits
   - Revenue
   - Expenses
   - Other financial data

**Expected Result:** Extracted data from documents displays  
**Pass Criteria:** All extracted fields visible

---

### TC085: Missing Documents List
**Test ID:** TC085  
**Priority:** High  
**Steps:**
1. On Agent Review page
2. Locate "Missing Documents" section
3. Verify list shows any missing required documents
4. If all uploaded, verify "All required documents uploaded" message

**Expected Result:** Missing documents clearly listed  
**Pass Criteria:** Accurate missing document tracking

---

### TC086: Data Quality Warnings
**Test ID:** TC086  
**Priority:** Medium  
**Steps:**
1. On Agent Review page
2. Locate "Data Quality Warnings" section
3. Verify warnings display for issues like:
   - Negative revenue
   - Collateral too low
   - Missing data
   - Inconsistent data

**Expected Result:** Quality issues flagged  
**Pass Criteria:** Warnings display when applicable

---

### TC087: Risk Flags Display
**Test ID:** TC087  
**Priority:** High  
**Steps:**
1. On Agent Review page
2. Locate "Risk Flags" section
3. Verify top 3-5 risk factors listed
4. Check color-coding (red/yellow/green)
5. Verify severity indicators

**Expected Result:** 
- Top risks identified
- Color-coded by severity
- Clear descriptions

**Pass Criteria:** Risk flags comprehensive and clear

---

### TC088: Recommendation Display
**Test ID:** TC088  
**Priority:** High  
**Steps:**
1. On Agent Review page
2. Locate "Recommendation" section
3. Verify shows one of:
   - Approve
   - Review (needs more info)
   - Reject
4. Check for recommended conditions if Approve

**Expected Result:** 
- Clear recommendation displayed
- Conditions listed if applicable
- Reasoning provided

**Pass Criteria:** Recommendation clear and actionable

---

### TC089: Conditions Display
**Test ID:** TC089  
**Priority:** Medium  
**Steps:**
1. On Agent Review page with "Approve" recommendation
2. Locate "Recommended Conditions" section
3. Verify conditions listed:
   - Pre-disbursement conditions
   - Post-disbursement conditions
4. Check condition descriptions

**Expected Result:** Conditions clearly listed  
**Pass Criteria:** All conditions visible and understandable

---

## Phase 3: Decision Workflow (9 Tests)

### Prerequisites
- Login as Credit Analyst (analyst1/password123)
- Navigate to In Review application
- Click "Make Decision" button

### TC099: Decision Page Loads
**Test ID:** TC099  
**Priority:** High  
**Steps:**
1. Navigate to /applications/:id/decision
2. Verify page loads without errors
3. Check all sections present:
   - Application summary
   - Analysis summary
   - Recommendation form (if Analyst)
   - Decision form (if Approver)

**Expected Result:** Page loads with appropriate form  
**Pass Criteria:** No errors, correct form displays

---

### TC100: Analyst Recommendation Form
**Test ID:** TC100  
**Priority:** High  
**Steps:**
1. As Credit Analyst, view Decision page
2. Verify "Analyst Recommendation" form visible
3. Check form fields:
   - Recommendation dropdown
   - Notes textarea
   - Conditions input
   - Submit button

**Expected Result:** Complete recommendation form displays  
**Pass Criteria:** All form elements present

---

### TC101: Recommendation Options
**Test ID:** TC101  
**Priority:** High  
**Steps:**
1. Click "Recommendation" dropdown
2. Verify options:
   - Approve
   - Need More Information
   - Reject

**Expected Result:** All 3 options available  
**Pass Criteria:** Dropdown shows all options

---

### TC102: Conditions Input
**Test ID:** TC102  
**Priority:** Medium  
**Steps:**
1. In recommendation form, locate "Conditions" section
2. Click "Add Condition" button
3. Enter condition text
4. Click "Add" or press Enter
5. Verify condition appears in list
6. Click "Remove" on a condition
7. Verify condition removed

**Expected Result:** 
- Can add multiple conditions
- Can remove conditions
- List updates dynamically

**Pass Criteria:** Condition management works

---

### TC103: Approver Decision Form
**Test ID:** TC103  
**Priority:** High  
**Steps:**
1. Logout and login as Approver (approver1/password123)
2. Navigate to application with Analyst recommendation
3. View Decision page
4. Verify "Approver Decision" form visible
5. Check form fields:
   - Final decision dropdown
   - Approval conditions (if approve)
   - Rejection reason (if reject)
   - Submit button

**Expected Result:** Approver form displays  
**Pass Criteria:** Correct form for Approver role

---

### TC104: Final Decision Options
**Test ID:** TC104  
**Priority:** High  
**Steps:**
1. As Approver, click "Final Decision" dropdown
2. Verify options:
   - Approve
   - Reject

**Expected Result:** Both options available  
**Pass Criteria:** Dropdown shows approve/reject

---

### TC105: RBAC Enforcement
**Test ID:** TC105  
**Priority:** High  
**Steps:**
1. Login as RM (rm1/password123)
2. Try to access Decision page
3. Verify appropriate access control:
   - Either redirected
   - Or view-only mode
4. Login as Analyst - verify can submit recommendation
5. Login as Approver - verify can finalize decision

**Expected Result:** 
- RM cannot make decisions
- Analyst can recommend
- Approver can finalize

**Pass Criteria:** Role-based access working

---

### TC106: Read-Only After Finalization
**Test ID:** TC106  
**Priority:** High  
**Steps:**
1. As Approver, finalize a decision (Approve or Reject)
2. Submit decision
3. Try to access Decision page again
4. Verify form is read-only or shows "Decision Finalized"
5. Verify no edit buttons available

**Expected Result:** 
- Decision cannot be changed
- Form shows read-only state
- Clear message displayed

**Pass Criteria:** Finalized decisions locked

---

### TC107: Submit Button Functionality
**Test ID:** TC107  
**Priority:** High  
**Steps:**
1. Fill out recommendation/decision form
2. Click "Submit" button
3. Verify confirmation dialog (if any)
4. Confirm submission
5. Verify:
   - Loading state on button
   - Success toast notification
   - Redirect to application detail
   - Status updated (if applicable)

**Expected Result:** 
- Submission successful
- User feedback provided
- Application updated

**Pass Criteria:** Submit process complete

---

## Phase 4: Credit Memo (8 Tests)

### Prerequisites
- Login as any role
- Navigate to Approved application
- Click "View Credit Memo" or "Generate Memo"

### TC108: Memo Viewer Page Loads
**Test ID:** TC108  
**Priority:** High  
**Steps:**
1. Navigate to /applications/:id/memo
2. Verify page loads without errors
3. Check page elements:
   - Application info header
   - Generate/Regenerate button
   - Print button
   - Download button
   - Memo display area (iframe)

**Expected Result:** Page loads with all controls  
**Pass Criteria:** No errors, all buttons visible

---

### TC109: Generate Memo Button
**Test ID:** TC109  
**Priority:** High  
**Steps:**
1. On Credit Memo page
2. Click "Generate Credit Memo" button
3. Observe loading state
4. Wait for generation
5. Verify memo appears in iframe below

**Expected Result:** 
- Button shows loading
- Memo generates successfully
- HTML displays in iframe

**Pass Criteria:** Memo generation works

---

### TC110: Memo Content Display
**Test ID:** TC110  
**Priority:** High  
**Steps:**
1. After generating memo, view iframe content
2. Verify memo is readable
3. Check formatting and layout
4. Verify all text visible

**Expected Result:** 
- Memo displays in iframe
- Content readable
- Professional formatting

**Pass Criteria:** Memo displays correctly

---

### TC111: Memo Sections Complete
**Test ID:** TC111  
**Priority:** High  
**Steps:**
1. Review generated memo content
2. Verify all required sections present:
   - Applicant Summary
   - Loan Request Summary
   - Financial Analysis (DSCR, cashflow, collateral)
   - Key Risks and Mitigations
   - Decision and Conditions
   - Audit Summary (who did what)

**Expected Result:** All 6 sections present  
**Pass Criteria:** Complete memo with all sections

---

### TC112: Print Functionality
**Test ID:** TC112  
**Priority:** Medium  
**Steps:**
1. Click "Print" button
2. Verify browser print dialog opens
3. Check print preview shows memo
4. Cancel print (or print to PDF)

**Expected Result:** 
- Print dialog opens
- Memo formatted for printing
- Print preview correct

**Pass Criteria:** Print function works

---

### TC113: Download Functionality
**Test ID:** TC113  
**Priority:** Medium  
**Steps:**
1. Click "Download" button
2. Verify file download starts
3. Check downloaded file:
   - Filename format (e.g., credit-memo-APP-2026-0001.html)
   - File opens in browser
   - Content matches displayed memo

**Expected Result:** 
- File downloads successfully
- HTML file format
- Content preserved

**Pass Criteria:** Download works correctly

---

### TC114: Regenerate Memo
**Test ID:** TC114  
**Priority:** Medium  
**Steps:**
1. Generate memo once
2. Make a change to application (if possible)
3. Click "Regenerate Memo" button
4. Verify new memo reflects changes
5. Compare timestamps

**Expected Result:** 
- Memo regenerates with latest data
- Timestamp updates
- Changes reflected

**Pass Criteria:** Regeneration works

---

### TC115: Memo Formatting
**Test ID:** TC115  
**Priority:** Low  
**Steps:**
1. Review generated memo
2. Check formatting elements:
   - Headers and titles
   - Tables (if any)
   - Lists
   - Spacing and margins
   - Font sizes
   - Professional appearance

**Expected Result:** 
- Professional layout
- Print-ready formatting
- Clear hierarchy

**Pass Criteria:** Memo looks professional

---

## Phase 5: Application Form (8 Tests)

### Prerequisites
- Login as RM (rm1/password123)
- Click "Create Application" button

### TC116: Create New Application
**Test ID:** TC116  
**Priority:** High  
**Steps:**
1. Fill out all form sections:
   - **Applicant:** Legal name, business type, industry, years in business
   - **Loan Request:** Amount, tenor, purpose, repayment type
   - **Financial:** Monthly revenue, expenses, debt payment
   - **Collateral:** Type, estimated value
   - **Owner:** Name, ID number, credit score
2. Click "Create Application" button
3. Verify success toast
4. Verify redirect to new application detail
5. Check all data saved correctly

**Expected Result:** 
- Application created successfully
- All data persisted
- New application ID assigned

**Pass Criteria:** Complete create flow works

---

### TC117: Form Validation on Submit
**Test ID:** TC117  
**Priority:** High  
**Steps:**
1. On create form, leave required fields empty
2. Click "Create Application" button
3. Verify validation errors display:
   - Red borders on invalid fields
   - Error messages below fields
   - Form does not submit
4. Fill in missing fields
5. Verify errors clear
6. Submit successfully

**Expected Result:** 
- Required fields validated
- Clear error messages
- Prevents invalid submission

**Pass Criteria:** Validation works correctly

---

### TC118: Edit Existing Application
**Test ID:** TC118  
**Priority:** High  
**Steps:**
1. Navigate to Draft application
2. Click "Edit Application" button
3. Verify form loads with existing data
4. Modify some fields (e.g., loan amount)
5. Click "Update Application" button
6. Verify success toast
7. Verify changes saved
8. Check audit log for edit action

**Expected Result:** 
- Form pre-filled with data
- Changes save successfully
- Audit trail created

**Pass Criteria:** Edit flow works

---

### TC119: Currency Input Formatting
**Test ID:** TC119  
**Priority:** Medium  
**Steps:**
1. In form, locate currency fields:
   - Loan Amount
   - Monthly Revenue
   - Monthly Expenses
   - Collateral Value
2. Enter numbers (e.g., 100000)
3. Verify formatting:
   - ₱ symbol appears
   - Commas for thousands
   - Proper decimal handling

**Expected Result:** 
- Currency formatted as ₱100,000
- User-friendly input

**Pass Criteria:** Currency formatting works

---

### TC120: Dropdown Selections Save
**Test ID:** TC120  
**Priority:** Medium  
**Steps:**
1. Select values from dropdowns:
   - Business Type
   - Industry
   - Collateral Type
   - Repayment Type
2. Submit form
3. View saved application
4. Verify all dropdown values saved correctly

**Expected Result:** Dropdown selections persist  
**Pass Criteria:** All dropdowns save correctly

---

### TC121: Cancel Button Works
**Test ID:** TC121  
**Priority:** Medium  
**Steps:**
1. Start filling out form
2. Make some changes
3. Click "Cancel" button
4. Verify confirmation dialog (if any)
5. Confirm cancellation
6. Verify:
   - Redirected to previous page
   - Changes not saved

**Expected Result:** 
- Cancel returns without saving
- No data persisted

**Pass Criteria:** Cancel works correctly

---

### TC122: Success Notification
**Test ID:** TC122  
**Priority:** Medium  
**Steps:**
1. Successfully create or edit application
2. Observe toast notification
3. Verify:
   - Green success toast
   - Appropriate message
   - Auto-dismiss after 3-5 seconds

**Expected Result:** Success feedback provided  
**Pass Criteria:** Toast notification works

---

### TC123: Error Handling
**Test ID:** TC123  
**Priority:** Medium  
**Steps:**
1. Simulate error (e.g., stop backend)
2. Try to submit form
3. Verify error handling:
   - Error toast displays
   - User-friendly message
   - Form remains filled
   - Can retry

**Expected Result:** 
- Error caught gracefully
- User informed
- Can recover

**Pass Criteria:** Error handling works

---

## Phase 6: Status Transitions (5 Tests)

### TC124: Submit for Review (Draft → Submitted)
**Test ID:** TC124  
**Priority:** High  
**Steps:**
1. Login as RM
2. Navigate to Draft application
3. Click "Submit for Review" button
4. Verify confirmation dialog
5. Confirm submission
6. Verify:
   - Status changes to "Submitted"
   - Status badge updates
   - Success toast
   - Audit log entry created
   - Button no longer available

**Expected Result:** Status transitions successfully  
**Pass Criteria:** Draft → Submitted works

---

### TC125: Run Agent Review (Submitted → In Review)
**Test ID:** TC125  
**Priority:** High  
**Steps:**
1. Login as RM or Analyst
2. Navigate to Submitted application
3. Click "Run Agent Review" button
4. Wait for review to complete
5. Verify:
   - Status changes to "In Review"
   - Review results available
   - Success toast
   - Audit log entry

**Expected Result:** Review runs and status updates  
**Pass Criteria:** Submitted → In Review works

---

### TC126: Approve Application (In Review → Approved)
**Test ID:** TC126  
**Priority:** High  
**Steps:**
1. Login as Approver
2. Navigate to In Review application
3. Go to Decision page
4. Select "Approve" decision
5. Add approval conditions
6. Submit decision
7. Verify:
   - Status changes to "Approved"
   - Conditions saved
   - Success toast
   - Audit log entry

**Expected Result:** Application approved  
**Pass Criteria:** In Review → Approved works

---

### TC127: Reject Application (In Review → Rejected)
**Test ID:** TC127  
**Priority:** High  
**Steps:**
1. Login as Approver
2. Navigate to In Review application
3. Go to Decision page
4. Select "Reject" decision
5. Enter rejection reason
6. Submit decision
7. Verify:
   - Status changes to "Rejected"
   - Reason saved
   - Success toast
   - Audit log entry
   - No further actions available

**Expected Result:** Application rejected  
**Pass Criteria:** In Review → Rejected works

---

### TC128: Complete Application (Approved → Completed)
**Test ID:** TC128  
**Priority:** Medium  
**Steps:**
1. Login as RM or Admin
2. Navigate to Approved application
3. Click "Mark as Completed" button (if available)
4. Verify confirmation dialog
5. Confirm completion
6. Verify:
   - Status changes to "Completed"
   - Simulated disbursement logged
   - Success toast
   - Audit log entry

**Expected Result:** Application marked complete  
**Pass Criteria:** Approved → Completed works

---

## Phase 7: Integration Tests (2 Tests)

### TC129: End-to-End Workflow
**Test ID:** TC129  
**Priority:** Critical  
**Steps:**
1. **Create:** Login as RM, create new application
2. **Upload:** Upload all required documents
3. **Submit:** Submit application for review
4. **Review:** Run agent review
5. **Analyze:** View credit analysis
6. **Recommend:** Login as Analyst, submit recommendation
7. **Approve:** Login as Approver, approve application
8. **Memo:** Generate credit memo
9. **Complete:** Mark as completed
10. **Audit:** Review audit log for all actions

**Expected Result:** 
- Complete workflow executes
- All transitions work
- Data persists correctly
- Audit trail complete

**Pass Criteria:** Full E2E workflow successful

---

### TC130: Multi-Role Workflow
**Test ID:** TC130  
**Priority:** Critical  
**Steps:**
1. **RM Actions:**
   - Create application
   - Upload documents
   - Submit for review
2. **Analyst Actions:**
   - Login as analyst1
   - Review application
   - View analysis
   - Submit recommendation
3. **Approver Actions:**
   - Login as approver1
   - Review recommendation
   - Make final decision
   - Add conditions
4. **Verify:**
   - Each role sees appropriate UI
   - RBAC enforced
   - Workflow progresses
   - All actions logged

**Expected Result:** 
- Role transitions smooth
- RBAC working
- Workflow complete

**Pass Criteria:** Multi-role workflow successful

---

## Test Execution Checklist

### Before Testing
- [ ] Backend server running (port 3001)
- [ ] Frontend server running (port 5173)
- [ ] Test data seeded (30 applications)
- [ ] All user accounts available
- [ ] Browser console open for error monitoring

### During Testing
- [ ] Record all test results in CSV
- [ ] Take screenshots of issues
- [ ] Note any unexpected behavior
- [ ] Check console for errors
- [ ] Verify audit log entries

### After Testing
- [ ] Update test_cases_and_issues.csv
- [ ] Document any new bugs found
- [ ] Create bug reports for failures
- [ ] Update testing status summary
- [ ] Generate final test report

---

## Expected Test Results Summary

**High Priority Tests:** 45  
**Medium Priority Tests:** 20  
**Low Priority Tests:** 3  
**Critical Tests:** 2

**Estimated Testing Time:**
- Phase 1 (Documents): 30 minutes
- Phase 2 (Agent Review): 30 minutes
- Phase 3 (Decision): 45 minutes
- Phase 4 (Memo): 30 minutes
- Phase 5 (Form): 45 minutes
- Phase 6 (Status): 30 minutes
- Phase 7 (Integration): 60 minutes

**Total Estimated Time:** 4-5 hours

---

## Notes for Testers

1. **Test in Order:** Follow phases sequentially for best results
2. **Use Different Applications:** Test with various application statuses
3. **Check Audit Log:** Verify every action is logged
4. **Test RBAC:** Switch between user roles frequently
5. **Document Everything:** Record all observations
6. **Report Bugs Immediately:** Don't wait until end of testing
7. **Take Breaks:** Testing is intensive - take regular breaks

---

**Document Version:** 1.0  
**Last Updated:** March 16, 2026  
**Status:** Ready for Execution