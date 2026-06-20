import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login({ navigateTo }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return setError('Please enter both email and password.');
    }

    try {
      setError('');
      setLoading(true);
      const res = await login(email, password);
      if (res.user.role === 'admin') {
        navigateTo('admin-dashboard');
      } else {
        navigateTo('dashboard');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutofillAdmin = () => {
    setEmail('admin@volunteer.com');
    setPassword('admin123');
  };

  return (
    <div className="auth-container">
      <div className="glass-card auth-card">
        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '1.75rem' }}>Welcome Back</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Log in to manage your volunteer shifts & profile
        </p>

        {error && (
          <div className="alert alert-danger" style={{ padding: '0.75rem', fontSize: '0.85rem' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. name@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '0.75rem' }}>
            Quick Sandbox Testing Tools:
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={handleAutofillAdmin}
              className="btn btn-outline btn-sm"
              style={{ fontSize: '0.8rem', width: '100%' }}
            >
              🔑 Autofill Admin Demo Account
            </button>
          </div>
        </div>

        <div className="auth-footer">
          Don't have an account?{' '}
          <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('register'); }}>
            Register Now
          </a>
        </div>
      </div>
    </div>
  );
}
