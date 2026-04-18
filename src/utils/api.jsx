// Mock API — stores data in localStorage so everything works without a backend.

const DB_KEY = 'tf_mock_users';
const TASKS_KEY = 'tf_mock_tasks';
const PROJECTS_KEY = 'tf_mock_projects';
const ACTIVITY_KEY = 'tf_mock_activity';

const getUsers = () => { try { return JSON.parse(localStorage.getItem(DB_KEY)) || []; } catch { return []; } };
const saveUsers = (users) => localStorage.setItem(DB_KEY, JSON.stringify(users));

const getTasks = () => { try { return JSON.parse(localStorage.getItem(TASKS_KEY)) || []; } catch { return []; } };
const saveTasks = (tasks) => localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));

const getProjects = () => { try { return JSON.parse(localStorage.getItem(PROJECTS_KEY)) || []; } catch { return []; } };
const saveProjects = (p) => localStorage.setItem(PROJECTS_KEY, JSON.stringify(p));

const getActivity = () => { try { return JSON.parse(localStorage.getItem(ACTIVITY_KEY)) || []; } catch { return []; } };
const saveActivity = (a) => localStorage.setItem(ACTIVITY_KEY, JSON.stringify(a));

const sign = (id) => btoa(JSON.stringify({ id, exp: Date.now() + 7 * 86400000 }));

