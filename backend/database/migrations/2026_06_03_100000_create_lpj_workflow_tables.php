<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Extend lpj table with additional columns
        Schema::table('lpj', function (Blueprint $table) {
            $table->string('file_lpj')->nullable()->after('catatan_verifikasi');
            $table->date('tanggal_pengajuan')->nullable()->after('file_lpj');
            $table->date('deadline')->nullable()->after('tanggal_pengajuan');
            $table->string('verified_by')->nullable()->after('deadline');
            $table->text('catatan_bendahara')->nullable()->after('verified_by');
            $table->text('catatan_lama')->nullable()->after('catatan_bendahara');
        });

        // LPJ files (receipts/kuitansi per RAB item)
        Schema::create('lpj_files', function (Blueprint $table) {
            $table->id('file_id');
            $table->unsignedBigInteger('lpj_id');
            $table->unsignedBigInteger('kegiatan_id');
            $table->string('kategori')->default('barang'); // barang, jasa, perjalanan
            $table->unsignedBigInteger('rab_id')->nullable();
            $table->string('filename');
            $table->string('original_name');
            $table->unsignedBigInteger('file_size')->default(0);
            $table->timestamp('uploaded_at')->useCurrent();

            $table->index('lpj_id');
            $table->index('kegiatan_id');
            $table->index('rab_id');
        });

        // RAB realisasi (actual expenditure values)
        Schema::create('rab_realisasi', function (Blueprint $table) {
            $table->id('realisasi_id');
            $table->unsignedBigInteger('kegiatan_id');
            $table->unsignedBigInteger('rab_id');
            $table->decimal('qty1', 12, 2)->default(0);
            $table->string('satuan1')->nullable();
            $table->decimal('qty2', 12, 2)->default(1);
            $table->string('satuan2')->nullable();
            $table->decimal('qty3', 12, 2)->nullable();
            $table->string('satuan3')->nullable();
            $table->decimal('harga_satuan', 15, 2)->default(0);
            $table->decimal('total', 15, 2)->virtualAs('qty1 * COALESCE(NULLIF(qty2, 0), 1) * COALESCE(NULLIF(qty3, 0), 1) * harga_satuan');
            $table->timestamps();

            $table->unique(['kegiatan_id', 'rab_id']);
            $table->index('kegiatan_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rab_realisasi');
        Schema::dropIfExists('lpj_files');

        Schema::table('lpj', function (Blueprint $table) {
            $table->dropColumn([
                'file_lpj', 'tanggal_pengajuan', 'deadline',
                'verified_by', 'catatan_bendahara', 'catatan_lama',
            ]);
        });
    }
};
