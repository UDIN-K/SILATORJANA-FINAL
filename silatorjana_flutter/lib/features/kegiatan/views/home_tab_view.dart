import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../../auth/models/user.dart';
import '../viewmodels/kegiatan_viewmodel.dart';
import '../models/kegiatan.dart';
import 'kegiatan_detail_view.dart';
import 'edit_kegiatan_view.dart';
import 'create_kegiatan_view.dart';

class HomeTabView extends StatefulWidget {
  final User user;
  const HomeTabView({super.key, required this.user});

  @override
  State<HomeTabView> createState() => _HomeTabViewState();
}

class _HomeTabViewState extends State<HomeTabView> {
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

          final list = viewModel.kegiatanList.where((item) {
            if (widget.user.role == 'verifikator') {
              return item.verifikatorTarget == null || item.verifikatorTarget == widget.user.wadirTarget;
            } else if (widget.user.role.startsWith('wadir')) {
              if (widget.user.wadirTarget == 'wadir2' && item.verifikatorTarget == null) return true;
              return item.verifikatorTarget == widget.user.wadirTarget;
            }
            return true;
          }).toList();

          // Calculate stats (mirroring web logic)
          int total = list.length;
          int menunggu = 0;
          int berjalan = 0;
          int selesai = 0;

          for (var doc in list) {
            final s = doc.status.toLowerCase();
            if (s == 'selesai' || s == 'completed' || s == 'lpj_done' || s == 'lpj_approved') {
              selesai++;
            } else if (s.startsWith('menunggu') || s.startsWith('disetujui') ||
                ['pending_ppk', 'approved_ppk', 'approved_wadir', 'accepted_funds', 'funds_disbursed'].contains(s)) {
              berjalan++;
            } else if (['draft', 'diajukan', 'revisi', 'submitted', 'revisi_done', 'diverifikasi', 'verified', 'revision_requested'].contains(s)) {
              menunggu++;
            }
          }

          // Filter alerts per role (mirroring web)
          final role = widget.user.role;
          final revisiItems = list.where((i) => i.status.toLowerCase() == 'revision_requested').toList();
          final needLpjItems = list.where((i) => ['accepted_funds', 'funds_disbursed', 'lpj_revision'].contains(i.status.toLowerCase())).toList();
          final verifiedItems = list.where((i) => ['verified', 'diverifikasi'].contains(i.status.toLowerCase())).toList();
          final menungguVerifikasiItems = list.where((i) => ['submitted', 'revisi_done'].contains(i.status.toLowerCase())).toList();
          final menungguPpkItems = list.where((i) => ['pending_ppk', 'verified'].contains(i.status.toLowerCase())).toList();
          final menungguWadirItems = list.where((i) => i.status.toLowerCase() == 'approved_ppk').toList();
          final menungguBendaharaItems = list.where((i) => ['approved_wadir', 'accepted_funds', 'funds_disbursed', 'lpj_submitted'].contains(i.status.toLowerCase())).toList();
          final recentActivity = list.take(5).toList();

