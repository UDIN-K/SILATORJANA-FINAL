<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SpkPenilaian extends Model
{
    protected $table = 'spk_penilaian';

    protected $fillable = [
        'kegiatan_id',
        'lpj_id',
        'skor_c1',
        'skor_c2',
        'skor_c3',
        'skor_c4',
        'norm_c1',
        'norm_c2',
        'norm_c3',
        'norm_c4',
        'skor_akhir',
        'grade',
        'dinilai_oleh',
        'dinilai_pada',
    ];

    protected function casts(): array
    {
        return [
            'skor_c1'     => 'decimal:2',
            'skor_c2'     => 'decimal:2',
            'skor_c3'     => 'decimal:2',
            'skor_c4'     => 'decimal:2',
            'norm_c1'     => 'decimal:6',
            'norm_c2'     => 'decimal:6',
            'norm_c3'     => 'decimal:6',
            'norm_c4'     => 'decimal:6',
            'skor_akhir'  => 'decimal:6',
            'dinilai_pada' => 'datetime',
        ];
    }

    public function kegiatan()
    {
        return $this->belongsTo(Kegiatan::class);
    }

    public function lpj()
    {
        return $this->belongsTo(Lpj::class);
    }
}
