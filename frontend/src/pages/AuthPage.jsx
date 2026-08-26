import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/auth.css';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [store, setStore] = useState('local');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const switchTab = (t) => { setTab(t); setError(''); };

  const handleSubmit = async () => {
    setError('');
    if (!email || !password) return setError('All fields required');
    if (password.length < 6) return setError('Password must be 6+ characters');
    if (tab === 'register' && password !== confirm) return setError("Passwords don't match");

    setLoading(true);
    try {
      if (tab === 'login') {
        await login(email, password);
      } else {
        await register(email, password, store);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => e.key === 'Enter' && handleSubmit();

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">☁️</div>
          <div>
            <div className="auth-logo-text">Cloudreve Lite</div>
            <div className="auth-logo-sub">Self-hosted storage</div>
          </div>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => switchTab('login')}>Sign In</button>
          <button className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => switchTab('register')}>Create Account</button>
        </div>

        <div className="field">
          <label>EMAIL</label>
          <input type="email" placeholder="you@example.com" value={email}
            onChange={e => setEmail(e.target.value)} onKeyDown={onKey} autoFocus />
        </div>

        <div className="field">
          <label>PASSWORD</label>
          <input type="password" placeholder="••••••••" value={password}
            onChange={e => setPassword(e.target.value)} onKeyDown={onKey} />
        </div>

        {tab === 'register' && (
          <>
            <div className="field">
              <label>CONFIRM PASSWORD</label>
              <input type="password" placeholder="••••••••" value={confirm}
                onChange={e => setConfirm(e.target.value)} onKeyDown={onKey} />
            </div>
            <div className="store-pick">
              <label>DEFAULT STORAGE</label>
              <div className="store-opts">
                {[
                  { id: 'local', icon: '💾', label: 'Local Disk' },
                  { id: 's3', icon: '☁️', label: 'Amazon S3' },
                ].map(opt => (
                  <div key={opt.id}
                    className={`store-opt ${store === opt.id ? 'sel' : ''}`}
                    onClick={() => setStore(opt.id)}
                  >
                    <span className="store-opt-icon">{opt.icon}</span>
                    <span className="store-opt-label">{opt.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {error && <div className="form-err">{error}</div>}

        <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading
            ? (tab === 'login' ? 'Signing in…' : 'Creating account…')
            : (tab === 'login' ? 'Sign In' : 'Create Account')}
        </button>
      </div>
    </div>
  );
}
