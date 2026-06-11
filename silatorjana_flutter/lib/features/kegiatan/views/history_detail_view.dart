import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../core/network/api_service.dart';
import '../models/kegiatan.dart';

/// HistoryDetailView — mirrors web's HistoryDetailPage.tsx
/// Shows full kegiatan detail with KAK, IKU, RAB, and status timeline.
class HistoryDetailView extends StatefulWidget {
  final Kegiatan kegiatan;
  const HistoryDetailView({super.key, required this.kegiatan});

  @override
  State<HistoryDetailView> createState() => _HistoryDetailViewState();
}

class _HistoryDetailViewState extends State<HistoryDetailView> {
  final ApiService _api = ApiService();
  bool _isLoading = true;
  Map<String, dynamic>? _kak;
  List<dynamic> _ikuList = [];
  List<dynamic> _rabList = [];
  List<dynamic> _historyList = [];

  @override
  void initState() {
    super.initState();
    _fetchAll();
  }

  Future<void> _fetchAll() async {
    try {
      final futures = await Future.wait([
        _api.get('/kegiatan/${widget.kegiatan.id}/kak'),
        _api.get('/kegiatan/${widget.kegiatan.id}/iku'),
        _api.get('/kegiatan/${widget.kegiatan.id}/rab'),
        _api.get('/status-history/kegiatan/${widget.kegiatan.id}'),
      ]);

      if (futures[0].statusCode == 200) {
        final d = jsonDecode(futures[0].body);
        _kak = d is Map<String, dynamic> ? d : (d is List && d.isNotEmpty ? d[0] : null);
      }
      if (futures[1].statusCode == 200) _ikuList = jsonDecode(futures[1].body) is List ? jsonDecode(futures[1].body) : [];
      if (futures[2].statusCode == 200) _rabList = jsonDecode(futures[2].body) is List ? jsonDecode(futures[2].body) : [];
      if (futures[3].statusCode == 200) {
        final h = jsonDecode(futures[3].body);
        _historyList = h is List ? h : (h['data'] ?? []);
      }
    } catch (e) {
      debugPrint('HistoryDetail ERROR: $e');
    }
    if (mounted) setState(() => _isLoading = false);
  }

  num get _rabTotal => _rabList.fold<num>(0, (sum, r) => sum + (num.tryParse(r['total']?.toString() ?? '0') ?? 0));

  String _fmtCurrency(num amount) {
    final str = amount.toInt().toString();
    final buf = StringBuffer();
    for (int i = 0; i < str.length; i++) {
      if (i > 0 && (str.length - i) % 3 == 0) buf.write('.');
      buf.write(str[i]);
    }
    return 'Rp $buf';
  }

  String _fmtDate(String? iso) {
    if (iso == null || iso.length < 10) return '-';
    final p = iso.substring(0, 10).split('-');
    if (p.length == 3) return '${p[2]}/${p[1]}/${p[0]}';
    return iso;
  }

