# Manual Testing Instructions
**Date:** March 16, 2026  
**Status:** Ready for Manual Execution  
**Estimated Time:** 4-5 hours

---

## ⚠️ Important Notice

The testing environment does not have npm/node in the PATH, so **manual testing is required**.

---

## Quick Start Guide

### Step 1: Start the Servers

Open **two terminal windows**:

**Terminal 1 - Backend Server:**
```bash
cd /Users/robi/Documents/GitHub/los_bobdemo/backend
npm run dev
```

Expected output:
```
Server running on port 3001
```

**Terminal 2 - Frontend Server:**
```bash
cd /Users/robi/Documents/GitHub/los_bobdemo/frontend
npm run dev
```

Expected output:
```
VITE v6.0.11  ready in XXX ms
➜  Local:   http://localhost:5173/
```

---

### Step 2: Open the Application

1. Open your web browser
2. Navigate to: **http://localhost:5173**
3. You should see the login page

---

### Step 3: Login

Use any of these test accounts:

| Role | Username | Password |
|------|----------|----------|
| RM (Relationship Manager) | rm1 | password123 |
| Credit Analyst | analyst1 | password123 |
| Approver | approver1 | password123 |
| Admin | admin1 | password123 |

**Recommended:** Start with **rm1/password123** (RM role)

---

### Step 4: Follow the Testing Guide

Open the detailed testing guide:
- **File:** [`QA/REMAINING_TESTS_GUIDE.md`](QA/REMAINING_TESTS_GUIDE.md)
- **Tests:** 68 remaining tests organized in 7 phases
- **Format:** Step-by-step instructions with expected results

---

## Testing Phases Overview

### Phase 1: Document Upload (30 min)
**Tests:** TC075-TC081 (7 tests)  
**What to test:**
- File selection and upload
- Document type dropdown
- Delete functionality
- Completion checklist

**How to start:**
1. Login as RM (rm1/password123)
2. Click on any Draft application (e.g., APP-2026-0001)
3. Click "Manage Documents" button
4. Follow test cases TC075-TC081

---

### Phase 2: Agent Review (30 min)
**Tests:** TC083-TC089 (6 tests)  
**What to test:**
- Run review button
- Extracted fields display
- Risk flags and warnings
- Recommendations

**How to start:**
1. Login as RM or Analyst
2. Find a Submitted application
3. Click "Run Agent Review" button
4. Follow test cases TC083-TC089

---

### Phase 3: Decision Workflow (45 min)
**Tests:** TC099-TC107 (9 tests)  
**What to test:**
- Analyst recommendation form
- Approver decision form
- RBAC enforcement
- Submit functionality

**How to start:**
1. Login as Analyst (analyst1/password123)
2. Find an In Review application
3. Click "Make Decision" button
4. Follow test cases TC099-TC107

---

### Phase 4: Credit Memo (30 min)
**Tests:** TC108-TC115 (8 tests)  
**What to test:**
- Generate memo button
- Memo content display
- Print/download functionality
- Regenerate memo

**How to start:**
1. Login as any role
2. Find an Approved application
3. Click "View Credit Memo" button
4. Follow test cases TC108-TC115

---

### Phase 5: Application Form (45 min)
**Tests:** TC116-TC123 (8 tests)  
**What to test:**
- Create new application
- Form validation
- Edit existing application
- Success/error handling

**How to start:**
1. Login as RM (rm1/password123)
2. Click "Create Application" button
3. Follow test cases TC116-TC123

---

### Phase 6: Status Transitions (30 min)
**Tests:** TC124-TC128 (5 tests)  
**What to test:**
- All status transitions
- Audit logging
- Button availability

**How to start:**
1. Use multiple user roles
2. Test each status transition
3. Follow test cases TC124-TC128

---

### Phase 7: Integration Tests (60 min)
**Tests:** TC129-TC130 (2 tests)  
**What to test:**
- Complete end-to-end workflow
- Multi-role workflow

**How to start:**
1. Create a fresh application
2. Complete entire workflow
3. Follow test cases TC129-TC130

---

## Recording Test Results

### Option 1: Simple Notes
Create a text file with results:
```
TC075: File Selection - PASSED
TC076: Document Type Dropdown - PASSED
TC077: Upload Button - FAILED - Error: "Upload timeout"
...
```

### Option 2: Update CSV Directly
Open [`QA/test_cases_and_issues.csv`](QA/test_cases_and_issues.csv) and update:
- **Status:** Change from "Not Tested" to "Passed" or "Failed"
- **Actual Result:** Add what you observed
- **Issue Description:** If failed, describe the problem

### Option 3: Screenshots
Take screenshots of:
- Any errors or bugs
- Successful completions
- Unexpected behavior

---

