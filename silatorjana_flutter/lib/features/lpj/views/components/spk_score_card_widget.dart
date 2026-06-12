import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/network/api_service.dart';

class SpkScoreCardWidget extends StatefulWidget {
  final int kegiatanId;
  const SpkScoreCardWidget({super.key, required this.kegiatanId});

  @override
  State<SpkScoreCardWidget> createState() => _SpkScoreCardWidgetState();
}

class _SpkScoreCardWidgetState extends State<SpkScoreCardWidget> {
  final ApiService _api = ApiService();
  bool _isLoading = true;
  Map<String, dynamic>? _perhitungan;
  String? _error;

  static const _kriteriaNames = {
    'c1': 'Waktu Pelaksanaan (C1)',
    'c2': 'Ketepatan Anggaran (C2)',
    'c3': 'Kesesuaian Output IKU (C3)',
    'c4': 'Waktu Approval (C4)',
  };

  static const _kriteriaIcons = {
    'c1': LucideIcons.clock,
    'c2': LucideIcons.dollarSign,
    'c3': LucideIcons.target,
    'c4': LucideIcons.timer,
  };

  @override
  void initState() {
    super.initState();
    _fetchScore();
  }

  Future<void> _fetchScore() async {
    try {
      final res = await _api.get('/spk/hitung/${widget.kegiatanId}');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        _perhitungan = data['perhitungan'];
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
      case 'A': return const Color(0xFF10B981);
      case 'B': return const Color(0xFF3B82F6);
      case 'C': return const Color(0xFFF59E0B);
      default: return const Color(0xFFEF4444);
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

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: const Center(
          child: Column(
            children: [
              CircularProgressIndicator(color: Color(0xFF047857)),
              SizedBox(height: 12),
              Text('Menghitung skor SPK MOORA...', style: TextStyle(fontSize: 13, color: Color(0xFF64748B), fontWeight: FontWeight.w500)),
            ],
          ),
        ),
      );
    }

    if (_error != null || _perhitungan == null) {
      return const SizedBox.shrink(); // Hide if error or not applicable
    }

    final grade = _perhitungan!['grade']?.toString() ?? 'D';
    final skorAkhir = double.tryParse(_perhitungan!['skor_akhir']?.toString() ?? '0') ?? 0.0;
    final skorRubrik = _perhitungan!['skor_rubrik'] as Map<String, dynamic>? ?? {};
    final detailRubrik = _perhitungan!['detail_rubrik'] as Map<String, dynamic>? ?? {};
    
