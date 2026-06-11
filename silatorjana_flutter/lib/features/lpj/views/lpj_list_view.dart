import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../viewmodels/lpj_viewmodel.dart';
import '../../kegiatan/models/kegiatan.dart';
import 'lpj_upload_view.dart';
import 'lpj_verification_view.dart';
import 'pencairan_view.dart';

/// LPJ List view — shows all kegiatan in LPJ/pencairan workflow.
/// Mirrors web's BendaharaProposalList.tsx + LpjPage.tsx
class LpjListView extends StatefulWidget {
  const LpjListView({super.key});

  @override
  State<LpjListView> createState() => _LpjListViewState();
}

class _LpjListViewState extends State<LpjListView> {
  final LpjViewModel _viewModel = LpjViewModel();

  @override
  void initState() {
    super.initState();
    _viewModel.fetchLpjList();
  }

  @override
  void dispose() {
    _viewModel.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: MediaQuery.of(context).size.width >= 768
          ? null
          : AppBar(
              title: const Text('Pencairan & LPJ'),
              backgroundColor: Colors.white,
              foregroundColor: const Color(0xFF0F172A),
              elevation: 1,
              actions: [
                IconButton(
                  icon: const Icon(LucideIcons.refreshCw, size: 20),
                  onPressed: () => _viewModel.fetchLpjList(),
                ),
              ],
            ),
      body: ListenableBuilder(
        listenable: _viewModel,
        builder: (context, _) {
          if (_viewModel.isLoading) {
            return const Center(child: CircularProgressIndicator(color: Color(0xFF047857)));
          }

          if (_viewModel.errorMessage != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(LucideIcons.alertTriangle, size: 48, color: Colors.red),
                  const SizedBox(height: 12),
                  Text(_viewModel.errorMessage!),
                  const SizedBox(height: 12),
                  ElevatedButton(onPressed: () => _viewModel.fetchLpjList(), child: const Text('Coba Lagi')),
                ],
              ),
            );
          }

          if (_viewModel.lpjList.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(LucideIcons.dollarSign, size: 48, color: Colors.grey.shade300),
                  const SizedBox(height: 12),
                  const Text('Belum ada data pencairan/LPJ.', style: TextStyle(color: Color(0xFF64748B))),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () => _viewModel.fetchLpjList(),
            color: const Color(0xFF047857),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _viewModel.lpjList.length,
              itemBuilder: (context, index) => _buildLpjCard(_viewModel.lpjList[index]),
            ),
          );
        },
      ),
    );
  }

  Widget _buildLpjCard(Kegiatan item) {
    final statusLabel = _getStatusLabel(item.status);
    final statusColor = _getStatusColor(item.status);
    final actionLabel = _getActionLabel(item.status);

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
                child: Text(item.namaKegiatan, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF1E293B)), maxLines: 2, overflow: TextOverflow.ellipsis),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(color: statusColor.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
                child: Text(statusLabel, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: statusColor)),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(LucideIcons.user, size: 12, color: Color(0xFF94A3B8)),
              const SizedBox(width: 4),
              Text(item.namaPengusul, style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
              if (item.totalAnggaran != null) ...[
                const Spacer(),
                Text('Rp ${item.totalAnggaran}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF047857))),
              ],
            ],
          ),
          const SizedBox(height: 12),
          if (actionLabel != null)
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => _navigateToAction(item),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF047857),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                child: Text(actionLabel, style: const TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
        ],
      ),
    );
  }

  void _navigateToAction(Kegiatan item) {
    final s = item.status.toLowerCase();
    Widget? page;

    if (s == 'approved_wadir' || s == 'accepted_funds') {
      page = PencairanView(kegiatan: item);
    } else if (s == 'funds_disbursed') {
      page = LpjUploadView(kegiatan: item);
    } else if (s == 'lpj_submitted') {
      page = LpjVerificationView(kegiatan: item);
    }

    if (page != null) {
      Navigator.push(context, MaterialPageRoute(builder: (_) => page!)).then((result) {
        if (result == true) _viewModel.fetchLpjList();
      });
    }
  }

  String _getStatusLabel(String status) {
    switch (status.toLowerCase()) {
      case 'approved_wadir': return 'SIAP CAIR';
      case 'accepted_funds': return 'UANG MUKA';
      case 'funds_disbursed': return 'DANA CAIR';
      case 'lpj_submitted': return 'LPJ MASUK';
      case 'lpj_revision': return 'LPJ REVISI';
      case 'lpj_approved': case 'lpj_verified': return 'LPJ OK';
      case 'lpj_done': return 'SELESAI';
      default: return status.replaceAll('_', ' ').toUpperCase();
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'approved_wadir': return const Color(0xFF047857);
      case 'funds_disbursed': return const Color(0xFF0891B2);
      case 'lpj_submitted': return const Color(0xFF3B82F6);
      case 'lpj_revision': return const Color(0xFFF97316);
      case 'lpj_done': case 'lpj_approved': return const Color(0xFF047857);
      default: return const Color(0xFF64748B);
    }
  }

  String? _getActionLabel(String status) {
    switch (status.toLowerCase()) {
      case 'approved_wadir': case 'accepted_funds': return 'Cairkan Dana';
      case 'funds_disbursed': return 'Upload LPJ';
      case 'lpj_submitted': return 'Verifikasi LPJ';
      default: return null;
    }
  }
}
