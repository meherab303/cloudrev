import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload, FolderPlus, Search, LayoutGrid, List, MoreHorizontal, Download, Pencil, Trash2, Copy, Share2, Eye, X } from 'lucide-react';
import { fileAPI, folderAPI, shareAPI } from '../api.js';
import { fmtSize, fmtDate, isPreviewable } from '../utils.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function FilesPage() {
  const { folderId } = useParams();
  const nav = useNavigate();
  const { user, setUser } = useAuth();
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [crumbs, setCrumbs] = useState([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [type, setType] = useState('');
  const [view, setView] = useState('list');
  const [loading, setLoading] = useState(true);
  const [uploads, setUploads] = useState([]);
  const [menu, setMenu] = useState(null);
  const [shareItem, setShareItem] = useState(null);
  const [preview, setPreview] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const inputRef = useRef();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fileAPI.list({ folderId, search, sort, order, type, page });
      setFiles(data.data || []);
      setFolders(data.folders || []);
      setCrumbs(data.breadcrumbs || []);
      setPagination(data.pagination);
    } finally {
      setLoading(false);
    }
  }, [folderId, search, sort, order, type, page]);

  useEffect(() => { load(); }, [load]);

  const onUpload = async (list) => {
    for (const file of Array.from(list)) {
      const id = crypto.randomUUID();
      setUploads((p) => [...p, { id, name: file.name, progress: 0 }]);
      try {
        const saved = await fileAPI.upload(file, folderId, (pct) => {
          setUploads((p) => p.map((u) => u.id === id ? { ...u, progress: pct } : u));
        });
        setUser((u) => u ? { ...u, storageUsed: u.storageUsed + saved.size } : u);
        setUploads((p) => p.filter((u) => u.id !== id));
        await load();
      } catch (err) {
        setUploads((p) => p.map((u) => u.id === id ? { ...u, error: err.message } : u));
      }
    }
  };

  const mkdir = async () => {
    const name = prompt('Folder name');
    if (!name) return;
    await folderAPI.create(name, folderId);
    load();
  };

  const act = async (action, item, kind) => {
    setMenu(null);
    if (action === 'download' && kind === 'file') return fileAPI.download(item);
    if (action === 'rename') {
      const name = prompt('New name', item.name);
      if (!name) return;
      if (kind === 'file') await fileAPI.rename(item.id, name);
      else await folderAPI.rename(item.id, name);
      return load();
    }
    if (action === 'copy' && kind === 'file') { await fileAPI.copy(item.id, folderId); return load(); }
    if (action === 'trash') {
      if (kind === 'file') {
        await fileAPI.trash(item.id);
        setUser((u) => u);
      } else await folderAPI.trash(item.id);
      return load();
    }
    if (action === 'share') { setShareItem({ ...item, kind }); return; }
    if (action === 'preview' && kind === 'file') {
      const p = await fileAPI.preview(item.id);
      setPreview({ ...p, name: item.name });
    }
  };

  return (
    <>
      <header className="h-14 border-b border-border bg-surface flex items-center gap-3 px-6">
        <span className="font-semibold flex-1">My Files</span>
        <button onClick={() => inputRef.current.click()} className="px-3 py-1.5 rounded-lg bg-accent text-white text-sm font-medium flex items-center gap-1.5">
          <Upload size={14} /> Upload
        </button>
        <button onClick={mkdir} className="px-3 py-1.5 rounded-lg bg-surface2 border border-border text-sm flex items-center gap-1.5">
          <FolderPlus size={14} /> Folder
        </button>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => { onUpload(e.target.files); e.target.value = ''; }} />
      </header>

      <div className="p-6">
        <div className="flex items-center gap-2 text-sm text-muted2 mb-4">
          <button onClick={() => nav('/app/files')} className="hover:text-ink">Root</button>
          {crumbs.map((c) => (
            <span key={c.id}> / <button onClick={() => nav(`/app/files/${c.id}`)} className="hover:text-ink">{c.name}</button></span>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search files…" className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface border border-border text-sm outline-none focus:border-accent" />
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="px-2 py-2 rounded-lg bg-surface border border-border text-sm">
            <option value="createdAt">Date</option>
            <option value="name">Name</option>
            <option value="size">Size</option>
            <option value="mimeType">Type</option>
          </select>
          <select value={order} onChange={(e) => setOrder(e.target.value)} className="px-2 py-2 rounded-lg bg-surface border border-border text-sm">
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
          <select value={type} onChange={(e) => setType(e.target.value)} className="px-2 py-2 rounded-lg bg-surface border border-border text-sm">
            <option value="">All types</option>
            <option value="image/">Images</option>
            <option value="video/">Videos</option>
            <option value="audio/">Audio</option>
            <option value="application/pdf">PDF</option>
            <option value="text/">Text</option>
          </select>
          <button onClick={() => setView(view === 'list' ? 'grid' : 'list')} className="p-2 rounded-lg bg-surface border border-border">
            {view === 'list' ? <LayoutGrid size={16} /> : <List size={16} />}
          </button>
        </div>

        {uploads.map((u) => (
          <div key={u.id} className="flex items-center gap-3 bg-surface border border-border rounded-lg px-3 py-2 mb-2 text-sm">
            <span className="flex-1 truncate">{u.name}</span>
            <div className="w-32 h-1 bg-border rounded overflow-hidden"><div className="h-full bg-accent" style={{ width: `${u.progress}%` }} /></div>
            <span className="font-mono text-xs text-muted2">{u.error || `${u.progress}%`}</span>
          </div>
        ))}

        {loading ? <p className="text-muted2 py-10 text-center">Loading…</p> : (
          view === 'list' ? (
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] uppercase text-muted tracking-wide">
                    <th className="text-left px-3 py-2">Name</th>
                    <th className="text-left px-3 py-2">Size</th>
                    <th className="text-left px-3 py-2">Modified</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {folders.map((f) => (
                    <tr key={f.id} className="border-t border-border hover:bg-surface2">
                      <td className="px-3 py-2">
                        <button onClick={() => nav(`/app/files/${f.id}`)} className="flex items-center gap-2">📁 {f.name}</button>
                      </td>
                      <td className="px-3 py-2 text-muted2 font-mono">—</td>
                      <td className="px-3 py-2 text-muted2">{fmtDate(f.updatedAt)}</td>
                      <td className="px-3 py-2 text-right relative">
                        <button onClick={() => setMenu({ id: f.id, kind: 'folder', item: f })} className="p-1"><MoreHorizontal size={16} /></button>
                      </td>
                    </tr>
                  ))}
                  {files.map((f) => (
                    <tr key={f.id} className="border-t border-border hover:bg-surface2">
                      <td className="px-3 py-2">📄 {f.name}</td>
                      <td className="px-3 py-2 text-muted2 font-mono">{fmtSize(f.size)}</td>
                      <td className="px-3 py-2 text-muted2">{fmtDate(f.updatedAt)}</td>
                      <td className="px-3 py-2 text-right">
                        <button onClick={() => setMenu({ id: f.id, kind: 'file', item: f })} className="p-1"><MoreHorizontal size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!files.length && !folders.length && <p className="p-10 text-center text-muted">Empty folder</p>}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {folders.map((f) => (
                <button key={f.id} onClick={() => nav(`/app/files/${f.id}`)} className="bg-surface border border-border rounded-xl p-4 text-center hover:border-accent">
                  <div className="text-3xl mb-2">📁</div>
                  <div className="text-xs truncate">{f.name}</div>
                </button>
              ))}
              {files.map((f) => (
                <div key={f.id} className="bg-surface border border-border rounded-xl p-4 text-center relative">
                  <div className="text-3xl mb-2">📄</div>
                  <div className="text-xs truncate">{f.name}</div>
                  <button onClick={() => setMenu({ id: f.id, kind: 'file', item: f })} className="absolute top-2 right-2"><MoreHorizontal size={14} /></button>
                </div>
              ))}
            </div>
          )
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex gap-2 mt-4 justify-center">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((n) => (
              <button key={n} onClick={() => setPage(n)} className={`px-3 py-1 rounded ${n === page ? 'bg-accent text-white' : 'bg-surface border border-border'}`}>{n}</button>
            ))}
          </div>
        )}
      </div>

      {menu && (
        <div className="fixed inset-0 z-40" onClick={() => setMenu(null)}>
          <div className="absolute right-8 top-32 bg-surface2 border border-border rounded-xl p-1 w-48 shadow-xl" onClick={(e) => e.stopPropagation()}>
            {menu.kind === 'file' && isPreviewable(menu.item.mimeType) && (
              <MenuBtn icon={Eye} label="Preview" onClick={() => act('preview', menu.item, 'file')} />
            )}
            {menu.kind === 'file' && <MenuBtn icon={Download} label="Download" onClick={() => act('download', menu.item, 'file')} />}
            <MenuBtn icon={Pencil} label="Rename" onClick={() => act('rename', menu.item, menu.kind)} />
            {menu.kind === 'file' && <MenuBtn icon={Copy} label="Copy" onClick={() => act('copy', menu.item, 'file')} />}
            <MenuBtn icon={Share2} label="Share" onClick={() => act('share', menu.item, menu.kind)} />
            <MenuBtn icon={Trash2} label="Move to trash" danger onClick={() => act('trash', menu.item, menu.kind)} />
          </div>
        </div>
      )}

      {shareItem && <ShareDialog item={shareItem} onClose={() => setShareItem(null)} />}
      {preview && <PreviewModal preview={preview} onClose={() => setPreview(null)} />}
    </>
  );
}