  @override
  Widget build(BuildContext context) {
    final k = widget.kegiatan;
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(k.namaKegiatan, maxLines: 1, overflow: TextOverflow.ellipsis),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF0F172A),
        elevation: 1,
      ),
      body: _isLoading
        ? const Center(child: CircularProgressIndicator(color: Color(0xFF047857)))
        : SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Header with status
                Row(
                  children: [
                    Expanded(
                      child: Text(k.namaKegiatan, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                    ),
                    _buildStatusChip(k.status),
                  ],
                ),
                const SizedBox(height: 20),

                // Info & Anggaran cards
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(child: _buildInfoCard(k)),
                    const SizedBox(width: 12),
                    Expanded(child: _buildAnggaranCard()),
                  ],
                ),
                const SizedBox(height: 16),

                // KAK
                if (_kak != null) _buildKakCard(),
                const SizedBox(height: 16),

                // Catatan Revisi
                if (k.catatanRevisi != null && k.catatanRevisi!.isNotEmpty) ...[
                  _buildRevisiCard(k.catatanRevisi!),
                  const SizedBox(height: 16),
                ],

                // IKU
                if (_ikuList.isNotEmpty) ...[
                  _buildIkuCard(),
                  const SizedBox(height: 16),
                ],

                // RAB
                if (_rabList.isNotEmpty) ...[
                  _buildRabCard(),
                  const SizedBox(height: 16),
                ],

                // Timeline
                _buildTimelineCard(),
              ],
            ),
          ),
    );
  }

  Widget _buildInfoCard(Kegiatan k) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFFE2E8F0))),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(children: [Icon(LucideIcons.fileText, size: 16, color: Color(0xFF047857)), SizedBox(width: 6), Text('Info Kegiatan', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14))]),
          const SizedBox(height: 12),
          _infoRow('Jenis', k.jenisKegiatan ?? '-'),
          _infoRow('Jurusan', k.namaJurusan ?? '-'),
          _infoRow('Pengusul', k.namaPengusul),
          _infoRow('Tanggal', k.formattedDate),
          if (k.kodeMak != null) _infoRow('Kode MAK', k.kodeMak!),
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
          Flexible(child: Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600), textAlign: TextAlign.end)),
        ],
      ),
    );
  }

  Widget _buildAnggaranCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFFE2E8F0))),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(children: [Icon(LucideIcons.dollarSign, size: 16, color: Color(0xFF047857)), SizedBox(width: 6), Text('Anggaran', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14))]),
          const SizedBox(height: 12),
          Text(_fmtCurrency(_rabTotal), style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Color(0xFF047857))),
          Text('${_rabList.length} item RAB', style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
        ],
      ),
    );
  }

  Widget _buildKakCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFFE2E8F0))),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Kerangka Acuan Kerja (KAK)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
          const SizedBox(height: 12),
          _kakField('Gambaran Umum', _kak?['gambaran_umum']),
          _kakField('Penerima Manfaat', _kak?['penerima_manfaat']),
          _kakField('Strategi Pencapaian', _kak?['strategi_pencapaian']),
          _kakField('Metode Pelaksanaan', _kak?['metode_pelaksanaan']),
          _kakField('Tahapan Pelaksanaan', _kak?['tahapan_pelaksanaan']),
          if (_kak?['kurun_waktu_mulai'] != null)
            _kakField('Kurun Waktu', '${_fmtDate(_kak?['kurun_waktu_mulai'])} s.d. ${_fmtDate(_kak?['kurun_waktu_selesai'])}'),
        ],
      ),
    );
  }

  Widget _kakField(String label, dynamic value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 12, color: Color(0xFF64748B), fontWeight: FontWeight.w500)),
          const SizedBox(height: 4),
          Text(value?.toString() ?? '-', style: const TextStyle(fontSize: 13, color: Color(0xFF334155), fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  Widget _buildRevisiCard(String catatan) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: const Color(0xFFFFF7ED), borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFFFED7AA))),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(children: [Icon(LucideIcons.alertTriangle, size: 16, color: Color(0xFFC2410C)), SizedBox(width: 6), Text('Catatan Revisi', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF9A3412)))]),
          const SizedBox(height: 8),
          Text(catatan, style: const TextStyle(fontSize: 13, color: Color(0xFF9A3412), fontStyle: FontStyle.italic)),
        ],
      ),
    );
  }

  Widget _buildIkuCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFFE2E8F0))),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Indikator Kinerja Utama (IKU)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
          const SizedBox(height: 12),
          ..._ikuList.map((iku) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(child: Text(iku['nama_iku']?.toString() ?? iku['indikator']?.toString() ?? '-', style: const TextStyle(fontSize: 13))),
                Text(iku['target_persen'] != null ? '${iku['target_persen']}%' : '-', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF047857))),
              ],
            ),
          )),
        ],
      ),
    );
  }

  Widget _buildRabCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFFE2E8F0))),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Rincian Anggaran Biaya (RAB)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
          const SizedBox(height: 12),
          ..._rabList.asMap().entries.map((e) {
            final i = e.key;
            final r = e.value;
            return Container(
              padding: const EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(border: Border(bottom: BorderSide(color: const Color(0xFFF1F5F9)))),
              child: Row(
                children: [
                  SizedBox(width: 24, child: Text('${i + 1}', style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)))),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(r['uraian']?.toString() ?? '-', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                        Text(r['kategori']?.toString() ?? '-', style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
                      ],
                    ),
                  ),
                  Text(_fmtCurrency(num.tryParse(r['total']?.toString() ?? '0') ?? 0), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                ],
              ),
            );
          }),
          const Divider(thickness: 2),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Total Anggaran', style: TextStyle(fontWeight: FontWeight.bold)),
              Text(_fmtCurrency(_rabTotal), style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF047857), fontSize: 15)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTimelineCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFFE2E8F0))),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('⌛ Timeline & Riwayat Persetujuan', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
          const SizedBox(height: 16),
          if (_historyList.isEmpty)
            const Text('Belum ada riwayat perubahan status.', style: TextStyle(fontSize: 13, color: Color(0xFF94A3B8)))
          else
            ..._historyList.asMap().entries.map((e) {
              final hist = e.value;
              return Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Column(
                      children: [
                        Container(
                          width: 12, height: 12,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: const Color(0xFF10B981),
                            border: Border.all(color: Colors.white, width: 2),
                            boxShadow: [BoxShadow(color: const Color(0xFF10B981).withValues(alpha: 0.3), blurRadius: 4)],
                          ),
                        ),
                        if (e.key < _historyList.length - 1)
                          Container(width: 2, height: 40, color: const Color(0xFFE2E8F0)),
                      ],
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(hist['user_nama']?.toString() ?? '-', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(8)),
                                child: Text(hist['user_role']?.toString() ?? '', style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF64748B))),
                              ),
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text('→ ${hist['status_baru']?.toString() ?? ''}', style: const TextStyle(fontSize: 12, color: Color(0xFF047857), fontWeight: FontWeight.w600)),
                          if (hist['catatan'] != null)
                            Container(
                              margin: const EdgeInsets.only(top: 4),
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(8)),
                              child: Text(hist['catatan'].toString(), style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                            ),
                          Text(_fmtDate(hist['created_at']?.toString()), style: const TextStyle(fontSize: 11, color: Color(0xFFCBD5E1))),
                        ],
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

  Widget _buildStatusChip(String status) {
    Color bg, fg;
    final s = status.toLowerCase();
    if (s.contains('approved') || s == 'lpj_done' || s == 'completed') { bg = const Color(0xFFECFDF5); fg = const Color(0xFF065F46); }
    else if (s.contains('revision')) { bg = const Color(0xFFFFF7ED); fg = const Color(0xFFC2410C); }
    else if (s == 'rejected') { bg = const Color(0xFFFEF2F2); fg = const Color(0xFFB91C1C); }
    else { bg = const Color(0xFFF1F5F9); fg = const Color(0xFF475569); }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(10), border: Border.all(color: fg.withValues(alpha: 0.2))),
      child: Text(status.replaceAll('_', ' ').toUpperCase(), style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: fg)),
    );
  }
}
