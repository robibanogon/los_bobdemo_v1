import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '0 20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}>
        <div className="container" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '64px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
            <Link to="/dashboard" style={{
              color: 'white',
              textDecoration: 'none',
              fontSize: '20px',
              fontWeight: 'bold',
            }}>
              LOS
            </Link>
            
            <nav style={{ display: 'flex', gap: '5px' }}>
              <Link
                to="/dashboard"
                style={{
                  color: 'white',
                  textDecoration: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  background: isActive('/dashboard') ? 'rgba(255,255,255,0.2)' : 'transparent',
                  transition: 'background 0.2s',
                }}
              >
                Dashboard
              </Link>
              <Link
                to="/applications"
                style={{
                  color: 'white',
                  textDecoration: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  background: isActive('/applications') ? 'rgba(255,255,255,0.2)' : 'transparent',
                  transition: 'background 0.2s',
                }}
              >
                Applications
              </Link>
              <Link
                to="/audit"
                style={{
                  color: 'white',
                  textDecoration: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  background: isActive('/audit') ? 'rgba(255,255,255,0.2)' : 'transparent',
                  transition: 'background 0.2s',
                }}
              >
                Audit Log
              </Link>
            </nav>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>
                {user?.name}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>
                {user?.role}
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '30px 0' }}>
        <div className="container">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        background: '#f8fafc',
        borderTop: '1px solid #e2e8f0',
        padding: '20px 0',
        textAlign: 'center',
        color: '#64748b',
        fontSize: '14px',
      }}>
        <div className="container">
          <p>Loan Origination System - SME Credit Processing Platform</p>
          <p style={{ fontSize: '12px', marginTop: '5px' }}>
            Demo Application © 2024
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;

// Made with Bob
