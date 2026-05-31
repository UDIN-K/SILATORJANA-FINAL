# SQA Test Plan - Si-LATORJANA

Dokumen ini berisi panduan dan skenario pengujian SQA (Software Quality Assurance) untuk aplikasi Si-LATORJANA, yang dibagi menjadi 5 modul berdasarkan pembagian tugas anggota kelompok.
Dokumen ini dapat digunakan sebagai referensi atau *prompt* (konteks) untuk AI Agent agar dapat membantu masing-masing anggota melakukan *Automated Testing* (Selenium/Cypress), membuat *Flowgraph*, atau menghitung *Software Quality Metrics*.

---

## 👨‍💻 Anggota 1: Modul Autentikasi, Hak Akses, & Akun
**Fokus Fitur**: Login multi-role, enkripsi session, validasi hak akses URL (security), Profile Pengguna, dan fungsi Logout.

### Functional Testing (10 Test Case)
1. **FT-A1-01** | Login dengan kredensial Admin valid -> Masuk Dashboard Admin.
2. **FT-A1-02** | Login dengan kredensial Pengusul valid -> Masuk Dashboard Pengusul.
3. **FT-A1-03** | Login dengan password salah -> Muncul pesan error "Email/Pass salah".
4. **FT-A1-04** | Login dengan email tidak terdaftar -> Muncul pesan "Akun tidak ditemukan".
5. **FT-A1-05** | Form dibiarkan kosong lalu submit -> Validasi HTML mencegah submit.
6. **FT-A1-06** | Mengakses halaman profil setelah login -> Data Nama, NIP, Jurusan sesuai database.
7. **FT-A1-07** | Edit data profil (misal Nama) -> Tersimpan di DB dan UI ter-update.
8. **FT-A1-08** | Klik tombol Logout -> Session terhapus, kembali ke halaman login.
9. **FT-A1-09** | Cek penyimpanan token auth -> Token ada di LocalStorage.
10. **FT-A1-10** | Membiarkan aplikasi terbuka lama (timeout) -> Session expired otomatis.

### Integration Testing (5 Test Case)
1. **IT-A1-01** | Akses URL `/admin` tanpa login -> Auto-redirect ke login.
2. **IT-A1-02** | Role Pengusul akses URL Admin (`/admin`) -> Akses ditolak (Forbidden).
3. **IT-A1-03** | Role Verifikator akses menu PPK -> Akses ditolak (Forbidden).
4. **IT-A1-04** | User sukses login, lalu menekan tombol BACK di browser -> Dicegah, tetap di dashboard.
5. **IT-A1-05** | Request API dengan role yang sesuai -> Endpoint menerima request.

### User Acceptance Testing (UAT) (5 Test Case)
1. **UA-A1-01** | UI Form Login jelas, tombol terbaca, ada icon show/hide password.
2. **UA-A1-02** | Pesan error autentikasi mudah dipahami user awam (warna merah/kontras).
3. **UA-A1-03** | Terdapat label penanda role aktif (misal "Login sebagai: Admin") di dashboard.
4. **UA-A1-04** | Tata letak UI halaman Profil rapi dan informatif.
5. **UA-A1-05** | Tombol Logout mudah ditemukan tanpa kebingungan.

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

### Functional Testing (10 Test Case)
1. **FT-A4-01** | Buka halaman Monitoring -> List proposal muncul dengan badge status.
2. **FT-A4-02** | Buka menu History -> Tabel menampilkan proposal tahun sebelumnya (Selesai).
3. **FT-A4-03** | Filter data history berdasar Tahun 2024 -> Data tersaring dengan benar.
4. **FT-A4-04** | Buka menu Needs Work -> Muncul daftar proposal yang ditolak/revisi.
5. **FT-A4-05** | Klik Detail di Needs Work -> Catatan revisi dari atasan tampil.
6. **FT-A4-06** | Cari judul di kotak pencarian -> Hasil tabel terfilter real-time.
7. **FT-A4-07** | Klik tombol "Edit untuk Revisi" -> Buka form pengajuan (data terisi penuh).
8. **FT-A4-08** | Submit data revisi -> Status berubah kembali jadi Draft/Menunggu Verifikasi.
9. **FT-A4-09** | Uji Pagination (Halaman 2) -> Muncul data list ke-11 dst.
10. **FT-A4-10** | Warna Badge status -> Sesuai kondisi (Hijau=Selesai, Kuning=Tunggu).

