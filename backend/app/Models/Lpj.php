<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Lpj extends Model
{
    protected $table = 'lpj';

    protected $fillable = [
        'kegiatan_id',
        'catatan_pengusul',
        'catatan_verifikasi',
        'status_verifikasi',
        'file_lpj',
        'tanggal_pengajuan',
        'tanggal_pelaksanaan_real',
        'deadline',
        'verified_by',
        'catatan_bendahara',
        'catatan_lama',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_pengajuan' => 'date',
            'tanggal_pelaksanaan_real' => 'date',
            'deadline' => 'date',
        ];
    }

    public function kegiatan()
    {
        return $this->belongsTo(Kegiatan::class);
    }

    public function files()
    {
        return $this->hasMany(LpjFile::class, 'lpj_id');
    }
}
