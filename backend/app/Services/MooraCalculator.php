<?php

namespace App\Services;

use App\Models\Kegiatan;
use App\Models\Iku;
use App\Models\Lpj;
use App\Models\Rab;
use App\Models\RabRealisasi;
use App\Models\SpkKriteria;
use Carbon\Carbon;

/**
 * ====================================================================
 *  MOORA CALCULATOR — Sistem Pendukung Keputusan (SPK)
 *  Metode: MOORA (Multi-Objective Optimization on the basis of Ratio Analysis)
 * ====================================================================
 *
 *  File ini berisi SELURUH logika inti algoritma MOORA:
 *    1. Pra-pemrosesan Data (Rubrik Penalti)  →  konversi data lapangan ke skor 0-100
 *    2. Pembentukan Matriks Keputusan
 *    3. Normalisasi Matriks (Rasio Akar Kuadrat)
 *    4. Perhitungan Nilai Preferensi Akhir (Yi)
 *    5. Penentuan Grade (A/B/C/D)
 */
class MooraCalculator
{
    /**
     * ================================================================
     *  TAHAP 1: PRA-PEMROSESAN — RUBRIK PENALTI
     * ================================================================
     *  Mengkonversi data mentah (tanggal, nominal, capaian)
     *  menjadi skor skala 0-100 untuk setiap kriteria.
     *
     *  @param int $kegiatanId  ID kegiatan yang akan dievaluasi
     *  @return array  ['c1' => skor, 'c2' => skor, 'c3' => skor, 'c4' => skor, 'detail' => [...]]
     */
    public function hitungSkorRubrik(int $kegiatanId): array
    {
        $kegiatan = Kegiatan::with(['rab', 'iku'])->findOrFail($kegiatanId);
        $lpj = Lpj::where('kegiatan_id', $kegiatanId)->orderBy('created_at', 'desc')->first();

        // ── C1: Ketepatan Waktu Pelaksanaan ──
        $c1 = $this->hitungC1($kegiatan, $lpj);

        // ── C2: Ketepatan Anggaran ──
        $c2 = $this->hitungC2($kegiatan, $kegiatanId);

        // ── C3: Kesesuaian Output IKU ──
        $c3 = $this->hitungC3($kegiatan);

        // ── C4: Waktu Approval LPJ (Dinamis / Real-time) ──
        $c4 = $this->hitungC4($lpj);

        return [
            'c1' => $c1['skor'],
            'c2' => $c2['skor'],
            'c3' => $c3['skor'],
            'c4' => $c4['skor'],
            'detail' => [
                'c1' => $c1,
                'c2' => $c2,
                'c3' => $c3,
                'c4' => $c4,
            ],
        ];
    }

    /**
     * C1: Ketepatan Waktu Pelaksanaan
     * ─────────────────────────────────
     * Tepat waktu (sesuai TOR)              = 100
     * Meleset 1 - 3 hari                    = 75
     * Meleset > 3 hari                      = 50
     */
    private function hitungC1(Kegiatan $kegiatan, ?Lpj $lpj): array
    {
        $tanggalRencana = $kegiatan->tanggal_kegiatan;
        $tanggalReal    = $lpj?->tanggal_pelaksanaan_real;

        if (!$tanggalRencana || !$tanggalReal) {
            return ['skor' => 50, 'deviasi_hari' => null, 'keterangan' => 'Data tanggal tidak lengkap (default: 50)'];
        }

        $rencana = Carbon::parse($tanggalRencana);
        $real    = Carbon::parse($tanggalReal);
        $deviasi = abs($rencana->diffInDays($real));

        if ($deviasi === 0) {
            $skor = 100;
            $ket  = 'Tepat waktu';
        } elseif ($deviasi <= 3) {
            $skor = 75;
            $ket  = "Meleset {$deviasi} hari";
        } else {
            $skor = 50;
            $ket  = "Meleset {$deviasi} hari (> 3 hari)";
        }

        return ['skor' => $skor, 'deviasi_hari' => $deviasi, 'keterangan' => $ket];
    }

