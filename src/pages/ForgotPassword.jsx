import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devUrl, setDevUrl] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return setError('Email is required');
    if (!/\S+@\S+\.\S+/.test(email)) return setError('Enter a valid email');
    setLoading(true);
    setError('');
    try {
      const r = await api.post('/auth/forgot-password', { email });
      setSent(true);
      if (r.data.devResetUrl) setDevUrl(r.data.devResetUrl);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', padding: 20 }}>
      <div style={{ position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 400, background: 'radial-gradient(ellipse at center, rgba(124,92,252,0.10) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1, animation: 'slideUp 0.3s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#7c5cfc', boxShadow: '0 0 16px #7c5cfc' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700 }}>TaskFlow</span>
          </div>
        </div>

        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 18, padding: '32px 28px' }}>
          {!sent ? (
            <>
              <div style={{ marginBottom: 24 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(124,92,252,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#7c5cfc" strokeWidth="1.5">
                    <rect x="2" y="6" width="18" height="13" rx="2"/>
                    <path d="M2 9l9 6 9-6"/>
                  </svg>
                </div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Forgot your password?</h2>
                <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>No problem. Enter the email address associated with your account and we'll send you a reset link.</p>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 16 }}>
                  <label className="input-label">Email address</label>
                  <input className={`input${error ? ' input-error' : ''}`} type="email" placeholder="you@example.com"
                    value={email} onChange={e => { setEmail(e.target.value); setError(''); }} autoComplete="email" style={{ marginTop: 6 }} />
                  {error && <span className="error-msg" style={{ marginTop: 4, display: 'block' }}>{error}</span>}
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: 14 }} disabled={loading}>
                  {loading ? <div className="spinner" style={{ width: 16, height: 16 }} /> : 'Send reset link'}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(34,217,138,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid rgba(34,217,138,0.2)' }}>
                <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="#22d98a" strokeWidth="2">
                  <path d="M4 13l6 6 12-12" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 700, marginBottom: 10 }}>Check your inbox</h2>
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
                If <strong style={{ color: 'var(--text-primary)' }}>{email}</strong> is registered, you'll receive a reset link within a few minutes. Check your spam folder too.
              </p>
              {devUrl && (
                <div style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.2)', borderRadius: 10, padding: 14, marginBottom: 16, textAlign: 'left' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#f5a623', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dev mode — reset URL</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', wordBreak: 'break-all', fontFamily: 'var(--font-mono)' }}>{devUrl}</div>
                  <Link to={devUrl.replace(window.location.origin, '')} style={{ fontSize: 12, color: 'var(--accent-purple)', textDecoration: 'none', display: 'block', marginTop: 8 }}>Use this link →</Link>
                </div>
              )}
              <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={() => { setSent(false); setEmail(''); setDevUrl(''); }}>
                Try a different email
              </button>
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
            <Link to="/login" style={{ color: 'var(--accent-purple)', textDecoration: 'none', fontWeight: 500 }}>← Back to sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
