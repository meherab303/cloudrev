import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { shareAPI } from '../api.js';
import { fmtSize } from '../utils.js';

export default function PublicSharePage() {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [needPw, setNeedPw] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = async (pw) => {
    setError('');
    try {
      setData(await shareAPI.access(token, pw));
      setNeedPw(false);
    } catch (e) {
      if (e.message === 'Password required' || e.message === 'Wrong password') setNeedPw(true);
      setError(e.message);
    }
  };

  useEffect(() => { load(); }, [token]);

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-md bg-surface border border-border rounded-[20px] p-8">
        <h1 className="text-lg font-semibold mb-4">Shared file</h1>
        {needPw && (
          <form onSubmit={(e) => { e.preventDefault(); load(password); }} className="mb-4">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full mb-2 px-3 py-2 rounded-lg bg-surface2 border border-border" />
            <button className="w-full py-2 rounded-lg bg-accent text-white">Unlock</button>
          </form>
        )}
        {error && <p className="text-danger text-sm mb-3">{error}</p>}
        {data?.file && (
          <div>
            <p className="font-medium">{data.file.name}</p>
            <p className="text-xs text-muted2 font-mono mb-4">{fmtSize(data.file.size)}</p>
            <a href={shareAPI.downloadUrl(token, password)} className="block text-center py-2 rounded-lg bg-accent text-white">Download</a>
          </div>
        )}
        {data?.folder && <p>Folder share: {data.folder.name}</p>}
      </div>
    </div>
  );
}
