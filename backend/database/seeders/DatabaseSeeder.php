<?php

namespace Database\Seeders;

use App\Models\Jurusan;
use App\Models\Kegiatan;
use App\Models\Kak;
use App\Models\Rab;
use App\Models\Iku;
use App\Models\IkuMaster;
use App\Models\StatusHistory;
use App\Models\User;
use App\Models\Lpj;
use App\Models\RabRealisasi;
use App\Models\SpkPenilaian;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ============================================================
        // 1. JURUSAN (Departments)
        // ============================================================
        $jurusanData = [
            ['nama_jurusan' => 'Teknik Informatika & Komputer', 'kode' => 'TIK'],
            ['nama_jurusan' => 'Teknik Elektro', 'kode' => 'TE'],
            ['nama_jurusan' => 'Teknik Mesin', 'kode' => 'TM'],
            ['nama_jurusan' => 'Teknik Sipil', 'kode' => 'TS'],
            ['nama_jurusan' => 'Teknik Grafika & Penerbitan', 'kode' => 'TGP'],
            ['nama_jurusan' => 'Akuntansi', 'kode' => 'AK'],
            ['nama_jurusan' => 'Administrasi Niaga', 'kode' => 'AN'],
        ];

        foreach ($jurusanData as $j) {
            Jurusan::create($j);
        }

        // ============================================================
        // 2. USERS — All 7 roles
        // ============================================================
        $password = Hash::make('12345678');

        // Admin
        $admin = User::create([
            'nama' => 'Admin Sistem',
            'email' => 'admin@pnj.ac.id',
            'password' => $password,
            'role' => 'admin',
            'jurusan' => 'Teknik Informatika & Komputer',
        ]);

        // Pengusul (3 users — different jurusan)
        $pengusul1 = User::create([
            'nama' => 'Dr. Budi Santoso, M.Kom.',
            'email' => 'budi@pnj.ac.id',
            'password' => $password,
            'role' => 'pengusul',
            'jurusan' => 'Teknik Informatika & Komputer',
            'nip' => '198505012010011001',
        ]);

        $pengusul2 = User::create([
            'nama' => 'Ir. Siti Rahayu, M.T.',
            'email' => 'siti@pnj.ac.id',
            'password' => $password,
            'role' => 'pengusul',
            'jurusan' => 'Teknik Elektro',
            'nip' => '199001152015022001',
        ]);

        $pengusul3 = User::create([
            'nama' => 'Ahmad Fajar, S.T., M.Eng.',
            'email' => 'fajar@pnj.ac.id',
            'password' => $password,
            'role' => 'pengusul',
            'jurusan' => 'Teknik Mesin',
            'nip' => '198810202012011002',
        ]);

        // Verifikators for each Wadir unit
        $verifikator1 = User::create([
            'nama' => 'Verifikator Wadir I (Akademik)',
            'email' => 'verifikator.wadir1@si-latorjana.com',
            'password' => $password,
            'role' => 'verifikator',
            'verifikator_unit' => 'wadir1',
            'nip' => '197503011999032001',
        ]);

        $verifikator2 = User::create([
            'nama' => 'Verifikator Wadir II (Keuangan)',
            'email' => 'verifikator.wadir2@si-latorjana.com',
            'password' => $password,
            'role' => 'verifikator',
            'verifikator_unit' => 'wadir2',
            'nip' => '197503011999032002',
        ]);

        $verifikator3 = User::create([
            'nama' => 'Verifikator Wadir III (Kemahasiswaan)',
            'email' => 'verifikator.wadir3@si-latorjana.com',
            'password' => $password,
            'role' => 'verifikator',
            'verifikator_unit' => 'wadir3',
            'nip' => '197503011999032003',
        ]);

        $verifikator4 = User::create([
            'nama' => 'Verifikator Wadir IV (Kerjasama)',
            'email' => 'verifikator.wadir4@si-latorjana.com',
            'password' => $password,
            'role' => 'verifikator',
            'verifikator_unit' => 'wadir4',
            'nip' => '197503011999032004',
        ]);


        // PPK
        $ppk = User::create([
            'nama' => 'Dr. Hendri Wijaya, S.E., M.M.',
            'email' => 'hendri@pnj.ac.id',
            'password' => $password,
            'role' => 'ppk',
            'nip' => '197201151998021001',
        ]);

        // Wadir 2
        $wadir = User::create([
            'nama' => 'Prof. Dr. Ir. Susanto, M.Sc.',
            'email' => 'susanto@pnj.ac.id',
            'password' => $password,
            'role' => 'wadir2',
            'nip' => '196505051990031001',
        ]);

        // Wadir 1
        User::create([
            'nama' => 'Dr. Ir. H. Akhmad Syakhroni, M.T.',
            'email' => 'wadir1@pnj.ac.id',
            'password' => $password,
            'role' => 'wadir1',
            'nip' => '196805051993031001',
        ]);

        // Wadir 3
        User::create([
            'nama' => 'Ir. H. Iwan Supriyadi, M.T.',
            'email' => 'wadir3@pnj.ac.id',
            'password' => $password,
            'role' => 'wadir3',
            'nip' => '196705051992031001',
        ]);

        // Wadir 4
        User::create([
            'nama' => 'Dr. Ir. H. M. Yusuf, M.T.',
            'email' => 'wadir4@pnj.ac.id',
            'password' => $password,
            'role' => 'wadir4',
            'nip' => '196905051994031001',
        ]);

        // Bendahara
        $bendahara = User::create([
            'nama' => 'Ratna Sari, S.E., M.Ak.',
            'email' => 'ratna@pnj.ac.id',
            'password' => $password,
            'role' => 'bendahara',
            'jurusan' => 'Akuntansi',
            'nip' => '198209012006042001',
        ]);

        // Rektorat
        $rektorat = User::create([
            'nama' => 'Prof. Dr. H. Agus Prasetyo',
            'email' => 'agus@pnj.ac.id',
            'password' => $password,
            'role' => 'rektorat',
            'nip' => '196001011985031001',
        ]);

        // ============================================================
        // 3. IKU MASTER
        // ============================================================
        $ikuMasters = [
            IkuMaster::create(['nama_indikator' => 'Peningkatan Kualitas Lulusan']),
            IkuMaster::create(['nama_indikator' => 'Peningkatan Publikasi Ilmiah']),
            IkuMaster::create(['nama_indikator' => 'Peningkatan Kerjasama Industri']),
            IkuMaster::create(['nama_indikator' => 'Peningkatan Kompetensi SDM']),
            IkuMaster::create(['nama_indikator' => 'Optimalisasi Tata Kelola']),
        ];

        // ============================================================
        // 4. KEGIATAN (Various statuses for testing)
        // ============================================================

        // --- Kegiatan 1: SUBMITTED (menunggu verifikasi) ---
        $k1 = Kegiatan::create([
            'nama_kegiatan' => 'Workshop IoT dan Embedded System',
            'deskripsi' => 'Workshop hands-on Internet of Things menggunakan ESP32 dan sensor untuk mahasiswa semester 5-6.',
            'jenis_kegiatan' => 'pelatihan',
            'status' => 'submitted',
            'pengusul_id' => $pengusul1->id,
            'pengusul_nama' => $pengusul1->nama,
            'nama_jurusan' => $pengusul1->jurusan,
            'tanggal_kegiatan' => '2026-07-15',
            'tempat' => 'Lab IoT Lt. 3 Gedung TIK',
            'total_anggaran' => 15500000,
        ]);
        Kak::create([
            'kegiatan_id' => $k1->id,
            'gambaran_umum' => 'Workshop ini bertujuan meningkatkan kompetensi mahasiswa dalam bidang IoT yang merupakan kebutuhan industri 4.0.',
            'penerima_manfaat' => '40 mahasiswa semester 5-6 Jurusan TIK',
            'strategi_pencapaian' => 'Pembelajaran berbasis proyek dengan output berupa prototipe IoT',
            'metode_pelaksanaan' => 'Teori (30%) + Praktik Hands-on (70%)',
            'tahapan_pelaksanaan' => "1. Persiapan materi dan komponen\n2. Sesi teori dasar IoT\n3. Praktik pemrograman ESP32\n4. Integrasi sensor\n5. Demo & presentasi proyek",
            'kurun_waktu_mulai' => '2026-07-15',
            'kurun_waktu_selesai' => '2026-07-17',
        ]);
        Rab::create(['kegiatan_id' => $k1->id, 'uraian' => 'Kit ESP32 + sensor', 'kategori' => 'barang', 'harga_satuan' => 250000, 'qty1' => 40, 'satuan1' => 'set', 'total' => 10000000]);
        Rab::create(['kegiatan_id' => $k1->id, 'uraian' => 'Konsumsi peserta (3 hari)', 'kategori' => 'konsumsi', 'harga_satuan' => 35000, 'qty1' => 40, 'qty2' => 3, 'satuan1' => 'orang', 'total' => 4200000]);
        Rab::create(['kegiatan_id' => $k1->id, 'uraian' => 'Honor narasumber', 'kategori' => 'honor', 'harga_satuan' => 650000, 'qty1' => 2, 'satuan1' => 'orang', 'total' => 1300000]);

        StatusHistory::create(['ref_type' => 'kegiatan', 'ref_id' => $k1->id, 'status_lama' => 'draft', 'status_baru' => 'submitted', 'catatan' => 'Diajukan oleh pengusul', 'user_id' => $pengusul1->id, 'user_nama' => $pengusul1->nama, 'user_role' => 'pengusul']);

        // --- Kegiatan 2: VERIFIED (sudah diverifikasi, menunggu PPK) ---
        $k2 = Kegiatan::create([
            'nama_kegiatan' => 'Seminar Nasional Energi Terbarukan',
            'deskripsi' => 'Seminar nasional menghadirkan pakar energi terbarukan dari perguruan tinggi dan industri.',
            'jenis_kegiatan' => 'acara',
            'status' => 'verified',
            'pengusul_id' => $pengusul2->id,
            'pengusul_nama' => $pengusul2->nama,
            'nama_jurusan' => $pengusul2->jurusan,
            'tanggal_kegiatan' => '2026-08-20',
            'tempat' => 'Auditorium PNJ',
            'total_anggaran' => 45000000,
        ]);
        Kak::create([
            'kegiatan_id' => $k2->id,
            'gambaran_umum' => 'Seminar nasional yang membahas perkembangan terkini teknologi energi terbarukan di Indonesia.',
            'penerima_manfaat' => '200 peserta dari civitas akademika dan masyarakat umum',
            'strategi_pencapaian' => 'Mengundang 5 keynote speaker dari universitas dan industri terkemuka',
            'metode_pelaksanaan' => 'Presentasi keynote + Panel diskusi + Poster session',
        ]);
        Rab::create(['kegiatan_id' => $k2->id, 'uraian' => 'Honor keynote speaker', 'kategori' => 'honor', 'harga_satuan' => 5000000, 'qty1' => 5, 'satuan1' => 'orang', 'total' => 25000000]);
        Rab::create(['kegiatan_id' => $k2->id, 'uraian' => 'Konsumsi peserta', 'kategori' => 'konsumsi', 'harga_satuan' => 50000, 'qty1' => 200, 'satuan1' => 'orang', 'total' => 10000000]);
        Rab::create(['kegiatan_id' => $k2->id, 'uraian' => 'Sewa sound system & dekorasi', 'kategori' => 'jasa', 'harga_satuan' => 10000000, 'qty1' => 1, 'satuan1' => 'paket', 'total' => 10000000]);

        StatusHistory::create(['ref_type' => 'kegiatan', 'ref_id' => $k2->id, 'status_lama' => 'draft', 'status_baru' => 'submitted', 'user_id' => $pengusul2->id, 'user_nama' => $pengusul2->nama, 'user_role' => 'pengusul']);
        StatusHistory::create(['ref_type' => 'kegiatan', 'ref_id' => $k2->id, 'status_lama' => 'submitted', 'status_baru' => 'verified', 'catatan' => 'Proposal sudah lengkap dan layak.', 'user_id' => $verifikator2->id, 'user_nama' => $verifikator2->nama, 'user_role' => 'verifikator']);

        // --- Kegiatan 3: APPROVED_PPK (menunggu Wadir) ---
        $k3 = Kegiatan::create([
            'nama_kegiatan' => 'Pengadaan Alat Praktikum CNC',
            'jenis_kegiatan' => 'pengadaan',
            'status' => 'approved_ppk',
            'pengusul_id' => $pengusul3->id,
            'pengusul_nama' => $pengusul3->nama,
            'nama_jurusan' => $pengusul3->jurusan,
            'tanggal_kegiatan' => '2026-09-01',
            'tempat' => 'Bengkel Mesin Lt. 1',
            'total_anggaran' => 120000000,
        ]);
        Kak::create([
            'kegiatan_id' => $k3->id,
            'gambaran_umum' => 'Pengadaan mesin CNC mini untuk menunjang praktikum mahasiswa program studi Teknik Mesin.',
            'penerima_manfaat' => 'Seluruh mahasiswa program studi D3 & D4 Teknik Mesin',
            'strategi_pencapaian' => 'Pengadaan melalui proses tender terbatas sesuai regulasi',
        ]);
        Rab::create(['kegiatan_id' => $k3->id, 'uraian' => 'Mesin CNC Mini 3-axis', 'kategori' => 'barang', 'harga_satuan' => 55000000, 'qty1' => 2, 'satuan1' => 'unit', 'total' => 110000000]);
        Rab::create(['kegiatan_id' => $k3->id, 'uraian' => 'Instalasi & kalibrasi', 'kategori' => 'jasa', 'harga_satuan' => 10000000, 'qty1' => 1, 'satuan1' => 'paket', 'total' => 10000000]);

        StatusHistory::create(['ref_type' => 'kegiatan', 'ref_id' => $k3->id, 'status_lama' => 'draft', 'status_baru' => 'submitted', 'user_id' => $pengusul3->id, 'user_nama' => $pengusul3->nama, 'user_role' => 'pengusul']);
        StatusHistory::create(['ref_type' => 'kegiatan', 'ref_id' => $k3->id, 'status_lama' => 'submitted', 'status_baru' => 'verified', 'user_id' => $verifikator2->id, 'user_nama' => $verifikator2->nama, 'user_role' => 'verifikator']);
        StatusHistory::create(['ref_type' => 'kegiatan', 'ref_id' => $k3->id, 'status_lama' => 'verified', 'status_baru' => 'approved_ppk', 'catatan' => 'Disetujui. Sesuai kebutuhan laboratorium.', 'user_id' => $ppk->id, 'user_nama' => $ppk->nama, 'user_role' => 'ppk']);

        // --- Kegiatan 4: APPROVED_WADIR (menunggu Bendahara) ---
        $k4 = Kegiatan::create([
            'nama_kegiatan' => 'Pelatihan Sertifikasi AWS Cloud Practitioner',
            'jenis_kegiatan' => 'pelatihan',
            'status' => 'approved_wadir',
            'pengusul_id' => $pengusul1->id,
            'pengusul_nama' => $pengusul1->nama,
            'nama_jurusan' => $pengusul1->jurusan,
            'tanggal_kegiatan' => '2026-06-10',
            'tempat' => 'Lab Komputer 2 Gedung TIK',
            'total_anggaran' => 32000000,
        ]);
        Rab::create(['kegiatan_id' => $k4->id, 'uraian' => 'Biaya ujian sertifikasi AWS', 'kategori' => 'jasa', 'harga_satuan' => 1500000, 'qty1' => 20, 'satuan1' => 'orang', 'total' => 30000000]);
        Rab::create(['kegiatan_id' => $k4->id, 'uraian' => 'Modul & buku panduan', 'kategori' => 'barang', 'harga_satuan' => 100000, 'qty1' => 20, 'satuan1' => 'eks', 'total' => 2000000]);

        // --- Kegiatan 5: REVISION_REQUESTED (perlu revisi) ---
        $k5 = Kegiatan::create([
            'nama_kegiatan' => 'Studi Banding ke Universitas Brawijaya',
            'jenis_kegiatan' => 'lainnya',
            'status' => 'revision_requested',
            'pengusul_id' => $pengusul2->id,
            'pengusul_nama' => $pengusul2->nama,
            'nama_jurusan' => $pengusul2->jurusan,
            'total_anggaran' => 85000000,
            'catatan_revisi' => "[RAB] Biaya transport terlalu tinggi, mohon sesuaikan tarif.\n[KAK - Tujuan] Tujuan studi banding belum spesifik, perlu ditajamkan.",
        ]);
        Rab::create(['kegiatan_id' => $k5->id, 'uraian' => 'Transportasi PP Jakarta-Malang', 'kategori' => 'transport', 'harga_satuan' => 2500000, 'qty1' => 30, 'satuan1' => 'orang', 'total' => 75000000]);
        Rab::create(['kegiatan_id' => $k5->id, 'uraian' => 'Akomodasi 2 malam', 'kategori' => 'jasa', 'harga_satuan' => 350000, 'qty1' => 15, 'qty2' => 2, 'satuan1' => 'kamar', 'total' => 10500000]);

        StatusHistory::create(['ref_type' => 'kegiatan', 'ref_id' => $k5->id, 'status_lama' => 'submitted', 'status_baru' => 'revision_requested', 'catatan' => 'Mohon revisi RAB dan KAK sesuai catatan.', 'user_id' => $verifikator2->id, 'user_nama' => $verifikator2->nama, 'user_role' => 'verifikator']);


        // --- Kegiatan 6: COMPLETED (selesai) ---
        $k6 = Kegiatan::create([
            'nama_kegiatan' => 'Kompetisi Robot Nasional',
            'jenis_kegiatan' => 'acara',
            'status' => 'completed',
            'pengusul_id' => $pengusul1->id,
            'pengusul_nama' => $pengusul1->nama,
            'nama_jurusan' => $pengusul1->jurusan,
            'tanggal_kegiatan' => '2026-03-15',
            'tempat' => 'Surabaya Convention Center',
            'total_anggaran' => 25000000,
        ]);
        Rab::create(['kegiatan_id' => $k6->id, 'uraian' => 'Biaya registrasi tim', 'kategori' => 'jasa', 'harga_satuan' => 5000000, 'qty1' => 2, 'satuan1' => 'tim', 'total' => 10000000]);
        Rab::create(['kegiatan_id' => $k6->id, 'uraian' => 'Transport + akomodasi', 'kategori' => 'transport', 'harga_satuan' => 1500000, 'qty1' => 10, 'satuan1' => 'orang', 'total' => 15000000]);

        // --- Kegiatan 7: REJECTED ---
        $k7 = Kegiatan::create([
            'nama_kegiatan' => 'Piknik Jurusan ke Bali',
            'jenis_kegiatan' => 'lainnya',
            'status' => 'rejected',
            'pengusul_id' => $pengusul3->id,
            'pengusul_nama' => $pengusul3->nama,
            'nama_jurusan' => $pengusul3->jurusan,
            'total_anggaran' => 200000000,
            'catatan_revisi' => 'Ditolak: tidak sesuai visi misi institusi.',
        ]);

        // --- Kegiatan 8: DRAFT ---
        $k8 = Kegiatan::create([
            'nama_kegiatan' => 'Penelitian Optimasi Proses Manufaktur Aditif',
            'deskripsi' => 'Penelitian menggunakan metode Taguchi untuk optimasi parameter 3D printing FDM.',
            'jenis_kegiatan' => 'riset',
            'status' => 'draft',
            'pengusul_id' => $pengusul3->id,
            'pengusul_nama' => $pengusul3->nama,
            'nama_jurusan' => $pengusul3->jurusan,
            'total_anggaran' => 0,
        ]);

        // ============================================================
        // 5. IKU entries linked to kegiatan
        // ============================================================
        Iku::create(['kegiatan_id' => $k1->id, 'nama_iku' => 'Peningkatan Kompetensi SDM', 'target_persen' => 75]);
        Iku::create(['kegiatan_id' => $k2->id, 'nama_iku' => 'Peningkatan Publikasi Ilmiah', 'target_persen' => 70]);
        Iku::create(['kegiatan_id' => $k2->id, 'nama_iku' => 'Peningkatan Kerjasama Industri', 'target_persen' => 60]);
        Iku::create(['kegiatan_id' => $k3->id, 'nama_iku' => 'Peningkatan Kualitas Lulusan', 'target_persen' => 85]);
        Iku::create(['kegiatan_id' => $k4->id, 'nama_iku' => 'Peningkatan Kompetensi SDM', 'target_persen' => 80]);

        // ============================================================
        // 6. SPK KRITERIA & PENILAIAN MOCK DATA
        // ============================================================
        $this->call(SpkKriteriaSeeder::class);

        // --- Mock Lpj for completed Kegiatan 6 (Grade A) ---
        $lpj6 = Lpj::create([
            'kegiatan_id' => $k6->id,
            'catatan_pengusul' => 'Laporan kompetisi robot selesai.',
            'status_verifikasi' => 'approved',
            'file_lpj' => 'lpj_robot.pdf',
            'tanggal_pengajuan' => now()->subDays(30),
            'tanggal_pelaksanaan_real' => '2026-03-15',
        ]);

        $rabsK6 = Rab::where('kegiatan_id', $k6->id)->get();
        foreach ($rabsK6 as $r) {
            RabRealisasi::create([
                'kegiatan_id' => $k6->id,
                'rab_id' => $r->id,
                'qty1' => $r->qty1 ?? 0,
                'satuan1' => $r->satuan1,
                'qty2' => $r->qty2 ?? 1,
                'satuan2' => $r->satuan2,
                'qty3' => $r->qty3,
                'satuan3' => $r->satuan3,
                'harga_satuan' => $r->harga_satuan,
            ]);
        }

        Iku::create([
            'kegiatan_id' => $k6->id,
            'nama_iku' => 'Peningkatan Kualitas Lulusan',
            'target_persen' => 80,
            'capaian_persen' => 80,
        ]);

        SpkPenilaian::create([
            'kegiatan_id' => $k6->id,
            'lpj_id' => $lpj6->id,
            'skor_c1' => 100,
            'skor_c2' => 100,
            'skor_c3' => 100,
            'skor_c4' => 100,
            'norm_c1' => 0.500000,
            'norm_c2' => 0.500000,
            'norm_c3' => 0.500000,
            'norm_c4' => 0.500000,
            'skor_akhir' => 0.850000,
            'grade' => 'A',
            'dinilai_oleh' => 'Ratna Sari, S.E., M.Ak.',
            'dinilai_pada' => now()->subDays(25),
        ]);

        // --- Kegiatan 9: completed (Grade B) ---
        $k9 = Kegiatan::create([
            'nama_kegiatan' => 'Smart Agriculture IoT Workshop',
            'jenis_kegiatan' => 'pelatihan',
            'status' => 'completed',
            'pengusul_id' => $pengusul1->id,
            'pengusul_nama' => $pengusul1->nama,
            'nama_jurusan' => $pengusul1->jurusan,
            'tanggal_kegiatan' => now()->subDays(45)->toDateString(),
            'tempat' => 'Lab IoT Lt. 3',
            'total_anggaran' => 10000000,
        ]);
        $rabK9 = Rab::create(['kegiatan_id' => $k9->id, 'uraian' => 'Sensor & Kit', 'kategori' => 'barang', 'harga_satuan' => 200000, 'qty1' => 50, 'satuan1' => 'unit', 'total' => 10000000]);
        RabRealisasi::create([
            'kegiatan_id' => $k9->id,
            'rab_id' => $rabK9->id,
            'qty1' => 50,
            'satuan1' => 'unit',
            'qty2' => 1,
            'qty3' => null,
            'harga_satuan' => 190000, // 9.5M (5% deviation)
        ]);
        Iku::create([
            'kegiatan_id' => $k9->id,
            'nama_iku' => 'Peningkatan Kompetensi SDM',
            'target_persen' => 80,
            'capaian_persen' => 82, // > 100% target
        ]);
        $lpj9 = Lpj::create([
            'kegiatan_id' => $k9->id,
            'catatan_pengusul' => 'Realisasi workshop IoT pertanian.',
            'status_verifikasi' => 'approved',
            'file_lpj' => 'lpj_iot_pertanian.pdf',
            'tanggal_pengajuan' => now()->subDays(40),
            'tanggal_pelaksanaan_real' => now()->subDays(43)->toDateString(), // 2 days deviation -> C1 = 75
        ]);
        SpkPenilaian::create([
            'kegiatan_id' => $k9->id,
            'lpj_id' => $lpj9->id,
            'skor_c1' => 75,
            'skor_c2' => 75,
            'skor_c3' => 100,
            'skor_c4' => 100,
            'norm_c1' => 0.430000,
            'norm_c2' => 0.430000,
            'norm_c3' => 0.520000,
            'norm_c4' => 0.520000,
            'skor_akhir' => 0.680000,
            'grade' => 'B',
            'dinilai_oleh' => 'Ratna Sari, S.E., M.Ak.',
            'dinilai_pada' => now()->subDays(38),
        ]);

        // --- Kegiatan 10: completed (Grade C) ---
        $k10 = Kegiatan::create([
            'nama_kegiatan' => 'Lokakarya Jurnalistik Mahasiswa',
            'jenis_kegiatan' => 'pelatihan',
            'status' => 'completed',
            'pengusul_id' => $pengusul2->id,
            'pengusul_nama' => $pengusul2->nama,
            'nama_jurusan' => $pengusul2->jurusan,
            'tanggal_kegiatan' => now()->subDays(60)->toDateString(),
            'tempat' => 'Aula Gedung TGP',
            'total_anggaran' => 12000000,
        ]);
        $rabK10 = Rab::create(['kegiatan_id' => $k10->id, 'uraian' => 'Konsumsi & Modul', 'kategori' => 'barang', 'harga_satuan' => 120000, 'qty1' => 100, 'satuan1' => 'paket', 'total' => 12000000]);
        RabRealisasi::create([
            'kegiatan_id' => $k10->id,
            'rab_id' => $rabK10->id,
            'qty1' => 100,
            'satuan1' => 'paket',
            'qty2' => 1,
            'qty3' => null,
            'harga_satuan' => 100000, // 10M (16.6% deviation -> C2 = 50)
        ]);
        Iku::create([
            'kegiatan_id' => $k10->id,
            'nama_iku' => 'Peningkatan Publikasi Ilmiah',
            'target_persen' => 70,
            'capaian_persen' => 70, // 100% target -> C3 = 100
        ]);
        $lpj10 = Lpj::create([
            'kegiatan_id' => $k10->id,
            'catatan_pengusul' => 'Realisasi lokakarya jurnalistik.',
            'status_verifikasi' => 'approved',
            'file_lpj' => 'lpj_jurnalistik.pdf',
            'tanggal_pengajuan' => now()->subDays(50),
            'tanggal_pelaksanaan_real' => now()->subDays(55)->toDateString(), // 5 days deviation -> C1 = 50
        ]);
        SpkPenilaian::create([
            'kegiatan_id' => $k10->id,
            'lpj_id' => $lpj10->id,
            'skor_c1' => 50,
            'skor_c2' => 50,
            'skor_c3' => 100,
            'skor_c4' => 100,
            'norm_c1' => 0.280000,
            'norm_c2' => 0.280000,
            'norm_c3' => 0.520000,
            'norm_c4' => 0.520000,
            'skor_akhir' => 0.490000,
            'grade' => 'C',
            'dinilai_oleh' => 'Ratna Sari, S.E., M.Ak.',
            'dinilai_pada' => now()->subDays(48),
        ]);

        // --- Kegiatan 11: completed (Grade D) ---
        $k11 = Kegiatan::create([
            'nama_kegiatan' => 'Kunjungan Museum Grafika',
            'jenis_kegiatan' => 'lainnya',
            'status' => 'completed',
            'pengusul_id' => $pengusul2->id,
            'pengusul_nama' => $pengusul2->nama,
            'nama_jurusan' => $pengusul2->jurusan,
            'tanggal_kegiatan' => now()->subDays(90)->toDateString(),
            'tempat' => 'Museum Jakarta',
            'total_anggaran' => 5000000,
        ]);
        $rabK11 = Rab::create(['kegiatan_id' => $k11->id, 'uraian' => 'Tiket Masuk', 'kategori' => 'barang', 'harga_satuan' => 50000, 'qty1' => 100, 'satuan1' => 'orang', 'total' => 5000000]);
        RabRealisasi::create([
            'kegiatan_id' => $k11->id,
            'rab_id' => $rabK11->id,
            'qty1' => 100,
            'satuan1' => 'orang',
            'qty2' => 1,
            'qty3' => null,
            'harga_satuan' => 40000, // 4M (20% deviation -> C2 = 50)
        ]);
        Iku::create([
            'kegiatan_id' => $k11->id,
            'nama_iku' => 'Peningkatan Kualitas Lulusan',
            'target_persen' => 80,
            'capaian_persen' => 60, // 75% target -> C3 = 0
        ]);
        $lpj11 = Lpj::create([
            'kegiatan_id' => $k11->id,
            'catatan_pengusul' => 'LPJ Kunjungan Museum.',
            'status_verifikasi' => 'approved',
            'file_lpj' => 'lpj_museum.pdf',
            'tanggal_pengajuan' => now()->subDays(70),
            'tanggal_pelaksanaan_real' => now()->subDays(85)->toDateString(), // 5 days deviation -> C1 = 50
        ]);
        SpkPenilaian::create([
            'kegiatan_id' => $k11->id,
            'lpj_id' => $lpj11->id,
            'skor_c1' => 50,
            'skor_c2' => 50,
            'skor_c3' => 0,
            'skor_c4' => 50,
            'norm_c1' => 0.280000,
            'norm_c2' => 0.280000,
            'norm_c3' => 0.000000,
            'norm_c4' => 0.260000,
            'skor_akhir' => 0.210000,
            'grade' => 'D',
            'dinilai_oleh' => 'Ratna Sari, S.E., M.Ak.',
            'dinilai_pada' => now()->subDays(68),
        ]);

        // --- Kegiatan 12: lpj_submitted (Awaiting Evaluation - IoT Boot Camp) ---
        $k12 = Kegiatan::create([
            'nama_kegiatan' => 'IoT Boot Camp 2026',
            'jenis_kegiatan' => 'pelatihan',
            'status' => 'lpj_submitted',
            'pengusul_id' => $pengusul1->id,
            'pengusul_nama' => $pengusul1->nama,
            'nama_jurusan' => $pengusul1->jurusan,
            'tanggal_kegiatan' => now()->subDays(10)->toDateString(),
            'tempat' => 'Lab IoT',
            'total_anggaran' => 20000000,
        ]);
        $rabK12_1 = Rab::create(['kegiatan_id' => $k12->id, 'uraian' => 'Komponen Elektronik', 'kategori' => 'barang', 'harga_satuan' => 500000, 'qty1' => 20, 'satuan1' => 'unit', 'total' => 10000000]);
        $rabK12_2 = Rab::create(['kegiatan_id' => $k12->id, 'uraian' => 'Honor Pembicara', 'kategori' => 'jasa', 'harga_satuan' => 5000000, 'qty1' => 2, 'satuan1' => 'orang', 'total' => 10000000]);
        
        RabRealisasi::create([
            'kegiatan_id' => $k12->id,
            'rab_id' => $rabK12_1->id,
            'qty1' => 20,
            'satuan1' => 'unit',
            'qty2' => 1,
            'qty3' => null,
            'harga_satuan' => 500000,
        ]);
        RabRealisasi::create([
            'kegiatan_id' => $k12->id,
            'rab_id' => $rabK12_2->id,
            'qty1' => 2,
            'satuan1' => 'orang',
            'qty2' => 1,
            'qty3' => null,
            'harga_satuan' => 5000000,
        ]);

        Iku::create([
            'kegiatan_id' => $k12->id,
            'nama_iku' => 'Peningkatan Kompetensi SDM',
            'target_persen' => 80,
            'capaian_persen' => 85,
        ]);

        Lpj::create([
            'kegiatan_id' => $k12->id,
            'catatan_pengusul' => 'Laporan LPJ IoT Boot Camp 2026.',
            'status_verifikasi' => 'submitted',
            'file_lpj' => 'lpj_iot_bootcamp_2026.pdf',
            'tanggal_pengajuan' => now()->subDay(),
            'tanggal_pelaksanaan_real' => now()->subDays(10)->toDateString(),
        ]);

        // --- Kegiatan 13: lpj_submitted (Awaiting Evaluation - Seminar Smart Grid) ---
        $k13 = Kegiatan::create([
            'nama_kegiatan' => 'Seminar Smart Grid & Energi Terbarukan',
            'jenis_kegiatan' => 'acara',
            'status' => 'lpj_submitted',
            'pengusul_id' => $pengusul2->id,
            'pengusul_nama' => $pengusul2->nama,
            'nama_jurusan' => $pengusul2->jurusan,
            'tanggal_kegiatan' => now()->subDays(15)->toDateString(),
            'tempat' => 'Aula PNJ',
            'total_anggaran' => 15000000,
        ]);
        $rabK13 = Rab::create(['kegiatan_id' => $k13->id, 'uraian' => 'Sewa Zoom Pro & Gedung', 'kategori' => 'jasa', 'harga_satuan' => 15000000, 'qty1' => 1, 'satuan1' => 'paket', 'total' => 15000000]);
        
        RabRealisasi::create([
            'kegiatan_id' => $k13->id,
            'rab_id' => $rabK13->id,
            'qty1' => 1,
            'satuan1' => 'paket',
            'qty2' => 1,
            'qty3' => null,
            'harga_satuan' => 14000000, // 6.67% deviation
        ]);

        Iku::create([
            'kegiatan_id' => $k13->id,
            'nama_iku' => 'Peningkatan Kerjasama Industri',
            'target_persen' => 70,
            'capaian_persen' => 75,
        ]);

        Lpj::create([
            'kegiatan_id' => $k13->id,
            'catatan_pengusul' => 'Laporan Seminar Smart Grid.',
            'status_verifikasi' => 'submitted',
            'file_lpj' => 'lpj_smart_grid_2026.pdf',
            'tanggal_pengajuan' => now()->subDays(2),
            'tanggal_pelaksanaan_real' => now()->subDays(12)->toDateString(), // 3 days deviation
        ]);

        // --- Kegiatan 14: lpj_revision (Awaiting Evaluation - Kunjungan Industri Mesin) ---
        $k14 = Kegiatan::create([
            'nama_kegiatan' => 'Kunjungan Industri Mesin CNC',
            'jenis_kegiatan' => 'lainnya',
            'status' => 'lpj_revision',
            'pengusul_id' => $pengusul3->id,
            'pengusul_nama' => $pengusul3->nama,
            'nama_jurusan' => $pengusul3->jurusan,
            'tanggal_kegiatan' => now()->subDays(25)->toDateString(),
            'tempat' => 'PT CNC Indonesia',
            'total_anggaran' => 30000000,
        ]);
        $rabK14 = Rab::create(['kegiatan_id' => $k14->id, 'uraian' => 'Sewa Bus Pariwisata', 'kategori' => 'perjalanan', 'harga_satuan' => 15000000, 'qty1' => 2, 'satuan1' => 'bus', 'total' => 30000000]);
        
        RabRealisasi::create([
            'kegiatan_id' => $k14->id,
            'rab_id' => $rabK14->id,
            'qty1' => 2,
            'satuan1' => 'bus',
            'qty2' => 1,
            'qty3' => null,
            'harga_satuan' => 12500000, // 25M (16.67% deviation)
        ]);

        Iku::create([
            'kegiatan_id' => $k14->id,
            'nama_iku' => 'Peningkatan Kualitas Lulusan',
            'target_persen' => 90,
            'capaian_persen' => 80, // 0.88 deviation (C3 = 0)
        ]);

        Lpj::create([
            'kegiatan_id' => $k14->id,
            'catatan_pengusul' => 'Revisi LPJ Kunjungan Industri CNC.',
            'status_verifikasi' => 'submitted',
            'file_lpj' => 'lpj_kunjungan_cnc_revisi.pdf',
            'tanggal_pengajuan' => now()->subDays(20), // 20 days since submit (C4 late)
            'tanggal_pelaksanaan_real' => now()->subDays(20)->toDateString(), // 5 days deviation
        ]);

        $this->command->info('✅ Database seeded successfully!');
        $this->command->info('');
        $this->command->info('📋 Login credentials (password: 12345678):');
        $this->command->info('   Admin:            admin@pnj.ac.id');
        $this->command->info('   Pengusul 1:       budi@pnj.ac.id');
        $this->command->info('   Pengusul 2:       siti@pnj.ac.id');
        $this->command->info('   Pengusul 3:       fajar@pnj.ac.id');
        $this->command->info('   Verif Wadir I:    verifikator.wadir1@si-latorjana.com');
        $this->command->info('   Verif Wadir II:   verifikator.wadir2@si-latorjana.com');
        $this->command->info('   Verif Wadir III:  verifikator.wadir3@si-latorjana.com');
        $this->command->info('   Verif Wadir IV:   verifikator.wadir4@si-latorjana.com');
        $this->command->info('   PPK:              hendri@pnj.ac.id');
        $this->command->info('   Wadir I:          wadir1@pnj.ac.id');
        $this->command->info('   Wadir II:         susanto@pnj.ac.id');
        $this->command->info('   Wadir III:        wadir3@pnj.ac.id');
        $this->command->info('   Wadir IV:         wadir4@pnj.ac.id');
        $this->command->info('   Bendahara:        ratna@pnj.ac.id');
        $this->command->info('   Rektorat:         agus@pnj.ac.id');
        $this->command->info('');
        $this->command->info("📊 Created 8 kegiatan with various statuses.");
    }
}
