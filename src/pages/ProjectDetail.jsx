import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import TaskModal from '../components/TaskModal';
import TaskContextMenu from '../components/TaskContextMenu';
import { useToast } from '../context/ToastContext';
import { format } from 'date-fns';

const COLS = [
  { key: 'todo', label: 'To Do', color: '#8b8a9e' },
  { key: 'in-progress', label: 'In Progress', color: '#4199e1' },
  { key: 'in-review', label: 'In Review', color: '#f5a623' },
  { key: 'done', label: 'Done', color: '#22d98a' },
];
const PRIORITY_COL = { low:'#22d98a',medium:'#f5a623',high:'#f07060',critical:'#ff2d55' };
const CAT_COL = { Design:'#7c5cfc',Development:'#4199e1',QA:'#22d98a',PM:'#f5a623',Research:'#f07060',Other:'#8b8a9e' };

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [project, setProject] = useState(null);
  const [columns, setColumns] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [ctxMenu, setCtxMenu] = useState(null);

  const fetchProject = async () => {
    setLoading(true);
    try {
      const [pR, kR] = await Promise.all([api.get(`/projects/${id}`), api.get(`/projects/${id}/kanban`)]);
      setProject(pR.data);
      const cols = {};
      (kR.data || []).forEach(c => { cols[c.status] = c.tasks; });
      setColumns(cols);
    } catch { addToast('Failed to load project', 'error'); navigate('/projects'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProject(); }, [id]);

  const handleStatusChange = async (task, status) => {
    await api.put(`/tasks/${task._id}`, { status });
    fetchProject();
    addToast('Status updated', 'success');
  };

  const handleDelete = async (task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    await api.delete(`/tasks/${task._id}`);
    fetchProject();
    addToast('Deleted', 'success');
  };

  const handleArchive = async (task) => {
    await api.patch(`/tasks/${task._id}/archive`);
    fetchProject();
    addToast('Archived', 'success');
  };

  const handleDuplicate = async (task) => {
    await api.post(`/tasks/${task._id}/duplicate`);
    fetchProject();
    addToast('Duplicated', 'success');
  };

  if (loading) return <div style={{ display:'flex',justifyContent:'center',padding:60 }}><div className="spinner"/></div>;
  if (!project) return null;

  const totalTasks = Object.values(columns).flat().length;
  const doneTasks = (columns['done'] || []).length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div onClick={() => setCtxMenu(null)}>
      <div className="topbar">
        <div className="topbar-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => navigate('/projects')}>Projects</span>
            <span style={{ color: 'var(--text-muted)' }}>/</span>
            <span style={{ fontSize: 13 }}>{project.name}</span>
          </div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: project.color || '#7c5cfc' }} />
            {project.name}
          </h1>
          <p>{project.description || 'No description'} · {totalTasks} tasks · {progress}% done</p>
        </div>
        <div className="topbar-right">
          {/* Members avatars */}
          <div style={{ display: 'flex' }}>
            {(project.members || []).slice(0, 4).map((m, i) => (
              <div key={m._id} title={m.name} className="avatar avatar-sm" style={{ background: m.avatarColor || '#7c5cfc', marginLeft: i > 0 ? -6 : 0, border: '2px solid var(--bg-main)' }}>{m.initials}</div>
            ))}
          </div>
          <button className="btn btn-primary" onClick={() => { setEditTask({ project: id, status: 'todo' }); setShowModal(true); }}>
            + Add task
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="card" style={{ marginBottom: 20, padding: '14px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Overall progress</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: project.color || '#7c5cfc' }}>{progress}%</span>
        </div>
        <div className="progress-bar" style={{ height: 6 }}>
          <div className="progress-fill" style={{ width: `${progress}%`, background: project.color || '#7c5cfc' }} />
        </div>
        <div style={{ display: 'flex', gap: 20, marginTop: 10 }}>
          {COLS.map(c => (
            <span key={c.key} style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              <span style={{ color: c.color, fontWeight: 500 }}>{(columns[c.key] || []).length}</span> {c.label}
            </span>
          ))}
        </div>
      </div>

      {/* Kanban */}
      <div className="kanban-board">
        {COLS.map(col => (
          <div key={col.key} className="kanban-col">
            <div className="kanban-col-header">
              <div className="kanban-col-title">
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                {col.label}
              </div>
              <span className="kanban-count">{(columns[col.key] || []).length}</span>
            </div>
            {(columns[col.key] || []).map(task => (
              <div key={task._id} className="k-card"
                onClick={() => { setEditTask(task); setShowModal(true); }}
                onContextMenu={e => { e.preventDefault(); e.stopPropagation(); setCtxMenu({ x: e.clientX, y: e.clientY, task }); }}>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: (CAT_COL[task.category]||'#8b8a9e') + '22', color: CAT_COL[task.category]||'#8b8a9e', fontWeight: 500 }}>{task.category}</span>
                </div>
                <div className="k-card-title">{task.title}</div>
                {task.subtasks?.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: 3, background: '#22d98a', width: `${Math.round((task.subtasks.filter(s=>s.done).length / task.subtasks.length) * 100)}%`, borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, display: 'block' }}>{task.subtasks.filter(s=>s.done).length}/{task.subtasks.length} subtasks</span>
                  </div>
                )}
                <div className="k-card-footer">
                  <div className="k-card-meta">
                    {task.assignee && <div className="avatar avatar-sm" title={task.assignee.name} style={{ background: task.assignee.avatarColor || '#7c5cfc' }}>{task.assignee.initials}</div>}
                    {task.dueDate && <span style={{ fontSize: 11, color: new Date(task.dueDate) < new Date() && col.key !== 'done' ? 'var(--accent-coral)' : 'var(--text-muted)' }}>{format(new Date(task.dueDate), 'MMM d')}</span>}
                  </div>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: PRIORITY_COL[task.priority] || '#8b8a9e' }} />
                </div>
              </div>
            ))}
            <button className="add-col-btn" onClick={() => { setEditTask({ project: id, status: col.key }); setShowModal(true); }}>+ Add task</button>
          </div>
        ))}
      </div>

      {showModal && <TaskModal task={editTask} projectId={id} onClose={() => { setShowModal(false); setEditTask(null); }} onSaved={fetchProject} />}
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
