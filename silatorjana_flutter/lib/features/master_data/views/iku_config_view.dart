import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import '../viewmodels/master_data_viewmodel.dart';

/// IKU Configuration — admin only.
/// Mirrors web's IkuConfigPage.tsx.
class IkuConfigView extends StatefulWidget {
  const IkuConfigView({super.key});

  @override
  State<IkuConfigView> createState() => _IkuConfigViewState();
}

class _IkuConfigViewState extends State<IkuConfigView> {
  late MasterDataViewModel _viewModel;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _viewModel = Provider.of<MasterDataViewModel>(context);
  }

  @override
  void initState() {
    super.initState();
    // Fetch data setelah frame pertama (Provider sudah tersedia)
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_viewModel.ikuList.isEmpty) {
        _viewModel.fetchIkuMaster();
      }
    });
  }

  void _showAddDialog() {
    final namaCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Tambah IKU'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: namaCtrl,
              decoration: const InputDecoration(
                labelText: 'Nama Indikator',
                hintText: 'Masukkan nama indikator IKU...',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Batal')),
          ElevatedButton(
            onPressed: () async {
              if (namaCtrl.text.isNotEmpty) {
                final success = await _viewModel.createIku({'nama_indikator': namaCtrl.text});
                if (ctx.mounted) Navigator.pop(ctx);
                if (success) _viewModel.fetchIkuMaster();
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF047857), foregroundColor: Colors.white),
            child: const Text('Simpan'),
          ),
        ],
      ),
    );
  }

  void _showEditDialog(Map<String, dynamic> iku) {
    final nameCtrl = TextEditingController(text: iku['nama_indikator'] ?? '');
    final id = iku['id'] as int;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Edit IKU'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameCtrl,
              decoration: const InputDecoration(labelText: 'Nama Indikator'),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Batal')),
          ElevatedButton(
            onPressed: () async {
              if (nameCtrl.text.isNotEmpty) {
                final success = await _viewModel.updateIku(id, {'nama_indikator': nameCtrl.text});
                if (ctx.mounted) Navigator.pop(ctx);
                if (success) _viewModel.fetchIkuMaster();
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF047857), foregroundColor: Colors.white),
            child: const Text('Simpan'),
          ),
        ],
      ),
    );
  }

  Future<void> _toggleVisibility(Map<String, dynamic> iku) async {
    final id = iku['id'] as int;
    final currentVisible = iku['is_visible'] == true || iku['is_visible'] == 1 || iku['is_visible'] == '1';
    final success = await _viewModel.updateIku(id, {'is_visible': !currentVisible});
    if (success) {
      _viewModel.fetchIkuMaster();
    }
  }

  Future<void> _confirmDelete(Map<String, dynamic> iku) async {
    final id = iku['id'] as int;
    final name = iku['nama_indikator'] ?? '';

    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Hapus IKU?'),
        content: Text('Apakah Anda yakin ingin menghapus indikator "$name"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Batal')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
            child: const Text('Hapus'),
          ),
        ],
      ),
    );

    if (confirm == true) {
      final success = await _viewModel.deleteIku(id);
      if (success) {
        _viewModel.fetchIkuMaster();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: MediaQuery.of(context).size.width >= 768
          ? null
          : AppBar(
              title: const Text('Konfigurasi IKU'),
              backgroundColor: Colors.white,
              foregroundColor: const Color(0xFF0F172A),
              elevation: 1,
              actions: [
                IconButton(icon: const Icon(LucideIcons.refreshCw, size: 20), onPressed: () => _viewModel.fetchIkuMaster()),
              ],
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showAddDialog,
        backgroundColor: const Color(0xFF047857),
        foregroundColor: Colors.white,
        child: const Icon(LucideIcons.plus),
      ),
      body: ListenableBuilder(
        listenable: _viewModel,
        builder: (context, _) {
          if (_viewModel.isLoading) {
            return const Center(child: CircularProgressIndicator(color: Color(0xFF047857)));
          }

          if (_viewModel.errorMessage != null) {
            return Center(child: Text(_viewModel.errorMessage!));
          }

          if (_viewModel.ikuList.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(LucideIcons.target, size: 48, color: Colors.grey.shade300),
                  const SizedBox(height: 12),
                  const Text('Belum ada data IKU.', style: TextStyle(color: Color(0xFF64748B))),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () => _viewModel.fetchIkuMaster(),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _viewModel.ikuList.length,
              itemBuilder: (context, index) {
                final iku = _viewModel.ikuList[index];
                final isVisible = iku['is_visible'] == true || iku['is_visible'] == 1 || iku['is_visible'] == '1';

                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: isVisible ? const Color(0xFFECFDF5) : Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Icon(
                          LucideIcons.target,
                          size: 20,
                          color: isVisible ? const Color(0xFF047857) : Colors.grey.shade400,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              iku['nama_indikator'] ?? '-',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                                color: isVisible ? const Color(0xFF0F172A) : const Color(0xFF94A3B8),
                                decoration: isVisible ? null : TextDecoration.lineThrough,
                              ),
                            ),
                            if (!isVisible)
                              const Text(
                                'Disembunyikan',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: Colors.redAccent,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton(
                        icon: Icon(
                          isVisible ? LucideIcons.eye : LucideIcons.eyeOff,
                          size: 18,
                          color: isVisible ? const Color(0xFF047857) : const Color(0xFF94A3B8),
                        ),
                        onPressed: () => _toggleVisibility(iku),
                        tooltip: isVisible ? 'Sembunyikan' : 'Tampilkan',
                      ),
                      IconButton(
                        icon: const Icon(LucideIcons.edit, size: 18, color: Color(0xFF047857)),
                        onPressed: () => _showEditDialog(iku),
                        tooltip: 'Edit',
                      ),
                      IconButton(
                        icon: const Icon(LucideIcons.trash2, size: 18, color: Colors.red),
                        onPressed: () => _confirmDelete(iku),
                        tooltip: 'Hapus',
                      ),
                    ],
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
