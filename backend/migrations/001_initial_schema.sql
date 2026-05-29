-- ============================================================================
-- Loan Origination System - Initial Database Schema
-- Migration: 001_initial_schema.sql
-- Description: Creates all tables, indexes, constraints, and triggers
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ============================================================================
-- 1. USERS TABLE
-- ============================================================================
-- Stores user accounts with role-based access control
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('RM', 'Credit Analyst', 'Approver', 'Admin')),
    email VARCHAR(100) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Indexes for users table
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);

COMMENT ON TABLE users IS 'User accounts with role-based access control';
COMMENT ON COLUMN users.role IS 'User role: RM, Credit Analyst, Approver, or Admin';
COMMENT ON COLUMN users.is_active IS 'Flag to enable/disable user accounts';

-- ============================================================================
-- 2. APPLICATIONS TABLE
-- ============================================================================
-- Stores loan applications with JSONB fields for flexible data structure
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('Draft', 'Submitted', 'In Review', 'Approved', 'Rejected', 'Completed')),
    owner_user_id UUID NOT NULL REFERENCES users(id),
    
    -- Applicant Information (JSONB for flexibility)
    applicant JSONB NOT NULL,
    loan_request JSONB NOT NULL,
    financial_snapshot JSONB NOT NULL,
    collateral JSONB NOT NULL,
    owner_info JSONB NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT chk_loan_amount CHECK ((loan_request->>'amount')::numeric > 0),
    CONSTRAINT chk_tenor CHECK ((loan_request->>'tenor_months')::integer > 0)
);

-- Indexes for applications table
CREATE INDEX idx_applications_number ON applications(application_number);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_owner ON applications(owner_user_id);
CREATE INDEX idx_applications_created ON applications(created_at DESC);
CREATE INDEX idx_applications_updated ON applications(updated_at DESC);
CREATE INDEX idx_applications_applicant_gin ON applications USING GIN (applicant);
CREATE INDEX idx_applications_loan_request_gin ON applications USING GIN (loan_request);

COMMENT ON TABLE applications IS 'Loan applications with flexible JSONB structure';
COMMENT ON COLUMN applications.status IS 'Application workflow status';
COMMENT ON COLUMN applications.applicant IS 'Applicant details: legal_name, business_type, industry, years_in_business';
COMMENT ON COLUMN applications.loan_request IS 'Loan details: amount, tenor_months, purpose, repayment_type';

-- ============================================================================
-- 3. DOCUMENTS TABLE
-- ============================================================================
-- Stores document metadata with S3 references
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    doc_type VARCHAR(100) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    s3_key VARCHAR(500) NOT NULL,
    s3_bucket VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    extracted_fields JSONB DEFAULT '{}',
    
    -- Constraint: max file size 10MB
    CONSTRAINT chk_file_size CHECK (file_size > 0 AND file_size <= 10485760)
);

-- Indexes for documents table
CREATE INDEX idx_documents_application ON documents(application_id);
CREATE INDEX idx_documents_type ON documents(doc_type);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_documents_uploaded_at ON documents(uploaded_at DESC);

COMMENT ON TABLE documents IS 'Document metadata with S3 storage references';
COMMENT ON COLUMN documents.s3_key IS 'S3 object key for document retrieval';
COMMENT ON COLUMN documents.extracted_fields IS 'OCR or extracted data from document';

-- ============================================================================
-- 4. AGENT REVIEWS TABLE
-- ============================================================================
-- Stores AI agent review results
CREATE TABLE agent_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    review_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id),
    
    -- One review per application
    CONSTRAINT uq_agent_review_app UNIQUE (application_id)
);

-- Indexes for agent_reviews table
CREATE INDEX idx_agent_reviews_application ON agent_reviews(application_id);
CREATE INDEX idx_agent_reviews_created_by ON agent_reviews(created_by);

COMMENT ON TABLE agent_reviews IS 'AI agent review results for applications';
COMMENT ON COLUMN agent_reviews.review_data IS 'Complete review data including findings and recommendations';

-- ============================================================================
-- 5. ANALYSES TABLE
-- ============================================================================
-- Stores credit analysis results
CREATE TABLE analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    dscr NUMERIC(10, 4),
    net_operating_cashflow NUMERIC(15, 2),
    collateral_coverage NUMERIC(10, 4),
    risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
    metrics JSONB NOT NULL,
    assumptions JSONB DEFAULT '{}',
    flags JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id),
    
    -- One analysis per application
    CONSTRAINT uq_analysis_app UNIQUE (application_id)
);

-- Indexes for analyses table
CREATE INDEX idx_analyses_application ON analyses(application_id);
CREATE INDEX idx_analyses_risk_score ON analyses(risk_score);
CREATE INDEX idx_analyses_created_by ON analyses(created_by);

