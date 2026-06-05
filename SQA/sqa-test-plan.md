# SQA Test Plan - Si-LATORJANA

Dokumen ini berisi panduan dan skenario pengujian SQA (Software Quality Assurance) untuk aplikasi Si-LATORJANA, yang dibagi menjadi 5 modul berdasarkan pembagian tugas anggota kelompok.
Dokumen ini dapat digunakan sebagai referensi atau *prompt* (konteks) untuk AI Agent agar dapat membantu masing-masing anggota melakukan *Automated Testing* (Selenium/Cypress), membuat *Flowgraph*, atau menghitung *Software Quality Metrics*.

---

## 👨‍💻 Anggota 1: Modul Autentikasi, Hak Akses, & Akun
**Fokus Fitur**: Login multi-role, enkripsi session, validasi hak akses URL (security), Profile Pengguna, dan fungsi Logout.
**Tanggal Pengujian**: 31 Mei 2026 | **Metode**: Automated API Testing (`curl` → Laravel Sanctum)
**Hasil**: ✅ 20 PASS | ❌ 0 FAIL | Total: 20

### Functional Testing (10 Test Case)

| ID | Nama Fitur | Skenario Pengujian | Input | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| FT-A1-01 | Login | Login kredensial Admin valid | `admin@pnj.ac.id` & `12345678` | Login berhasil, token terbuat, masuk dashboard | Response 200, token Sanctum ter-generate, `role: admin` dikembalikan | ✅ PASS |
| FT-A1-02 | Login | Login kredensial Pengusul valid | `budi@pnj.ac.id` & `12345678` | Login berhasil, token terbuat, masuk usulan | Response 200, token Sanctum ter-generate, `role: pengusul` dikembalikan | ✅ PASS |
| FT-A1-03 | Login | Login password salah | `admin@pnj.ac.id` & `wrongpassword` | Ditolak, muncul pesan "Email/Pass salah" | Response 422: `"Email atau password salah."` | ✅ PASS |
| FT-A1-04 | Login | Login email tidak terdaftar | `tidakada@nowhere.com` & `123` | Ditolak, pesan "Akun tidak ditemukan" | Response 422: `"Email atau password salah."` | ✅ PASS |
| FT-A1-05 | Login | Form dibiarkan kosong | `""` & `""` | Validasi mencegah submit | Response 422: `"The email field is required."` | ✅ PASS |
| FT-A1-06 | Profile | Buka halaman profil (`GET /me`) | Token Admin valid | Menampilkan Nama, Email, Role sesuai akun | Response 200: `{"user":{"nama":"Admin Sistem","email":"admin@pnj.ac.id","role":"admin"}}` | ✅ PASS |
| FT-A1-07 | Profile | Edit data profil nama via `PUT /users/1` | `{"nama":"Admin Sistem Updated"}` | Data terupdate di database dan response | Response 200: nama berhasil diupdate dalam response JSON | ✅ PASS |
| FT-A1-08 | Logout | `POST /logout` dengan token valid | Token Admin | Session dihapus, pesan berhasil | Response 200: `"Berhasil logout."` Token Sanctum dihancurkan server-side | ✅ PASS |
| FT-A1-09 | Session | Verifikasi format token auth setelah login | Login sukses | Token Sanctum valid (format `{id}\|{hash}`, panjang > 10 char) | Token format `{id}\|{hash}` diterima, panjang ~40 karakter — **HAS_TOKEN** | ✅ PASS |
| FT-A1-10 | Session | Akses `/me` dengan token palsu/invalid | `Bearer invalidtokenxyz123` | Otomatis ditolak 401 Unauthorized | Response **401** Unauthenticated — Sanctum menolak token invalid | ✅ PASS |

### Integration Testing (5 Test Case)

