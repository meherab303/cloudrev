import { useEffect, useState } from 'react';
import { trashAPI, fileAPI, folderAPI } from '../api.js';
import { fmtSize, fmtDate } from '../utils.js';

export default function TrashPage() {
  const [data, setData] = useState({ files: [], folders: [] });

  const load = () => trashAPI.list().then(setData);

  useEffect(() => { load(); }, []);

  return (
    <>
      <header className="h-14 border-b border-border bg-surface flex items-center px-6 gap-3">
        <span className="font-semibold flex-1">Trash</span>
        <button onClick={async () => { if (confirm('Permanently delete everything in trash?')) { await trashAPI.empty(); load(); } }} className="px-3 py-1.5 rounded-lg bg-danger/15 text-danger text-sm">
          Empty trash
        </button>
      </header>
      <div className="p-6">
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          {[...data.folders.map((f) => ({ ...f, kind: 'folder' })), ...data.files.map((f) => ({ ...f, kind: 'file' }))].map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0">
              <span>{item.kind === 'folder' ? '📁' : '📄'}</span>
              <span className="flex-1 text-sm">{item.name}</span>
              <span className="text-xs font-mono text-muted2">{item.size ? fmtSize(item.size) : '—'}</span>
              <span className="text-xs text-muted2">{fmtDate(item.trashedAt)}</span>
              <button className="text-xs text-accent" onClick={async () => {
                if (item.kind === 'file') await fileAPI.restore(item.id);
                else await folderAPI.restore(item.id);
                load();
              }}>Restore</button>
              {item.kind === 'file' && (
                <button className="text-xs text-danger" onClick={async () => { await fileAPI.permanent(item.id); load(); }}>Delete</button>
              )}
            </div>
          ))}
          {!data.files.length && !data.folders.length && <p className="p-10 text-center text-muted">Trash is empty</p>}
        </div>
      </div>
    </>
  );
}
