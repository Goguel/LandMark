import React, { useState, useEffect } from 'react';
import { login, register } from '../../services/authApi';
import './AuthModal.css';

export function AuthModal({ isOpen, onClose, onSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setName('');
      setEmail('');
      setPassword('');
      setLoading(false);
    }
  }, [isOpen, mode]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (mode === 'register' && !name.trim()) {
      setError('Full name is required for registration.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      let authData;
      if (mode === 'login') {
        authData = await login(email.trim(), password);
      } else {
        authData = await register(name.trim(), email.trim(), password);
      }
      onSuccess(authData);
      onClose();
    } catch (err) {
      if (err.status === 401) {
        setError('Invalid email or password.');
      } else if (err.status === 409) {
        setError('This email is already registered in the system.');
      } else {
        setError(err.message || 'An error occurred during authentication.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal-header">
          <div className="auth-modal-tabs">
            <button
              type="button"
              className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); setError(null); }}
              id="tab-login-btn"
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${mode === 'register' ? 'active' : ''}`}
              onClick={() => { setMode('register'); setError(null); }}
              id="tab-register-btn"
            >
              Create Account
            </button>
          </div>
          <button
            type="button"
            className="auth-modal-close-btn"
            onClick={onClose}
            aria-label="Close auth modal"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="auth-error-banner" role="alert">
            <span className="auth-error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-modal-form">
          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="auth-name-input">Full Name *</label>
              <input
                id="auth-name-input"
                type="text"
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                required
                autoFocus
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="auth-email-input">Email *</label>
            <input
              id="auth-email-input"
              type="email"
              placeholder="user@landmark.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              autoFocus={mode === 'login'}
            />
          </div>

          <div className="form-group">
            <label htmlFor="auth-password-input">Password * (minimum 6 characters)</label>
            <input
              id="auth-password-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {mode === 'login' && (
            <div className="demo-credentials-hint">
              <span className="demo-hint-label">💡 Demo Admin Account:</span>
              <button
                type="button"
                className="btn-demo-fill"
                onClick={() => {
                  setEmail('admin@landmark.com');
                  setPassword('Landmark@123');
                }}
                id="btn-fill-demo-admin"
              >
                Autofill admin@landmark.com
              </button>
            </div>
          )}

          <div className="auth-modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              id="auth-submit-btn"
            >
              {loading ? 'Processing...' : mode === 'login' ? 'Sign In to Account' : 'Register & Sign In'}
            </button>
          </div>
        </form>

        <div className="auth-modal-footer">
          {mode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                className="link-btn"
                onClick={() => setMode('register')}
              >
                Sign up for free
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                className="link-btn"
                onClick={() => setMode('login')}
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
