import { useState, useEffect } from 'react';
import { auditAPI } from '../services/api';

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAuditLogs();
  }, [actionFilter]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (actionFilter) params.action = actionFilter;
      
      const response = await auditAPI.getAll(params);
      setLogs(response.data);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatAction = (action) => {
    return action.replace(/_/g, ' ');
  };

  const getActionBadgeClass = (action) => {
    if (action.includes('CREATE')) return 'badge-submitted';
    if (action.includes('UPDATE') || action.includes('EDIT')) return 'badge-in-review';
    if (action.includes('DELETE')) return 'badge-rejected';
    if (action.includes('APPROVE')) return 'badge-approved';
    if (action.includes('REJECT')) return 'badge-rejected';
    return 'badge-draft';
  };

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.actor_name.toLowerCase().includes(search) ||
      log.action.toLowerCase().includes(search) ||
      log.entity_type.toLowerCase().includes(search)
    );
  });

  const uniqueActions = [...new Set(logs.map(log => log.action))].sort();

  return (
    <div>
      <div className="mb-4">
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
          Audit Log
        </h1>
        <p style={{ color: '#64748b' }}>
          Complete activity trail for compliance and tracking
        </p>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="grid grid-2">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Search</label>
            <input
              type="text"
              className="form-control"
              placeholder="Search by user, action, or entity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Filter by Action</label>
            <select
              className="form-control"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="">All Actions</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>{formatAction(action)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card">
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            <p>No audit logs found</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Entity Type</th>
                  <th>Entity ID</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {formatDate(log.timestamp)}
                    </td>
                    <td>
                      <div style={{ fontWeight: '500' }}>{log.actor_name}</div>
                    </td>
                    <td>
                      <span className={`badge ${getActionBadgeClass(log.action)}`}>
                        {formatAction(log.action)}
                      </span>
                    </td>
                    <td>{log.entity_type}</td>
                    <td style={{ fontSize: '13px', fontFamily: 'monospace', color: '#64748b' }}>
                      {log.entity_id.substring(0, 8)}...
                    </td>
                    <td>
                      {log.before && log.after ? (
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => {
                            alert(`Before: ${JSON.stringify(log.before, null, 2)}\n\nAfter: ${JSON.stringify(log.after, null, 2)}`);
                          }}
                        >
                          View Changes
                        </button>
                      ) : log.after ? (
                        <span style={{ fontSize: '12px', color: '#64748b' }}>Created</span>
                      ) : log.before ? (
                        <span style={{ fontSize: '12px', color: '#64748b' }}>Deleted</span>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#64748b' }}>-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      {!loading && filteredLogs.length > 0 && (
        <div style={{ marginTop: '20px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
          Showing {filteredLogs.length} of {logs.length} audit entries
        </div>
      )}

      {/* Info Box */}
      <div className="card mt-4" style={{ background: '#f1f5f9' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
          ℹ️ About Audit Logs
        </h3>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
          All actions in the system are automatically logged for compliance and tracking purposes.
        </p>
        <ul style={{ fontSize: '13px', color: '#64748b', marginLeft: '20px' }}>
          <li>Logs include timestamp, user, action, and affected entity</li>
          <li>Changes show before and after states for data modifications</li>
          <li>Logs are immutable and cannot be deleted</li>
          <li>Use filters to find specific activities</li>
        </ul>
      </div>
    </div>
  );
};

export default AuditLog;

// Made with Bob
