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
     * C1: Ketepatan Waktu Pelaksanaan  (Proporsional Kontinu)
     * ─────────────────────────────────────────────────────────
     * Rumus : skor = max(0,  100 − deviasi_hari × 5)
     *
     * Contoh :
     *   0  hari deviasi → skor 100  (tepat waktu)
     *   1  hari         → skor  95
     *   5  hari         → skor  75
     *  10  hari         → skor  50
     *  20+ hari         → skor   0
     */
    private function hitungC1(Kegiatan $kegiatan, ?Lpj $lpj): array
    {
        $tanggalRencana = $kegiatan->tanggal_kegiatan;
        $tanggalReal    = $lpj?->tanggal_pelaksanaan_real;

        if (!$tanggalRencana || !$tanggalReal) {
            return [
                'skor'         => 50,
                'deviasi_hari' => null,
                'keterangan'   => 'Data tanggal tidak lengkap (default: 50)',
            ];
        }

        $rencana = Carbon::parse($tanggalRencana);
        $real    = Carbon::parse($tanggalReal);
        $deviasi = abs($rencana->diffInDays($real));

        $skor = max(0.0, 100.0 - ($deviasi * 5.0));

        if ($deviasi === 0) {
            $ket = 'Tepat waktu (skor: 100)';
        } else {
            $ket = "Deviasi {$deviasi} hari → skor: 100 − ({$deviasi}×5) = {$skor}";
        }

        return [
            'skor'         => round($skor, 2),
            'deviasi_hari' => $deviasi,
            'keterangan'   => $ket,
        ];
    }

    /**
     * C2: Ketepatan Anggaran  (Proporsional Kontinu)
     * ─────────────────────────────────────────────────
     * Rumus : skor = max(0,  100 − deviasi_persen)
     *
     * Contoh :
     *    0%  deviasi → skor 100  (anggaran pas)
     *    5%  deviasi → skor  95
     *   10%  deviasi → skor  90
     *   50%  deviasi → skor  50
     *  100%+ deviasi → skor   0
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
            return [
                'skor'            => 50,
                'total_rab'       => 0,
                'total_realisasi' => $totalRealisasi,
                'deviasi_persen'  => null,
                'keterangan'      => 'Total RAB = 0 (default: 50)',
            ];
        }

        $selisih       = abs($totalRealisasi - $totalRab);
        $deviasiPersen = ($selisih / $totalRab) * 100;

        $skor = max(0.0, 100.0 - $deviasiPersen);

        if ($selisih == 0) {
            $ket = 'Anggaran pas (selisih Rp 0, skor: 100)';
        } else {
            $ket = sprintf(
                'Deviasi %.2f%% → skor: 100 − %.2f = %.2f',
                $deviasiPersen,
                $deviasiPersen,
                $skor
            );
        }

        return [
            'skor'            => round($skor, 2),
            'total_rab'       => $totalRab,
            'total_realisasi' => $totalRealisasi,
            'deviasi_persen'  => round($deviasiPersen, 2),
            'keterangan'      => $ket,
        ];
    }

    /**
     * C3: Kesesuaian Output IKU  (Proporsional Kontinu)
     * ──────────────────────────────────────────────────
     * Mengukur rasio capaian terhadap target persentase IKU.
     * Skor dihitung sebagai rata-rata rasio pencapaian IKU dikali 100,
     * dengan batas maksimum 100.
     *
     * Contoh:
     *   Rasio capaian 1.0 (100% tercapai) → skor: 100
     *   Rasio capaian 0.75 (75% tercapai) → skor: 75
     *   Rasio capaian 0.0 (0% tercapai)   → skor: 0
     *   Rasio capaian > 1.0 (melebihi)    → skor: max 100
     */
    private function hitungC3(Kegiatan $kegiatan): array
    {
        $ikuList = $kegiatan->iku;

        if ($ikuList->isEmpty()) {
            return [
                'skor'         => 0,
                'rata_capaian' => null,
                'keterangan'   => 'Tidak ada IKU terdaftar (skor: 0)',
            ];
        }

        // Hitung rata-rata rasio capaian terhadap target dari semua IKU
        $totalRasio = 0;
        $count = 0;
        foreach ($ikuList as $iku) {
            $target  = $iku->target_persen ?: 0;
            $capaian = $iku->capaian_persen;

            if ($target > 0 && $capaian !== null) {
                // Rasio pencapaian (misal target 80%, capaian 60% -> 0.75)
                $totalRasio += ($capaian / $target);
                $count++;
            }
        }

        if ($count === 0) {
            return [
                'skor'         => 0,
                'rata_capaian' => null,
                'keterangan'   => 'Capaian IKU belum diisi (skor: 0)',
            ];
        }

        $rataRasio = $totalRasio / $count;
        $skor = min(100.0, max(0.0, $rataRasio * 100.0));

        $ket = sprintf(
            'Rasio capaian IKU rata-rata %.2f%% → skor: %.2f',
            $rataRasio * 100,
            $skor
        );

        return [
            'skor'         => round($skor, 2),
            'rata_capaian' => round($rataRasio, 4),
            'keterangan'   => $ket,
        ];
    }

    /**
     * C4: Waktu Approval LPJ  (Proporsional Kontinu)
     * ─────────────────────────────────────────────────
     * Rumus : skor = max(0,  100 − durasi_hari × 3)
     *
     * Contoh :
     *   0  hari sejak submit → skor 100  (langsung diproses)
     *   7  hari              → skor  79
     *  14  hari              → skor  58
     *  20  hari              → skor  40
     *  30  hari              → skor  10
     *  34+ hari              → skor   0
     */
    private function hitungC4(?Lpj $lpj): array
    {
        if (!$lpj || !$lpj->tanggal_pengajuan) {
            return [
                'skor'        => 0,
                'durasi_hari' => null,
                'keterangan'  => 'LPJ belum disubmit (skor: 0)',
            ];
        }

        $submit   = Carbon::parse($lpj->tanggal_pengajuan);
        $sekarang = Carbon::now();
        $durasi   = $submit->diffInDays($sekarang);

        $skor = max(0.0, 100.0 - ($durasi * 3.0));

        $ket = sprintf(
            'LPJ disubmit %d hari lalu → skor: 100 − (%d×3) = %.2f',
            $durasi,
            $durasi,
            $skor
        );

        return [
            'skor'        => round($skor, 2),
            'durasi_hari' => $durasi,
            'keterangan'  => $ket,
        ];
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

        // Karena semua nilai kriteria sudah dikonversi ke skala 0-100 melalui rubrik penalti,
        // normalisasi dilakukan dengan membagi skor kriteria dengan batas skor maksimalnya (100).
        // Hal ini menjaga konsistensi matematis pada evaluasi alternatif tunggal (hitungSingle)
        // dan memastikan jumlah matriks terbobot (Y) selalu sama dengan nilai optimasi (Yi).
        $pembagi = array_fill(0, $jumlahKriteria, 100.0);

        // Normalisasi
        $matriksNormalisasi = [];
        for ($i = 0; $i < $jumlahAlternatif; $i++) {
            $row = [];
            for ($j = 0; $j < $jumlahKriteria; $j++) {
                $row[] = round($matriksKeputusan[$i][$j] / 100.0, 6);
            }
            $matriksNormalisasi[] = $row;
        }

        return [
            'pembagi'   => $pembagi,
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

        // Hitung matriks terbobot (Y)
        $matriksTerbobot = [];
        foreach ($matriksNorm as $row) {
            $weightedRow = [];
            foreach ($row as $j => $val) {
                $weightedRow[] = round($val * ($bobot[$j] ?? 0.25), 6);
            }
            $matriksTerbobot[] = $weightedRow;
        }

        // Hitung skor akhir real-time sebagai rata-rata tertimbang dari kriteria (skala 0.0 - 1.0)
        $c1 = $rubrik['c1'];
        $c2 = $rubrik['c2'];
        $c3 = $rubrik['c3'];
        $c4 = $rubrik['c4'];

        $sumBobot = array_sum($bobot) ?: 1.0;
        $weightedSum = ($c1 * ($bobot[0] ?? 0.25)) + ($c2 * ($bobot[1] ?? 0.25)) + ($c3 * ($bobot[2] ?? 0.25)) + ($c4 * ($bobot[3] ?? 0.25));
        $skorAkhir = ($weightedSum / $sumBobot) / 100.0;

        $grade     = $this->tentukanGrade($skorAkhir);

        return [
            'kegiatan_id'       => $kegiatanId,
            'skor_rubrik'       => $rubrik,
            'bobot'             => $bobot,
            'matriks_keputusan' => $matriksKeputusan,
            'pembagi'           => $pembagi,
            'matriks_normalisasi' => $matriksNorm,
            'matriks_terbobot'  => $matriksTerbobot,
            'skor_akhir'        => round($skorAkhir, 6),
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

        // Hitung matriks terbobot (Y)
        $matriksTerbobotAll = [];
        foreach ($matriksNorm as $row) {
            $weightedRow = [];
            foreach ($row as $j => $val) {
                $weightedRow[] = round($val * ($bobot[$j] ?? 0.25), 6);
            }
            $matriksTerbobotAll[] = $weightedRow;
        }

        // Susun hasil
        $hasil = [];
        $idx   = 0;
        foreach ($kegiatanIds as $id) {
            $rubrik = $rubrikList[$id];

            // Hitung skor akhir real-time sebagai rata-rata tertimbang dari kriteria (skala 0.0 - 1.0)
            $c1 = $rubrik['c1'] ?? 0;
            $c2 = $rubrik['c2'] ?? 0;
            $c3 = $rubrik['c3'] ?? 0;
            $c4 = $rubrik['c4'] ?? 0;

            $sumBobot = array_sum($bobot) ?: 1.0;
            $weightedSum = ($c1 * ($bobot[0] ?? 0.25)) + ($c2 * ($bobot[1] ?? 0.25)) + ($c3 * ($bobot[2] ?? 0.25)) + ($c4 * ($bobot[3] ?? 0.25));
            $skorAkhir = ($weightedSum / $sumBobot) / 100.0;

            $hasil[] = [
                'kegiatan_id'         => $id,
                'skor_rubrik'         => $rubrikList[$id],
                'matriks_keputusan'   => $matriksKeputusan[$idx],
                'normalisasi'         => $matriksNorm[$idx] ?? [0, 0, 0, 0],
                'matriks_terbobot'    => [$matriksTerbobotAll[$idx] ?? [0, 0, 0, 0]],
                'skor_akhir'          => round($skorAkhir, 6),
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
            'matriks_terbobot'  => $matriksTerbobotAll,
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
