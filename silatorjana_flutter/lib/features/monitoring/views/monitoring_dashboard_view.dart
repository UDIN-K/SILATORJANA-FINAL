import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../viewmodels/monitoring_viewmodel.dart';
import '../../kegiatan/models/kegiatan.dart';
import '../../kegiatan/views/kegiatan_detail_view.dart';
import '../../auth/models/user.dart';

/// Monitoring dashboard — mirrors the web's MonitoringPage.tsx component.
/// Shows all kegiatan with search, filter, expandable progress detail.
class MonitoringDashboardView extends StatefulWidget {
  const MonitoringDashboardView({super.key});

  @override
  State<MonitoringDashboardView> createState() => _MonitoringDashboardViewState();
}

class _MonitoringDashboardViewState extends State<MonitoringDashboardView> {
  final MonitoringViewModel _viewModel = MonitoringViewModel();
  String _search = '';
  String _statusFilter = 'all';

  static const _statusFilters = [
    {'key': 'all', 'label': 'Semua'},
    {'key': 'pending', 'label': 'Pending'},
    {'key': 'approved', 'label': 'Disetujui'},
    {'key': 'revisi', 'label': 'Revisi'},
    {'key': 'lpj', 'label': 'LPJ'},
  ];

  static const _pendingStatuses = ['submitted', 'revisi_done', 'revision_requested', 'pending_ppk', 'approved_ppk'];
  static const _approvedStatuses = ['verified', 'approved_ppk', 'approved_wadir', 'accepted_funds', 'funds_disbursed', 'lpj_verified', 'lpj_approved', 'completed', 'lpj_done'];
  static const _revisiStatuses = ['revision_requested', 'lpj_revision'];
  static const _lpjStatuses = ['lpj_submitted', 'lpj_revision', 'lpj_approved', 'lpj_verified', 'lpj_done'];

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

