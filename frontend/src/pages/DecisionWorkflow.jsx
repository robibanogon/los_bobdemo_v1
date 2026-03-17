import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const DecisionWorkflow = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [application, setApplication] = useState(null);
  const [decision, setDecision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [recommendedDecision, setRecommendedDecision] = useState('');
  const [finalDecision, setFinalDecision] = useState('');
  const [conditions, setConditions] = useState(['']);
  const [reason, setReason] = useState('');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const appRes = await api.get(`/applications/${id}`);
      setApplication(appRes.data);
      
      // Try to load existing decision
      try {
        const decisionRes = await api.get(`/applications/${id}/decision`);
        setDecision(decisionRes.data);
        setRecommendedDecision(decisionRes.data.recommended_decision || '');
        setFinalDecision(decisionRes.data.final_decision || '');
        setConditions(decisionRes.data.conditions || ['']);
        setReason(decisionRes.data.reason || '');
      } catch (err) {
        // No decision yet, that's okay
        console.log('No existing decision');
      }
    } catch (err) {
      showError('Failed to load application');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCondition = () => {
    setConditions([...conditions, '']);
  };

  const handleRemoveCondition = (index) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const handleConditionChange = (index, value) => {
    const newConditions = [...conditions];
    newConditions[index] = value;
    setConditions(newConditions);
  };

  const handleSubmitRecommendation = async (e) => {
    e.preventDefault();
    
    if (!recommendedDecision) {
      showError('Please select a recommended decision');
      return;
    }

    try {
      setSubmitting(true);
      const filteredConditions = conditions.filter(c => c.trim() !== '');
      
      await api.post(`/applications/${id}/decision/recommend`, {
        recommended_decision: recommendedDecision,
        conditions: filteredConditions,
        reason: reason
      });

      success('Recommendation submitted successfully');
      loadData();
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to submit recommendation');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitFinalDecision = async (e) => {
    e.preventDefault();
    
    if (!finalDecision) {
      showError('Please select a final decision');
      return;
    }

    if (!window.confirm('Are you sure you want to finalize this decision? This action cannot be undone.')) {
      return;
    }

    try {
      setSubmitting(true);
      const filteredConditions = conditions.filter(c => c.trim() !== '');
      
      await api.post(`/applications/${id}/decision/approve`, {
        final_decision: finalDecision,
        conditions: filteredConditions,
        reason: reason
      });

      success('Final decision submitted successfully');
      navigate(`/applications/${id}`);
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to submit final decision');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
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

  const isAnalyst = user?.role === 'Credit Analyst';
  const isApprover = user?.role === 'Approver';
  const hasRecommendation = decision && decision.recommended_decision;
  const hasFinalDecision = decision && decision.final_decision;

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => navigate(`/applications/${id}`)}
          className="btn btn-outline btn-sm mb-2"
        >
          ← Back to Application
        </button>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
          Decision Workflow
        </h1>
        <p style={{ color: '#64748b' }}>
          {application.application_number} - {application.applicant.legal_name}
        </p>
      </div>

      {/* Existing Decision Display */}
      {decision && (
        <div className="card mb-4" style={{ borderLeft: '4px solid #2563eb' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px' }}>
            Current Decision Status
          </h2>
          
          {hasRecommendation && (
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '5px' }}>
                Analyst Recommendation
              </div>
              <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>
                {decision.recommended_decision}
              </div>
              {decision.recommended_by && (
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  By: {decision.recommended_by} on {new Date(decision.created_at).toLocaleDateString()}
                </div>
              )}
            </div>
          )}

          {hasFinalDecision && (
            <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '5px' }}>
                Final Decision
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: decision.final_decision === 'Approved' ? '#10b981' : '#ef4444', marginBottom: '10px' }}>
                {decision.final_decision}
              </div>
              {decision.approver_name && (
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  By: {decision.approver_name} on {new Date(decision.decided_at).toLocaleDateString()}
                </div>
              )}
            </div>
          )}

          {decision.conditions && decision.conditions.length > 0 && (
            <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '10px' }}>
                Conditions:
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {decision.conditions.map((condition, index) => (
                  <li key={index} style={{ marginBottom: '5px' }}>{condition}</li>
                ))}
              </ul>
            </div>
          )}

          {decision.reason && (
            <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '5px' }}>
                Reason:
              </div>
              <p style={{ margin: 0, fontSize: '14px', color: '#334155' }}>{decision.reason}</p>
            </div>
          )}
        </div>
      )}

      {/* Analyst Recommendation Form */}
      {isAnalyst && !hasFinalDecision && (
        <div className="card mb-4">
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px' }}>
            Credit Analyst Recommendation
          </h2>
          <form onSubmit={handleSubmitRecommendation}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Recommended Decision <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                value={recommendedDecision}
                onChange={(e) => setRecommendedDecision(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px'
                }}
              >
                <option value="">Select decision...</option>
                <option value="Approve">Approve</option>
                <option value="Reject">Reject</option>
                <option value="Need more info">Need more info</option>
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Conditions (if applicable)
              </label>
              {conditions.map((condition, index) => (
                <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <input
                    type="text"
                    value={condition}
                    onChange={(e) => handleConditionChange(index, e.target.value)}
                    placeholder="Enter condition..."
                    style={{
                      flex: 1,
                      padding: '8px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '4px'
                    }}
                  />
                  {conditions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCondition(index)}
                      className="btn btn-danger btn-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddCondition}
                className="btn btn-outline btn-sm"
              >
                + Add Condition
              </button>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Reason / Notes
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows="4"
                placeholder="Provide reasoning for your recommendation..."
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
            >
              {submitting ? 'Submitting...' : 'Submit Recommendation'}
            </button>
          </form>
        </div>
      )}

      {/* Approver Final Decision Form */}
      {isApprover && hasRecommendation && !hasFinalDecision && (
        <div className="card">
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px' }}>
            Approver Final Decision
          </h2>
          <form onSubmit={handleSubmitFinalDecision}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Final Decision <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                value={finalDecision}
                onChange={(e) => setFinalDecision(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px'
                }}
              >
                <option value="">Select decision...</option>
                <option value="Approved">Approve</option>
                <option value="Rejected">Reject</option>
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Approval Conditions (if applicable)
              </label>
              {conditions.map((condition, index) => (
                <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <input
                    type="text"
                    value={condition}
                    onChange={(e) => handleConditionChange(index, e.target.value)}
                    placeholder="Enter condition..."
                    style={{
                      flex: 1,
                      padding: '8px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '4px'
                    }}
                  />
                  {conditions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCondition(index)}
                      className="btn btn-danger btn-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddCondition}
                className="btn btn-outline btn-sm"
              >
                + Add Condition
              </button>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Reason / Notes
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows="4"
                placeholder="Provide reasoning for your decision..."
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div style={{
              padding: '15px',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '4px',
              marginBottom: '15px'
            }}>
              <strong>⚠️ Warning:</strong> This decision is final and cannot be changed once submitted.
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-success"
              style={{ marginRight: '10px' }}
            >
              {submitting ? 'Submitting...' : 'Finalize Decision'}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/applications/${id}`)}
              className="btn btn-outline"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Approver Waiting for Recommendation */}
      {isApprover && !hasRecommendation && !hasFinalDecision && (
        <div className="card text-center" style={{ backgroundColor: '#fff3cd', border: '1px solid #ffeaa7' }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>⏳</div>
          <h2 style={{ color: '#856404' }}>Waiting for Analyst Recommendation</h2>
          <p style={{ color: '#856404', marginTop: '10px', marginBottom: '20px' }}>
            The Credit Analyst has not yet submitted their recommendation for this application.
            <br />
            You will be able to make the final decision once the analyst completes their review.
          </p>
          <button
            onClick={() => navigate(`/applications/${id}`)}
            className="btn btn-outline"
          >
            Back to Application
          </button>
        </div>
      )}

      {/* Access Denied Messages */}
      {!isAnalyst && !isApprover && (
        <div className="card text-center">
          <h2>Access Denied</h2>
          <p style={{ color: '#64748b', marginTop: '10px' }}>
            Only Credit Analysts and Approvers can access the decision workflow.
          </p>
        </div>
      )}

      {hasFinalDecision && (
        <div className="card text-center" style={{ backgroundColor: '#d4edda', border: '1px solid #c3e6cb' }}>
          <h2 style={{ color: '#155724' }}>Decision Finalized</h2>
          <p style={{ color: '#155724', marginTop: '10px' }}>
            The final decision has been made and can no longer be modified.
          </p>
        </div>
      )}
    </div>
  );
};

export default DecisionWorkflow;

// Made with Bob
