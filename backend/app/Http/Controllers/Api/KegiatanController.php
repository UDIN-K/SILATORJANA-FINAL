<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Jurusan;
use App\Models\Kegiatan;
use Illuminate\Http\Request;

class KegiatanController extends Controller
{
    /**
     * List kegiatan with optional filters
     */
    public function index(Request $request)
    {
        $query = Kegiatan::with(['pengusul', 'kak', 'iku', 'rab']);

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $user = $request->user();
        if ($user && $user->role === 'pengusul') {
            $query->where('pengusul_id', $user->id);
        } elseif ($user && $user->role === 'verifikator') {
            if (!empty($user->verifikator_unit)) {
                $query->where('verifikator_target', $user->verifikator_unit);
            }
        } elseif ($request->has('pengusul_id')) {
            $query->where('pengusul_id', $request->pengusul_id);
        }

        // Filter by jurusan
        if ($request->has('jurusan')) {
            $query->where('nama_jurusan', $request->jurusan);
        }

        // Search by name
        if ($request->has('search')) {
            $query->where('nama_kegiatan', 'like', '%' . $request->search . '%');
        }

        $kegiatan = $query->orderBy('created_at', 'desc')->paginate($request->get('limit', 25));

        return response()->json($kegiatan);
    }

    /**
     * Get single kegiatan with all relations
     */
    public function show(string $id)
    {
        $kegiatan = Kegiatan::with(['pengusul', 'kak', 'iku', 'rab'])->findOrFail($id);
        return response()->json($kegiatan);
    }