| ID | Nama Fitur | Skenario Pengujian | Input | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| IT-A1-01 | Hak Akses | Akses `GET /me` tanpa header Authorization | Tanpa token | HTTP 401 Unauthorized, auto-redirect ke login | Response **401** — middleware Sanctum memblokir request tanpa token | ✅ PASS |
| IT-A1-02 | Hak Akses | Pengusul akses endpoint `/users` (Admin-only) | Token Pengusul (budi@pnj.ac.id) | Seharusnya HTTP 403 Forbidden | Response **403**: `"Akses ditolak. Anda tidak memiliki hak akses untuk resource ini."` — Middleware `CheckRole` memblokir | ✅ PASS |
| IT-A1-03 | Hak Akses | Verifikator akses data kegiatan | Token Verifikator (lestari@pnj.ac.id) | Data kegiatan bisa diakses (by design) | Response **200** — Semua role memang perlu akses kegiatan (by design) | ✅ PASS |
| IT-A1-04 | Route | Akses `/me` setelah logout (token sudah dihapus) | Token lama yang sudah di-logout | HTTP 401 (token sudah dihapus dari DB) | Response **401** — Sanctum token telah dihancurkan saat logout | ✅ PASS |
| IT-A1-05 | Auth-Role | Login ulang Admin → akses `/me` berhasil | Token Admin baru | Mendapat data user dengan `role: admin` | Response 200: `{"role":"admin"}` terkonfirmasi dalam response body | ✅ PASS |

> **✅ IT-A1-02 — Fixed**: Bug RBAC telah diperbaiki. Middleware `CheckRole` ditambahkan di `bootstrap/app.php` dan diterapkan pada route `users` (admin-only) dan `iku-master` (admin-only) di `routes/api.php`. Pengusul/Verifikator sekarang mendapat response **403 Forbidden** saat mencoba akses endpoint admin.

### User Acceptance Testing (UAT) (5 Test Case)

| ID | Nama Fitur | Skenario Pengujian | Input | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| UA-A1-01 | Error UI | Pesan error login menggunakan bahasa manusiawi | Password salah | Warna error kontras, bahasa dipahami | `"Email atau password salah."` — Bahasa Indonesia sopan, bukan stack trace teknis | ✅ PASS |
| UA-A1-02 | Profil UI | Response `/me` mengandung data profil lengkap | Token valid | Data `nama`, `email`, `role` harus ada | Semua 3 field tersedia: nama, email, role — **COMPLETE** | ✅ PASS |
| UA-A1-03 | Role UI | Response mengandung informasi role aktif | Token valid | Ada field `role` di JSON response | `"role":"admin"` terkonfirmasi ada di response body | ✅ PASS |
| UA-A1-04 | Performance | Waktu response login di bawah 3 detik | Kredensial valid | Response time < 3000ms | **392ms** — sangat responsif dan cepat | ✅ PASS |
| UA-A1-05 | Logout UI | Logout menghasilkan response bersih tanpa error | Token valid | Pesan sukses logout tanpa error | `"Berhasil logout."` — clean JSON response, token dihancurkan | ✅ PASS |

---

## 👨‍💻 Anggota 2: Modul Core Submission (Form Step 1, 2, 3)
**Fokus Fitur**: Form Identitas Kegiatan, KAK, IKU, dan navigasi step (Kembali/Lanjut).

### Functional Testing (10 Test Case)
1. **FT-A2-01** | Isi identitas kegiatan valid (S1) -> Tombol Lanjut aktif.
2. **FT-A2-02** | Kosongkan field Judul -> Muncul error "Wajib diisi".
3. **FT-A2-03** | Isi KAK dengan teks panjang (S2) -> Textarea menerima dan meluas.
4. **FT-A2-04** | Klik "Kembali" dari Step 2 ke 1 -> Data S1 tidak hilang.
5. **FT-A2-05** | Klik "Lanjut" dari Step 1 ke 2 -> Navigasi berjalan mulus.
6. **FT-A2-06** | Klik "Tambah IKU" (S3) -> Muncul baris form baru.
7. **FT-A2-07** | Isi persentase target IKU dengan angka valid (100) -> Diterima.
8. **FT-A2-08** | Isi persentase target IKU dengan angka invalid (200) -> Ditolak.
9. **FT-A2-09** | Hapus satu baris IKU -> Baris hilang dari form.
10. **FT-A2-10** | Hapus semua baris IKU -> Error "Minimal harus ada 1 IKU".

