<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('kegiatan')
            ->where('status', 'lpj_approved')
            ->update(['status' => 'completed']);
    }

    public function down(): void
    {
        // No rollback needed for data migration
    }
};