    /**
     * Create new kegiatan (proposal)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_kegiatan'          => 'required|string|max:255',
            'jenis_kegiatan'         => 'nullable|string',
            'tanggal_kegiatan'       => 'nullable|date',
            'tempat'                 => 'nullable|string',
            'status'                 => 'nullable|string',
            'deskripsi'              => 'nullable|string',
            'pengusul_organisasi'    => 'nullable|string|max:255',
            'jurusan_id'             => 'nullable|integer',
            'verifikator_target'     => 'nullable|string|in:wadir1,wadir2,wadir3,wadir4',
            // KAK
            'kak'                        => 'nullable|array',
            'kak.gambaran_umum'          => 'nullable|string',
            'kak.penerima_manfaat'       => 'nullable|string',
            'kak.strategi_pencapaian'    => 'nullable|string',
            'kak.metode_pelaksanaan'     => 'nullable|string',
            'kak.tahapan_pelaksanaan'    => 'nullable|string',
            'kak.indikator_kinerja'      => 'nullable|string',
            'kak.indikator'              => 'nullable|array',
            'kak.kurun_waktu_mulai'      => 'nullable|date',
            'kak.kurun_waktu_selesai'    => 'nullable|date',
            // IKU
            'iku'                  => 'nullable|array',
            'iku.*.nama_iku'       => 'required|string',
            'iku.*.target_persen'  => 'nullable|numeric',
            // RAB
            'rab'                  => 'nullable|array',
            'rab.*.uraian'         => 'required|string',
            'rab.*.kategori'       => 'nullable|string',
            'rab.*.harga_satuan'   => 'required|numeric',
            'rab.*.qty1'           => 'nullable|integer',
            'rab.*.satuan1'        => 'nullable|string',
            'rab.*.qty2'           => 'nullable|integer',
            'rab.*.satuan2'        => 'nullable|string',
            'rab.*.qty3'           => 'nullable|integer',
            'rab.*.satuan3'        => 'nullable|string',
        ]);

        $user = $request->user();
        $jurusan = null;
        if (!empty($validated['jurusan_id'])) {
            $jurusan = Jurusan::find($validated['jurusan_id']);
        }

        $kegiatan = Kegiatan::create([
            'nama_kegiatan'       => $validated['nama_kegiatan'],
            'jenis_kegiatan'      => $validated['jenis_kegiatan'] ?? null,
            'deskripsi'           => $validated['deskripsi'] ?? null,
            'status'              => $validated['status'] ?? 'draft',
            'pengusul_id'         => $user->id,
            'pengusul_nama'       => $user->nama,
            'pengusul_organisasi' => $validated['pengusul_organisasi'] ?? null,
            'nama_jurusan'        => $jurusan?->nama_jurusan ?? $user->jurusan,
            'tanggal_kegiatan'    => $validated['tanggal_kegiatan'] ?? null,
            'tempat'              => $validated['tempat'] ?? null,
            'verifikator_target'  => $validated['verifikator_target'] ?? null,
            'total_anggaran'      => 0,
        ]);

        // Create KAK – convert indikator array to JSON string for storage
        if (isset($validated['kak'])) {
            $kakData = $validated['kak'];
            if (isset($kakData['indikator']) && is_array($kakData['indikator'])) {
                $kakData['indikator_kinerja'] = json_encode($kakData['indikator']);
                unset($kakData['indikator']);
            }
            $kegiatan->kak()->create($kakData);
        }

        // Create IKU items
        if (isset($validated['iku'])) {
            foreach ($validated['iku'] as $ikuData) {
                $kegiatan->iku()->create($ikuData);
            }
        }

        // Create RAB items and calculate totals
        $totalAnggaran = 0;
        if (isset($validated['rab'])) {
            foreach ($validated['rab'] as $rabData) {
                $rab = $kegiatan->rab()->create($rabData);
                $total = $rab->calculateTotal();
                $rab->update(['total' => $total]);
                $totalAnggaran += $total;
            }
        }

        $kegiatan->update(['total_anggaran' => $totalAnggaran]);

        return response()->json(
            $kegiatan->load(['kak', 'iku', 'rab']),
            201
        );
    }

    /**
     * Update kegiatan
     */
    public function update(Request $request, string $id)
    {
        $kegiatan = Kegiatan::findOrFail($id);

        $validated = $request->validate([
            'nama_kegiatan' => 'sometimes|string|max:255',
            'jenis_kegiatan' => 'nullable|string',
            'status' => 'sometimes|string',
            'tanggal_kegiatan' => 'nullable|date',
            'tempat' => 'nullable|string',
            'pengusul_organisasi' => 'nullable|string|max:255',
            'catatan_revisi' => 'nullable|string',
            'total_anggaran' => 'nullable|numeric',
            'jurusan_id' => 'nullable|integer',
            // KAK
            'kak' => 'nullable|array',
            // IKU
            'iku' => 'nullable|array',
            // RAB
            'rab' => 'nullable|array',
        ]);

        if (!empty($validated['jurusan_id'])) {
            $jurusan = Jurusan::find($validated['jurusan_id']);
            if ($jurusan) {
                $validated['nama_jurusan'] = $jurusan->nama_jurusan;
            }
            unset($validated['jurusan_id']);
        }

        // Update kegiatan fields
        $kegiatan->update(collect($validated)->except(['kak', 'iku', 'rab'])->toArray());

        // Update KAK
        if (isset($validated['kak'])) {
            $kegiatan->kak()->updateOrCreate(
                ['kegiatan_id' => $kegiatan->id],
                $validated['kak']
            );
        }

        // Replace IKU
        if (isset($validated['iku'])) {
            $kegiatan->iku()->delete();
            foreach ($validated['iku'] as $ikuData) {
                $kegiatan->iku()->create($ikuData);
            }
        }

        // Replace RAB and recalculate
        if (isset($validated['rab'])) {
            $kegiatan->rab()->delete();
            $totalAnggaran = 0;
            foreach ($validated['rab'] as $rabData) {
                $rab = $kegiatan->rab()->create($rabData);
                $total = $rab->calculateTotal();
                $rab->update(['total' => $total]);
                $totalAnggaran += $total;
            }
            $kegiatan->update(['total_anggaran' => $totalAnggaran]);
        }

        return response()->json($kegiatan->fresh()->load(['kak', 'iku', 'rab']));
    }

    /**
     * Delete kegiatan
     */
    public function destroy(string $id)
    {
        $kegiatan = Kegiatan::findOrFail($id);
        $kegiatan->delete();

        return response()->json(['message' => 'Kegiatan berhasil dihapus.']);
    }
}
