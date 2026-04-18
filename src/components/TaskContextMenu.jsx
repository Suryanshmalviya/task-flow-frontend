import React, { useEffect, useRef } from 'react';

export default function TaskContextMenu({ x, y, task, onClose, onEdit, onDelete, onArchive, onDuplicate, onChangeStatus, onAssign }) {
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    setTimeout(() => {
      document.addEventListener('mousedown', handler);
      document.addEventListener('keydown', esc);
    }, 0);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', esc);
    };
  }, [onClose]);

  // Adjust position to stay in viewport
  const style = {
    top: Math.min(y, window.innerHeight - 320),
    left: Math.min(x, window.innerWidth - 200)
  };

  const statusOptions = [
    { value: 'todo', label: 'To Do', color: '#8b8a9e' },
    { value: 'in-progress', label: 'In Progress', color: '#4199e1' },
    { value: 'in-review', label: 'In Review', color: '#f5a623' },
    { value: 'done', label: 'Done', color: '#22d98a' },
  ];

  return (
    <div ref={ref} className="ctx-menu" style={style}>
      <div className="ctx-item" onClick={() => { onEdit(task); onClose(); }}>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M9 2l2 2-7 7H2V9L9 2z"/></svg>
        Edit task
      </div>
      <div className="ctx-item" onClick={() => { onDuplicate(task); onClose(); }}>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="4" y="4" width="8" height="8" rx="1.5"/><path d="M1 9V2a1 1 0 0 1 1-1h7"/></svg>
        Duplicate
      </div>
      <div className="ctx-divider" />
      <div style={{ padding: '4px 12px 2px', fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Change status</div>
      {statusOptions.map(s => (
        <div key={s.value} className="ctx-item" onClick={() => { onChangeStatus(task, s.value); onClose(); }}
          style={{ color: task.status === s.value ? s.color : undefined }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
          {s.label}
          {task.status === s.value && <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#22d98a" strokeWidth="1.5" style={{ marginLeft: 'auto' }}><path d="M2 5l2.5 2.5L8 3"/></svg>}
        </div>
      ))}
      <div className="ctx-divider" />
      <div className="ctx-item" onClick={() => { onArchive(task); onClose(); }}>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M2 4h9v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4zM1 2h11M5 6h3"/></svg>
        Archive
      </div>
      <div className="ctx-item danger" onClick={() => { onDelete(task); onClose(); }}>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M2 4h9l-1 8H3L2 4zM1 2h11M5 2V1h3v1"/></svg>
        Delete permanently
      </div>
    </div>
  );
}
