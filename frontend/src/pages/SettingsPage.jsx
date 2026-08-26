import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { userAPI } from '../api.js';
import { fmtSize } from '../utils.js';

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [msg, setMsg] = useState('');

  return (
    <>
      <header className="h-14 border-b border-border bg-surface flex items-center px-6 font-semibold">Settings</header>
      <div className="p-6 max-w-2xl">
        <section className="mb-8">
          <h3 className="text-sm font-semibold border-b border-border pb-2 mb-4">Profile</h3>
          <div className="flex items-center gap-4 py-3 border-b border-border">
            <div className="flex-1"><strong className="text-sm">Email</strong><p className="text-xs text-muted2">Login identifier</p></div>
            <input readOnly value={user?.email || ''} className="px-2 py-1.5 rounded bg-surface2 border border-border text-xs font-mono w-56 opacity-60" />
          </div>
          <div className="flex items-center gap-4 py-3 border-b border-border">
            <div className="flex-1"><strong className="text-sm">Display name</strong></div>
            <input value={name} onChange={(e) => setName(e.target.value)} className="px-2 py-1.5 rounded bg-surface2 border border-border text-xs w-56" />
            <button onClick={async () => { const d = await userAPI.update(name); setUser(d.user); setMsg('Saved'); }} className="px-3 py-1.5 rounded bg-accent text-white text-xs">Save</button>
          </div>
          <div className="flex items-center gap-4 py-3">
            <div className="flex-1"><strong className="text-sm">Quota</strong></div>
            <span className="font-mono text-sm">{fmtSize(user?.storageUsed)} / {fmtSize(user?.storageQuota)}</span>
          </div>
        </section>
        <section>
          <h3 className="text-sm font-semibold border-b border-border pb-2 mb-4">Change password</h3>
          <input type="password" placeholder="Current" value={current} onChange={(e) => setCurrent(e.target.value)} className="w-full mb-2 px-3 py-2 rounded-lg bg-surface2 border border-border" />
          <input type="password" placeholder="New (8+ chars)" value={next} onChange={(e) => setNext(e.target.value)} className="w-full mb-3 px-3 py-2 rounded-lg bg-surface2 border border-border" />
          <button onClick={async () => {
            try { await userAPI.password(current, next); setMsg('Password updated'); setCurrent(''); setNext(''); }
            catch (e) { setMsg(e.message); }
          }} className="px-4 py-2 rounded-lg bg-accent text-white text-sm">Update password</button>
        </section>
        {msg && <p className="mt-4 text-sm text-success">{msg}</p>}
      </div>
    </>
  );
}
