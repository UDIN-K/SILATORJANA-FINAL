<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\KegiatanController;
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

    // LPJ
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
            'file' => 'required|file|max:10240', // max 10MB
            'type' => 'required|string|in:surat_pengantar,file_kak,lpj_file',
        ]);

        $file = $request->file('file');
        $path = $file->store($request->type, 'public');

        return response()->json([
            'path' => $path,
            'url' => \Illuminate\Support\Facades\Storage::url($path),
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
            'model' => 'google/gemini-2.0-flash-001',
            'messages' => [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => $message],
            ],
        ]);

        $data = $response->json();
        $reply = $data['choices'][0]['message']['content'] ?? 'Maaf, saya tidak bisa memproses permintaan Anda saat ini.';

        return response()->json(['reply' => $reply]);
    } catch (\Exception $e) {
        return response()->json(['reply' => 'Terjadi kesalahan: ' . $e->getMessage()], 200);
    }
});

