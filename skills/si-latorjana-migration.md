# Si-LATORJANA — Skill Document (Updated 2026-06-03)

> **Tujuan**: Dokumen referensi lengkap agar agent manapun bisa melanjutkan development tanpa kehilangan konteks.
> **PENTING**: Dokumen ini mencerminkan kondisi AKTUAL project. Jangan refer ke Appwrite atau server.ts lama — sudah TIDAK dipakai.

---

## 1. Overview Proyek

**Si-LATORJANA** (Sistem Layanan Terpadu Administrasi Pengajuan) adalah sistem manajemen kegiatan kampus Politeknik Negeri Jakarta. Mengelola alur pengajuan proposal kegiatan dari pengusul (mahasiswa/dosen) melalui multi-level approval (verifikator → PPK → wadir) sampai pencairan dana dan pertanggungjawaban (LPJ).

### Arsitektur Saat Ini (Aktual)

| Aspek | Implementasi |
|---|---|
| **Lokasi Frontend** | `/home/udin/SILATORJANA/` |
| **Lokasi Backend** | `/home/udin/SILATORJANA/backend/` |
| **Backend** | **Laravel** + Sanctum auth |
| **Frontend** | React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui |
| **Database** | **MySQL / MariaDB** — `silatorjana` @ `127.0.0.1:3306` (user: `udin`, pass: `123`) |
| **Auth** | Laravel Sanctum — `POST /api/login` → Bearer token di `localStorage` (`auth_token`) |
| **API Client** | `src/lib/api.ts` — centralized fetch wrapper, auto 401 redirect ke `/login` |
| **Proxy** | Vite dev server proxy: `/api` → `http://localhost:8000` |
| **Server Dev** | Frontend: `npm run dev` (Vite, port 3000) + Backend: `php artisan serve --port=8000` |
| **Font** | Plus Jakarta Sans (Google Fonts CDN, di `index.html`) |
| **Warna** | Emerald green palette |
| **Package type** | `"type": "module"` (ESM) |

### ⚠️ APPWRITE SUDAH TIDAK DIPAKAI
- `server.ts` / Express proxy lama: **SUDAH TIDAK ADA**
- `src/lib/appwrite.ts`: **SUDAH TIDAK ADA**
- Semua data fetch via `src/lib/api.ts` → Laravel API

---

## 2. Cara Run

```bash
# Terminal 1: Laravel Backend
cd /home/udin/SILATORJANA/backend
php artisan serve --port=8000

# Terminal 2: React Frontend (Vite)
cd /home/udin/SILATORJANA
npm run dev
```

Frontend: `http://localhost:3000` | Backend: `http://localhost:8000`
Vite proxy `/api/*` → `http://localhost:8000/api/*`

> MariaDB/MySQL **harus running** di `127.0.0.1:3306` sebelum jalankan backend.

### Testing Login Cepat
Di LoginPage ada dropdown "Login Cepat" dengan akun test (password: `12345678`):
- `admin@si-latorjana.com`
- `verifikator@si-latorjana.com`
- `ppk@si-latorjana.com`
- `wadir2@si-latorjana.com`
- `bendahara@si-latorjana.com`
- `rektorat@si-latorjana.com`
- `tik@si-latorjana.com` (Pengusul TIK)
- `mesin@si-latorjana.com` (Pengusul MESIN)

Password di-hash bcrypt via Laravel. Login endpoint: `POST /api/login`.

---

## 3. Laravel Backend

### Konfigurasi Database (dari `backend/.env`)
```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=silatorjana
DB_USERNAME=udin
DB_PASSWORD=123
```

### Struktur Backend
```
/home/udin/SILATORJANA/backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/Api/
│   │   │   ├── AuthController.php       # login, logout, me
│   │   │   ├── KegiatanController.php   # CRUD kegiatan + nested KAK/IKU/RAB
│   │   │   ├── UserController.php       # CRUD users (admin only)
│   │   │   └── IkuMasterController.php  # CRUD IKU master (admin only)
│   │   └── Middleware/
│   │       └── CheckRole.php            # middleware('role:admin,verifikator,...')
│   ├── Models/
│   │   ├── Kegiatan.php    # auto status-history on status update
│   │   ├── Kak.php
│   │   ├── Iku.php
│   │   ├── Rab.php         # calculateTotal() method
│   │   ├── IkuMaster.php
│   │   ├── StatusHistory.php
│   │   ├── Lpj.php
│   │   ├── Jurusan.php
│   │   └── User.php
└── routes/
    └── api.php             # semua API routes
```

