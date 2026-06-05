# 📊 Panduan Presentasi SPK MOORA — Si-LATORJANA

Dokumen ini dibuat secara khusus untuk membantu Anda dalam **mencari file**, **menjelaskan alur kode**, dan **memaparkan perhitungan matematis** metode **MOORA** (Multi-Objective Optimization on the basis of Ratio Analysis) pada saat presentasi.

---

## 📂 Peta Berkas (File Mapping)

Semua berkas SPK dibuat secara terpisah (modular) agar mudah dicari dan ditunjukkan ke dosen/penguji:

### 🖥️ Backend (Laravel)
1. **Algoritma Inti (Service):**
   * [MooraCalculator.php](file:///home/udin/SILATORJANA/backend/app/Services/MooraCalculator.php) — Tempat seluruh rumus matematika MOORA dan rubrik penalti diprogram.
2. **API Endpoint (Controller):**
   * [SpkController.php](file:///home/udin/SILATORJANA/backend/app/Http/Controllers/Api/SpkController.php) — Menyediakan REST API untuk kriteria, kalkulasi real-time, batch, simpan, dan riwayat.
3. **Struktur Database (Migrations):**
   * [..._create_spk_kriteria_table.php](file:///home/udin/SILATORJANA/backend/database/migrations/2026_06_06_100000_create_spk_kriteria_table.php) — Definisi kriteria C1–C4.
   * [..._create_spk_penilaian_table.php](file:///home/udin/SILATORJANA/backend/database/migrations/2026_06_06_100001_create_spk_penilaian_table.php) — Tempat menyimpan skor kualitas final hasil approve LPJ.
   * [..._add_spk_fields_to_lpj_and_iku.php](file:///home/udin/SILATORJANA/backend/database/migrations/2026_06_06_100002_add_spk_fields_to_lpj_and_iku.php) — Kolom `tanggal_pelaksanaan_real` pada LPJ & `capaian_persen` pada IKU.
4. **Data Awal (Seeder):**
   * [SpkKriteriaSeeder.php](file:///home/udin/SILATORJANA/backend/database/seeders/SpkKriteriaSeeder.php) — Seed kriteria C1-C4 dengan bobot default masing-masing $0.25$.
5. **Model Eloquent:**
   * [SpkKriteria.php](file:///home/udin/SILATORJANA/backend/app/Models/SpkKriteria.php)
   * [SpkPenilaian.php](file:///home/udin/SILATORJANA/backend/app/Models/SpkPenilaian.php)
6. **Routes:**
   * [api.php](file:///home/udin/SILATORJANA/backend/routes/api.php#L118-L124) — Grup routes `/spk`.

### 🎨 Frontend (React + TS)
1. **Utilitas Kalkulasi Frontend:**
   * [mooraCalculator.ts](file:///home/udin/SILATORJANA/src/lib/mooraCalculator.ts) — Berisi types dan logic helper MOORA untuk visualisasi langkah-langkah di modal.
2. **Koneksi API Client:**
   * [api.ts](file:///home/udin/SILATORJANA/src/lib/api.ts#L309-L337) — Fungsi `apiGetSpkKriteria`, `apiHitungSpk`, `apiHitungSpkBatch`, `apiSimpanSpk`, dan `apiGetSpkRiwayat`.
3. **Komponen Visual SPK:**
   * [SpkScoreCard.tsx](file:///home/udin/SILATORJANA/src/components/spk/SpkScoreCard.tsx) — Kartu gauge/donut chart ringkasan skor dan grade LPJ.
   * [SpkDetailModal.tsx](file:///home/udin/SILATORJANA/src/components/spk/SpkDetailModal.tsx) — Modal interaktif yang menunjukkan step-by-step tabel MOORA.
   * [SpkDashboardWidget.tsx](file:///home/udin/SILATORJANA/src/components/spk/SpkDashboardWidget.tsx) — Widget analisis kualitas, distribusi grade, dan evaluasi teranyar di dashboard Bendahara.
4. **Integrasi Halaman:**
   * [LpjVerificationPage.tsx](file:///home/udin/SILATORJANA/src/pages/bendahara/LpjVerificationPage.tsx) — Halaman approval LPJ Bendahara.
   * [BendaharaDashboard.tsx](file:///home/udin/SILATORJANA/src/pages/bendahara/BendaharaDashboard.tsx) — Integrasi `SpkDashboardWidget` di dashboard utama.

---

## 📐 Penjelasan Rubrik Kriteria (C1 - C4)

Semua kriteria bertipe **Benefit** (semakin besar skor/preferensi semakin baik). Skor dasar dikonversi ke skala **0 - 100** sebelum masuk ke matriks keputusan MOORA.

| Kriteria | Tepat = 100 | Hampir = 75 | Meleset = 50 | Nol = 0 | Deskripsi / Rumus Matematika |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **C1: Waktu Pelaksanaan** | Deviasi = $0$ hari | Deviasi $1 \le 3$ hari | Deviasi $> 3$ hari | - | Deviasi = $|TanggalRencana - TanggalRiil|$ |
| **C2: Ketepatan Anggaran**| Selisih Rp 0 | Selisih $< 10\%$ | Selisih $\ge 10\%$ | - | Deviasi = $\frac{|TotalRealisasi - TotalKAK|}{TotalKAK} \times 100\%$ |
| **C3: Output IKU** | Capaian $\ge 1.0$ | - | - | Capaian $< 1.0$ | Rata-rata dari semua IKU $\sum (\frac{Capaian}{Target})$ |
| **C4: Waktu Approval** | Durasi $\le 14$ hari | - | Durasi $> 14$ hari | - | Jika $> 14$ hari: $Skor = \max(0, 100 - (Keterlambatan \times 5))$ |

---

## 📊 Langkah-Langkah Matematis Algoritma MOORA

Metode MOORA dalam aplikasi ini dijalankan melalui 4 tahap utama:

### 1. Pembentukan Matriks Keputusan ($X$)
Matriks berukuran $m \times n$, di mana $m$ adalah jumlah LPJ (alternatif) yang sedang diverifikasi dan $n$ adalah jumlah kriteria ($4$ kriteria).
$$
X = \begin{pmatrix}
x_{11} & x_{12} & x_{13} & x_{14} \\
x_{21} & x_{22} & x_{23} & x_{24} \\
\vdots & \vdots & \vdots & \vdots \\
x_{m1} & x_{m2} & x_{m3} & x_{m4}
\end{pmatrix}
$$

### 2. Normalisasi Matriks ($X^*$)
Menggunakan metode **Rasio Akar Kuadrat** untuk menyamakan skala nilai antar kriteria:
$$
x^*_{ij} = \frac{x_{ij}}{\sqrt{\sum_{i=1}^{m} x_{ij}^2}}
$$
> **Catatan Presentasi:** Jika hanya ada 1 LPJ yang dihitung (single evaluation), nilai pembagi adalah $\sqrt{x_{1j}^2} = x_{1j}$, sehingga hasil normalisasinya bernilai $1.0$ (selama skor $> 0$). Untuk pemeringkatan batch yang bermakna, gunakan perbandingan dengan alternatif lain di endpoint `hitungBatch`.

### 3. Perhitungan Nilai Optimasi / Preferensi ($Y_i$)
Mengalikan nilai normalisasi dengan bobot kriteria ($w_j = 0.25$ untuk C1–C4):
$$
Y_i = \sum_{j=1}^{n} w_j \cdot x^*_{ij}
$$
Karena semua kriteria di Si-LATORJANA adalah kriteria **Benefit**, tidak ada pengurangan nilai cost. Nilai $Y_i$ berada pada rentang $0$ hingga $1$ (atau $0\%$ - $100\%$).

### 4. Klasifikasi Mutu (Penentuan Grade)
Berdasarkan nilai preferensi akhir $Y_i$:
* 🟢 **Grade A (Sangat Baik):** $Y_i \ge 0.80$
* 🔵 **Grade B (Baik):** $Y_i \ge 0.60$
* 🟡 **Grade C (Cukup):** $Y_i \ge 0.40$
* 🔴 **Grade D (Kurang):** $Y_i < 0.40$

---

## 💡 Tips & Trik Saat Demostrasi / Presentasi

1. **Jelaskan Mengapa Memakai MOORA:**
   * MOORA sangat ringan secara komputasi dan tidak membutuhkan proses pelatihan model data.
   * MOORA sangat objektif dalam membandingkan kualitas LPJ satu organisasi dengan organisasi lain karena menggunakan pembagi akar kuadrat dari total kualitas seluruh alternatif.
2. **Cara Menunjukkan Hasil SPK di Aplikasi:**
   * Masuk sebagai **Bendahara**.
   * Di dashboard utama, tunjukkan **SpkDashboardWidget** yang menampilkan rata-rata skor kualitas LPJ dan diagram distribusi grade (A/B/C/D).
   * Buka salah satu LPJ yang berstatus *Menunggu Tindakan*. Tunjukkan kartu skor kualitas di sisi kanan (SpkScoreCard).
   * Klik tombol **"Lihat Detail Perhitungan"**. Ini akan membuka **SpkDetailModal** yang menampilkan matriks asli, pembagi, matriks normalisasi, bobot, dan hasil akhir secara real-time.
   * Tekan tombol **"LPJ Disetujui & Selesai"**. Jelaskan bahwa saat disetujui, nilai SPK ini disimpan secara permanen ke database untuk kebutuhan arsip dan pelaporan mutu jurusan.
