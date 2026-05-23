<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Kegiatan extends Model
{
    use HasFactory;

    protected $table = 'kegiatan';

    protected $fillable = [
        'nama_kegiatan',
        'deskripsi',
        'jenis_kegiatan',
        'status',
        'pengusul_id',
        'pengusul_nama',
        'nama_jurusan',
        'tanggal_kegiatan',
        'tempat',
        'total_anggaran',
        'catatan_revisi',
        'surat_pengantar',
    ];

    protected function casts(): array
    {
        return [
            'tanggal_kegiatan' => 'date',
            'total_anggaran' => 'decimal:2',
        ];
    }

    /**
     * Auto-record status changes to status_history
     */
    protected static function booted(): void
    {
        static::updating(function (Kegiatan $kegiatan) {
            if ($kegiatan->isDirty('status')) {
                $user = request()->user();
                StatusHistory::create([
                    'ref_type' => 'kegiatan',
                    'ref_id' => $kegiatan->id,
                    'status_lama' => $kegiatan->getOriginal('status'),
                    'status_baru' => $kegiatan->status,
                    'catatan' => $kegiatan->catatan_revisi,
                    'user_id' => $user?->id,
                    'user_nama' => $user?->nama,
                    'user_role' => $user?->role,
                ]);
            }
        });
    }

    public function pengusul()
    {
        return $this->belongsTo(User::class, 'pengusul_id');
    }

    public function kak()
    {
        return $this->hasOne(Kak::class);
    }

    public function iku()
    {
        return $this->hasMany(Iku::class);
    }

    public function rab()
    {
        return $this->hasMany(Rab::class);
    }

    public function statusHistory()
    {
        return $this->hasMany(StatusHistory::class, 'ref_id')
            ->where('ref_type', 'kegiatan')
            ->orderBy('created_at', 'asc');
    }

    public function lpj()
    {
        return $this->hasOne(Lpj::class);
    }
}