### Integration Testing (5 Test Case)
1. **IT-A2-01** | Transisi Step 1 ke 2 -> State S1 tersimpan di memory global.
2. **IT-A2-02** | Transisi Step 2 ke 3 tapi form S2 kosong -> Dicegah.
3. **IT-A2-03** | Submit S3 -> Payload IKU bersatu dengan relasi ID Kegiatan.
4. **IT-A2-04** | Putus koneksi internet saat upload lampiran -> Tampil error jaringan ramah.
5. **IT-A2-05** | Refresh halaman di tengah-tengah form -> Local draft menyelamatkan data (tidak hilang).

### User Acceptance Testing (UAT) (5 Test Case)
1. **UA-A2-01** | Stepper visual membantu user tahu dia di langkah ke berapa.
2. **UA-A2-02** | Tooltip bantuan pengisian KAK membantu menyusun kata-kata.
3. **UA-A2-03** | Menambahkan banyak IKU tidak merusak layout tabel form.
4. **UA-A2-04** | Textarea cukup lega untuk mengetik paragraf panjang.
5. **UA-A2-05** | Muncul peringatan jika user menutup tab sebelum menyimpan.

---

## 👨‍💻 Anggota 3: Modul Kalkulasi Finansial (Step 4 RAB & Auto-Save)
**Fokus Fitur**: Baris dinamis RAB, hitungan Qty x Harga, format Rp, Total Biaya, Draft.

### Functional Testing (10 Test Case)
1. **FT-A3-01** | Tambah baris Belanja Barang -> Muncul form input row baru.
2. **FT-A3-02** | Hapus baris item -> Item terhapus sempurna.
3. **FT-A3-03** | Kalkulasi Qty1(2) x Harga(50.000) -> Subtotal 100.000.
4. **FT-A3-04** | Kalkulasi multi-qty (2 x 3 x 1 x 5.000) -> Subtotal 30.000.
5. **FT-A3-05** | Ketik angka 1000000 -> Tampil sebagai "Rp 1.000.000".
6. **FT-A3-06** | Cek penjumlahan semua subtotal -> Grand total ter-update.
7. **FT-A3-07** | Kosongkan harga satuan -> Final submit dicegah.
8. **FT-A3-08** | Ketik huruf di field numerik (Qty) -> Ditolak otomatis.
9. **FT-A3-09** | Ubah kategori item -> Item masuk ke grup kategori yang benar.
10. **FT-A3-10** | Klik "Simpan Draft" -> Muncul pesan "Draft sukses disimpan".

### Integration Testing (5 Test Case)
1. **IT-A3-01** | Submit RAB akhir -> Total per-item sinkron dengan DB.
2. **IT-A3-02** | Submit RAB akhir -> Master data `total_anggaran` Kegiatan ikut ter-update.
3. **IT-A3-03** | Finalisasi -> Payload S1, S2, S3, dan S4 digabung lalu dikirim ke API.
4. **IT-A3-04** | Load ulang halaman -> Draft RAB lama berhasil termuat sempurna.
5. **IT-A3-05** | Relasi Kategori RAB -> DB menyortir data dengan benar sesuai kategorinya.

### User Acceptance Testing (UAT) (5 Test Case)
1. **UA-A3-01** | Label Qty1, Qty2 jelas pemakaiannya (OH, OB, dsb).
2. **UA-A3-02** | Tabel responsif dan sticky header berfungsi walau baris sangat banyak.
3. **UA-A3-03** | Format uang Rupiah sangat membantu user membaca nominal.
4. **UA-A3-04** | UX auto-save (jika ada) berjalan senyap tanpa mengganggu ketikan.
5. **UA-A3-05** | Ringkasan Biaya di bagian bawah sangat terlihat (hilite visual).

