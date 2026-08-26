// frontend/src/components/UploadProgress.jsx
import { fmtSize, getFileIcon } from '../utils.js';
import '../styles/upload.css';

export default function UploadProgress({ uploads }) {
  if (!uploads.length) return null;

  return (
    <div className="upload-items">
      {uploads.map(u => (
        <div key={u.id} className="upload-item">
          <span style={{ fontSize: 20 }}>{getFileIcon(u.name)}</span>
          <span className="ui-name">{u.name}</span>
          <span className="ui-size">{fmtSize(u.size)}</span>
          <div className="ui-bar-wrap">
            <div className="ui-bar" style={{ width: `${u.progress}%` }} />
          </div>
          <span className={`ui-pct ${u.progress >= 100 ? 'ui-done' : ''}`}>
            {u.error
              ? '❌'
              : u.progress >= 100
              ? '✓'
              : `${u.progress}%`}
          </span>
        </div>
      ))}
    </div>
  );
}
