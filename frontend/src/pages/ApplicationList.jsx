import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applicationsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ApplicationList = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('updated_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { user } = useAuth();

  useEffect(() => {
    loadApplications();
  }, [statusFilter]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      
      const response = await applicationsAPI.getAll(params);
      setApplications(response.data);
    } catch (error) {
      console.error('Error loading applications:', error);
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return '⇅'; // Both arrows for unsorted
    }
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const filteredApplications = applications.filter(app => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      app.application_number.toLowerCase().includes(search) ||
      app.applicant.legal_name.toLowerCase().includes(search)
    );
  });

  // Sort applications
  const sortedApplications = [...filteredApplications].sort((a, b) => {
    let aVal, bVal;

    switch (sortField) {
      case 'application_number':
        aVal = a.application_number;
        bVal = b.application_number;
        break;
      case 'applicant':
        aVal = a.applicant.legal_name;
        bVal = b.applicant.legal_name;
        break;
      case 'industry':
        aVal = a.applicant.industry;
        bVal = b.applicant.industry;
        break;
      case 'amount':
        aVal = a.loan_request.amount;
        bVal = b.loan_request.amount;
        break;
      case 'tenor':
        aVal = a.loan_request.tenor_months;
        bVal = b.loan_request.tenor_months;
        break;
      case 'status':
        aVal = a.status;
        bVal = b.status;
        break;
      case 'updated_at':
        aVal = new Date(a.updated_at);
        bVal = new Date(b.updated_at);
        break;
      default:
        return 0;
    }

    // Handle numeric comparison
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }

    // Handle date comparison
    if (aVal instanceof Date && bVal instanceof Date) {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }

    // Handle string comparison
    const comparison = String(aVal).localeCompare(String(bVal));
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Pagination calculations
  const totalPages = Math.ceil(sortedApplications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedApplications = sortedApplications.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortField, sortDirection]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div>
      <div className="flex-between mb-4">
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
            Applications
          </h1>
          <p style={{ color: '#64748b' }}>
            Manage all loan applications
          </p>
        </div>
        {user?.role === 'RM' && (
          <Link to="/applications/new" className="btn btn-primary">
            + Create Application
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="grid grid-2">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Search</label>
            <input
              type="text"
              className="form-control"
              placeholder="Search by ID or applicant name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Filter by Status</label>
            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Submitted">Submitted</option>
              <option value="In Review">In Review</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="card">
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        ) : sortedApplications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            <p>No applications found</p>
            {user?.role === 'RM' && !statusFilter && !searchTerm && (
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
                  <th
                    onClick={() => handleSort('application_number')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Application ID {getSortIcon('application_number')}
                  </th>
                  <th
                    onClick={() => handleSort('applicant')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Applicant {getSortIcon('applicant')}
                  </th>
                  <th
                    onClick={() => handleSort('industry')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Industry {getSortIcon('industry')}
                  </th>
                  <th
                    onClick={() => handleSort('amount')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Amount {getSortIcon('amount')}
                  </th>
                  <th
                    onClick={() => handleSort('tenor')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Tenor {getSortIcon('tenor')}
                  </th>
                  <th
                    onClick={() => handleSort('status')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Status {getSortIcon('status')}
                  </th>
                  <th
                    onClick={() => handleSort('updated_at')}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    Last Updated {getSortIcon('updated_at')}
                  </th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paginatedApplications.map((app) => (
                  <tr key={app.id} onClick={() => window.location.href = `/applications/${app.id}`}>
                    <td style={{ fontWeight: '500', color: '#667eea' }}>
                      {app.application_number}
                    </td>
                    <td>
                      <div style={{ fontWeight: '500' }}>{app.applicant.legal_name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {app.applicant.business_type}
                      </div>
                    </td>
                    <td style={{ fontSize: '14px' }}>{app.applicant.industry}</td>
                    <td style={{ fontWeight: '500' }}>
                      {formatCurrency(app.loan_request.amount)}
                    </td>
                    <td>{app.loan_request.tenor_months} months</td>
                    <td>
                      <span className={getStatusBadgeClass(app.status)}>
                        {app.status}
                      </span>
                    </td>
                    <td style={{ color: '#64748b', fontSize: '13px' }}>
                      {formatDate(app.updated_at)}
                    </td>
                    <td>
                      <Link
                        to={`/applications/${app.id}`}
                        className="btn btn-sm btn-outline"
                        onClick={(e) => e.stopPropagation()}
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

      {/* Pagination Controls */}
      {!loading && sortedApplications.length > 0 && (
        <>
          <div style={{
            marginTop: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            {/* Items per page selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '14px', color: '#64748b' }}>Items per page:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            {/* Page info */}
            <div style={{ fontSize: '14px', color: '#64748b' }}>
              Showing {startIndex + 1}-{Math.min(endIndex, sortedApplications.length)} of {sortedApplications.length} applications
            </div>

            {/* Pagination buttons */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    background: currentPage === 1 ? '#f8fafc' : 'white',
                    color: currentPage === 1 ? '#cbd5e1' : '#475569',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  ← Previous
                </button>

                {getPageNumbers().map((page, index) => (
                  page === '...' ? (
                    <span key={`ellipsis-${index}`} style={{ padding: '0 8px', color: '#cbd5e1' }}>
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      style={{
                        padding: '6px 12px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        background: currentPage === page ? '#667eea' : 'white',
                        color: currentPage === page ? 'white' : '#475569',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: currentPage === page ? '600' : '500',
                        minWidth: '36px'
                      }}
                    >
                      {page}
                    </button>
                  )
                ))}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    background: currentPage === totalPages ? '#f8fafc' : 'white',
                    color: currentPage === totalPages ? '#cbd5e1' : '#475569',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ApplicationList;

// Made with Bob
