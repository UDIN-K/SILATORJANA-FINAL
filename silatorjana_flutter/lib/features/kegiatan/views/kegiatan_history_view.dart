import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../models/kegiatan.dart';
import '../../../core/network/api_service.dart';
import 'history_detail_view.dart';

/// History view — mirrors web's HistoryPage.tsx
/// Shows completed/finished kegiatan for the pengusul.
class KegiatanHistoryView extends StatefulWidget {
  const KegiatanHistoryView({super.key});

  @override
  State<KegiatanHistoryView> createState() => _KegiatanHistoryViewState();
}

class _KegiatanHistoryViewState extends State<KegiatanHistoryView> {
  final ApiService _apiService = ApiService();
  List<Kegiatan> _items = [];
  bool _isLoading = true;
  String _search = '';

  static const _historyStatuses = ['completed', 'selesai', 'lpj_done', 'lpj_approved', 'lpj_verified', 'rejected', 'ditolak'];

  @override
  void initState() {
    super.initState();
    _fetchHistory();
  }

  Future<void> _fetchHistory() async {
    setState(() => _isLoading = true);
    try {
      final response = await _apiService.get('/kegiatan');
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        List dynamicList = data['data'] ?? data;
        final all = dynamicList.map((json) => Kegiatan.fromJson(json)).toList();
        _items = all.where((k) => _historyStatuses.contains(k.status.toLowerCase())).toList();
      }
    } catch (e) {
      // Handle error
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  List<Kegiatan> get _filtered {
    if (_search.isEmpty) return _items;
    return _items.where((i) => i.namaKegiatan.toLowerCase().contains(_search.toLowerCase())).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: RefreshIndicator(
        onRefresh: _fetchHistory,
        color: const Color(0xFF047857),
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: Color(0xFF047857)))
            : Column(
                children: [
                  // Search
                  Padding(
                    padding: const EdgeInsets.all(16),
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
                  // List
                  Expanded(
                    child: _filtered.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(LucideIcons.clock, size: 48, color: Colors.grey.shade300),
                                const SizedBox(height: 12),
                                const Text('Belum ada riwayat kegiatan.', style: TextStyle(color: Color(0xFF64748B))),
                              ],
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            itemCount: _filtered.length,
                            itemBuilder: (context, index) => _buildHistoryCard(_filtered[index]),
                          ),
                  ),
                ],
              ),
      ),
    );
  }

  Widget _buildHistoryCard(Kegiatan item) {
    final isCompleted = ['completed', 'selesai', 'lpj_done'].contains(item.status.toLowerCase());

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
              Expanded(
                child: Text(
                  item.namaKegiatan,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF1E293B)),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: isCompleted ? const Color(0xFFECFDF5) : const Color(0xFFFEE2E2),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  item.status.replaceAll('_', ' ').toUpperCase(),
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: isCompleted ? const Color(0xFF047857) : const Color(0xFFDC2626),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              const Icon(LucideIcons.calendar, size: 12, color: Color(0xFF94A3B8)),
              const SizedBox(width: 4),
              Text(item.createdAt.length >= 10 ? item.createdAt.substring(0, 10) : item.createdAt, style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
              if (item.namaJurusan != null) ...[
                const SizedBox(width: 12),
                const Icon(LucideIcons.building2, size: 12, color: Color(0xFF94A3B8)),
                const SizedBox(width: 4),
                Flexible(child: Text(item.namaJurusan!, style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)), overflow: TextOverflow.ellipsis)),
              ],
              if (item.totalAnggaran != null) ...[
                const SizedBox(width: 12),
                Text('Rp ${item.totalAnggaran}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF64748B))),
              ],
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () {
                Navigator.push(context, MaterialPageRoute(
                  builder: (_) => HistoryDetailView(kegiatan: item),
                ));
              },
              icon: const Icon(LucideIcons.eye, size: 16),
              label: const Text('Lihat Detail'),
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFF047857),
                side: const BorderSide(color: Color(0xFFA7F3D0)),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                padding: const EdgeInsets.symmetric(vertical: 10),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
