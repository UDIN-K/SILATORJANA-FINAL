import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../core/network/api_service.dart';

/// Timeline view — mirrors web's RektoratTimelinePage.tsx
/// Shows status history of a specific kegiatan as a visual timeline.
class TimelineView extends StatefulWidget {
  final int kegiatanId;
  final String title;
  const TimelineView({super.key, required this.kegiatanId, this.title = 'Timeline Proposal'});

  @override
  State<TimelineView> createState() => _TimelineViewState();
}

class _TimelineViewState extends State<TimelineView> {
  final ApiService _apiService = ApiService();
  List<Map<String, dynamic>> _history = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchTimeline();
  }

  Future<void> _fetchTimeline() async {
    setState(() => _isLoading = true);
    try {
      final response = await _apiService.get('/status-history/kegiatan/${widget.kegiatanId}');
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _history = List<Map<String, dynamic>>.from(data);
      }
    } catch (e) {
      // Handle error silently
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(widget.title),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF0F172A),
        elevation: 1,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF047857)))
          : _history.isEmpty
              ? const Center(child: Text('Belum ada riwayat status.'))
              : RefreshIndicator(
                  onRefresh: _fetchTimeline,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(20),
                    itemCount: _history.length,
                    itemBuilder: (context, index) {
                      final item = _history[index];
                      final isLast = index == _history.length - 1;
                      return _buildTimelineItem(item, isLast, index);
                    },
                  ),
                ),
    );
  }

  Widget _buildTimelineItem(Map<String, dynamic> item, bool isLast, int index) {
    final statusBaru = item['status_baru'] ?? '';
    final statusLama = item['status_lama'] ?? '';
    final catatan = item['catatan'] ?? '';
    final userNama = item['user_nama'] ?? 'System';
    final userRole = item['user_role'] ?? '';
    final createdAt = item['created_at'] ?? '';

    final color = _getStatusColor(statusBaru);

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Timeline indicator
          SizedBox(
            width: 40,
            child: Column(
              children: [
                Container(
                  width: 16,
                  height: 16,
                  decoration: BoxDecoration(
                    color: color,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                    boxShadow: [BoxShadow(color: color.withValues(alpha: 0.3), blurRadius: 4)],
                  ),
                ),
                if (!isLast)
                  Expanded(
                    child: Container(width: 2, color: const Color(0xFFE2E8F0)),
                  ),
              ],
            ),
          ),
          // Content
          Expanded(
            child: Container(
              margin: const EdgeInsets.only(bottom: 20),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      statusBaru.replaceAll('_', ' ').toUpperCase(),
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: color),
                    ),
                  ),
                  if (statusLama.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(
                      'Dari: ${statusLama.replaceAll('_', ' ')}',
                      style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                    ),
                  ],
                  if (catatan.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(catatan, style: const TextStyle(fontSize: 13, color: Color(0xFF475569))),
                  ],
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(LucideIcons.user, size: 12, color: Color(0xFF94A3B8)),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          '$userNama ($userRole)', 
                          style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Icon(LucideIcons.clock, size: 12, color: Color(0xFF94A3B8)),
                      const SizedBox(width: 4),
                      Text(
                        createdAt.length >= 16 ? createdAt.substring(0, 16).replaceAll('T', ' ') : createdAt,
                        style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'submitted': return const Color(0xFF3B82F6);
      case 'verified': return const Color(0xFF8B5CF6);
      case 'approved_ppk': return const Color(0xFFF59E0B);
      case 'approved_wadir': return const Color(0xFF10B981);
      case 'funds_disbursed': return const Color(0xFF0891B2);
      case 'lpj_done': case 'completed': return const Color(0xFF047857);
      case 'revision_requested': return const Color(0xFFF97316);
      case 'rejected': return const Color(0xFFDC2626);
      default: return const Color(0xFF64748B);
    }
  }
}