## What to Look For

### ✅ Success Indicators
- Pages load without errors
- Buttons work as expected
- Data saves correctly
- Toast notifications appear
- Status changes properly
- Audit log entries created

### ❌ Failure Indicators
- Console errors (F12 → Console tab)
- 404 or 500 errors
- Buttons don't respond
- Data doesn't save
- Missing UI elements
- Incorrect calculations

---

## Troubleshooting

### Backend Not Starting
**Problem:** `npm run dev` fails in backend  
**Solution:**
```bash
cd backend
npm install
npm run dev
```

### Frontend Not Starting
**Problem:** `npm run dev` fails in frontend  
**Solution:**
```bash
cd frontend
npm install
npm run dev
```

### Port Already in Use
**Problem:** "Port 3001 already in use"  
**Solution:**
```bash
# Find and kill the process
lsof -ti:3001 | xargs kill -9
# Or use a different port in backend/.env
```

### Login Not Working
**Problem:** Cannot login with test credentials  
**Solution:**
1. Check backend is running (port 3001)
2. Check browser console for errors
3. Try clearing browser cache
4. Verify backend/data/users.json exists

### Application Not Loading
**Problem:** Frontend shows blank page  
**Solution:**
1. Check browser console (F12)
2. Verify frontend is running (port 5173)
3. Check network tab for failed requests
4. Try hard refresh (Cmd+Shift+R)

---

## Test Data Reference

### User Accounts
```
RM:       rm1/password123
Analyst:  analyst1/password123
Approver: approver1/password123
Admin:    admin1/password123
```

### Sample Applications
- **APP-2026-0001** - ABC Trading Corp (Draft)
- **APP-2026-0006** - Elite Services Group (Draft)
- **APP-2026-0011** - Fresh Market Supplies (In Review)
- **APP-2026-0016** - Global Logistics Inc (Approved)

### Document Types
1. Bank Statement
2. Financial Statement
3. ID/KYC
4. Collateral Proof
5. Other

---

## After Testing

### Share Your Results

**Option 1: Simple Summary**
```
Completed: 68 tests
Passed: 65
Failed: 3
Issues found: 2 bugs

Failed Tests:
- TC077: Upload timeout error
- TC099: Decision form not loading
- TC115: Memo formatting issue

New Bugs:
- ISS027: Document upload times out after 30 seconds
- ISS028: Decision page returns 500 error for some applications
```

**Option 2: Detailed Report**
Share the updated CSV file or your notes file

**Option 3: Screenshots**
Share screenshots of any issues found

---

## Expected Results Summary

Based on previous testing sessions:

**Expected Pass Rate:** 95%+ (64-65 out of 68 tests)

**Known Working Features:**
- ✅ Authentication (100% pass rate)
- ✅ Dashboard (100% pass rate)
- ✅ Applications List (100% pass rate)
- ✅ Application Detail (100% pass rate)
- ✅ Credit Analysis (100% pass rate)
- ✅ Error Handling (100% pass rate)

**Features to Watch:**
- ⚠️ Document Upload (new functionality)
- ⚠️ Agent Review (complex logic)
- ⚠️ Decision Workflow (multi-role)
- ⚠️ Status Transitions (workflow rules)

---

## Quality Checklist

Before reporting completion, verify:

- [ ] All 68 tests executed
- [ ] Results recorded (Passed/Failed)
- [ ] Any bugs documented with details
- [ ] Screenshots captured for issues
- [ ] Console errors noted
- [ ] Audit log checked for all actions
- [ ] Multiple user roles tested
- [ ] End-to-end workflow completed

---

## Support

If you encounter issues or have questions:

1. **Check the detailed guide:** [`QA/REMAINING_TESTS_GUIDE.md`](QA/REMAINING_TESTS_GUIDE.md)
2. **Review previous test sessions:** [`QA/BROWSER_TEST_SESSION_3_FINAL.md`](QA/BROWSER_TEST_SESSION_3_FINAL.md)
3. **Check implementation docs:** [`IMPLEMENTATION_SUMMARY.md`](IMPLEMENTATION_SUMMARY.md)
4. **Report back with:**
   - What you were testing
   - What happened
   - Error messages
   - Screenshots

---

## Success Criteria

Testing is complete when:

✅ All 68 tests executed  
✅ Results documented  
✅ Pass rate ≥ 95%  
✅ Critical bugs identified  
✅ Integration tests passed  
✅ Ready for demo

---

**Good luck with testing!** 🚀

The application is fully implemented and ready for comprehensive testing. Take your time, follow the guide, and document everything you find.

---

**Document Version:** 1.0  
**Created:** March 16, 2026  
**Status:** 🟢 Ready for Manual Testing  
**Estimated Duration:** 4-5 hours