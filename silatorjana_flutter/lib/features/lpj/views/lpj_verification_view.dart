import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../kegiatan/models/kegiatan.dart';
import '../viewmodels/lpj_viewmodel.dart';
import 'components/spk_score_card_widget.dart';

/// LPJ Verification — bendahara reviews LPJ.
/// Mirrors web's LpjVerificationPage.tsx.
class LpjVerificationView extends StatefulWidget {
  final Kegiatan kegiatan;
  const LpjVerificationView({super.key, required this.kegiatan});

  @override
  State<LpjVerificationView> createState() => _LpjVerificationViewState();
}

class _LpjVerificationViewState extends State<LpjVerificationView> {
  final LpjViewModel _viewModel = LpjViewModel();
  final _catatanCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _viewModel.fetchLpjDetail(widget.kegiatan.id);
  }

  @override
  void dispose() {
    _viewModel.dispose();
    _catatanCtrl.dispose();
    super.dispose();
  }

  Future<void> _handleAction(String action) async {
    if (_catatanCtrl.text.isEmpty && action == 'revision') {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Catatan wajib diisi untuk revisi.'), backgroundColor: Colors.orange),
      );
      return;
    }

    final success = await _viewModel.approveLpj(widget.kegiatan.id, action, _catatanCtrl.text);
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(action == 'approve' ? 'LPJ disetujui!' : 'LPJ diminta revisi.'),
          backgroundColor: action == 'approve' ? const Color(0xFF047857) : Colors.orange,
        ),
      );
      Navigator.pop(context, true);
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Gagal memproses LPJ.'), backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Verifikasi LPJ'),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF0F172A),
        elevation: 1,
      ),
      body: ListenableBuilder(
        listenable: _viewModel,
        builder: (context, _) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Kegiatan info
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(widget.kegiatan.namaKegiatan, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Color(0xFF1E293B))),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const Icon(LucideIcons.user, size: 14, color: Color(0xFF94A3B8)),
                          const SizedBox(width: 4),
                          Text(widget.kegiatan.namaPengusul, style: const TextStyle(fontSize: 13, color: Color(0xFF64748B))),
                        ],
                      ),
                      if (widget.kegiatan.totalAnggaran != null) ...[
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            const Icon(LucideIcons.banknote, size: 14, color: Color(0xFF94A3B8)),
                            const SizedBox(width: 4),
                            Text('Rp ${widget.kegiatan.totalAnggaran}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF047857))),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                // LPJ Detail (if loaded)
                if (_viewModel.isDetailLoading)
                  const Center(child: Padding(padding: EdgeInsets.all(24), child: CircularProgressIndicator(color: Color(0xFF047857))))
                else if (_viewModel.lpjDetail != null) ...[
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Detail LPJ', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF1E293B))),
                        const Divider(height: 20),
                        if (_viewModel.lpjDetail!['catatan_pengusul'] != null)
                          Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: Text('Catatan Pengusul: ${_viewModel.lpjDetail!['catatan_pengusul']}', style: const TextStyle(fontSize: 13, color: Color(0xFF475569))),
                          ),
                        Text('Status: ${_viewModel.lpjDetail!['status'] ?? '-'}', style: const TextStyle(fontSize: 13, color: Color(0xFF64748B))),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  _buildLpjDetails(_viewModel.lpjDetail!),
                  const SizedBox(height: 16),
                  SpkScoreCardWidget(kegiatanId: widget.kegiatan.id),
                  const SizedBox(height: 16),
                ],
                // Catatan bendahara
                TextField(
                  controller: _catatanCtrl,
                  maxLines: 3,
                  decoration: InputDecoration(
                    labelText: 'Catatan Verifikasi',
                    alignLabelWithHint: true,
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                  ),
                ),
                const SizedBox(height: 24),
                // Action buttons
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: _viewModel.isSubmitting ? null : () => _handleAction('revision'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.orange,
                          side: const BorderSide(color: Colors.orange),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        child: const Text('Minta Revisi', style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: _viewModel.isSubmitting ? null : () => _handleAction('approve'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF047857),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        child: _viewModel.isSubmitting
                            ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                            : const Text('Setujui LPJ', style: TextStyle(fontWeight: FontWeight.bold)),
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

  String _formatCurrency(dynamic amount) {
    if (amount == null) return 'Rp 0';
    final n = amount is num ? amount : num.tryParse(amount.toString()) ?? 0;
    final str = n.toInt().toString();
    final buffer = StringBuffer();
    int count = 0;
    for (int i = str.length - 1; i >= 0; i--) {
      buffer.write(str[i]);
      count++;
      if (count % 3 == 0 && i > 0 && str[i] != '-') buffer.write('.');
    }
    return 'Rp ${buffer.toString().split('').reversed.join()}';
  }

  num _parseNum(dynamic value, [num defaultValue = 0]) {
    if (value == null) return defaultValue;
    if (value is num) return value;
    return num.tryParse(value.toString()) ?? defaultValue;
  }

  String _formatQty(dynamic value) {
    if (value == null) return '';
    final n = value is num ? value : num.tryParse(value.toString()) ?? 0;
    if (n == n.toInt()) {
      return n.toInt().toString();
    }
    return n.toString();
  }

  Widget _buildLpjDetails(Map<String, dynamic> detail) {
    final rabGroups = detail['rab'] as Map<String, dynamic>? ?? {};
    if (rabGroups.isEmpty) {
      return const Text('Tidak ada berkas LPJ.', style: TextStyle(fontSize: 13, color: Colors.grey));
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: rabGroups.entries.map<Widget>((entry) {
        final group = entry.value;
        final label = group['label']?.toString() ?? entry.key;
        final items = (group['items'] as List?) ?? [];
        if (items.isEmpty) return const SizedBox.shrink();

        return Card(
          margin: const EdgeInsets.only(bottom: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: const BoxDecoration(
                  color: Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.only(topLeft: Radius.circular(12), topRight: Radius.circular(12)),
                ),
                child: Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF334155))),
              ),
              // Items
              Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  children: items.map<Widget>((item) {
                    final files = (item['existing_files'] as List?) ?? [];
                    final isImageReg = RegExp(r'\.(jpeg|jpg|gif|png|webp)$', caseSensitive: false);

                    final qty1 = _parseNum(item['qty1'], 1);
                    final qty2 = item['qty2'] != null ? _parseNum(item['qty2']) : null;
                    final qty3 = item['qty3'] != null ? _parseNum(item['qty3']) : null;
                    final harga = _parseNum(item['harga_satuan'], 0);
                    final total = _parseNum(item['total'], 0);

                    final realQty1 = item['real_qty1'] != null ? _parseNum(item['real_qty1']) : null;
                    final realQty2 = item['real_qty2'] != null ? _parseNum(item['real_qty2']) : null;
                    final realQty3 = item['real_qty3'] != null ? _parseNum(item['real_qty3']) : null;
                    final realHarga = item['real_harga_satuan'] != null ? _parseNum(item['real_harga_satuan']) : null;

                    // Calculate real total
                    num realTotal = 0;
                    if (realQty1 != null && realHarga != null) {
                      final q1 = realQty1;
                      final q2 = realQty2 ?? 1;
                      final q3 = realQty3 ?? 1;
                      final h = realHarga;
                      realTotal = q1 * q2 * q3 * h;
                    }

                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(item['uraian'] ?? '-', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF1E293B))),
                          const SizedBox(height: 6),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('Target Anggaran', style: TextStyle(fontSize: 11, color: Color(0xFF64748B))),
                                  const SizedBox(height: 2),
                                  Text(
                                    '${_formatQty(qty1)}${qty2 != null && qty2 != 1 ? ' x ${_formatQty(qty2)}' : ''}${qty3 != null && qty3 != 0 ? ' x ${_formatQty(qty3)}' : ''} @ ${_formatCurrency(harga)}',
                                    style: const TextStyle(fontSize: 12, color: Color(0xFF334155)),
                                  ),
                                  Text('Total: ${_formatCurrency(total)}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF334155))),
                                ],
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  const Text('Realisasi', style: TextStyle(fontSize: 11, color: Color(0xFF047857))),
                                  const SizedBox(height: 2),
                                  if (realQty1 != null) ...[
                                    Text(
                                      '${_formatQty(realQty1)}${realQty2 != null && realQty2 != 1 ? ' x ${_formatQty(realQty2)}' : ''}${realQty3 != null && realQty3 != 0 ? ' x ${_formatQty(realQty3)}' : ''} @ ${_formatCurrency(realHarga)}',
                                      style: const TextStyle(fontSize: 12, color: Color(0xFF047857)),
                                    ),
                                    Text('Total: ${_formatCurrency(realTotal)}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF047857))),
                                  ] else ...[
                                    const Text('Belum diisi', style: TextStyle(fontSize: 12, fontStyle: FontStyle.italic, color: Colors.orange)),
                                  ],
                                ],
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          const Text('Berkas Bukti / Kuitansi:', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF64748B))),
                          const SizedBox(height: 6),
                          if (files.isEmpty)
                            const Text('Tidak ada berkas bukti.', style: TextStyle(fontSize: 12, fontStyle: FontStyle.italic, color: Colors.grey))
                          else
                            Wrap(
                              spacing: 8,
                              runSpacing: 6,
                              children: files.map<Widget>((file) {
                                final filename = file['original_name']?.toString() ?? 'File';
                                final fileUrl = file['url']?.toString() ?? '';
                                final isImage = isImageReg.hasMatch(filename) || isImageReg.hasMatch(fileUrl);

                                return Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFECFDF5),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: const Color(0xFFD1FAE5)),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(isImage ? LucideIcons.image : LucideIcons.fileText, size: 14, color: const Color(0xFF047857)),
                                      const SizedBox(width: 6),
                                      Text(
                                        filename,
                                        style: const TextStyle(fontSize: 12, color: Color(0xFF047857), fontWeight: FontWeight.bold),
                                      ),
                                    ],
                                  ),
                                );
                              }).toList(),
                            ),
                        ],
                      ),
                    );
                  }).toList(),
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}
