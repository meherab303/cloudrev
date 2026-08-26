import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Cloud, LayoutDashboard, Folder, Trash2, Share2, Settings, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { fmtSize } from '../utils.js';

const nav = [
  { to: '/app', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/app/files', icon: Folder, label: 'My Files' },
  { to: '/app/shared', icon: Share2, label: 'Shared' },
  { to: '/app/trash', icon: Trash2, label: 'Trash' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const used = user?.storageUsed ?? 0;
  const total = user?.storageQuota || 1;
  const pct = Math.min((used / total) * 100, 100);

  return (
    <div className="min-h-screen flex bg-bg text-ink">
      <aside className="w-[220px] shrink-0 bg-surface border-r border-border flex flex-col p-4 sticky top-0 h-screen">
        <div className="flex items-center gap-2 px-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-accent to-accent2 grid place-items-center">
            <Cloud size={16} />
          </div>
          <span className="font-semibold">Cloudreve</span>
        </div>

        <p className="text-[10px] uppercase tracking-widest text-muted px-2 mb-2">Main</p>
        {nav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] mb-0.5 ${
                isActive ? 'bg-accent/15 text-accent font-medium' : 'text-muted2 hover:bg-surface2'
              }`
            }
          >
            <n.icon size={16} /> {n.label}
          </NavLink>
        ))}

        <p className="text-[10px] uppercase tracking-widest text-muted px-2 mt-4 mb-2">System</p>
        <NavLink to="/app/settings" className={({ isActive }) =>
          `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] ${isActive ? 'bg-accent/15 text-accent' : 'text-muted2 hover:bg-surface2'}`
        }>
          <Settings size={16} /> Settings
        </NavLink>
        {user?.role === 'ADMIN' && (
          <NavLink to="/app/admin" className={({ isActive }) =>
            `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] ${isActive ? 'bg-accent/15 text-accent' : 'text-muted2 hover:bg-surface2'}`
          }>
            <Shield size={16} /> Admin
          </NavLink>
        )}

        <div className="flex-1" />

        <div className="px-2 mb-3">
          <div className="flex justify-between text-[11px] text-muted mb-1">
            <span className="font-semibold">Storage</span>
            <span>{pct.toFixed(1)}%</span>
          </div>
          <div className="h-1.5 bg-border rounded overflow-hidden mb-1">
            <div
              className="h-full rounded"
              style={{
                width: `${pct}%`,
                background: pct > 90 ? 'var(--color-danger)' : 'linear-gradient(90deg,#4f8ef7,#7c5cfc)',
              }}
            />
          </div>
          <div className="text-[10px] text-muted font-mono">{fmtSize(used)} / {fmtSize(total)}</div>
        </div>

        <button
          onClick={async () => { await logout(); navigate('/login'); }}
          className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-surface2 text-left w-full"
        >
          <div className="w-7 h-7 rounded-full bg-linear-to-br from-accent to-accent2 grid place-items-center text-[11px] font-semibold">
            {(user?.email || 'U')[0].toUpperCase()}
          </div>
          <span className="text-xs truncate flex-1">{user?.email}</span>
          <LogOut size={14} className="text-muted" />
        </button>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <Outlet />
      </div>
    </div>
  );
}