    /**
     * C2: Ketepatan Anggaran
     * ──────────────────────
     * Selisih Rp 0 (pas)                    = 100
     * Selisih < 10% dari total anggaran     = 75
     * Selisih >= 10% dari total anggaran    = 50
     */
    private function hitungC2(Kegiatan $kegiatan, int $kegiatanId): array
    {
        $totalRab = $kegiatan->rab->sum('total');

        // Hitung total realisasi dari tabel rab_realisasi
        $realisasiItems = RabRealisasi::where('kegiatan_id', $kegiatanId)->get();
        $totalRealisasi = 0;
        foreach ($realisasiItems as $r) {
            $q1 = $r->qty1 ?? 0;
            $q2 = $r->qty2 ?: 1;
            $q3 = $r->qty3 ?: 1;
            $h  = $r->harga_satuan ?? 0;
            $totalRealisasi += $q1 * $q2 * $q3 * $h;
        }

        if ($totalRab <= 0) {
            return ['skor' => 50, 'total_rab' => 0, 'total_realisasi' => $totalRealisasi, 'deviasi_persen' => null, 'keterangan' => 'Total RAB = 0 (default: 50)'];
        }

        $selisih       = abs($totalRealisasi - $totalRab);
        $deviasiPersen = ($selisih / $totalRab) * 100;

        if ($selisih == 0) {
            $skor = 100;
            $ket  = 'Anggaran sesuai (selisih Rp 0)';
        } elseif ($deviasiPersen < 10) {
            $skor = 75;
            $ket  = sprintf('Deviasi %.1f%% (< 10%%)', $deviasiPersen);
        } else {
            $skor = 50;
            $ket  = sprintf('Deviasi %.1f%% (>= 10%%)', $deviasiPersen);
        }

        return [
            'skor'            => $skor,
            'total_rab'       => $totalRab,
            'total_realisasi' => $totalRealisasi,
            'deviasi_persen'  => round($deviasiPersen, 2),
            'keterangan'      => $ket,
        ];
    }

    /**
     * C3: Kesesuaian Output IKU
     * ─────────────────────────
     * Capaian >= 1  (mendukung IKU)  = 100
     * Capaian < 1   (tidak mendukung) = 0
     */
    private function hitungC3(Kegiatan $kegiatan): array
    {
        $ikuList = $kegiatan->iku;

        if ($ikuList->isEmpty()) {
            return ['skor' => 0, 'rata_capaian' => null, 'keterangan' => 'Tidak ada IKU terdaftar (skor: 0)'];
        }

        // Hitung rata-rata capaian dari semua IKU
        $totalCapaian = 0;
        $count = 0;
        foreach ($ikuList as $iku) {
            $target  = $iku->target_persen ?: 0;
            $capaian = $iku->capaian_persen;

            if ($target > 0 && $capaian !== null) {
                $totalCapaian += ($capaian / $target);
                $count++;
            }
        }

        if ($count === 0) {
            return ['skor' => 0, 'rata_capaian' => null, 'keterangan' => 'Capaian IKU belum diisi (skor: 0)'];
        }

        $rataCapaian = $totalCapaian / $count;

        if ($rataCapaian >= 1) {
            $skor = 100;
            $ket  = sprintf('Mendukung IKU (capaian: %.2f)', $rataCapaian);
        } else {
            $skor = 0;
            $ket  = sprintf('Tidak mendukung IKU (capaian: %.2f < 1)', $rataCapaian);
        }

        return ['skor' => $skor, 'rata_capaian' => round($rataCapaian, 4), 'keterangan' => $ket];
    }

    /**
     * C4: Waktu Approval LPJ (Dinamis / Real-time)
     * ──────────────────────────────────────────────
     * <= 14 hari                             = 100
     * > 14 hari  =  100 - (keterlambatan x 5), min 0
     */
    private function hitungC4(?Lpj $lpj): array
    {
        if (!$lpj || !$lpj->tanggal_pengajuan) {
            return ['skor' => 0, 'durasi_hari' => null, 'keterangan' => 'LPJ belum disubmit (skor: 0)'];
        }

        $submit  = Carbon::parse($lpj->tanggal_pengajuan);
        $sekarang = Carbon::now();
        $durasi   = $submit->diffInDays($sekarang);

        if ($durasi <= 14) {
            $skor = 100;
            $ket  = "Dalam batas waktu ({$durasi} hari <= 14 hari)";
        } else {
            $keterlambatan = $durasi - 14;
            $skor = max(0, 100 - ($keterlambatan * 5));
            $ket  = "Terlambat {$keterlambatan} hari (skor: 100 - {$keterlambatan}×5 = {$skor})";
        }

        return ['skor' => $skor, 'durasi_hari' => $durasi, 'keterangan' => $ket];
    }

