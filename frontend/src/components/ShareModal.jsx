import { useState } from 'react';
import { useFiles } from '../context/FileContext.jsx';
import { fmtSize, getFileIcon } from '../utils.js';
import '../styles/upload.css';

export default function ShareModal({ onClose }) {
  const { shareFile, createShare } = useFiles();
  const [expiry, setExpiry] = useState('7d');
  const [password, setPassword] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  if (!shareFile) return null;

  const generate = async () => {
    try {
      setGenerating(true);
      setError('');
      const data = await createShare(shareFile.id, expiry, password);
      setShareLink(data.link);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const copy = () => {
    navigator.clipboard?.writeText(shareLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">🔗 Share File</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="share-file-info">
          <span style={{ fontSize: 24 }}>{getFileIcon(shareFile.name)}</span>
          <div>
            <div className="share-file-name">{shareFile.name}</div>
            <div className="share-file-size">{fmtSize(shareFile.size)}</div>
          </div>
        </div>

        <div className="share-opts">
          <div className="share-opt-field">
            <label>EXPIRES IN</label>
            <select value={expiry} onChange={e => setExpiry(e.target.value)}>
              <option value="1d">1 Day</option>
              <option value="7d">7 Days</option>
              <option value="30d">30 Days</option>
              <option value="never">Never</option>
            </select>
          </div>
          <div className="share-opt-field">
            <label>PASSWORD (optional)</label>
            <input
              type="text"
              placeholder="Leave blank for public"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
        </div>

        {shareLink ? (
          <>
            <div className="share-link-row">
              <input className="share-link-input" readOnly value={shareLink} />
              <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={copy}>
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
            <div className="share-meta">
              Expires: {expiry === 'never' ? 'Never' : expiry}
              {password ? ' · Password protected 🔒' : ' · Public link'}
            </div>
          </>
        ) : (
          <>
            {error && <div style={{ color: 'var(--danger)', fontSize: 12, marginBottom: 8 }}>{error}</div>}
            <button className="share-gen-btn" onClick={generate} disabled={generating}>
              {generating ? 'Calling POST /api/share/:id…' : '✨ Generate Share Link'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
