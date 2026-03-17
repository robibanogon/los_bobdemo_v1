import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { applicationsAPI, documentsAPI } from '../services/api';

const DocumentUpload = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [application, setApplication] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [docType, setDocType] = useState('');

  // Check if user can delete documents (RM role and Draft status)
  const canDelete = application && application.status === 'Draft' && user?.role === 'RM';

  const docTypes = [
    'Bank Statement',
    'Financial Statement',
    'ID/KYC',
    'Collateral Proof',
    'Other'
  ];

  const requiredDocs = [
    'Bank Statement',
    'Financial Statement',
    'ID/KYC',
    'Collateral Proof'
  ];

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [appRes, docsRes] = await Promise.all([
        applicationsAPI.getById(id),
        documentsAPI.getByApplication(id)
      ]);
      setApplication(appRes.data);
      setDocuments(docsRes.data);
    } catch (err) {
      showError('Failed to load documents');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        showError('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!selectedFile || !docType) {
      showError('Please select a file and document type');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('doc_type', docType);

      await documentsAPI.upload(id, formData);

      success('Document uploaded successfully');
      setSelectedFile(null);
      setDocType('');
      // Reset file input
      document.getElementById('fileInput').value = '';
      loadData();
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to upload document');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await documentsAPI.delete(docId);
      success('Document deleted successfully');
      loadData();
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to delete document');
      console.error(err);
    }
  };

  const handleView = async (docId, filename) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const url = `${apiUrl}/documents/${docId}/download`;
      
      // Open in new tab with auth header
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to download document');
      }
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      // Open in new window
      window.open(blobUrl, '_blank');
      
      // Clean up after a delay
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (err) {
      showError('Failed to view document');
      console.error(err);
    }
  };

  const handleDownload = async (docId, filename) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const url = `${apiUrl}/documents/${docId}/download`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to download document');
      }
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      
      success('Document downloaded successfully');
    } catch (err) {
      showError('Failed to download document');
      console.error(err);
    }
  };

  const getCompletionPercentage = () => {
    const uploadedTypes = new Set(documents.map(d => d.doc_type));
    const completed = requiredDocs.filter(type => uploadedTypes.has(type)).length;
    return Math.round((completed / requiredDocs.length) * 100);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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

  const completionPercentage = getCompletionPercentage();

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
          Document Upload
        </h1>
        <p style={{ color: '#64748b' }}>
          {application.application_number} - {application.applicant.legal_name}
        </p>
      </div>

      {/* Completion Progress */}
      <div className="card mb-4">
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px' }}>
          Document Checklist
        </h2>
        <div style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>Completion</span>
            <span style={{ fontSize: '14px', fontWeight: '600', color: completionPercentage === 100 ? '#10b981' : '#f59e0b' }}>
              {completionPercentage}%
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#e2e8f0',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${completionPercentage}%`,
              height: '100%',
              backgroundColor: completionPercentage === 100 ? '#10b981' : '#f59e0b',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          {requiredDocs.map(type => {
            const uploaded = documents.some(d => d.doc_type === type);
            return (
              <div
                key={type}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px',
                  backgroundColor: uploaded ? '#d4edda' : '#fff3cd',
                  borderRadius: '4px',
                  border: `1px solid ${uploaded ? '#c3e6cb' : '#ffeaa7'}`
                }}
              >
                <span style={{ fontSize: '18px' }}>{uploaded ? '✓' : '○'}</span>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>{type}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upload Form */}
      <div className="card mb-4">
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px' }}>
          Upload New Document
        </h2>
        <form onSubmit={handleUpload}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '15px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Document Type <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px'
                }}
              >
                <option value="">Select type...</option>
                {docTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                File <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                id="fileInput"
                type="file"
                onChange={handleFileSelect}
                required
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px'
                }}
              />
            </div>
            <button
              type="submit"
              disabled={uploading || !selectedFile || !docType}
              className="btn btn-primary"
              style={{ padding: '10px 20px' }}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
          {selectedFile && (
            <div style={{ marginTop: '10px', fontSize: '14px', color: '#64748b' }}>
              Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
            </div>
          )}
        </form>
      </div>

      {/* Documents List */}
      <div className="card">
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px' }}>
          Uploaded Documents ({documents.length})
        </h2>
        {documents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            <p>No documents uploaded yet</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Document Type</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Filename</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Size</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Uploaded By</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Upload Date</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px' }}>
                      <span className="badge badge-info">{doc.doc_type}</span>
                    </td>
                    <td style={{ padding: '12px' }}>{doc.filename}</td>
                    <td style={{ padding: '12px', color: '#64748b' }}>
                      {doc.file_size ? formatFileSize(doc.file_size) : 'N/A'}
                    </td>
                    <td style={{ padding: '12px', color: '#64748b' }}>{doc.uploaded_by}</td>
                    <td style={{ padding: '12px', color: '#64748b' }}>{formatDate(doc.uploaded_at)}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleView(doc.id, doc.original_filename)}
                        className="btn btn-primary btn-sm"
                        style={{ padding: '4px 12px', fontSize: '14px', marginRight: '8px' }}
                        title="View document in new tab"
                      >
                        👁️ View
                      </button>
                      <button
                        onClick={() => handleDownload(doc.id, doc.original_filename)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 12px', fontSize: '14px', marginRight: '8px' }}
                        title="Download document"
                      >
                        ⬇️ Download
                      </button>
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="btn btn-danger btn-sm"
                          style={{ padding: '4px 12px', fontSize: '14px' }}
                          title="Delete document"
                        >
                          🗑️ Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentUpload;

// Made with Bob
