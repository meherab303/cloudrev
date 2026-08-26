import { useEffect, useState } from 'react';
import { shareAPI } from '../api.js';
import { fmtDate } from '../utils.js';

export default function SharedPage() {
  const [shares, setShares] = useState([]);

  const load = () => shareAPI.list().then((d) => setShares(d.shares || []));
  useEffect(() => { load(); }, []);

  return (
    <>
      <header className="h-14 border-b border-border bg-surface flex items-center px-6 font-semibold">Shared links</header>
      <div className="p-6">
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          {shares.map((s) => {
            const url = `${window.location.origin}${s.link}`;
            return (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0">
                <span className="flex-1 text-sm truncate">{s.file?.name || s.folder?.name}</span>
                <span className="text-xs text-muted2">{s.downloadCount} downloads</span>
                <span className="text-xs text-muted2">{s.expiresAt ? fmtDate(s.expiresAt) : 'Never'}</span>
                <button className="text-xs text-accent" onClick={() => navigator.clipboard.writeText(url)}>Copy</button>
                <button className="text-xs text-danger" onClick={async () => { await shareAPI.revoke(s.id); load(); }}>Revoke</button>
              </div>
            );
          })}
          {!shares.length && <p className="p-10 text-center text-muted">No share links yet</p>}
        </div>
      </div>
    </>
  );
}
