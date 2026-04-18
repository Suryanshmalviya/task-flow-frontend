import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'At least 6 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const r = await api.post(`/auth/reset-password/${token}`, { password: form.password });
      if (r.data.token) {
        localStorage.setItem('tf_token', r.data.token);
        localStorage.setItem('tf_user', JSON.stringify(r.data.user));
        updateUser(r.data.user);
      }
      setDone(true);
      setTimeout(() => navigate('/'), 2500);
    } catch (err) {
      setErrors({ password: err.response?.data?.message || 'Reset link is invalid or expired' });
    } finally {
      setLoading(false);
    }
  };

  const strength = form.password.length === 0 ? 0 : form.password.length < 6 ? 1 : form.password.length < 10 ? 2 : 3;
  const strengthColor = ['transparent', '#f07060', '#f5a623', '#22d98a'][strength];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', padding: 20 }}>
      <div style={{ position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 400, background: 'radial-gradient(ellipse at center, rgba(124,92,252,0.10) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1, animation: 'slideUp 0.3s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#7c5cfc', boxShadow: '0 0 16px #7c5cfc' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700 }}>TaskFlow</span>
          </div>
        </div>

        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 18, padding: '32px 28px' }}>
          {!done ? (
            <>
              <div style={{ marginBottom: 24 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(124,92,252,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#7c5cfc" strokeWidth="1.5">
                    <rect x="5" y="10" width="12" height="10" rx="2"/>
                    <path d="M8 10V7a3 3 0 0 1 6 0v3"/>
                  </svg>
                </div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Set new password</h2>
                <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>Choose a strong password. It must be at least 6 characters.</p>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 14 }}>
                  <label className="input-label">New password</label>
                  <div style={{ position: 'relative', marginTop: 6 }}>
                    <input className={`input${errors.password ? ' input-error' : ''}`} type={showPass ? 'text' : 'password'}
                      placeholder="At least 6 characters" value={form.password} onChange={e => set('password', e.target.value)} autoComplete="new-password" style={{ paddingRight: 40 }} />
                    <div onClick={() => setShowPass(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13 }}>{showPass ? '🙈' : '👁'}</div>
                  </div>
                  {form.password.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, marginTop: 6, alignItems: 'center' }}>
                      {[1, 2, 3].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength ? strengthColor : 'rgba(255,255,255,0.08)', transition: 'background 0.2s' }} />)}
                      <span style={{ fontSize: 11, color: strengthColor, marginLeft: 6 }}>{['','Weak','Good','Strong'][strength]}</span>
                    </div>
                  )}
                  {errors.password && <span className="error-msg" style={{ display: 'block', marginTop: 4 }}>{errors.password}</span>}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <label className="input-label">Confirm new password</label>
                  <input className={`input${errors.confirm ? ' input-error' : ''}`} type={showPass ? 'text' : 'password'}
                    placeholder="Repeat your password" value={form.confirm} onChange={e => set('confirm', e.target.value)} autoComplete="new-password" style={{ marginTop: 6 }} />
                  {errors.confirm && <span className="error-msg" style={{ display: 'block', marginTop: 4 }}>{errors.confirm}</span>}
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px', marginTop: 20, fontSize: 14 }} disabled={loading}>
                  {loading ? <div className="spinner" style={{ width: 16, height: 16 }} /> : 'Reset password'}
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
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 700, marginBottom: 10 }}>Password reset!</h2>
              <p style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>Your password has been changed. Redirecting you to the dashboard…</p>
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