    final color = _getGradeColor(grade);
    final label = _getGradeLabel(grade);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.3), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ]
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Top Accent Line
          Container(height: 5, color: color),
          
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
                      child: Icon(LucideIcons.award, color: color, size: 20),
                    ),
                    const SizedBox(width: 12),
                    const Text(
                      'Skor Kualitas LPJ (SPK MOORA)',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF0F172A)),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Gauge Donut and Grade Score row
                Row(
                  children: [
                    // Visual Badge Circle
                    Stack(
                      alignment: Alignment.center,
                      children: [
                        SizedBox(
                          width: 80,
                          height: 80,
                          child: CircularProgressIndicator(
                            value: skorAkhir.clamp(0.0, 1.0),
                            strokeWidth: 8,
                            backgroundColor: const Color(0xFFE2E8F0),
                            valueColor: AlwaysStoppedAnimation<Color>(color),
                          ),
                        ),
                        Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(grade, style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: color)),
                            Text(label, style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: color.withValues(alpha: 0.8))),
                          ],
                        )
                      ],
                    ),
                    const SizedBox(width: 20),
                    // Value details
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('SKOR AKHIR (Yi)', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8), letterSpacing: 0.5)),
                          const SizedBox(height: 2),
                          Text(
                            '${(skorAkhir * 100).toStringAsFixed(1)}%',
                            style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: color),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Dihitung menggunakan metode MOORA dengan 4 kriteria berbobot sama (25%).',
                            style: TextStyle(fontSize: 11, color: Color(0xFF64748B), height: 1.3),
                          ),
                        ],
                      ),
                    )
                  ],
                ),
                const SizedBox(height: 20),

                // Breakdown list
                const Text('BREAKDOWN KRITERIA', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8), letterSpacing: 0.5)),
                const SizedBox(height: 8),
                ...['c1', 'c2', 'c3', 'c4'].map((k) {
                  final name = _kriteriaNames[k] ?? '';
                  final icon = _kriteriaIcons[k] ?? LucideIcons.helpCircle;
                  final val = double.tryParse(skorRubrik[k]?.toString() ?? '0') ?? 0.0;
                  final detail = detailRubrik[k]?['keterangan']?.toString() ?? '';

                  return Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(icon, size: 14, color: const Color(0xFF64748B)),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(name, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF334155))),
                                  Text('${val.toInt()}', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: color)),
                                ],
                              ),
                              const SizedBox(height: 4),
                              ClipRRect(
                                borderRadius: BorderRadius.circular(3),
                                child: LinearProgressIndicator(
                                  value: val / 100,
                                  minHeight: 4,
                                  backgroundColor: const Color(0xFFF1F5F9),
                                  valueColor: AlwaysStoppedAnimation<Color>(color.withValues(alpha: 0.7)),
                                ),
                              ),
                              if (detail.isNotEmpty) ...[
                                const SizedBox(height: 2),
                                Text(detail, style: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8))),
                              ]
                            ],
                          ),
                        )
                      ],
                    ),
                  );
                }),
                const SizedBox(height: 8),

                // Show calculation details button
                OutlinedButton.icon(
                  onPressed: _showCalculationDetails,
                  icon: const Icon(LucideIcons.barChart3, size: 14),
                  label: const Text('Lihat Detail Perhitungan MOORA', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF64748B),
                    side: const BorderSide(color: Color(0xFFE2E8F0)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    minimumSize: const Size.fromHeight(40),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showCalculationDetails() {
    final decision = _perhitungan!['matriks_keputusan'] as List<dynamic>? ?? [];
    final norm = _perhitungan!['matriks_normalisasi'] as List<dynamic>? ?? [];
    final weighted = _perhitungan!['matriks_terbobot'] as List<dynamic>? ?? [];

    final rowDecision = decision.isNotEmpty ? decision[0] as List<dynamic> : [0, 0, 0, 0];
    final rowNorm = norm.isNotEmpty ? norm[0] as List<dynamic> : [0, 0, 0, 0];
    final rowWeighted = weighted.isNotEmpty ? weighted[0] as List<dynamic> : [0, 0, 0, 0];

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Row(
          children: [
            Icon(LucideIcons.barChart3, color: Color(0xFF047857)),
            SizedBox(width: 8),
            Text('Detail Perhitungan MOORA', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ],
        ),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Langkah-langkah Optimasi Multi-Objektif (Ratio System):',
                style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
              ),
              const SizedBox(height: 16),
              
              // TABLE Decision Matrix
              _buildStepTitle('Langkah 1: Matriks Keputusan (X)'),
              _buildMatrixTable(rowDecision, isInt: true),
              const SizedBox(height: 16),

              // TABLE Normalized Matrix
              _buildStepTitle('Langkah 2: Normalisasi Matriks (X*)'),
              _buildMatrixTable(rowNorm, precision: 4),
              const SizedBox(height: 16),

              // TABLE Weighted Matrix
              _buildStepTitle('Langkah 3: Matriks Terbobot (Y)'),
              _buildMatrixTable(rowWeighted, precision: 4),
              const SizedBox(height: 16),

              // Yi Score Final Calculation
              _buildStepTitle('Langkah 4: Nilai Optimasi (Yi)'),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFECFDF5),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFA7F3D0)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Yi = sum(Yij) (Benefit Kriteria)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF065F46))),
                    const SizedBox(height: 6),
                    Text(
                      'Yi = ${rowWeighted.map((v) => double.tryParse(v.toString())?.toStringAsFixed(4) ?? '0.0000').join(' + ')}',
                      style: const TextStyle(fontSize: 12, color: Color(0xFF047857), fontFamily: 'monospace'),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '= ${(double.tryParse(_perhitungan!['skor_akhir']?.toString() ?? '0') ?? 0.0).toStringAsFixed(4)}',
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF047857), fontFamily: 'monospace'),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Tutup', style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF047857))),
          )
        ],
      ),
    );
  }

  Widget _buildStepTitle(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(text, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF334155))),
    );
  }

  Widget _buildMatrixTable(List<dynamic> values, {bool isInt = false, int precision = 2}) {
    return Table(
      border: TableBorder.all(color: const Color(0xFFE2E8F0), width: 1, borderRadius: BorderRadius.circular(6)),
      columnWidths: const {
        0: FlexColumnWidth(1),
        1: FlexColumnWidth(1),
        2: FlexColumnWidth(1),
        3: FlexColumnWidth(1),
      },
      children: [
        const TableRow(
          decoration: BoxDecoration(color: Color(0xFFF8FAFC)),
          children: [
            Padding(padding: EdgeInsets.all(6), child: Text('C1', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF64748B)), textAlign: TextAlign.center)),
            Padding(padding: EdgeInsets.all(6), child: Text('C2', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF64748B)), textAlign: TextAlign.center)),
            Padding(padding: EdgeInsets.all(6), child: Text('C3', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF64748B)), textAlign: TextAlign.center)),
            Padding(padding: EdgeInsets.all(6), child: Text('C4', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF64748B)), textAlign: TextAlign.center)),
          ],
        ),
        TableRow(
          children: values.map((val) {
            final double numVal = double.tryParse(val.toString()) ?? 0.0;
            final String text = isInt ? '${numVal.toInt()}' : numVal.toStringAsFixed(precision);
            return Padding(
              padding: const EdgeInsets.all(8),
              child: Text(text, style: const TextStyle(fontSize: 11, fontFamily: 'monospace'), textAlign: TextAlign.center),
            );
          }).toList(),
        ),
      ],
    );
  }
}
