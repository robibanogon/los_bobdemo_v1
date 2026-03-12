import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const CreditAnalysis = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { error: showError } = useToast();
  const [application, setApplication] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [appRes, analysisRes] = await Promise.all([
        api.get(`/applications/${id}`),
        api.get(`/applications/${id}/analysis`)
      ]);
      setApplication(appRes.data);
      setAnalysis(analysisRes.data);
    } catch (err) {
      showError('Failed to load credit analysis');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const getRiskScoreColor = (score) => {
    if (score >= 80) return '#10b981'; // Green
    if (score >= 60) return '#f59e0b'; // Yellow
    if (score >= 40) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  const getRiskScoreLabel = (score) => {
    if (score >= 80) return 'Low Risk';
    if (score >= 60) return 'Medium Risk';
    if (score >= 40) return 'High Risk';
    return 'Very High Risk';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!application || !analysis) {
    return (
      <div className="card text-center">
        <h2>Credit analysis not found</h2>
        <p style={{ color: '#64748b', marginTop: '10px' }}>
          The credit analysis may not have been performed yet for this application.
        </p>
        <button onClick={() => navigate(`/applications/${id}`)} className="btn btn-primary mt-3">
          Back to Application
        </button>
      </div>
    );
  }

  const riskScore = analysis.risk_score || 0;
  const riskColor = getRiskScoreColor(riskScore);
  const riskLabel = getRiskScoreLabel(riskScore);

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
          Credit Analysis
        </h1>
        <p style={{ color: '#64748b' }}>
          {application.application_number} - {application.applicant.legal_name}
        </p>
      </div>

      {/* Risk Score Card */}
      <div className="card mb-4" style={{
        background: `linear-gradient(135deg, ${riskColor} 0%, ${riskColor}dd 100%)`,
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px', opacity: 0.9 }}>
            Overall Risk Score
          </h2>
          <div style={{ fontSize: '64px', fontWeight: 'bold', marginBottom: '10px' }}>
            {riskScore}
          </div>
          <div style={{ fontSize: '24px', fontWeight: '600', marginBottom: '10px' }}>
            {riskLabel}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>
            Analysis Date: {new Date(analysis.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
        {/* DSCR */}
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', fontWeight: '600' }}>
            DSCR
          </div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: analysis.dscr >= 1.2 ? '#10b981' : '#ef4444', marginBottom: '10px' }}>
            {analysis.dscr?.toFixed(2) || 'N/A'}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Debt Service Coverage Ratio
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '5px' }}>
            {analysis.dscr >= 1.2 ? '✓ Meets minimum (1.2)' : '✗ Below minimum (1.2)'}
          </div>
        </div>

        {/* Net Operating Cashflow */}
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', fontWeight: '600' }}>
            Net Operating Cashflow
          </div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: analysis.net_operating_cashflow >= 0 ? '#10b981' : '#ef4444', marginBottom: '10px' }}>
            {formatCurrency(analysis.net_operating_cashflow || 0)}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Monthly Revenue - Expenses
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '5px' }}>
            {analysis.net_operating_cashflow >= 0 ? '✓ Positive cashflow' : '✗ Negative cashflow'}
          </div>
        </div>

        {/* Collateral Coverage */}
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', fontWeight: '600' }}>
            Collateral Coverage
          </div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: analysis.collateral_coverage >= 1.2 ? '#10b981' : '#ef4444', marginBottom: '10px' }}>
            {formatPercentage(analysis.collateral_coverage || 0)}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Collateral Value / Loan Amount
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '5px' }}>
            {analysis.collateral_coverage >= 1.2 ? '✓ Meets minimum (120%)' : '✗ Below minimum (120%)'}
          </div>
        </div>
      </div>

      {/* Financial Breakdown */}
      <div className="card mb-4">
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px' }}>
          Financial Breakdown
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px', color: '#10b981' }}>
              Income
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
              <span>Monthly Revenue</span>
              <span style={{ fontWeight: '600' }}>{formatCurrency(application.financial_snapshot.monthly_revenue)}</span>
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '10px', color: '#ef4444' }}>
              Expenses
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
              <span>Monthly Expenses</span>
              <span style={{ fontWeight: '600' }}>{formatCurrency(application.financial_snapshot.monthly_expenses)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
              <span>Existing Debt Payment</span>
              <span style={{ fontWeight: '600' }}>{formatCurrency(application.financial_snapshot.existing_debt_payment)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Flags */}
      {analysis.flags && analysis.flags.length > 0 && (
        <div className="card mb-4">
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px' }}>
            Risk Flags ({analysis.flags.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {analysis.flags.map((flag, index) => (
              <div key={index} style={{
                padding: '12px',
                backgroundColor: '#fee',
                borderRadius: '4px',
                border: '1px solid #fcc',
                borderLeft: '4px solid #ef4444'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#721c24' }}>
                  🚩 {flag}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assumptions */}
      {analysis.assumptions && Object.keys(analysis.assumptions).length > 0 && (
        <div className="card mb-4">
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px' }}>
            Analysis Assumptions
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
            {Object.entries(analysis.assumptions).map(([key, value]) => (
              <div key={key} style={{
                padding: '12px',
                backgroundColor: '#f8fafc',
                borderRadius: '4px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>
                  {key.replace(/_/g, ' ')}
                </div>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {analysis.notes && (
        <div className="card">
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px' }}>
            Analyst Notes
          </h2>
          <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#334155', whiteSpace: 'pre-wrap' }}>
            {analysis.notes}
          </p>
        </div>
      )}
    </div>
  );
};

export default CreditAnalysis;

// Made with Bob