          return RefreshIndicator(
            onRefresh: () => viewModel.fetchKegiatanList(),
            color: const Color(0xFF047857),
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Header with title + "Buat Usulan" button
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Dashboard ${_getRoleLabel(widget.user.role)}',
                              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Selamat datang, ${widget.user.nama.split(' ').first}!',
                              style: const TextStyle(fontSize: 14, color: Color(0xFF64748B)),
                            ),
                          ],
                        ),
                      ),
                      if (widget.user.role == 'pengusul')
                        FilledButton.icon(
                          onPressed: () {
                            Navigator.push(context, MaterialPageRoute(builder: (_) => const CreateKegiatanView()))
                                .then((result) {
                              if (result == true) viewModel.fetchKegiatanList();
                            });
                          },
                          icon: const Icon(LucideIcons.plus, size: 18),
                          label: const Text('Buat Usulan', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                          style: FilledButton.styleFrom(
                            backgroundColor: const Color(0xFF047857),
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Stat Cards (2x2 grid)
                  GridView.count(
                    crossAxisCount: 2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    childAspectRatio: 1.8,
                    children: [
                      _buildStatCard('Total', total.toString(), LucideIcons.package, const Color(0xFF10B981)),
                      _buildStatCard('Verifikasi', menunggu.toString(), LucideIcons.clock, const Color(0xFFF59E0B)),
                      _buildStatCard('Berjalan', berjalan.toString(), LucideIcons.shieldCheck, const Color(0xFF6366F1)),
                      _buildStatCard('Selesai', selesai.toString(), LucideIcons.checkCircle, const Color(0xFF10B981)),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // ALERT CARDS - Role specific (mirroring web)
                  if (role == 'pengusul') ...[
                    // Pengusul: Perlu Revisi
                    if (revisiItems.isNotEmpty) ...[
                      _buildAlertCard(
                        title: 'Usulan Perlu Direvisi (${revisiItems.length})',
                        icon: LucideIcons.alertTriangle,
                        borderColor: const Color(0xFFFECDD3),
                        bgColor: const Color(0xFFFFF1F2),
                        headerBgColor: const Color(0xFFFFE4E6),
                        titleColor: const Color(0xFF9F1239),
                        items: revisiItems,
                        actionLabel: 'Perbaiki',
                        actionColor: const Color(0xFFE11D48),
                        onAction: (item) {
                          Navigator.push(context, MaterialPageRoute(builder: (_) => EditKegiatanView(kegiatanId: item.id)));
                        },
                      ),
                      const SizedBox(height: 16),
                    ],
                    // Pengusul: Perlu Upload LPJ
                    if (needLpjItems.isNotEmpty) ...[
                      _buildAlertCard(
                        title: 'Perlu Upload LPJ (${needLpjItems.length})',
                        icon: LucideIcons.fileText,
                        borderColor: const Color(0xFFBFDBFE),
                        bgColor: const Color(0xFFEFF6FF),
                        headerBgColor: const Color(0xFFDBEAFE),
                        titleColor: const Color(0xFF1E40AF),
                        items: needLpjItems,
                        actionLabel: 'Upload',
                        actionColor: const Color(0xFF2563EB),
                        subtitle: 'Telah disetujui Wadir. Silakan unggah LPJ.',
                        onAction: (item) {
                          Navigator.push(context, MaterialPageRoute(
                            builder: (_) => KegiatanDetailView(kegiatan: item, currentUser: widget.user),
                          ));
                        },
                      ),
                      const SizedBox(height: 16),
                    ],
                  ] else if (role == 'verifikator') ...[
                    // Verifikator: Menunggu Verifikasi
                    if (menungguVerifikasiItems.isNotEmpty) ...[
                      _buildAlertCard(
                        title: 'Menunggu Verifikasi (${menungguVerifikasiItems.length})',
                        icon: LucideIcons.clipboardList,
                        borderColor: const Color(0xFFBFDBFE),
                        bgColor: const Color(0xFFEFF6FF),
                        headerBgColor: const Color(0xFFDBEAFE),
                        titleColor: const Color(0xFF1E40AF),
                        items: menungguVerifikasiItems,
                        actionLabel: 'Verifikasi',
                        actionColor: const Color(0xFF2563EB),
                        onAction: (item) {
                          Navigator.push(context, MaterialPageRoute(
                            builder: (_) => KegiatanDetailView(kegiatan: item, currentUser: widget.user),
                          ));
                        },
                      ),
                      const SizedBox(height: 16),
                    ],
                    // Verifikator: Telah Diverifikasi
                    if (verifiedItems.isNotEmpty) ...[
                      _buildAlertCard(
                        title: 'Telah Diverifikasi (${verifiedItems.length})',
                        icon: LucideIcons.checkCircle2,
                        borderColor: const Color(0xFFA7F3D0),
                        bgColor: const Color(0xFFECFDF5),
                        headerBgColor: const Color(0xFFD1FAE5),
                        titleColor: const Color(0xFF065F46),
                        items: verifiedItems,
                        actionLabel: 'Lihat',
                        actionColor: const Color(0xFF047857),
                        isOutlined: true,
                        onAction: (item) {
                          Navigator.push(context, MaterialPageRoute(
                            builder: (_) => KegiatanDetailView(kegiatan: item, currentUser: widget.user),
                          ));
                        },
                      ),
                      const SizedBox(height: 16),
                    ],
                  ] else if (role == 'ppk') ...[
                    // PPK: Menunggu PPK
                    if (menungguPpkItems.isNotEmpty) ...[
                      _buildAlertCard(
                        title: 'Menunggu PPK (${menungguPpkItems.length})',
                        icon: LucideIcons.clipboardList,
                        borderColor: const Color(0xFFBFDBFE),
                        bgColor: const Color(0xFFEFF6FF),
                        headerBgColor: const Color(0xFFDBEAFE),
                        titleColor: const Color(0xFF1E40AF),
                        items: menungguPpkItems,
                        actionLabel: 'Review',
                        actionColor: const Color(0xFF2563EB),
                        onAction: (item) {
                          Navigator.push(context, MaterialPageRoute(
                            builder: (_) => KegiatanDetailView(kegiatan: item, currentUser: widget.user),
                          ));
                        },
                      ),
                      const SizedBox(height: 16),
                    ],
                  ] else if (role.startsWith('wadir')) ...[
                    // Wadir: Menunggu Wadir
                    if (menungguWadirItems.isNotEmpty) ...[
                      _buildAlertCard(
                        title: 'Menunggu Persetujuan Wadir (${menungguWadirItems.length})',
                        icon: LucideIcons.clipboardList,
                        borderColor: const Color(0xFFBFDBFE),
                        bgColor: const Color(0xFFEFF6FF),
                        headerBgColor: const Color(0xFFDBEAFE),
                        titleColor: const Color(0xFF1E40AF),
                        items: menungguWadirItems,
                        actionLabel: 'Review',
                        actionColor: const Color(0xFF2563EB),
                        onAction: (item) {
                          Navigator.push(context, MaterialPageRoute(
                            builder: (_) => KegiatanDetailView(kegiatan: item, currentUser: widget.user),
                          ));
                        },
                      ),
                      const SizedBox(height: 16),
                    ],
                  ] else if (role == 'bendahara') ...[
                    // Bendahara: Pencairan & LPJ
                    if (menungguBendaharaItems.isNotEmpty) ...[
                      _buildAlertCard(
                        title: 'Perlu Tindakan Bendahara (${menungguBendaharaItems.length})',
                        icon: LucideIcons.dollarSign,
                        borderColor: const Color(0xFFBFDBFE),
                        bgColor: const Color(0xFFEFF6FF),
                        headerBgColor: const Color(0xFFDBEAFE),
                        titleColor: const Color(0xFF1E40AF),
                        items: menungguBendaharaItems,
                        actionLabel: 'Proses',
                        actionColor: const Color(0xFF2563EB),
                        onAction: (item) {
                          Navigator.push(context, MaterialPageRoute(
                            builder: (_) => KegiatanDetailView(kegiatan: item, currentUser: widget.user),
                          ));
                        },
                      ),
                      const SizedBox(height: 16),
                    ],
                  ] else ...[
                    // Default/fallback: show all for admin/rektorat
                    if (revisiItems.isNotEmpty) ...[
                      _buildAlertCard(
                        title: 'Usulan Perlu Direvisi (${revisiItems.length})',
                        icon: LucideIcons.alertTriangle,
                        borderColor: const Color(0xFFFECDD3),
                        bgColor: const Color(0xFFFFF1F2),
                        headerBgColor: const Color(0xFFFFE4E6),
                        titleColor: const Color(0xFF9F1239),
                        items: revisiItems,
                        actionLabel: 'Perbaiki',
                        actionColor: const Color(0xFFE11D48),
                        onAction: (item) {
                          Navigator.push(context, MaterialPageRoute(builder: (_) => EditKegiatanView(kegiatanId: item.id)));
                        },
                      ),
                      const SizedBox(height: 16),
                    ],
                    if (needLpjItems.isNotEmpty) ...[
                      _buildAlertCard(
                        title: 'Perlu Upload LPJ (${needLpjItems.length})',
                        icon: LucideIcons.fileText,
                        borderColor: const Color(0xFFBFDBFE),
                        bgColor: const Color(0xFFEFF6FF),
                        headerBgColor: const Color(0xFFDBEAFE),
                        titleColor: const Color(0xFF1E40AF),
                        items: needLpjItems,
                        actionLabel: 'Upload',
                        actionColor: const Color(0xFF2563EB),
                        subtitle: 'Telah disetujui Wadir. Silakan unggah LPJ.',
                        onAction: (item) {
                          Navigator.push(context, MaterialPageRoute(
                            builder: (_) => KegiatanDetailView(kegiatan: item, currentUser: widget.user),
                          ));
                        },
                      ),
                      const SizedBox(height: 16),
                    ],
                    if (verifiedItems.isNotEmpty) ...[
                      _buildAlertCard(
                        title: 'Terverifikasi – Siap ke PPK (${verifiedItems.length})',
                        icon: LucideIcons.checkCircle2,
                        borderColor: const Color(0xFFA7F3D0),
                        bgColor: const Color(0xFFECFDF5),
                        headerBgColor: const Color(0xFFD1FAE5),
                        titleColor: const Color(0xFF065F46),
                        items: verifiedItems,
                        actionLabel: 'Teruskan',
                        actionColor: const Color(0xFF047857),
                        subtitle: 'Diverifikasi · Klik untuk teruskan ke PPK',
                        isOutlined: true,
                        onAction: (item) {
                          Navigator.push(context, MaterialPageRoute(
                            builder: (_) => KegiatanDetailView(kegiatan: item, currentUser: widget.user),
                          ));
                        },
                      ),
                      const SizedBox(height: 16),
                    ],
                  ],

                  // Aktivitas Terakhir
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0).withValues(alpha: 0.6)),
                      boxShadow: [
                        BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 12, offset: const Offset(0, 4)),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                          decoration: BoxDecoration(
                            border: Border(bottom: BorderSide(color: const Color(0xFFE2E8F0).withValues(alpha: 0.5))),
                          ),
                          child: const Row(
                            children: [
                              Text('Aktivitas Terakhir', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                            ],
                          ),
                        ),
                        if (recentActivity.isEmpty)
                          const Padding(
                            padding: EdgeInsets.all(32.0),
                            child: Center(
                              child: Text('Anda belum membuat usulan kegiatan.', style: TextStyle(color: Color(0xFF94A3B8))),
                            ),
                          )
                        else
                          ...recentActivity.asMap().entries.map((entry) {
                            final index = entry.key;
                            final item = entry.value;
                            return Column(
                              children: [
                                if (index > 0) const Divider(height: 1, color: Color(0xFFF1F5F9)),
                                InkWell(
                                  onTap: () {
                                    Navigator.push(context, MaterialPageRoute(
                                      builder: (_) => KegiatanDetailView(kegiatan: item, currentUser: widget.user),
                                    ));
                                  },
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                    child: Row(
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.all(10),
                                          decoration: const BoxDecoration(color: Color(0xFFF1F5F9), shape: BoxShape.circle),
                                          child: const Icon(LucideIcons.fileText, color: Color(0xFF64748B), size: 18),
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                item.namaKegiatan,
                                                maxLines: 1,
                                                overflow: TextOverflow.ellipsis,
                                                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: Color(0xFF0F172A)),
                                              ),
                                              const SizedBox(height: 2),
                                              Text(item.formattedDate, style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
                                            ],
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        _buildStatusBadge(item.status),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            );
                          }),
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

  String _getRoleLabel(String role) {
    switch (role) {
      case 'pengusul': return 'Pengusul';
      case 'verifikator': return 'Verifikator';
      case 'ppk': return 'PPK';
      case 'bendahara': return 'Bendahara';
      case 'rektorat': return 'Rektorat';
      case 'admin': return 'Admin';
      default:
        if (role.startsWith('wadir')) return 'Wadir';
        return role;
    }
  }

  Widget _buildAlertCard({
    required String title,
    required IconData icon,
    required Color borderColor,
    required Color bgColor,
    required Color headerBgColor,
    required Color titleColor,
    required List<Kegiatan> items,
    required String actionLabel,
    required Color actionColor,
    required void Function(Kegiatan) onAction,
    String? subtitle,
    bool isOutlined = false,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 8, offset: const Offset(0, 2)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: headerBgColor,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(15)),
              border: Border(bottom: BorderSide(color: borderColor)),
            ),
            child: Row(
              children: [
                Icon(icon, size: 18, color: titleColor),
                const SizedBox(width: 8),
                Expanded(child: Text(title, style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: titleColor))),
              ],
            ),
          ),
          ...items.map((item) {
            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                border: Border(bottom: BorderSide(color: borderColor.withValues(alpha: 0.5))),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(item.namaKegiatan, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: Color(0xFF0F172A)), maxLines: 1, overflow: TextOverflow.ellipsis),
                        if (item.catatanRevisi != null && item.catatanRevisi!.isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Text('Catatan: ${item.catatanRevisi}', style: TextStyle(fontSize: 12, color: titleColor, fontStyle: FontStyle.italic), maxLines: 2, overflow: TextOverflow.ellipsis),
                          )
                        else if (subtitle != null)
                          Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Text(subtitle, style: TextStyle(fontSize: 12, color: titleColor, fontStyle: FontStyle.italic)),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  isOutlined
                    ? OutlinedButton(
                        onPressed: () => onAction(item),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: actionColor,
                          side: BorderSide(color: actionColor.withValues(alpha: 0.5)),
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          textStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                        ),
                        child: Text(actionLabel),
                      )
                    : FilledButton(
                        onPressed: () => onAction(item),
                        style: FilledButton.styleFrom(
                          backgroundColor: actionColor,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          textStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                        ),
                        child: Text(actionLabel),
                      ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildStatCard(String title, String count, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0).withValues(alpha: 0.6)),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 8, offset: const Offset(0, 2)),
        ],
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 32),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(count, style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: Color(0xFF1E293B), height: 1.1)),
              Text(title, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Color(0xFF64748B))),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color bgColor;
    Color textColor;
    String label = status.replaceAll('_', ' ').toUpperCase();

    final s = status.toLowerCase();
    if (['diajukan', 'submitted', 'menunggu'].contains(s)) {
      bgColor = const Color(0xFFDBEAFE);
      textColor = const Color(0xFF1E40AF);
    } else if (['revisi', 'revision_requested', 'lpj_revision'].contains(s)) {
      bgColor = const Color(0xFFFFF7ED);
      textColor = const Color(0xFFC2410C);
    } else if (['disetujui', 'verified', 'approved_ppk', 'approved_wadir', 'lpj_approved', 'lpj_done'].contains(s)) {
      bgColor = const Color(0xFFECFDF5);
      textColor = const Color(0xFF065F46);
    } else if (s.contains('tolak') || s == 'rejected') {
      bgColor = const Color(0xFFFEF2F2);
      textColor = const Color(0xFFB91C1C);
    } else if (['pending_ppk', 'accepted_funds', 'funds_disbursed'].contains(s)) {
      bgColor = const Color(0xFFEDE9FE);
      textColor = const Color(0xFF5B21B6);
    } else if (s == 'draft') {
      bgColor = const Color(0xFFF1F5F9);
      textColor = const Color(0xFF475569);
    } else {
      bgColor = const Color(0xFFF1F5F9);
      textColor = const Color(0xFF475569);
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: textColor.withValues(alpha: 0.2)),
      ),
      child: Text(
        label,
        style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: textColor),
      ),
    );
  }
}
