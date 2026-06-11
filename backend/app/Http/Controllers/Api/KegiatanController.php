<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Jurusan;
use App\Models\Kegiatan;
use App\Models\PencairanDana;
use Illuminate\Http\Request;

class KegiatanController extends Controller
{
    /**
     * List kegiatan with optional filters
     */
    public function index(Request $request)
    {
        $query = Kegiatan::with(['pengusul']);
        $user = $request->user();

        if ($user) {
            $isArchive = $request->get('archive') === 'true';
            $isMonitoring = $request->get('monitoring') === 'true';

            if ($user->role === 'pengusul') {
                $query->where('pengusul_id', $user->id);
                if ($request->get('active') === 'true') {
                    $query->whereNotIn('status', ['completed', 'selesai', 'lpj_done', 'lpj_approved', 'lpj_verified', 'rejected', 'ditolak']);
                } elseif ($request->get('history') === 'true') {
                    $query->whereIn('status', ['completed', 'selesai', 'lpj_done', 'lpj_approved', 'lpj_verified', 'rejected', 'ditolak']);
                }
            } elseif ($user->role === 'verifikator') {
                if (!empty($user->verifikator_unit)) {
                    $query->where(function($q) use ($user) {
                        $q->where('verifikator_target', $user->verifikator_unit)
                          ->orWhereNull('verifikator_target');
                    });
                }
                
                if ($isMonitoring) {
                    $query->whereNotIn('status', ['draft']);
                } elseif ($isArchive) {
                    $query->whereNotIn('status', ['draft', 'submitted', 'revision_requested', 'revisi_done']);
                } else {
                    $query->whereIn('status', ['submitted', 'revision_requested', 'revisi_done']);
                }
            } elseif ($user->role === 'ppk') {
                if ($isMonitoring) {
                    $query->whereNotIn('status', ['draft', 'submitted', 'revision_requested', 'revisi_done', 'verified', 'pending_ppk']);
                } elseif ($isArchive) {
                    $query->whereIn('status', [
                        'approved_ppk', 'approved_wadir', 'accepted_funds', 'funds_disbursed',
                        'lpj_submitted', 'lpj_approved', 'lpj_rejected', 'lpj_done', 'completed', 'rejected',
                        'ditolak', 'ditolak_verifikator',
                        'disetujui_ppk', 'disetujui_wadir', 'disetujui_rektorat'
                    ]);
                } else {
                    $query->whereIn('status', ['pending_ppk', 'verified']);
                }
            } elseif (str_starts_with($user->role, 'wadir')) {
                $query->where(function($q) use ($user) {
                    $q->where('verifikator_target', $user->role);
                    if ($user->role === 'wadir2') {
                        $q->orWhereNull('verifikator_target');
                    }
                });
                if ($isMonitoring) {
                    $query->whereNotIn('status', ['draft', 'submitted', 'revision_requested', 'revisi_done', 'verified', 'pending_ppk']);
                } elseif ($isArchive) {
                    $query->whereIn('status', [
                        'approved_wadir', 'accepted_funds', 'funds_disbursed',
                        'lpj_submitted', 'lpj_approved', 'lpj_rejected', 'lpj_done', 'completed', 'rejected',
                        'ditolak', 'ditolak_verifikator',
                        'disetujui_ppk', 'disetujui_wadir', 'disetujui_rektorat'
                    ]);
                } else {
                    $query->where('status', 'approved_ppk');
                }
            } elseif ($user->role === 'bendahara') {
                if ($isMonitoring) {
                    $query->whereIn('status', ['approved_wadir', 'accepted_funds', 'funds_disbursed', 'lpj_submitted', 'lpj_approved', 'lpj_rejected', 'lpj_done', 'completed']);
                } else {
                    $query->whereIn('status', ['approved_wadir', 'accepted_funds', 'funds_disbursed', 'lpj_submitted']);
                }
            } elseif ($user->role === 'rektorat') {
                $query->whereNotIn('status', ['draft']);
            }
        }

        // Filter by status if explicitly requested
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by jurusan
        if ($request->has('jurusan')) {
            $query->where('nama_jurusan', $request->jurusan);
        }

        // Search by name
        if ($request->has('search')) {
            $query->where('nama_kegiatan', 'like', '%' . $request->search . '%');
        }

        if ($request->has('pengusul_id')) {
            $query->where('pengusul_id', $request->pengusul_id);
        }

        $kegiatan = $query->orderBy('created_at', 'desc')->paginate($request->get('limit', 25));

        return response()->json($kegiatan);
    }

