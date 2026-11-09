const API_BASE = '/api';

// Helper to get token from localStorage
const getStoredToken = () => localStorage.getItem('warehouse_token');
const setStoredToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('warehouse_token', token);
  } else {
    localStorage.removeItem('warehouse_token');
  }
};

export async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(opts.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  headers.set('Content-Type', 'application/json');

  const resp = await fetch(`${API_BASE}${path}`, { ...opts, headers });

  if (!resp.ok) {
    let errMessage = resp.statusText;
    // Auto logout only for authenticated requests (not the login request itself)
    if (resp.status === 401 && token && path !== '/auth/login') {
      setStoredToken(null);
      localStorage.removeItem('warehouse_user');
      localStorage.removeItem('activeTab');
      window.location.reload();
    }
    try {
      const err = await resp.json();
      errMessage = err.message || errMessage;
    } catch (_e) { /* ignore parse error */ }
    throw new Error(errMessage);
  }
  return resp.json();
}

// ── Auth ──
export async function apiLogin(username: string, password: string) {
  const data = await request<{ token: string; user: any }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  setStoredToken(data.token);
  // Store user info temporarily to help with initial load
  localStorage.setItem('warehouse_user', JSON.stringify(data.user));
  return data.user;
}

export async function apiFetchDashboard() {
  return request<any>('/dashboard/all-data');
}

// ── Goods ──
export const apiGoods = {
  create: (p: any) => request<any>('/goods', { method: 'POST', body: JSON.stringify(p) }),
  delete: (id: string) => request<void>(`/goods/${id}`, { method: 'DELETE' }),
};

export const apiGoodsTransactions = {
  create: (p: any) => request<any>('/goods/transactions', { method: 'POST', body: JSON.stringify(p) }),
};

// ── Equipment ──
export const apiEquipment = {
  create: (p: any) => request<any>('/equipment', { method: 'POST', body: JSON.stringify(p) }),
  delete: (id: string) => request<void>(`/equipment/${id}`, { method: 'DELETE' }),
  updateCondition: (id: string, condition: string) =>
    request<any>(`/equipment/${id}/condition`, { method: 'PATCH', body: JSON.stringify({ condition }) }),
  logCreate: (p: any) => request<any>('/equipment/logs', { method: 'POST', body: JSON.stringify(p) }),
};

// ── Vehicles ──
export const apiVehicles = {
  create: (p: any) => request<any>('/vehicles', { method: 'POST', body: JSON.stringify(p) }),
  delete: (id: string) => request<void>(`/vehicles/${id}`, { method: 'DELETE' }),
  updateStatus: (id: string, status: string) =>
    request<any>(`/vehicles/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  logCreate: (p: any) => request<any>('/vehicles/logs', { method: 'POST', body: JSON.stringify(p) }),
  finishTrip: (logId: string, endOdometer?: number) =>
    request<any>(`/vehicles/logs/${logId}/finish`, { method: 'PATCH', body: JSON.stringify({ endOdometer }) }),
  needCreate: (p: any) => request<any>('/vehicles/needs', { method: 'POST', body: JSON.stringify(p) }),
};

// ── Technicians ──
export const apiTechnicians = {
  create: (p: any) => request<any>('/technicians', { method: 'POST', body: JSON.stringify(p) }),
  delete: (id: string) => request<void>(`/technicians/${id}`, { method: 'DELETE' }),
};

// ── Companies ──
export const apiCompanies = {
  create: (p: any) => request<any>('/companies', { method: 'POST', body: JSON.stringify(p) }),
  update: (id: string, p: any) =>
    request<any>(`/companies/${id}`, { method: 'PUT', body: JSON.stringify(p) }),
  toggleDisabled: (id: string, disabled: boolean) =>
    request<any>(`/companies/${id}/disabled`, { method: 'PATCH', body: JSON.stringify({ disabled }) }),
  delete: (id: string) => request<void>(`/companies/${id}`, { method: 'DELETE' }),
};

// ── Users ──
export const apiUsers = {
  create: (p: any) => request<any>('/users', { method: 'POST', body: JSON.stringify(p) }),
  update: (id: string, p: any) =>
    request<any>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(p) }),
  toggleDisabled: (id: string, disabled: boolean) =>
    request<any>(`/users/${id}/disabled`, { method: 'PATCH', body: JSON.stringify({ disabled }) }),
  delete: (id: string) => request<void>(`/users/${id}`, { method: 'DELETE' }),
};

export const apiLogout = () => {
  setStoredToken(null);
  localStorage.removeItem('warehouse_user');
};
