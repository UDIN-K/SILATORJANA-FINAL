<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kegiatan;
use App\Models\Lpj;
use App\Models\LpjFile;
use App\Models\Rab;
use App\Models\RabRealisasi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class LpjController extends Controller
{
    /**
     * Get proposal detail for LPJ form (RAB with existing realisasi + files)
     */
    public function detail(Request $request, $kegiatanId)
    {
        $user = $request->user();

        $kegiatan = Kegiatan::with(['kak', 'rab'])
            ->where('id', $kegiatanId)
            ->first();

        if (!$kegiatan) {
            return response()->json(['message' => 'Kegiatan tidak ditemukan'], 404);
        }

        // Security: pengusul can only see their own
        if ($user->role === 'pengusul' && $kegiatan->pengusul_id != $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Get existing realisasi indexed by rab_id
        $realisasiMap = RabRealisasi::where('kegiatan_id', $kegiatanId)
            ->get()
            ->keyBy('rab_id');

        // Get existing files grouped by rab_id
        $filesGrouped = LpjFile::where('kegiatan_id', $kegiatanId)
            ->get()
            ->groupBy('rab_id');

        // Group RAB by kategori, merging realisasi and files
        $rabGrouped = [];
        $categoryLabels = [
            'barang' => 'Belanja Barang',
            'jasa' => 'Belanja Jasa',
            'perjalanan' => 'Belanja Perjalanan',
        ];

        foreach ($kegiatan->rab as $rab) {
            $kategori = strtolower($rab->kategori ?? 'lainnya');
            $rabId = $rab->id;

            $real = $realisasiMap->get($rabId);
            $files = $filesGrouped->get($rabId, collect());

            $rabItem = $rab->toArray();
            $rabItem['real_qty1'] = $real?->qty1;
            $rabItem['real_satuan1'] = $real?->satuan1;
            $rabItem['real_qty2'] = $real?->qty2;
            $rabItem['real_satuan2'] = $real?->satuan2;
            $rabItem['real_qty3'] = $real?->qty3;
            $rabItem['real_satuan3'] = $real?->satuan3;
            $rabItem['real_harga_satuan'] = $real?->harga_satuan;
            $rabItem['existing_files'] = $files->map(function ($f) {
                return [
                    'file_id' => $f->file_id,
                    'filename' => $f->filename,
                    'original_name' => $f->original_name,
                    'file_size' => $f->file_size,
                    'uploaded_at' => $f->uploaded_at,
                    'url' => Storage::disk('public')->url('lpj/' . $f->filename),
                ];
            })->values();

            if (!isset($rabGrouped[$kategori])) {
                $rabGrouped[$kategori] = [
                    'label' => $categoryLabels[$kategori] ?? ucwords(str_replace('_', ' ', $kategori)),
                    'items' => [],
                ];
            }
            $rabGrouped[$kategori]['items'][] = $rabItem;
        }

        // Get LPJ record if exists
        $lpj = Lpj::where('kegiatan_id', $kegiatanId)
            ->orderBy('created_at', 'desc')
            ->first();

        return response()->json([
            'kegiatan' => [
                'id' => $kegiatan->id,
                'nama_kegiatan' => $kegiatan->nama_kegiatan,
                'tanggal_kegiatan' => $kegiatan->tanggal_kegiatan,
                'tempat' => $kegiatan->tempat,
                'nama_jurusan' => $kegiatan->nama_jurusan,
                'status' => $kegiatan->status,
                'total_anggaran' => $kegiatan->total_anggaran,
                'pengusul_nama' => $kegiatan->pengusul_nama,
            ],
            'rab' => $rabGrouped,
            'lpj' => $lpj,
        ]);
    }

    /**
     * Submit LPJ — save realisasi data, upload files, update status
     */
    public function submit(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'kegiatan_id' => 'required|integer',
            'catatan_pengusul' => 'nullable|string',
        ]);

        $kegiatanId = $request->input('kegiatan_id');

        $kegiatan = Kegiatan::where('id', $kegiatanId)
            ->whereIn('status', ['funds_disbursed', 'accepted_funds', 'lpj_revision', 'lpj_pending'])
            ->first();

        if (!$kegiatan) {
            return response()->json([
                'message' => 'Kegiatan tidak ditemukan atau status tidak valid untuk upload LPJ'
            ], 422);
        }

        // Security check
        if ($user->role === 'pengusul' && $kegiatan->pengusul_id != $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Check for uploaded files
        $itemFiles = $request->file('item_files') ?? [];
        $hasNewFiles = !empty($itemFiles);

        // Count existing files
        $existingFileCount = LpjFile::where('kegiatan_id', $kegiatanId)->count();

        if (!$hasNewFiles && $existingFileCount === 0) {
            return response()->json([
                'message' => 'Minimal upload 1 file bukti'
            ], 422);
        }

        DB::beginTransaction();

        try {
            // Get or create LPJ record
            $lpj = Lpj::where('kegiatan_id', $kegiatanId)
                ->orderBy('created_at', 'desc')
                ->first();

            if ($lpj) {
                $lpj->update([
                    'tanggal_pengajuan' => now(),
                    'status_verifikasi' => 'submitted',
                    'catatan_pengusul' => $request->input('catatan_pengusul'),
                ]);
            } else {
                $lpj = Lpj::create([
                    'kegiatan_id' => $kegiatanId,
                    'tanggal_pengajuan' => now(),
                    'status_verifikasi' => 'submitted',
                    'catatan_pengusul' => $request->input('catatan_pengusul'),
                ]);
            }

            // Handle file uploads per RAB item
            $uploadedFiles = [];
            $errors = [];
            $allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
            $maxSize = 5 * 1024 * 1024; // 5MB

            // Ensure storage directory exists
            Storage::disk('public')->makeDirectory('lpj');

            foreach ($itemFiles as $rabId => $files) {
                // Ensure files is an array
                if (!is_array($files)) {
                    $files = [$files];
                }

                // Verify RAB belongs to this kegiatan
                $rab = Rab::where('id', $rabId)
                    ->where('kegiatan_id', $kegiatanId)
                    ->first();

                if (!$rab) {
                    $errors[] = "RAB ID $rabId tidak terkait dengan kegiatan ini";
                    continue;
                }

                foreach ($files as $file) {
                    if (!$file || !$file->isValid()) continue;

                    if (!in_array($file->getMimeType(), $allowedMimes)) {
                        $errors[] = "File {$file->getClientOriginalName()}: Tipe tidak diizinkan";
                        continue;
                    }

                    if ($file->getSize() > $maxSize) {
                        $errors[] = "File {$file->getClientOriginalName()}: Ukuran melebihi 5MB";
                        continue;
                    }

                    $ext = strtolower($file->getClientOriginalExtension());
                    $filename = sprintf(
                        '%s_%d_rab%d_%d_%s.%s',
                        $rab->kategori ?? 'file',
                        $kegiatanId,
                        $rabId,
                        time(),
                        uniqid(),
                        $ext
                    );

                    $file->storeAs('lpj', $filename, 'public');

                    LpjFile::create([
                        'lpj_id' => $lpj->id,
                        'kegiatan_id' => $kegiatanId,
                        'kategori' => $rab->kategori ?? 'barang',
                        'rab_id' => $rabId,
                        'filename' => $filename,
                        'original_name' => $file->getClientOriginalName(),
                        'file_size' => $file->getSize(),
                    ]);

                    $uploadedFiles[] = [
                        'filename' => $filename,
                        'original_name' => $file->getClientOriginalName(),
                        'rab_id' => $rabId,
                    ];
                }
            }

            // Save realisasi data
            $realisasiData = $request->input('realisasi', []);
            if (is_string($realisasiData)) {
                $realisasiData = json_decode($realisasiData, true) ?? [];
            }

            foreach ($realisasiData as $rabId => $data) {
                // Verify RAB belongs to this kegiatan
                $exists = Rab::where('id', $rabId)
                    ->where('kegiatan_id', $kegiatanId)
                    ->exists();

                if (!$exists) continue;

                RabRealisasi::updateOrCreate(
                    ['kegiatan_id' => $kegiatanId, 'rab_id' => $rabId],
                    [
                        'qty1' => $data['qty1'] ?? 0,
                        'satuan1' => $data['satuan1'] ?? '',
                        'qty2' => $data['qty2'] ?? 1,
                        'satuan2' => $data['satuan2'] ?? '',
                        'qty3' => $data['qty3'] ?? null,
                        'satuan3' => $data['satuan3'] ?? '',
                        'harga_satuan' => $data['harga_satuan'] ?? 0,
                    ]
                );
            }

            // Update kegiatan status to lpj_submitted
            $kegiatan->update(['status' => 'lpj_submitted']);

            DB::commit();

            $totalFiles = $existingFileCount + count($uploadedFiles);

            return response()->json([
                'message' => "LPJ berhasil disubmit! Total bukti tersimpan: $totalFiles.",
                'uploaded_files' => $uploadedFiles,
                'warnings' => $errors,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Gagal menyimpan LPJ: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete an uploaded LPJ file
     */
    public function deleteFile(Request $request, $fileId)
    {
        $user = $request->user();

        $file = LpjFile::find($fileId);
        if (!$file) {
            return response()->json(['message' => 'File tidak ditemukan'], 404);
        }

        // Security check: pengusul can only delete their own
        if ($user->role === 'pengusul') {
            $kegiatan = Kegiatan::find($file->kegiatan_id);
            if (!$kegiatan || $kegiatan->pengusul_id != $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        // Delete physical file
        Storage::disk('public')->delete('lpj/' . $file->filename);

        $file->delete();

        return response()->json(['message' => 'File berhasil dihapus']);
    }
}
