import React, { useState, useEffect } from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import TaskModal from '../components/TaskModal';
import TaskContextMenu from '../components/TaskContextMenu';
import { useToast } from '../context/ToastContext';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const greet = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

export default function Dashboard() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 124, done: 87, inProgress: 28, overdue: 9, byCategory: [] });
  const [tasks, setTasks] = useState([]);
  const [activity, setActivity] = useState([]);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [ctxMenu, setCtxMenu] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsR, tasksR, actR, teamR] = await Promise.all([
        api.get('/tasks/stats/summary'),
        api.get('/tasks?limit=6&sort=-createdAt'),
        api.get('/activity?limit=4'),
        api.get('/team')
      ]);
      setStats(statsR.data);
      setTasks(tasksR.data.tasks || []);
      setActivity(actR.data || []);
      setTeam((teamR.data || []).slice(0, 5));
    } catch {
      // Use demo data on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const toggleTask = async (task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    await api.put(`/tasks/${task._id}`, { status: newStatus });
    setTasks(ts => ts.map(t => t._id === task._id ? { ...t, status: newStatus } : t));
  };

  const handleDelete = async (task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
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
    addToast('Task duplicated', 'success');
  };

  const handleStatusChange = async (task, status) => {
    await api.put(`/tasks/${task._id}`, { status });
    setTasks(ts => ts.map(t => t._id === task._id ? { ...t, status } : t));
    addToast('Status updated', 'success');
  };

  const catColors = ['#7c5cfc', '#4199e1', '#22d98a', '#f5a623', '#f07060', '#a78bfa'];
  const catData = stats.byCategory?.length
    ? { labels: stats.byCategory.map(c => c._id), data: stats.byCategory.map(c => c.count) }
    : { labels: ['Design', 'Development', 'QA', 'PM'], data: [30, 38, 18, 14] };

  const velData = [18, 22, 17, 25, 20, 23, 24];

  const tagColor = { Design: '#7c5cfc', Development: '#4199e1', QA: '#22d98a', PM: '#f5a623', Research: '#f07060', Other: '#8b8a9e' };
  const priorityColor = { low: '#22d98a', medium: '#f5a623', high: '#f07060', critical: '#ff2d55' };

  const actTypeIcon = {
    task_created: '✚', task_completed: '✓', task_updated: '✎', task_deleted: '✕',
    task_commented: '💬', project_created: '📁', member_joined: '👤', task_assigned: '→'
  };

  return (
    <div>
      {/* Header */}
      <div className="topbar">
        <div className="topbar-left">
          <h1>{greet()}, {user?.name?.split(' ')[0] || 'there'} 👋</h1>
          <p>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · Sprint 14 in progress</p>
        </div>
        <div className="topbar-right">
          <button className="btn btn-ghost" onClick={() => navigate('/tasks')}>View all tasks</button>
          <button className="btn btn-primary" onClick={() => { setEditTask(null); setShowModal(true); }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 2v10M2 7h10"/></svg>
            New task
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="stats-grid">
        {[
          { label: 'Total Tasks', value: stats.total, badge: '+12 this week', badgeClass: 'pill-green', bar: 'linear-gradient(90deg,#7c5cfc,#a78bfa)', onClick: () => navigate('/tasks') },
          { label: 'Completed', value: stats.done, badge: `${stats.total ? Math.round((stats.done/stats.total)*100) : 70}% completion`, badgeClass: 'pill-green', bar: 'linear-gradient(90deg,#22d98a,#6ee7b7)', color: 'var(--accent-green)' },
          { label: 'In Progress', value: stats.inProgress, badge: 'Active sprint tasks', badgeClass: 'pill-amber', bar: 'linear-gradient(90deg,#f5a623,#fcd34d)', color: 'var(--accent-amber)' },
          { label: 'Overdue', value: stats.overdue, badge: 'Needs attention', badgeClass: 'pill-coral', bar: 'linear-gradient(90deg,#f07060,#fda4af)', color: 'var(--accent-coral)' },
        ].map((s, i) => (
          <div key={i} className="stat-card" onClick={s.onClick}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color || 'var(--text-primary)' }}>{s.value}</div>
            <span className={`pill ${s.badgeClass}`}>{s.badge}</span>
            <div className="accent-bar" style={{ background: s.bar }} />
          </div>
        ))}
      </div>

      {/* Mid row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 24 }}>
        {/* Pie chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Tasks by category</span>
            <span className="pill pill-purple">This sprint</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
              <Doughnut
                data={{ labels: catData.labels, datasets: [{ data: catData.data, backgroundColor: catColors, borderWidth: 0, hoverOffset: 5 }] }}
                options={{ responsive: false, cutout: '68%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed}` } } }, animation: { animateRotate: true, duration: 900 } }}
                width={140} height={140}
              />
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none' }}>
                <div style={{ fontSize: 20, fontWeight: 600 }}>{stats.total}</div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>tasks</div>
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
              {catData.labels.map((l, i) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: catColors[i], flexShrink: 0 }} />
                  <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{l}</span>
                  <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }}>
                    <div style={{ height: 3, borderRadius: 2, background: catColors[i], width: `${Math.round((catData.data[i] / catData.data.reduce((a,b)=>a+b,1)) * 100)}%` }} />
                  </div>
                  <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{Math.round((catData.data[i] / catData.data.reduce((a,b)=>a+b,1)) * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Active tasks */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Active tasks</span>
            <span className="pill pill-purple">Sprint 14</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {tasks.slice(0, 6).map(task => (
              <div key={task._id} className="task-item" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--card-border)', cursor: 'pointer' }}
                onContextMenu={e => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, task }); }}
                onClick={() => { setEditTask(task); setShowModal(true); }}>
                <div onClick={e => { e.stopPropagation(); toggleTask(task); }}
                  style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${task.status === 'done' ? '#22d98a' : 'rgba(255,255,255,0.2)'}`, background: task.status === 'done' ? '#22d98a' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                  {task.status === 'done' && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                </div>
                <span style={{ fontSize: 12.5, color: task.status === 'done' ? 'var(--text-muted)' : 'var(--text-secondary)', flex: 1, textDecoration: task.status === 'done' ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {task.priority && <div className={`p-dot p-${task.priority}`} />}
                  <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: (tagColor[task.category] || '#8b8a9e') + '22', color: tagColor[task.category] || '#8b8a9e', fontWeight: 500 }}>{task.category || 'Other'}</span>
                </div>
              </div>
            ))}
            {tasks.length === 0 && !loading && (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '20px 0' }}>No tasks yet. Create one!</div>
            )}
          </div>
        </div>

        {/* Team */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Team</span>
            <span className="pill pill-purple">{team.length} members</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {team.map(m => (
              <div key={m._id} onClick={() => navigate('/team')} className="card-clickable" style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', borderRadius: 8, padding: '4px 0' }}>
                <div className="avatar" style={{ background: m.avatarColor || '#7c5cfc' }}>{m.initials || m.name?.[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500 }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    <span className="online-dot" style={{ marginRight: 4, background: m.isOnline ? 'var(--accent-green)' : 'var(--text-muted)' }} />
                    {m.isOnline ? (m.department || 'Online') : 'Offline'}
                  </div>
                </div>
                <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: 20 }}>{m.activeTaskCount || 0} tasks</span>
              </div>
            ))}
            {team.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '20px 0' }}>No team members yet</div>}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
        {/* Activity */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent activity</span>
            <span className="pill pill-green"><span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent-green)', display: 'inline-block', marginRight: 4, animation: 'pulse 1.5s infinite' }} />Live</span>
          </div>
          <div>
            {activity.map(a => (
              <div key={a._id} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--card-border)' }}>
                <div className="avatar avatar-sm" style={{ background: a.user?.avatarColor || '#7c5cfc', flexShrink: 0 }}>{a.user?.initials || '?'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    <strong style={{ color: 'var(--text-primary)' }}>{a.user?.name || 'User'}</strong> {a.description || a.type?.replace(/_/g, ' ')}
                    {a.entityTitle && <strong style={{ color: 'var(--text-primary)' }}> "{a.entityTitle}"</strong>}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{new Date(a.createdAt).toLocaleString()}</div>
                </div>
              </div>
            ))}
            {activity.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '20px 0' }}>No activity yet</div>}
          </div>
        </div>

        {/* Sprint velocity */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Sprint velocity</span>
            <span className="pill pill-purple">Last 7 sprints</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 60, margin: '12px 0 8px' }}>
            {velData.map((v, i) => (
              <div key={i} title={`Sprint ${8+i}: ${v} pts`}
                style={{ flex: 1, borderRadius: '3px 3px 0 0', background: i === velData.length - 1 ? 'var(--accent-purple)' : 'rgba(124,92,252,0.2)', height: `${Math.round(v / Math.max(...velData) * 100)}%`, transition: 'background 0.2s', cursor: 'pointer' }}
                onMouseEnter={e => e.target.style.background = 'var(--accent-purple)'}
                onMouseLeave={e => { if (i !== velData.length - 1) e.target.style.background = 'rgba(124,92,252,0.2)'; }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginBottom: 14 }}>
            {['S8','S9','S10','S11','S12','S13','S14'].map(s => <span key={s}>{s}</span>)}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Avg velocity</div>
              <div style={{ fontSize: 20, fontWeight: 600 }}>21.4 <span style={{ fontSize: 12, color: 'var(--accent-green)' }}>↑ 8%</span></div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Burndown</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--accent-amber)' }}>37 pts</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showModal && <TaskModal task={editTask} onClose={() => { setShowModal(false); setEditTask(null); }} onSaved={fetchAll} />}
      {ctxMenu && (
        <TaskContextMenu x={ctxMenu.x} y={ctxMenu.y} task={ctxMenu.task}
          onClose={() => setCtxMenu(null)}
          onEdit={(t) => { setEditTask(t); setShowModal(true); }}
          onDelete={handleDelete}
          onArchive={handleArchive}
          onDuplicate={handleDuplicate}
          onChangeStatus={handleStatusChange}
        />
      )}
    </div>
  );
}