  List<Kegiatan> get _filteredItems {
    return _viewModel.allItems.where((item) {
      final matchSearch = _search.isEmpty ||
          item.namaKegiatan.toLowerCase().contains(_search.toLowerCase()) ||
          item.namaPengusul.toLowerCase().contains(_search.toLowerCase()) ||
          (item.namaJurusan?.toLowerCase().contains(_search.toLowerCase()) ?? false);

      bool matchStatus = true;
      if (_statusFilter == 'pending') {
        matchStatus = _pendingStatuses.contains(item.status.toLowerCase());
      } else if (_statusFilter == 'approved') {
        matchStatus = _approvedStatuses.contains(item.status.toLowerCase());
      } else if (_statusFilter == 'revisi') {
        matchStatus = _revisiStatuses.contains(item.status.toLowerCase());
      } else if (_statusFilter == 'lpj') {
        matchStatus = _lpjStatuses.contains(item.status.toLowerCase());
      }

      return matchSearch && matchStatus;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: ListenableBuilder(
        listenable: _viewModel,
        builder: (context, _) {
          if (_viewModel.isLoading && _viewModel.allItems.isEmpty) {
            return const Center(child: CircularProgressIndicator(color: Color(0xFF047857)));
          }

          if (_viewModel.errorMessage != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(LucideIcons.alertTriangle, size: 48, color: Colors.red),
                  const SizedBox(height: 16),
                  Text(_viewModel.errorMessage!, textAlign: TextAlign.center),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => _viewModel.fetchMonitoringData(),
                    child: const Text('Coba Lagi'),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () => _viewModel.fetchMonitoringData(),
            color: const Color(0xFF047857),
            child: Column(
              children: [
                // Search & Filter Bar
                _buildSearchAndFilter(),
                // Results
                Expanded(child: _buildResultsList()),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildSearchAndFilter() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
      child: Column(
        children: [
          // Search
          TextField(
            onChanged: (v) => setState(() => _search = v),
            decoration: InputDecoration(
              hintText: 'Cari kegiatan, pengusul, jurusan...',
              hintStyle: const TextStyle(fontSize: 14, color: Color(0xFF94A3B8)),
              prefixIcon: const Icon(LucideIcons.search, size: 18, color: Color(0xFF94A3B8)),
              filled: true,
              fillColor: const Color(0xFFF8FAFC),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
              ),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            ),
          ),
          const SizedBox(height: 10),
          // Filter chips
          SizedBox(
            height: 36,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: _statusFilters.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final filter = _statusFilters[index];
                final isActive = _statusFilter == filter['key'];
                return GestureDetector(
                  onTap: () => setState(() => _statusFilter = filter['key']!),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: isActive ? const Color(0xFF047857) : Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: isActive ? const Color(0xFF047857) : const Color(0xFFE2E8F0),
                      ),
                    ),
                    child: Text(
                      filter['label']!,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: isActive ? Colors.white : const Color(0xFF64748B),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildResultsList() {
    final items = _filteredItems;

    if (items.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(LucideIcons.search, size: 48, color: Colors.grey.shade300),
            const SizedBox(height: 16),
            const Text('Tidak ada data ditemukan.', style: TextStyle(color: Color(0xFF64748B))),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: items.length,
      itemBuilder: (context, index) {
        final item = items[index];
        return _buildMonitoringCard(item);
      },
    );
  }

  Widget _buildMonitoringCard(Kegiatan item) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 6, offset: const Offset(0, 2)),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => KegiatanDetailView(
                  kegiatan: item,
                  currentUser: User(id: 0, nama: '', email: '', role: ''),
                ),
              ),
            );
          },
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title + Status
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
                    const SizedBox(width: 8),
                    _buildStatusBadge(item.status),
                  ],
                ),
                const SizedBox(height: 10),
                // Meta info
                Wrap(
                  spacing: 12,
                  runSpacing: 4,
                  children: [
                    _buildMetaChip(LucideIcons.user, item.namaPengusul),
                    if (item.namaJurusan != null)
                      _buildMetaChip(LucideIcons.building2, item.namaJurusan!),
                    _buildMetaChip(LucideIcons.calendar, item.createdAt.length >= 10 ? item.createdAt.substring(0, 10) : item.createdAt),
                  ],
                ),
                const SizedBox(height: 12),
                // Progress bar
                _buildProgressBar(item.status),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMetaChip(IconData icon, String text) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 12, color: const Color(0xFF94A3B8)),
        const SizedBox(width: 4),
        Text(text, style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
      ],
    );
  }

  Widget _buildProgressBar(String status) {
    const steps = ['submitted', 'verified', 'approved_ppk', 'approved_wadir', 'funds_disbursed', 'lpj_done'];
    final currentIndex = steps.indexWhere((s) => s == status.toLowerCase());
    final progress = currentIndex >= 0 ? (currentIndex + 1) / steps.length : 0.1;

    Color progressColor = const Color(0xFF047857);
    if (status == 'rejected') progressColor = Colors.red;
    if (status == 'revision_requested') progressColor = Colors.orange;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Progress', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF94A3B8))),
            Text('${(progress * 100).round()}%', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: progressColor)),
          ],
        ),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: progress,
            backgroundColor: const Color(0xFFE2E8F0),
            color: progressColor,
            minHeight: 6,
          ),
        ),
      ],
    );
  }

  Widget _buildStatusBadge(String status) {
    Color bgColor;
    Color textColor;

    switch (status.toLowerCase()) {
      case 'submitted':
      case 'diajukan':
        bgColor = const Color(0xFFDBEAFE);
        textColor = const Color(0xFF1D4ED8);
      case 'revision_requested':
      case 'revisi':
      case 'lpj_revision':
        bgColor = const Color(0xFFFFF7ED);
        textColor = const Color(0xFFC2410C);
      case 'verified':
      case 'approved_ppk':
      case 'approved_wadir':
        bgColor = const Color(0xFFDCFCE7);
        textColor = const Color(0xFF15803D);
      case 'funds_disbursed':
      case 'accepted_funds':
        bgColor = const Color(0xFFF0FDFA);
        textColor = const Color(0xFF0F766E);
      case 'rejected':
      case 'ditolak':
        bgColor = const Color(0xFFFEE2E2);
        textColor = const Color(0xFFDC2626);
      case 'completed':
      case 'lpj_done':
      case 'selesai':
        bgColor = const Color(0xFFECFDF5);
        textColor = const Color(0xFF047857);
      default:
        bgColor = const Color(0xFFF1F5F9);
        textColor = const Color(0xFF64748B);
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        status.replaceAll('_', ' ').toUpperCase(),
        style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: textColor),
      ),
    );
  }
}
