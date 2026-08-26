import { useFiles } from '../context/FileContext.jsx';
import '../styles/layout.css';

const TITLES = { files: 'My Files', upload: 'Upload Files', settings: 'Settings' };

export default function Topbar({ view, onUploadClick }) {
  const { defaultStore } = useFiles();

  return (
    <div className="topbar">
      <span className="topbar-title">{TITLES[view] ?? 'Cloudreve Lite'}</span>

      <span className={`tag ${defaultStore === 's3' ? 'yellow' : 'green'}`}>
        {defaultStore === 's3' ? '☁️ S3' : '💾 Local'}
      </span>

      {view !== 'upload' && (
        <button className="topbar-btn primary" onClick={onUploadClick}>
          ⬆️ Upload
        </button>
      )}
    </div>
  );
}