### Database Schema (MySQL/MariaDB, database: `silatorjana`)

**Tabel `kegiatan`**:
```
id, nama_kegiatan, deskripsi, jenis_kegiatan, status, pengusul_id, pengusul_nama,
pengusul_organisasi, nama_jurusan, tanggal_kegiatan, tempat, total_anggaran,
catatan_revisi, surat_pengantar, verifikator_target, kode_mak, penanggung_jawab (JSON),
surat_pengantar_filename, surat_pengantar_path, surat_pengantar_uploaded_at,
uang_muka_diambil, deadline_lpj, approved_by, created_at, updated_at
```

**Tabel `kaks`** (1:1 ke kegiatan):
```
id, kegiatan_id, gambaran_umum, penerima_manfaat, strategi_pencapaian,
metode_pelaksanaan, tahapan_pelaksanaan, indikator_kinerja (JSON string),
kurun_waktu_mulai, kurun_waktu_selesai, created_at, updated_at
```

**Tabel `ikus`** (1:N ke kegiatan):
```
id, kegiatan_id, nama_iku, target_persen, created_at, updated_at
```

**Tabel `rabs`** (1:N ke kegiatan):
```
id, kegiatan_id, uraian, kategori, harga_satuan,
qty1, satuan1, qty2, satuan2, qty3, satuan3, total, created_at, updated_at
```
> Total dihitung: `qty1 × qty2 × qty3 × harga_satuan` (fallback ke qty1 × harga_satuan)

**Tabel `users`**:
```
id, nama, email, password (bcrypt), role, jurusan, nip, verifikator_unit, created_at, updated_at
```

**Tabel `iku_masters`**: `id, nama_indikator, is_visible, ...`

**Tabel `status_histories`**:
```
id, ref_type, ref_id, status_lama, status_baru, catatan, user_id, user_nama, user_role, ...
```
> Auto-created oleh `Kegiatan` model saat field `status` berubah (via `booted()` observer).

**Tabel `lpjs`**:
```
id, kegiatan_id, catatan_pengusul, file_lpj, tanggal_pengajuan, deadline, verified_by, catatan_bendahara, catatan_lama, ...
```

**Tabel `lpj_files`**:
```
file_id, lpj_id, kegiatan_id, kategori, rab_id, filename, original_name, file_size, uploaded_at
```

**Tabel `rab_realisasi`**:
```
realisasi_id, kegiatan_id, rab_id, qty1, satuan1, qty2, satuan2, qty3, satuan3, harga_satuan, total, created_at, updated_at
```

**Tabel `pencairan_dana`**:
```
id, kegiatan_id, persentase, nominal, tanggal_pencairan, tanggal_pengambilan, is_taken, catatan, created_by, created_at, updated_at
```

**Tabel `jurusans`**: `id, nama_jurusan, kode_jurusan, ...`

### Status Workflow
```
draft → submitted → verified → pending_ppk → approved_ppk → approved_wadir
      → accepted_funds → funds_disbursed
      → lpj_submitted → lpj_approved → lpj_done / completed

Cabang: revision_requested / revisi  (dikembalikan revisi)
        rejected / ditolak           (penolakan final)
        lpj_revision / lpj_rejected  (revisi/penolakan LPJ)
```

### Laravel API Endpoints (semua prefix `/api/`)

