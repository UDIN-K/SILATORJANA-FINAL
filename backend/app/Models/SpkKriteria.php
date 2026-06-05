<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SpkKriteria extends Model
{
    protected $table = 'spk_kriteria';

    protected $fillable = [
        'kode',
        'nama',
        'tipe',
        'bobot',
        'deskripsi',
    ];

    protected function casts(): array
    {
        return [
            'bobot' => 'decimal:4',
        ];
    }
}
