<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    /**
     * List all users (admin only)
     */
    public function index(Request $request)
    {
        $query = User::query();

        if ($request->has('role')) {
            $query->where('role', $request->role);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nama', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('nip', 'like', "%{$search}%");
            });
        }

        $users = $query->orderBy('created_at', 'desc')->paginate($request->get('limit', 25));

        return response()->json($users);
    }

    /**
     * Get single user
     */
    public function show(string $id)
    {
        $user = User::with('kegiatan')->findOrFail($id);
        return response()->json($user);
    }

    /**
     * Create new user
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role' => 'required|string|in:admin,pengusul,verifikator,ppk,wadir1,wadir2,wadir3,wadir4,bendahara,rektorat',
            'jurusan' => 'nullable|string',
            'nip' => 'nullable|string',
            'verifikator_unit' => 'nullable|string|in:wadir1,wadir2,wadir3,wadir4',
            'allow_biometric' => 'boolean',
        ]);

        $user = User::create($validated);

        // Clear any orphaned tokens/sessions/history/kegiatan if the ID was somehow reused or left over
        $user->tokens()->delete();
        \App\Models\Kegiatan::where('pengusul_id', $user->id)->delete();
        DB::table('status_history')->where('user_id', $user->id)->delete();

        return response()->json($user, 201);
    }

    /**
     * Update user
     */
    public function update(Request $request, string $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'nama' => 'sometimes|string|max:255',
            'email' => "sometimes|email|unique:users,email,{$id}",
            'password' => 'sometimes|string|min:6',
            'role' => 'sometimes|string|in:admin,pengusul,verifikator,ppk,wadir1,wadir2,wadir3,wadir4,bendahara,rektorat',
            'jurusan' => 'nullable|string',
            'nip' => 'nullable|string',
            'verifikator_unit' => 'nullable|string|in:wadir1,wadir2,wadir3,wadir4',
            'allow_biometric' => 'sometimes|boolean',
        ]);

        $user->update($validated);

        return response()->json($user);
    }

    /**
     * Delete user
     */
    public function destroy(string $id)
    {
        $user = User::findOrFail($id);
        $user->tokens()->delete();
        DB::table('status_history')->where('user_id', $user->id)->delete();
        $user->delete();

        return response()->json(['message' => 'User berhasil dihapus.']);
    }
}