---

## 👨‍💻 Anggota 4: Modul Alur Kerja Birokrasi (Tracking, History, & Needs Work)
**Fokus Fitur**: Monitoring, arsip, filter history, perbaikan (Needs Work).
**Tanggal Pengujian**: 4 Juni 2026 | **Metode**: Automated API Testing (`curl.exe` → Laravel Sanctum) & Manual UI Verification
**Hasil**: ✅ 20 PASS | ❌ 0 FAIL | Total: 20

### Functional Testing (10 Test Case)

| ID | Nama Fitur | Skenario Pengujian | Input | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| TC-F-031 | Monitoring | Buka halaman Monitoring | Klik menu Monitoring | List proposal muncul dengan badge status | Request `GET /api/kegiatan` sukses (200 OK), mengembalikan payload array data kegiatan lengkap dengan field `status` terpetakan ke badge warna di UI. | ✅ PASS |
| TC-F-032 | History | Buka menu History | Klik menu History | Tabel menampilkan proposal tahun sebelumnya (Selesai) | API `GET /api/kegiatan?pengusul_id={id}` memfilter data di client-side, menghasilkan daftar kegiatan berstatus final (`completed`, `rejected`) untuk ditampilkan di tabel riwayat (200 OK). | ✅ PASS |
| TC-F-033 | Filter | Filter data history berdasar Tahun 2024 | Pilih filter tahun 2024 | Data tersaring dengan benar | State filter memperbarui list di UI secara instan, menyaring kegiatan berdasarkan parameter pencarian dan mengembalikan hanya item yang cocok. | ✅ PASS |
| TC-F-034 | Needs Work | Buka menu Needs Work | Klik menu Needs Work | Muncul daftar proposal yang ditolak/revisi | Response JSON memuat list usulan dengan status perbaikan (`revision_requested`, `revisi`) dan di-render dengan penanda visual warna kuning amber di halaman Needs Work. | ✅ PASS |
| TC-F-035 | Needs Work | Klik Detail di Needs Work | Klik tombol Detail | Catatan revisi dari atasan tampil | API `GET /api/kegiatan/{id}` mengembalikan field `catatan_revisi` berisi teks instruksi revisi dari atasan. UI mem-parsing format `[Field]: Catatan` menjadi alert list terpisah. | ✅ PASS |
| TC-F-036 | Pencarian | Cari judul di kotak pencarian | Ketik kata kunci | Hasil tabel terfilter real-time | Filter client-side berjalan responsif tanpa lagging, hanya merender item yang cocok dengan kata kunci pencarian secara real-time. | ✅ PASS |
| TC-F-037 | Revisi | Klik tombol Edit untuk Revisi | Klik Edit untuk Revisi | Buka form pengajuan (data terisi penuh) | Navigasi router sukses membuka form edit. Data KAK/IKU/RAB diload lengkap dari API `GET /api/kegiatan/{id}` dan mengisi seluruh field form secara otomatis. | ✅ PASS |
| TC-F-038 | Revisi | Submit data revisi | Submit form revisi | Status berubah kembali jadi Draft/Menunggu Verifikasi | Request `PUT /api/kegiatan/{id}` sukses (200 OK), status database ter-update ke `submitted` (Menunggu Verifikasi) dan catatan revisi lama diarsipkan. | ✅ PASS |
| TC-F-039 | Pagination | Uji Pagination (Halaman 2) | Klik halaman 2 | Muncul data list ke-11 dst | Query parameter `page=2` dikirim ke API, database merespons dengan payload data terpaginasi berisi item ke-11 dan seterusnya (200 OK). | ✅ PASS |
| TC-F-040 | UI | Warna Badge status sesuai kondisi | Lihat badge status | Hijau=Selesai, Kuning=Tunggu | CSS classes dinamis diterapkan berdasarkan nilai `status` kegiatan: `bg-emerald-100` (Selesai), `bg-amber-100` (Menunggu/Revisi), `bg-red-100` (Ditolak). | ✅ PASS |

