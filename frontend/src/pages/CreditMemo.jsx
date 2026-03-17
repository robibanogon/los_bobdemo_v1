import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { memoAPI } from '../services/api';

const CreditMemo = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [memoHtml, setMemoHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadMemo();
  }, [id]);

  const loadMemo = async () => {
    try {
      setLoading(true);
      const response = await memoAPI.generate(id);
      setMemoHtml(response.data.html);
    } catch (err) {
      showError('Failed to load credit memo');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const response = await memoAPI.generate(id);
      setMemoHtml(response.data.html);
      success('Credit memo generated successfully');
    } catch (err) {
      showError(err.response?.data?.error || 'Failed to generate credit memo');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(memoHtml);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownload = () => {
    const blob = new Blob([memoHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credit-memo-${id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    success('Credit memo downloaded');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <button
            onClick={() => navigate(`/applications/${id}`)}
            className="btn btn-outline btn-sm mb-2"
          >
            ← Back to Application
          </button>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
            Credit Memo
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {!memoHtml && (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="btn btn-primary"
            >
              {generating ? 'Generating...' : 'Generate Memo'}
            </button>
          )}
          {memoHtml && (
            <>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="btn btn-outline"
              >
                {generating ? 'Regenerating...' : 'Regenerate'}
              </button>
              <button
                onClick={handlePrint}
                className="btn btn-primary"
              >
                🖨️ Print
              </button>
              <button
                onClick={handleDownload}
                className="btn btn-success"
              >
                ⬇️ Download HTML
              </button>
            </>
          )}
        </div>
      </div>

      {/* Memo Content */}
      {!memoHtml ? (
        <div className="card text-center" style={{ padding: '60px 20px' }}>
          <h2 style={{ marginBottom: '15px' }}>No Credit Memo Generated</h2>
          <p style={{ color: '#64748b', marginBottom: '20px' }}>
            Click the "Generate Memo" button above to create the credit memo for this application.
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Memo Preview */}
          <div style={{
            border: '1px solid #e2e8f0',
            borderRadius: '4px',
            backgroundColor: 'white',
            minHeight: '800px'
          }}>
            <iframe
              srcDoc={memoHtml}
              style={{
                width: '100%',
                minHeight: '800px',
                border: 'none',
                display: 'block'
              }}
              title="Credit Memo Preview"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditMemo;

// Made with Bob
