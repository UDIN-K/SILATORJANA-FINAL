<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SecurityTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test ganti password dengan validasi kuat.
     */
    public function test_change_password_validation_rules(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('OldPassword123!'),
        ]);

        // 1. Password terlalu pendek (kurang dari 8 karakter)
        $response = $this->actingAs($user)
            ->postJson('/api/change-password', [
                'current_password' => 'OldPassword123!',
                'new_password' => 'Ab1!',
            ]);
        $response->assertStatus(422);

        // 2. Password tanpa huruf besar
        $response = $this->actingAs($user)
            ->postJson('/api/change-password', [
                'current_password' => 'OldPassword123!',
                'new_password' => 'ab12345!',
            ]);
        $response->assertStatus(422);

        // 3. Password tanpa simbol
        $response = $this->actingAs($user)
            ->postJson('/api/change-password', [
                'current_password' => 'OldPassword123!',
                'new_password' => 'Ab123456',
            ]);
        $response->assertStatus(422);

        // 4. Password kuat (memenuhi kriteria)
        $response = $this->actingAs($user)
            ->postJson('/api/change-password', [
                'current_password' => 'OldPassword123!',
                'new_password' => 'StrongPass123!',
            ]);
        $response->assertStatus(200);
        $response->assertJsonPath('message', 'Password berhasil diubah.');
    }

    /**
     * Test proteksi IDOR pada profil user.
     */
    public function test_user_profile_idor_protection(): void
    {
        $user1 = User::factory()->create(['role' => 'pengusul']);
        $user2 = User::factory()->create(['role' => 'pengusul']);
        $admin = User::factory()->create(['role' => 'admin']);

        // 1. User1 mengakses profilnya sendiri (boleh)
        $response = $this->actingAs($user1)
            ->getJson("/api/users/{$user1->id}");
        $response->assertStatus(200);

        // 2. User1 mengakses profil User2 (tidak boleh/IDOR protection)
        $response = $this->actingAs($user1)
            ->getJson("/api/users/{$user2->id}");
        $response->assertStatus(403);
        $response->assertJsonPath('message', 'Anda tidak memiliki hak akses untuk melihat profil pengguna ini.');

        // 3. Admin mengakses profil User2 (boleh)
        $response = $this->actingAs($admin)
            ->getJson("/api/users/{$user2->id}");
        $response->assertStatus(200);
    }

    /**
     * Test enkripsi biometric token dan login biometrik.
     */
    public function test_biometric_token_encryption_and_login(): void
    {
        $plainToken = 'my_super_secret_biometric_token_123';
        
        $user = User::factory()->create([
            'email' => 'biometric@test.com',
            'allow_biometric' => true,
            'biometric_token' => $plainToken,
        ]);

        // Verifikasi di database nilai token tersimpan terenkripsi
        $this->assertDatabaseHas('users', [
            'email' => 'biometric@test.com',
        ]);
        
        // Ambil data raw dari database untuk membuktikan terenkripsi
        $rawUser = \Illuminate\Support\Facades\DB::table('users')
            ->where('email', 'biometric@test.com')
            ->first();
        
        $this->assertNotEquals($plainToken, $rawUser->biometric_token);
        $this->assertEquals($plainToken, Crypt::decryptString($rawUser->biometric_token));

        // Test login biometrik berhasil menggunakan token asli
        $response = $this->postJson('/api/biometric-login', [
            'email' => 'biometric@test.com',
            'biometric_token' => $plainToken,
        ]);
        $response->assertStatus(200);
        $response->assertJsonStructure(['token', 'user']);

        // Test login biometrik gagal menggunakan token yang salah
        $response = $this->postJson('/api/biometric-login', [
            'email' => 'biometric@test.com',
            'biometric_token' => 'wrong_token',
        ]);
        $response->assertStatus(401);
    }
}
