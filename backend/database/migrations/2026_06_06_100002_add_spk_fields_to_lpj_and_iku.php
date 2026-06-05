<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tambah tanggal pelaksanaan riil ke tabel LPJ untuk kriteria C1
        Schema::table('lpj', function (Blueprint $table) {
            $table->date('tanggal_pelaksanaan_real')->nullable()->after('tanggal_pengajuan');
        });

        // Tambah capaian persen ke tabel IKU untuk kriteria C3
        Schema::table('iku', function (Blueprint $table) {
            $table->decimal('capaian_persen', 8, 2)->nullable()->after('target_persen');
        });
    }

    public function down(): void
    {
        Schema::table('lpj', function (Blueprint $table) {
            $table->dropColumn('tanggal_pelaksanaan_real');
        });

        Schema::table('iku', function (Blueprint $table) {
            $table->dropColumn('capaian_persen');
        });
    }
};