| Endpoint | Method | Auth | Role | Fungsi |
|---|---|---|---|---|
| `/api/login` | POST | ❌ | — | Login → `{ user, token }` |
| `/api/health` | GET | ❌ | — | Health check |
| `/api/logout` | POST | ✅ | any | Logout, hapus token |
| `/api/me` | GET | ✅ | any | Get current user |
| `/api/kegiatan` | GET | ✅ | any | List (auto-filter by role). Params: `?status=`, `?jurusan=`, `?search=`, `?limit=`, `?pengusul_id=`, `?archive=` |
| `/api/kegiatan/{id}` | GET | ✅ | any | Detail + relasi eager: `kak`, `iku`, `rab`, `pengusul`, `pencairanDana` |
| `/api/kegiatan` | POST | ✅ | pengusul,admin | Buat kegiatan (nested KAK+IKU+RAB sekaligus) |
| `/api/kegiatan/{id}` | PUT/PATCH | ✅ | semua role workflow | Update kegiatan/status |
| `/api/kegiatan/{id}/submit-ppk` | POST | ✅ | pengusul | Meneruskan usulan ke PPK (surat pengantar + penanggung jawab) |
| `/api/kegiatan/{id}/pencairan` | POST | ✅ | bendahara | Tambah riwayat pencairan dana bertahap |
| `/api/kegiatan/{id}/ambil-uang-muka` | POST | ✅ | pengusul | Konfirmasi penarikan uang muka oleh pengusul |
| `/api/kegiatan/{id}` | DELETE | ✅ | pengusul,admin | Hapus kegiatan |
| `/api/users` | GET/POST/PUT/DELETE | ✅ | admin | CRUD users |
| `/api/users/{id}` | GET | ✅ | any | View user |
| `/api/iku-master` | CRUD | ✅ | admin | CRUD IKU master |
| `/api/stats` | GET | ✅ | any | Stats dashboard (filtered by role) |
| `/api/status-history/{type}/{id}` | GET | ✅ | any | Timeline status |
| `/api/jurusan` | GET | ✅ | any | List jurusan |
| `/api/lpj/detail/{kegiatan_id}` | GET | ✅ | any | Get LPJ detail dengan RAB realisasi & kuitansi |
| `/api/lpj/submit` | POST | ✅ | pengusul | Submit LPJ dengan realisasi RAB & multi-upload berkas |
| `/api/lpj/file/{file_id}` | DELETE | ✅ | pengusul | Hapus file kuitansi LPJ |
| `/api/lpj` | POST | ✅ | any | (Legacy) Submit LPJ record |
| `/api/lpj/{kegiatan_id}` | GET | ✅ | any | (Legacy) Get LPJ |
| `/api/change-password` | POST | ✅ | any | Ganti password |
| `/api/upload` | POST | ✅ | any | Upload file (max 10MB: surat_pengantar, file_kak, lpj_file) |
| `/api/notifications` | GET | ✅ | any | Recent notifications (filtered by role) |
| `/api/system-health` | GET | ✅ | any | DB + storage health check |
| `/api/chat` | POST | ❌ | — | Jana AI chatbot (OpenRouter → `google/gemini-2.0-flash-001`) |


---

## 4. Frontend React

### Tech Stack
- React 19 + TypeScript
- Vite 6+ (ESM)
- Tailwind CSS v4 + shadcn/ui (base-nova style, neutral)
- lucide-react, motion v12, react-router-dom v7
- **TIDAK ADA**: appwrite SDK, Express server, server.ts

### Struktur Folder Frontend
```
/home/udin/SILATORJANA/
├── index.html              # Plus Jakarta Sans CDN, Material Icons CDN
├── package.json            # type: "module"
├── vite.config.ts          # proxy /api → localhost:8000, alias @/ → ./src
├── components.json         # shadcn config (base-nova, neutral, lucide)
├── skills/                 # Skill documents (file ini)
└── src/
    ├── App.tsx             # Semua routes
    ├── index.css           # Global CSS, Tailwind tokens
    ├── layouts/
    │   └── RoleLayout.tsx  # Sidebar + topbar + NotificationDropdown + logout
    ├── lib/
    │   ├── api.ts          # ⭐ API client utama (SEMUA fetch via sini)
    │   ├── helpers.ts      # Status mapping, formatters, fetch wrappers
    │   └── utils.ts        # shadcn cn()
    ├── components/
    │   ├── MonitoringPage.tsx
    │   ├── ProgressTracker.tsx
    │   ├── StatusBadge.tsx
    │   ├── NotificationDropdown.tsx
    │   ├── JanaAssistant.tsx        # AI chatbot → POST /api/chat
    │   ├── CalendarWidget.tsx
    │   ├── AppLogo.tsx
    │   └── ui/                      # shadcn components
    └── pages/
        ├── LandingPage.tsx
        ├── auth/              # LoginPage, ForgotPasswordPage
        ├── dashboard/         # DashboardIndex, GenericDashboard
        ├── admin/             # AdminDashboard, UserManagementPage, UserFormPage, UserDetailPage, IkuConfigPage, AdminMonitoringPage
        ├── pengusul/          # PengusulDashboard, UsulanPage, CreateUsulanPage, DetailUsulanPage, EditRevisiPage, LpjPage, NeedsWorkPage, HistoryPage, HistoryDetailPage, PengusulMonitoringPage, PrintProposalPage, PanduanPage, TemplatePage
        ├── verifikator/       # VerifikatorDashboard, VerifikatorProposalList, VerifikasiDetailPage, RevisiFormPage, VerifikatorMonitoringPage
        ├── ppk/               # PpkDashboard, PpkProposalList, PpkMonitoringPage
        ├── wadir/             # WadirDashboard, WadirProposalList, WadirMonitoringPage
        ├── bendahara/         # BendaharaDashboard, BendaharaProposalList, BendaharaDetailPage, PencairanPage, LpjVerificationPage, BendaharaMonitoringPage
        ├── rektorat/          # RektoratDashboard, RektoratLaporanPage, RekapJurusanPage, RektoratDetailPage, RektoratTimelinePage, RektoratMonitoringPage
        ├── approval/          # (folder ada, belum di-route)
        └── shared/            # ProfilePage, ReviewApprovalPage, ArchivePage
```

