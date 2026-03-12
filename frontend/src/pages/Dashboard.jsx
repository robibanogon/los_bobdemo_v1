import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applicationsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentApplications, setRecentApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, appsRes] = await Promise.all([
        applicationsAPI.getStatistics(),
        applicationsAPI.getAll({ limit: 5 })
      ]);
      
      setStats(statsRes.data);
      setRecentApplications(appsRes.data.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex-between mb-4">
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
            Dashboard
          </h1>
          <p style={{ color: '#64748b' }}>
            Welcome back, {user?.name}
          </p>
        </div>
        {user?.role === 'RM' && (
          <Link to="/applications/new" className="btn btn-primary">
            + Create Application
          </Link>
        )}
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-4 mb-4">
          <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>
              Total Applications
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
              {stats.total}
            </div>
          </div>

          <div className="card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>
              In Review
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
              {stats.by_status['In Review'] || 0}
            </div>
          </div>

          <div className="card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>
              Approved
            </div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
              {stats.by_status['Approved'] || 0}
            </div>
          </div>

          <div className="card" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>
              Total Amount
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
              {formatCurrency(stats.total_amount)}
            </div>
          </div>
        </div>
      )}

      {/* Status Breakdown */}
      {stats && (
        <div className="card mb-4">
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
            Applications by Status
          </h2>
          <div className="grid grid-3">
            {Object.entries(stats.by_status).map(([status, count]) => (
              <div key={status} style={{
                padding: '16px',
                background: '#f8fafc',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span className={getStatusBadgeClass(status)}>
                  {status}
                </span>
                <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Applications */}
      <div className="card">
        <div className="flex-between mb-3">
          <h2 style={{ fontSize: '18px', fontWeight: '600' }}>
            Recent Applications
          </h2>
          <Link to="/applications" style={{ color: '#667eea', fontSize: '14px', textDecoration: 'none' }}>
            View All →
          </Link>
        </div>

        {recentApplications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            <p>No applications yet</p>
            {user?.role === 'RM' && (
              <Link to="/applications/new" className="btn btn-primary mt-2">
                Create First Application
              </Link>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Application ID</th>
                  <th>Applicant</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Last Updated</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recentApplications.map((app) => (
                  <tr key={app.id}>
                    <td style={{ fontWeight: '500', color: '#667eea' }}>
                      {app.application_number}
                    </td>
                    <td>{app.applicant.legal_name}</td>
                    <td>{formatCurrency(app.loan_request.amount)}</td>
                    <td>
                      <span className={getStatusBadgeClass(app.status)}>
                        {app.status}
                      </span>
                    </td>
                    <td style={{ color: '#64748b', fontSize: '14px' }}>
                      {formatDate(app.updated_at)}
                    </td>
                    <td>
                      <Link
                        to={`/applications/${app.id}`}
                        className="btn btn-sm btn-outline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-3 mt-4">
        <Link to="/applications" className="card" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
          <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
            📋 All Applications
          </div>
          <div style={{ fontSize: '14px', color: '#64748b' }}>
            View and manage all loan applications
          </div>
        </Link>

        <Link to="/audit" className="card" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
          <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
            📊 Audit Log
          </div>
          <div style={{ fontSize: '14px', color: '#64748b' }}>
            Track all system activities
          </div>
        </Link>

        {user?.role === 'RM' && (
          <Link to="/applications/new" className="card" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
              ➕ New Application
            </div>
            <div style={{ fontSize: '14px', color: '#64748b' }}>
              Create a new loan application
            </div>
          </Link>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

// Made with Bob
