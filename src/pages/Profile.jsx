import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../utils/api';

const AVATAR_COLORS = ['#7c5cfc','#4199e1','#22d98a','#f5a623','#f07060','#a78bfa','#f472b6','#34d399'];
const ROLES = ['Admin', 'Manager', 'Member', 'Viewer'];

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const { addToast } = useToast();
  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    department: user?.department || '',
    role: user?.role || 'Member',
    avatarColor: user?.avatarColor || '#7c5cfc',
  });
  const [notifForm, setNotifForm] = useState({
    email: user?.notifications?.email ?? true,
    push: user?.notifications?.push ?? true,
    taskUpdates: user?.notifications?.taskUpdates ?? true,
    mentions: user?.notifications?.mentions ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const initials = form.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const handleSave = async () => {
    if (!form.name.trim()) return addToast('Name is required', 'error');
    setSaving(true);
    try {
      const r = await api.put('/profile', { ...form, notifications: notifForm });
      updateUser(r.data);
      addToast('Profile updated', 'success');
    } catch (e) {
      addToast(e.response?.data?.message || 'Error saving', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== user?.email) return addToast('Email does not match', 'error');
    try {
      await api.delete('/profile');
      addToast('Account deleted', 'info');
      logout();
    } catch {
      addToast('Failed to delete account', 'error');
    }
  };

  const Toggle = ({ checked, onChange, label, desc }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--card-border)' }}>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 500 }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{desc}</div>}
      </div>
      <div onClick={onChange} style={{ width: 40, height: 22, borderRadius: 11, background: checked ? '#7c5cfc' : 'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: 3, left: checked ? 20 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
      </div>
    </div>
  );

  return (
    <div>
      <div className="topbar">
        <div className="topbar-left">
          <h1>Profile</h1>
          <p>Manage your personal information and preferences</p>
        </div>
        <div className="topbar-right">
          <button className="btn btn-ghost" onClick={() => window.history.back()}>← Back</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <div className="spinner" style={{ width: 14, height: 14 }} /> : null}
            Save changes
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar" style={{ marginBottom: 24, width: 'fit-content' }}>
        {['profile', 'notifications', 'danger'].map(t => (
          <div key={t} className={`tab${activeTab === t ? ' active' : ''}`} onClick={() => setActiveTab(t)}>
            {t === 'danger' ? '⚠ Danger' : t.charAt(0).toUpperCase() + t.slice(1)}
          </div>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
          {/* Avatar */}
          <div className="card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div className="avatar avatar-xl" style={{ background: form.avatarColor, fontSize: 24 }}>{initials}</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>{form.name || 'Your Name'}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{form.role}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{user?.email}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>Avatar color</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                {AVATAR_COLORS.map(c => (
                  <div key={c} onClick={() => set('avatarColor', c)}
                    style={{ width: 26, height: 26, borderRadius: '50%', background: c, cursor: 'pointer', border: form.avatarColor === c ? '2.5px solid #fff' : '2px solid transparent', transition: 'border 0.15s', transform: form.avatarColor === c ? 'scale(1.15)' : 'scale(1)' }} />
                ))}
              </div>
            </div>
            {/* Password reset is NOT here — it's on the forgot password page */}
            <div style={{ width: '100%', paddingTop: 12, borderTop: '1px solid var(--card-border)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Need to change your password?</div>
              <Link to="/forgot-password" style={{ fontSize: 13, color: 'var(--accent-purple)', textDecoration: 'none', fontWeight: 500 }}>
                → Use forgot password
              </Link>
            </div>
          </div>

          {/* Form */}
          <div className="card">
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, fontFamily: 'var(--font-display)' }}>Personal information</div>
            <div className="form-group">
              <label className="input-label">Full name</label>
              <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Your full name" />
            </div>
            <div className="form-group">
              <label className="input-label">Email</label>
              <input className="input" value={user?.email || ''} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Email cannot be changed</span>
            </div>
            <div className="form-grid" style={{ marginBottom: 14 }}>
              <div className="form-group">
                <label className="input-label">Role</label>
                <select className="input" value={form.role} onChange={e => set('role', e.target.value)}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="input-label">Department</label>
                <input className="input" value={form.department} onChange={e => set('department', e.target.value)} placeholder="e.g. Engineering" />
              </div>
            </div>
            <div className="form-group">
              <label className="input-label">Bio</label>
              <textarea className="input" rows={4} value={form.bio} onChange={e => set('bio', e.target.value)} placeholder="Tell your team a bit about yourself..." style={{ resize: 'vertical' }} />
            </div>

            <div style={{ marginTop: 8, padding: '14px 16px', background: 'rgba(124,92,252,0.06)', borderRadius: 10, border: '1px solid rgba(124,92,252,0.15)' }}>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-primary)' }}>Member since</strong> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
                <span style={{ margin: '0 8px', color: 'var(--text-muted)' }}>·</span>
                <strong style={{ color: 'var(--text-primary)' }}>Last seen</strong> {user?.lastSeen ? new Date(user.lastSeen).toLocaleDateString() : 'Now'}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="card" style={{ maxWidth: 560 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, fontFamily: 'var(--font-display)' }}>Notification preferences</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>Choose what you want to be notified about</div>
          <Toggle checked={notifForm.email} onChange={() => setNotifForm(f => ({ ...f, email: !f.email }))} label="Email notifications" desc="Receive updates via email" />
          <Toggle checked={notifForm.push} onChange={() => setNotifForm(f => ({ ...f, push: !f.push }))} label="Push notifications" desc="Browser push notifications" />
          <Toggle checked={notifForm.taskUpdates} onChange={() => setNotifForm(f => ({ ...f, taskUpdates: !f.taskUpdates }))} label="Task updates" desc="When tasks you're assigned to are updated" />
          <Toggle checked={notifForm.mentions} onChange={() => setNotifForm(f => ({ ...f, mentions: !f.mentions }))} label="Mentions" desc="When someone mentions you in a comment" />
          <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={handleSave}>Save preferences</button>
        </div>
      )}

      {activeTab === 'danger' && (
        <div className="card" style={{ maxWidth: 560, border: '1px solid rgba(240,112,96,0.25)' }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, fontFamily: 'var(--font-display)', color: 'var(--accent-coral)' }}>Danger zone</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>These actions are permanent and cannot be undone</div>
          <div style={{ padding: '16px', background: 'rgba(240,112,96,0.06)', borderRadius: 10, border: '1px solid rgba(240,112,96,0.12)', marginBottom: 16 }}>
            <div style={{ fontWeight: 500, marginBottom: 6 }}>Delete account</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>Permanently delete your account and all associated data. This action cannot be reversed.</div>
            {!showDeleteConfirm ? (
              <button className="btn btn-danger" onClick={() => setShowDeleteConfirm(true)}>Delete my account</button>
            ) : (
              <div>
                <div style={{ fontSize: 13, color: 'var(--accent-coral)', marginBottom: 10 }}>Type your email <strong>{user?.email}</strong> to confirm:</div>
                <input className="input input-error" placeholder={user?.email} value={deleteInput} onChange={e => setDeleteInput(e.target.value)} style={{ marginBottom: 10 }} />
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-danger" onClick={handleDeleteAccount} disabled={deleteInput !== user?.email}>Confirm delete</button>
                  <button className="btn btn-ghost" onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