### Semua Routes (dari App.tsx)

```
/                             → LandingPage
/login                        → LoginPage
/forgot-password              → ForgotPasswordPage
/dashboard (RoleLayout)
  /dashboard/admin            → AdminDashboard
  /dashboard/admin/users      → UserManagementPage
  /dashboard/admin/users/tambah        → UserFormPage (create)
  /dashboard/admin/users/edit/:id      → UserFormPage (edit)
  /dashboard/admin/users/:id           → UserDetailPage
  /dashboard/admin/master     → IkuConfigPage
  /dashboard/admin/monitoring → AdminMonitoringPage
  /dashboard/admin/profile    → ProfilePage

  /dashboard/pengusul         → PengusulDashboard
  /dashboard/pengusul/usulan  → UsulanPage
  /dashboard/pengusul/usulan/baru      → CreateUsulanPage
  /dashboard/pengusul/usulan/:id       → DetailUsulanPage
  /dashboard/pengusul/lpj/:id          → LpjPage
  /dashboard/pengusul/needs-work       → NeedsWorkPage
  /dashboard/pengusul/revisi/:id       → EditRevisiPage
  /dashboard/pengusul/print/:id        → PrintProposalPage
  /dashboard/pengusul/history          → HistoryPage
  /dashboard/pengusul/history/:id      → HistoryDetailPage
  /dashboard/pengusul/monitoring       → PengusulMonitoringPage
  /dashboard/pengusul/panduan          → PanduanPage
  /dashboard/pengusul/template         → TemplatePage
  /dashboard/pengusul/profile          → ProfilePage

  /dashboard/verifikator      → VerifikatorDashboard
  /dashboard/verifikator/proposals     → VerifikatorProposalList
  /dashboard/verifikator/usulan/:id    → VerifikasiDetailPage
  /dashboard/verifikator/revisi/:id    → RevisiFormPage
  /dashboard/verifikator/monitoring    → VerifikatorMonitoringPage
  /dashboard/verifikator/archive       → VerifikatorArchivePage
  /dashboard/verifikator/profile       → ProfilePage

  /dashboard/ppk              → PpkDashboard
  /dashboard/ppk/proposals    → PpkProposalList
  /dashboard/ppk/review/:id   → ReviewApprovalPage (approveStatus=approved_ppk)
  /dashboard/ppk/monitoring   → PpkMonitoringPage
  /dashboard/ppk/archive      → PpkArchivePage
  /dashboard/ppk/profile      → ProfilePage

  /dashboard/wadir2           → WadirDashboard
  /dashboard/wadir2/proposals → WadirProposalList
  /dashboard/wadir2/review/:id → ReviewApprovalPage (approveStatus=approved_wadir)
  /dashboard/wadir2/monitoring → WadirMonitoringPage
  /dashboard/wadir2/archive   → WadirArchivePage
  /dashboard/wadir2/profile   → ProfilePage

  /dashboard/bendahara        → BendaharaDashboard
  /dashboard/bendahara/proposals       → BendaharaProposalList
  /dashboard/bendahara/detail/:id      → BendaharaDetailPage
  /dashboard/bendahara/pencairan/:id   → PencairanPage
  /dashboard/bendahara/lpj/:id         → LpjVerificationPage
  /dashboard/bendahara/monitoring      → BendaharaMonitoringPage
  /dashboard/bendahara/profile         → ProfilePage

  /dashboard/rektorat         → RektoratDashboard
  /dashboard/rektorat/laporan → RektoratLaporanPage
  /dashboard/rektorat/rekap-jurusan    → RekapJurusanPage
  /dashboard/rektorat/detail/:id       → RektoratDetailPage
  /dashboard/rektorat/timeline/:id     → RektoratTimelinePage
  /dashboard/rektorat/monitoring       → RektoratMonitoringPage
  /dashboard/rektorat/profile          → ProfilePage
```

---

## 5. Role & Menu Navigation

