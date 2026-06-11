import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// Panduan view — mirrors web's PanduanPage.tsx.
/// Shows user guide for the Si-LATORJANA system.
class PanduanView extends StatelessWidget {
  const PanduanView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: MediaQuery.of(context).size.width >= 768
          ? null
          : AppBar(
              title: const Text('Panduan Penggunaan'),
              backgroundColor: Colors.white,
              foregroundColor: const Color(0xFF0F172A),
              elevation: 1,
            ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildGuideCard(
            icon: LucideIcons.fileText,
            title: '1. Membuat Usulan Baru',
            description: 'Klik tombol "Buat Usulan" di halaman Usulan. Isi formulir KAK, RAB, dan IKU dengan lengkap sebelum mengirim.',
            color: const Color(0xFF3B82F6),
          ),
          _buildGuideCard(
            icon: LucideIcons.send,
            title: '2. Mengirim Usulan',
            description: 'Setelah semua data terisi, klik "Kirim Usulan". Proposal akan masuk ke meja Verifikator untuk dicek.',
            color: const Color(0xFF8B5CF6),
          ),
          _buildGuideCard(
            icon: LucideIcons.shieldCheck,
            title: '3. Proses Verifikasi',
            description: 'Verifikator akan mengecek kelengkapan. Jika ada kekurangan, status berubah menjadi "Revisi". Perbaiki lalu kirim ulang.',
            color: const Color(0xFFF59E0B),
          ),
          _buildGuideCard(
            icon: LucideIcons.checkCircle,
            title: '4. Persetujuan PPK & Wadir',
            description: 'Setelah diverifikasi, proposal diteruskan ke PPK lalu Wadir untuk persetujuan akhir.',
            color: const Color(0xFF10B981),
          ),
          _buildGuideCard(
            icon: LucideIcons.banknote,
            title: '5. Pencairan Dana',
            description: 'Bendahara akan mencairkan dana (bisa bertahap). Setelah kegiatan selesai, upload LPJ.',
            color: const Color(0xFF047857),
          ),
          _buildGuideCard(
            icon: LucideIcons.clipboardCheck,
            title: '6. LPJ & Penyelesaian',
            description: 'Upload LPJ beserta kuitansi. Bendahara akan memverifikasi. Jika disetujui, kegiatan selesai.',
            color: const Color(0xFF0891B2),
          ),
        ],
      ),
    );
  }

  Widget _buildGuideCard({required IconData icon, required String title, required String description, required Color color}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, size: 24, color: color),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF1E293B))),
                const SizedBox(height: 4),
                Text(description, style: const TextStyle(fontSize: 13, color: Color(0xFF64748B), height: 1.4)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
