const API = '/api';

export function getToken() { return localStorage.getItem('cl_token'); }
export function setToken(t) { localStorage.setItem('cl_token', t); }
export function removeToken() { localStorage.removeItem('cl_token'); }

export async function apiFetch(path, opts = {}) {
  const token = getToken();
  const res = await fetch(`${API}${path}`, {
    ...opts,
    credentials: 'include',
    headers: {
      ...(opts.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (res.status === 204) return null;

  if (res.status === 401 && !path.startsWith('/auth/')) {
    const refreshed = await tryRefresh();
    if (refreshed) return apiFetch(path, opts);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

async function tryRefresh() {
  try {
    const res = await fetch(`${API}/auth/refresh`, { method: 'POST', credentials: 'include' });
    if (!res.ok) return false;
    const data = await res.json();
    if (data.token) { setToken(data.token); return true; }
  } catch { /* */ }
  removeToken();
  return false;
}

export const authAPI = {
  register: (email, password, name) =>
    apiFetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    }),
  login: (email, password) =>
    apiFetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }),
  me: () => apiFetch('/auth/me'),
  logout: () => apiFetch('/auth/logout', { method: 'POST' }),
};

export const fileAPI = {
  dashboard: () => apiFetch('/files/dashboard'),
  list: (params = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') q.set(k, v); });
    return apiFetch(`/files?${q}`);
  },
  upload: (file, folderId, onProgress) => {
    const token = getToken();
    const form = new FormData();
    form.append('file', file);
    if (folderId) form.append('folderId', folderId);
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API}/files/upload`);
      xhr.withCredentials = true;
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status === 201) resolve(JSON.parse(xhr.responseText));
        else {
          try { reject(new Error(JSON.parse(xhr.responseText).error)); }
          catch { reject(new Error('Upload failed')); }
        }
      };
      xhr.onerror = () => reject(new Error('Network error'));
      xhr.send(form);
    });
  },
  rename: (id, name) => apiFetch(`/files/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) }),
  move: (id, folderId) => apiFetch(`/files/${id}/move`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ folderId }) }),
  copy: (id, folderId) => apiFetch(`/files/${id}/copy`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ folderId }) }),
  trash: (id) => apiFetch(`/files/${id}`, { method: 'DELETE' }),
  restore: (id) => apiFetch(`/files/${id}/restore`, { method: 'POST' }),
  permanent: (id) => apiFetch(`/files/${id}/permanent`, { method: 'DELETE' }),
  download: async (file) => {
    const token = getToken();
    const res = await fetch(`${API}/files/${file.id}/download`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error('Download failed');
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(a.href);
  },
  preview: (id) => apiFetch(`/files/${id}/preview`),
};

export const folderAPI = {
  create: (name, parentId) => apiFetch('/folders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, parentId }) }),
  tree: () => apiFetch('/folders/tree'),
  rename: (id, name) => apiFetch(`/folders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) }),
  move: (id, parentId) => apiFetch(`/folders/${id}/move`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ parentId }) }),
  trash: (id) => apiFetch(`/folders/${id}`, { method: 'DELETE' }),
  restore: (id) => apiFetch(`/folders/${id}/restore`, { method: 'POST' }),
};

export const shareAPI = {
  create: (body) => apiFetch('/shares', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  list: () => apiFetch('/shares'),
  revoke: (id) => apiFetch(`/shares/${id}`, { method: 'DELETE' }),
  access: (token, password) => {
    const q = password ? `?password=${encodeURIComponent(password)}` : '';
    return apiFetch(`/shares/public/${token}${q}`);
  },
  downloadUrl: (token, password) => {
    const q = password ? `?password=${encodeURIComponent(password)}` : '';
    return `${API}/shares/public/${token}/download${q}`;
  },
};

export const trashAPI = {
  list: () => apiFetch('/trash'),
  empty: () => apiFetch('/trash', { method: 'DELETE' }),
};

export const userAPI = {
  update: (name) => apiFetch('/users/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) }),
  password: (currentPassword, newPassword) =>
    apiFetch('/users/me/password', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword, newPassword }) }),
};

export const adminAPI = {
  stats: () => apiFetch('/admin/stats'),
  users: (params = {}) => {
    const q = new URLSearchParams(params);
    return apiFetch(`/admin/users?${q}`);
  },
  updateUser: (id, body) => apiFetch(`/admin/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  deleteUser: (id) => apiFetch(`/admin/users/${id}`, { method: 'DELETE' }),
  auditLogs: (params = {}) => {
    const q = new URLSearchParams(params);
    return apiFetch(`/admin/audit-logs?${q}`);
  },
};