COMMENT ON TABLE analyses IS 'Credit analysis results and risk assessments';
COMMENT ON COLUMN analyses.dscr IS 'Debt Service Coverage Ratio';
COMMENT ON COLUMN analyses.risk_score IS 'Risk score from 0 (low risk) to 100 (high risk)';

-- ============================================================================
-- 6. DECISIONS TABLE
-- ============================================================================
-- Stores credit decisions and approvals
CREATE TABLE decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    recommended_by UUID REFERENCES users(id),
    recommended_decision VARCHAR(50),
    recommended_at TIMESTAMP WITH TIME ZONE,
    approver_id UUID REFERENCES users(id),
    final_decision VARCHAR(50),
    decided_at TIMESTAMP WITH TIME ZONE,
    conditions JSONB DEFAULT '[]',
    rejection_reason TEXT,
    notes TEXT,
    
    -- One decision per application
    CONSTRAINT uq_decision_app UNIQUE (application_id)
);

-- Indexes for decisions table
CREATE INDEX idx_decisions_application ON decisions(application_id);
CREATE INDEX idx_decisions_recommended_by ON decisions(recommended_by);
CREATE INDEX idx_decisions_approver ON decisions(approver_id);
CREATE INDEX idx_decisions_final_decision ON decisions(final_decision);

COMMENT ON TABLE decisions IS 'Credit decisions and approval workflow';
COMMENT ON COLUMN decisions.conditions IS 'Array of conditions attached to approval';

-- ============================================================================
-- 7. AUDIT LOGS TABLE (Partitioned by timestamp)
-- ============================================================================
-- Stores audit trail of all system actions
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actor_id UUID REFERENCES users(id),
    actor_name VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    before_state JSONB,
    after_state JSONB,
    ip_address INET,
    user_agent TEXT
) PARTITION BY RANGE (timestamp);

-- Indexes for audit_logs table
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);

COMMENT ON TABLE audit_logs IS 'Audit trail of all system actions (partitioned by timestamp)';
COMMENT ON COLUMN audit_logs.before_state IS 'State before the action';
COMMENT ON COLUMN audit_logs.after_state IS 'State after the action';

-- Create initial partition for current year
CREATE TABLE audit_logs_2026 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

-- ============================================================================
-- 8. POLICY CONFIGURATION TABLE
-- ============================================================================
-- Stores system policy configuration
CREATE TABLE policy_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(id)
);

-- Indexes for policy_config table
CREATE INDEX idx_policy_config_key ON policy_config(config_key);

COMMENT ON TABLE policy_config IS 'System policy configuration stored as JSONB';

-- ============================================================================
-- 9. MIGRATIONS TRACKING TABLE
-- ============================================================================
-- Tracks which migrations have been applied
CREATE TABLE schema_migrations (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) UNIQUE NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(64)
);

COMMENT ON TABLE schema_migrations IS 'Tracks applied database migrations';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to users table
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to applications table
CREATE TRIGGER update_applications_updated_at 
    BEFORE UPDATE ON applications
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to analyses table
CREATE TRIGGER update_analyses_updated_at 
    BEFORE UPDATE ON analyses
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to policy_config table
CREATE TRIGGER update_policy_config_updated_at 
    BEFORE UPDATE ON policy_config
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View for application summary with related data
CREATE OR REPLACE VIEW application_summary AS
SELECT 
    a.id,
    a.application_number,
    a.status,
    a.applicant->>'legal_name' as applicant_name,
    (a.loan_request->>'amount')::numeric as loan_amount,
    (a.loan_request->>'tenor_months')::integer as tenor_months,
    u.name as owner_name,
    u.role as owner_role,
    a.created_at,
    a.updated_at,
    a.submitted_at,
    COUNT(DISTINCT d.id) as document_count,
    EXISTS(SELECT 1 FROM agent_reviews ar WHERE ar.application_id = a.id) as has_agent_review,
    EXISTS(SELECT 1 FROM analyses an WHERE an.application_id = a.id) as has_analysis,
    EXISTS(SELECT 1 FROM decisions dc WHERE dc.application_id = a.id) as has_decision
FROM applications a
JOIN users u ON a.owner_user_id = u.id
LEFT JOIN documents d ON d.application_id = a.id
GROUP BY a.id, u.name, u.role;

COMMENT ON VIEW application_summary IS 'Summary view of applications with related data counts';

-- ============================================================================
-- GRANT PERMISSIONS (adjust based on your user setup)
-- ============================================================================

-- Grant permissions to application user (adjust username as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO los_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO los_app_user;

-- ============================================================================
-- INITIAL DATA RECORD
-- ============================================================================

-- Record this migration
INSERT INTO schema_migrations (migration_name, checksum) 
VALUES ('001_initial_schema.sql', md5('001_initial_schema.sql'));

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

-- Made with Bob
