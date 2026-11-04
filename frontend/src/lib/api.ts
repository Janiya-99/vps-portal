export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // sends and receives HttpOnly cookies
  });

  if (!res.ok) {
    let errorMsg = `Request failed: ${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      if (data && data.error) {
        errorMsg = data.error;
      }
    } catch {
      // fallback to statusText
    }
    throw new ApiError(errorMsg, res.status);
  }

  return res.json();
}

export const api = {
  // Auth
  getMe: () => fetchJson<{ authenticated: boolean; username: string }>('/api/v1/auth/me'),
  login: (username: string, password: string) =>
    fetchJson<{ message: string; username: string }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  logout: () => fetchJson<{ message: string }>('/api/v1/auth/logout', { method: 'POST' }),

  // Containers
  getContainers: () => fetchJson<any[]>('/api/v1/containers'),
  containerAction: (id: string, action: 'start' | 'stop' | 'restart' | 'rebuild') =>
    fetchJson<{ message: string }>(`/api/v1/containers/${id}/${action}`, { method: 'POST' }),
  getAppEnv: (slug: string) => fetchJson<{ env: string }>(`/api/v1/apps/${slug}/env`),
  updateAppEnv: (slug: string, env: string) =>
    fetchJson<{ message: string }>(`/api/v1/apps/${slug}/env`, {
      method: 'PUT',
      body: JSON.stringify({ env }),
    }),
  scaffoldApp: (data: any) =>
    fetchJson<{ message: string; slug: string }>('/api/v1/apps/scaffold', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Database & Redis
  getDatabases: () => fetchJson<any[]>('/api/v1/databases'),
  provisionDatabase: (name: string) =>
    fetchJson<{ message: string; credentials: any }>('/api/v1/databases', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  dumpDatabase: (name: string) =>
    fetchJson<{ message: string; file: string }>(`/api/v1/databases/${name}/dump`, {
      method: 'POST',
    }),
  getRedisStats: () => fetchJson<any>('/api/v1/redis/stats'),
  flushRedis: () => fetchJson<{ message: string }>('/api/v1/redis/flush', { method: 'POST' }),

  // Proxy
  getProxyHosts: () => fetchJson<any[]>('/api/v1/proxy/hosts'),
  createProxyHost: (data: any) =>
    fetchJson<{ message: string }>('/api/v1/proxy/hosts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Ops & Backups
  getBackups: () => fetchJson<any[]>('/api/v1/ops/backups'),
  runBackup: () => fetchJson<{ message: string; file: string }>('/api/v1/ops/backups/run', { method: 'POST' }),
  runDockerPrune: () => fetchJson<{ message: string; output: string }>('/api/v1/ops/prune', { method: 'POST' }),
};
