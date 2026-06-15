# Laporan Evaluasi Keamanan Aplikasi Si-LATORJANA
## Penilaian Project-Based Learning (PBL) Keamanan Informasi

Dokumen ini disusun untuk melaporkan implementasi keamanan pada aplikasi **Si-LATORJANA** (Sistem Layanan Administrasi Pelaporan Kegiatan Jurusan), mencakup penguatan autentikasi, penerapan kriptografi, analisis kerentanan (vulnerability analysis), serta checklist keamanan web.

---

## 1. Penerapan Password yang Kuat dan Nyaman (Bobot: 10%)

Keamanan autentikasi ditingkatkan dengan menyeimbangkan kekuatan keamanan (*security*) dan kenyamanan pengguna (*usability*).

### A. Penguatan Keamanan di Sisi Backend
Kami memperbarui validasi kata sandi pada endpoint ganti password (`/api/change-password`) serta manajemen pengguna (`UserController` untuk pembuatan/pembaruan user) menggunakan aturan validasi bawaan Laravel:
- **Minimal 8 Karakter**: Mencegah serangan menebak kata sandi (*brute-force*).
- **Kombinasi Huruf Besar & Kecil**: Menambah kompleksitas karakter.
- **Wajib Memiliki Angka**: Mempersulit peretasan berbasis kamus (*dictionary attack*).
- **Wajib Memiliki Karakter Khusus / Simbol**: Memaksimalkan entropi kata sandi.

*Implementasi Validasi Laravel:*
```php
\Illuminate\Validation\Rules\Password::min(8)
    ->letters()
    ->mixedCase()
    ->numbers()
    ->symbols()
```

### B. Kenyamanan Pengguna di Sisi Frontend
Untuk memudahkan pengguna mengikuti aturan baru tanpa frustrasi (*comfortable password input*), kami menambahkan dua fitur baru pada halaman Profil Saya (`ProfilePage.tsx`) dan Formulir Admin (`UserFormPage.tsx`):
1. **Show/Hide Password Toggle**: Tombol mata (menggunakan ikon `Eye` / `EyeOff` dari *lucide-react*) di sebelah kanan kolom kata sandi. Fitur ini mengurangi kesalahan pengetikan (*typo*) karena pengguna dapat melihat karakter yang diinput sebelum menyimpan.
2. **Password Strength Indicator (Real-Time)**:
   - Menampilkan kekuatan kata sandi secara dinamis dengan bilah warna (*Strength Bar*):
     - **Sangat Lemah / Lemah**: Merah (0-2 kriteria terpenuhi).
     - **Sedang**: Kuning/Oranye (3-4 kriteria terpenuhi).
     - **Kuat**: Hijau (seluruh 5 kriteria terpenuhi).
   - Menampilkan daftar periksa (*checklist*) dinamis dengan ikon centang hijau jika kriteria terpenuhi atau tanda silang abu-abu jika belum.

---

## 2. Implementasi Kriptografi dalam Aplikasi (Bobot: 30%)

Aplikasi berbasis framework Laravel ini mengimplementasikan kriptografi pada beberapa lapisan data untuk melindungi kerahasiaan (*confidentiality*) dan integritas (*integrity*) informasi sensitif.

### A. Proteksi Kredensial Pengguna di Database (Biometric Token)
Biometrik login pada Si-LATORJANA menggunakan token unik (`biometric_token`). Jika token ini disimpan dalam bentuk teks biasa (*plain text*), kebocoran database akan mengekspos akses masuk tanpa password.
- **Penerapan**: Kami menambahkan *cast* enkripsi di model `User.php`:
  ```php
  protected function casts(): array
  {
      return [
          'biometric_token' => 'encrypted',
      ];
  }
  ```