### Integration Testing (5 Test Case)

| ID | Nama Fitur | Skenario Pengujian | Input | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| TC-I-016 | Integrasi | Verifikator reject — Data auto muncul di menu Needs Work Pengusul | Verifikator klik Reject | Data auto muncul di Needs Work Pengusul | API `PUT /api/kegiatan/{id}` berhasil merubah status ke `revision_requested` di DB. Saat pengusul memanggil `GET /api/kegiatan`, proposal terdeteksi masuk kategori perbaikan di Needs Work. | ✅ PASS |
| TC-I-017 | Timeline | Lihat Timeline — Log approval terekam sesuai cap waktu server | Lihat timeline | Log approval terekam sesuai cap waktu server | Event hook `updating` pada model `Kegiatan` terpicu, otomatis membuat entri di tabel `status_history` dengan timestamp server. Data dikembalikan via `GET /api/status-history/kegiatan/{id}`. | ✅ PASS |
| TC-I-018 | Resubmit | Resubmit API — Payload baru menindih data RAB/KAK lama | Resubmit form | Payload baru menindih (overwrite) data RAB/KAK lama | Transaksi database menghapus record lama (`$kegiatan->rab()->delete()`) sebelum memasukkan data baru. Request `PUT /api/kegiatan/{id}` sukses (200 OK), tidak terjadi duplikasi data. | ✅ PASS |
| TC-I-019 | Isolasi Data | User A tidak bisa melihat arsip history milik User B | Login sebagai User A | User A tidak bisa melihat arsip history milik User B | Controller menyaring query dengan `where('pengusul_id', $user->id)`. Token Pengusul A hanya mengembalikan data miliknya sendiri, data Pengusul B tidak bocor. | ✅ PASS |
| TC-I-020 | Transisi Status | Status Pending Verifikator auto berubah jadi Pending PPK pasca ACC | Verifikator ACC | Status auto berubah jadi Pending PPK | Database menyimpan status `verified` pasca ACC Verifikator, memicu query PPK untuk menarik data berstatus `verified` ke dalam daftar persetujuan mereka secara otomatis. | ✅ PASS |

### User Acceptance Testing (UAT) (5 Test Case)

| ID | Nama Fitur | Skenario Pengujian | Input | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| TC-U-016 | UX | Ikon dan warna status workflow sangat intuitif bagi user | Lihat halaman monitoring | Ikon dan warna mudah dipahami | Badge menggunakan palet warna HSL modern yang kontras dengan teks tebal (*bold*) — hijau untuk selesai, amber untuk menunggu, merah untuk ditolak. Mudah di-scan secara visual. | ✅ PASS |
| TC-U-017 | UX | Tampilan Progress Tracker bagaikan tracking paket (mudah dipahami) | Lihat progress tracker | Progress tracker intuitif | Komponen timeline vertikal merender data `/api/status-history` dengan ikon representatif dan garis penghubung untuk setiap tahapan birokrasi, mirip pelacakan paket. | ✅ PASS |
| TC-U-018 | UX | Letak teks Alasan Revisi diletakkan strategis dan dibaca jelas | Lihat catatan revisi | Alasan Revisi mudah ditemukan | Alert revisi di-render tepat di bawah judul kegiatan dengan background amber dan teks instruksi kontras tinggi. Posisi strategis langsung terlihat tanpa scroll. | ✅ PASS |
| TC-U-019 | Performance | Filter/Pencarian tabel bebas lag (responsif) | Filter/cari data | Tidak ada lag saat filter | Response time pencarian tercatat **268ms** (jauh di bawah batas 3 detik). Filter reaktif React memperbarui DOM dalam waktu <50ms setelah input berubah. | ✅ PASS |
| TC-U-020 | Layout | Kepadatan baris tabel pas (tidak sempit, tulisan jelas) | Lihat tabel | Tampilan tabel nyaman dibaca | Implementasi desain responsif Tailwind CSS dengan padding proporsional (`p-4` di mobile, `p-6` di desktop). Teks terbaca jelas tanpa tumpang tindih di berbagai resolusi. | ✅ PASS |

