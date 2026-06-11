import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../../auth/models/user.dart';
import '../../kegiatan/viewmodels/kegiatan_viewmodel.dart';
import '../../kegiatan/views/kegiatan_detail_view.dart';
import 'lpj_verification_view.dart';
import 'components/spk_dashboard_widget.dart';

class BendaharaDashboardView extends StatefulWidget {
  final User user;
  const BendaharaDashboardView({super.key, required this.user});

  @override
  State<BendaharaDashboardView> createState() => _BendaharaDashboardViewState();
}

class _BendaharaDashboardViewState extends State<BendaharaDashboardView> {
  String _activeTab = 'pencairan';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<KegiatanViewModel>().fetchKegiatanList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: Consumer<KegiatanViewModel>(
        builder: (context, viewModel, child) {
          if (viewModel.isListLoading && viewModel.kegiatanList.isEmpty) {
            return const Center(child: CircularProgressIndicator(color: Color(0xFF047857)));
          }

          final list = viewModel.kegiatanList;
          final pencairanList = list.where((i) => ['approved_wadir', 'accepted_funds', 'disetujui_rektorat'].contains(i.status.toLowerCase())).toList();
          final lpjList = list.where((i) => ['lpj_submitted', 'lpj_revision'].contains(i.status.toLowerCase())).toList();

          final displayList = _activeTab == 'pencairan' ? pencairanList : lpjList;

          return RefreshIndicator(
            onRefresh: () => viewModel.fetchKegiatanList(),
            color: const Color(0xFF047857),
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Header
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Dashboard Bendahara',
                        style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Selamat datang, ${widget.user.nama.split(' ').first}! Kelola Pencairan Dana dan Verifikasi LPJ.',
                        style: const TextStyle(fontSize: 14, color: Color(0xFF64748B)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Cards
                  LayoutBuilder(
                    builder: (context, constraints) {
                      final isMobile = constraints.maxWidth < 600;
                      final widgets = [
                        _buildTabCard(
                          title: 'Tindakan Bendahara (Pencairan/LPJ)',
                          count: pencairanList.length.toString(),
                          icon: LucideIcons.dollarSign,
                          color: const Color(0xFF3B82F6),
                          isActive: _activeTab == 'pencairan',
                          onTap: () => setState(() => _activeTab = 'pencairan'),
                        ),
                        _buildTabCard(
                          title: 'Menunggu Pengusul (Submit LPJ)',
                          count: lpjList.length.toString(),
                          icon: LucideIcons.fileCheck,
                          color: const Color(0xFF10B981),
                          isActive: _activeTab == 'lpj',
                          onTap: () => setState(() => _activeTab = 'lpj'),
                        ),
                      ];

                      if (isMobile) {
                        return Column(
                          children: widgets.map((w) => Padding(padding: const EdgeInsets.only(bottom: 12), child: w)).toList(),
                        );
                      }
                      return Row(
                        children: widgets.map((w) => Expanded(child: Padding(padding: const EdgeInsets.only(right: 12), child: w))).toList(),
                      );
                    },
                  ),
                  const SizedBox(height: 24),

                  // SPK Widget
                  const SpkDashboardWidget(),
                  const SizedBox(height: 24),

                  // Table / List
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                      boxShadow: const [BoxShadow(color: Color(0x05000000), blurRadius: 10, offset: Offset(0, 4))],
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
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Daftar ${_activeTab == 'pencairan' ? 'Pencairan Dana' : 'Verifikasi LPJ'}',
                                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                              ),
                              Row(
                                children: [
                                  IconButton(
                                    onPressed: () {},
                                    icon: const Icon(LucideIcons.search, size: 18, color: Color(0xFF64748B)),
                                    constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                                    padding: EdgeInsets.zero,
                                  ),
                                  const SizedBox(width: 8),
                                  IconButton(
                                    onPressed: () {},
                                    icon: const Icon(LucideIcons.filter, size: 18, color: Color(0xFF64748B)),
                                    constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                                    padding: EdgeInsets.zero,
                                  ),
                                ],
                              )
                            ],
                          ),
                        ),
                        if (displayList.isEmpty)
                          const Padding(
                            padding: EdgeInsets.all(32),
                            child: Text('Tidak ada data.', style: TextStyle(color: Color(0xFF94A3B8))),
                          )
                        else
                          ...displayList.map((item) => InkWell(
                            onTap: () => _handleItemTap(item),
                            child: Container(
                              padding: const EdgeInsets.all(16),
                              decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9)))),
                              child: Row(
                                children: [
                                  Container(
                                    width: 48, height: 48,
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF8FAFC),
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(color: const Color(0xFFE2E8F0)),
                                    ),
                                    child: Center(
                                      child: Text(
                                        item.id.toString().padLeft(3, '0'),
                                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF64748B), fontFamily: 'monospace'),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 16),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(item.namaKegiatan, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: Color(0xFF0F172A)), maxLines: 1, overflow: TextOverflow.ellipsis),
                                        const SizedBox(height: 4),
                                        Text(item.formattedDate, style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 16),
                                  _buildStatusBadge(_activeTab),
                                ],
                              ),
                            ),
                          )),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildTabCard({
    required String title,
    required String count,
    required IconData icon,
    required Color color,
    required bool isActive,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isActive ? color : const Color(0xFFE2E8F0), width: isActive ? 2 : 1),
          boxShadow: isActive ? [BoxShadow(color: color.withValues(alpha: 0.2), blurRadius: 12, offset: const Offset(0, 4))] : [],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isActive ? color.withValues(alpha: 0.1) : const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: isActive ? color : const Color(0xFF94A3B8), size: 28),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(count, style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Color(0xFF1E293B), letterSpacing: -0.5)),
                  Text(title, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Color(0xFF64748B))),
                ],
              ),
            )
          ],
        ),
      ),
    );
  }

  Widget _buildStatusBadge(String tab) {
    if (tab == 'pencairan') {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: const Color(0xFFEFF6FF),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFDBEAFE)),
        ),
        child: const Text('Menunggu Tindakan', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF1D4ED8))),
      );
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF3C7),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFFDE68A)),
      ),
      child: const Text('Menunggu Pengusul', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFFB45309))),
    );
  }

  void _handleItemTap(dynamic item) {
    if (_activeTab == 'pencairan') {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => KegiatanDetailView(kegiatan: item, currentUser: widget.user)),
      ).then((_) {
        if (mounted) context.read<KegiatanViewModel>().fetchKegiatanList();
      });
    } else {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => LpjVerificationView(kegiatan: item)),
      ).then((_) {
        if (mounted) context.read<KegiatanViewModel>().fetchKegiatanList();
      });
    }
  }
}
