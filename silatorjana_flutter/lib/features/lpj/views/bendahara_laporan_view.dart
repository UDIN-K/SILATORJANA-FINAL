import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../core/network/api_service.dart';
import '../../kegiatan/models/kegiatan.dart';

/// Bendahara Laporan LPJ — mirrors web's BendaharaLaporanPage.tsx
class BendaharaLaporanView extends StatefulWidget {
  const BendaharaLaporanView({super.key});

  @override
  State<BendaharaLaporanView> createState() => _BendaharaLaporanViewState();
}

class _BendaharaLaporanViewState extends State<BendaharaLaporanView> {
  final ApiService _api = ApiService();
  List<Kegiatan> _laporan = [];
  bool _isLoading = true;

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
        final all = items.map((j) => Kegiatan.fromJson(j)).toList();
        _laporan = all.where((k) =>
          ['lpj_submitted', 'lpj_revision', 'lpj_approved', 'lpj_done', 'completed'].contains(k.status.toLowerCase())
        ).toList();
      }
    } catch (e) {
      debugPrint('LaporanLPJ ERROR: $e');
    }
    setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    final menungguReview = _laporan.where((k) => ['lpj_submitted', 'lpj_revision'].contains(k.status.toLowerCase())).length;
    final selesai = _laporan.where((k) => ['lpj_done', 'completed'].contains(k.status.toLowerCase())).length;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: _isLoading
        ? const Center(child: CircularProgressIndicator(color: Color(0xFF047857)))
        : RefreshIndicator(
            onRefresh: _fetchData,
            child: LayoutBuilder(
              builder: (context, viewportConstraints) {
                return SingleChildScrollView(
                  physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
                  padding: const EdgeInsets.all(16),
                  child: ConstrainedBox(
                    constraints: BoxConstraints(
                      minHeight: viewportConstraints.maxHeight,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                  // Header
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(color: const Color(0xFFD1FAE5), borderRadius: BorderRadius.circular(12)),
                        child: const Icon(LucideIcons.checkCircle, color: Color(0xFF047857), size: 24),
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Rekap Laporan LPJ', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                            Text('Daftar usulan yang masuk tahap pelaporan', style: TextStyle(fontSize: 13, color: Color(0xFF64748B))),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Stat cards (3 columns)
                  Row(
                    children: [
                      Expanded(child: _buildMiniStat('Total LPJ', _laporan.length.toString(), LucideIcons.fileText, const Color(0xFF2563EB), const Color(0xFFDBEAFE))),
                      const SizedBox(width: 10),
                      Expanded(child: _buildMiniStat('Menunggu', menungguReview.toString(), LucideIcons.clock, const Color(0xFFD97706), const Color(0xFFFEF3C7))),
                      const SizedBox(width: 10),
                      Expanded(child: _buildMiniStat('Selesai', selesai.toString(), LucideIcons.checkCircle, const Color(0xFF047857), const Color(0xFFD1FAE5))),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Table
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
                            children: [
                              Text('Daftar Rekapitulasi', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                        if (_laporan.isEmpty)
                          const Padding(padding: EdgeInsets.all(32), child: Text('Belum ada data laporan LPJ.', style: TextStyle(color: Color(0xFF94A3B8))))
                        else
                          ..._laporan.map((item) => Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9)))),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(item.namaKegiatan, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: Color(0xFF0F172A)), maxLines: 1, overflow: TextOverflow.ellipsis),
                                      const SizedBox(height: 4),
                                      Text('${item.namaPengusul} · ${item.formattedAnggaran}', style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
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
                );
              },
            ),
          ),
    );
  }

  Widget _buildMiniStat(String label, String value, IconData icon, Color color, Color bgColor) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFFE2E8F0))),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(10)),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(height: 10),
          Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: color)),
          Text(label, style: const TextStyle(fontSize: 11, color: Color(0xFF64748B), fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  Widget _buildStatusChip(String status) {
    Color bg, fg;
    final s = status.toLowerCase();
    if (s.contains('approved') || s == 'lpj_done' || s == 'completed') {
      bg = const Color(0xFFECFDF5); fg = const Color(0xFF065F46);
    } else if (s.contains('revision')) {
      bg = const Color(0xFFFFF7ED); fg = const Color(0xFFC2410C);
    } else {
      bg = const Color(0xFFDBEAFE); fg = const Color(0xFF1E40AF);
    }
    String label = status.replaceAll('_', ' ').toUpperCase();
    if (s == 'lpj_submitted') label = 'LPJ DISUBMIT';
    else if (s == 'lpj_revision') label = 'PERLU REVISI';
    else if (s == 'lpj_approved') label = 'DISETUJUI';
    else if (s == 'lpj_done' || s == 'completed') label = 'SELESAI';
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(8), border: Border.all(color: fg.withValues(alpha: 0.2))),
      child: Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: fg)),
    );
  }
}