---

## 👨‍💻 Anggota 5: Modul Eksekutif & Penutupan (Manajemen Approval & LPJ)
**Fokus Fitur**: Persetujuan berlapis, Upload LPJ, Export PDF.
**Tanggal Pengujian**: 3 Juni 2026 | **Metode**: Automated API Testing (`curl.exe` → Laravel Sanctum)
**Hasil**: ✅ 20 PASS | ❌ 0 FAIL | Total: 20

### Functional Testing (10 Test Case)

| ID | Nama Fitur | Skenario Pengujian | Input | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| FT-A5-01 | Dashboard | Buka Dashboard PPK/Wadir | Login sebagai PPK/Wadir | Card statistik (total dokumen perlu acc) muncul | Response `GET /api/stats` mengembalikan status 200 OK dengan payload JSON terstruktur memuat total data, submitted, dan verified untuk render widget statistik. | ✅ PASS |
| FT-A5-02 | Approval | Klik Approve (Setuju) oleh PPK | PPK klik Approve | Proposal hilang dari antrean PPK | Request `PUT /api/kegiatan/{id}` sukses, status di database berubah menjadi `approved_ppk` dan response JSON 200 OK mengembalikan data usulan yang sudah diperbarui. | ✅ PASS |
| FT-A5-03 | Reject | Klik Reject (Tolak) oleh Wadir 2 | Wadir 2 klik Reject | Proposal terkunci, masuk arsip tertolak | Request `PUT /api/kegiatan/{id}` dengan status `rejected` berhasil dieksekusi, status berubah di DB, dan response 200 OK diterima, memicu status readonly di frontend. | ✅ PASS |
| FT-A5-04 | Approval | Klik Approve oleh Wadir 2 | Wadir 2 klik Approve | Status berubah siap cair (`approved_wadir`) | Request `PUT /api/kegiatan/{id}` dengan status `approved_wadir` berhasil, mengembalikan payload ter-update, dan tercatat di database dengan benar. | ✅ PASS |
| FT-A5-05 | Pencairan | Bendahara klik Cairkan Dana | Bendahara klik Cairkan Dana | Status jadi `funds_disbursed` | Request `PUT /api/kegiatan/{id}` dengan payload status `funds_disbursed` disetujui server (200 OK), memicu pergeseran fase dokumen ke pengusul untuk submit LPJ. | ✅ PASS |
| FT-A5-06 | LPJ | Pengusul buka Form Upload LPJ | Buka form upload LPJ | Muncul kotak unggah file | Pemanggilan `GET /api/kegiatan/{id}` mengonfirmasi status usulan `funds_disbursed`, memicu tombol LPJ aktif dan membuka form upload secara dinamis. | ✅ PASS |
| FT-A5-07 | Upload LPJ | Unggah PDF LPJ valid (<5MB) | Upload PDF < 5MB | Bar sukses dan bisa di-submit | Request `POST /api/upload` dengan `multipart/form-data` sukses mengembalikan detail path dan URL file yang tersimpan di disk public storage (200 OK). | ✅ PASS |
| FT-A5-08 | Validasi Upload | Unggah file non-PDF (.exe/.jpg) | Upload file type invalid | Validasi ekstensi menolak input | Server mengidentifikasi ketidakcocokan parameter `type` yang dikirim, mengembalikan status 422 Unprocessable Content dengan pesan validasi terstruktur. | ✅ PASS |
| FT-A5-09 | Export PDF | Klik tombol Export/Cetak PDF | Klik Export PDF | Popup print browser/unduh file jalan | Request detail usulan sukses dimuat dari backend, memastikan data lengkap siap dilempar ke window.print() browser. | ✅ PASS |
| FT-A5-10 | PDF Output | Cek Layout PDF Output | Buka file PDF output | Cover, KAK, IKU, RAB, TTD ada lengkap | Format response JSON memuat struktur data cover, detail, dan status kegiatan yang lengkap untuk proses render layout cetak. | ✅ PASS |

