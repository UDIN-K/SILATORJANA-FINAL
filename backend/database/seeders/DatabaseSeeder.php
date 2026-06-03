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
