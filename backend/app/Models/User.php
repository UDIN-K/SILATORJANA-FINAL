<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'nama',
        'email',
        'password',
        'role',
        'jurusan',
        'nip',
        'verifikator_unit',
        'allow_biometric',
        'biometric_token',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'biometric_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'allow_biometric' => 'boolean',
        ];
    }

    public function kegiatan()
    {
        return $this->hasMany(Kegiatan::class, 'pengusul_id');
    }
}
