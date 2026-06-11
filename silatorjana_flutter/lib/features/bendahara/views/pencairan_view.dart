import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../../core/models/kegiatan.dart';
import '../../kegiatan/viewmodels/kegiatan_viewmodel.dart';
import '../../../core/utils/status_badge.dart';

class PencairanView extends StatefulWidget {
  final Kegiatan kegiatan;
  const PencairanView({super.key, required this.kegiatan});

  @override
  State<PencairanView> createState() => _PencairanViewState();
}

class _PencairanViewState extends State<PencairanView> {
  final TextEditingController _persentaseCtrl = TextEditingController();
  final TextEditingController _catatanCtrl = TextEditingController();

  static const _emerald700 = Color(0xFF047857);
  static const _emerald600 = Color(0xFF059669);

  String _formatCurrency(dynamic amount) {
    if (amount == null) return 'Rp 0';
    final numAmount = amount is String ? double.tryParse(amount) ?? 0 : amount;
    return NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0).format(numAmount);
  }

  String _formatDate(dynamic dateString) {
    if (dateString == null) return '-';
    try {
      final date = DateTime.parse(dateString.toString()).toLocal();
      return DateFormat('dd MMM yyyy HH:mm', 'id_ID').format(date);
    } catch (e) {
      return dateString.toString();
    }
  }

  void _handlePencairan(KegiatanViewModel vm, Map<String, dynamic> detail) async {
    final persentase = double.tryParse(_persentaseCtrl.text);
    if (persentase == null || persentase <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Persentase tidak valid'), backgroundColor: Colors.red),
      );
      return;
    }

    final disbursementHistory = detail['pencairan_dana'] ?? [];
    double totalDisbursed = 0;
    for (var p in disbursementHistory) {
      totalDisbursed += double.tryParse(p['persentase'].toString()) ?? 0;
    }
    
    final remaining = 100 - totalDisbursed;
    if (totalDisbursed + persentase > 100) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Total pencairan melebihi 100%. Sisa limit: $remaining%'), backgroundColor: Colors.red),
      );
      return;
    }

    final status = detail['status']?.toString().toLowerCase() ?? '';
    final hasSubmittedLpj = ['lpj_submitted', 'lpj_revision', 'lpj_approved', 'lpj_verified', 'lpj_done', 'completed'].contains(status);

    if (!hasSubmittedLpj && (totalDisbursed + persentase >= 100)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pencairan tahap awal tidak boleh 100%. Sisa dana dapat dicairkan setelah LPJ disubmit.'), backgroundColor: Colors.orange),
      );
      return;
    }

    final success = await vm.tambahPencairan(widget.kegiatan.id, persentase, _catatanCtrl.text);
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pencairan berhasil dicatat!'), backgroundColor: _emerald700),
      );
      _persentaseCtrl.clear();
      _catatanCtrl.clear();
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Gagal mencatat pencairan.'), backgroundColor: Colors.red),
      );
    }
  }

  void _handleMarkTaken(KegiatanViewModel vm, int id) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Tandai Diambil?'),
        content: const Text('Tandai bahwa pencairan ini telah diambil oleh pengusul?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Batal')),
          ElevatedButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Ya, Tandai')),
        ],
      ),
    );

    if (confirmed != true) return;

    final success = await vm.ambilUangMuka(id);
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Berhasil ditandai.'), backgroundColor: _emerald700),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Pencairan Dana', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17)),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1E293B),
        elevation: 0,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: const Color(0xFFE2E8F0)),
        ),
      ),
      body: Consumer<KegiatanViewModel>(
        builder: (context, vm, child) {
          if (vm.isDetailLoading) {
            return const Center(child: CircularProgressIndicator(color: _emerald700));
          }
          final detail = vm.detailData;
          if (detail == null) {
            return const Center(child: Text('Data tidak ditemukan'));
          }

          final disbursementHistory = detail['pencairan_dana'] ?? [];
          double totalDisbursed = 0;
          for (var p in disbursementHistory) {
            totalDisbursed += double.tryParse(p['persentase'].toString()) ?? 0;
          }
          final remaining = 100 - totalDisbursed;

          final inputPercentNum = double.tryParse(_persentaseCtrl.text) ?? 0;
          final calculatedNominal = (inputPercentNum / 100) * (detail['total_anggaran'] ?? 0);

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Info Usulan
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
                      const Text('Informasi Usulan', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      const SizedBox(height: 12),
                      Text('Nama Kegiatan', style: TextStyle(color: Colors.slate.shade500, fontSize: 12, fontWeight: FontWeight.bold)),
                      Text(detail['nama_kegiatan'] ?? '-', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Total Anggaran', style: TextStyle(color: Colors.slate.shade500, fontSize: 12, fontWeight: FontWeight.bold)),
                              Text(_formatCurrency(detail['total_anggaran']), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: _emerald700)),
                            ],
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text('Status', style: TextStyle(color: Colors.slate.shade500, fontSize: 12, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 4),
                              StatusBadge(status: detail['status'] ?? ''),
                            ],
                          )
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Form Pencairan Baru
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Text('Pencairan Baru', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Telah Dicairkan: $totalDisbursed%', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                          Text('Sisa Limit: $remaining%', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: _emerald700)),
                        ],
                      ),
                      const Divider(height: 24),
                      if (remaining <= 0)
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(color: _emerald50, borderRadius: BorderRadius.circular(8), border: Border.all(color: _emerald100)),
                          child: const Row(
                            children: [
                              Icon(LucideIcons.checkSquare, color: _emerald600),
                              SizedBox(width: 8),
                              Expanded(child: Text('Dana telah dicairkan 100%.', style: TextStyle(color: _emerald700, fontWeight: FontWeight.bold))),
                            ],
                          ),
                        )
                      else ...[
                        TextField(
                          controller: _persentaseCtrl,
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          onChanged: (_) => setState(() {}),
                          decoration: InputDecoration(
                            labelText: 'Persentase (%)',
                            hintText: 'Maks $remaining%',
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: _emerald600, width: 2)),
                            suffixText: '%',
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text('Nominal yang Dicairkan', style: TextStyle(color: Colors.slate.shade500, fontSize: 12)),
                        Text(_formatCurrency(calculatedNominal), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20, color: _emerald700)),
                        const SizedBox(height: 16),
                        TextField(
                          controller: _catatanCtrl,
                          maxLines: 2,
                          decoration: InputDecoration(
                            labelText: 'Catatan / No. Ref Transfer',
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: _emerald600, width: 2)),
                          ),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: vm.isActionLoading || _persentaseCtrl.text.isEmpty ? null : () => _handlePencairan(vm, detail),
                          icon: vm.isActionLoading ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Icon(LucideIcons.checkCircle2, size: 18),
                          label: const Text('Konfirmasi Pencairan', style: TextStyle(fontWeight: FontWeight.bold)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: _emerald700,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // History Pencairan
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Row(
                        children: [
                          Icon(LucideIcons.clock, size: 18, color: Color(0xFF64748B)),
                          SizedBox(width: 8),
                          Text('Riwayat Pencairan', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                        ],
                      ),
                      const SizedBox(height: 16),
                      if (disbursementHistory.isEmpty)
                        const Center(child: Padding(padding: EdgeInsets.all(16.0), child: Text('Belum ada riwayat', style: TextStyle(color: Colors.grey))))
                      else
                        ListView.separated(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: disbursementHistory.length,
                          separatorBuilder: (context, index) => const Divider(height: 16),
                          itemBuilder: (context, index) {
                            final p = disbursementHistory[index];
                            final isTaken = p['is_taken'] == true || p['is_taken'] == 1 || p['tanggal_pengambilan'] != null;
                            return Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(color: _emerald50, borderRadius: BorderRadius.circular(8)),
                                  child: Text('${p['persentase']}%', style: const TextStyle(fontWeight: FontWeight.bold, color: _emerald700)),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(_formatCurrency(p['nominal']), style: const TextStyle(fontWeight: FontWeight.bold)),
                                      Text(_formatDate(p['tanggal_pencairan'] ?? p['created_at']), style: const TextStyle(fontSize: 12, color: Colors.grey)),
                                      if (p['catatan'] != null && p['catatan'].toString().isNotEmpty)
                                        Text(p['catatan'], style: const TextStyle(fontSize: 12, color: Colors.grey)),
                                    ],
                                  ),
                                ),
                                if (isTaken)
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(color: _emerald50, borderRadius: BorderRadius.circular(12)),
                                    child: const Text('Diambil', style: TextStyle(fontSize: 10, color: _emerald700, fontWeight: FontWeight.bold)),
                                  )
                                else
                                  OutlinedButton(
                                    onPressed: vm.isActionLoading ? null : () => _handleMarkTaken(vm, widget.kegiatan.id),
                                    style: OutlinedButton.styleFrom(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 0),
                                      minimumSize: const Size(0, 28),
                                      side: const BorderSide(color: Colors.orange),
                                    ),
                                    child: const Text('Tandai', style: TextStyle(fontSize: 10, color: Colors.orange)),
                                  )
                              ],
                            );
                          },
                        )
                    ],
                  ),
                )
              ],
            ),
          );
        },
      ),
    );
  }
}
