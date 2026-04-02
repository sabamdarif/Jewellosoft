import { useState, useEffect } from 'react';

export default function AutoUpdater() {
  const [status, setStatus] = useState('idle'); // idle | downloading | ready
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!window.electronAPI) return;

    window.electronAPI.onUpdateAvailable(() => {
      setStatus('downloading');
    });

    window.electronAPI.onDownloadProgress((progressObj) => {
      setStatus('downloading');
      setProgress(Math.round(progressObj.percent));
    });

    window.electronAPI.onUpdateDownloaded(() => {
      setStatus('ready');
    });
  }, []);

  if (status === 'idle') return null;

  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 99999,
      background: 'var(--bg-card, #1e293b)', color: 'var(--text-primary, #f1f5f9)',
      borderRadius: 'var(--radius-lg, 12px)', boxShadow: 'var(--shadow-xl, 0 20px 60px rgba(0,0,0,0.35))',
      padding: '20px 24px', width: 320,
      border: '1px solid var(--border-primary, rgba(255,255,255,0.08))',
      fontFamily: 'var(--font-body, "Inter", sans-serif)',
      animation: 'fadeInUp 300ms ease-out',
    }}>
      {status === 'downloading' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontWeight: 600, fontSize: '0.875rem', letterSpacing: '0.02em' }}>
              <i className="fa-solid fa-cloud-arrow-down" style={{ marginRight: 8, color: 'var(--color-primary, #3b82f6)' }}></i>
              Downloading Update
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary, #3b82f6)' }}>{progress}%</span>
          </div>
          <div style={{ width: '100%', height: 6, backgroundColor: 'var(--bg-surface, #334155)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              width: `${progress}%`, height: '100%', borderRadius: 3,
              background: 'linear-gradient(90deg, var(--color-primary, #3b82f6), #60a5fa)',
              transition: 'width 300ms ease-out',
            }}></div>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', marginTop: 8, marginBottom: 0 }}>
            Please do not close the application.
          </p>
        </div>
      )}

      {status === 'ready' && (
        <div>
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-success, #22c55e)' }}>
              <i className="fa-solid fa-circle-check" style={{ marginRight: 8 }}></i>
              Update Ready!
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)', lineHeight: 1.5, marginBottom: 16, marginTop: 0 }}>
            A new version has been downloaded. Restart to apply the update.
          </p>
          <button
            onClick={() => window.electronAPI.installUpdate()}
            style={{
              width: '100%', padding: '10px', border: 'none', borderRadius: 6, cursor: 'pointer',
              background: 'var(--color-primary, #3b82f6)', color: 'white',
              fontWeight: 600, fontSize: '0.875rem',
              transition: 'opacity 150ms',
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <i className="fa-solid fa-arrow-rotate-right" style={{ marginRight: 8 }}></i>
            Restart & Install
          </button>
          <button
            onClick={() => setStatus('idle')}
            style={{
              width: '100%', padding: '8px', border: 'none', borderRadius: 6, cursor: 'pointer',
              background: 'transparent', color: 'var(--text-muted, #94a3b8)',
              fontWeight: 500, fontSize: '0.8rem', marginTop: 4,
            }}
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
