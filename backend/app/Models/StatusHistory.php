<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StatusHistory extends Model
{
    protected $table = 'status_history';

    protected $fillable = [
        'ref_type',
        'ref_id',
        'status_lama',
        'status_baru',
        'catatan',
        'user_id',
        'user_nama',
        'user_role',
        'payload_snapshot',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