| Role | Path Dashboard | Sidebar Menu |
|---|---|---|
| `admin` | `/dashboard/admin` | Dashboard, Management Users, Data & Config (IKU), Monitoring |
| `pengusul` | `/dashboard/pengusul` | Dashboard, Usulan Saya, Perlu Revisi, Riwayat, Monitoring, Panduan, Template |
| `verifikator` | `/dashboard/verifikator` | Dashboard, Semua Proposal, Archive, Monitoring |
| `ppk` | `/dashboard/ppk` | Dashboard, Semua Proposal, Archive, Monitoring |
| `wadir2` | `/dashboard/wadir2` | Dashboard, Semua Proposal, Archive, Monitoring |
| `bendahara` | `/dashboard/bendahara` | Dashboard, Pencairan & LPJ, Monitoring |
| `rektorat` | `/dashboard/rektorat` | Dashboard, Laporan, Rekap Jurusan, Monitoring |

> Route prefix `wadir2` karena ada field `verifikator_target: wadir1|wadir2|wadir3|wadir4` di kegiatan.

---

## 6. API Client (`src/lib/api.ts`)

**WAJIB** gunakan fungsi dari `api.ts`. Jangan `fetch()` langsung.

```typescript
import { apiLogin, apiLogout, apiGetMe } from '@/lib/api';
import { apiListKegiatan, apiGetKegiatan, apiCreateKegiatan, apiUpdateKegiatan, apiDeleteKegiatan } from '@/lib/api';
import { apiListUsers, apiGetUser, apiCreateUser, apiUpdateUser, apiDeleteUser } from '@/lib/api';
import { apiListIkuMaster, apiCreateIkuMaster, apiUpdateIkuMaster, apiDeleteIkuMaster } from '@/lib/api';
import { apiGetStats, apiCreateLpj, apiGetLpj } from '@/lib/api';
import { getToken, setToken, removeToken } from '@/lib/api';
import api from '@/lib/api'; // axios-like interface
```

### Token & Session
- Token: `localStorage.getItem('auth_token')` via `getToken()`
- User: `localStorage.getItem('currentUser')` — JSON string
- Auto-logout: response 401 → hapus token + redirect `/login`

### Response Patterns
```typescript
// List kegiatan — paginated
const res = await apiListKegiatan({ status: 'submitted', limit: '50' });
// res.data = array kegiatan

// Detail kegiatan — include relasi eager-loaded
const kegiatan = await apiGetKegiatan(id);
// kegiatan.kak, kegiatan.iku[], kegiatan.rab[], kegiatan.pengusul

// Create kegiatan — nested body
await apiCreateKegiatan({
  nama_kegiatan: '...', jenis_kegiatan: '...', status: 'draft',
  verifikator_target: 'wadir2',
  kak: { gambaran_umum: '...', kurun_waktu_mulai: '2026-01-01' },
  iku: [{ nama_iku: '...', target_persen: 85 }],
  rab: [{ uraian: '...', kategori: 'barang', harga_satuan: 50000, qty1: 10, satuan1: 'unit' }],
});

// Update status
await apiUpdateKegiatan(id, { status: 'verified', catatan_revisi: '...' });
```

### Axios-like (alternatif)
```typescript
import api from '@/lib/api';
const { data } = await api.get('/api/kegiatan');
const { data } = await api.post('/api/kegiatan', body);
```

---

## 7. Helpers (`src/lib/helpers.ts`)

```typescript
import {
  getStatusLabel, getStatusColor, STATUS_COLOR_CLASSES, getProgressSteps,
  formatCurrency, formatDate, formatDateLong, timeAgo,
  getCurrentUser, getUserId, getUserRole, getUserName,
  fetchKegiatan, fetchKegiatanById, fetchKAK, fetchIKU, fetchRAB, fetchUsers,
} from '@/lib/helpers';

getStatusLabel('approved_ppk')   // → "Disetujui PPK"
getStatusColor('revision_requested') // → 'rose'
getProgressSteps('verified')     // → array 5 steps
formatCurrency(1500000)          // → "Rp 1.500.000"
getCurrentUser()                 // → parsed JSON dari localStorage
getUserRole()                    // → 'admin' | 'pengusul' | 'verifikator' | dll

const kak = await fetchKAK(id);  // → kegiatan.kak
const iku = await fetchIKU(id);  // → kegiatan.iku[]
const rab = await fetchRAB(id);  // → kegiatan.rab[]
```

---

## 8. Design System

