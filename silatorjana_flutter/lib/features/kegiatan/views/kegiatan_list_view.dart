import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../auth/models/user.dart';
import '../viewmodels/kegiatan_viewmodel.dart';
import 'kegiatan_detail_view.dart';
import 'create_kegiatan_view.dart';
import 'edit_kegiatan_view.dart';

class KegiatanListView extends StatefulWidget {
  final User currentUser;
  const KegiatanListView({super.key, required this.currentUser});

  @override
  State<KegiatanListView> createState() => _KegiatanListViewState();
}

class _KegiatanListViewState extends State<KegiatanListView> {
  final KegiatanViewModel _kegiatanViewModel = KegiatanViewModel();

  @override
  void initState() {
    super.initState();
    _kegiatanViewModel.fetchKegiatanList();
  }

  @override
  void dispose() {
    _kegiatanViewModel.dispose();
    super.dispose();
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'draft': return Colors.grey;
      case 'submitted': return Colors.blue;
      case 'pending_ppk': return Colors.orange;
      case 'approved_ppk': return Colors.orangeAccent;
      case 'approved_wadir': return Colors.green;
      case 'funds_disbursed': return Colors.teal;
      case 'rejected': return Colors.red;
      case 'revision_requested': return Colors.deepOrange;
      default: return Colors.black54;
    }
  }

  String _formatStatus(String status) {
    return status.replaceAll('_', ' ').toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: ListenableBuilder(
        listenable: _kegiatanViewModel,
        builder: (context, _) => _buildBody(),
      ),
      floatingActionButton: (widget.currentUser.role == 'pengusul' || widget.currentUser.role == 'admin')
          ? FloatingActionButton.extended(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const CreateKegiatanView()),
                ).then((result) {
                  if (result == true) _kegiatanViewModel.fetchKegiatanList();
                });
              },
              backgroundColor: const Color(0xFF047857),
              foregroundColor: Colors.white,
              icon: const Icon(LucideIcons.plus),
              label: const Text('Buat Usulan', style: TextStyle(fontWeight: FontWeight.bold)),
            )
          : null,
    );
  }

  Widget _buildBody() {
    if (_kegiatanViewModel.isListLoading) {
      return const Center(child: CircularProgressIndicator(color: Color(0xFF047857)));
    }

    if (_kegiatanViewModel.listErrorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(LucideIcons.alertTriangle, size: 48, color: Colors.red),
            const SizedBox(height: 16),
            Text(_kegiatanViewModel.listErrorMessage!, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => _kegiatanViewModel.fetchKegiatanList(),
              child: const Text('Coba Lagi'),
            ),
          ],
        ),
      );
    }

    final filteredList = _kegiatanViewModel.kegiatanList.where((item) {
      if (widget.currentUser.role == 'verifikator') {
        return item.verifikatorTarget == null || item.verifikatorTarget == widget.currentUser.wadirTarget;
      } else if (widget.currentUser.role.startsWith('wadir')) {
        if (widget.currentUser.wadirTarget == 'wadir2' && item.verifikatorTarget == null) return true;
        return item.verifikatorTarget == widget.currentUser.wadirTarget;
      }
      return true;
    }).toList();

    if (filteredList.isEmpty) {
      return const Center(
        child: Text('Belum ada data pengajuan.', style: TextStyle(fontSize: 16, color: Colors.grey)),
      );
    }

    return RefreshIndicator(
      onRefresh: _kegiatanViewModel.fetchKegiatanList,
      color: const Color(0xFF047857),
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: filteredList.length,
        itemBuilder: (context, index) {
          final item = filteredList[index];
          final String formattedDate = item.formattedDate;

          final bool isPengusulOrAdmin = widget.currentUser.role == 'pengusul' || widget.currentUser.role == 'admin';
          final bool isEditable = isPengusulOrAdmin && (item.status == 'draft' || item.status == 'revisi' || item.status == 'revision_requested');

          return Container(
            margin: const EdgeInsets.only(bottom: 16),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: [
                BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 4, offset: const Offset(0, 2))
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.judul,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF1E293B)),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Text(
                      formattedDate,
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF64748B)),
                    ),
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 8.0),
                      child: CircleAvatar(radius: 2, backgroundColor: Color(0xFFCBD5E1)),
                    ),
                    Text(
                      'ID: ${item.id.toString().padLeft(8, '0')}',
                      style: const TextStyle(fontSize: 12, fontFamily: 'monospace', fontWeight: FontWeight.w500, color: Color(0xFF64748B)),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(LucideIcons.user, size: 12, color: Color(0xFF64748B)),
                    const SizedBox(width: 4),
                    Text(item.namaPengusul, style: const TextStyle(color: Color(0xFF64748B), fontSize: 12)),
                  ],
                ),
                const SizedBox(height: 16),
                const Divider(height: 1, color: Color(0xFFF1F5F9)),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: _getStatusColor(item.status).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: _getStatusColor(item.status).withValues(alpha: 0.5)),
                  ),
                  child: Text(
                    _formatStatus(item.status),
                    style: TextStyle(
                      color: _getStatusColor(item.status),
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => KegiatanDetailView(
                                kegiatan: item,
                                currentUser: widget.currentUser,
                              ),
                            ),
                          ).then((value) {
                            if (value == true) _kegiatanViewModel.fetchKegiatanList();
                          });
                        },
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFF047857),
                          side: const BorderSide(color: Color(0xFFA7F3D0)),
                          backgroundColor: const Color(0xFFECFDF5),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                        child: const Icon(LucideIcons.eye, size: 18),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton(
                        onPressed: isEditable ? () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => EditKegiatanView(kegiatanId: item.id)),
                          ).then((result) {
                            if (result == true) _kegiatanViewModel.fetchKegiatanList();
                          });
                        } : null,
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFFD97706),
                          side: BorderSide(color: isEditable ? const Color(0xFFFDE68A) : const Color(0xFFE2E8F0)),
                          backgroundColor: isEditable ? const Color(0xFFFFFBEB) : const Color(0xFFF8FAFC),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                        child: const Icon(LucideIcons.edit2, size: 18),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton(
                        onPressed: isEditable ? () async {
                          final confirm = await showDialog<bool>(
                            context: context,
                            builder: (context) => AlertDialog(
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                              title: const Row(
                                children: [
                                  Icon(LucideIcons.trash2, color: Colors.red),
                                  SizedBox(width: 8),
                                  Text('Hapus Draft', style: TextStyle(fontWeight: FontWeight.bold)),
                                ],
                              ),
                              content: const Text('Apakah Anda yakin ingin menghapus draft usulan ini secara permanen?'),
                              actions: [
                                TextButton(
                                  onPressed: () => Navigator.pop(context, false),
                                  child: const Text('Batal', style: TextStyle(color: Color(0xFF64748B), fontWeight: FontWeight.bold)),
                                ),
                                ElevatedButton(
                                  onPressed: () => Navigator.pop(context, true),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.red,
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                  ),
                                  child: const Text('Hapus', style: TextStyle(fontWeight: FontWeight.bold)),
                                ),
                              ],
                            ),
                          );
                          if (confirm == true) {
                            final success = await _kegiatanViewModel.deleteKegiatan(item.id);
                            if (success && mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Draft usulan berhasil dihapus')),
                              );
                              _kegiatanViewModel.fetchKegiatanList();
                            } else if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Gagal menghapus draft usulan')),
                              );
                            }
                          }
                        } : null,
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFFDC2626),
                          side: BorderSide(color: isEditable ? const Color(0xFFFECACA) : const Color(0xFFE2E8F0)),
                          backgroundColor: isEditable ? const Color(0xFFFEF2F2) : const Color(0xFFF8FAFC),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                        child: const Icon(LucideIcons.trash2, size: 18),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
