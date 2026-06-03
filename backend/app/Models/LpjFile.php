<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LpjFile extends Model
{
    protected $table = 'lpj_files';
    protected $primaryKey = 'file_id';
    public $timestamps = false;

    protected $fillable = [
        'lpj_id',
        'kegiatan_id',
        'kategori',
        'rab_id',
        'filename',
        'original_name',
        'file_size',
        'uploaded_at',
    ];

    protected function casts(): array
    {
        return [
            'uploaded_at' => 'datetime',
        ];
    }

    public function lpj()
    {
        return $this->belongsTo(Lpj::class, 'lpj_id');
    }

    public function rab()
    {
        return $this->belongsTo(Rab::class, 'rab_id');
    }
}
