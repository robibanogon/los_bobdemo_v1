import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();

  const demoUsers = [
    { username: 'rm1', password: 'password123', role: 'RM' },
    { username: 'analyst1', password: 'password123', role: 'Credit Analyst' },
    { username: 'approver1', password: 'password123', role: 'Approver' },
    { username: 'admin', password: 'admin123', role: 'Admin' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);

    if (result.success) {
      success('Login successful! Welcome back.');
      navigate('/dashboard');
    } else {
      setError(result.error);
      showError(result.error || 'Login failed. Please try again.');
    }

    setLoading(false);
  };

  const handleDemoLogin = (user) => {
    setUsername(user.username);
    setPassword(user.password);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '450px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>
            Loan Origination System
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            SME Credit Processing Platform
          </p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '10px' }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div style={{
          marginTop: '30px',
          paddingTop: '30px',
          borderTop: '1px solid #e2e8f0',
        }}>
          <p style={{
            fontSize: '13px',
            color: '#64748b',
            marginBottom: '15px',
            textAlign: 'center',
            fontWeight: '500',
          }}>
            Demo Users - Click to auto-fill
          </p>
          <div style={{ display: 'grid', gap: '10px' }}>
            {demoUsers.map((user) => (
              <button
                key={user.username}
                type="button"
                onClick={() => handleDemoLogin(user)}
                style={{
                  padding: '12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  background: 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#667eea';
                  e.currentTarget.style.background = '#f8fafc';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.background = 'white';
                }}
              >
                <div>
                  <div style={{ fontWeight: '500', fontSize: '14px', color: '#1e293b' }}>
                    {user.username}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {user.role}
                  </div>
                </div>
                <div style={{
                  fontSize: '11px',
                  color: '#64748b',
                  fontFamily: 'monospace',
                }}>
                  {user.password}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div style={{
          marginTop: '20px',
          padding: '12px',
          background: '#f1f5f9',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#475569',
          textAlign: 'center',
        }}>
          <strong>Demo Application</strong> - For testing purposes only
        </div>
      </div>
    </div>
  );
};

export default Login;

// Made with Bob
