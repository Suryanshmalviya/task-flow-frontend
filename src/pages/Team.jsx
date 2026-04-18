import React, { useState, useEffect } from 'react';
import api from '../utils/api';

export default function Team() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/team').then(r => { setMembers(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = members.filter(m => !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.email?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="topbar">
        <div className="topbar-left"><h1>Team</h1><p>{members.length} members</p></div>
        <div className="topbar-right">
          <input className="input" style={{ width: 200 }} placeholder="Search members..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? <div style={{ display:'flex',justifyContent:'center',padding:60 }}><div className="spinner"/></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          {filtered.map(m => (
            <div key={m._id} className="card card-clickable" style={{ cursor: 'pointer' }} onClick={() => setSelected(m === selected ? null : m)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <div className="avatar avatar-lg" style={{ background: m.avatarColor || '#7c5cfc' }}>{m.initials || m.name?.[0]}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14.5 }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{m.role || 'Member'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{m.email}</div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.isOnline ? 'var(--accent-green)' : 'var(--text-muted)' }} />
                </div>
              </div>
              {m.department && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>📁 {m.department}</div>}
              {m.bio && <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>{m.bio}</div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--card-border)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>{m.activeTaskCount || 0}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Active tasks</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--accent-green)' }}>{m.isOnline ? 'Online' : 'Offline'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Status</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>{new Date(m.createdAt).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Joined</div>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="empty-state" style={{ gridColumn: '1/-1' }}>
              <div className="empty-title">No team members found</div>
              <div className="empty-text">Members appear here once they register</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
