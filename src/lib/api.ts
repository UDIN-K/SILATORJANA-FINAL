/// <reference types="vite/client" />
/**
 * Si-LATORJANA API Client
 * Centralized fetch wrapper for Laravel backend API.
 * All requests go through Vite proxy → Laravel (localhost:8000).
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// ============================================================
// Token Management
// ============================================================
export function getToken(): string | null {
  const urlToken = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('token') : null;
  return urlToken || localStorage.getItem('auth_token');
}

export function setToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

export function removeToken(): void {
  localStorage.removeItem('auth_token');
}

// ============================================================
// Core Fetch Wrapper
// ============================================================
async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...((options.headers as Record<string, string>) || {}),
  };

  // Add Content-Type for JSON body (but not for FormData)
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Add auth token
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 401 → redirect to login
  if (response.status === 401) {
    removeToken();
    localStorage.removeItem('currentUser');
    window.location.href = '/login';
    throw new Error('Sesi telah berakhir. Silakan login kembali.');
  }

  // Handle validation errors (422)
  if (response.status === 422) {
    const data = await response.json();
    const firstError = Object.values(data.errors || {})[0];
    throw new Error(
      Array.isArray(firstError) ? firstError[0] : (data.message || 'Validasi gagal.')
    );
  }

  // Handle other errors
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || data.error || `Request gagal (${response.status})`);
  }

  // Handle 204 No Content
  if (response.status === 204) return {} as T;

  return response.json();
}

// ============================================================
// Auth API
// ============================================================
export async function apiLogin(email: string, password: string) {
  const data = await apiFetch<{ user: any; token: string }>('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  // Store token and user
  if (data.token) setToken(data.token);
  localStorage.setItem('currentUser', JSON.stringify(data.user));

  return data;
}

export async function apiLogout() {
  try {
    await apiFetch('/logout', { method: 'POST' });
  } finally {
    removeToken();
    localStorage.removeItem('currentUser');
  }
}

export async function apiGetMe() {
  return apiFetch<{ user: any }>('/me');
}

// ============================================================
// Kegiatan API
// ============================================================
export async function apiListKegiatan(params: Record<string, string> = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/kegiatan${query ? '?' + query : ''}`);
}

export async function apiGetKegiatan(id: string | number) {
  return apiFetch(`/kegiatan/${id}`);
}

export async function apiCreateKegiatan(data: any) {
  return apiFetch('/kegiatan', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiUpdateKegiatan(id: string | number, data: any) {
  return apiFetch(`/kegiatan/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function apiDeleteKegiatan(id: string | number) {
  return apiFetch(`/kegiatan/${id}`, { method: 'DELETE' });
}

// ============================================================
// Users API
// ============================================================
export async function apiListUsers(params: Record<string, string> = {}) {
  const query = new URLSearchParams(params).toString();
  return apiFetch(`/users${query ? '?' + query : ''}`);
}

export async function apiGetUser(id: string | number) {
  return apiFetch(`/users/${id}`);
}

export async function apiCreateUser(data: any) {
  return apiFetch('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiUpdateUser(id: string | number, data: any) {
  return apiFetch(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function apiDeleteUser(id: string | number) {
  return apiFetch(`/users/${id}`, { method: 'DELETE' });
}

// ============================================================
// IKU Master API
// ============================================================
export async function apiListIkuMaster() {
  return apiFetch('/iku-master');
}

export async function apiCreateIkuMaster(data: any) {
  return apiFetch('/iku-master', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function apiUpdateIkuMaster(id: string | number, data: any) {
  return apiFetch(`/iku-master/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function apiDeleteIkuMaster(id: string | number) {
  return apiFetch(`/iku-master/${id}`, { method: 'DELETE' });
}

// ============================================================
// Stats API
// ============================================================
export async function apiGetStats() {
  return apiFetch('/stats');
}

// ============================================================
// LPJ API
// ============================================================

/** Get LPJ detail: RAB grouped by kategori with existing realisasi and files */
export async function apiGetLpjDetail(kegiatanId: string | number) {
  return apiFetch(`/lpj/detail/${kegiatanId}`);
}

/** Submit LPJ with realisasi data and file uploads via FormData */
export async function apiSubmitLpj(formData: FormData) {
  return apiFetch('/lpj/submit', {
    method: 'POST',
    body: formData,
    // Don't set Content-Type — browser sets it automatically with boundary for FormData
  });
}

/** Delete an LPJ file */
export async function apiDeleteLpjFile(fileId: string | number) {
  return apiFetch(`/lpj/file/${fileId}`, { method: 'DELETE' });
}

/** Legacy: simple create LPJ record */
export async function apiCreateLpj(data: any) {
  return apiFetch('/lpj', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** Legacy: get LPJ record */
export async function apiGetLpj(kegiatanId: string | number) {
  return apiFetch(`/lpj/${kegiatanId}`);
}

/** Submit proposal to PPK (uploads surat pengantar & penanggung jawab) */
export async function apiSubmitPpk(id: string | number, data: {
  surat_pengantar_path?: string;
  surat_pengantar_filename?: string;
  penanggung_jawab?: string[];
}) {
  return apiFetch(`/kegiatan/${id}/submit-ppk`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** Record partial/full disbursement of funds */
export async function apiTambahPencairan(id: string | number, data: {
  persentase: number;
  catatan?: string;
}) {
  return apiFetch(`/kegiatan/${id}/pencairan`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** Mark disbursements as taken by the pengusul (Ambil Uang Muka) */
export async function apiAmbilUangMuka(id: string | number) {
  return apiFetch(`/kegiatan/${id}/ambil-uang-muka`, {
    method: 'POST',
  });
}

/** Upload a file (surat_pengantar, file_kak, or lpj_file) */
export async function apiUploadFile(file: File, type: 'surat_pengantar' | 'file_kak' | 'lpj_file') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  return apiFetch('/upload', {
    method: 'POST',
    body: formData,
  });
}



// ============================================================
// Health Check
// ============================================================
export async function apiHealthCheck() {
  return apiFetch('/health');
}

// ============================================================
// Axios-like interface for dynamic imports
// Usage: const { default: api } = await import('@/lib/api');
//        api.get('/api/something')
// ============================================================
const api = {
  get: (url: string) => apiFetch(url.replace(/^\/api/, '')).then(data => ({ data })),
  post: (url: string, body?: any) =>
    apiFetch(url.replace(/^\/api/, ''), { method: 'POST', body: body ? JSON.stringify(body) : undefined }).then(data => ({ data })),
  put: (url: string, body?: any) =>
    apiFetch(url.replace(/^\/api/, ''), { method: 'PUT', body: body ? JSON.stringify(body) : undefined }).then(data => ({ data })),
  delete: (url: string) =>
    apiFetch(url.replace(/^\/api/, ''), { method: 'DELETE' }).then(data => ({ data })),
};

export default api;


