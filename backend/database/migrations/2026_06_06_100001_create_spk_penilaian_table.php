<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('spk_penilaian', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('kegiatan_id');
            $table->unsignedBigInteger('lpj_id')->nullable();

            // Skor rubrik (0-100)
            $table->decimal('skor_c1', 6, 2)->default(0); // Ketepatan Waktu Pelaksanaan
            $table->decimal('skor_c2', 6, 2)->default(0); // Ketepatan Anggaran
            $table->decimal('skor_c3', 6, 2)->default(0); // Kesesuaian Output IKU
            $table->decimal('skor_c4', 6, 2)->default(0); // Waktu Approval LPJ

            // Nilai setelah normalisasi MOORA
            $table->decimal('norm_c1', 10, 6)->default(0);
            $table->decimal('norm_c2', 10, 6)->default(0);
            $table->decimal('norm_c3', 10, 6)->default(0);
            $table->decimal('norm_c4', 10, 6)->default(0);

            // Skor akhir Yi (preferensi)
            $table->decimal('skor_akhir', 10, 6)->default(0);

            // Grade: A, B, C, D
            $table->char('grade', 1)->default('D');

            // Metadata
            $table->string('dinilai_oleh')->nullable();  // user name/id yang approve
            $table->timestamp('dinilai_pada')->nullable();

            $table->timestamps();

            $table->index('kegiatan_id');
            $table->index('grade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('spk_penilaian');
    }
};
