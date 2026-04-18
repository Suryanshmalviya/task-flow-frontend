import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const NavIcon = ({ d, viewBox = '0 0 16 16', fill = false, children }) =>
  children ? (
    <svg width="16" height="16" viewBox={viewBox} fill="none" stroke="currentColor" strokeWidth="1.5">{children}</svg>
  ) : (
    <svg width="16" height="16" viewBox={viewBox} fill={fill ? 'currentColor' : 'none'} stroke={fill ? 'none' : 'currentColor'} strokeWidth="1.5"><path d={d} /></svg>
  );

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const notifRef = useRef();
  const userRef = useRef();

  useEffect(() => {
    api.get('/notifications').then(r => {
      setNotifications(r.data.notifications || []);
      setUnread(r.data.unread || 0);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    await api.patch('/notifications/read-all');
    setUnread(0);
    setNotifications(n => n.map(x => ({ ...x, isRead: true })));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user?.initials || user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U';

  const navLinks = [
    { to: '/', label: 'Dashboard', end: true, icon: <><rect x="1" y="1" width="6" height="6" rx="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/></> },
    { to: '/tasks', label: 'My Tasks', icon: <><path d="M2 4h12M2 8h8M2 12h5"/></> },
    { to: '/projects', label: 'Projects', icon: <><rect x="1" y="3" width="14" height="11" rx="2"/><path d="M5 3V1M11 3V1M1 7h14"/></> },
    { to: '/team', label: 'Team', icon: <><circle cx="6" cy="5" r="3"/><circle cx="11" cy="5" r="2"/><path d="M1 14c0-2.8 2.2-4 5-4s5 1.2 5 4M13 14c0-1.5-.8-2.5-2-3"/></> },
  ];

  const navLinks2 = [
    { to: '/analytics', label: 'Analytics', icon: <><circle cx="8" cy="8" r="2.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.2 3.2l1.4 1.4M11.4 11.4l1.4 1.4M3.2 12.8l1.4-1.4M11.4 4.6l1.4-1.4"/></> },
    { to: '/settings', label: 'Settings', icon: <><circle cx="8" cy="8" r="6.5"/><circle cx="8" cy="8" r="2.5"/></> },
  ];

  const notifTypeColor = { task_assigned: '#7c5cfc', task_due: '#f5a623', mention: '#4199e1', comment: '#22d98a', overdue: '#f07060' };

  return (
    <div className="shell">
      <nav className="sidebar">
        <div className="brand">
          <div className="brand-dot" />
          TaskFlow
        </div>

        {navLinks.map(l => (
          <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">{l.icon}</svg>
            {l.label}
          </NavLink>
        ))}

        <div className="nav-divider" />
        {navLinks2.map(l => (
          <NavLink key={l.to} to={l.to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">{l.icon}</svg>
            {l.label}
          </NavLink>
        ))}

        <div className="nav-spacer" />

        <div ref={userRef} style={{ position: 'relative' }}>
          <div className="user-chip" onClick={() => setUserMenuOpen(o => !o)}>
            <div className="avatar" style={{ background: user?.avatarColor || '#7c5cfc' }}>{initials}</div>
            <div className="user-chip-info">
              <span className="user-chip-name">{user?.name || 'User'}</span>
              <span className="user-chip-role">{user?.role || 'Member'}</span>
            </div>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginLeft: 'auto', opacity: 0.4 }}>
              <path d="M2 4l4 4 4-4" />
            </svg>
          </div>
          {userMenuOpen && (
            <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: 6, background: 'var(--card-bg)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 'var(--radius)', padding: 6, boxShadow: 'var(--shadow)', zIndex: 999 }}>
              <div className="ctx-item" onClick={() => { setUserMenuOpen(false); navigate('/profile'); }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="7" cy="5" r="3"/><path d="M1 13c0-3 2.5-4.5 6-4.5s6 1.5 6 4.5"/></svg>
                Profile
              </div>
              <div className="ctx-item" onClick={() => { setUserMenuOpen(false); navigate('/settings'); }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="7" cy="7" r="5.5"/><circle cx="7" cy="7" r="2"/></svg>
                Settings
              </div>
              <div className="ctx-divider" />
              <div className="ctx-item danger" onClick={handleLogout}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M9 1h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9M5 10l-4-3 4-3M1 7h7"/></svg>
                Sign out
              </div>
            </div>
          )}
        </div>
      </nav>

      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top notification bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '14px 32px 0', position: 'relative' }} ref={notifRef}>
          <div className="notif-btn" onClick={() => setNotifOpen(o => !o)}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 1a5 5 0 0 1 5 5v3l1.5 2.5H1.5L3 9V6a5 5 0 0 1 5-5z"/>
              <path d="M6.5 13.5a1.5 1.5 0 0 0 3 0"/>
            </svg>
            {unread > 0 && <div className="notif-dot" />}
          </div>
          {notifOpen && (
            <div className="notif-panel">
              <div className="notif-panel-header">
                <span style={{ fontSize: 13, fontWeight: 500 }}>Notifications {unread > 0 && <span className="pill pill-purple" style={{ marginLeft: 6 }}>{unread}</span>}</span>
                {unread > 0 && <span style={{ fontSize: 12, color: 'var(--accent-purple)', cursor: 'pointer' }} onClick={markAllRead}>Mark all read</span>}
              </div>
              <div className="notif-list">
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No notifications</div>
                ) : notifications.map(n => (
                  <div key={n._id} className={`notif-item${!n.isRead ? ' unread' : ''}`}>
                    <div className="avatar avatar-sm" style={{ background: notifTypeColor[n.type] || '#7c5cfc', flexShrink: 0 }}>
                      {n.sender?.initials || '!'}
                    </div>
                    <div>
                      <div className="notif-text"><strong style={{ color: 'var(--text-primary)' }}>{n.title}</strong><br />{n.message}</div>
                      <div className="notif-time">{new Date(n.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="main-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
