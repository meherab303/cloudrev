import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fileAPI } from '../api.js';
import { fmtSize, fmtDate } from '../utils.js';
import { File, Folder, Share2, HardDrive } from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    fileAPI.dashboard().then(setData).catch(console.error);
  }, []);

  if (!data) return <div className="p-6 text-muted2">Loading dashboard…</div>;

  const s = data.stats;
  const cards = [
    { label: 'Files', value: s.fileCount, sub: `${s.folderCount} folders`, icon: File },
    { label: 'Storage', value: fmtSize(s.storageUsed), sub: `${((s.storageUsed / s.storageQuota) * 100).toFixed(1)}% used`, icon: HardDrive },
    { label: 'Remaining', value: fmtSize(s.storageQuota - s.storageUsed), sub: 'available', icon: Folder },
    { label: 'Shares', value: s.sharedCount, sub: 'active links', icon: Share2 },
  ];

  return (
    <>
      <header className="h-14 border-b border-border bg-surface flex items-center px-6 font-semibold">Dashboard</header>
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {cards.map((c) => (
            <div key={c.label} className="bg-surface border border-border rounded-xl p-4">
              <div className="text-[11px] uppercase tracking-wide text-muted font-semibold mb-2 flex items-center gap-2">
                <c.icon size={14} /> {c.label}
              </div>
              <div className="text-2xl font-semibold font-mono">{c.value}</div>
              <div className="text-xs text-muted2 mt-1">{c.sub}</div>
            </div>
          ))}
        </div>
        <h2 className="text-xs uppercase tracking-wide text-muted2 font-semibold mb-3">Recent files</h2>
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          {data.recentFiles.length === 0 && <p className="p-8 text-center text-muted">No files yet</p>}
          {data.recentFiles.map((f) => (
            <button key={f.id} onClick={() => nav('/app/files')} className="w-full flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 hover:bg-surface2 text-left">
              <span className="text-lg">📄</span>
              <span className="flex-1 truncate text-sm">{f.name}</span>
              <span className="text-xs font-mono text-muted2">{fmtSize(f.size)}</span>
              <span className="text-xs text-muted2 w-28 text-right">{fmtDate(f.createdAt)}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
