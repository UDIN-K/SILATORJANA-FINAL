# Si-LATORJANA — Skill Document untuk Migrasi PHP → React/TSX

> **Tujuan**: Dokumen referensi lengkap agar agent manapun bisa melanjutkan migrasi tanpa kehilangan konteks.

---

## 1. Overview Proyek

**Si-LATORJANA** (Sistem Layanan Terpadu Administrasi Pengajuan) adalah sistem manajemen kegiatan kampus Politeknik Negeri Jakarta. Aplikasi ini mengelola alur pengajuan proposal kegiatan dari pengusul (mahasiswa/dosen) melalui multi-level approval (verifikator → PPK → wadir) sampai pencairan dana dan pertanggungjawaban (LPJ).

**Figma Design Link**: [Si-LATORJANA UI](https://www.figma.com/design/tAdvyUYCEQWNkPEwXiH6tQ/PBL-Silatorjana?node-id=303-4400&p=f)

### Dua Codebase
| Aspek | Legacy (PHP) | Target (React/TSX) |
|---|---|---|
| **Lokasi** | `/home/udin/codeberg/silatorjana/web(lama)/` | `/home/udin/SILATORJANA/web/` |
| **Backend** | PHP MVC kustom + MySQL | Express + Appwrite SDK (node-appwrite) |
| **Frontend** | PHP views + vanilla JS + Chart.js | React 19 + TypeScript + Tailwind v4 + shadcn |
| **Database** | MySQL langsung | Appwrite Cloud (endpoint: `sgp.cloud.appwrite.io`) |
| **Auth** | Session-based PHP | localStorage + SHA-256 hash password (client-side via Web Crypto API) |
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
| `users` | Tabel pengguna | `nama`, `email`, `password` (SHA-256 hashed via `hashPassword()`), `role`, `jurusan`, `nip` |
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
/home/udin/SILATORJANA/web/
├── server.ts                    # Express server (proxy Appwrite + Vite dev middleware)
├── index.html                   # Entry point (Plus Jakarta Sans, Material Icons)
├── package.json
├── vite.config.ts               # Vite config (alias @/ → src/)
├── tsconfig.json
├── skills/                      # Skill documents (this file)
├── src/
│   ├── App.tsx                  # Router utama, semua routes
│   ├── main.tsx
│   ├── index.css                # Global CSS, Tailwind config, color tokens
│   ├── layouts/
│   │   └── RoleLayout.tsx       # Sidebar + topbar layout (per-role navigation)
│   ├── lib/
│   │   ├── appwrite.ts          # Appwrite client init, DB_ID export
│   │   └── helpers.ts           # Status mapping, formatters, hashPassword(), fetch helpers
│   ├── components/
│   │   ├── MonitoringPage.tsx    # Shared monitoring component (7 role-specific wrappers)
│   │   ├── NotificationDropdown.tsx  # Realtime notification bell dropdown
│   │   ├── ProgressTracker.tsx   # Visual workflow step tracker
│   │   ├── StatusBadge.tsx       # Status badge with color coding
│   │   └── ui/                  # shadcn components (button, card, input, table, etc.)
│   └── pages/
│       ├── auth/                # LoginPage, ForgotPasswordPage
│       ├── LandingPage.tsx      # Public landing page
│       ├── dashboard/           # DashboardIndex, GenericDashboard
│       ├── admin/               # AdminDashboard, UserManagementPage, UserFormPage, UserDetailPage, IkuConfigPage, AdminMonitoringPage
│       ├── pengusul/            # PengusulDashboard, UsulanPage, CreateUsulanPage, DetailUsulanPage, EditRevisiPage, LpjPage, NeedsWorkPage, HistoryPage, HistoryDetailPage, PrintProposalPage, PanduanPage, TemplatePage, PengusulMonitoringPage
│       ├── verifikator/         # VerifikatorDashboard, VerifikatorProposalList, VerifikasiDetailPage, RevisiFormPage, VerifikatorMonitoringPage
│       ├── ppk/                 # PpkDashboard, PpkProposalList, PpkMonitoringPage
│       ├── wadir/               # WadirDashboard, WadirProposalList, WadirMonitoringPage
│       ├── bendahara/           # BendaharaDashboard, BendaharaProposalList, BendaharaDetailPage, PencairanPage, LpjVerificationPage, BendaharaMonitoringPage
│       ├── rektorat/            # RektoratDashboard (with SVG charts), RektoratLaporanPage, RekapJurusanPage, RektoratDetailPage, RektoratTimelinePage, RektoratMonitoringPage
│       ├── shared/              # ProfilePage, ReviewApprovalPage, ArchivePage
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
| 5 | User Management (CRUD) | `UserManagementPage.tsx`, `UserFormPage.tsx`, `UserDetailPage.tsx` | `admin/management_user/*.php` |
| 6 | Master IKU Config | `IkuConfigPage.tsx` | `admin/data_configuration/IKU.php` |
| 7 | Pengusul Dashboard | `PengusulDashboard.tsx` | `pengusul/dashboard/dashboard.php` |
| 8 | Daftar Usulan | `UsulanPage.tsx` | `pengusul/submission/infokegiatan.php` |
| 9 | Buat Usulan Baru (KAK+IKU+RAB) | `CreateUsulanPage.tsx` (multi-kategori) | `pengusul/submission_unified.php` |
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
| 21 | Rektorat Dashboard + Laporan + Rekap | `RektoratDashboard.tsx` (with Charts), `RektoratLaporanPage.tsx`, `RekapJurusanPage.tsx` | `rektorat/dashboard/*.php`, `rektorat/laporan.php`, `rektorat/rekap_jurusan/*.php` |
| 22 | Timeline Status | `RektoratTimelinePage.tsx` | `rektorat/timeline.php` |
| 23 | Profile Page | `ProfilePage.tsx` | - |
| 24 | Shared Review/Approval | `ReviewApprovalPage.tsx` (fully tabbed) | PPK/Wadir approve flow |
| 25 | Export / Print PDF | `PrintProposalPage.tsx` | `pengusul/needs_work/print.php` |
| 26 | Panduan Pengusul & Template | `PanduanPage.tsx`, `TemplatePage.tsx` | `pengusul/dashboard/panduan.php`, `template.php` |
| 27 | Detail Revisi Pengusul (Editable) | `EditRevisiPage.tsx` (dengan highlight komentar) | `pengusul/detail_revisi.php` |
| 28 | Archive / Arsip | `ArchivePage.tsx` | `*/activity_proposals/archive.php` |
| 29 | Notifikasi Realtime | `NotificationDropdown.tsx` | `NotifController.php` |
| 30 | Verifikator Info Pengusul (tab) | `VerifikasiDetailPage.tsx` (Pengusul tab) | `verifikator/activity_proposal/View/pengusul.php` |
| 31 | Admin Intervensi Status | `AdminMonitoringPage.tsx` | `admin/Monitoring/intervensi_process.php` |
| 32 | Bendahara Detail Views | `BendaharaDetailPage.tsx` | `Bendahara/activity_proposal/View/*.php` |

---

## 6. Fitur yang BELUM Dimigrasi ❌ (PENTING!)

### 6.1 Email Verification
**PHP**: `auth/verify_email.php`
**React**: ❌ Belum ada flow verifikasi email

---

## 7. Security Issues ⚠️

| Issue | Severity | Status | Detail |
|---|---|---|---|
| Hardcoded Appwrite credentials | **HIGH** | ⚠️ Belum fix | `appwrite.ts` expose endpoint & project ID di client bundle. Idealnya pakai `.env` |
| Client-side password hashing | **MEDIUM** | ✅ Partial fix | Password di-hash SHA-256 via `hashPassword()` di `helpers.ts`. Login compare hashed + plaintext fallback |
| No real auth session | **HIGH** | ⚠️ Belum fix | Login hanya query `users` collection + store di localStorage, tidak ada server-side session/JWT |
| Client-side authorization | **HIGH** | ⚠️ Belum fix | Role check hanya dari localStorage, bisa di-manipulasi via devtools |
| No CSRF protection | **MEDIUM** | ⚠️ Belum fix | Form submission tidak ada CSRF token |

### Recommended Fix Priority:
1. Pindahkan auth ke server-side (server.ts sudah setup express — buat `/api/login` endpoint dengan JWT)
2. Migrasi dari SHA-256 client-side ke bcrypt server-side
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

## 9. RAB Calculation Logic (sudah dimigrasi ✅)

Kalkulasi RAB sudah diimplementasikan di `CreateUsulanPage.tsx` dan `EditRevisiPage.tsx`:

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
Print view (`PrintProposalPage.tsx`) juga menampilkan RAB grouped by kategori dengan subtotal.

---

## 10. File Referensi Penting

| File | Kenapa Penting |
|---|---|
| `src/lib/helpers.ts` | Status mapping, formatters, `hashPassword()`, fetch helpers |
| `src/lib/appwrite.ts` | DB credentials, client init |
| `src/App.tsx` | Semua routes, import semua pages |
| `src/layouts/RoleLayout.tsx` | Sidebar menus per role, topbar, logout |
| `src/components/MonitoringPage.tsx` | Shared monitoring (filter, search, table) |
| `src/components/NotificationDropdown.tsx` | Realtime notification bell dropdown |
| `src/components/ProgressTracker.tsx` | Visual workflow tracker |
| `src/components/StatusBadge.tsx` | Color-coded status badges |
| `src/pages/pengusul/EditRevisiPage.tsx` | Form revisi editable dengan highlight catatan per-kolom |
| `src/pages/verifikator/RevisiFormPage.tsx` | Form verifikator beri catatan per-kolom + per-item RAB |
| `src/pages/shared/ArchivePage.tsx` | Shared archive page (verifikator/PPK/wadir) |
| `server.ts` | Express server, Appwrite proxy, CORS |
| `index.html` | Google Fonts, Material Icons CDN |

---

## 11. Cara Run

```bash
cd /home/udin/SILATORJANA/web
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

## 12. Sisa Prioritas Migrasi Selanjutnya (Tersisa Sedikit!)

Semua fitur mayor (seperti Export PDF, Editable Revisi, Kalkulasi RAB, Arsip, Panduan, Template, Notifikasi) **SUDAH DISELESAIKAN** dalam iterasi terakhir. Berikut adalah hal-hal minor yang bisa menjadi fokus berikutnya:

1. **Email Verification** — Integrasi verifikasi email via SMTP untuk registrasi user baru.
2. **Admin Monitoring (Intervensi)** — Menambahkan aksi "Edit Status Paksa" di halaman AdminMonitoringPage seperti fungsi intervensi pada sistem lama.
3. **Detail Bendahara Lanjutan** — Memperkaya halaman detail pengajuan khusus Bendahara agar setara dengan tampilan multi-tab di PHP lama.
4. **Detail Info Pengusul untuk Verifikator** — Menambahkan popover atau modal info NIP/Jurusan saat Verifikator mengecek proposal.