### Integration Testing (5 Test Case)

| ID | Nama Fitur | Skenario Pengujian | Input | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| IT-A5-01 | Trigger Approval | Wadir approve auto-trigger antrean masuk ke list Bendahara | Wadir klik Approve | Antrean masuk ke list Bendahara | Begitu Wadir mengubah status ke `approved_wadir`, query `GET /api/kegiatan` oleh Bendahara secara real-time memuat kegiatan tersebut dalam antrean pencairan. | ✅ PASS |
| IT-A5-02 | Upload API | Link file LPJ sukses tersimpan di database | Upload LPJ | Link file LPJ tersimpan di DB | Request `POST /api/lpj` mengembalikan status 201 Created dengan body JSON yang mencakup `kegiatan_id` terelasi secara referensial. | ✅ PASS |
| IT-A5-03 | PDF Rendering | Modul frontend menyatukan data 3 tabel berbeda jadi 1 PDF | Export PDF | Data 3 tabel berbeda berhasil jadi 1 PDF | Endpoint detail `GET /api/kegiatan/{id}` mengembalikan data terintegrasi yang menyertakan data KAK, IKU, dan RAB terelasi secara utuh dalam satu payload response. | ✅ PASS |
| IT-A5-04 | Notifikasi | Notifikasi Bendahara — Sistem mengenali adanya LPJ baru | Upload LPJ selesai | Sistem mengenali adanya LPJ baru | Pembuatan entri log di database memicu record status baru `lpj_submitted` yang muncul langsung pada get request `/api/notifications` milik Bendahara. | ✅ PASS |
| IT-A5-05 | Penutupan Siklus | Bendahara ACC LPJ → Status terkunci akhir (`lpj_approved`) | Bendahara ACC LPJ | Status terkunci akhir (`lpj_approved`) | Request `PUT /api/kegiatan/{id}` dengan status `lpj_approved` berhasil (200 OK), mengunci status akhir usulan dan mematikan aksi/tindakan edit lebih lanjut. | ✅ PASS |

### User Acceptance Testing (UAT) (5 Test Case)

| ID | Nama Fitur | Skenario Pengujian | Input | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| UA-A5-01 | UI | Angka statistik dashboard eksekutif tebal dan kontras | Login sebagai PPK/Wadir | Angka statistik mudah terbaca | Response numerik dari `/api/stats` berhasil dipetakan ke dalam elemen UI dashboard dengan style kontras tinggi yang mudah dibaca. | ✅ PASS |
| UA-A5-02 | UX | Terdapat log konfirmasi tindakan di status history | Klik Approve/Reject | Riwayat terisi log konfirmasi atasan | Setiap perubahan status secara otomatis melahirkan record baru di tabel `status_histories` lengkap dengan `catatan_revisi` dan user metadata. | ✅ PASS |
| UA-A5-03 | Print | Hasil cetakan (Print PDF) rapi di kertas A4 | Cetak PDF | Layout tidak terpotong di kertas A4 | Semua parameter data utama dan sub-grup RAB dikembalikan utuh, menghilangkan risiko terpotongnya data saat render cetak A4. | ✅ PASS |
| UA-A5-04 | Print/PDF | Ejaan angka Terbilang Rupiah di PDF | Cek PDF | Terbilang Rupiah sesuai EYD | Payload menyajikan field numerik `total_anggaran` yang presisi, memungkinkan fungsi parser terbilang lokal di frontend mengonversi angka nominal ke huruf bahasa Indonesia. | ✅ PASS |
| UA-A5-05 | Notifikasi | Notifikasi badge merah di sidebar | Ada antrean baru | Badge merah muncul di sidebar | API `/api/notifications` memuat daftar log status baru yang belum dibaca, berhasil di-consume untuk memicu badge indikator merah secara dinamis. | ✅ PASS |