### Color Conventions
- **Primary buttons**: `bg-emerald-700 hover:bg-emerald-800`
- **Outline action**: `text-emerald-700 border-emerald-200 hover:bg-emerald-50`
- **Danger**: `text-red-600 border-red-200 hover:bg-red-50`
- **Warning**: `bg-amber-500 hover:bg-amber-600`
- **Loaders**: `<Loader2 className="animate-spin text-emerald-700 mx-auto size-8" />`
- **Background**: Green leaf gradient `#c8e6c9 → #e8f5e9 → #a5d6a7`
- **Sidebar**: Dark green gradient `#0f5137 → #0b3f2e`, rounded `25px`
- **Cards**: `bg-white shadow-sm border-slate-200`
- **Glassmorphism**: `backdrop-filter: blur(20px)` pada topbar, login page

### Status Badge Colors
| Color | Statuses |
|---|---|
| `green` | completed, selesai, lpj_done, lpj_approved, lpj_verified |
| `amber` | submitted, pending (default) |
| `red` | rejected, ditolak, lpj_rejected |
| `rose` | revision_requested, revisi, lpj_revision |
| `blue` | verified, diverifikasi, approved_ppk, approved_wadir |
| `indigo` | accepted_funds, funds_disbursed |
| `slate` | draft |

### Typography
- **Font**: Plus Jakarta Sans (Google Fonts CDN di `index.html`)
- **Icons**: lucide-react + Material Icons CDN

---

## 9. Coding Patterns

### Standard Page Pattern (BENAR)
```tsx
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { apiListKegiatan, apiUpdateKegiatan } from '@/lib/api';
import { getCurrentUser } from '@/lib/helpers';

export function ExamplePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiListKegiatan({ status: 'submitted' });
        setData(res.data || res);
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
    })();
  }, []);

  if (isLoading) return (
    <div className="py-12 text-center">
      <Loader2 className="animate-spin text-emerald-700 mx-auto size-8" />
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Title</h2>
    </div>
  );
}
```

### ⚠️ JANGAN Gunakan Pola Lama (Appwrite)
```tsx
// ❌ SALAH — Appwrite sudah tidak dipakai, file appwrite.ts tidak ada
import { databases, APPWRITE_DB_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
const res = await databases.listDocuments(APPWRITE_DB_ID, 'kegiatan', [...]);

// ✅ BENAR
import { apiListKegiatan } from '@/lib/api';
const res = await apiListKegiatan({ status: 'submitted' });
```

### Menambah Route Baru
1. Buat `src/pages/{role}/NewPage.tsx`
2. Import + `<Route>` di `src/App.tsx`
3. Tambah menu di `src/layouts/RoleLayout.tsx` → `ROLE_MENUS`
4. `navigate()` untuk navigasi, `useParams()` untuk URL params

### Update Status Kegiatan
```tsx
await apiUpdateKegiatan(id, { status: 'approved_ppk', catatan_revisi: null });
await apiUpdateKegiatan(id, { status: 'revision_requested', catatan_revisi: 'Detail revisi...' });
```

---

## 10. RAB Calculation Logic

```
total = qty1 × qty2 × qty3 × harga_satuan   (jika semua qty ada)
total = qty1 × harga_satuan                  (fallback minimum)
```

RAB dikelompokkan berdasarkan `kategori`: `barang`, `jasa`, `perjalanan`, atau custom.
Setiap kategori punya subtotal. Grand total di bawah.
`PrintProposalPage.tsx` menampilkan RAB grouped by kategori + fungsi `terbilang()` (angka → kata).

---

## 11. File Referensi Penting

| File | Kenapa Penting |
|---|---|
| `src/lib/api.ts` | ⭐ Semua API calls, token management, 401 handler |
| `src/lib/helpers.ts` | Status mapping, formatters, fetch wrappers |
| `src/App.tsx` | Semua routes frontend |
| `src/layouts/RoleLayout.tsx` | Sidebar per role, topbar, NotificationDropdown, logout |
| `src/components/MonitoringPage.tsx` | Shared monitoring (filter, search, table) |
| `src/components/JanaAssistant.tsx` | AI chatbot → POST /api/chat → OpenRouter |
| `src/pages/pengusul/PrintProposalPage.tsx` | PDF print: cover, KAK, IKU, RAB multi-kategori, terbilang |
| `src/pages/shared/ReviewApprovalPage.tsx` | PPK/Wadir review+approve+reject (shared) |
| `src/pages/shared/ArchivePage.tsx` | Archive: 3 role-specific exports |
| `backend/routes/api.php` | Semua Laravel API routes |
| `backend/app/Http/Controllers/Api/KegiatanController.php` | CRUD + nested KAK/IKU/RAB |
| `backend/app/Models/Kegiatan.php` | Auto status-history, semua relasi |
| `vite.config.ts` | Proxy /api → localhost:8000, alias @/ |
| `index.html` | Google Fonts, Material Icons CDN |