async function hashPassword(password) {
  const enc = new TextEncoder().encode(password);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const getCurrentUser = () => {
  const token = localStorage.getItem('tf_token');
  if (!token) return null;
  try {
    const { id, exp } = JSON.parse(atob(token));
    if (Date.now() > exp) return null;
    const users = getUsers();
    return users.find(u => u._id === id) || null;
  } catch { return null; }
};

const addActivity = (user, type, description, entityTitle = '') => {
  const act = getActivity();
  act.unshift({
    _id: 'a_' + Date.now() + '_' + Math.random().toString(36).slice(2),
    user: { _id: user._id, name: user.name, initials: user.initials, avatarColor: user.avatarColor },
    type, description, entityTitle,
    createdAt: new Date().toISOString(),
  });
  saveActivity(act.slice(0, 50)); // keep latest 50
};

const routes = {
  // ── Auth ──────────────────────────────────────────────────────
  'POST /auth/register': async ({ name, email, password }) => {
    const users = getUsers();
    if (users.find(u => u.email === email.toLowerCase())) {
      const err = new Error('Email already registered');
      err.response = { status: 400, data: { message: 'Email already registered' } };
      throw err;
    }
    const hash = await hashPassword(password);
    const colors = ['#7c5cfc','#4199e1','#22d98a','#f5a623','#f07060','#a855f7'];
    const user = {
      _id: 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2),
      name: name.trim(), email: email.toLowerCase().trim(), password: hash,
      role: 'Member',
      avatarColor: colors[Math.floor(Math.random() * colors.length)],
      initials: name.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
      avatar: '', department: '', bio: '', isOnline: true,
      lastSeen: new Date().toISOString(), createdAt: new Date().toISOString(),
    };
    users.push(user);
    saveUsers(users);
    const { password: _, ...pub } = user;
    return { token: sign(user._id), user: pub };
  },

  'POST /auth/login': async ({ email, password }) => {
    const users = getUsers();
    const user = users.find(u => u.email === email.toLowerCase().trim());
    if (!user) {
      const err = new Error('Invalid email or password');
      err.response = { status: 401, data: { message: 'Invalid email or password' } };
      throw err;
    }
    const hash = await hashPassword(password);
    if (hash !== user.password) {
      const err = new Error('Invalid email or password');
      err.response = { status: 401, data: { message: 'Invalid email or password' } };
      throw err;
    }
    user.isOnline = true; user.lastSeen = new Date().toISOString();
    saveUsers(users);
    const { password: _, ...pub } = user;
    return { token: sign(user._id), user: pub };
  },

  'POST /auth/logout': async () => {
    const token = localStorage.getItem('tf_token');
    if (token) {
      try {
        const { id } = JSON.parse(atob(token));
        const users = getUsers();
        const u = users.find(x => x._id === id);
        if (u) { u.isOnline = false; u.lastSeen = new Date().toISOString(); saveUsers(users); }
      } catch {}
    }
    return { message: 'Logged out' };
  },

  'GET /auth/me': async () => {
    const token = localStorage.getItem('tf_token');
    if (!token) { const err = new Error('Unauthorized'); err.response = { status: 401, data: { message: 'Unauthorized' } }; throw err; }
    try {
      const { id, exp } = JSON.parse(atob(token));
      if (Date.now() > exp) throw new Error('expired');
      const users = getUsers();
      const user = users.find(u => u._id === id);
      if (!user) throw new Error('not found');
      const { password: _, ...pub } = user;
      return { user: pub };
    } catch {
      const err = new Error('Unauthorized'); err.response = { status: 401, data: { message: 'Unauthorized' } }; throw err;
    }
  },

  // ── Tasks ──────────────────────────────────────────────────────
  'GET /tasks/stats/summary': async () => {
    const tasks = getTasks();
    const user = getCurrentUser();
    const myTasks = user ? tasks.filter(t => t.createdBy === user._id || t.assignee === user._id) : tasks;
    const now = new Date();
    const byCategory = Object.values(
      myTasks.reduce((acc, t) => {
        const cat = t.category || 'Other';
        if (!acc[cat]) acc[cat] = { _id: cat, count: 0 };
        acc[cat].count++;
        return acc;
      }, {})
    );
    return {
      total: myTasks.length,
      done: myTasks.filter(t => t.status === 'done').length,
      inProgress: myTasks.filter(t => t.status === 'in-progress').length,
      overdue: myTasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done').length,
      byCategory,
    };
  },

  'GET /tasks': async (_, query) => {
    const tasks = getTasks();
    const user = getCurrentUser();
    let filtered = user ? tasks.filter(t => t.createdBy === user._id || t.assignee === user._id) : tasks;
    if (query?.status) filtered = filtered.filter(t => t.status === query.status);
    if (query?.priority) filtered = filtered.filter(t => t.priority === query.priority);
    if (query?.search) filtered = filtered.filter(t => t.title.toLowerCase().includes(query.search.toLowerCase()));
    // Sort by createdAt desc
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const limit = query?.limit ? parseInt(query.limit) : filtered.length;
    return { tasks: filtered.slice(0, limit), total: filtered.length };
  },

  'POST /tasks': async (data) => {
    const user = getCurrentUser();
    const task = {
      _id: 't_' + Date.now() + '_' + Math.random().toString(36).slice(2),
      title: data.title || 'Untitled task',
      description: data.description || '',
      status: data.status || 'todo',
      priority: data.priority || 'medium',
      category: data.category || 'Other',
      dueDate: data.dueDate || null,
      project: data.project || null,
      assignee: data.assignee || user?._id || null,
      createdBy: user?._id || null,
      tags: data.tags || [],
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const tasks = getTasks();
    tasks.unshift(task);
    saveTasks(tasks);
    if (user) addActivity(user, 'task_created', 'created task', task.title);
    return task;
  },

  'PUT /tasks/:id': async (data, _, id) => {
    const tasks = getTasks();
    const idx = tasks.findIndex(t => t._id === id);
    if (idx === -1) { const err = new Error('Not found'); err.response = { status: 404, data: { message: 'Task not found' } }; throw err; }
    tasks[idx] = { ...tasks[idx], ...data, updatedAt: new Date().toISOString() };
    saveTasks(tasks);
    const user = getCurrentUser();
    if (user && data.status) addActivity(user, 'task_updated', `marked task ${data.status}`, tasks[idx].title);
    return tasks[idx];
  },

  'PATCH /tasks/:id/archive': async (_, __, id) => {
    const tasks = getTasks();
    const idx = tasks.findIndex(t => t._id === id);
    if (idx !== -1) { tasks[idx].archived = true; tasks[idx].updatedAt = new Date().toISOString(); saveTasks(tasks); }
    return tasks[idx] || {};
  },

  'POST /tasks/:id/duplicate': async (_, __, id) => {
    const tasks = getTasks();
    const orig = tasks.find(t => t._id === id);
    if (!orig) { const err = new Error('Not found'); err.response = { status: 404, data: {} }; throw err; }
    const copy = { ...orig, _id: 't_' + Date.now() + '_' + Math.random().toString(36).slice(2), title: orig.title + ' (copy)', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    tasks.unshift(copy);
    saveTasks(tasks);
    return copy;
  },

  'DELETE /tasks/:id': async (_, __, id) => {
    const tasks = getTasks();
    const task = tasks.find(t => t._id === id);
    saveTasks(tasks.filter(t => t._id !== id));
    const user = getCurrentUser();
    if (user && task) addActivity(user, 'task_deleted', 'deleted task', task.title);
    return { message: 'Deleted' };
  },

  // ── Activity ───────────────────────────────────────────────────
  'GET /activity': async (_, query) => {
    const activity = getActivity();
    const limit = query?.limit ? parseInt(query.limit) : activity.length;
    return activity.slice(0, limit);
  },

  // ── Team ───────────────────────────────────────────────────────
  'GET /team': async () => {
    const users = getUsers();
    const tasks = getTasks();
    return users.map(u => {
      const { password: _, ...pub } = u;
      return { ...pub, activeTaskCount: tasks.filter(t => t.assignee === u._id && t.status !== 'done').length };
    });
  },

  // ── Projects ───────────────────────────────────────────────────
  'GET /projects': async () => {
    const projects = getProjects();
    const tasks = getTasks();
    return projects.map(p => ({
      ...p,
      taskCount: tasks.filter(t => t.project === p._id).length,
      completedCount: tasks.filter(t => t.project === p._id && t.status === 'done').length,
    }));
  },

  'POST /projects': async (data) => {
    const user = getCurrentUser();
    const project = {
      _id: 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2),
      name: data.name || 'Untitled project',
      description: data.description || '',
      color: data.color || '#7c5cfc',
      status: data.status || 'active',
      createdBy: user?._id || null,
      createdAt: new Date().toISOString(),
    };
    const projects = getProjects();
    projects.unshift(project);
    saveProjects(projects);
    if (user) addActivity(user, 'project_created', 'created project', project.name);
    return project;
  },

  'GET /projects/:id': async (_, __, id) => {
    const projects = getProjects();
    const p = projects.find(x => x._id === id);
    if (!p) { const err = new Error('Not found'); err.response = { status: 404, data: {} }; throw err; }
    return p;
  },

  'PUT /projects/:id': async (data, _, id) => {
    const projects = getProjects();
    const idx = projects.findIndex(p => p._id === id);
    if (idx !== -1) { projects[idx] = { ...projects[idx], ...data }; saveProjects(projects); }
    return projects[idx] || {};
  },

  'DELETE /projects/:id': async (_, __, id) => {
    saveProjects(getProjects().filter(p => p._id !== id));
    return { message: 'Deleted' };
  },

  // ── Bulk operations ────────────────────────────────────────────
  'PATCH /tasks/bulk/update': async ({ ids, updates }) => {
    const tasks = getTasks();
    ids?.forEach(id => {
      const idx = tasks.findIndex(t => t._id === id);
      if (idx !== -1) tasks[idx] = { ...tasks[idx], ...updates, updatedAt: new Date().toISOString() };
    });
    saveTasks(tasks);
    return { message: 'Updated', count: ids?.length || 0 };
  },

  // ── Notifications ──────────────────────────────────────────────
  'GET /notifications': async () => ({ notifications: [], unread: 0 }),
  'PATCH /notifications/read-all': async () => ({ message: 'ok' }),

  // ── Profile ────────────────────────────────────────────────────
  'GET /profile': async () => {
    const user = getCurrentUser();
    if (!user) { const err = new Error('Unauthorized'); err.response = { status: 401, data: {} }; throw err; }
    const { password: _, ...pub } = user;
    return { user: pub };
  },

  'PUT /profile': async (data) => {
    const user = getCurrentUser();
    if (!user) { const err = new Error('Unauthorized'); err.response = { status: 401, data: {} }; throw err; }
    const users = getUsers();
    const idx = users.findIndex(u => u._id === user._id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...data, updatedAt: new Date().toISOString() };
      saveUsers(users);
      localStorage.setItem('tf_user', JSON.stringify(users[idx]));
      const { password: _, ...pub } = users[idx];
      return { user: pub };
    }
    return { user };
  },
};

