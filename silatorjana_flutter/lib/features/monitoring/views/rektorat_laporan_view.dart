import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../core/network/api_service.dart';
import '../../kegiatan/models/kegiatan.dart';

/// Rektorat Laporan — mirrors web's RektoratLaporanPage.tsx
/// Shows all kegiatan with year/status filters and total anggaran summary.
class RektoratLaporanView extends StatefulWidget {
  const RektoratLaporanView({super.key});

  @override
  State<RektoratLaporanView> createState() => _RektoratLaporanViewState();
}

class _RektoratLaporanViewState extends State<RektoratLaporanView> {
  final ApiService _api = ApiService();
  List<Kegiatan> _allItems = [];
  bool _isLoading = true;
  String _filterStatus = 'all';

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    try {
      final response = await _api.get('/kegiatan');
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List items = data['data'] ?? data;
        _allItems = items.map((j) => Kegiatan.fromJson(j)).toList();
      }
    } catch (e) {
      debugPrint('RektoratLaporan ERROR: $e');
    }
    setState(() => _isLoading = false);
  }

  List<Kegiatan> get _filtered {
    if (_filterStatus == 'all') return _allItems;
    return _allItems.where((k) => k.status.toLowerCase() == _filterStatus).toList();
  }

  num get _totalAnggaran => _filtered.fold<num>(0, (sum, k) => sum + (k.totalAnggaran ?? 0));

  String _formatAnggaran(num amount) {
    final a = amount.toInt();
    final str = a.toString();
    final buf = StringBuffer();
    for (int i = 0; i < str.length; i++) {
      if (i > 0 && (str.length - i) % 3 == 0) buf.write('.');
      buf.write(str[i]);
    }
    return 'Rp $buf';
  }

  @override
  Widget build(BuildContext context) {
    final selesaiCount = _filtered.where((k) => ['completed', 'lpj_done', 'lpj_approved'].contains(k.status.toLowerCase())).length;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: _isLoading
        ? const Center(child: CircularProgressIndicator(color: Color(0xFF047857)))
        : RefreshIndicator(
            onRefresh: _fetchData,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Header
                  const Text('Laporan & Analisis', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                  const SizedBox(height: 4),
                  const Text('Rekap kegiatan dan realisasi anggaran.', style: TextStyle(fontSize: 14, color: Color(0xFF64748B))),
                  const SizedBox(height: 20),

                  // Stat cards
                  Row(
                    children: [
                      Expanded(child: _buildStatCard('Total Kegiatan', _filtered.length.toString(), null)),
                      const SizedBox(width: 10),
                      Expanded(child: _buildStatCard('Total Anggaran', _formatAnggaran(_totalAnggaran), const Color(0xFF1D4ED8))),
                      const SizedBox(width: 10),
                      Expanded(child: _buildStatCard('Selesai', selesaiCount.toString(), const Color(0xFF047857))),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Filter chips
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        _buildFilterChip('Semua', 'all'),
                        _buildFilterChip('Selesai', 'completed'),
                        _buildFilterChip('Disetujui', 'approved_wadir'),
                        _buildFilterChip('Ditolak', 'rejected'),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // List
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                          decoration: const BoxDecoration(
                            color: Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.vertical(top: Radius.circular(15)),
                            border: Border(bottom: BorderSide(color: Color(0xFFE2E8F0))),
                          ),
                          child: const Row(
                            children: [Text('Daftar Kegiatan', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold))],
                          ),
                        ),
                        if (_filtered.isEmpty)
                          const Padding(padding: EdgeInsets.all(32), child: Text('Tidak ada data.', style: TextStyle(color: Color(0xFF94A3B8))))
                        else
                          ..._filtered.map((item) => Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9)))),
                            child: Row(
                              children: [
                                const Icon(LucideIcons.fileText, size: 18, color: Color(0xFF94A3B8)),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(item.namaKegiatan, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: Color(0xFF0F172A)), maxLines: 1, overflow: TextOverflow.ellipsis),
                                      const SizedBox(height: 2),
                                      Text('${item.namaJurusan ?? '-'} · ${item.formattedDate}', style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
                                    ],
                                  ),
                                ),
                                _buildStatusChip(item.status),
                              ],
                            ),
                          )),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
    );
  }

  Widget _buildStatCard(String label, String value, Color? valueColor) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFFE2E8F0))),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 12, color: Color(0xFF64748B), fontWeight: FontWeight.w500)),
          const SizedBox(height: 6),
          Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: valueColor ?? const Color(0xFF0F172A)), maxLines: 1, overflow: TextOverflow.ellipsis),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String value) {
    final active = _filterStatus == value;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Text(label, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: active ? Colors.white : const Color(0xFF475569))),
        selected: active,
        onSelected: (_) => setState(() => _filterStatus = value),
        selectedColor: const Color(0xFF047857),
        backgroundColor: Colors.white,
        side: BorderSide(color: active ? const Color(0xFF047857) : const Color(0xFFE2E8F0)),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        showCheckmark: false,
      ),
    );
  }

  Widget _buildStatusChip(String status) {
    Color bg, fg;
    final s = status.toLowerCase();
    if (s.contains('approved') || s == 'lpj_done' || s == 'completed') {
      bg = const Color(0xFFECFDF5); fg = const Color(0xFF065F46);
    } else if (s.contains('revision') || s == 'rejected') {
      bg = const Color(0xFFFEF2F2); fg = const Color(0xFFB91C1C);
    } else {
      bg = const Color(0xFFF1F5F9); fg = const Color(0xFF475569);
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(8), border: Border.all(color: fg.withValues(alpha: 0.2))),
      child: Text(status.replaceAll('_', ' ').toUpperCase(), style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: fg)),
    );
  }
}
