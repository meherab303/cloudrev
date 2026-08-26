import { useFiles } from '../context/FileContext.jsx';
import UploadZone from '../components/UploadZone.jsx';
import UploadProgress from '../components/UploadProgress.jsx';
import FileTable from '../components/FileTable.jsx';
import { fmtSize } from '../utils.js';
import '../styles/upload.css';

export default function UploadPage() {
  const {
    uploads, files, defaultStore, setDefaultStore,
    uploadFiles, setShareFile, deleteFile, downloadFile,
    storageUsed, storageTotal,
  } = useFiles();

  const remaining = storageTotal - storageUsed;
  const storageFull = remaining <= 0;

  return (
    <>
      <div className="glass" style={{ padding: '1.2rem', marginBottom: '1.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: 'var(--muted2)', fontWeight: 500 }}>Store new files in:</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { id: 'local', label: '💾 Local Disk' },
              { id: 's3', label: '☁️ Amazon S3' },
            ].map(s => (
              <button key={s.id} onClick={() => setDefaultStore(s.id)} style={{
                padding: '7px 14px', borderRadius: 7, border: '1.5px solid',
                borderColor: defaultStore === s.id ? 'var(--accent)' : 'var(--border)',
                background: defaultStore === s.id ? 'rgba(79,142,247,.1)' : 'var(--surface2)',
                color: defaultStore === s.id ? 'var(--accent)' : 'var(--muted2)',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
              }}>{s.label}</button>
            ))}
          </div>
          <span style={{ fontSize: 12, color: 'var(--muted2)', fontFamily: "'DM Mono',monospace" }}>
            {fmtSize(remaining)} remaining
          </span>
        </div>
      </div>

      {storageFull && (
        <div className="storage-banner">
          ⚠️ Storage full — delete some files before uploading more.
        </div>
      )}

      <UploadZone onFiles={uploadFiles} disabled={storageFull} />
      <UploadProgress uploads={uploads} />

      {files.length > 0 && (
        <>
          <div style={{ fontSize: 12, color: 'var(--muted2)', marginBottom: 10, fontWeight: 600, letterSpacing: '.4px', textTransform: 'uppercase' }}>
            Recent Files
          </div>
          <FileTable
            files={files.slice(0, 6)}
            onShare={setShareFile}
            onDelete={deleteFile}
            onDownload={downloadFile}
            compact
          />
        </>
      )}
    </>
  );
}