- **Mekanisme**: Laravel secara otomatis mengenkripsi nilai `biometric_token` menggunakan algoritma **AES-256-CBC** dengan kunci aplikasi (`APP_KEY`) sebelum disimpan ke dalam database.
- **Logika Login**: Karena enkripsi AES-256-CBC bersifat probabilistik (menghasilkan ciphertext berbeda untuk teks yang sama), pencarian langsung melalui SQL `where('biometric_token', ...)` tidak dapat digunakan. Login diperbarui untuk memuat pengguna berdasarkan `email` dan status `allow_biometric`, kemudian melakukan pencocokan token secara aman di memori (in-memory decryption comparison):
  ```php
  $user = \App\Models\User::where('email', $request->email)
      ->where('allow_biometric', true)
      ->first();

  if (!$user || $user->biometric_token !== $request->biometric_token) {
      return response()->json(['message' => 'Token tidak valid.'], 401);
  }
  ```

### B. Hashing Password (Kriptografi Satu Arah)
Kata sandi pengguna tidak boleh didekripsi kembali. Kami menggunakan hashing satu arah berbasis **BCrypt** dengan tingkat kompleksitas kerja sebesar 12 (*work factor / rounds*) melalui `Hash::make()`. Ini melindunginya dari serangan *rainbow table*.

### C. Token Sesi API (Cryptographic Bearer Tokens)
Sesi login dikelola melalui **Laravel Sanctum** yang menghasilkan token kriptografis acak berkekuatan tinggi. Token disimpan di database dalam bentuk hash SHA-256 (`personal_access_tokens`), sehingga jika database dicuri, penyerang tidak dapat langsung menggunakan token tersebut untuk membajak sesi pengguna.

---

## 3. Analisa Kerentanan (Vulnerability Analysis) (Bobot: 30%)

Kami melakukan analisis keamanan manual pada kode sumber (*source code review*) dan menemukan beberapa kerentanan keamanan kritis yang telah dimitigasi.

### Kerentanan 1: Broken Object Level Authorization (IDOR)
- **OWASP Top 10**: A01:2021-Broken Access Control
- **Lokasi Kode**: `UserController@show`
- **Tingkat Kerentanan**: **Tinggi (High)**
- **Deskripsi**: Awalnya, endpoint `/api/users/{user}` mengembalikan detail profil dan riwayat kegiatan pengguna tanpa validasi kepemilikan. Akibatnya, pengguna dengan peran terendah (`pengusul`) dapat membaca informasi pribadi dan NIP milik seluruh pengguna lain, bahkan administrator, hanya dengan mengubah ID numerik pada URL.
- **Mitigasi**: Kami menambahkan otorisasi di `UserController@show` untuk membatasi akses: hanya pemilik akun itu sendiri atau administrator yang dapat melihat profil pengguna tersebut.
- **Kode Perbaikan**:
  ```php
  $currentUser = $request->user();
  if ($currentUser->role !== 'admin' && (string)$currentUser->id !== (string)$id) {
      return response()->json(['message' => 'Anda tidak memiliki hak akses untuk melihat profil pengguna ini.'], 403);
  }
  ```

### Kerentanan 2: Absennya Batasan Percobaan Autentikasi (Lack of Rate Limiting)
- **OWASP Top 10**: A07:2021-Identification and Authentication Failures
- **Lokasi Kode**: `api.php` (`/login`, `/biometric-login`, `/change-password`)
- **Tingkat Kerentanan**: **Sedang (Medium)**
- **Deskripsi**: Endpoint sensitif untuk masuk sistem dan mengubah sandi tidak dibatasi frekuensi permintaannya. Penyerang dapat menggunakan skrip otomatis untuk melakukan serangan kamus (*credential stuffing*) atau menebak biometric token tanpa hambatan.
- **Mitigasi**: Menerapkan middleware rate limiter bawaan Laravel (`throttle:5,1`) pada rute `/login`, `/biometric-login`, dan `/change-password`.
- **Kode Perbaikan**:
  ```php
  Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
  ```
  *Dampak*: Membatasi maksimal 5 kali percobaan per menit per alamat IP. Jika melebihi batasan, server mengembalikan status HTTP `429 Too Many Requests`.

