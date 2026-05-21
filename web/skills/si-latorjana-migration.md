# Si-LATORJANA — Skill Document untuk Migrasi PHP → React/TSX

> **Tujuan**: Dokumen referensi lengkap agar agent manapun bisa melanjutkan migrasi tanpa kehilangan konteks.

---

## 1. Overview Proyek

**Si-LATORJANA** (Sistem Layanan Terpadu Administrasi Pengajuan) adalah sistem manajemen kegiatan kampus Politeknik Negeri Jakarta. Aplikasi ini mengelola alur pengajuan proposal kegiatan dari pengusul (mahasiswa/dosen) melalui multi-level approval (verifikator → PPK → wadir) sampai pencairan dana dan pertanggungjawaban (LPJ).

### Dua Codebase
| Aspek | Legacy (PHP) | Target (React/TSX) |
|---|---|---|
| **Lokasi** | `/etc/httpd/Si-LATORJANA/` | `/home/udin/Documents/SiLATORJANA/` |
| **Backend** | PHP MVC kustom + MySQL | Express + Appwrite SDK (node-appwrite) |
| **Frontend** | PHP views + vanilla JS + Chart.js | React 19 + TypeScript + Tailwind v4 + shadcn |
| **Database** | MySQL langsung | Appwrite Cloud (endpoint: `sgp.cloud.appwrite.io`) |
| **Auth** | Session-based PHP | localStorage JSON (⚠️ belum proper auth) |
| **Server** | Apache/httpd | Vite dev + Express proxy (`server.ts`) |
| **Font** | Plus Jakarta Sans | Plus Jakarta Sans (sudah dimigrasi) |
| **Warna** | Green (#1A4D2E, #36C06C, #52DE97) | Green (emerald-700, sudah dimigrasi) |

---

## 2. Appwrite Configuration

```
Endpoint: https://sgp.cloud.appwrite.io/v1
Project ID: 69fd6737000dbdd02a67
Database ID: 69fd691800237a6aaa72
```

### Collections (tabel di Appwrite)
| Collection ID | Fungsi | Fields Kunci |
|---|---|---|
| `kegiatan` | Tabel utama proposal/kegiatan | `nama_kegiatan`, `status`, `pengusul_id`, `pengusul_nama`, `nama_jurusan`, `jenis_kegiatan`, `total_anggaran`, `catatan_revisi` |
| `kak` | Kerangka Acuan Kerja (1:1 ke kegiatan) | `kegiatan_id`, `gambaran_umum`, `penerima_manfaat`, `strategi_pencapaian`, `metode_pelaksanaan`, `tahapan_pelaksanaan`, `kurun_waktu_mulai`, `kurun_waktu_selesai` |
| `iku` | Indikator Kinerja Utama (1:N) | `kegiatan_id`, `nama_iku`/`indikator`, `target_persen` |
| `rab` | Rincian Anggaran Biaya (1:N) | `kegiatan_id`, `uraian`, `kategori` (barang/jasa/perjalanan), `harga_satuan`, `volume`, `qty1`, `qty2`, `qty3`, `total` |
| `users` | Tabel pengguna | `nama`, `email`, `password` (⚠️ plaintext!), `role`, `jurusan`, `nip` |
| `iku_master` | Master IKU (konfigurasi admin) | `nama_indikator`, `is_visible` |
| `status_history` | Riwayat perubahan status (opsional, mungkin belum ada) | `kegiatan_id`, `new_status`, `actor_name`, `actor_role`, `note` |

### Status Workflow (urutan):
```
draft → submitted → verified → pending_ppk → approved_ppk → approved_wadir → accepted_funds → funds_disbursed → lpj_submitted → lpj_approved → lpj_done/completed

Cabang: revision_requested/revisi (dikembalikan untuk perbaikan)
       rejected/ditolak (penolakan final)
       lpj_revision/lpj_rejected (revisi LPJ)
```

---

## 3. Role & Menu Navigation

Ada **7 role** dalam sistem:

| Role | Sidebar Menu (React) | Tugas |
|---|---|---|
| `admin` | Dashboard, Management Users, Data & Configuration (IKU), Monitoring | CRUD user, master IKU, monitoring semua |
| `pengusul` | Dashboard, Usulan Saya, Perlu Revisi, Riwayat, Monitoring | Buat & kelola proposal, submit LPJ |
| `verifikator` | Dashboard, Semua Proposal, Monitoring | Verifikasi/revisi proposal masuk |
| `ppk` | Dashboard, Semua Proposal, Monitoring | Approve/reject proposal yang sudah verified |
| `wadir2` | Dashboard, Semua Proposal, Monitoring | Approve/reject proposal dari PPK |
| `bendahara` | Dashboard, Pencairan & LPJ, Monitoring | Cairkan dana, verifikasi LPJ |
| `rektorat` | Dashboard, Laporan, Rekap Jurusan, Monitoring | View-only dashboard & rekap |

---

## 4. Arsitektur React

### Tech Stack
- React 19 + TypeScript
- Vite 6.2 (build tool)
- Tailwind CSS v4 + shadcn/ui components
- lucide-react (icons)
- motion v12 (animasi)
- react-router-dom v7 (routing)
- appwrite SDK v25 (client-side database)
- Express (server-side proxy, `server.ts`)

### Struktur Folder
```
/home/udin/Documents/SiLATORJANA/
├── server.ts                    # Express server (proxy Appwrite + Vite dev middleware)
├── index.html                   # Entry point (Plus Jakarta Sans, Material Icons)
├── package.json
├── src/
│   ├── App.tsx                  # Router utama, semua routes
│   ├── main.tsx
│   ├── index.css                # Global CSS, Tailwind config, color tokens
│   ├── layouts/
│   │   └── RoleLayout.tsx       # Sidebar + topbar layout (per-role navigation)
│   ├── lib/
│   │   ├── appwrite.ts          # Appwrite client init, DB_ID export
│   │   └── helpers.ts           # Status mapping, formatters, fetch helpers
│   ├── components/
│   │   ├── MonitoringPage.tsx    # Shared monitoring component (7 role-specific wrappers)
│   │   ├── ProgressTracker.tsx   # Visual workflow step tracker
│   │   ├── StatusBadge.tsx       # Status badge with color coding
│   │   └── ui/                  # shadcn components (button, card, input, table, etc.)
│   └── pages/
│       ├── auth/                # LoginPage, ForgotPasswordPage
│       ├── LandingPage.tsx      # Public landing page
│       ├── dashboard/           # DashboardIndex, GenericDashboard
│       ├── admin/               # AdminDashboard, UserManagementPage, UserFormPage, IkuConfigPage, AdminMonitoringPage
│       ├── pengusul/            # PengusulDashboard, UsulanPage, CreateUsulanPage, DetailUsulanPage, LpjPage, NeedsWorkPage, HistoryPage, HistoryDetailPage, PengusulMonitoringPage
│       ├── verifikator/         # VerifikatorDashboard, VerifikatorProposalList, VerifikasiDetailPage, RevisiFormPage, VerifikatorMonitoringPage
│       ├── ppk/                 # PpkDashboard, PpkProposalList, PpkMonitoringPage
│       ├── wadir/               # WadirDashboard, WadirProposalList, WadirMonitoringPage
│       ├── bendahara/           # BendaharaDashboard, BendaharaProposalList, BendaharaDetailPage, PencairanPage, LpjVerificationPage, BendaharaMonitoringPage
│       ├── rektorat/            # RektoratDashboard, RektoratLaporanPage, RekapJurusanPage, RektoratDetailPage, RektoratTimelinePage, RektoratMonitoringPage
│       ├── shared/              # ProfilePage, ReviewApprovalPage
│       └── approval/            # ApprovalDashboard, ApprovalDetailPage (⚠️ orphan, belum di-route)
```

### Design System
- **Primary Color**: Green (`emerald-700` / `#1A4D2E` / `#36C06C` / `#52DE97`)
- **Sidebar**: Dark green gradient (`#0f5137 → #0b3f2e`), rounded corners (`25px`)
- **Background**: Green leaf gradient (`#c8e6c9 → #e8f5e9 → #a5d6a7`)
- **Cards**: White with `shadow-sm`, `border-slate-200`
- **Buttons**: `bg-emerald-700 hover:bg-emerald-800`
- **Loaders**: `text-emerald-700` Loader2 spinner
- **Font**: Plus Jakarta Sans (Google Fonts CDN)
- **Icons**: lucide-react + Material Icons (CDN)
- **Glassmorphism**: `backdrop-filter: blur(20px)` pada topbar, login page

---

## 5. Fitur yang SUDAH Dimigrasi ✅

| # | Fitur | React File | PHP Equivalent |
|---|---|---|---|
| 1 | Login (glassmorphism, animasi) | `LoginPage.tsx` | `auth/login.php` |
| 2 | Forgot Password | `ForgotPasswordPage.tsx` | `auth/forgot_password.php` |
| 3 | Landing Page | `LandingPage.tsx` | `landing/index.php` |
| 4 | Admin Dashboard (stats, tabel) | `AdminDashboard.tsx` | `admin/Dashboard/dashboard.php` |
| 5 | User Management (CRUD) | `UserManagementPage.tsx`, `UserFormPage.tsx` | `admin/management_user/*.php` |
| 6 | Master IKU Config | `IkuConfigPage.tsx` | `admin/data_configuration/IKU.php` |
| 7 | Pengusul Dashboard | `PengusulDashboard.tsx` | `pengusul/dashboard/dashboard.php` |
| 8 | Daftar Usulan | `UsulanPage.tsx` | `pengusul/submission/infokegiatan.php` |
| 9 | Buat Usulan Baru (KAK+IKU+RAB) | `CreateUsulanPage.tsx` | `pengusul/submission_unified.php` |
| 10 | Detail Usulan | `DetailUsulanPage.tsx` | Multi-tab view PHP |
| 11 | Needs Work / Perlu Revisi | `NeedsWorkPage.tsx` | `pengusul/needs_work/needs_work.php` |
| 12 | Riwayat Kegiatan | `HistoryPage.tsx`, `HistoryDetailPage.tsx` | `pengusul/history/*.php` |
| 13 | LPJ Submit | `LpjPage.tsx` | `pengusul/submission/lpj.php` |
| 14 | Monitoring (generic, semua role) | `MonitoringPage.tsx` + 7 wrappers | `*/monitoring/showallsubmission.php` |
| 15 | Verifikator Dashboard + List | `VerifikatorDashboard.tsx`, `VerifikatorProposalList.tsx` | `verifikator/Dashboard/*.php`, `verifikator/activity_proposal/Allproposal/allproposal.php` |
| 16 | Verifikasi Detail (tabbed KAK/IKU/RAB) | `VerifikasiDetailPage.tsx` | `verifikator/activity_proposal/View/*.php` |
| 17 | Revisi Form (per-field comments) | `RevisiFormPage.tsx` | `verifikator/activity_proposal/Revisi/*.php` |
| 18 | PPK Dashboard + Review | `PpkDashboard.tsx`, `PpkProposalList.tsx` | `PPK/dashboard/*.php`, `PPK/activity_proposals/*.php` |
| 19 | Wadir Dashboard + Review | `WadirDashboard.tsx`, `WadirProposalList.tsx` | `wadir/dashboard/*.php`, `wadir/activity_proposals/*.php` |
| 20 | Bendahara Dashboard + Pencairan + LPJ | `BendaharaDashboard.tsx`, `PencairanPage.tsx`, `LpjVerificationPage.tsx` | `Bendahara/dashboard/*.php`, `Bendahara/laporan/*.php` |
| 21 | Rektorat Dashboard + Laporan + Rekap | `RektoratDashboard.tsx`, `RektoratLaporanPage.tsx`, `RekapJurusanPage.tsx` | `rektorat/dashboard/*.php`, `rektorat/laporan.php`, `rektorat/rekap_jurusan/*.php` |
| 22 | Timeline Status | `RektoratTimelinePage.tsx` | `rektorat/timeline.php` |
| 23 | Profile Page | `ProfilePage.tsx` | - |
| 24 | Shared Review/Approval | `ReviewApprovalPage.tsx` | PPK/Wadir approve flow |

---

## 6. Fitur yang BELUM Dimigrasi ❌ (PENTING!)

### 6.1 Export / Print PDF
**PHP**: `pengusul/needs_work/print.php` — halaman print-friendly untuk proposal dengan CSS `@media print`, bisa "Save as PDF" via browser.
**React**: ❌ Belum ada. Perlu dibuat komponen print yang:
- Render proposal (Info Kegiatan, KAK, IKU, RAB) dalam layout print-friendly
- Support `window.print()` atau library seperti `react-to-print`
- Custom filename berdasarkan nama kegiatan
- RAB grouped by kategori (barang/jasa/perjalanan/custom) dengan subtotal

### 6.2 Panduan Pengusul
**PHP**: `pengusul/dashboard/panduan.php` — halaman panduan/tutorial interaktif dengan:
- Collapsible FAQ sections
- Step-by-step guide pengajuan
- Searchable content
**React**: ❌ Belum ada halaman panduan

### 6.3 Template Download
**PHP**: `pengusul/dashboard/template.php` — halaman untuk download template dokumen
**React**: ❌ Belum ada

### 6.4 Detail Revisi Pengusul (Editable)
**PHP**: `pengusul/detail_revisi.php` — form **editable** untuk revisi proposal yang dikembalikan verifikator. Berisi:
- Pre-populated form KAK, IKU, RAB (bisa diedit)
- RAB grouped by kategori (barang/jasa/perjalanan + custom kategori)
- RAB calculation: `qty1 * qty2 * qty3 * harga_satuan`
- Verifikator comments ditampilkan per-field
- Submit revisi kembali ke verifikator
**React**: ❌ `NeedsWorkPage.tsx` hanya listing, belum ada form edit. `DetailUsulanPage.tsx` hanya read-only.

### 6.5 Archive / Arsip (Verifikator, PPK, Wadir)
**PHP**: 
- `verifikator/activity_proposal/Allproposal/archive.php`
- `PPK/activity_proposals/archive.php`
- `wadir/activity_proposals/archive.php`

Halaman arsip proposal yang sudah lewat (approved/rejected/completed) — terpisah dari daftar proposal aktif.
**React**: ❌ Belum ada halaman archive terpisah

### 6.6 PPK/Wadir Detail Views (KAK, IKU, RAB, Info)
**PHP**:
- `PPK/activity_proposals/view_kak.php`, `view_iku.php`, `view_rab.php`, `view_infokegiatan.php`
- `wadir/activity_proposals/view_kak.php`, `view_iku.php`, `view_rab.php`, `view_Infokegiatan.php`, `detail.php`

Detail per-tab untuk PPK dan Wadir (KAK/IKU/RAB/Info) — saat ini React hanya punya `ReviewApprovalPage` yang simplified.
**React**: ⚠️ Partial — `ReviewApprovalPage.tsx` ada tapi kurang detail dibanding PHP

### 6.7 Bendahara Detail Views
**PHP**: 
- `Bendahara/activity_proposal/View/KAK.php`, `IKU.php`, `RAB.php`, `Info_Kegiatan.php`, `Pencairan_Dana.php`
- `Bendahara/detail/view.php`
- `Bendahara/laporan/all_lpj.php`, `review_lpj.php`

Per-tab detail views dan LPJ listing/review khusus bendahara.
**React**: ⚠️ Partial

### 6.8 Verifikator View Pengusul Info
**PHP**: `verifikator/activity_proposal/View/pengusul.php` — melihat info lengkap pengusul (NIP, jurusan, dll)
**React**: ❌ Belum ada

### 6.9 Admin Monitoring (Intervensi Process)
**PHP**: `admin/Monitoring/intervensi_process.php` — monitoring dengan kemampuan intervensi (force-change status, dll)
**React**: ⚠️ `AdminMonitoringPage` hanya pakai generic `MonitoringPage`, belum ada fitur intervensi

### 6.10 Notifikasi
**PHP**: `NotifController.php` — sistem notifikasi
**React**: ❌ Bell icon ada tapi belum fungsional

### 6.11 Email Verification
**PHP**: `auth/verify_email.php`
**React**: ❌ Belum ada

### 6.12 Admin Info User Detail
**PHP**: `admin/management_user/infouser.php` — halaman detail info user (view-only)
**React**: ❌ Belum ada (hanya ada edit form)

### 6.13 RAB Multi-Kategori
**PHP**: RAB dikelompokkan berdasarkan kategori (barang/jasa/perjalanan + custom) dengan subtotal per kategori.
**React**: ⚠️ `CreateUsulanPage` belum support multi-kategori RAB dengan kalkulasi `qty1 * qty2 * qty3 * harga_satuan`

### 6.14 Chart.js Dashboard Visualisasi
**PHP**: Dashboard admin menggunakan Chart.js untuk pie chart, bar chart distribusi per jurusan
**React**: ❌ Belum ada chart — hanya angka-angka stats

---

## 7. Security Issues ⚠️

| Issue | Severity | Detail |
|---|---|---|
| Hardcoded Appwrite credentials | **CRITICAL** | `appwrite.ts` line 6-7 expose endpoint & project ID di client bundle |
| Plaintext passwords | **CRITICAL** | `users` collection `password` field disimpan plaintext, login compare langsung string |
| No real auth | **HIGH** | Login hanya query `users` collection + store di localStorage, tidak ada session/JWT |
| Client-side authorization | **HIGH** | Role check hanya dari localStorage, bisa di-manipulasi via devtools |
| No CSRF protection | **MEDIUM** | Form submission tidak ada CSRF token |

### Recommended Fix Priority:
1. Pindahkan auth ke server-side (server.ts sudah setup express — buat `/api/login` endpoint)
2. Hash passwords dengan bcrypt
3. Pakai session/JWT bukan localStorage
4. Environment variables untuk credentials (`.env` file)

---

## 8. Coding Patterns & Conventions

### Page Pattern (copy-paste template)
```tsx
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { databases, APPWRITE_DB_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';

export function ExamplePage() {
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await databases.listDocuments(APPWRITE_DB_ID, 'collection_name', [
          Query.orderDesc('$createdAt'),
        ]);
        setData(res.documents);
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
    })();
  }, []);

  if (isLoading) return <div className="py-12 text-center"><Loader2 className="animate-spin text-emerald-700 mx-auto size-8" /></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Title</h2>
      {/* Content */}
    </div>
  );
}
```

### Color Conventions
- **Primary buttons**: `bg-emerald-700 hover:bg-emerald-800`
- **Outline action buttons**: `text-emerald-700 border-emerald-200 hover:bg-emerald-50`
- **Danger buttons**: `text-red-600 border-red-200 hover:bg-red-50`
- **Warning**: `bg-amber-500 hover:bg-amber-600`
- **Loaders**: `text-emerald-700`
- **Icons accent**: `text-emerald-700` or `text-emerald-600`
- **Stats cards**: `bg-emerald-100 text-emerald-700`
- **Focus rings**: `focus-visible:ring-emerald-700`

### Status Badge Colors (dari helpers.ts)
```
green  → completed/selesai/lpj_done
amber  → pending/menunggu
red    → rejected/ditolak
rose   → revisi/revision
blue   → verified/approved
indigo → funds related
slate  → draft
```

### Adding New Routes
1. Create page component in `src/pages/{role}/NewPage.tsx`
2. Add `import` and `<Route>` in `src/App.tsx` under the role section
3. Add menu item in `RoleLayout.tsx` → `ROLE_MENUS` object
4. Use `navigate()` for navigation, `useParams()` for URL params

### Database Fetch Pattern
```tsx
// Fetch single document
const doc = await databases.getDocument(APPWRITE_DB_ID, 'collection_id', documentId);

// Fetch list with filters
const res = await databases.listDocuments(APPWRITE_DB_ID, 'collection_id', [
  Query.equal('field_name', value),
  Query.orderDesc('$createdAt'),
  Query.limit(50),
]);

// Update document
await databases.updateDocument(APPWRITE_DB_ID, 'collection_id', documentId, {
  field_name: newValue,
});

// Create document
await databases.createDocument(APPWRITE_DB_ID, 'collection_id', ID.unique(), {
  field_name: value,
});
```

---

## 9. RAB Calculation Logic (dari PHP)

RAB di PHP memiliki perhitungan yang lebih kompleks daripada React saat ini:

```
total = qty1 × qty2 × qty3 × harga_satuan   (jika qty3 ada)
total = qty1 × qty2 × harga_satuan           (jika qty3 tidak ada)
total = field 'total' langsung               (fallback)
```

RAB dikelompokkan berdasarkan `kategori`:
- `barang` — Belanja Barang
- `jasa` — Belanja Jasa  
- `perjalanan` — Belanja Perjalanan
- Custom categories (user-defined)

Setiap kategori punya subtotal, dan grand total di bawah.

---

## 10. File Referensi Penting

| File | Kenapa Penting |
|---|---|
| `src/lib/helpers.ts` | Semua status mapping, formatters, fetch helpers |
| `src/lib/appwrite.ts` | DB credentials, client init |
| `src/App.tsx` | Semua routes, import semua pages |
| `src/layouts/RoleLayout.tsx` | Sidebar menus per role, topbar, logout |
| `src/components/MonitoringPage.tsx` | Shared monitoring (filter, search, table) |
| `src/components/ProgressTracker.tsx` | Visual workflow tracker |
| `src/components/StatusBadge.tsx` | Color-coded status badges |
| `server.ts` | Express server, Appwrite proxy, CORS |
| `index.html` | Google Fonts, Material Icons CDN |

---

## 11. Cara Run

```bash
cd /home/udin/Documents/SiLATORJANA
npm install          # pertama kali
npm run dev          # development mode (tsx server.ts → Express + Vite)
npm run build        # production build
```

Server berjalan di `http://localhost:3000`

### Testing Login Cepat
Di LoginPage ada dropdown "Login Cepat" dengan akun test:
- `admin@si-latorjana.com` / `123`
- `verifikator@si-latorjana.com` / `123`
- `ppk@si-latorjana.com` / `123`
- `wadir2@si-latorjana.com` / `123`
- `bendahara@si-latorjana.com` / `123`
- `rektorat@si-latorjana.com` / `123`
- `tik@si-latorjana.com` / `123` (Pengusul TIK)
- `mesin@si-latorjana.com` / `123` (Pengusul MESIN)

---

## 12. Prioritas Migrasi Selanjutnya

1. **✅ Export PDF / Print** — Fitur paling sering diminta user (PrintProposalPage.tsx)
2. **✅ Detail Revisi Form (editable)** — Pengusul bisa edit proposal yang di-revisi (EditRevisiPage.tsx)
3. **✅ RAB Multi-Kategori** — Kalkulasi qty1×qty2×qty3 + grouping per kategori (CreateUsulanPage upgraded)
4. **✅ Panduan & Template** — Halaman bantuan + template download untuk pengusul (PanduanPage.tsx, TemplatePage.tsx)
5. **✅ Archive Pages** — Arsip proposal untuk verifikator/PPK/wadir (shared/ArchivePage.tsx)
6. **🟡 Chart.js Dashboard** — Visualisasi data di dashboard admin/rektorat
7. **🟢 PPK/Wadir Detail Views** — Per-tab detail yang lebih lengkap
8. **🟢 Notifikasi** — Real-time notification system
9. **🟢 Security Hardening** — Auth proper, hash passwords
10. **🟢 Admin User Info Detail** — View-only user info page
