import { databases, APPWRITE_DB_ID } from './appwrite';
import { Query } from 'appwrite';

// ============================================================
// Status Mapping & Labels
// ============================================================
export const STATUS_MAP: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Menunggu Verifikasi',
  revisi_done: 'Revisi Selesai',
  revision_requested: 'Revisi Diperlukan',
  revisi: 'Perlu Revisi',
  diverifikasi: 'Diverifikasi Verifikator',
  verified: 'Terverifikasi',
  pending_ppk: 'Menunggu PPK',
  approved_ppk: 'Disetujui PPK',
  approved_wadir: 'Disetujui Wadir',
  accepted_funds: 'Dana Diterima',
  funds_disbursed: 'Dana Cair',
  rejected: 'Ditolak',
  ditolak: 'Ditolak',
  lpj_pending: 'LPJ Pending',
  lpj_submitted: 'LPJ Disubmit',
  lpj_revision: 'LPJ Perlu Revisi',
  lpj_approved: 'LPJ Disetujui',
  lpj_verified: 'LPJ Terverifikasi',
  lpj_rejected: 'LPJ Ditolak',
  lpj_done: 'Selesai',
  selesai: 'Selesai',
  completed: 'Selesai',
};

export function getStatusLabel(status: string): string {
  return STATUS_MAP[status?.toLowerCase()] || status?.replace(/_/g, ' ') || '-';
}

export type StatusColor = 'green' | 'amber' | 'red' | 'blue' | 'indigo' | 'rose' | 'slate';

export function getStatusColor(status: string): StatusColor {
  const s = status?.toLowerCase() || '';
  if (['completed', 'selesai', 'lpj_done', 'lpj_approved', 'lpj_verified'].includes(s)) return 'green';
  if (['rejected', 'ditolak', 'lpj_rejected'].includes(s)) return 'red';
  if (['revision_requested', 'revisi', 'lpj_revision'].includes(s)) return 'rose';
  if (['verified', 'diverifikasi', 'approved_ppk', 'approved_wadir'].includes(s)) return 'blue';
  if (['accepted_funds', 'funds_disbursed'].includes(s)) return 'indigo';
  if (['draft'].includes(s)) return 'slate';
  return 'amber';
}

export const STATUS_COLOR_CLASSES: Record<StatusColor, string> = {
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
  slate: 'bg-slate-100 text-slate-600 border-slate-200',
};

// ============================================================
// Progress Steps (Workflow Tracker)
// ============================================================
export interface ProgressStep {
  label: string;
  description: string;
  status: 'waiting' | 'pending' | 'success' | 'revisi' | 'stuck';
}

export function getProgressSteps(status: string): ProgressStep[] {
  const steps: ProgressStep[] = [
    { label: 'Pengusul', description: 'Mengunggah dokumen KAK dan RAB.', status: 'waiting' },
    { label: 'Verifikator', description: 'Memeriksa kelengkapan dokumen.', status: 'waiting' },
    { label: 'PPK', description: 'Proses penetapan oleh PPK.', status: 'waiting' },
    { label: 'Wadir', description: 'Menunggu persetujuan Wadir.', status: 'waiting' },
    { label: 'Bendahara', description: 'Proses pencairan dana.', status: 'waiting' },
  ];

  const s = status?.toLowerCase() || '';

  if (s === 'submitted' || s === 'revisi_done' || s === 'diajukan') {
    steps[0].status = 'success'; steps[1].status = 'pending';
  } else if (s === 'revision_requested' || s === 'revisi') {
    steps[0].status = 'success'; steps[1].status = 'revisi';
  } else if (s === 'diverifikasi') {
    steps[0].status = 'pending'; steps[1].status = 'success';
  } else if (s === 'verified' || s === 'pending_ppk') {
    steps[0].status = 'success'; steps[1].status = 'success'; steps[2].status = 'pending';
  } else if (s === 'approved_ppk' || s === 'pending_wadir') {
    steps[0].status = steps[1].status = steps[2].status = 'success'; steps[3].status = 'pending';
  } else if (s === 'approved_wadir') {
    steps[0].status = steps[1].status = steps[2].status = steps[3].status = 'success'; steps[4].status = 'pending';
  } else if (['accepted_funds', 'funds_disbursed', 'lpj_submitted', 'lpj_approved', 'lpj_verified', 'lpj_done', 'selesai', 'completed'].includes(s)) {
    steps.forEach(st => st.status = 'success');
  } else if (s === 'rejected' || s === 'ditolak') {
    // Determine where it got stuck
    // Need a way to know, but let's assume it's stuck at the current step if we can't tell,
    // By default just put stuck at step 1 for now or don't modify it.
    steps[0].status = 'success'; steps[1].status = 'stuck';
  }

  return steps;
}

// ============================================================
// Formatting Helpers
// ============================================================
export function formatCurrency(value: number | string | null | undefined): string {
  const num = typeof value === 'string' ? parseFloat(value) : (value || 0);
  return 'Rp ' + num.toLocaleString('id-ID', { maximumFractionDigits: 0 });
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function formatDateLong(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return 'baru saja';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days > 1) return `${days} hari lalu`;
  if (days === 1) return 'kemarin';
  const hours = Math.floor(diff / 3600000);
  if (hours > 0) return `${hours} jam lalu`;
  const mins = Math.floor(diff / 60000);
  if (mins > 0) return `${mins} menit lalu`;
  return 'baru saja';
}

// ============================================================
// Auth / User Helpers
// ============================================================
export function getCurrentUser(): any | null {
  try {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) return JSON.parse(userStr);
  } catch {}
  return null;
}

export function getUserId(): string {
  const user = getCurrentUser();
  return user?.$id || user?.user_id || '';
}

export function getUserRole(): string {
  const user = getCurrentUser();
  return user?.role || '';
}

export function getUserName(): string {
  const user = getCurrentUser();
  return user?.nama || user?.name || 'User';
}

// ============================================================
// Database Helpers
// ============================================================
export async function fetchKegiatan(queries: any[] = []) {
  const res = await databases.listDocuments(APPWRITE_DB_ID, 'kegiatan', queries);
  return res.documents;
}

export async function fetchKegiatanById(id: string) {
  const doc = await databases.getDocument(APPWRITE_DB_ID, 'kegiatan', id);
  return doc;
}

export async function fetchKAK(kegiatanId: string) {
  const res = await databases.listDocuments(APPWRITE_DB_ID, 'kak', [
    Query.equal('kegiatan_id', kegiatanId)
  ]);
  return res.documents[0] || null;
}

export async function fetchIKU(kegiatanId: string) {
  const res = await databases.listDocuments(APPWRITE_DB_ID, 'iku', [
    Query.equal('kegiatan_id', kegiatanId)
  ]);
  return res.documents;
}

export async function fetchRAB(kegiatanId: string) {
  const res = await databases.listDocuments(APPWRITE_DB_ID, 'rab', [
    Query.equal('kegiatan_id', kegiatanId)
  ]);
  return res.documents;
}

export async function fetchUsers(queries: any[] = []) {
  const res = await databases.listDocuments(APPWRITE_DB_ID, 'users', queries);
  return res.documents;
}