    /**
     * ================================================================
     *  TAHAP 2 & 3: NORMALISASI MATRIKS (Rasio Akar Kuadrat)
     * ================================================================
     *  Setiap nilai pada matriks dibagi dengan akar kuadrat dari
     *  jumlah kuadrat elemen pada kolom kriteria yang sama.
     *
     *  Rumus:  x*ij = xij / sqrt(Σ xij²)
     *
     *  @param array $matriksKeputusan  Array of arrays [[c1,c2,c3,c4], ...]
     *  @return array  Matriks ternormalisasi
     */
    public function normalisasiMoora(array $matriksKeputusan): array
    {
        if (empty($matriksKeputusan)) {
            return [];
        }

        $jumlahAlternatif = count($matriksKeputusan);
        $jumlahKriteria   = count($matriksKeputusan[0]);

        // Hitung pembagi untuk setiap kolom: sqrt(Σ xij²)
        $pembagi = array_fill(0, $jumlahKriteria, 0);
        for ($j = 0; $j < $jumlahKriteria; $j++) {
            $sumSquare = 0;
            for ($i = 0; $i < $jumlahAlternatif; $i++) {
                $sumSquare += pow($matriksKeputusan[$i][$j], 2);
            }
            $pembagi[$j] = sqrt($sumSquare);
        }

        // Normalisasi
        $matriksNormalisasi = [];
        for ($i = 0; $i < $jumlahAlternatif; $i++) {
            $row = [];
            for ($j = 0; $j < $jumlahKriteria; $j++) {
                $row[] = $pembagi[$j] > 0
                    ? round($matriksKeputusan[$i][$j] / $pembagi[$j], 6)
                    : 0;
            }
            $matriksNormalisasi[] = $row;
        }

        return [
            'pembagi'   => array_map(fn($v) => round($v, 4), $pembagi),
            'normalisasi' => $matriksNormalisasi,
        ];
    }

    /**
     * ================================================================
     *  TAHAP 4: NILAI PREFERENSI AKHIR (Yi)
     * ================================================================
     *  Yi = Σ (wj × x*ij)   (semua Benefit, tidak ada Cost)
     *
     *  @param array $matriksNormalisasi  Matriks normalisasi
     *  @param array $bobot              Bobot setiap kriteria [0.25, 0.25, ...]
     *  @return array  Skor akhir per alternatif
     */
    public function hitungPreferensi(array $matriksNormalisasi, array $bobot): array
    {
        $hasil = [];
        foreach ($matriksNormalisasi as $row) {
            $yi = 0;
            foreach ($row as $j => $val) {
                $yi += ($bobot[$j] ?? 0.25) * $val;
            }
            $hasil[] = round($yi, 6);
        }
        return $hasil;
    }

    /**
     * ================================================================
     *  PENENTUAN GRADE
     * ================================================================
     *  A = Yi >= 0.80
     *  B = Yi >= 0.60
     *  C = Yi >= 0.40
     *  D = Yi <  0.40
     */
    public function tentukanGrade(float $skorAkhir): string
    {
        if ($skorAkhir >= 0.80) return 'A';
        if ($skorAkhir >= 0.60) return 'B';
        if ($skorAkhir >= 0.40) return 'C';
        return 'D';
    }

