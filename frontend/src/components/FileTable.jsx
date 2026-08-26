// frontend/src/components/FileTable.jsx
import { fmtSize, fmtDate, getFileIcon } from '../utils.js';
import '../styles/files.css';

export default function FileTable({ files, onShare, onDelete, onDownload, compact = false, loading = false }) {
  if (loading) return (
    <div className="empty-state">
      <div className="empty-icon">⏳</div>
      <h3>Loading files…</h3>
    </div>
  );

  if (!files.length) return (
    <div className="empty-state">
      <div className="empty-icon">📭</div>
      <h3>No files yet</h3>
      <p>Upload your first file to get started</p>
    </div>
  );

  return (
    <div className="glass" style={{ overflow: 'hidden' }}>
      <table className="file-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Size</th>
            <th>Storage</th>
            {!compact && <th>Uploaded</th>}
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {files.map(f => (
            <tr key={f.id}>
              <td>
                <span className="file-icon">{getFileIcon(f.name)}</span>
                <span className="file-name">{f.name}</span>
                {f.shared && (
                  <span className="tag blue" style={{ marginLeft: 8 }}>🔗 shared</span>
                )}
              </td>
              <td className="file-size">{fmtSize(f.size)}</td>
              <td>
                <span className={`file-store ${f.store}`}>
                  {f.store === 's3' ? '☁️ S3' : '💾 Local'}
                </span>
              </td>
              {!compact && (
                <td className="file-date">{fmtDate(f.uploadedAt ?? f.date)}</td>
              )}
              <td>
                <div className="file-actions">
                  <button className="icon-btn" title="Share"    onClick={() => onShare(f)}>🔗</button>
                  <button className="icon-btn" title="Download" onClick={() => onDownload(f)}>⬇️</button>
                  <button className="icon-btn danger" title="Delete" onClick={() => onDelete(f.id)}>🗑️</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
