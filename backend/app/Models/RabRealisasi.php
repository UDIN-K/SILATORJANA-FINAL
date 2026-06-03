<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RabRealisasi extends Model
{
    protected $table = 'rab_realisasi';
    protected $primaryKey = 'realisasi_id';

    protected $fillable = [
        'kegiatan_id',
        'rab_id',
        'qty1',
        'satuan1',
        'qty2',
        'satuan2',
        'qty3',
        'satuan3',
        'harga_satuan',
    ];

    protected function casts(): array
    {
        return [
            'qty1' => 'decimal:2',
            'qty2' => 'decimal:2',
            'qty3' => 'decimal:2',
            'harga_satuan' => 'decimal:2',
            'total' => 'decimal:2',
        ];
    }

    public function kegiatan()
    {
        return $this->belongsTo(Kegiatan::class, 'kegiatan_id');
    }

    public function rab()
    {
        return $this->belongsTo(Rab::class, 'rab_id');
    }
}
