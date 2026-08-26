import { createContext, useContext, useState, useCallback } from 'react';
import { fileAPI, shareAPI, getToken } from '../api.js';

const FileContext = createContext(null);

export function FileProvider({ children }) {
  const [files, setFiles] = useState([]);
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageTotal, setStorageTotal] = useState(5 * 1024 * 1024 * 1024);
  const [loading, setLoading] = useState(false);
  const [uploads, setUploads] = useState([]);
  const [shareFile, setShareFile] = useState(null);
  const [defaultStore, setDefaultStore] = useState('local');

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fileAPI.list();
      setFiles(data.files ?? []);
      setStorageUsed(data.storageUsed ?? 0);
      setStorageTotal(data.storageTotal ?? 5 * 1024 * 1024 * 1024);
    } catch (err) {
      console.error('fetchFiles:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadFiles = useCallback(async (fileList) => {
    const arr = Array.from(fileList);

    for (const file of arr) {
      const tempId = crypto.randomUUID();

      setUploads(prev => [...prev, { id: tempId, name: file.name, size: file.size, progress: 0 }]);

      try {
        const saved = await fileAPI.upload(file, defaultStore, (pct) => {
          setUploads(prev => prev.map(u => u.id === tempId ? { ...u, progress: pct } : u));
        });

        setUploads(prev => prev.map(u => u.id === tempId ? { ...u, progress: 100 } : u));
        setTimeout(() => setUploads(prev => prev.filter(u => u.id !== tempId)), 800);

        setFiles(prev => [saved, ...prev]);
        setStorageUsed(prev => prev + saved.size);
      } catch (err) {
        console.error('upload error:', err);
        setUploads(prev => prev.map(u => u.id === tempId ? { ...u, error: true } : u));
        setTimeout(() => setUploads(prev => prev.filter(u => u.id !== tempId)), 2000);
      }
    }
  }, [defaultStore]);

  const deleteFile = useCallback(async (id) => {
    const file = files.find(f => f.id === id);
    if (!file) return;

    await fileAPI.delete(id);
    setFiles(prev => prev.filter(f => f.id !== id));
    setStorageUsed(prev => Math.max(0, prev - file.size));
  }, [files]);

  const downloadFile = useCallback((file) => {
    const token = getToken();
    const url = `/api/files/${file.id}/download`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch(err => alert('Download failed: ' + err.message));
  }, []);

  const createShare = useCallback(async (fileId, expiry, password) => {
    const data = await shareAPI.create(fileId, expiry, password);
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, shared: data.link } : f));
    return data;
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setUploads([]);
    setShareFile(null);
  }, []);

  return (
    <FileContext.Provider value={{
      files, storageUsed, storageTotal, loading,
      uploads, shareFile, defaultStore,
      setDefaultStore, setShareFile,
      fetchFiles, uploadFiles, deleteFile,
      downloadFile, createShare, clearFiles,
    }}>
      {children}
    </FileContext.Provider>
  );
}

export function useFiles() {
  const ctx = useContext(FileContext);
  if (!ctx) throw new Error('useFiles must be used within FileProvider');
  return ctx;
}
