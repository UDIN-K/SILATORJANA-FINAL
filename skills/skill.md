---
name: "si-latorjana-full-stack"
description: "Sistem Layanan Terpadu Administrasi Pengajuan (Si-LATORJANA) - Sistem Manajemen Kegiatan Kampus PNJ"
---

# Si-LATORJANA — Ultimate Skill Document

> **Tujuan**: Dokumen referensi utama dan terlengkap agar agent/developer manapun bisa melanjutkan development tanpa kehilangan konteks. Ini menggantikan file migrasi lama.
> **PENTING**: Appwrite sudah 100% dihapus dan TIDAK dipakai. Semua backend menggunakan Laravel + MySQL lokal.

---

## 1. Overview Proyek

**Si-LATORJANA** (Sistem Layanan Terpadu Administrasi Pengajuan) adalah sistem manajemen kegiatan kampus Politeknik Negeri Jakarta. Sistem ini mengelola alur pengajuan proposal kegiatan dari pengusul (mahasiswa/dosen/jurusan) melalui alur persetujuan multi-level (verifikator → PPK → wadir) sampai pada proses pencairan dana dan pertanggungjawaban (LPJ) oleh bendahara.

| Aspek | Implementasi |
|---|---|
| **Lokasi Frontend** | `.` (Root Project) |
| **Lokasi Backend** | `./backend/` |
| **Backend** | **Laravel** + Sanctum Auth |
| **Frontend** | React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui |
| **Database** | **MySQL / MariaDB** — Sesuaikan dengan konfigurasi di `backend/.env` (default DB: `silatorjana`) |
| **Auth** | Laravel Sanctum — `POST /api/login` → Bearer token di `localStorage` (`auth_token`) |
| **Proxy** | Vite dev server proxy: `/api` → `http://localhost:8000` |

---

## 2. Cara Menjalankan Aplikasi (Run)

### A. Start Backend (Laravel)
Pastikan MariaDB/MySQL sudah jalan di port 3306.
```bash
cd ./backend
php artisan serve --port=8000
```

### B. Start Frontend (React/Vite)
Buka terminal baru.
```bash
cd . # (Atau root direktori project)
npm run dev
```

Akses aplikasi di `http://localhost:3000`. Akses proxy API akan otomatis diteruskan ke backend port 8000.

---

## 3. Struktur Folder

```text
./ (ROOT PROJECT)
├── backend/                  # LARAVEL BACKEND
│   ├── app/
│   │   ├── Http/Controllers/Api/   # API Endpoint Logic (KegiatanController, UserController, dll)
│   │   ├── Http/Middleware/        # CheckRole (Guard API)
│   │   └── Models/                 # Eloquent Models (Kegiatan, Kak, Iku, Rab, StatusHistory, dll)
│   ├── routes/
│   │   └── api.php                 # Daftar endpoint backend
│   └── database/migrations/        # Skema tabel database
│
├── src/                      # REACT FRONTEND
│   ├── App.tsx               # Routing global frontend
│   ├── components/           # Reusable UI (MonitoringPage, StatusBadge, shadcn)
│   ├── layouts/              # RoleLayout (Sidebar, Topbar)
│   ├── lib/                  # Utilities (api.ts untuk fetch, helpers.ts)
│   └── pages/                # Modul halaman berdasarkan Role:
│       ├── admin/
│       ├── bendahara/
│       ├── pengusul/
│       ├── ppk/
│       ├── rektorat/
│       ├── verifikator/
│       └── wadir/
```

---

## 4. Role & Guard System

Aplikasi ini menggunakan sistem *Role-Based Access Control* (RBAC) ketat.

### A. Guard Backend (Laravel)
- **Sanctum Middleware**: Semua request ke `/api/*` (kecuali login) dilindungi oleh `auth:sanctum`.
- **Role Middleware**: Menggunakan `CheckRole` middleware. Contoh: `Route::get('/users', [...])->middleware('role:admin');` memastikan hanya user dengan role `admin` yang bisa mengakses endpoint tersebut.

