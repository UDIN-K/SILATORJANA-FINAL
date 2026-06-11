import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../kegiatan/models/kegiatan.dart';
import '../viewmodels/lpj_viewmodel.dart';

/// Pencairan Dana view — for bendahara to disburse funds.
/// - Shows progress bar (max 70% uang muka)
/// - Toggle "Dana Sudah Diambil"
/// - After funds_disbursed: locked, shows LPJ info
class PencairanView extends StatefulWidget {
  final Kegiatan kegiatan;
  const PencairanView({super.key, required this.kegiatan});

  @override
  State<PencairanView> createState() => _PencairanViewState();
}

class _PencairanViewState extends State<PencairanView> {
  final LpjViewModel _vm = LpjViewModel();
  final _persentaseCtrl = TextEditingController();
  final _catatanCtrl = TextEditingController();

  static const _emerald700 = Color(0xFF047857);
  static const _emerald600 = Color(0xFF059669);
  static const _emerald50 = Color(0xFFECFDF5);
  static const _emerald100 = Color(0xFFD1FAE5);
  static const _amber50 = Color(0xFFFFFBEB);
  static const _amber100 = Color(0xFFFEF3C7);
  static const _amber600 = Color(0xFFD97706);
  static const _slate50 = Color(0xFFF8FAFC);
  static const _slate100 = Color(0xFFF1F5F9);
  static const _slate500 = Color(0xFF64748B);
  static const _slate600 = Color(0xFF475569);
  static const _slate800 = Color(0xFF1E293B);

  @override
  void initState() {
    super.initState();
    _vm.fetchPencairanData(widget.kegiatan.id);
  }

  @override
  void dispose() {
    _vm.dispose();
    _persentaseCtrl.dispose();
    _catatanCtrl.dispose();
    super.dispose();
  }

