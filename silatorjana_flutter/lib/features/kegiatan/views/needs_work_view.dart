import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../viewmodels/kegiatan_viewmodel.dart';
import 'edit_kegiatan_view.dart';
import '../../auth/models/user.dart';

/// NeedsWorkView — mirrors web's NeedsWorkPage.tsx
/// Filters kegiatan with status 'revision_requested' for pengusul.
class NeedsWorkView extends StatelessWidget {
  final User currentUser;
  const NeedsWorkView({super.key, required this.currentUser});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: MediaQuery.of(context).size.width >= 768
          ? null
          : AppBar(
              title: const Text('Perlu Revisi'),
              backgroundColor: Colors.white,
              foregroundColor: const Color(0xFF0F172A),
              elevation: 1,
            ),
      body: Consumer<KegiatanViewModel>(
        builder: (context, vm, _) {
          if (vm.isListLoading && vm.kegiatanList.isEmpty) {
            return const Center(child: CircularProgressIndicator(color: Color(0xFF047857)));
          }

          final revisiItems = vm.kegiatanList.where((k) =>
            k.status.toLowerCase() == 'revision_requested' || k.status.toLowerCase() == 'lpj_revision'
          ).toList();

          if (revisiItems.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(LucideIcons.checkCircle2, size: 64, color: const Color(0xFF10B981).withValues(alpha: 0.5)),
                  const SizedBox(height: 16),
                  const Text('Tidak ada usulan yang perlu direvisi 🎉', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Color(0xFF64748B))),
                  const SizedBox(height: 8),
                  const Text('Semua usulan Anda sudah dalam kondisi baik.', style: TextStyle(color: Color(0xFF94A3B8))),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () => vm.fetchKegiatanList(),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: revisiItems.length,
              itemBuilder: (context, index) {
                final item = revisiItems[index];
                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFFECDD3)),
                    boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 6, offset: const Offset(0, 2))],
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(color: const Color(0xFFFEF2F2), borderRadius: BorderRadius.circular(10)),
                              child: const Icon(LucideIcons.alertTriangle, color: Color(0xFFE11D48), size: 20),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(item.namaKegiatan, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF0F172A)), maxLines: 2, overflow: TextOverflow.ellipsis),
                                  const SizedBox(height: 4),
                                  Text(item.formattedDate, style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
                                ],
                              ),
                            ),
                          ],
                        ),
                        if (item.catatanRevisi != null && item.catatanRevisi!.isNotEmpty) ...[
                          const SizedBox(height: 12),
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(color: const Color(0xFFFFF1F2), borderRadius: BorderRadius.circular(10)),
                            child: Text(
                              'Catatan: ${item.catatanRevisi}',
                              style: const TextStyle(fontSize: 13, color: Color(0xFF9F1239), fontStyle: FontStyle.italic),
                            ),
                          ),
                        ],
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          child: FilledButton.icon(
                            onPressed: () {
                              Navigator.push(context, MaterialPageRoute(builder: (_) => EditKegiatanView(kegiatanId: item.id)))
                                .then((result) { if (result == true) vm.fetchKegiatanList(); });
                            },
                            icon: const Icon(LucideIcons.edit2, size: 16),
                            label: const Text('Perbaiki Sekarang', style: TextStyle(fontWeight: FontWeight.bold)),
                            style: FilledButton.styleFrom(
                              backgroundColor: const Color(0xFFE11D48),
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
