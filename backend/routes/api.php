<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\KegiatanController;
use App\Http\Controllers\Api\LpjController;
use App\Http\Controllers\Api\SpkController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\IkuMasterController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Si-LATORJANA API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::post('/login', [AuthController::class, 'login']);

// Biometric login (public — no auth needed, uses biometric_token)
Route::post('/biometric-login', function (Request $request) {
    $request->validate([
        'email' => 'required|email',
        'biometric_token' => 'required|string',
    ]);

    $user = \App\Models\User::where('email', $request->email)
        ->where('biometric_token', $request->biometric_token)
        ->where('allow_biometric', true)
        ->first();

    if (!$user) {
        return response()->json(['message' => 'Biometric token tidak valid atau akses dinonaktifkan.'], 401);
    }

    $token = $user->createToken('biometric-auth')->plainTextToken;

    return response()->json([
        'token' => $token,
        'user' => $user,
    ]);
});

Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'app' => 'Si-LATORJANA Backend']);
});

// Protected routes (require Sanctum token)
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Kegiatan (Proposals) — read access for all authenticated users
    Route::apiResource('kegiatan', KegiatanController::class)->only(['index', 'show']);

    // Kegiatan — write access limited to pengusul & admin
    Route::middleware('role:pengusul,admin')->group(function () {
        Route::apiResource('kegiatan', KegiatanController::class)->only(['store', 'destroy']);
    });

    // Kegiatan Update — all roles involved in approval/LPJ workflow can update status/metadata
    Route::middleware('role:pengusul,admin,verifikator,ppk,wadir1,wadir2,wadir3,wadir4,bendahara,rektorat')->group(function () {
        Route::put('kegiatan/{kegiatan}', [KegiatanController::class, 'update']);
        Route::patch('kegiatan/{kegiatan}', [KegiatanController::class, 'update']);
    });

    // Users — admin only (except show)
    Route::middleware('role:admin')->group(function () {
        Route::apiResource('users', UserController::class)->except(['show']);

        // Admin: generate biometric tokens for selected users
        Route::post('/biometric-assign', function (Request $request) {
            $request->validate([
                'user_ids' => 'required|array|min:1',
                'user_ids.*' => 'integer|exists:users,id',
            ]);

            $results = [];
            foreach ($request->user_ids as $userId) {
                $user = \App\Models\User::find($userId);
                if ($user) {
                    // Generate a unique biometric token
                    $token = bin2hex(random_bytes(32));
                    $user->update([
                        'biometric_token' => $token,
                        'allow_biometric' => true,
                    ]);
                    $results[] = [
                        'id' => $user->id,
                        'email' => $user->email,
                        'nama' => $user->nama,
                        'role' => $user->role,
                        'biometric_token' => $token,
                    ];
                }
            }

            return response()->json(['assigned' => $results]);
        });

        // Admin: revoke biometric for selected users
        Route::post('/biometric-revoke', function (Request $request) {
            $request->validate([
                'user_ids' => 'required|array|min:1',
                'user_ids.*' => 'integer|exists:users,id',
            ]);

            \App\Models\User::whereIn('id', $request->user_ids)->update([
                'biometric_token' => null,
                'allow_biometric' => false,
            ]);

            return response()->json(['message' => 'Biometric access revoked.']);
        });
    });

    // Users show — all authenticated users can view a user profile
    Route::get('users/{user}', [UserController::class, 'show']);

    // IKU Master — admin only
    Route::middleware('role:admin')->group(function () {
        Route::apiResource('iku-master', IkuMasterController::class);
    });

    // Quick stats for dashboards
    Route::get('/stats', function (Request $request) {
        $user = $request->user();
        $query = \App\Models\Kegiatan::query();

        // If pengusul, only show their own
        if ($user->role === 'pengusul') {
            $query->where('pengusul_id', $user->id);
        }

        return response()->json([
            'total' => (clone $query)->count(),
            'draft' => (clone $query)->where('status', 'draft')->count(),
            'submitted' => (clone $query)->where('status', 'submitted')->count(),
            'verified' => (clone $query)->where('status', 'verified')->count(),
            'approved' => (clone $query)->whereIn('status', ['approved_ppk', 'approved_wadir'])->count(),
            'revision' => (clone $query)->whereIn('status', ['revision_requested', 'revisi'])->count(),
            'rejected' => (clone $query)->whereIn('status', ['rejected', 'ditolak'])->count(),
            'completed' => (clone $query)->whereIn('status', ['completed', 'lpj_done'])->count(),
        ]);
    });

    // Status History — timeline tracking
    Route::get('/status-history/{ref_type}/{ref_id}', function ($refType, $refId) {
        return response()->json(
            \App\Models\StatusHistory::where('ref_type', $refType)
                ->where('ref_id', $refId)
                ->orderBy('created_at', 'asc')
                ->get()
        );
    });

    Route::post('/status-history', function (Request $request) {
        $validated = $request->validate([
            'ref_type' => 'required|string',
            'ref_id' => 'required|integer',
            'status_lama' => 'nullable|string',
            'status_baru' => 'required|string',
            'catatan' => 'nullable|string',
        ]);

        $user = $request->user();
        $validated['user_id'] = $user->id;
        $validated['user_nama'] = $user->nama;
        $validated['user_role'] = $user->role;

        return response()->json(\App\Models\StatusHistory::create($validated), 201);
    });

    // Jurusan (departments)
    Route::get('/jurusan', function () {
        return response()->json(\App\Models\Jurusan::orderBy('nama_jurusan')->get());
    });

    Route::post('kegiatan/{kegiatan}/submit-ppk', [KegiatanController::class, 'submitPpk']);
    Route::get('kegiatan/{kegiatan}/pencairan', [KegiatanController::class, 'getPencairan']);
    Route::post('kegiatan/{kegiatan}/pencairan', [KegiatanController::class, 'tambahPencairan']);
    Route::post('kegiatan/{kegiatan}/ambil-uang-muka', [KegiatanController::class, 'ambilUangMuka']);
    Route::patch('kegiatan/{kegiatan}/kode-mak', [KegiatanController::class, 'updateKodeMak']);

    // SPK (Sistem Pendukung Keputusan) — MOORA
    Route::prefix('spk')->group(function () {
        Route::get('/kriteria', [SpkController::class, 'kriteria']);
        Route::get('/hitung/{kegiatan_id}', [SpkController::class, 'hitung']);
        Route::get('/hitung-batch', [SpkController::class, 'hitungBatch']);
        Route::post('/simpan/{kegiatan_id}', [SpkController::class, 'simpan']);
        Route::get('/riwayat', [SpkController::class, 'riwayat']);
        Route::get('/ranking-jurusan', [SpkController::class, 'rankingJurusan']);
    });

    // LPJ
    Route::get('/lpj/detail/{kegiatan_id}', [LpjController::class, 'detail']);
    Route::post('/lpj/submit', [LpjController::class, 'submit']);
    Route::delete('/lpj/file/{file_id}', [LpjController::class, 'deleteFile']);

    // Legacy LPJ (simple create/get)
    Route::post('/lpj', function (Request $request) {
        $validated = $request->validate([
            'kegiatan_id' => 'required|integer',
            'catatan_pengusul' => 'nullable|string',
        ]);
        return response()->json(\App\Models\Lpj::create($validated), 201);
    });

    Route::get('/lpj/{kegiatan_id}', function ($kegiatanId) {
        return response()->json(
            \App\Models\Lpj::where('kegiatan_id', $kegiatanId)->first()
        );
    });

    // Password change
    Route::post('/change-password', function (Request $request) {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6',
        ]);

        $user = $request->user();
        if (!\Illuminate\Support\Facades\Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Password lama salah.'], 422);
        }

        $user->update(['password' => \Illuminate\Support\Facades\Hash::make($request->new_password)]);
        return response()->json(['message' => 'Password berhasil diubah.']);
    });

    // File upload (surat pengantar, file KAK)
    Route::post('/upload', function (Request $request) {
        $request->validate([
            'file' => 'required|file|mimes:pdf,doc,docx,jpg,jpeg,png,xls,xlsx|max:10240', // max 10MB
            'type' => 'required|string|in:surat_pengantar,file_kak,lpj_file',
        ]);

        $file = $request->file('file');
        
        $type = $request->input('type');
        $folder = 'data/upload';
        
        if ($type === 'surat_pengantar') {
            $folder = 'data/upload/surat_pengantar';
        } else if ($type === 'lpj_file') {
            $folder = 'data/upload/lpj';
        } else if ($type === 'file_kak') {
            $folder = 'data/upload/kak';
        }

        $destinationPath = public_path($folder);
        if (!file_exists($destinationPath)) {
            mkdir($destinationPath, 0755, true);
        }

        $filename = time() . '_' . $file->getClientOriginalName();
        $file->move($destinationPath, $filename);

        $path = $folder . '/' . $filename;

        return response()->json([
            'path' => $path,
            'url' => url($path),
            'original_name' => $file->getClientOriginalName(),
        ]);
    });

    // Notifications (recent status changes)
    Route::get('/notifications', function (Request $request) {
        $user = $request->user();
        $query = \App\Models\StatusHistory::orderBy('created_at', 'desc')->limit(20);

        // Pengusul only sees their own kegiatan changes
        if ($user->role === 'pengusul') {
            $kegiatanIds = \App\Models\Kegiatan::where('pengusul_id', $user->id)->pluck('id');
            $query->where('ref_type', 'kegiatan')->whereIn('ref_id', $kegiatanIds);
        }

        return response()->json($query->get());
    });

    // System health (for admin dashboard)
    Route::get('/system-health', function () {
        $dbOk = true;
        try {
            \Illuminate\Support\Facades\DB::connection()->getPdo();
        } catch (\Exception $e) {
            $dbOk = false;
        }

        return response()->json([
            'database' => $dbOk ? 'connected' : 'error',
            'storage' => is_writable(storage_path()) ? 'writable' : 'error',
            'users_count' => \App\Models\User::count(),
            'kegiatan_count' => \App\Models\Kegiatan::count(),
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version(),
            'uptime' => round((microtime(true) - LARAVEL_START) * 1000) . 'ms',
        ]);
    });
});

