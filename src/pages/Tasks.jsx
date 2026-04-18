import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import TaskModal from '../components/TaskModal';
import TaskContextMenu from '../components/TaskContextMenu';
import { useToast } from '../context/ToastContext';
import { format } from 'date-fns';

const STATUSES = ['todo','in-progress','in-review','done'];
const STATUS_LABEL = { 'todo':'To Do','in-progress':'In Progress','in-review':'In Review','done':'Done' };
const STATUS_COL = { 'todo':'#8b8a9e','in-progress':'#4199e1','in-review':'#f5a623','done':'#22d98a' };
const PRIORITY_COL = { low:'#22d98a',medium:'#f5a623',high:'#f07060',critical:'#ff2d55' };
const CAT_COL = { Design:'#7c5cfc',Development:'#4199e1',QA:'#22d98a',PM:'#f5a623',Research:'#f07060',Other:'#8b8a9e' };

export default function Tasks() {
  const { addToast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [filters, setFilters] = useState({ status: '', priority: '', category: '', search: '' });
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [ctxMenu, setCtxMenu] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [sortField, setSortField] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 100, sort: `${sortDir === 'desc' ? '-' : ''}${sortField}` });
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.category) params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);
      const r = await api.get(`/tasks?${params}`);
      setTasks(r.data.tasks || []);
    } catch { addToast('Failed to load tasks', 'error'); }
    finally { setLoading(false); }
  }, [filters, sortField, sortDir]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleDelete = async (task) => {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    await api.delete(`/tasks/${task._id}`);
    setTasks(ts => ts.filter(t => t._id !== task._id));
    addToast('Task deleted', 'success');
  };

  const handleArchive = async (task) => {
    await api.patch(`/tasks/${task._id}/archive`);
    setTasks(ts => ts.filter(t => t._id !== task._id));
    addToast('Task archived', 'success');
  };

  const handleDuplicate = async (task) => {
    const r = await api.post(`/tasks/${task._id}/duplicate`);
    setTasks(ts => [r.data, ...ts]);
    addToast('Duplicated', 'success');
  };

  const handleStatusChange = async (task, status) => {
    const r = await api.put(`/tasks/${task._id}`, { status });
    setTasks(ts => ts.map(t => t._id === task._id ? r.data : t));
    addToast('Status updated', 'success');
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selected.size} tasks?`)) return;
    await Promise.all([...selected].map(id => api.delete(`/tasks/${id}`)));
    setTasks(ts => ts.filter(t => !selected.has(t._id)));
    setSelected(new Set());
    addToast(`${selected.size} tasks deleted`, 'success');
  };

  const handleBulkStatus = async (status) => {
    await api.patch('/tasks/bulk/update', { ids: [...selected], updates: { status } });
    setTasks(ts => ts.map(t => selected.has(t._id) ? { ...t, status } : t));
    setSelected(new Set());
    addToast('Tasks updated', 'success');
  };

  const toggleSelect = (id) => {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }) => sortField !== field ? null : (
    <span style={{ marginLeft: 4, opacity: 0.5 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
  );

  const tasksByStatus = STATUSES.reduce((acc, s) => {
    acc[s] = tasks.filter(t => t.status === s);
    return acc;
  }, {});

  return (
    <div>
      <div className="topbar">
        <div className="topbar-left">
          <h1>My Tasks</h1>
          <p>{tasks.length} tasks · {tasks.filter(t => t.status === 'done').length} completed</p>
        </div>
        <div className="topbar-right">
          {selected.size > 0 && (
            <>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{selected.size} selected</span>
              <select className="input" style={{ width: 140, padding: '7px 10px' }} onChange={e => { if (e.target.value) handleBulkStatus(e.target.value); e.target.value = ''; }} defaultValue="">
                <option value="" disabled>Change status</option>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
              <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}>Delete selected</button>
            </>
          )}
          <div className="tab-bar">
            {['list','kanban'].map(v => <div key={v} className={`tab${view===v?' active':''}`} onClick={() => setView(v)}>{v.charAt(0).toUpperCase()+v.slice(1)}</div>)}
          </div>
          <button className="btn btn-primary" onClick={() => { setEditTask(null); setShowModal(true); }}>
            + New task
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input className="input" style={{ width: 220 }} placeholder="Search tasks..." value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
        {[
          { key: 'status', options: STATUSES, label: 'All Status', labelMap: STATUS_LABEL },
          { key: 'priority', options: ['low','medium','high','critical'], label: 'All Priority' },
          { key: 'category', options: ['Design','Development','QA','PM','Research','Other'], label: 'All Category' },
        ].map(({ key, options, label, labelMap }) => (
          <select key={key} className="input" style={{ width: 140 }} value={filters[key]} onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))}>
            <option value="">{label}</option>
            {options.map(o => <option key={o} value={o}>{labelMap ? labelMap[o] : o.charAt(0).toUpperCase()+o.slice(1)}</option>)}
          </select>
        ))}
        {Object.values(filters).some(Boolean) && (
          <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ status:'',priority:'',category:'',search:'' })}>Clear filters</button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
      ) : view === 'list' ? (
        /* List view */
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 36 }}><input type="checkbox" onChange={e => setSelected(e.target.checked ? new Set(tasks.map(t => t._id)) : new Set())} /></th>
                  <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('title')}>Title <SortIcon field="title" /></th>
                  <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('status')}>Status <SortIcon field="status" /></th>
                  <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('priority')}>Priority <SortIcon field="priority" /></th>
                  <th>Category</th>
                  <th>Assignee</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('dueDate')}>Due <SortIcon field="dueDate" /></th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No tasks found. Create one!</td></tr>
                ) : tasks.map(task => (
                  <tr key={task._id} onContextMenu={e => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, task }); }}
                    style={{ background: selected.has(task._id) ? 'rgba(124,92,252,0.05)' : undefined }}>
                    <td onClick={e => e.stopPropagation()}><input type="checkbox" checked={selected.has(task._id)} onChange={() => toggleSelect(task._id)} /></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div onClick={() => handleStatusChange(task, task.status === 'done' ? 'todo' : 'done')}
                          style={{ width: 15, height: 15, borderRadius: 4, border: `1.5px solid ${task.status === 'done' ? '#22d98a' : 'rgba(255,255,255,0.2)'}`, background: task.status === 'done' ? '#22d98a' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {task.status === 'done' && <svg width="9" height="9" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                        </div>
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)', cursor: 'pointer', textDecoration: task.status === 'done' ? 'line-through' : 'none', opacity: task.status === 'done' ? 0.5 : 1 }}
                          onClick={() => { setEditTask(task); setShowModal(true); }}>{task.title}</span>
                      </div>
                    </td>
                    <td><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: STATUS_COL[task.status] + '22', color: STATUS_COL[task.status], fontWeight: 500 }}>{STATUS_LABEL[task.status]}</span></td>
                    <td><div style={{ display: 'flex', alignItems: 'center', gap: 5 }}><div style={{ width: 7, height: 7, borderRadius: '50%', background: PRIORITY_COL[task.priority] }} /><span style={{ fontSize: 12, color: PRIORITY_COL[task.priority] }}>{task.priority}</span></div></td>
                    <td><span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 20, background: (CAT_COL[task.category]||'#8b8a9e') + '22', color: CAT_COL[task.category]||'#8b8a9e', fontWeight: 500 }}>{task.category}</span></td>
                    <td>{task.assignee ? <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div className="avatar avatar-sm" style={{ background: task.assignee.avatarColor || '#7c5cfc' }}>{task.assignee.initials || '?'}</div><span style={{ fontSize: 12 }}>{task.assignee.name}</span></div> : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}</td>
                    <td><span style={{ fontSize: 12, color: task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done' ? 'var(--accent-coral)' : 'var(--text-secondary)' }}>{task.dueDate ? format(new Date(task.dueDate), 'MMM d') : '—'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-sm btn-icon" title="Edit" onClick={() => { setEditTask(task); setShowModal(true); }}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M8 2l2 2-6 6H2V8L8 2z"/></svg>
                        </button>
                        <button className="btn btn-ghost btn-sm btn-icon" title="Duplicate" onClick={() => handleDuplicate(task)}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="4" y="4" width="7" height="7" rx="1"/><path d="M1 8V2a1 1 0 0 1 1-1h6"/></svg>
                        </button>
                        <button className="btn btn-danger btn-sm btn-icon" title="Delete" onClick={() => handleDelete(task)}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M2 3h8l-.8 7H2.8L2 3zM1 1.5h10M4.5 1.5v-1h3v1"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Kanban view */
        <div className="kanban-board">
          {STATUSES.map(status => (
            <div key={status} className="kanban-col">
              <div className="kanban-col-header">
                <div className="kanban-col-title">
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COL[status] }} />
                  {STATUS_LABEL[status]}
                </div>
                <span className="kanban-count">{tasksByStatus[status].length}</span>
              </div>
              {tasksByStatus[status].map(task => (
                <div key={task._id} className="k-card"
                  onClick={() => { setEditTask(task); setShowModal(true); }}
                  onContextMenu={e => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, task }); }}>
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: (CAT_COL[task.category]||'#8b8a9e') + '22', color: CAT_COL[task.category]||'#8b8a9e', fontWeight: 500 }}>{task.category}</span>
                  </div>
                  <div className="k-card-title">{task.title}</div>
                  <div className="k-card-footer">
                    <div className="k-card-meta">
                      {task.assignee && <div className="avatar avatar-sm" style={{ background: task.assignee.avatarColor || '#7c5cfc' }}>{task.assignee.initials || '?'}</div>}
                      {task.dueDate && <span style={{ fontSize: 11, color: new Date(task.dueDate) < new Date() && status !== 'done' ? 'var(--accent-coral)' : 'var(--text-muted)' }}>{format(new Date(task.dueDate), 'MMM d')}</span>}
                    </div>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: PRIORITY_COL[task.priority] || '#8b8a9e' }} />
                  </div>
                </div>
              ))}
              <button className="add-col-btn" onClick={() => { setEditTask({ status }); setShowModal(true); }}>+ Add task</button>
            </div>
          ))}
        </div>
      )}

      {showModal && <TaskModal task={editTask} onClose={() => { setShowModal(false); setEditTask(null); }} onSaved={fetchTasks} />}
      {ctxMenu && (
        <TaskContextMenu x={ctxMenu.x} y={ctxMenu.y} task={ctxMenu.task}
          onClose={() => setCtxMenu(null)}
          onEdit={t => { setEditTask(t); setShowModal(true); }}
          onDelete={handleDelete}
          onArchive={handleArchive}
          onDuplicate={handleDuplicate}
          onChangeStatus={handleStatusChange}
        />
      )}
    </div>
  );
}
