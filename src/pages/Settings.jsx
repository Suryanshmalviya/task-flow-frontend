import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Settings() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('general');
  const [theme, setTheme] = useState('dark');
  const [dateFormat, setDateFormat] = useState('MMM D, YYYY');
  const [weekStart, setWeekStart] = useState('Monday');
  const [defaultView, setDefaultView] = useState('list');
  const [autoArchive, setAutoArchive] = useState(true);
  const [showCompleted, setShowCompleted] = useState(true);

  const save = () => addToast('Settings saved', 'success');

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

  const SelectRow = ({ label, desc, value, onChange, options }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--card-border)' }}>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 500 }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{desc}</div>}
      </div>
      <select className="input" style={{ width: 160 }} value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  const tabs = [
    { key: 'general', label: 'General' },
    { key: 'display', label: 'Display' },
    { key: 'integrations', label: 'Integrations' },
    { key: 'about', label: 'About' },
  ];

  return (
    <div>
      <div className="topbar">
        <div className="topbar-left">
          <h1>Settings</h1>
          <p>Configure your TaskFlow workspace</p>
        </div>
        <div className="topbar-right">
          <button className="btn btn-primary" onClick={save}>Save settings</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 20 }}>
        {/* Sidebar nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {tabs.map(t => (
            <div key={t.key} onClick={() => setActiveTab(t.key)}
              style={{ padding: '9px 12px', borderRadius: 8, fontSize: 13.5, cursor: 'pointer', fontWeight: 500,
                background: activeTab === t.key ? 'rgba(124,92,252,0.12)' : 'transparent',
                color: activeTab === t.key ? '#7c5cfc' : 'var(--text-secondary)',
                transition: 'all 0.15s' }}>
              {t.label}
            </div>
          ))}
        </div>

        <div>
          {activeTab === 'general' && (
            <div className="card">
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, fontFamily: 'var(--font-display)' }}>General settings</div>
              <SelectRow label="Date format" desc="How dates are displayed across the app" value={dateFormat} onChange={setDateFormat} options={['MMM D, YYYY', 'DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']} />
              <SelectRow label="Week starts on" desc="First day of the week in calendar views" value={weekStart} onChange={setWeekStart} options={['Monday', 'Sunday', 'Saturday']} />
              <SelectRow label="Default task view" desc="How tasks are shown by default" value={defaultView} onChange={setDefaultView} options={['list', 'kanban']} />
              <Toggle checked={autoArchive} onChange={() => setAutoArchive(v => !v)} label="Auto-archive completed tasks" desc="Move done tasks to archive after 30 days" />
              <Toggle checked={showCompleted} onChange={() => setShowCompleted(v => !v)} label="Show completed tasks" desc="Display done tasks in task lists" />
            </div>
          )}

          {activeTab === 'display' && (
            <div className="card">
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, fontFamily: 'var(--font-display)' }}>Display preferences</div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500, marginBottom: 10 }}>Theme</div>
                <div style={{ display: 'flex', gap: 12 }}>
                  {[
                    { key: 'dark', label: 'Dark', bg: '#0b0b10', border: '#2a2a36' },
                    { key: 'darker', label: 'Abyss', bg: '#050507', border: '#1a1a24' },
                  ].map(t => (
                    <div key={t.key} onClick={() => setTheme(t.key)}
                      style={{ width: 80, height: 56, borderRadius: 10, background: t.bg, border: `2px solid ${theme === t.key ? '#7c5cfc' : t.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4, transition: 'border 0.15s' }}>
                      <div style={{ width: 30, height: 4, borderRadius: 2, background: theme === t.key ? '#7c5cfc' : '#2a2a36' }} />
                      <div style={{ width: 20, height: 3, borderRadius: 2, background: '#2a2a36' }} />
                      <div style={{ fontSize: 10, color: theme === t.key ? '#7c5cfc' : '#4e4d5e', marginTop: 2 }}>{t.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <Toggle checked={true} onChange={() => {}} label="Compact mode" desc="Reduce spacing for denser information display" />
              <Toggle checked={false} onChange={() => {}} label="Animations" desc="Smooth transitions and micro-interactions" />
              <Toggle checked={true} onChange={() => {}} label="Sidebar collapsed on mobile" desc="Auto-hide sidebar on small screens" />
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="card">
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, fontFamily: 'var(--font-display)' }}>Integrations</div>
              {[
                { name: 'GitHub', desc: 'Link commits and PRs to tasks', icon: '⚙', connected: false, color: '#333' },
                { name: 'Slack', desc: 'Get task notifications in Slack', icon: '#', connected: false, color: '#4a154b' },
                { name: 'Figma', desc: 'Embed Figma frames in tasks', icon: 'F', connected: false, color: '#f24e1e' },
                { name: 'Google Calendar', desc: 'Sync due dates with your calendar', icon: '📅', connected: false, color: '#4285f4' },
              ].map(int => (
                <div key={int.name} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 0', borderBottom: '1px solid var(--card-border)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: int.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: int.color, flexShrink: 0 }}>{int.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{int.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{int.desc}</div>
                  </div>
                  <button className={`btn ${int.connected ? 'btn-danger' : 'btn-ghost'} btn-sm`} onClick={() => addToast(`${int.name} integration coming soon`, 'info')}>
                    {int.connected ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="card">
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 20, fontFamily: 'var(--font-display)' }}>About TaskFlow</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', align: 'center', gap: 14, padding: 20, background: 'rgba(124,92,252,0.06)', borderRadius: 12, border: '1px solid rgba(124,92,252,0.12)' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: '#7c5cfc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#fff', boxShadow: '0 0 10px rgba(255,255,255,0.5)' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 18, fontFamily: 'var(--font-display)' }}>TaskFlow</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>Version 1.0.0 · Production</div>
                  </div>
                </div>
                {[
                  { label: 'Frontend', value: 'React 18 · Deployed on Vercel' },
                  { label: 'Backend', value: 'Node.js / Express · Deployed on Render' },
                  { label: 'Database', value: 'MongoDB Atlas' },
                  { label: 'Auth', value: 'JWT · 7 day expiry' },
                  { label: 'Logged in as', value: `${user?.name} (${user?.email})` },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--card-border)', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{r.label}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
