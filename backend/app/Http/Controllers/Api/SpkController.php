<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kegiatan;
use App\Models\Lpj;
use App\Models\SpkKriteria;
use App\Models\SpkPenilaian;
use App\Services\MooraCalculator;
use Illuminate\Http\Request;

class SpkController extends Controller
{
    private MooraCalculator $calculator;

    public function __construct()
    {
        $this->calculator = new MooraCalculator();
    }

    /**
     * GET /api/spk/kriteria
     * Menampilkan daftar kriteria SPK beserta bobotnya
     */
    public function kriteria()
    {
        $kriteria = SpkKriteria::orderBy('kode')->get();
        return response()->json($kriteria);
    }

    /**
     * GET /api/spk/hitung/{kegiatanId}
     * Menghitung skor SPK secara real-time untuk 1 kegiatan (tanpa menyimpan)
     */
    public function hitung(Request $request, $kegiatanId)
    {
        try {
            $result = $this->calculator->hitungSingle((int) $kegiatanId);

            // Ambil info kegiatan untuk context
            $kegiatan = Kegiatan::with('pengusul')->find($kegiatanId);

            return response()->json([
                'kegiatan' => $kegiatan ? [
                    'id'             => $kegiatan->id,
                    'nama_kegiatan'  => $kegiatan->nama_kegiatan,
                    'pengusul_nama'  => $kegiatan->pengusul_nama,
                    'status'         => $kegiatan->status,
                ] : null,
                'perhitungan' => $result,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal menghitung SPK: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/spk/hitung-batch
     * Menghitung MOORA untuk semua LPJ yang berstatus lpj_submitted
     */
    public function hitungBatch()
    {
        $kegiatanIds = Kegiatan::whereIn('status', ['lpj_submitted', 'lpj_revision'])
            ->pluck('id')
            ->toArray();

        if (empty($kegiatanIds)) {
            return response()->json([
                'message' => 'Tidak ada LPJ yang menunggu approval.',
                'hasil'   => [],
            ]);
        }

        try {
            $result = $this->calculator->hitungBatch($kegiatanIds);

            // Enrich with kegiatan info
            $kegiatanMap = Kegiatan::with('pengusul')
                ->whereIn('id', $kegiatanIds)
                ->get()
                ->keyBy('id');

            foreach ($result['hasil'] as &$item) {
                $k = $kegiatanMap->get($item['kegiatan_id']);
                $item['kegiatan'] = $k ? [
                    'id'             => $k->id,
                    'nama_kegiatan'  => $k->nama_kegiatan,
                    'pengusul_nama'  => $k->pengusul_nama,
                    'status'         => $k->status,
                    'nama_jurusan'   => $k->nama_jurusan,
                ] : null;
            }

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal menghitung batch SPK: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/spk/simpan/{kegiatanId}
     * Menyimpan skor SPK secara permanen (dipanggil saat Bendahara approve LPJ)
     */
    public function simpan(Request $request, $kegiatanId)
    {
        $user = $request->user();

        try {
            $result = $this->calculator->hitungSingle((int) $kegiatanId);

            $lpj = Lpj::where('kegiatan_id', $kegiatanId)
                ->orderBy('created_at', 'desc')
                ->first();

            $normalisasi = $result['matriks_normalisasi'][0] ?? [0, 0, 0, 0];

            $penilaian = SpkPenilaian::updateOrCreate(
                ['kegiatan_id' => $kegiatanId],
                [
                    'lpj_id'       => $lpj?->id,
                    'skor_c1'      => $result['skor_rubrik']['c1'],
                    'skor_c2'      => $result['skor_rubrik']['c2'],
                    'skor_c3'      => $result['skor_rubrik']['c3'],
                    'skor_c4'      => $result['skor_rubrik']['c4'],
                    'norm_c1'      => $normalisasi[0],
                    'norm_c2'      => $normalisasi[1],
                    'norm_c3'      => $normalisasi[2],
                    'norm_c4'      => $normalisasi[3],
                    'skor_akhir'   => $result['skor_akhir'],
                    'grade'        => $result['grade'],
                    'dinilai_oleh' => $user?->name ?? 'System',
                    'dinilai_pada' => now(),
                ]
            );

            return response()->json([
                'message'    => 'Skor SPK berhasil disimpan.',
                'penilaian'  => $penilaian,
                'perhitungan' => $result,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal menyimpan skor SPK: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/spk/riwayat
     * Menampilkan riwayat penilaian SPK
     */
    public function riwayat()
    {
        $riwayat = SpkPenilaian::with('kegiatan')
            ->orderBy('dinilai_pada', 'desc')
            ->paginate(20);

        return response()->json($riwayat);
    }
}
