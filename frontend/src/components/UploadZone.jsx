// frontend/src/components/UploadZone.jsx
import { useRef, useState } from 'react';
import '../styles/upload.css';

export default function UploadZone({ onFiles, disabled }) {
  const [drag, setDrag] = useState(false);
  const inputRef        = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    if (!disabled && e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
  };

  const handleChange = (e) => {
    if (!disabled && e.target.files?.length) onFiles(e.target.files);
    e.target.value = ''; // reset so same file can be re-uploaded
  };

  return (
    <div
      className={`upload-zone ${drag ? 'drag' : ''} ${disabled ? 'disabled' : ''}`}
      style={disabled ? { opacity: .5, cursor: 'not-allowed' } : {}}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
    >
      <div className="upload-zone-icon">☁️</div>
      <h3>Drop files here or <span className="browse">browse</span></h3>
      <p>Files are uploaded to Express backend via <code>/api/files/upload</code></p>
      <div className="upload-hint">max 2 GB per file · multer handles multipart/form-data</div>
      <input
        ref={inputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={handleChange}
        disabled={disabled}
      />
    </div>
  );
}