### B. Guard Frontend (React)
- Layout utama (`RoleLayout.tsx`) memeriksa token di `localStorage`. Jika tidak ada atau merespons `401 Unauthorized`, user otomatis dilempar ke `/login`.
- Sidebar menu di-render secara dinamis berdasarkan `role` yang login.

### C. Daftar Role & Akses
1. **`admin`**: Manajemen user (CRUD), konfigurasi IKU master, monitoring sistem (bisa force-change status).
2. **`pengusul`**: (Mahasiswa/Dosen) Membuat proposal, edit revisi, unggah LPJ, print dokumen.
3. **`verifikator`**: Penjaga gawang pertama. Mengecek kelengkapan proposal. Punya tombol **Minta Revisi**, **Tolak**, dan **Setujui**. (Hanya Verifikator yang bisa menolak mutlak).
4. **`ppk`**: Pejabat Pembuat Komitmen. Me-review dokumen yang sudah lolos verifikator. Hanya memiliki tombol **Minta Revisi** dan **Setujui Pengajuan**.
5. **`wadir1`, `wadir2`, `wadir3`, `wadir4`**: Wakil Direktur (Pimpinan). Menyetujui final. Hanya memiliki tombol **Minta Revisi** dan **Setujui Pengajuan**. Filter usulan didasarkan pada target unit (`verifikator_target`).
6. **`bendahara`**: Menangani keuangan. Hanya punya tombol **Cairkan Dana** (untuk proposal) dan **Setuju LPJ / Minta Revisi LPJ** (saat LPJ masuk). Tidak memiliki hak menolak.
7. **`rektorat`**: Pemantauan high-level, rekap laporan, timeline, dan grafik tingkat institusi.

---

## 5. Alur Workflow Proposal (LIFECYCLE)

Alur persetujuan berjalan sekuensial dan ketat:

1. **`draft`**: Pengusul sedang mengisi formulir awal (KAK, IKU, RAB). Validasi frontend memastikan semua isian lengkap sebelum lanjut.
2. **`submitted`**: Pengusul mengirim usulan. Masuk ke meja Verifikator.
   - *Verifikator bisa: Minta Revisi (`revision_requested`), Tolak (`rejected`), atau Setuju (`pending_ppk`).*
3. **`pending_ppk` / `verified`**: Proposal lolos verifikator, masuk ke PPK. Pengusul wajib upload Surat Pengantar.
   - *PPK bisa: Minta Revisi (`revision_requested`) atau Setuju (`approved_ppk`).*
4. **`approved_ppk`**: Masuk ke meja Wadir (sesuai target unit).
   - *Wadir bisa: Minta Revisi (`revision_requested`) atau Setuju (`approved_wadir`).*
5. **`approved_wadir` / `accepted_funds`**: Disetujui final. Bendahara bisa mengeksekusi pencairan dana.
   - *Bendahara mengeklik "Cairkan Dana" (bisa bertahap/persentase).*
6. **`funds_disbursed`**: Dana 100% cair. Pengusul menjalankan kegiatan.
7. **`lpj_submitted`**: Kegiatan selesai, Pengusul mengunggah LPJ & Kuitansi pengeluaran.
8. **`lpj_approved` / `lpj_done`**: Bendahara menyetujui LPJ.
   - *Bendahara bisa: Setuju LPJ (`lpj_approved`) atau Minta Revisi LPJ (`lpj_revision`).*

*(Jika sewaktu-waktu direvisi, status berubah menjadi `revision_requested`. Pengusul memperbaiki lalu mengirimkan ulang menjadi `revisi_done` / `submitted`).*

---

## 6. Daftar Fitur Lengkap

