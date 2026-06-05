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
                'deskripsi' => 'Mengukur deviasi antara tanggal pelaksanaan yang direncanakan (TOR/KAK) dengan tanggal pelaksanaan riil. Tepat waktu = 100, meleset 1-3 hari = 75, meleset > 3 hari = 50.',
            ],
            [
                'kode'      => 'C2',
                'nama'      => 'Ketepatan Anggaran',
                'tipe'      => 'benefit',
                'bobot'     => 0.25,
                'deskripsi' => 'Mengukur deviasi antara total anggaran yang diajukan (RAB) dengan total realisasi anggaran (LPJ). Pas = 100, selisih < 10% = 75, selisih >= 10% = 50.',
            ],
            [
                'kode'      => 'C3',
                'nama'      => 'Kesesuaian Output IKU',
                'tipe'      => 'benefit',
                'bobot'     => 0.25,
                'deskripsi' => 'Mengukur apakah kegiatan mendukung IKU (Indikator Kinerja Utama). Nilai capaian >= 1 (mendukung) = 100, nilai capaian < 1 (tidak mendukung) = 0.',
            ],
            [
                'kode'      => 'C4',
                'nama'      => 'Waktu Approval LPJ',
                'tipe'      => 'benefit',
                'bobot'     => 0.25,
                'deskripsi' => 'Mengukur kecepatan proses approval LPJ. Dihitung dari selisih hari antara tanggal submit LPJ dengan tanggal saat ini. <= 14 hari = 100, > 14 hari = 100 - (keterlambatan x 5), minimum 0.',
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
