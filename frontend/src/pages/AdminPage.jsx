import { useEffect, useState } from 'react';
import { adminAPI } from '../api.js';
import { fmtSize, fmtDate } from '../utils.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Navigate } from 'react-router-dom';

export default function AdminPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [tab, setTab] = useState('users');

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    adminAPI.stats().then(setStats);
    adminAPI.users().then((d) => setUsers(d.data || []));
    adminAPI.auditLogs().then((d) => setLogs(d.data || []));
  }, [user]);

  if (user?.role !== 'ADMIN') return <Navigate to="/app" replace />;

  return (
    <>
      <header className="h-14 border-b border-border bg-surface flex items-center px-6 font-semibold">Admin</header>
      <div className="p-6">
        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              ['Users', stats.users],
              ['Files', stats.files],
              ['Shares', stats.shares],
              ['Storage', fmtSize(stats.storageUsed)],
            ].map(([l, v]) => (
              <div key={l} className="bg-surface border border-border rounded-xl p-4">
                <div className="text-[11px] uppercase text-muted font-semibold">{l}</div>
                <div className="text-xl font-mono font-semibold mt-1">{v}</div>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2 mb-4">
          {['users', 'audit'].map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-lg text-sm ${tab === t ? 'bg-accent text-white' : 'bg-surface border border-border'}`}>{t}</button>
          ))}
        </div>
        {tab === 'users' && (
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 text-sm">
                <span className="flex-1">{u.email}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-surface2">{u.role}</span>
                <span className="font-mono text-xs text-muted2">{fmtSize(u.storageUsed)} / {fmtSize(u.storageQuota)}</span>
                <select defaultValue={u.role} onChange={(e) => adminAPI.updateUser(u.id, { role: e.target.value })} className="bg-surface2 border border-border rounded px-2 py-1 text-xs">
                  <option>USER</option>
                  <option>ADMIN</option>
                </select>
              </div>
            ))}
          </div>
        )}
        {tab === 'audit' && (
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            {logs.map((l) => (
              <div key={l.id} className="flex items-center gap-3 px-4 py-2 border-b border-border last:border-0 text-xs">
                <span className="font-mono text-accent w-36">{l.action}</span>
                <span className="flex-1 truncate">{l.user?.email || '—'}</span>
                <span className="text-muted2">{l.ip}</span>
                <span className="text-muted2">{fmtDate(l.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