    private function checkAuthorization($kegiatan, $user)
    {
        if (!$user) return;
        
        if ($user->role === 'pengusul' && $kegiatan->pengusul_id !== $user->id) {
            abort(403, 'Unauthorized access: Not the owner');
        }
        
        if ($user->role === 'verifikator' && !empty($user->verifikator_unit)) {
            if ($kegiatan->verifikator_target && $kegiatan->verifikator_target !== $user->verifikator_unit) {
                abort(403, 'Unauthorized access: Verifikator target mismatch');
            }
        }
        
        if (str_starts_with($user->role, 'wadir')) {
            if ($user->role === 'wadir2' && empty($kegiatan->verifikator_target)) {
                // allowed
            } elseif ($kegiatan->verifikator_target !== $user->role) {
                abort(403, 'Unauthorized access: Wadir target mismatch');
            }
        }
    }

    /**
     * Get single kegiatan with all relations
     */
    public function show(Request $request, string $id)
    {
        $kegiatan = Kegiatan::with(['pengusul', 'kak', 'iku', 'rab', 'pencairanDana'])->findOrFail($id);
        $this->checkAuthorization($kegiatan, $request->user());
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

        // Capture snapshot for BUG-007
        $latestHistory = $kegiatan->statusHistory()->latest()->first();
        if ($latestHistory && empty($latestHistory->payload_snapshot)) {
            $kegiatan->load(['kak', 'iku', 'rab']);
            $payload = [
                'kegiatan' => $kegiatan->only(['nama_kegiatan', 'jenis_kegiatan', 'tanggal_kegiatan', 'tempat', 'deskripsi', 'total_anggaran']),
                'kak' => $kegiatan->kak ? $kegiatan->kak->toArray() : null,
                'iku' => $kegiatan->iku ? $kegiatan->iku->toArray() : [],
                'rab' => $kegiatan->rab ? $kegiatan->rab->toArray() : [],
            ];
            $latestHistory->update([
                'payload_snapshot' => json_encode($payload)
            ]);
        }

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
            'kode_mak' => 'nullable|string|max:100',
            'verifikator_target' => 'nullable|string|in:wadir1,wadir2,wadir3,wadir4',
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

        // Update corresponding LPJ records if status is related to LPJ verification
        if (in_array($kegiatan->status, ['lpj_approved', 'lpj_revision', 'lpj_rejected'])) {
            $lpj = \App\Models\Lpj::where('kegiatan_id', $kegiatan->id)->first();
            if ($lpj) {
                $statusVerifikasi = 'submitted';
                if ($kegiatan->status === 'lpj_approved') {
                    $statusVerifikasi = 'approved';
                } elseif ($kegiatan->status === 'lpj_revision') {
                    $statusVerifikasi = 'revision';
                } elseif ($kegiatan->status === 'lpj_rejected') {
                    $statusVerifikasi = 'rejected';
                }

                $lpj->update([
                    'catatan_bendahara' => $kegiatan->catatan_revisi,
                    'catatan_verifikasi' => $kegiatan->catatan_revisi,
                    'verified_by' => $request->user()?->nama,
                    'status_verifikasi' => $statusVerifikasi,
                ]);
            }
        }

        // Update KAK
        if (isset($validated['kak'])) {
            $kakData = $validated['kak'];
            if (isset($kakData['indikator']) && is_array($kakData['indikator'])) {
                $kakData['indikator_kinerja'] = json_encode($kakData['indikator']);
                unset($kakData['indikator']);
            }
            $kegiatan->kak()->updateOrCreate(
                ['kegiatan_id' => $kegiatan->id],
                $kakData
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

        // Capture snapshot for BUG-007
        $latestHistory = $kegiatan->statusHistory()->latest()->first();
        if ($latestHistory && empty($latestHistory->payload_snapshot)) {
            $latestHistory->update([
                'payload_snapshot' => json_encode($kegiatan->load(['kak', 'iku', 'rab']))
            ]);
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

    /**
     * Submit proposal to PPK (uploads surat pengantar & penanggung jawab)
     */
    public function submitPpk(Request $request, string $id)
    {
        $kegiatan = Kegiatan::findOrFail($id);

        $validated = $request->validate([
            'surat_pengantar_path' => 'nullable|string',
            'surat_pengantar_filename' => 'nullable|string',
            'penanggung_jawab' => 'nullable|array',
            'penanggung_jawab.*' => 'string',
        ]);

        $updateData = [
            'status' => 'pending_ppk',
        ];

        if (!empty($validated['surat_pengantar_path'])) {
            $updateData['surat_pengantar_path'] = $validated['surat_pengantar_path'];
            $updateData['surat_pengantar'] = $validated['surat_pengantar_path']; // compatibility
            $updateData['surat_pengantar_filename'] = $validated['surat_pengantar_filename'] ?? basename($validated['surat_pengantar_path']);
            $updateData['surat_pengantar_uploaded_at'] = now();
        }

        if (isset($validated['penanggung_jawab'])) {
            $updateData['penanggung_jawab'] = $validated['penanggung_jawab'];
        }

        $kegiatan->update($updateData);

        return response()->json($kegiatan->fresh()->load(['kak', 'iku', 'rab']));
    }

    /**
     * Record partial disbursement of funds (Bendahara)
     */
    public function tambahPencairan(Request $request, string $id)
    {
        $kegiatan = Kegiatan::findOrFail($id);
        $this->checkAuthorization($kegiatan, $request->user());

        $validated = $request->validate([
            'persentase' => 'required|numeric|min:0.01|max:100',
            'catatan' => 'nullable|string',
        ]);

        $totalDisbursed = $kegiatan->pencairanDana()->sum('persentase');
        $maxPencairan = 70; // maks 70% uang muka

        // Enforce 70% max for initial disbursement
        if ($totalDisbursed + $validated['persentase'] > $maxPencairan) {
            $sisa = max(0, $maxPencairan - $totalDisbursed);
            return response()->json([
                'message' => "Pencairan uang muka tidak boleh melebihi {$maxPencairan}%. Sisa yang tersedia: {$sisa}%",
            ], 422);
        }

        if ($totalDisbursed >= $maxPencairan) {
            return response()->json([
                'message' => 'Batas pencairan uang muka (70%) sudah tercapai.',
            ], 422);
        }

        $nominal = ($validated['persentase'] / 100) * $kegiatan->total_anggaran;

        $pencairan = PencairanDana::create([
            'kegiatan_id' => $kegiatan->id,
            'persentase' => $validated['persentase'],
            'nominal' => $nominal,
            'catatan' => $validated['catatan'] ?? null,
            'created_by' => $request->user()->id,
        ]);

        // Update status and deadline_lpj if reaching maxPencairan (70%)
        $newTotal = $totalDisbursed + $validated['persentase'];
        if ($newTotal >= $maxPencairan) {
            $kegiatan->update([
                'status' => 'funds_disbursed',
                'deadline_lpj' => $this->calculateDeadlineLPJ(),
            ]);
        } else {
            $kegiatan->update([
                'status' => 'accepted_funds',
            ]);
        }

        return response()->json($kegiatan->fresh()->load(['kak', 'iku', 'rab', 'pencairanDana']));
    }

    /**
     * Get pencairan dana list for a kegiatan
     */
    public function getPencairan(string $id)
    {
        $kegiatan = Kegiatan::with('pencairanDana')->findOrFail($id);
        $this->checkAuthorization($kegiatan, request()->user());
        $totalDisbursed = $kegiatan->pencairanDana()->sum('persentase');
        $nominalDisbursed = $kegiatan->pencairanDana()->sum('nominal');
        $maxPencairan = 70; // maks 70% untuk uang muka
        $sisaYangBisaDicairkan = max(0, $maxPencairan - $totalDisbursed);

        return response()->json([
            'pencairan_list' => $kegiatan->pencairanDana,
            'total_persen'   => (float) $totalDisbursed,
            'total_nominal'  => (float) $nominalDisbursed,
            'sisa_persen'    => (float) $sisaYangBisaDicairkan,
            'max_persen'     => $maxPencairan,
            'is_taken'       => (bool) $kegiatan->uang_muka_diambil,
            'total_anggaran' => (float) $kegiatan->total_anggaran,
        ]);
    }

    /**
     * Update kode MAK (verifikator only)
     */
    public function updateKodeMak(Request $request, string $id)
    {
        $kegiatan = Kegiatan::findOrFail($id);

        $validated = $request->validate([
            'kode_mak' => 'required|string|max:100',
        ]);

        $kegiatan->update(['kode_mak' => $validated['kode_mak']]);

        return response()->json([
            'message'  => 'Kode MAK berhasil disimpan.',
            'kode_mak' => $kegiatan->fresh()->kode_mak,
            'kegiatan' => $kegiatan->fresh()->load(['kak', 'iku', 'rab']),
        ]);
    }

    /**
     * Mark disbursements as taken by the pengusul
     */
    public function ambilUangMuka(Request $request, string $id)
    {
        $kegiatan = Kegiatan::findOrFail($id);

        if ($kegiatan->pengusul_id !== $request->user()->id && $request->user()->role !== 'bendahara') {
            return response()->json([
                'message' => 'Akses ditolak. Anda bukan pengusul atau bendahara kegiatan ini.',
            ], 403);
        }

        $isTaken = filter_var($request->input('is_taken', true), FILTER_VALIDATE_BOOLEAN);

        $kegiatan->update([
            'uang_muka_diambil' => $isTaken,
        ]);

        if ($isTaken) {
            $kegiatan->pencairanDana()->where('is_taken', false)->update([
                'is_taken' => true,
                'tanggal_pengambilan' => now(),
            ]);
        } else {
            $kegiatan->pencairanDana()->update([
                'is_taken' => false,
                'tanggal_pengambilan' => null,
            ]);
        }

        return response()->json($kegiatan->fresh()->load(['kak', 'iku', 'rab', 'pencairanDana']));
    }

    /**
     * Calculate LPJ deadline skipping weekends (14 working days)
     */
    private function calculateDeadlineLPJ()
    {
        $deadline = new \DateTime();
        $daysAdded = 0;
        while ($daysAdded < 14) {
            $deadline->modify('+1 day');
            $dayOfWeek = $deadline->format('N'); // 1 = Senin, 7 = Minggu
            if ($dayOfWeek < 6) { // Jika bukan Sabtu (6) atau Minggu (7)
                $daysAdded++;
            }
        }
        return $deadline->format('Y-m-d');
    }

    /**
     * Check target wadir/unit authorization
     */
    private function authorizeKegiatan(Request $request, Kegiatan $kegiatan)
    {
        $user = $request->user();
        if (!$user) {
            return false;
        }

        // Admin, bendahara, rektorat, ppk have global access
        if (in_array($user->role, ['admin', 'bendahara', 'rektorat', 'ppk'], true)) {
            return true;
        }

        // Pengusul can only access their own
        if ($user->role === 'pengusul') {
            return $kegiatan->pengusul_id === $user->id;
        }

        // Verifikator check
        if ($user->role === 'verifikator') {
            if (empty($kegiatan->verifikator_target)) {
                return true; // if null, any verifikator can access/claim
            }
            return $kegiatan->verifikator_target === $user->verifikator_unit;
        }

        // Wadir check (role starts with wadir)
        if (str_starts_with($user->role, 'wadir')) {
            if ($kegiatan->verifikator_target === $user->role) {
                return true;
            }
            // Fallback for wadir2 if target is null
            if ($user->role === 'wadir2' && empty($kegiatan->verifikator_target)) {
                return true;
            }
            return false;
        }

        return false;
    }
}