function MenuBtn({ icon: Icon, label, onClick, danger }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-surface ${danger ? 'text-danger' : ''}`}>
      <Icon size={14} /> {label}
    </button>
  );
}

function ShareDialog({ item, onClose }) {
  const [expiry, setExpiry] = useState('7d');
  const [password, setPassword] = useState('');
  const [link, setLink] = useState('');
  const [err, setErr] = useState('');

  const gen = async () => {
    try {
      const body = { expiry, password, [item.kind === 'file' ? 'fileId' : 'folderId']: item.id };
      const data = await shareAPI.create(body);
      setLink(`${window.location.origin}${data.link}`);
    } catch (e) { setErr(e.message); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 grid place-items-center p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-surface border border-border rounded-[20px] p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between mb-4">
          <h3 className="font-semibold">Share {item.name}</h3>
          <button onClick={onClose}><X size={16} /></button>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-[11px] text-muted2">EXPIRES</label>
            <select value={expiry} onChange={(e) => setExpiry(e.target.value)} className="w-full mt-1 px-2 py-2 rounded-lg bg-surface2 border border-border">
              <option value="1d">1 Day</option>
              <option value="7d">7 Days</option>
              <option value="30d">30 Days</option>
              <option value="never">Never</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] text-muted2">PASSWORD</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} className="w-full mt-1 px-2 py-2 rounded-lg bg-surface2 border border-border" placeholder="optional" />
          </div>
        </div>
        {err && <p className="text-danger text-xs mb-2">{err}</p>}
        {link ? (
          <div className="flex gap-2">
            <input readOnly value={link} className="flex-1 px-2 py-2 rounded-lg bg-surface2 border border-border font-mono text-xs text-accent" />
            <button onClick={() => navigator.clipboard.writeText(link)} className="px-3 py-2 rounded-lg bg-accent text-white text-sm">Copy</button>
          </div>
        ) : (
          <button onClick={gen} className="w-full py-2 rounded-lg border border-dashed border-border2 text-muted2 hover:text-accent hover:border-accent">Generate link</button>
        )}
      </div>
    </div>
  );
}

function PreviewModal({ preview, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 grid place-items-center p-6" onClick={onClose}>
      <div className="max-w-4xl w-full bg-surface rounded-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between px-4 py-3 border-b border-border">
          <span className="text-sm">{preview.name}</span>
          <button onClick={onClose}><X size={16} /></button>
        </div>
        <div className="p-4 max-h-[80vh] overflow-auto bg-black/30">
          {preview.mimeType?.startsWith('image/') && <img src={preview.url} alt="" className="max-w-full mx-auto" />}
          {preview.mimeType === 'application/pdf' && <iframe src={preview.url} title="pdf" className="w-full h-[70vh]" />}
          {preview.mimeType?.startsWith('text/') && <iframe src={preview.url} title="text" className="w-full h-[70vh] bg-white" />}
        </div>
      </div>
    </div>
  );
}
