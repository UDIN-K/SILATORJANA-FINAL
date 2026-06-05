<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('spk_kriteria', function (Blueprint $table) {
            $table->id();
            $table->string('kode', 10)->unique();        // C1, C2, C3, C4
            $table->string('nama');                        // Nama kriteria
            $table->enum('tipe', ['benefit', 'cost'])->default('benefit');
            $table->decimal('bobot', 5, 4)->default(0.25); // Bobot kriteria
            $table->text('deskripsi')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('spk_kriteria');
    }
};