### Kerentanan 3: Sensitive Data Exposure pada Dokumen Unggahan (Financial & Proposal)
- **OWASP Top 10**: A05:2021-Security Misconfiguration
- **Lokasi Kode**: `api.php` (`/upload` route)
- **Tingkat Kerentanan**: **Sedang (Medium)**
- **Deskripsi**: File proposal KAK, Rencana Anggaran Biaya (RAB), dan Laporan Pertanggungjawaban (LPJ) disimpan langsung ke folder publik (`public/data/upload/...`) dengan URL langsung yang dapat diakses oleh publik tanpa login. Siapa pun yang menebak nama file dapat mengunduh dokumen pelaporan keuangan tersebut secara ilegal.
- **Rekomendasi Mitigasi**: 
  1. Pindahkan folder penyimpanan dari folder publik ke direktori privat (`storage/app/private/`).
  2. Buat endpoint unduhan khusus (misal: `/api/download/{file}`) yang dilindungi middleware `auth:sanctum` untuk memeriksa apakah pengguna berhak mengakses dokumen tersebut sebelum melakukan streaming file.

---

## 4. Checklist Keamanan Aplikasi Web Yang Dibuat (Bobot: 10%)

Berikut adalah daftar periksa status implementasi keamanan web pada aplikasi Si-LATORJANA:

| Kategori Keamanan | Item Checklist | Status | Detail Implementasi pada Aplikasi |
| :--- | :--- | :---: | :--- |
| **Autentikasi** | Kebijakan password minimal 8 karakter dengan kombinasi huruf besar, kecil, angka, dan simbol. | **Sesuai (Compliant)** | Diterapkan di backend via Laravel Password Rule, dan di frontend via visual checklist. |
| | Fitur visual penunjang input kata sandi yang nyaman untuk meminimalisir kesalahan pengetikan. | **Sesuai (Compliant)** | Ditambahkan show/hide toggle ikon mata dan dynamic strength bar. |
| | Proteksi login dari serangan brute-force. | **Sesuai (Compliant)** | Menggunakan middleware `throttle:5,1` pada login biasa dan login biometrik. |
| **Kriptografi** | Penyimpanan password menggunakan algoritma hashing satu arah yang aman. | **Sesuai (Compliant)** | Menggunakan enkripsi satu arah BCrypt (rounds=12). |
| | Data token akses biometrik disimpan terenkripsi di database agar aman dari kebocoran data. | **Sesuai (Compliant)** | Enkripsi simetris dua arah AES-256-CBC otomatis via Casts Laravel. |
| | Token autentikasi sesi disimpan dalam format hash aman. | **Sesuai (Compliant)** | Menggunakan personal access token Laravel Sanctum dengan enkripsi hash SHA-256. |
| **Otorisasi** | Pencegahan akses langsung ke profil/data pengguna lain (anti-IDOR). | **Sesuai (Compliant)** | Pengecekan otorisasi ID pengguna dan peran admin pada fungsi `UserController@show`. |
| | Pembatasan hak akses API berdasarkan peran pengguna (Role-Based Access Control). | **Sesuai (Compliant)** | Dilindungi middleware kustom `CheckRole` (pengusul, verifikator, ppk, bendahara, wadir). |
| **Validasi Input** | Penggunaan parameter binding untuk mencegah SQL Injection. | **Sesuai (Compliant)** | Framework Laravel menggunakan PDO parameter binding secara default pada seluruh kueri Eloquent ORM. |
| | Validasi data input di tingkat API untuk memastikan kesesuaian tipe data. | **Sesuai (Compliant)** | Seluruh endpoint POST/PUT dilindungi dengan `$request->validate()` yang ketat. |
| **Keamanan Berkas** | Pembatasan tipe file (mime types) dan batas ukuran file yang dapat diunggah. | **Sesuai (Compliant)** | Endpoint `/upload` membatasi tipe berkas hanya PDF, DOC, XLS, Gambar, dan ukuran maks 10MB. |
| | Perlindungan dokumen penting dari akses langsung publik tanpa autentikasi. | **Belum Selesai (Pending)** | File saat ini disimpan di folder public. Direkomendasikan migrasi ke penyimpanan privat (`storage/`) dengan rute unduhan khusus yang diautentikasi. |

---

*Laporan Keamanan Si-LATORJANA - Juni 2026*
