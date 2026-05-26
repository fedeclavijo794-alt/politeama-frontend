const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('politeama_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401) {
    localStorage.removeItem('politeama_token');
    localStorage.removeItem('politeama_user');
    window.dispatchEvent(new Event('auth:logout'));
    throw new Error('Sesión expirada. Iniciá sesión nuevamente.');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Error en la solicitud');
  }
  return res.json();
}

export const api = {
  get:    (path)        => request(path),
  post:   (path, body)  => request(path, { method: 'POST',   body }),
  put:    (path, body)  => request(path, { method: 'PUT',    body }),
  delete: (path)        => request(path, { method: 'DELETE' }),
};
