import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { applicationsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const ApplicationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: showError, warning } = useToast();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadApplication();
  }, [id]);

  const loadApplication = async () => {
    try {
      setLoading(true);
      const response = await applicationsAPI.getById(id);
      setApplication(response.data);
    } catch (error) {
      console.error('Error loading application:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!window.confirm('Are you sure you want to submit this application for review?')) {
      return;
    }

    try {
      setActionLoading(true);
      await applicationsAPI.updateStatus(id, 'Submitted');
      success('Application submitted successfully');
      loadApplication();
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to submit application');
      console.error('Error submitting application:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
      return;
    }

    try {
      setActionLoading(true);
      await applicationsAPI.delete(id);
      success('Application deleted successfully');
      navigate('/applications');
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to delete application');
      console.error('Error deleting application:', error);
      setActionLoading(false);
    }
  };

  const handleMoveToReview = async () => {
    try {
      setActionLoading(true);
      // Move application to In Review status
      await applicationsAPI.updateStatus(id, 'In Review');
      success('Application moved to In Review');
      // Reload application data
      loadApplication();
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to move application to review');
      console.error('Error moving to review:', error);
      setActionLoading(false);
    }
  };

  const handleRunReview = async () => {
    try {
      setActionLoading(true);
      await agentReviewAPI.run(id);
      success('Agent review completed successfully');
      // Navigate to review page after successful review
      navigate(`/applications/${id}/review`);
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to run agent review');
      console.error('Error running review:', error);
      setActionLoading(false);
    }
  };

  const handleGenerateMemo = async () => {
    try {
      setActionLoading(true);
      const response = await applicationsAPI.generateMemo(id);
      
      // Open memo in new window
      const memoWindow = window.open('', '_blank');
      memoWindow.document.write(response.data.html);
      memoWindow.document.close();
      
      success('Credit memo generated successfully');
    } catch (error) {
      showError(error.response?.data?.error || 'Failed to generate memo');
      console.error('Error generating memo:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      'Draft': 'badge-draft',
      'Submitted': 'badge-submitted',
      'In Review': 'badge-in-review',
      'Approved': 'badge-approved',
      'Rejected': 'badge-rejected',
      'Completed': 'badge-completed'
    };
    return `badge ${statusMap[status] || 'badge-draft'}`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="card text-center">
        <h2>Application not found</h2>
        <button onClick={() => navigate('/applications')} className="btn btn-primary mt-3">
          Back to Applications
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex-between mb-4">
        <div>
          <button onClick={() => navigate('/applications')} className="btn btn-outline btn-sm mb-2">
            ← Back to Applications
          </button>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
            {application.application_number}
          </h1>
          <p style={{ color: '#64748b' }}>
            {application.applicant.legal_name}
          </p>
        </div>
        <span className={getStatusBadgeClass(application.status)} style={{ fontSize: '16px', padding: '8px 16px' }}>
          {application.status}
        </span>
      </div>

      {/* Applicant Information */}
      <div className="card mb-4">
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
          Applicant Information
        </h2>
        <div className="grid grid-2">
          <div>
            <div className="form-label">Legal Name</div>
            <div style={{ fontSize: '16px', marginBottom: '16px' }}>{application.applicant.legal_name}</div>
          </div>
          <div>
            <div className="form-label">Business Type</div>
            <div style={{ fontSize: '16px', marginBottom: '16px' }}>{application.applicant.business_type}</div>
          </div>
          <div>
            <div className="form-label">Industry</div>
            <div style={{ fontSize: '16px', marginBottom: '16px' }}>{application.applicant.industry}</div>
          </div>
          <div>
            <div className="form-label">Years in Business</div>
            <div style={{ fontSize: '16px', marginBottom: '16px' }}>{application.applicant.years_in_business} years</div>
          </div>
        </div>
      </div>

      {/* Loan Request */}
      <div className="card mb-4">
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
          Loan Request
        </h2>
        <div className="grid grid-2">
          <div>
            <div className="form-label">Loan Amount</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#667eea', marginBottom: '16px' }}>
              {formatCurrency(application.loan_request.amount)}
            </div>
          </div>
          <div>
            <div className="form-label">Tenor</div>
            <div style={{ fontSize: '16px', marginBottom: '16px' }}>{application.loan_request.tenor_months} months</div>
          </div>
          <div>
            <div className="form-label">Purpose</div>
            <div style={{ fontSize: '16px', marginBottom: '16px' }}>{application.loan_request.purpose}</div>
          </div>
          <div>
            <div className="form-label">Repayment Type</div>
            <div style={{ fontSize: '16px', marginBottom: '16px' }}>{application.loan_request.repayment_type}</div>
          </div>
        </div>
      </div>

      {/* Financial Snapshot */}
      <div className="card mb-4">
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
          Financial Snapshot
        </h2>
        <div className="grid grid-3">
          <div>
            <div className="form-label">Monthly Revenue</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#10b981', marginBottom: '16px' }}>
              {formatCurrency(application.financial_snapshot.monthly_revenue)}
            </div>
          </div>
          <div>
            <div className="form-label">Monthly Expenses</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#ef4444', marginBottom: '16px' }}>
              {formatCurrency(application.financial_snapshot.monthly_expenses)}
            </div>
          </div>
          <div>
            <div className="form-label">Existing Debt Payment</div>
            <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              {formatCurrency(application.financial_snapshot.existing_debt_payment)}
            </div>
          </div>
        </div>
      </div>

      {/* Collateral */}
      <div className="card mb-4">
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
          Collateral
        </h2>
        <div className="grid grid-2">
          <div>
            <div className="form-label">Collateral Type</div>
            <div style={{ fontSize: '16px', marginBottom: '16px' }}>{application.collateral.type}</div>
          </div>
          <div>
            <div className="form-label">Estimated Value</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#667eea', marginBottom: '16px' }}>
              {formatCurrency(application.collateral.estimated_value)}
            </div>
          </div>
        </div>
      </div>

      {/* Owner Information */}
      <div className="card">
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
          Owner Information
        </h2>
        <div className="grid grid-3">
          <div>
            <div className="form-label">Owner Name</div>
            <div style={{ fontSize: '16px', marginBottom: '16px' }}>{application.owner_info.name}</div>
          </div>
          <div>
            <div className="form-label">ID Number</div>
            <div style={{ fontSize: '16px', marginBottom: '16px' }}>{application.owner_info.id_number}</div>
          </div>
          <div>
            <div className="form-label">Credit Score</div>
            <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              {application.owner_info.credit_score}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-4">
        {/* Document Management - Available for all statuses */}
        <button
          className="btn btn-outline"
          onClick={() => navigate(`/applications/${id}/documents`)}
        >
          📄 Manage Documents
        </button>
        
        {application.status === 'Draft' && user?.role === 'RM' && (
          <>
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/applications/${id}/edit`)}
            >
              Edit Application
            </button>
            <button
              className="btn btn-success"
              onClick={handleSubmit}
              disabled={actionLoading}
            >
              {actionLoading ? 'Submitting...' : 'Submit for Review'}
            </button>
            <button
              className="btn btn-danger"
              onClick={handleDelete}
              disabled={actionLoading}
            >
              Delete
            </button>
          </>
        )}
        {application.status === 'Submitted' && (user?.role === 'RM' || user?.role === 'Credit Analyst') && (
          <button
            className="btn btn-primary"
            onClick={handleMoveToReview}
            disabled={actionLoading}
          >
            {actionLoading ? 'Moving...' : 'Move to In Review'}
          </button>
        )}
        {application.status === 'In Review' && (
          <>
            <button
              className="btn btn-primary"
              onClick={handleRunReview}
              disabled={actionLoading}
            >
              {actionLoading ? 'Running...' : 'Run Agent Review'}
            </button>
            <button
              className="btn btn-outline"
              onClick={() => navigate(`/applications/${id}/review`)}
            >
              View Agent Review
            </button>
            <button
              className="btn btn-outline"
              onClick={() => navigate(`/applications/${id}/analysis`)}
            >
              View Credit Analysis
            </button>
            {(user?.role === 'Credit Analyst' || user?.role === 'Approver') && (
              <button
                className="btn btn-success"
                onClick={() => navigate(`/applications/${id}/decision`)}
              >
                Make Decision
              </button>
            )}
          </>
        )}
        {(application.status === 'Approved' || application.status === 'Rejected') && (
          <>
            <button
              className="btn btn-primary"
              onClick={handleGenerateMemo}
              disabled={actionLoading}
            >
              {actionLoading ? 'Generating...' : 'Generate Credit Memo'}
            </button>
            <button
              className="btn btn-outline"
              onClick={() => navigate(`/applications/${id}/memo`)}
            >
              📄 View Credit Memo
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ApplicationDetail;

// Made with Bob
