import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import useOnlineStatus from '../../hooks/useOnlineStatus';

export default function AuthLayout() {
  const { user, loading } = useAuth();
  const isOnline = useOnlineStatus();

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', flexDirection: 'column', gap: 16 }}>
        <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '2rem', color: 'var(--color-primary)' }}></i>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading JewelloSoft...</span>
      </div>
    );
  }

  // If already logged in, no need to see auth screens
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
      {/* Global Offline Banner — pinned to top */}
      {!isOnline && (
        <div style={{
          background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
          color: 'white',
          padding: '8px 16px',
          fontSize: '0.8rem',
          fontWeight: 500,
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          flexShrink: 0,
        }}>
          <i className="fa-solid fa-wifi"></i>
          No internet connection — Login and Registration require network access.
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, background: 'var(--bg-surface)', minHeight: 0 }}>
        {/* Left side branding */}
        <div style={{
          flex: 1,
          background: 'linear-gradient(135deg, var(--color-primary) 0%, #1e3a8a 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <div style={{ width: 80, height: 80, background: 'rgba(255,255,255,0.1)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, border: '1px solid rgba(255,255,255,0.2)' }}>
            <i className="fa-solid fa-gem" style={{ fontSize: '2.5rem', color: '#ecc94b' }}></i>
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 700, margin: 0, fontFamily: 'var(--font-heading)', letterSpacing: '-0.5px' }}>JewelloSoft</h1>
          <p style={{ opacity: 0.8, fontSize: '1.1rem', marginTop: 12, maxWidth: 360, lineHeight: 1.6 }}>The complete billing & inventory solution for modern jewelry businesses.</p>

          <div style={{ marginTop: 60, display: 'flex', gap: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }}></div>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }}></div>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.3)' }}></div>
          </div>
        </div>

        {/* Right side form */}
        <div style={{
          flex: 1,
          background: 'var(--bg-main)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          overflowY: 'auto',
        }}>
          <div style={{
            background: 'var(--bg-card)',
            padding: '40px',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-xl)',
            width: '100%',
            maxWidth: 480,
            border: '1px solid var(--border-soft)',
          }}>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
