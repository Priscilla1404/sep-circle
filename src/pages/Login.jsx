import { useState } from 'react';
import { useAppStore } from '../App';

export default function Login() {
  const { store: s } = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await s.loginWithEmail(email, password);
    if (!result.success) {
      setError(result.error);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <span className="logo-mark large">SC</span>
          <h1>SEP Circle</h1>
          <p className="login-subtitle">A private space for Stanford SEP Flex 2025-2026</p>
        </div>
        <div className="login-divider" />
        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-label">
            Stanford Alumni Email
            <input
              type="email"
              placeholder="yourname@alumni.gsb.stanford.edu"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="login-input"
            />
          </label>
          <label className="login-label">
            Password
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="login-input"
            />
          </label>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="btn-primary login-submit">Sign In</button>
        </form>
        <p className="login-note">Access is exclusive to SEP Flex 2025-2026 participants.<br />Contact your cohort admin if you need access.</p>
      </div>
    </div>
  );
}
