import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useToast } from '../context/ToastContext';

const CATEGORIES = ['Design', 'Development', 'QA', 'PM', 'Research', 'Other'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const STATUSES = ['todo', 'in-progress', 'in-review', 'done'];

export default function TaskModal({ task, projectId, onClose, onSaved }) {
  const { addToast } = useToast();
const initialForm = {
    title: '', description: '', status: 'todo', priority: 'medium',
    category: 'Other', estimatedHours: '',
    ...task,
    dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : '',
    tags: Array.isArray(task?.tags) ? task.tags.join(', ') : '',
    assignee: task?.assignee?._id || task?.assignee || ''
  };
  const [form, setForm] = useState(initialForm);
  const [teamMembers, setTeamMembers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [subtasks, setSubtasks] = useState(task?.subtasks || []);
  const [newSubtask, setNewSubtask] = useState('');
  const [comments, setComments] = useState(task?.comments || []);
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    api.get('/team').then(r => setTeamMembers(r.data)).catch(() => {});
    api.get('/projects').then(r => setProjects(r.data)).catch(() => {});
    if (task?._id) {
      api.get(`/tasks/${task._id}`).then(r => {
        setSubtasks(r.data.subtasks || []);
        setComments(r.data.comments || []);
      }).catch(() => {});
    }
  }, [task?._id]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim()) return addToast('Title is required', 'error');
    setLoading(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        dueDate: form.dueDate || undefined,
        estimatedHours: form.estimatedHours || 0,
        project: form.project || projectId || undefined,
        assignee: form.assignee || undefined
      };
      let saved;
      if (task?._id) {
        const r = await api.put(`/tasks/${task._id}`, payload);
        saved = r.data;
        addToast('Task updated', 'success');
      } else {
        const r = await api.post('/tasks', payload);
        saved = r.data;
        addToast('Task created', 'success');
      }
      onSaved?.(saved);
      onClose();
    } catch (e) {
      addToast(e.response?.data?.message || 'Error saving task', 'error');
    } finally {
      setLoading(false);
    }
  };

  const addSubtask = async () => {
    if (!newSubtask.trim() || !task?._id) return;
    const r = await api.post(`/tasks/${task._id}/subtasks`, { title: newSubtask });
    setSubtasks(s => [...s, r.data]);
    setNewSubtask('');
  };

  const toggleSubtask = async (subtaskId) => {
    const r = await api.patch(`/tasks/${task._id}/subtasks/${subtaskId}`);
    setSubtasks(s => s.map(st => st._id === subtaskId ? { ...st, done: r.data.done } : st));
  };

  const addComment = async () => {
    if (!newComment.trim() || !task?._id) return;
    const r = await api.post(`/tasks/${task._id}/comments`, { text: newComment });
    setComments(c => [...c, r.data]);
    setNewComment('');
  };

  const deleteComment = async (commentId) => {
    await api.delete(`/tasks/${task._id}/comments/${commentId}`);
    setComments(c => c.filter(x => x._id !== commentId));
  };

  const pilotCols = {
    todo: '#8b8a9e', 'in-progress': '#4199e1', 'in-review': '#f5a623', done: '#22d98a'
  };
  const priorityCols = { low: '#22d98a', medium: '#f5a623', high: '#f07060', critical: '#ff2d55' };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-wide">
        <div className="modal-header">
          <h2 className="modal-title">{task?._id ? 'Edit Task' : 'New Task'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Tabs (only for existing tasks) */}
        {task?._id && (
          <div className="tab-bar" style={{ marginBottom: 20 }}>
            {['details', 'subtasks', 'comments'].map(t => (
              <div key={t} className={`tab${activeTab === t ? ' active' : ''}`} onClick={() => setActiveTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
                {t === 'subtasks' && subtasks.length > 0 && <span style={{ marginLeft: 4, opacity: 0.7 }}>({subtasks.length})</span>}
                {t === 'comments' && comments.length > 0 && <span style={{ marginLeft: 4, opacity: 0.7 }}>({comments.length})</span>}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'details' && (
          <div>
            <div className="form-group full">
              <label className="input-label">Title *</label>
              <input className="input" placeholder="Task title..." value={form.title} onChange={e => set('title', e.target.value)} />
            </div>
            <div className="form-group full">
              <label className="input-label">Description</label>
              <textarea className="input" rows={3} placeholder="Describe the task..." value={form.description} onChange={e => set('description', e.target.value)} style={{ resize: 'vertical' }} />
            </div>
            <div className="form-grid" style={{ marginBottom: 14 }}>
              <div className="form-group">
                <label className="input-label">Status</label>
                <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                  {STATUSES.map(s => <option key={s} value={s}>{s.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="input-label">Priority</label>
                <select className="input" value={form.priority} onChange={e => set('priority', e.target.value)}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="input-label">Category</label>
                <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="input-label">Assignee</label>
                <select className="input" value={form.assignee} onChange={e => set('assignee', e.target.value)}>
                  <option value="">Unassigned</option>
                  {teamMembers.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="input-label">Due Date</label>
                <input className="input" type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="input-label">Est. Hours</label>
                <input className="input" type="number" min="0" placeholder="0" value={form.estimatedHours} onChange={e => set('estimatedHours', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="input-label">Project</label>
                <select className="input" value={form.project || projectId || ''} onChange={e => set('project', e.target.value)}>
                  <option value="">No project</option>
                  {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="input-label">Tags (comma separated)</label>
                <input className="input" placeholder="e.g. frontend, urgent" value={form.tags} onChange={e => set('tags', e.target.value)} />
              </div>
            </div>

            {/* Status / priority visual indicators */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
              <span className="pill" style={{ background: pilotCols[form.status] + '22', color: pilotCols[form.status] }}>
                ● {form.status.replace('-',' ')}
              </span>
              <span className="pill" style={{ background: priorityCols[form.priority] + '22', color: priorityCols[form.priority] }}>
                ↑ {form.priority}
              </span>
            </div>
          </div>
        )}

        {activeTab === 'subtasks' && task?._id && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {subtasks.map(st => (
                <div key={st._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid var(--card-border)' }}>
                  <div onClick={() => toggleSubtask(st._id)} style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${st.done ? '#22d98a' : 'rgba(255,255,255,0.2)'}`, background: st.done ? '#22d98a' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {st.done && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                  </div>
                  <span style={{ fontSize: 13, color: st.done ? 'var(--text-muted)' : 'var(--text-secondary)', textDecoration: st.done ? 'line-through' : 'none', flex: 1 }}>{st.title}</span>
                </div>
              ))}
              {subtasks.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: 12, textAlign: 'center' }}>No subtasks yet</div>}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="input" placeholder="Add a subtask..." value={newSubtask} onChange={e => setNewSubtask(e.target.value)} onKeyDown={e => e.key === 'Enter' && addSubtask()} />
              <button className="btn btn-primary" onClick={addSubtask}>Add</button>
            </div>
          </div>
        )}

        {activeTab === 'comments' && task?._id && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16, maxHeight: 280, overflowY: 'auto' }}>
              {comments.map(c => (
                <div key={c._id} style={{ display: 'flex', gap: 10 }}>
                  <div className="avatar avatar-sm" style={{ background: c.user?.avatarColor || '#7c5cfc', flexShrink: 0 }}>{c.user?.initials || '?'}</div>
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--card-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{c.user?.name || 'User'}</span>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(c.createdAt).toLocaleDateString()}</span>
                        <span style={{ fontSize: 11, color: 'var(--accent-coral)', cursor: 'pointer' }} onClick={() => deleteComment(c._id)}>Delete</span>
                      </div>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{c.text}</p>
                  </div>
                </div>
              ))}
              {comments.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: 12, textAlign: 'center' }}>No comments yet</div>}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="input" placeholder="Write a comment..." value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && addComment()} />
              <button className="btn btn-primary" onClick={addComment}>Post</button>
            </div>
          </div>
        )}

        {(activeTab === 'details' || !task?._id) && (
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
              {loading ? <div className="spinner" style={{ width: 14, height: 14 }} /> : null}
              {task?._id ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
