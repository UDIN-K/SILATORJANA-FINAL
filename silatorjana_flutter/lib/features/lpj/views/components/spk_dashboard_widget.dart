import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/network/api_service.dart';

class SpkDashboardWidget extends StatefulWidget {
  const SpkDashboardWidget({super.key});

  @override
  State<SpkDashboardWidget> createState() => _SpkDashboardWidgetState();
}

class _SpkDashboardWidgetState extends State<SpkDashboardWidget> {
  final ApiService _api = ApiService();
  bool _isLoading = true;
  String? _error;
  List<dynamic> _riwayat = [];

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    try {
      final res = await _api.get('/spk/riwayat');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        // handle both array response and paginated res.data.data
        if (data is List) {
          _riwayat = data;
        } else if (data['data'] != null) {
          _riwayat = data['data'];
        } else {
          _riwayat = [];
        }
      } else {
        _error = 'Gagal memuat SPK';
      }
    } catch (e) {
      _error = e.toString();
    }
    if (mounted) setState(() => _isLoading = false);
  }

  Color _getGradeColor(String grade) {
    switch (grade.toUpperCase()) {
      case 'A': return const Color(0xFF10B981); // emerald-500
      case 'B': return const Color(0xFF3B82F6); // blue-500
      case 'C': return const Color(0xFFF59E0B); // amber-500
      default: return const Color(0xFFEF4444);  // red-500
    }
  }

  String _getGradeLabel(String grade) {
    switch (grade.toUpperCase()) {
      case 'A': return 'SANGAT BAIK';
      case 'B': return 'BAIK';
      case 'C': return 'CUKUP';
      default: return 'KURANG';
    }
  }

  String _formatSkorToPercentage(double score) {
    return '${(score * 100).toStringAsFixed(1)}%';
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const SizedBox(
        height: 280,
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(color: Color(0xFF047857)),
              SizedBox(height: 12),
              Text('Memuat analisis kualitas...', style: TextStyle(fontSize: 13, color: Color(0xFF64748B))),
            ],
          ),
        ),
      );
    }

    if (_error != null) {
      return SizedBox(
        height: 280,
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(LucideIcons.alertCircle, size: 32, color: Color(0xFFD97706)),
              const SizedBox(height: 8),
              const Text('Gagal memuat SPK Widget', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFFD97706))),
              const SizedBox(height: 4),
              Text(_error!, style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
            ],
          ),
        ),
      );
    }

    final totalEvaluations = _riwayat.length;
    double sumSkor = 0.0;
    Map<String, int> grades = {'A': 0, 'B': 0, 'C': 0, 'D': 0};

    for (var item in _riwayat) {
      final skor = double.tryParse(item['skor_akhir']?.toString() ?? '0') ?? 0.0;
      sumSkor += skor;
      final grade = item['grade']?.toString().toUpperCase() ?? 'D';
      if (grades.containsKey(grade)) {
        grades[grade] = grades[grade]! + 1;
      }
    }

    final averageScore = totalEvaluations > 0 ? sumSkor / totalEvaluations : 0.0;

    return LayoutBuilder(
      builder: (context, constraints) {
        final isMobile = constraints.maxWidth < 768;

        final cards = [
          _buildStatistikCard(averageScore, totalEvaluations),
          _buildDistribusiCard(grades, totalEvaluations),
          _buildPenilaianTerbaruCard(),
        ];

        if (isMobile) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: cards.map((c) => Padding(padding: const EdgeInsets.only(bottom: 16), child: c)).toList(),
          );
        }

        return Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: cards.map((c) => Expanded(child: Padding(padding: const EdgeInsets.symmetric(horizontal: 8), child: c))).toList(),
        );
      },
    );
  }

  Widget _buildStatistikCard(double averageScore, int totalEvaluations) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('STATISTIK MUTU LPJ', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF64748B), letterSpacing: 0.5)),
          const SizedBox(height: 4),
          const Text('Total laporan pertanggungjawaban ter-analisis', style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
          const Spacer(),
          Row(
            children: [
              Container(
                width: 56, height: 56,
                decoration: BoxDecoration(color: const Color(0xFFECFDF5), borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xFFD1FAE5))),
                child: const Icon(LucideIcons.award, color: Color(0xFF059669), size: 32),
              ),
              const SizedBox(width: 16),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(_formatSkorToPercentage(averageScore), style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Color(0xFF1E293B), letterSpacing: -0.5)),
                  const Text('Rata-rata Skor (Yi)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: Color(0xFF64748B))),
                ],
              ),
            ],
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Container(
                width: 56, height: 56,
                decoration: BoxDecoration(color: const Color(0xFFEFF6FF), borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xFFDBEAFE))),
                child: const Icon(LucideIcons.trendingUp, color: Color(0xFF2563EB), size: 32),
              ),
              const SizedBox(width: 16),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('$totalEvaluations', style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Color(0xFF1E293B), letterSpacing: -0.5)),
                  const Text('LPJ Telah Dinilai', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: Color(0xFF64748B))),
                ],
              ),
            ],
          ),
          const Spacer(),
        ],
      ),
    );
  }

  Widget _buildDistribusiCard(Map<String, int> grades, int total) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(LucideIcons.barChart3, size: 16, color: Color(0xFF64748B)),
              SizedBox(width: 6),
              Text('DISTRIBUSI MUTU', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF64748B), letterSpacing: 0.5)),
            ],
          ),
          const SizedBox(height: 4),
          const Text('Klasifikasi nilai kualitas LPJ', style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
          const Spacer(),
          ...['A', 'B', 'C', 'D'].map((grade) {
            final count = grades[grade] ?? 0;
            final pct = total == 0 ? 0 : (count / total * 100).round();
            final color = _getGradeColor(grade);
            
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: color.withValues(alpha: 0.1),
                              border: Border.all(color: color.withValues(alpha: 0.3)),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text('Grade $grade', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: color, fontFamily: 'monospace')),
                          ),
                          const SizedBox(width: 6),
                          Text('(${_getGradeLabel(grade)})', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w500, color: Color(0xFF64748B))),
                        ],
                      ),
                      Text('$count LPJ ($pct%)', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF334155))),
                    ],
                  ),
                  const SizedBox(height: 6),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: pct / 100,
                      minHeight: 8,
                      backgroundColor: const Color(0xFFF1F5F9),
                      valueColor: AlwaysStoppedAnimation<Color>(color),
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildPenilaianTerbaruCard() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(LucideIcons.checkCircle, size: 16, color: Color(0xFF64748B)),
                    SizedBox(width: 6),
                    Text('PENILAIAN TERBARU', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF64748B), letterSpacing: 0.5)),
                  ],
                ),
                const SizedBox(height: 4),
                const Text('Daftar kualitas LPJ terbaru yang disetujui', style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
              ],
            ),
          ),
          Expanded(
            child: _riwayat.isEmpty
              ? const Center(child: Text('Belum ada data evaluasi SPK.', style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8), fontStyle: FontStyle.italic)))
              : ListView.separated(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 0),
                  itemCount: _riwayat.length > 4 ? 4 : _riwayat.length,
                  separatorBuilder: (context, index) => const Divider(height: 1, color: Color(0xFFF1F5F9)),
                  itemBuilder: (context, index) {
                    final item = _riwayat[index];
                    final skor = double.tryParse(item['skor_akhir']?.toString() ?? '0') ?? 0.0;
                    final grade = item['grade']?.toString() ?? 'D';
                    final color = _getGradeColor(grade);
                    final kegiatan = item['kegiatan'] ?? {};
                    final namaKegiatan = kegiatan['nama_kegiatan'] ?? 'Kegiatan #${item['kegiatan_id']}';
                    final pengusul = kegiatan['pengusul_nama'] ?? '-';
                    
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(namaKegiatan, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)), maxLines: 1, overflow: TextOverflow.ellipsis),
                                const SizedBox(height: 2),
                                Text('Oleh: $pengusul', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w500, color: Color(0xFF94A3B8))),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          Row(
                            children: [
                              Text(_formatSkorToPercentage(skor), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF475569))),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: color.withValues(alpha: 0.1),
                                  border: Border.all(color: color.withValues(alpha: 0.3)),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(grade, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: color, fontFamily: 'monospace')),
                              ),
                            ],
                          )
                        ],
                      ),
                    );
                  },
                ),
          ),
          const SizedBox(height: 10),
        ],
      ),
    );
  }
}
