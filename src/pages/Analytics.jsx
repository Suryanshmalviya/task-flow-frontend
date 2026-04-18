import React, { useState, useEffect } from 'react';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Filler
} from 'chart.js';
import api from '../utils/api';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler);

const chartDefaults = {
  plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1e1e2a', titleColor: '#f0eff8', bodyColor: '#8b8a9e', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, padding: 10, cornerRadius: 8 } },
  scales: {
    x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8b8a9e', font: { size: 11, family: 'DM Sans' } }, border: { display: false } },
    y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#8b8a9e', font: { size: 11, family: 'DM Sans' } }, border: { display: false }, beginAtZero: true }
  }
};

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('week');

  useEffect(() => {
    Promise.all([
      api.get('/tasks/stats/summary'),
      api.get('/tasks?limit=200'),
      api.get('/projects')
    ]).then(([sr, tr, pr]) => {
      setStats({ summary: sr.data, tasks: tr.data.tasks || [], projects: pr.data || [] });
    }).catch(() => {
      setStats({ summary: { total: 0, done: 0, inProgress: 0, overdue: 0, byCategory: [] }, tasks: [], projects: [] });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>;

  const { summary, tasks, projects } = stats;

  // Category pie
  const catColors = ['#7c5cfc', '#4199e1', '#22d98a', '#f5a623', '#f07060', '#a78bfa'];
  const catData = summary.byCategory?.length
    ? { labels: summary.byCategory.map(c => c._id), data: summary.byCategory.map(c => c.count) }
    : { labels: ['Design', 'Development', 'QA', 'PM', 'Research', 'Other'], data: [28, 35, 15, 12, 6, 4] };

  // Status breakdown
  const statusCounts = {
    todo: tasks.filter(t => t.status === 'todo').length,
    'in-progress': tasks.filter(t => t.status === 'in-progress').length,
    'in-review': tasks.filter(t => t.status === 'in-review').length,
    done: tasks.filter(t => t.status === 'done').length,
  };

  // Priority breakdown
  const priorityCounts = {
    low: tasks.filter(t => t.priority === 'low').length,
    medium: tasks.filter(t => t.priority === 'medium').length,
    high: tasks.filter(t => t.priority === 'high').length,
    critical: tasks.filter(t => t.priority === 'critical').length,
  };

  // Velocity (mocked weekly data)
  const velLabels = period === 'week'
    ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    : ['Wk1', 'Wk2', 'Wk3', 'Wk4'];
  const velData = period === 'week'
    ? [4, 7, 5, 9, 6, 3, 8]
    : [22, 18, 27, 24];

  // Burndown (mocked)
  const burnLabels = Array.from({ length: 14 }, (_, i) => `D${i + 1}`);
  const burnIdeal = Array.from({ length: 14 }, (_, i) => Math.round(80 - (i * 80 / 13)));
  const burnActual = [80, 76, 71, 68, 62, 58, 52, 48, 40, 36, 29, 22, 14, 6];

  // Completion rate trend (mocked)
  const compLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const compData = [62, 68, 71, 74, 78, 82];

  const completionRate = summary.total > 0 ? Math.round((summary.done / summary.total) * 100) : 0;

  const kpis = [
    { label: 'Completion Rate', value: `${completionRate}%`, delta: '+8%', color: '#22d98a', bar: 'linear-gradient(90deg,#22d98a,#6ee7b7)' },
    { label: 'Avg Velocity', value: '21.4 pts', delta: '+12%', color: '#7c5cfc', bar: 'linear-gradient(90deg,#7c5cfc,#a78bfa)' },
    { label: 'Overdue Tasks', value: summary.overdue, delta: '-3 tasks', color: '#f07060', bar: 'linear-gradient(90deg,#f07060,#fda4af)' },
    { label: 'Active Projects', value: projects.filter(p => p.status === 'active').length, delta: 'this quarter', color: '#f5a623', bar: 'linear-gradient(90deg,#f5a623,#fcd34d)' },
  ];

  const Metric = ({ label, value, pct, color }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--card-border)' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 5 }}>{label}</div>
        <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%`, background: color }} /></div>
      </div>
      <span style={{ fontSize: 14, fontWeight: 600, color, width: 36, textAlign: 'right' }}>{value}</span>
    </div>
  );

  return (
    <div>
      <div className="topbar">
        <div className="topbar-left">
          <h1>Analytics</h1>
          <p>Performance insights for your team and projects</p>
        </div>
        <div className="topbar-right">
          <div className="tab-bar">
            {['week', 'month'].map(p => (
              <div key={p} className={`tab${period === p ? ' active' : ''}`} onClick={() => setPeriod(p)}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {kpis.map((k, i) => (
          <div key={i} className="stat-card">
            <div className="stat-label">{k.label}</div>
            <div className="stat-value" style={{ color: k.color, fontSize: 26 }}>{k.value}</div>
            <span className="pill pill-green" style={{ fontSize: 10 }}>{k.delta}</span>
            <div className="accent-bar" style={{ background: k.bar }} />
          </div>
        ))}
      </div>

      {/* Row 1: Velocity + Burndown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Task completion velocity</span>
            <span className="pill pill-purple">{period === 'week' ? 'This week' : 'This month'}</span>
          </div>
          <Bar
            data={{
              labels: velLabels,
              datasets: [{
                data: velData,
                backgroundColor: velData.map((_, i) => i === velData.length - 1 ? '#7c5cfc' : 'rgba(124,92,252,0.2)'),
                borderRadius: 6,
                borderSkipped: false,
                hoverBackgroundColor: '#7c5cfc'
              }]
            }}
            options={{ ...chartDefaults, responsive: true, maintainAspectRatio: true, aspectRatio: 2.2 }}
          />
        </div>
        <div className="card">
          <div className="card-header">
            <span className="card-title">Sprint burndown</span>
            <span className="pill pill-amber">Sprint 14</span>
          </div>
          <Line
            data={{
              labels: burnLabels,
              datasets: [
                { label: 'Ideal', data: burnIdeal, borderColor: 'rgba(255,255,255,0.15)', borderDash: [4, 4], borderWidth: 1.5, pointRadius: 0, tension: 0 },
                { label: 'Actual', data: burnActual, borderColor: '#7c5cfc', backgroundColor: 'rgba(124,92,252,0.08)', borderWidth: 2, pointRadius: 0, tension: 0.3, fill: true }
              ]
            }}
            options={{ ...chartDefaults, responsive: true, maintainAspectRatio: true, aspectRatio: 2.2 }}
          />
        </div>
      </div>

      {/* Row 2: Category pie + Status + Priority + Completion trend */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
        {/* Category doughnut */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Tasks by category</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <div style={{ position: 'relative', width: 160, height: 160 }}>
              <Doughnut
                data={{ labels: catData.labels, datasets: [{ data: catData.data, backgroundColor: catColors, borderWidth: 0, hoverOffset: 5 }] }}
                options={{ responsive: false, cutout: '68%', plugins: { legend: { display: false }, tooltip: chartDefaults.plugins.tooltip }, animation: { animateRotate: true, duration: 900 } }}
                width={160} height={160}
              />
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none' }}>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{summary.total}</div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>total</div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {catData.labels.map((l, i) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: catColors[i], flexShrink: 0 }} />
                <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{l}</span>
                <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{catData.data[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status & Priority breakdown */}
        <div className="card">
          <div className="card-header"><span className="card-title">Status breakdown</span></div>
          <Metric label="To Do" value={statusCounts.todo} pct={summary.total ? (statusCounts.todo / summary.total) * 100 : 0} color="#8b8a9e" />
          <Metric label="In Progress" value={statusCounts['in-progress']} pct={summary.total ? (statusCounts['in-progress'] / summary.total) * 100 : 0} color="#4199e1" />
          <Metric label="In Review" value={statusCounts['in-review']} pct={summary.total ? (statusCounts['in-review'] / summary.total) * 100 : 0} color="#f5a623" />
          <Metric label="Done" value={statusCounts.done} pct={summary.total ? (statusCounts.done / summary.total) * 100 : 0} color="#22d98a" />
          <div style={{ height: 20 }} />
          <div className="card-header" style={{ marginBottom: 0, paddingTop: 4 }}><span className="card-title">Priority breakdown</span></div>
          <Metric label="Low" value={priorityCounts.low} pct={summary.total ? (priorityCounts.low / summary.total) * 100 : 0} color="#22d98a" />
          <Metric label="Medium" value={priorityCounts.medium} pct={summary.total ? (priorityCounts.medium / summary.total) * 100 : 0} color="#f5a623" />
          <Metric label="High" value={priorityCounts.high} pct={summary.total ? (priorityCounts.high / summary.total) * 100 : 0} color="#f07060" />
          <Metric label="Critical" value={priorityCounts.critical} pct={summary.total ? (priorityCounts.critical / summary.total) * 100 : 0} color="#ff2d55" />
        </div>

        {/* Completion rate trend */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Completion rate trend</span>
            <span className="pill pill-green">+8% MoM</span>
          </div>
          <Line
            data={{
              labels: compLabels,
              datasets: [{
                data: compData,
                borderColor: '#22d98a',
                backgroundColor: 'rgba(34,217,138,0.08)',
                borderWidth: 2,
                pointRadius: 3,
                pointBackgroundColor: '#22d98a',
                tension: 0.4,
                fill: true
              }]
            }}
            options={{ ...chartDefaults, responsive: true, maintainAspectRatio: true, aspectRatio: 1.6,
              scales: { ...chartDefaults.scales, y: { ...chartDefaults.scales.y, min: 50, max: 100, ticks: { ...chartDefaults.scales.y.ticks, callback: v => `${v}%` } } }
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, padding: '12px 0', borderTop: '1px solid var(--card-border)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#22d98a' }}>{completionRate}%</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Current</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>62%</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>6 months ago</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#22d98a' }}>↑20%</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Growth</div>
            </div>
          </div>
        </div>
      </div>

      {/* Project progress table */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="card-title">Project progress</span>
          <span className="pill pill-purple">{projects.length} projects</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Status</th>
                <th>Tasks</th>
                <th>Progress</th>
                <th>Due</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No projects yet</td></tr>
              ) : projects.map(p => {
                const ss = { active: '#22d98a', 'in-review': '#4199e1', 'on-hold': '#f5a623', completed: '#7c5cfc' };
                return (
                  <tr key={p._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color || '#7c5cfc' }} />
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{p.name}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: (ss[p.status] || '#8b8a9e') + '22', color: ss[p.status] || '#8b8a9e', fontWeight: 500 }}>
                        {p.status?.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </span>
                    </td>
                    <td>{p.completedCount || 0} / {p.taskCount || 0}</td>
                    <td style={{ width: 160 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-bar" style={{ flex: 1 }}>
                          <div className="progress-fill" style={{ width: `${p.progress || 0}%`, background: p.color || '#7c5cfc' }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 500, width: 32, color: p.color || '#7c5cfc' }}>{p.progress || 0}%</span>
                      </div>
                    </td>
                    <td>{p.dueDate ? new Date(p.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