---

## 12. Fitur yang Sudah Ada ✅

| # | Fitur | File React |
|---|---|---|
| 1 | Login (glassmorphism, login cepat) | `LoginPage.tsx` |
| 2 | Forgot Password | `ForgotPasswordPage.tsx` |
| 3 | Landing Page | `LandingPage.tsx` |
| 4 | Admin Dashboard | `AdminDashboard.tsx` |
| 5 | User Management CRUD | `UserManagementPage.tsx`, `UserFormPage.tsx`, `UserDetailPage.tsx` |
| 6 | Master IKU Config | `IkuConfigPage.tsx` |
| 7 | Pengusul Dashboard | `PengusulDashboard.tsx` |
| 8 | Daftar Usulan | `UsulanPage.tsx` |
| 9 | Buat Usulan (KAK+IKU+RAB) | `CreateUsulanPage.tsx` |
| 10 | Detail Usulan | `DetailUsulanPage.tsx` |
| 11 | Edit Revisi | `EditRevisiPage.tsx` |
| 12 | Perlu Revisi / Needs Work | `NeedsWorkPage.tsx` |
| 13 | Riwayat Kegiatan | `HistoryPage.tsx`, `HistoryDetailPage.tsx` |
| 14 | LPJ Submit | `LpjPage.tsx` |
| 15 | Export PDF / Print | `PrintProposalPage.tsx` |
| 16 | Panduan Pengusul | `PanduanPage.tsx` |
| 17 | Template Download | `TemplatePage.tsx` |
| 18 | Monitoring (semua role) | `MonitoringPage.tsx` + 7 wrappers |
| 19 | Verifikator Dashboard + List | `VerifikatorDashboard.tsx`, `VerifikatorProposalList.tsx` |
| 20 | Verifikasi Detail (tabbed) | `VerifikasiDetailPage.tsx` |
| 21 | Revisi Form | `RevisiFormPage.tsx` |
| 22 | PPK Dashboard + Review | `PpkDashboard.tsx`, `PpkProposalList.tsx` |
| 23 | Wadir Dashboard + Review | `WadirDashboard.tsx`, `WadirProposalList.tsx` |
| 24 | Bendahara + Pencairan + LPJ | `BendaharaDashboard.tsx`, `PencairanPage.tsx`, `LpjVerificationPage.tsx` |
| 25 | Rektorat + Laporan + Rekap | `RektoratDashboard.tsx`, `RektoratLaporanPage.tsx`, `RekapJurusanPage.tsx` |
| 26 | Timeline Status | `RektoratTimelinePage.tsx` |
| 27 | Profile Page | `ProfilePage.tsx` |
| 28 | Shared Review/Approval | `ReviewApprovalPage.tsx` |
| 29 | Archive Pages | `ArchivePage.tsx` (VerifikatorArchivePage, PpkArchivePage, WadirArchivePage) |
| 30 | Notification Dropdown | `NotificationDropdown.tsx` → `/api/notifications` |
| 31 | AI Chat Assistant (Jana) | `JanaAssistant.tsx` → `/api/chat` |
| 32 | File Upload | POST `/api/upload` (public storage Laravel) |
| 33 | Ganti Password | POST `/api/change-password` |
| 34 | Status History Timeline | GET `/api/status-history/kegiatan/{id}` |

---

## 13. Fitur yang Belum Ada ❌

1. **Chart visualisasi** — Dashboard admin/rektorat hanya angka, belum ada pie/bar chart
2. **Wadir1/3/4 support** — Route hanya ada `wadir2`, wadir lain belum ada halaman
3. **Admin Intervensi** — `AdminMonitoringPage` belum bisa force-change status
4. **Email notification** — Belum ada kirim email saat status berubah
5. **Verifikator info pengusul** — Belum ada tab detail NIP/jurusan pengusul di halaman verifikasi
6. **Email Verification** — Belum ada flow verifikasi email saat registrasi

---

## 14. Security Status

| Issue | Status |
|---|---|
| Password hashing | ✅ Bcrypt via Laravel |
| Bearer token auth (Sanctum) | ✅ Done |
| Server-side role validation | ✅ `CheckRole` middleware |
| Client-side role (UI only) | ⚠️ localStorage bisa dimanipulasi UI, tapi server tetap validate |
| File upload validation | ✅ Max 10MB, type whitelist |