### Fitur Pengusul
- **Form Proposal Terintegrasi**: Pengisian KAK, RAB (auto kalkulasi `qty1*qty2*qty3*harga`), IKU (dinamis), dan Info Kegiatan.
- **Validasi Ketat**: Formulir memiliki validasi frontend agar tidak bisa melompat tab sebelum semua isian lengkap, dan tanggal tidak bisa mundur (past date).
- **Print Proposal (PDF)**: Cetak otomatis hasil isian ke dalam PDF lengkap dengan tabel KAK, RAB per kategori, dan IKU. Terjemahan nominal angka ke kata (Terbilang).
- **History & Snapshot**: Status History mencatat jejak persetujuan sekaligus `payload_snapshot` (bukti data JSON pada saat disetujui, mencegah manipulasi data setelah disetujui).

### Fitur Pimpinan & Approval
- **Conditional Action Buttons**: Tombol aksi disesuaikan dengan wewenang. Hanya Verifikator yang memiliki tombol **Tolak** secara mutlak. PPK, Wadir, Rektorat, dan Bendahara hanya dapat melakukan **Minta Revisi** atau **Setujui**. Tombol aksi otomatis hilang jika proposal dibuka dari Arsip (mencegah abuse).
- **Multi-Wadir Routing**: Routing untuk `wadir1` s/d `wadir4` berdasarkan departemen pengusul.
- **Arsip Pintar**: Halaman Arsip PPK dan Wadir membaca status khusus (seperti `approved_ppk`, `approved_wadir`, dll).

### Fitur Bendahara & Keuangan
- **Pencairan Bertahap**: Bisa mencairkan dana beberapa persen (misal 50% dulu).
- **Verifikasi LPJ Komparatif**: Membandingkan Rencana RAB (dari awal) vs Realisasi Kuitansi (saat pelaksanaan) beserta selisih anggarannya. Menampilkan link file lampiran LPJ.

### Fitur Monitoring & Admin
- **Dashboard Global & Monitoring**: Monitoring Page universal, menampilkan data berdasarkan role dengan bypass filter tertentu (`monitoring=true`).
- **Jana AI Assistant**: Chatbot terintegrasi dengan Google Gemini Flash API (`/api/chat`).

---

## 7. Referensi Database Schema (MySQL)

Model terpenting ada di tabel `kegiatan`, yang berelasi dengan tabel-tabel pendukung:
- `kaks` (1:1): Gambaran umum, strategi, indikator kerja, waktu.
- `ikus` (1:N): Indikator kinerja utama persentase.
- `rabs` (1:N): Detail anggaran (kategori, harga, qty).
- `status_histories` (1:N): Riwayat perubahan status kegiatan (dicatat otomatis oleh *Eloquent Observer* setiap field `status` berubah).
- `users`: Menggunakan bcrypt password dan terikat dengan kolom `role`.
- `lpjs` dan `lpj_files`: Bukti pertanggungjawaban kegiatan.

---

## 8. Cross-Check & Validasi (Quality Control)

**SANGAT PENTING**: Setelah melakukan perubahan masif pada ratusan baris kode (terutama di file TypeScript/React atau Controller PHP), biasakan selalu melakukan proses validasi mandiri untuk menghindari *Syntax Error* atau *Duplicate Identifiers* sebelum menyelesaikan tugas.

### A. Validasi Frontend (React/TypeScript)
Lakukan _build test_ untuk memastikan semua komponen lolos verifikasi TypeScript:
```bash
cd . # (Root Project)
npm run build
```
*(Jika muncul "built in X.XXs" berarti aman. Jika ada error duplicate identifier atau syntax, segera perbaiki)*.

### B. Validasi Backend (PHP/Laravel)
Jika mengubah file spesifik di backend, cek syntax tanpa harus menjalankan aplikasinya penuh:
```bash
cd ./backend
php -l app/Http/Controllers/Api/NamaController.php
php -l app/Models/NamaModel.php
```
Atau jalankan unit test bawaan (jika ada): `php artisan test`.

---
*Gunakan `api.ts` di `/src/lib/api.ts` untuk memanggil seluruh API backend. Autentikasi disisipkan secara otomatis oleh interceptor ke dalam Authorization Header.*
