<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Iku extends Model
{
    use HasFactory;

    protected $table = 'iku';

    protected $fillable = [
        'kegiatan_id',
        'nama_iku',
        'target_persen',
        'capaian_persen',
    ];

    protected function casts(): array
    {
        return [
            'target_persen' => 'decimal:2',
            'capaian_persen' => 'decimal:2',
        ];
    }

    public function kegiatan()
    {
        return $this->belongsTo(Kegiatan::class);
    }
}