// URL param matcher: matches /tasks/:id style routes
const matchRoute = (method, url) => {
  const key = `${method.toUpperCase()} ${url}`;
  if (routes[key]) return { handler: routes[key], params: {} };

  for (const pattern of Object.keys(routes)) {
    const [pMethod, pPath] = pattern.split(' ');
    if (pMethod !== method.toUpperCase()) continue;
    const patParts = pPath.split('/');
    const urlParts = url.split('?')[0].split('/');
    if (patParts.length !== urlParts.length) continue;
    const params = {};
    let match = true;
    for (let i = 0; i < patParts.length; i++) {
      if (patParts[i].startsWith(':')) { params[patParts[i].slice(1)] = urlParts[i]; }
      else if (patParts[i] !== urlParts[i]) { match = false; break; }
    }
    if (match) return { handler: routes[pattern], params };
  }
  return null;
};

const parseQuery = (url) => {
  const q = {};
  const idx = url.indexOf('?');
  if (idx === -1) return q;
  url.slice(idx + 1).split('&').forEach(p => { const [k, v] = p.split('='); if (k) q[k] = decodeURIComponent(v || ''); });
  return q;
};

const request = async (method, url, data) => {
  const cleanUrl = url.replace(/^\/api/, '');
  const match = matchRoute(method, cleanUrl);
  if (!match) {
    // Unhandled routes return safe empty responses
    if (method.toUpperCase() === 'GET') return { data: {} };
    return { data: {} };
  }
  const query = parseQuery(cleanUrl);
  const id = Object.values(match.params)[0];
  const result = await match.handler(data || {}, query, id);
  return { data: result };
};

const api = {
  get: (url) => request('GET', url),
  post: (url, data) => request('POST', url, data),
  put: (url, data) => request('PUT', url, data),
  patch: (url, data) => request('PATCH', url, data),
  delete: (url) => request('DELETE', url),
};

export default api;
