import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Cloud } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      nav('/app');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center p-6 bg-[radial-gradient(ellipse_at_20%_50%,#1a1f35_0%,#0d0f14_60%)]">
      <form onSubmit={submit} className="w-full max-w-[400px] bg-surface border border-border rounded-[20px] p-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-[10px] bg-linear-to-br from-accent to-accent2 grid place-items-center">
            <Cloud size={18} />
          </div>
          <div>
            <div className="text-xl font-semibold">Cloudreve Lite</div>
            <div className="text-[11px] text-muted font-mono uppercase tracking-widest">Self-hosted storage</div>
          </div>
        </div>
        <label className="block text-xs text-muted2 mb-1.5 font-medium">EMAIL</label>
        <input className="w-full mb-4 px-3 py-2.5 rounded-lg bg-surface2 border border-border outline-none focus:border-accent" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        <label className="block text-xs text-muted2 mb-1.5 font-medium">PASSWORD</label>
        <input className="w-full mb-4 px-3 py-2.5 rounded-lg bg-surface2 border border-border outline-none focus:border-accent" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="text-danger text-xs text-center mb-3">{error}</p>}
        <button disabled={loading} className="w-full py-2.5 rounded-lg font-semibold text-white bg-linear-to-br from-accent to-accent2 disabled:opacity-50">
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
        <p className="text-center text-sm text-muted2 mt-4">
          No account? <Link to="/register" className="text-accent">Create one</Link>
        </p>
      </form>
    </div>
  );
}
