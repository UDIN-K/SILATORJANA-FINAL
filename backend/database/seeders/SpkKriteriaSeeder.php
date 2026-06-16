<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SpkKriteria;

class SpkKriteriaSeeder extends Seeder
{
    public function run(): void
    {
        $kriteria = [
            [
                'kode'      => 'C1',
                'nama'      => 'Ketepatan Waktu Pelaksanaan',
                'tipe'      => 'benefit',
                'bobot'     => 0.25,
                'deskripsi' => 'Mengukur deviasi antara tanggal pelaksanaan yang direncanakan (TOR/KAK) dengan tanggal pelaksanaan riil. Tepat waktu = 100. Setiap 1 hari deviasi berkurang 5. Skor 0 jika deviasi >= 20 hari. Rumus: max(0, 100 − (deviasi_hari × 5)).',
            ],
            [
                'kode'      => 'C2',
                'nama'      => 'Ketepatan Anggaran',
                'tipe'      => 'benefit',
                'bobot'     => 0.25,
                'deskripsi' => 'Mengukur deviasi antara total anggaran yang diajukan (RAB) dengan total realisasi anggaran (LPJ). Pas (0% deviasi) = 100. Berkurang sesuai persentase deviasi anggaran. Rumus: max(0, 100 − deviasi_persen).',
            ],
            [
                'kode'      => 'C3',
                'nama'      => 'Kesesuaian Output IKU',
                'tipe'      => 'benefit',
                'bobot'     => 0.25,
                'deskripsi' => 'Mengukur rata-rata rasio capaian terhadap target dari seluruh Indikator Kinerja Utama (IKU) kegiatan. Nilai capaian IKU rata-rata 100% atau lebih = 100. Rumus: min(100, rata_rasio × 100).',
            ],
            [
                'kode'      => 'C4',
                'nama'      => 'Waktu Approval LPJ',
                'tipe'      => 'benefit',
                'bobot'     => 0.25,
                'deskripsi' => 'Mengukur kecepatan proses approval LPJ. Dihitung dari tanggal_pengajuan ke tanggal_disetujui. Disetujui pada hari yang sama = skor 100. Setelah itu berkurang 3 per hari. Skor 0 di hari ke-34+. Rumus: max(0, 100 − (durasi_hari × 3)).',
            ],
        ];

        foreach ($kriteria as $k) {
            SpkKriteria::updateOrCreate(
                ['kode' => $k['kode']],
                $k
            );
        }
    }
}
