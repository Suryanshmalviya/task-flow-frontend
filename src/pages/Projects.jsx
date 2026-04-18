import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';

const STATUS_STYLE = {
  active: { bg: 'rgba(34,217,138,0.12)', color: '#22d98a', label: 'Active' },
  'in-review': { bg: 'rgba(65,153,225,0.12)', color: '#4199e1', label: 'In Review' },
  'on-hold': { bg: 'rgba(245,166,35,0.12)', color: '#f5a623', label: 'On Hold' },
  completed: { bg: 'rgba(124,92,252,0.12)', color: '#7c5cfc', label: 'Completed' },
  archived: { bg: 'rgba(255,255,255,0.06)', color: '#8b8a9e', label: 'Archived' },
};
const PROJECT_COLORS = ['#7c5cfc','#4199e1','#22d98a','#f5a623','#f07060','#a78bfa'];

export default function Projects() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [ctxMenu, setCtxMenu] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', status: 'active', color: '#7c5cfc', dueDate: '', priority: 'medium' });
  const [search, setSearch] = useState('');

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const r = await api.get('/projects');
      setProjects(r.data);
    } catch { addToast('Failed to load projects', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async () => {
    if (!form.name.trim()) return addToast('Project name is required', 'error');
    try {
      await api.post('/projects', form);
      addToast('Project created', 'success');
      setShowForm(false);
      setForm({ name: '', description: '', status: 'active', color: '#7c5cfc', dueDate: '', priority: 'medium' });
      fetchProjects();
    } catch (e) { addToast(e.response?.data?.message || 'Error', 'error'); }
  };

  const handleArchive = async (id) => {
    await api.delete(`/projects/${id}`);
    addToast('Project archived', 'success');
    fetchProjects();
  };

  const filtered = projects.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div onClick={() => setCtxMenu(null)}>
      <div className="topbar">
        <div className="topbar-left">
          <h1>Projects</h1>
          <p>{projects.length} projects · {projects.filter(p => p.status === 'active').length} active</p>
        </div>
        <div className="topbar-right">
          <input className="input" style={{ width: 200 }} placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} />
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ New project</button>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">New Project</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <div className="form-group"><label className="input-label">Name *</label><input className="input" placeholder="Project name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="form-group"><label className="input-label">Description</label><textarea className="input" rows={3} placeholder="What's this project about?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ resize: 'vertical' }} /></div>
            <div className="form-grid" style={{ marginBottom: 14 }}>
              <div className="form-group"><label className="input-label">Status</label>
                <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="active">Active</option><option value="in-review">In Review</option><option value="on-hold">On Hold</option>
                </select>
              </div>
              <div className="form-group"><label className="input-label">Priority</label>
                <select className="input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                </select>
              </div>
              <div className="form-group"><label className="input-label">Due Date</label><input className="input" type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} /></div>
              <div className="form-group"><label className="input-label">Color</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 4 }}>
                  {PROJECT_COLORS.map(c => (
                    <div key={c} onClick={() => setForm(f => ({ ...f, color: c }))} style={{ width: 24, height: 24, borderRadius: '50%', background: c, cursor: 'pointer', border: form.color === c ? '2px solid #fff' : '2px solid transparent', transition: 'border 0.15s' }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate}>Create project</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5"><rect x="2" y="3" width="20" height="16" rx="2"/><path d="M8 3V1M16 3V1M2 9h20"/></svg></div>
          <div className="empty-title">No projects yet</div>
          <div className="empty-text">Create your first project to start organizing work</div>
          <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => setShowForm(true)}>+ Create project</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {filtered.map(p => {
            const ss = STATUS_STYLE[p.status] || STATUS_STYLE.active;
            return (
              <div key={p._id} className="card card-clickable"
                onClick={() => navigate(`/projects/${p._id}`)}
                onContextMenu={e => { e.preventDefault(); e.stopPropagation(); setCtxMenu({ x: e.clientX, y: e.clientY, project: p }); }}
                style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: p.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: p.color }} />
                  </div>
                  <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: ss.bg, color: ss.color, fontWeight: 500 }}>{ss.label}</span>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14.5, marginBottom: 4 }}>{p.name}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{p.description || 'No description'}</div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Progress</span>
                    <span style={{ fontWeight: 500, color: p.color }}>{p.progress || 0}%</span>
                  </div>
                  <div className="progress-bar"><div className="progress-fill" style={{ width: `${p.progress || 0}%`, background: p.color }} /></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex' }}>
                    {(p.members || []).slice(0, 3).map((m, i) => (
                      <div key={m._id || i} className="avatar avatar-sm" style={{ background: m.avatarColor || '#7c5cfc', marginLeft: i > 0 ? -6 : 0, border: '2px solid var(--card-bg)' }}>{m.initials || '?'}</div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{p.taskCount || 0} tasks</span>
                    {p.dueDate && <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{new Date(p.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Context menu */}
      {ctxMenu && (
        <div className="ctx-menu" style={{ top: ctxMenu.y, left: ctxMenu.x }}>
          <div className="ctx-item" onClick={() => { navigate(`/projects/${ctxMenu.project._id}`); setCtxMenu(null); }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="1" y="1" width="11" height="11" rx="2"/><path d="M4 6.5h5M6.5 4v5"/></svg>
            Open project
          </div>
          <div className="ctx-item danger" onClick={() => { handleArchive(ctxMenu.project._id); setCtxMenu(null); }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M2 4h9v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4zM1 2h11M5 6h3"/></svg>
            Archive project
          </div>
        </div>
      )}
    </div>
  );
}
