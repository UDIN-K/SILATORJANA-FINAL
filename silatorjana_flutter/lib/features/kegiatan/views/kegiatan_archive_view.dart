import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../models/kegiatan.dart';
import '../../../core/network/api_service.dart';
import 'kegiatan_detail_view.dart';
import '../../auth/models/user.dart';

/// Archive view — mirrors web's ArchivePage.tsx
/// Shows completed, rejected, and funds-disbursed proposals.
class KegiatanArchiveView extends StatefulWidget {
  const KegiatanArchiveView({super.key});

  @override
  State<KegiatanArchiveView> createState() => _KegiatanArchiveViewState();
}

class _KegiatanArchiveViewState extends State<KegiatanArchiveView> {
  final ApiService _apiService = ApiService();
  List<Kegiatan> _items = [];
  bool _isLoading = true;
  String _search = '';
  String _filter = 'all';

  static const _archiveStatuses = [
    'approved_ppk', 'approved_wadir', 'accepted_funds', 'funds_disbursed',
    'lpj_submitted', 'lpj_approved', 'lpj_verified', 'lpj_done',
    'selesai', 'completed', 'rejected', 'ditolak',
  ];

  @override
  void initState() {
    super.initState();
    _fetchArchive();
  }

  Future<void> _fetchArchive() async {
    setState(() => _isLoading = true);
    try {
      final response = await _apiService.get('/kegiatan');
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        List dynamicList = data['data'] ?? data;
        final all = dynamicList.map((json) => Kegiatan.fromJson(json)).toList();
        _items = all.where((k) => _archiveStatuses.contains(k.status.toLowerCase())).toList();
      }
    } catch (e) {
      // Handle error
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  List<Kegiatan> get _filtered {
    return _items.where((item) {
      final matchSearch = _search.isEmpty || item.namaKegiatan.toLowerCase().contains(_search.toLowerCase());
      bool matchFilter = true;
      if (_filter == 'completed') {
        matchFilter = ['completed', 'selesai', 'lpj_done'].contains(item.status.toLowerCase());
      } else if (_filter == 'rejected') {
        matchFilter = ['rejected', 'ditolak'].contains(item.status.toLowerCase());
      } else if (_filter == 'funds') {
        matchFilter = ['funds_disbursed', 'accepted_funds'].contains(item.status.toLowerCase());
      }
      return matchSearch && matchFilter;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final completed = _items.where((i) => ['completed', 'selesai', 'lpj_done'].contains(i.status.toLowerCase())).length;
    final rejected = _items.where((i) => ['rejected', 'ditolak'].contains(i.status.toLowerCase())).length;
    final funds = _items.where((i) => ['funds_disbursed', 'accepted_funds'].contains(i.status.toLowerCase())).length;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Row(
          children: [
            Icon(LucideIcons.archive, size: 20, color: Color(0xFF64748B)),
            SizedBox(width: 8),
            Text('Arsip Proposal'),
          ],
        ),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF0F172A),
        elevation: 1,
      ),
      body: RefreshIndicator(
        onRefresh: _fetchArchive,
        color: const Color(0xFF047857),
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: Color(0xFF047857)))
            : Column(
                children: [
                  // Stat cards row
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        _buildStatCard('Total', _items.length, const Color(0xFF64748B), const Color(0xFFF1F5F9)),
                        const SizedBox(width: 8),
                        _buildStatCard('Selesai', completed, const Color(0xFF047857), const Color(0xFFECFDF5)),
                        const SizedBox(width: 8),
                        _buildStatCard('Ditolak', rejected, const Color(0xFFDC2626), const Color(0xFFFEF2F2)),
                        const SizedBox(width: 8),
                        _buildStatCard('Dana Cair', funds, const Color(0xFF6366F1), const Color(0xFFEEF2FF)),
                      ],
                    ),
                  ),
                  // Search + filter
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: TextField(
                      onChanged: (v) => setState(() => _search = v),
                      decoration: InputDecoration(
                        hintText: 'Cari kegiatan...',
                        hintStyle: const TextStyle(fontSize: 14),
                        prefixIcon: const Icon(LucideIcons.search, size: 18),
                        filled: true,
                        fillColor: Colors.white,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: SizedBox(
                      height: 36,
                      child: ListView(
                        scrollDirection: Axis.horizontal,
                        children: [
                          _buildFilterChip('all', 'Semua'),
                          const SizedBox(width: 8),
                          _buildFilterChip('completed', 'Selesai'),
                          const SizedBox(width: 8),
                          _buildFilterChip('rejected', 'Ditolak'),
                          const SizedBox(width: 8),
                          _buildFilterChip('funds', 'Dana Cair'),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  // List
                  Expanded(
                    child: _filtered.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(LucideIcons.archive, size: 48, color: Colors.grey.shade300),
                                const SizedBox(height: 12),
                                const Text('Tidak ada arsip ditemukan', style: TextStyle(color: Color(0xFF64748B))),
                              ],
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: _filtered.length,
                            itemBuilder: (context, index) => _buildArchiveCard(_filtered[index]),
                          ),
                  ),
                ],
              ),
      ),
    );
  }

  Widget _buildStatCard(String label, int value, Color textColor, Color bgColor) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
        decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(12)),
        child: Column(
          children: [
            Text(value.toString(), style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: textColor)),
            Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: textColor.withValues(alpha: 0.7))),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(String key, String label) {
    final isActive = _filter == key;
    return GestureDetector(
      onTap: () => setState(() => _filter = key),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isActive ? const Color(0xFF047857) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isActive ? const Color(0xFF047857) : const Color(0xFFE2E8F0)),
        ),
        child: Text(label, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: isActive ? Colors.white : const Color(0xFF64748B))),
      ),
    );
  }

  Widget _buildArchiveCard(Kegiatan item) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item.namaKegiatan, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF1E293B)), maxLines: 2, overflow: TextOverflow.ellipsis),
                const SizedBox(height: 6),
                _buildStatusBadge(item.status),
                const SizedBox(height: 6),
                Row(
                  children: [
                    const Icon(LucideIcons.calendar, size: 12, color: Color(0xFF94A3B8)),
                    const SizedBox(width: 4),
                    Text(item.createdAt.length >= 10 ? item.createdAt.substring(0, 10) : item.createdAt, style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
                    if (item.namaJurusan != null) ...[
                      const SizedBox(width: 12),
                      Text(item.namaJurusan!, style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8))),
                    ],
                  ],
                ),
              ],
            ),
          ),
          OutlinedButton(
            onPressed: () {
              Navigator.push(context, MaterialPageRoute(
                builder: (_) => KegiatanDetailView(kegiatan: item, currentUser: User(id: 0, nama: '', email: '', role: '')),
              ));
            },
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFF047857),
              side: const BorderSide(color: Color(0xFFA7F3D0)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(LucideIcons.eye, size: 14),
                SizedBox(width: 4),
                Text('Detail', style: TextStyle(fontSize: 12)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color bgColor;
    Color textColor;
    switch (status.toLowerCase()) {
      case 'completed': case 'lpj_done': case 'selesai': case 'lpj_approved': case 'lpj_verified':
        bgColor = const Color(0xFFECFDF5); textColor = const Color(0xFF047857);
      case 'rejected': case 'ditolak':
        bgColor = const Color(0xFFFEE2E2); textColor = const Color(0xFFDC2626);
      case 'funds_disbursed': case 'accepted_funds':
        bgColor = const Color(0xFFEEF2FF); textColor = const Color(0xFF6366F1);
      default:
        bgColor = const Color(0xFFF1F5F9); textColor = const Color(0xFF64748B);
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(10)),
      child: Text(status.replaceAll('_', ' ').toUpperCase(), style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: textColor)),
    );
  }
}