    /**
     * ================================================================
     *  HITUNG LENGKAP (Single Alternatif)
     * ================================================================
     *  Menghitung skor SPK untuk SATU kegiatan secara lengkap.
     *  Jika hanya ada 1 alternatif, normalisasi = xij / sqrt(xij²) = 1 jika xij > 0.
     *  Maka Yi = Σ bobot (jika semua skor > 0).
     *
     *  Untuk hasil normalisasi yang bermakna, gunakan hitungBatch().
     *
     *  @return array  Seluruh data perhitungan
     */
    public function hitungSingle(int $kegiatanId): array
    {
        $rubrik = $this->hitungSkorRubrik($kegiatanId);
        $bobot  = $this->getBobot();

        $matriksKeputusan = [[$rubrik['c1'], $rubrik['c2'], $rubrik['c3'], $rubrik['c4']]];

        $normResult     = $this->normalisasiMoora($matriksKeputusan);
        $matriksNorm    = $normResult['normalisasi'];
        $pembagi        = $normResult['pembagi'];
        $preferensi     = $this->hitungPreferensi($matriksNorm, $bobot);

        $skorAkhir = $preferensi[0] ?? 0;
        $grade     = $this->tentukanGrade($skorAkhir);

        return [
            'kegiatan_id'       => $kegiatanId,
            'skor_rubrik'       => $rubrik,
            'bobot'             => $bobot,
            'matriks_keputusan' => $matriksKeputusan,
            'pembagi'           => $pembagi,
            'matriks_normalisasi' => $matriksNorm,
            'skor_akhir'        => $skorAkhir,
            'grade'             => $grade,
            'detail_rubrik'     => $rubrik['detail'],
        ];
    }

    /**
     * ================================================================
     *  HITUNG BATCH (Multi Alternatif — MOORA sebenarnya)
     * ================================================================
     *  Menghitung skor SPK untuk SEMUA LPJ yang sedang menunggu approval.
     *  Normalisasi antar alternatif jadi bermakna di sini.
     *
     *  @return array  Daftar hasil perhitungan per kegiatan
     */
    public function hitungBatch(array $kegiatanIds): array
    {
        if (empty($kegiatanIds)) {
            return [];
        }

        $bobot = $this->getBobot();

        // Tahap 1: Hitung skor rubrik untuk semua alternatif
        $rubrikList = [];
        $matriksKeputusan = [];
        foreach ($kegiatanIds as $id) {
            try {
                $rubrik = $this->hitungSkorRubrik($id);
                $rubrikList[$id] = $rubrik;
                $matriksKeputusan[] = [$rubrik['c1'], $rubrik['c2'], $rubrik['c3'], $rubrik['c4']];
            } catch (\Exception $e) {
                $rubrikList[$id] = ['c1' => 0, 'c2' => 0, 'c3' => 0, 'c4' => 0, 'detail' => [], 'error' => $e->getMessage()];
                $matriksKeputusan[] = [0, 0, 0, 0];
            }
        }

        // Tahap 2: Normalisasi
        $normResult  = $this->normalisasiMoora($matriksKeputusan);
        $matriksNorm = $normResult['normalisasi'];
        $pembagi     = $normResult['pembagi'];

        // Tahap 3: Preferensi
        $preferensi = $this->hitungPreferensi($matriksNorm, $bobot);

        // Susun hasil
        $hasil = [];
        $idx   = 0;
        foreach ($kegiatanIds as $id) {
            $skorAkhir = $preferensi[$idx] ?? 0;
            $hasil[] = [
                'kegiatan_id'         => $id,
                'skor_rubrik'         => $rubrikList[$id],
                'matriks_keputusan'   => $matriksKeputusan[$idx],
                'normalisasi'         => $matriksNorm[$idx] ?? [0, 0, 0, 0],
                'skor_akhir'          => $skorAkhir,
                'grade'               => $this->tentukanGrade($skorAkhir),
                'detail_rubrik'       => $rubrikList[$id]['detail'] ?? [],
            ];
            $idx++;
        }

        // Sort by skor_akhir descending (ranking)
        usort($hasil, fn($a, $b) => $b['skor_akhir'] <=> $a['skor_akhir']);

        return [
            'bobot'             => $bobot,
            'pembagi'           => $pembagi,
            'matriks_keputusan' => $matriksKeputusan,
            'matriks_normalisasi' => $matriksNorm,
            'hasil'             => $hasil,
        ];
    }

    /**
     * Ambil bobot kriteria dari database
     */
    private function getBobot(): array
    {
        $kriteria = SpkKriteria::orderBy('kode')->get();

        if ($kriteria->isEmpty()) {
            // Fallback default
            return [0.25, 0.25, 0.25, 0.25];
        }

        return $kriteria->pluck('bobot')->map(fn($v) => (float) $v)->toArray();
    }
}