### Integration Testing (5 Test Case)
1. **IT-A4-01** | Verifikator reject -> Data auto muncul di menu Needs Work Pengusul.
2. **IT-A4-02** | Lihat Timeline -> Log approval terekam sesuai cap waktu server.
3. **IT-A4-03** | Resubmit API -> Payload baru menindih (overwrite) data RAB/KAK lama.
4. **IT-A4-04** | Isolasi Data -> User A tidak bisa melihat arsip history milik User B.
5. **IT-A4-05** | Transisi Status -> Status "Pending Verifikator" auto berubah jadi "Pending PPK" pasca ACC.

### User Acceptance Testing (UAT) (5 Test Case)
1. **UA-A4-01** | Ikon dan warna status workflow sangat intuitif bagi user.
2. **UA-A4-02** | Tampilan *Progress Tracker* bagaikan tracking paket (mudah dipahami).
3. **UA-A4-03** | Letak teks Alasan Revisi diletakkan strategis dan dibaca jelas.
4. **UA-A4-04** | Filter/Pencarian tabel bebas lag (responsif).
5. **UA-A4-05** | Kepadatan baris tabel pas (tidak sempit, tulisan jelas).

---

## 👨‍💻 Anggota 5: Modul Eksekutif & Penutupan (Manajemen Approval & LPJ)
**Fokus Fitur**: Persetujuan berlapis, Upload LPJ, Export PDF.

### Functional Testing (10 Test Case)
1. **FT-A5-01** | Buka Dashboard PPK/Wadir -> Card statistik (total dokumen perlu acc) muncul.
2. **FT-A5-02** | Klik "Approve" (Setuju) oleh PPK -> Proposal hilang dari antrean PPK.
3. **FT-A5-03** | Klik "Reject" (Tolak) oleh Wadir 2 -> Proposal terkunci, masuk arsip tertolak.
4. **FT-A5-04** | Klik "Approve" oleh Wadir 2 -> Status berubah siap cair (`approved_wadir`).
5. **FT-A5-05** | Bendahara klik "Cairkan Dana" -> Status jadi `funds_disbursed`.
6. **FT-A5-06** | Pengusul buka Form Upload LPJ -> Muncul kotak unggah file.
7. **FT-A5-07** | Unggah PDF LPJ valid (<5MB) -> Bar sukses dan bisa di-submit.
8. **FT-A5-08** | Unggah file non-PDF (.exe/.jpg) -> Validasi ekstensi menolak input.
9. **FT-A5-09** | Klik tombol "Export/Cetak PDF" -> Popup print browser/unduh file jalan.
10. **FT-A5-10** | Cek Layout PDF Output -> Cover, KAK, IKU, RAB, TTD ada lengkap.

### Integration Testing (5 Test Case)
1. **IT-A5-01** | Trigger Approval -> Wadir approve auto-trigger antrean masuk ke list Bendahara.
2. **IT-A5-02** | Upload API -> Link file LPJ sukses tersimpan di database kolom `lpj_url`.
3. **IT-A5-03** | PDF Rendering -> Modul frontend berhasil menyatukan data 3 tabel berbeda jadi 1 PDF.
4. **IT-A5-04** | Notifikasi Bendahara -> Sistem mengenali adanya LPJ baru untuk di-ACC Bendahara.
5. **IT-A5-05** | Penutupan Siklus -> Bendahara ACC LPJ -> Status terkunci akhir (`lpj_done`).

### User Acceptance Testing (UAT) (5 Test Case)
1. **UA-A5-01** | Angka statistik dashboard eksekutif tebal, kontras, dan langsung terlihat.
2. **UA-A5-02** | Terdapat modal/dialog konfirmasi jika klik tombol Approve/Reject agar tidak salah pencet.
3. **UA-A5-03** | Hasil cetakan (Print PDF) rapi di kertas A4 (tidak terpotong margin).
4. **UA-A5-04** | Ejaan angka Terbilang Rupiah di PDF sudah sesuai EYD bahasa Indonesia.
5. **UA-A5-05** | Notifikasi badge merah di sidebar efektif menyadarkan atasan adanya antrean.