// Chatbot (Jana Assistant) - uses OpenRouter API
Route::post('/chat', function (Request $request) {
    $apiKey = config('services.openrouter.api_key');
    if (!$apiKey) {
        return response()->json(['reply' => 'Asisten Jana belum dikonfigurasi. Tambahkan OPENROUTER_API_KEY di .env backend.'], 200);
    }

    $message = $request->input('message', '');
    if (!$message) {
        return response()->json(['reply' => 'Pesan tidak boleh kosong.'], 422);
    }

    $systemPrompt = "Kamu adalah Jana, asisten AI untuk sistem Si-LATORJANA (Sistem Layanan Administrasi Pelaporan Kegiatan Jurusan) di Politeknik Negeri Jakarta. "
        . "Jawab dalam Bahasa Indonesia yang sopan dan ringkas. "
        . "Bantu pengguna terkait: cara membuat usulan kegiatan, alur persetujuan (Pengusul→Verifikator→PPK→Wadir→Bendahara→Rektorat), "
        . "cara mengisi KAK, RAB, dan IKU, serta panduan umum penggunaan sistem.";

    try {
        $response = \Illuminate\Support\Facades\Http::withHeaders([
            'Authorization' => "Bearer {$apiKey}",
            'Content-Type' => 'application/json',
            'HTTP-Referer' => config('app.url', 'http://localhost'),
            'X-Title' => 'Si-LATORJANA',
        ])->post('https://openrouter.ai/api/v1/chat/completions', [
            'model' => 'openrouter/free',
            'max_tokens' => 500,
            'messages' => [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => $message],
            ],
        ]);

        $data = $response->json();
        $reply = $data['choices'][0]['message']['content'] ?? json_encode($data);

        return response()->json(['reply' => $reply]);
    } catch (\Exception $e) {
        return response()->json(['reply' => 'Terjadi kesalahan: ' . $e->getMessage()], 200);
    }
});