---

## 15. Riwayat Integrasi & Migrasi Terkini (Walkthrough & Implementation Plan)

### Integrasi Frontend-Backend untuk Workflow Kegiatan
Pada tanggal 3 Juni 2026, fungsionalitas workflow usulan kegiatan disinkronisasikan penuh dengan backend Laravel.

#### A. Alur Pencairan Bertahap (Bendahara)
- Bendahara melakukan pencairan secara bertahap pada halaman `/dashboard/bendahara/pencairan/:id` (`PencairanPage.tsx`).
- Setiap tahap pencairan dihitung persentasenya terhadap target 100%. Nominal rupiah dihitung dinamis: `(persentase / 100) * total_anggaran`.
- Ketika total pencairan mencapai 100%, sistem otomatis mengubah status kegiatan menjadi `funds_disbursed` dan menghitung deadline LPJ (14 hari kerja, melewati hari Sabtu & Minggu).

#### B. Pengambilan Uang Muka (Pengusul)
- Setelah status usulan menjadi `accepted_funds` atau `funds_disbursed`, pengusul dapat mengonfirmasi pengambilan dana tunai pada halaman detail usulan (`DetailUsulanPage.tsx`) melalui tombol **"Konfirmasi Pengambilan Dana"**.
- Ini akan memicu `POST /api/kegiatan/{id}/ambil-uang-muka` yang menandai status `uang_muka_diambil` menjadi true dan mencatat tanggal pengambilan pada riwayat pencairan.

#### C. Meneruskan Usulan ke PPK (Pengusul)
- Apabila usulan berstatus `verified` / `diverifikasi`, pengusul harus melengkapi:
  1. Daftar Penanggung Jawab Kegiatan (input list dinamis).
  2. Mengunggah Surat Pengantar (PDF/Gambar).
- Pengusul kemudian menekan tombol **"Kirim Usulan ke PPK"** yang memicu upload berkas dan mengirimkan payload ke `/api/kegiatan/{id}/submit-ppk`. Status usulan akan berubah menjadi `pending_ppk`.

#### D. Verifikasi LPJ (Bendahara)
- Halaman verifikasi LPJ (`LpjVerificationPage.tsx`) menampilkan tabel komparasi detail pengeluaran per RAB item (Rencana KAK vs Realisasi LPJ) beserta selisih anggarannya.
- Seluruh nota/kuitansi bukti pembayaran yang diunggah pengusul ditampilkan dengan tautan download/view dinamis ke file fisik di `/storage/lpj/{filename}`.
- Bendahara dapat memberikan catatan temuan/verifikasi dan memutuskan:
  - **LPJ Disetujui**: Mengubah status menjadi `lpj_approved`.
  - **Minta Revisi LPJ**: Mengubah status menjadi `lpj_revision` (pengusul akan melihat catatan revisi dari bendahara di halaman pengisian LPJ).

#### E. Penyelarasan Kesenjangan Fitur & Wadir Roles (Batch 1 & 2)
- **Visualisasi KAK Indikator**: Ditambahkan fungsi parsing `parseIndikatorKinerja` untuk merender data JSON `indikator_kinerja` dalam bentuk tabel terstruktur di halaman detail (`DetailUsulanPage.tsx`), halaman review approval (`ReviewApprovalPage.tsx`), dan halaman cetak PDF (`PrintProposalPage.tsx`).
- **Dukungan Multi-Wadir (Wadir I - IV)**:
  - Backend `UserController.php` diperbarui untuk memvalidasi pendaftaran semua sub-role Wadir (`wadir1`, `wadir2`, `wadir3`, `wadir4`).
  - Frontend `UserFormPage.tsx` dan `UserManagementPage.tsx` diperbarui untuk mendukung pembuatan, pengelolaan, dan filter status berdasarkan sub-role Wadir tersebut.
  - Halaman `UserDetailPage.tsx` diperbarui untuk menampilkan label dan warna badge yang tepat bagi seluruh sub-role Wadir.
  - Halaman `ArchivePage.tsx` diperbarui untuk melabeli judul arsip secara dinamis sesuai role Wadir yang sedang aktif.
  - Endpoint index kegiatan di `KegiatanController.php` diperbarui sehingga setiap role Wadir hanya melihat dan menyetujui kegiatan yang ditujukan untuk unit mereka (`verifikator_target`), dengan Wadir II sebagai unit default.
  - Database seeder (`DatabaseSeeder.php`) diperbarui untuk menyertakan user test untuk Wadir I, III, dan IV, serta memperbarui output credentials.


