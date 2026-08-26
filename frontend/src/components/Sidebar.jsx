import { useAuth } from '../context/AuthContext.jsx';
import { useFiles } from '../context/FileContext.jsx';
import { fmtSize } from '../utils.js';
import '../styles/layout.css';

export default function Sidebar({ view, setView, onLogout }) {
  const { user } = useAuth();
  const { storageUsed, storageTotal } = useFiles();

  const used = storageUsed ?? 0;
  const total = storageTotal ?? 5 * 1024 * 1024 * 1024;
  const pct = Math.min((used / total) * 100, 100).toFixed(1);
  const initials = (user?.email ?? 'U').split('@')[0].slice(0, 2).toUpperCase();

  const navItems = [
    { id: 'files', icon: '📁', label: 'My Files' },
    { id: 'upload', icon: '⬆️', label: 'Upload' },
  ];

  return (
    <div className="sidebar">
      <div className="sb-logo">
        <div className="sb-logo-icon">☁️</div>
        <span className="sb-logo-text">Cloudreve</span>
      </div>

      <div className="sb-section">Main</div>
      {navItems.map(item => (
        <button
          key={item.id}
          className={`sb-item ${view === item.id ? 'active' : ''}`}
          onClick={() => setView(item.id)}
        >
          <span className="sb-icon">{item.icon}</span>
          {item.label}
        </button>
      ))}

      <div className="sb-section">System</div>
      <button
        className={`sb-item ${view === 'settings' ? 'active' : ''}`}
        onClick={() => setView('settings')}
      >
        <span className="sb-icon">⚙️</span>Settings
      </button>

      <div className="sb-spacer" />

      <div className="sb-storage">
        <div className="sb-storage-header">
          <span className="sb-storage-label">Storage</span>
          <span>{pct}%</span>
        </div>
        <div className="sb-bar">
          <div
            className="sb-bar-fill"
            style={{
              width: `${pct}%`,
              background: pct > 90
                ? 'var(--danger)'
                : pct > 70
                  ? 'var(--warn)'
                  : 'linear-gradient(90deg, var(--accent), var(--accent2))',
            }}
          />
        </div>
        <div className="sb-storage-sub">
          {fmtSize(used)} / {fmtSize(total)} used
        </div>
      </div>

      <button className="sb-user" onClick={onLogout} title="Sign out">
        <div className="sb-avatar">{initials}</div>
        <span className="sb-username">{user?.email ?? ''}</span>
        <span className="sb-logout">↪</span>
      </button>
    </div>
  );
}
