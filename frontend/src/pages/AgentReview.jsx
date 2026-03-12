import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const AgentReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [application, setApplication] = useState(null);
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [appRes, reviewRes] = await Promise.all([
        api.get(`/applications/${id}`),
        api.get(`/applications/${id}/agent-review`)
      ]);
      setApplication(appRes.data);
      setReview(reviewRes.data);
    } catch (err) {
      showError('Failed to load agent review');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getDecisionBadgeClass = (decision) => {
    const map = {
      'Approve': 'badge-approved',
      'Review': 'badge-in-review',
      'Reject': 'badge-rejected'
    };
    return `badge ${map[decision] || 'badge-draft'}`;
  };

  const getSeverityColor = (severity) => {
    const map = {
      'high': '#ef4444',
      'medium': '#f59e0b',
      'low': '#10b981'
    };
    return map[severity] || '#64748b';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!application || !review) {
    return (
      <div className="card text-center">
        <h2>Agent review not found</h2>
        <p style={{ color: '#64748b', marginTop: '10px' }}>
          The agent review may not have been run yet for this application.
        </p>
        <button onClick={() => navigate(`/applications/${id}`)} className="btn btn-primary mt-3">
          Back to Application
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => navigate(`/applications/${id}`)}
          className="btn btn-outline btn-sm mb-2"
        >
          ← Back to Application
        </button>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
          Agent Review Results
        </h1>
        <p style={{ color: '#64748b' }}>
          {application.application_number} - {application.applicant.legal_name}
        </p>
      </div>

      {/* Recommendation Summary */}
      <div className="card mb-4" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px', opacity: 0.9 }}>
              Recommended Decision
            </h2>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
              {review.recommended_decision}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '5px' }}>
              Review Date
            </div>
            <div style={{ fontSize: '16px', fontWeight: '500' }}>
              {new Date(review.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Extracted Fields */}
      {review.extracted_fields && Object.keys(review.extracted_fields).length > 0 && (
        <div className="card mb-4">
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px' }}>
            Extracted Key Fields
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
            {Object.entries(review.extracted_fields).map(([key, value]) => (
              <div key={key} style={{
                padding: '12px',
                backgroundColor: '#f8fafc',
                borderRadius: '4px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>
                  {key.replace(/_/g, ' ')}
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600' }}>
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missing Documents */}
      {review.missing_documents && review.missing_documents.length > 0 && (
        <div className="card mb-4" style={{ borderLeft: '4px solid #f59e0b' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px', color: '#f59e0b' }}>
            ⚠️ Missing Documents ({review.missing_documents.length})
          </h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {review.missing_documents.map((doc, index) => (
              <li key={index} style={{
                padding: '10px',
                backgroundColor: '#fff3cd',
                borderRadius: '4px',
                marginBottom: '8px',
                border: '1px solid #ffeaa7'
              }}>
                <span style={{ fontSize: '16px' }}>📄 {doc}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Data Quality Warnings */}
      {review.data_quality_warnings && review.data_quality_warnings.length > 0 && (
        <div className="card mb-4" style={{ borderLeft: '4px solid #ef4444' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px', color: '#ef4444' }}>
            🚨 Data Quality Warnings ({review.data_quality_warnings.length})
          </h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {review.data_quality_warnings.map((warning, index) => (
              <li key={index} style={{
                padding: '12px',
                backgroundColor: '#fee',
                borderRadius: '4px',
                marginBottom: '8px',
                border: '1px solid #fcc'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                  {warning.field}
                </div>
                <div style={{ fontSize: '14px', color: '#721c24' }}>
                  {warning.issue}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Risk Flags */}
      {review.risk_flags && review.risk_flags.length > 0 && (
        <div className="card mb-4">
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px' }}>
            🚩 Risk Flags ({review.risk_flags.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {review.risk_flags.map((flag, index) => (
              <div key={index} style={{
                padding: '15px',
                backgroundColor: '#f8fafc',
                borderRadius: '4px',
                border: '1px solid #e2e8f0',
                borderLeft: `4px solid ${getSeverityColor(flag.severity)}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <div style={{ fontSize: '16px', fontWeight: '600' }}>
                    {flag.flag}
                  </div>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: getSeverityColor(flag.severity),
                    color: 'white',
                    textTransform: 'uppercase'
                  }}>
                    {flag.severity}
                  </span>
                </div>
                <div style={{ fontSize: '14px', color: '#64748b' }}>
                  {flag.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Conditions */}
      {review.recommended_conditions && review.recommended_conditions.length > 0 && (
        <div className="card mb-4" style={{ borderLeft: '4px solid #10b981' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px', color: '#10b981' }}>
            ✓ Recommended Conditions ({review.recommended_conditions.length})
          </h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {review.recommended_conditions.map((condition, index) => (
              <li key={index} style={{
                padding: '12px',
                backgroundColor: '#d4edda',
                borderRadius: '4px',
                marginBottom: '8px',
                border: '1px solid #c3e6cb',
                fontSize: '14px'
              }}>
                <span style={{ marginRight: '8px' }}>✓</span>
                {condition}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary */}
      {review.summary && (
        <div className="card">
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px' }}>
            Summary
          </h2>
          <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#334155' }}>
            {review.summary}
          </p>
        </div>
      )}
    </div>
  );
};

export default AgentReview;

// Made with Bob