  String _formatCurrency(dynamic amount) {
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

  Future<void> _handlePencairan() async {
    final persen = double.tryParse(_persentaseCtrl.text) ?? 0;
    final data = _vm.pencairanData;
    final maxPersen = (data?['max_persen'] as num?)?.toDouble() ?? 70.0;
    final sisaPersen = (data?['sisa_persen'] as num?)?.toDouble() ?? 70.0;

    if (persen <= 0 || persen > 100) {
      _showSnackBar('Persentase harus antara 1-100', isError: true);
      return;
    }
    if (persen > sisaPersen) {
      _showSnackBar('Melebihi sisa yang tersedia (${sisaPersen.toStringAsFixed(1)}%). Maks uang muka: ${maxPersen.toInt()}%', isError: true);
      return;
    }

    final result = await _vm.pencairan(widget.kegiatan.id, persen, _catatanCtrl.text);
    if (result['success'] == true && mounted) {
      _persentaseCtrl.clear();
      _catatanCtrl.clear();
      _showSnackBar('Pencairan berhasil!');
    } else if (mounted) {
      _showSnackBar(result['message'] ?? 'Gagal mencairkan dana', isError: true);
    }
  }

  Future<void> _handleTandaiDiambil() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Row(children: [
          Icon(LucideIcons.checkCircle, color: _emerald700, size: 22),
          SizedBox(width: 10),
          Text('Tandai Dana Diambil', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        ]),
        content: const Text(
          'Konfirmasi bahwa pengusul sudah mengambil dana yang dicairkan. Tindakan ini tidak dapat dibatalkan.',
          style: TextStyle(fontSize: 14, color: _slate600, height: 1.5),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Batal', style: TextStyle(color: _slate500)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: _emerald700,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Ya, Dana Sudah Diambil'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;
    final success = await _vm.tandaiDanaDiambil(widget.kegiatan.id);
    if (mounted) {
      _showSnackBar(success ? 'Dana berhasil ditandai sudah diambil!' : 'Gagal memperbarui.', isError: !success);
    }
  }

  void _showSnackBar(String msg, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: isError ? Colors.red : _emerald700,
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _slate50,
      appBar: AppBar(
        title: const Text('Pencairan Dana', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17)),
        backgroundColor: Colors.white,
        foregroundColor: _slate800,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: const Color(0xFFE2E8F0)),
        ),
      ),
      body: ListenableBuilder(
        listenable: _vm,
        builder: (context, _) {
          if (_vm.isPencairanLoading) {
            return const Center(child: CircularProgressIndicator(color: _emerald700));
          }
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _buildKegiatanCard(),
                const SizedBox(height: 16),
                _buildProgressCard(),
                const SizedBox(height: 16),
                if (_vm.pencairanData != null) _buildPencairanList(),
                const SizedBox(height: 16),
                if (!_isDanaDiambil) _buildDanaDiambilButton(),
                if (!_isFundsDisbursed) ...[
                  const SizedBox(height: 16),
                  _buildFormPencairan(),
                ] else ...[
                  const SizedBox(height: 16),
                  _buildLockedInfo(),
                ],
                const SizedBox(height: 32),
              ],
            ),
          );
        },
      ),
    );
  }

  bool get _isFundsDisbursed {
    final totalPersen = (_vm.pencairanData?['total_persen'] as num?)?.toDouble() ?? 0;
    final maxPersen = (_vm.pencairanData?['max_persen'] as num?)?.toDouble() ?? 70;
    return totalPersen >= maxPersen || widget.kegiatan.status == 'funds_disbursed';
  }

  bool get _isDanaDiambil {
    return _vm.pencairanData?['is_taken'] == true || widget.kegiatan.uangMukaDiambil;
  }

  Widget _buildKegiatanCard() {
    final totalAnggaran = (_vm.pencairanData?['total_anggaran'] as num?) ?? widget.kegiatan.totalAnggaran ?? 0;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF047857), Color(0xFF059669)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [BoxShadow(color: Color(0x33047857), blurRadius: 12, offset: Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(8)),
              child: const Icon(LucideIcons.banknote, size: 20, color: Colors.white),
            ),
            const SizedBox(width: 10),
            const Text('Pencairan Dana Kegiatan', style: TextStyle(color: Colors.white70, fontSize: 13)),
          ]),
          const SizedBox(height: 12),
          Text(widget.kegiatan.namaKegiatan,
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 17)),
          const SizedBox(height: 12),
          Text(
            _formatCurrency(totalAnggaran),
            style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w900),
          ),
          const Text('Total RAB', style: TextStyle(color: Colors.white70, fontSize: 12)),
        ],
      ),
    );
  }

  Widget _buildProgressCard() {
    final data = _vm.pencairanData;
    final totalPersen = (data?['total_persen'] as num?)?.toDouble() ?? 0;
    final maxPersen = (data?['max_persen'] as num?)?.toDouble() ?? 70;
    final sisaPersen = (data?['sisa_persen'] as num?)?.toDouble() ?? maxPersen;
    final totalNominal = (data?['total_nominal'] as num?)?.toDouble() ?? 0;
    final totalAnggaran = (data?['total_anggaran'] as num?)?.toDouble() ?? 1;
    final progressRatio = (totalPersen / maxPersen).clamp(0.0, 1.0);
    final isTaken = _isDanaDiambil;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: const [BoxShadow(color: Color(0x08000000), blurRadius: 8, offset: Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            const Text('Progress Pencairan (Uang Muka)',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: _slate800)),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: isTaken ? _emerald50 : (totalPersen >= maxPersen ? _amber100 : _slate100),
                borderRadius: BorderRadius.circular(99),
              ),
              child: Text(
                isTaken ? 'Diambil' : (totalPersen >= maxPersen ? 'Penuh' : 'Aktif'),
                style: TextStyle(
                  fontSize: 11, fontWeight: FontWeight.bold,
                  color: isTaken ? _emerald700 : (totalPersen >= maxPersen ? _amber600 : _slate500),
                ),
              ),
            ),
          ]),
          const SizedBox(height: 16),
          // Progress bar
          Stack(
            children: [
              Container(
                height: 12,
                decoration: BoxDecoration(color: _slate100, borderRadius: BorderRadius.circular(99)),
              ),
              AnimatedContainer(
                duration: const Duration(milliseconds: 600),
                curve: Curves.easeOut,
                height: 12,
                width: (MediaQuery.of(context).size.width - 72) * progressRatio,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: totalPersen >= maxPersen
                        ? [const Color(0xFFD97706), const Color(0xFFF59E0B)]
                        : [_emerald700, _emerald600],
                  ),
                  borderRadius: BorderRadius.circular(99),
                  boxShadow: [BoxShadow(
                    color: (totalPersen >= maxPersen ? _amber600 : _emerald600).withValues(alpha: 0.3),
                    blurRadius: 6, offset: const Offset(0, 2),
                  )],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text('${totalPersen.toStringAsFixed(1)}% dari maks ${maxPersen.toInt()}%',
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: _slate800)),
            Text('Sisa: ${sisaPersen.toStringAsFixed(1)}%',
                style: TextStyle(fontSize: 12, color: sisaPersen <= 0 ? Colors.orange : _slate500)),
          ]),
          const SizedBox(height: 16),
          const Divider(color: Color(0xFFF1F5F9)),
          const SizedBox(height: 12),
          // Nominal info
          Row(children: [
            Expanded(child: _buildStatBox('Sudah Dicairkan', _formatCurrency(totalNominal), _emerald700, _emerald50)),
            const SizedBox(width: 12),
            Expanded(child: _buildStatBox(
              'Sisa Dana (30%)',
              _formatCurrency(totalAnggaran * 0.30),
              _amber600, _amber50,
            )),
          ]),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: _amber50,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: _amber100),
            ),
            child: Row(children: const [
              Icon(LucideIcons.info, size: 14, color: _amber600),
              SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Pencairan uang muka maks 70% dari total RAB. Sisa 30% dicairkan setelah LPJ diverifikasi.',
                  style: TextStyle(fontSize: 11, color: Color(0xFF92400E), height: 1.4),
                ),
              ),
            ]),
          ),
        ],
      ),
    );
  }

  Widget _buildStatBox(String label, String value, Color fg, Color bg) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(10)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: TextStyle(fontSize: 11, color: fg.withValues(alpha: 0.7), fontWeight: FontWeight.w500)),
        const SizedBox(height: 4),
        Text(value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: fg)),
      ]),
    );
  }

  Widget _buildPencairanList() {
    final list = (_vm.pencairanData?['pencairan_list'] as List?) ?? [];
    if (list.isEmpty) return const SizedBox.shrink();
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Text('Riwayat Pencairan', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: _slate800)),
          ),
          ...list.map((item) {
            final pct = (item['persentase'] as num?)?.toDouble() ?? 0;
            final nom = (item['nominal'] as num?)?.toDouble() ?? 0;
            final taken = item['is_taken'] == true || item['is_taken'] == 1;
            final tgl = item['tanggal_pencairan']?.toString();
            final catatan = item['catatan']?.toString();
            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: const BoxDecoration(border: Border(top: BorderSide(color: Color(0xFFF1F5F9)))),
              child: Row(children: [
                Container(
                  width: 40, height: 40,
                  decoration: BoxDecoration(
                    color: taken ? _emerald50 : _amber50,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    taken ? LucideIcons.checkCircle : LucideIcons.clock,
                    size: 18, color: taken ? _emerald700 : _amber600,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('${pct.toStringAsFixed(1)}% — ${_formatCurrency(nom)}',
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: _slate800)),
                  if (catatan != null && catatan.isNotEmpty)
                    Text(catatan, style: const TextStyle(fontSize: 12, color: _slate500)),
                  if (tgl != null)
                    Text(tgl.length >= 10 ? tgl.substring(0, 10) : tgl,
                        style: const TextStyle(fontSize: 11, color: _slate500)),
                ])),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: taken ? _emerald50 : _amber100,
                    borderRadius: BorderRadius.circular(99),
                  ),
                  child: Text(
                    taken ? 'Diambil' : 'Belum',
                    style: TextStyle(
                      fontSize: 10, fontWeight: FontWeight.bold,
                      color: taken ? _emerald700 : _amber600,
                    ),
                  ),
                ),
              ]),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildDanaDiambilButton() {
    final list = (_vm.pencairanData?['pencairan_list'] as List?) ?? [];
    if (list.isEmpty) return const SizedBox.shrink();
    return ElevatedButton.icon(
      onPressed: _vm.isSubmitting ? null : _handleTandaiDiambil,
      icon: _vm.isSubmitting
          ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
          : const Icon(LucideIcons.handCoins, size: 18),
      label: const Text('Tandai Dana Sudah Diambil', style: TextStyle(fontWeight: FontWeight.bold)),
      style: ElevatedButton.styleFrom(
        backgroundColor: _emerald700,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        padding: const EdgeInsets.symmetric(vertical: 16),
        elevation: 2,
        shadowColor: const Color(0x33047857),
      ),
    );
  }

  Widget _buildFormPencairan() {
    final sisaPersen = (_vm.pencairanData?['sisa_persen'] as num?)?.toDouble() ?? 70;
    final maxPersen = (_vm.pencairanData?['max_persen'] as num?)?.toDouble() ?? 70;

    if (sisaPersen <= 0) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: const [BoxShadow(color: Color(0x08000000), blurRadius: 8, offset: Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text('Form Pencairan Dana',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: _slate800)),
          const SizedBox(height: 4),
          Text('Masukkan persentase pencairan (maks ${maxPersen.toInt()}% uang muka)',
              style: const TextStyle(fontSize: 12, color: _slate500)),
          const SizedBox(height: 16),
          TextField(
            controller: _persentaseCtrl,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: InputDecoration(
              labelText: 'Persentase',
              suffixText: '%',
              hintText: 'Maks: ${sisaPersen.toStringAsFixed(1)}%',
              filled: true,
              fillColor: _slate50,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: _emerald600, width: 2)),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _catatanCtrl,
            maxLines: 2,
            decoration: InputDecoration(
              labelText: 'Catatan (opsional)',
              alignLabelWithHint: true,
              filled: true,
              fillColor: _slate50,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: _emerald600, width: 2)),
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: _vm.isSubmitting ? null : _handlePencairan,
            icon: _vm.isSubmitting
                ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : const Icon(LucideIcons.banknote, size: 18),
            label: const Text('Cairkan Dana', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
            style: ElevatedButton.styleFrom(
              backgroundColor: _emerald700,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              padding: const EdgeInsets.symmetric(vertical: 16),
              elevation: 2,
              shadowColor: const Color(0x33047857),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLockedInfo() {
    final deadline = _vm.pencairanData != null
        ? widget.kegiatan.deadlineLpj
        : null;
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: _emerald50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _emerald100),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: const BoxDecoration(color: _emerald100, shape: BoxShape.circle),
            child: const Icon(LucideIcons.clipboardList, size: 20, color: _emerald700),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Pencairan Selesai — Menunggu LPJ',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: _emerald700)),
                const SizedBox(height: 4),
                const Text(
                  'Uang muka 70% sudah dicairkan. Pengusul sekarang wajib menyerahkan LPJ. '
                  'Status tidak dapat dikembalikan ke tahap pengusul.',
                  style: TextStyle(fontSize: 13, color: Color(0xFF065F46), height: 1.5),
                ),
                if (deadline != null) ...[
                  const SizedBox(height: 8),
                  Row(children: [
                    const Icon(LucideIcons.calendar, size: 14, color: _emerald600),
                    const SizedBox(width: 6),
                    Text(
                      'Deadline LPJ: $deadline',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: _emerald600),
                    ),
                  ]),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
