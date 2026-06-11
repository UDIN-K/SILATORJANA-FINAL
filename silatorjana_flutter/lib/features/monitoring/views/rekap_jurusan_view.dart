import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../viewmodels/monitoring_viewmodel.dart';
import '../../kegiatan/models/kegiatan.dart';

/// Rekap Jurusan — mirrors web's RekapJurusanPage.tsx
/// Groups kegiatan by department and shows counts per status.
class RekapJurusanView extends StatefulWidget {
  const RekapJurusanView({super.key});

  @override
  State<RekapJurusanView> createState() => _RekapJurusanViewState();
}

class _RekapJurusanViewState extends State<RekapJurusanView> {
  final MonitoringViewModel _viewModel = MonitoringViewModel();

  @override
  void initState() {
    super.initState();
    _viewModel.fetchMonitoringData();
  }

  @override
  void dispose() {
    _viewModel.dispose();
    super.dispose();
  }

  Map<String, List<Kegiatan>> _groupByJurusan() {
    final map = <String, List<Kegiatan>>{};
    for (var item in _viewModel.allItems) {
      final jurusan = item.namaJurusan ?? 'Tidak Diketahui';
      map.putIfAbsent(jurusan, () => []).add(item);
    }
    return Map.fromEntries(map.entries.toList()..sort((a, b) => b.value.length.compareTo(a.value.length)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: ListenableBuilder(
        listenable: _viewModel,
        builder: (context, _) {
          if (_viewModel.isLoading) {
            return const Center(child: CircularProgressIndicator(color: Color(0xFF047857)));
          }

          final grouped = _groupByJurusan();

          if (grouped.isEmpty) {
            return const Center(child: Text('Belum ada data.'));
          }

          return RefreshIndicator(
            onRefresh: () => _viewModel.fetchMonitoringData(),
            color: const Color(0xFF047857),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: grouped.length,
              itemBuilder: (context, index) {
                final jurusan = grouped.keys.elementAt(index);
                final items = grouped[jurusan]!;
                final completed = items.where((i) => ['completed', 'lpj_done', 'selesai'].contains(i.status.toLowerCase())).length;
                final active = items.length - completed;

                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: const Color(0xFFECFDF5),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(LucideIcons.building2, size: 20, color: Color(0xFF047857)),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(jurusan, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF1E293B))),
                                Text('${items.length} kegiatan', style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          _buildMiniStat('Aktif', active, const Color(0xFF3B82F6)),
                          const SizedBox(width: 12),
                          _buildMiniStat('Selesai', completed, const Color(0xFF047857)),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildMiniStat(String label, int value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          children: [
            Text(value.toString(), style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: color)),
            const SizedBox(width: 8),
            Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: color)),
          ],
        ),
      ),
    );
  }
}
