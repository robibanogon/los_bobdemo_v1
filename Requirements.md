# Loan Origination System (LOS) — Simple MVP Requirements (SME Credit)

## 1) Goal
Build a **demo-ready** web application that lets bank users process SME loan applications in the Philippines end-to-end: **intake → document upload → automated credit analysis → decision → generate credit memo**, with a clear **audit trail**. This is an **MVP demo** (not production): no external integrations required.

---

## 2) Users & Roles
- **RM (Relationship Manager)**: creates applications, uploads documents, runs review, submits for approval.
- **Credit Analyst**: reviews analysis, edits assumptions/notes, recommends decision.
- **Approver**: approves/rejects, adds approval conditions.
- **Admin (Optional for MVP)**: manages simple policy thresholds (config).

---

## 3) Storage (MVP, No Database)
- The MVP **must not require a database**.
- Persist data using **local file storage** (e.g., JSON files under a `/data` folder) so the app can restart without losing data.
- Store uploaded documents in a local folder and keep their metadata in the application data.

---

## 4) Core Workflow (Statuses)
Application status must move through:
1. **Draft**
2. **Submitted**
3. **In Review**
4. **Approved** or **Rejected**
5. **Completed (Simulated Disbursement)**

**Rules**
- Only **Draft** can be edited freely.
- **Submitted/In Review** can only edit **notes/assumptions**, and edits must be logged.

---

## 5) Main Screens (UI Requirements)

### 5.1 Login (Simple)
- Hardcoded users or basic username/password (no SSO).

### 5.2 Application List
- Table columns: `Application ID`, `Applicant Name`, `Product Type`, `Amount`, `Status`, `Last Updated`, `Owner`
- Search + filter by status.

### 5.3 Create / Edit Application (Intake Form)
**Required fields**
- Applicant: legal name, business type, industry, years in business
- Loan request: amount, tenor (months), purpose, repayment type
- Financial snapshot: monthly revenue, monthly expenses, existing monthly debt payment
- Collateral: collateral type, estimated collateral value
- Owner info (simplified): owner name, ID number, credit score (mock number)

### 5.4 Document Upload
- Upload documents with `doc_type`: Bank Statement, Financial Statement, ID/KYC, Collateral Proof, Other
- Store metadata: filename, type, upload time, uploader
- Show **required docs checklist** and **completion percentage**

### 5.5 Agent Review (One-Click)
Button: **Run Agent Review**

**Output must show**
- Extracted key fields (can be mocked/simple parsing)
- Missing documents list
- Data quality warnings (e.g., negative revenue, collateral too low)
- Risk flags (top 3–5)
- Recommended decision: `Approve` / `Review` / `Reject`
- Recommended conditions (if approve)

### 5.6 Credit Analysis
Must compute and display:
- **DSCR (Debt Service Coverage Ratio)** (simple formula acceptable for demo)
- **Net Operating Cashflow** = monthly revenue − monthly expenses
- **Collateral Coverage** = collateral value / loan amount
- **Simple Risk Score** (0–100) based on thresholds
- Notes + analyst assumptions (editable in review)

### 5.7 Decision & Approval
- Credit Analyst submits recommendation: `Approve` / `Reject` / `Need more info`
- Approver finalizes decision:
  - Approve with conditions OR Reject with reason
- Final decision becomes **read-only** after saved (Admin override optional)

### 5.8 Generate Credit Memo (HTML/PDF Export)
Button: **Generate Credit Memo**

Memo must include:
- Applicant summary
- Loan request summary
- Financial analysis (DSCR, cashflow, collateral coverage)
- Key risks and mitigations
- Decision + conditions
- Audit summary (who did what)

Export:
- **HTML is required** (MVP).
- PDF is optional.

### 5.9 Audit Log Viewer
- Every major action must be logged:
  - create application, edit fields, upload doc, run review, submit, approve/reject, generate memo
- Log includes: timestamp, actor, action, entity id, and before/after for edits.

---

## 6) Business Rules (Simple Policy Engine)
Configurable thresholds (store in a config file):
- Minimum DSCR (e.g., `1.2`)
- Minimum collateral coverage (e.g., `120%`)
- Maximum loan amount (e.g., `300,000` PHP)
- Minimum years in business (e.g., `3`)
- Minimum credit score (mock) (e.g., `650`)

**Decision logic (MVP)**
- If DSCR < min OR credit score below min OR years in business below min → Recommend `Reject` or `Review`
- If collateral coverage below min → Recommend `Review` with condition (additional collateral)
- Otherwise → Recommend `Approve` with standard conditions

---

## 7) Data Model (Minimum Entities)
- **User**(id, name, role)
- **Application**(id, applicant fields, loan fields, status, owner_user_id, created_at, updated_at)
- **Document**(id, application_id, doc_type, filename, storage_path, uploaded_by, uploaded_at, extracted_fields_json)
- **Analysis**(id, application_id, dscr, cashflow, collateral_coverage, risk_score, flags_json, assumptions_json, created_at)
- **Decision**(id, application_id, recommended_by, recommended_decision, approver_id, final_decision, conditions_json, reason, decided_at)
- **AuditLog**(timestamp, actor_id, action, entity_type, entity_id, before_json, after_json)

---

## 8) Non-Functional Requirements (MVP)
- Clean UI, responsive enough for demo
- Validation for required fields
- No real banking integrations needed (simulate disbursement)
- All actions must be auditable
- Seed demo data (10–30 applications + docs metadata)

---

## 9) Demo Dataset Requirement
Provide a script to generate dummy applications with realistic variation:
- Different industries, revenue ranges, collateral types
- Some “good” cases, some borderline, some reject cases
- Mock bank statement summary fields (credits/debits totals) stored as extracted fields

---

## 10) Deliverables
- Working web app (frontend + backend)
- Local file storage structure (e.g., `/data` folder) + policy config file
- Demo seed data generator
- Credit memo template (HTML required)
- README: how to run locally + demo steps