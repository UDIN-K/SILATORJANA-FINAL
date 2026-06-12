import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:file_picker/file_picker.dart';
import '../../kegiatan/models/kegiatan.dart';
import '../viewmodels/lpj_viewmodel.dart';

/// LPJ Upload/Input view — for pengusul to submit LPJ after funds disbursed.
/// - Fetch LPJ detail (RAB + IKU)
/// - Input realisasi per RAB item (qty, harga satuan)
/// - Pick and upload kuitansi/bukti files for each RAB item
/// - Input capaian per IKU (%)
/// - Submit ke /lpj/submit via multipart
class LpjUploadView extends StatefulWidget {
  final Kegiatan kegiatan;
  const LpjUploadView({super.key, required this.kegiatan});

  @override
  State<LpjUploadView> createState() => _LpjUploadViewState();
}

class _LpjUploadViewState extends State<LpjUploadView> {
  final LpjViewModel _vm = LpjViewModel();
  final _catatanCtrl = TextEditingController();

  // realisasiMap: rabId -> {qty1, satuan1, qty2, satuan2, qty3, satuan3, harga_satuan}
  final Map<String, TextEditingController> _qtyControllers = {}; // tracks qty1
  final Map<String, TextEditingController> _satuan1Controllers = {};
  final Map<String, TextEditingController> _qty2Controllers = {};
  final Map<String, TextEditingController> _satuan2Controllers = {};
  final Map<String, TextEditingController> _qty3Controllers = {};
  final Map<String, TextEditingController> _satuan3Controllers = {};
  final Map<String, TextEditingController> _hargaControllers = {};
  // ikuCapaian: ikuId -> capaian %
  final Map<String, TextEditingController> _ikuControllers = {};

  // pickedFiles: rabId -> list of PlatformFile
  final Map<String, List<PlatformFile>> _pickedFiles = {};

  static const _emerald700 = Color(0xFF047857);
  static const _emerald600 = Color(0xFF059669);
  static const _emerald50 = Color(0xFFECFDF5);
  static const _slate50 = Color(0xFFF8FAFC);
  static const _slate400 = Color(0xFF94A3B8);
  static const _slate500 = Color(0xFF64748B);
  static const _slate800 = Color(0xFF1E293B);

  @override
  void initState() {
    super.initState();
    _vm.fetchLpjDetail(widget.kegiatan.id);
    _vm.addListener(_onDetailLoaded);
  }

  void _onDetailLoaded() {
    if (!_vm.isDetailLoading && _vm.lpjDetail != null) {
      _initControllers();
    }
  }

  void _initControllers() {
    final detail = _vm.lpjDetail!;
    final rabGroups = detail['rab'] as Map<String, dynamic>? ?? {};

    for (final group in rabGroups.values) {
      final items = (group['items'] as List?) ?? [];
      for (final item in items) {
        final rabId = item['id'].toString();
        if (!_qtyControllers.containsKey(rabId)) {
          _qtyControllers[rabId] = TextEditingController(
            text: item['real_qty1']?.toString() ?? item['qty1']?.toString() ?? '1',
          );
          _satuan1Controllers[rabId] = TextEditingController(
            text: item['real_satuan1']?.toString() ?? item['satuan1']?.toString() ?? '',
          );
          _qty2Controllers[rabId] = TextEditingController(
            text: item['real_qty2']?.toString() ?? item['qty2']?.toString() ?? '1',
          );
          _satuan2Controllers[rabId] = TextEditingController(
            text: item['real_satuan2']?.toString() ?? item['satuan2']?.toString() ?? '',
          );
          _qty3Controllers[rabId] = TextEditingController(
            text: item['real_qty3']?.toString() ?? item['qty3']?.toString() ?? '',
          );
          _satuan3Controllers[rabId] = TextEditingController(
            text: item['real_satuan3']?.toString() ?? item['satuan3']?.toString() ?? '',
          );
          _hargaControllers[rabId] = TextEditingController(
            text: item['real_harga_satuan']?.toString() ?? item['harga_satuan']?.toString() ?? '0',
          );
        }
      }
    }

    final ikuList = (detail['iku'] as List?) ?? [];
    for (final iku in ikuList) {
      final ikuId = iku['id'].toString();
      if (!_ikuControllers.containsKey(ikuId)) {
        _ikuControllers[ikuId] = TextEditingController(
          text: iku['capaian_persen']?.toString() ?? '',
        );
      }
    }

    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _vm.removeListener(_onDetailLoaded);
    _vm.dispose();
    _catatanCtrl.dispose();
    for (final c in _qtyControllers.values) c.dispose();
    for (final c in _satuan1Controllers.values) c.dispose();
    for (final c in _qty2Controllers.values) c.dispose();
    for (final c in _satuan2Controllers.values) c.dispose();
    for (final c in _qty3Controllers.values) c.dispose();
    for (final c in _satuan3Controllers.values) c.dispose();
    for (final c in _hargaControllers.values) c.dispose();
    for (final c in _ikuControllers.values) c.dispose();
    super.dispose();
  }

  InputDecoration _inputDecoration({String? prefixText}) {
    return InputDecoration(
      prefixText: prefixText,
      prefixStyle: const TextStyle(fontSize: 13, color: _slate500),
      filled: true,
      fillColor: _slate50,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: _emerald600, width: 2)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
    );
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

  Future<void> _pickFileForRab(String rabId) async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'png', 'jpg', 'jpeg', 'doc', 'docx', 'xls', 'xlsx'],
        allowMultiple: true,
      );

      if (result == null) return;

      setState(() {
        if (!_pickedFiles.containsKey(rabId)) {
          _pickedFiles[rabId] = [];
        }

        for (final file in result.files) {
          if (kIsWeb) {
            if (file.bytes != null) {
              _pickedFiles[rabId]!.add(file);
            }
          } else {
            if (file.path != null) {
              _pickedFiles[rabId]!.add(file);
            }
          }
        }
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('Gagal memilih file: $e'),
        backgroundColor: Colors.red,
      ));
    }
  }

  void _removePickedFile(String rabId, int index) {
    setState(() {
      _pickedFiles[rabId]?.removeAt(index);
    });
  }

  Future<void> _handleSubmit() async {
    // Validate realisasi values
    for (final entry in _qtyControllers.entries) {
      final rabId = entry.key;
      final q1 = double.tryParse(entry.value.text);
      if (q1 == null || q1 <= 0) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Kuantitas realisasi 1 harus lebih dari 0'),
          backgroundColor: Colors.red,
        ));
        return;
      }

      final q2 = double.tryParse(_qty2Controllers[rabId]?.text ?? '');
      if (q2 == null || q2 <= 0) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Kuantitas realisasi 2 harus lebih dari 0'),
          backgroundColor: Colors.red,
        ));
        return;
      }

      final q3Text = _qty3Controllers[rabId]?.text ?? '';
      if (q3Text.isNotEmpty) {
        final q3 = double.tryParse(q3Text);
        if (q3 == null || q3 <= 0) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('Kuantitas realisasi 3 harus lebih dari 0'),
            backgroundColor: Colors.red,
          ));
          return;
        }
      }

      final h = double.tryParse(_hargaControllers[rabId]?.text ?? '');
      if (h == null || h < 0) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Harga realisasi tidak boleh negatif'),
          backgroundColor: Colors.red,
        ));
        return;
      }
    }

    // Validate IKU capaian
    for (final entry in _ikuControllers.entries) {
      final val = double.tryParse(entry.value.text);
      if (val == null || val < 0 || val > 100) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Capaian IKU harus di antara 0 s/d 100%'),
          backgroundColor: Colors.red,
        ));
        return;
      }
    }

    // Build realisasi map
    final Map<String, Map<String, dynamic>> realisasi = {};
    for (final entry in _qtyControllers.entries) {
      final rabId = entry.key;
      final q3Text = _qty3Controllers[rabId]?.text ?? '';
      final q3Val = q3Text.isNotEmpty ? (double.tryParse(q3Text) ?? 1) : null;
      realisasi[rabId] = {
        'qty1': double.tryParse(entry.value.text) ?? 1,
        'satuan1': _satuan1Controllers[rabId]?.text ?? '',
        'qty2': double.tryParse(_qty2Controllers[rabId]?.text ?? '1') ?? 1,
        'satuan2': _satuan2Controllers[rabId]?.text ?? '',
        'qty3': q3Val,
        'satuan3': _satuan3Controllers[rabId]?.text ?? '',
        'harga_satuan': double.tryParse(_hargaControllers[rabId]?.text ?? '0') ?? 0,
      };
    }

    // Build IKU capaian map
    final Map<String, double> ikuCapaian = {};
    for (final entry in _ikuControllers.entries) {
      final val = double.tryParse(entry.value.text);
      if (val != null) ikuCapaian[entry.key] = val;
    }

    // Check if at least one file is picked
    int fileCount = 0;
    for (final list in _pickedFiles.values) {
      fileCount += list.length;
    }

    final detail = _vm.lpjDetail;
    final existingLpj = detail?['lpj'];
    
    // Check if we have at least one file or if files already exist on backend
    bool hasExistingFiles = false;
    if (detail != null && detail['rab'] != null) {
      final rabGroups = detail['rab'] as Map<String, dynamic>;
      for (final group in rabGroups.values) {
        final items = (group['items'] as List?) ?? [];
        for (final item in items) {
          if (item['existing_files'] != null && (item['existing_files'] as List).isNotEmpty) {
            hasExistingFiles = true;
            break;
          }
        }
      }
    }

    if (fileCount == 0 && !hasExistingFiles && existingLpj == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Minimal upload 1 file bukti kuitansi'),
        backgroundColor: Colors.red,
      ));
      return;
    }

    final result = await _vm.submitLpjMultipart(
      kegiatanId: widget.kegiatan.id,
      catatan: _catatanCtrl.text,
      realisasi: realisasi,
      ikuCapaian: ikuCapaian,
      files: _pickedFiles,
    );

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(result['message'] ?? ''),
        backgroundColor: result['success'] == true ? _emerald700 : Colors.red,
      ));
      if (result['success'] == true) Navigator.pop(context, true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _slate50,
      appBar: AppBar(
        title: const Text('Input LPJ & Realisasi', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17)),
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
          if (_vm.isDetailLoading) {
            return const Center(child: CircularProgressIndicator(color: _emerald700));
          }
          if (_vm.lpjDetail == null) {
            return Center(
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                const Icon(LucideIcons.alertTriangle, size: 48, color: Colors.orange),
                const SizedBox(height: 12),
                const Text('Gagal memuat data LPJ', style: TextStyle(color: _slate500)),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => _vm.fetchLpjDetail(widget.kegiatan.id),
                  style: ElevatedButton.styleFrom(backgroundColor: _emerald700, foregroundColor: Colors.white),
                  child: const Text('Coba Lagi'),
                ),
              ]),
            );
          }

          final detail = _vm.lpjDetail!;
          final rabGroups = detail['rab'] as Map<String, dynamic>? ?? {};
          final ikuList = (detail['iku'] as List?) ?? [];
          final existingLpj = detail['lpj'] as Map<String, dynamic>?;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _buildInfoCard(),
                if (existingLpj != null) ...[
                  const SizedBox(height: 12),
                  _buildExistingLpjBanner(existingLpj),
                ],
                const SizedBox(height: 16),
                // RAB Realisasi
                ...rabGroups.entries.map((e) => _buildRabGroup(e.key, e.value)),
                const SizedBox(height: 16),
                // IKU Capaian
                if (ikuList.isNotEmpty) ...[
                  _buildIkuSection(ikuList),
                  const SizedBox(height: 16),
                ],
                // Catatan
                _buildCard(
                  title: 'Catatan LPJ',
                  child: TextField(
                    controller: _catatanCtrl,
                    maxLines: 4,
                    decoration: InputDecoration(
                      hintText: 'Tuliskan ringkasan pelaksanaan kegiatan...',
                      hintStyle: const TextStyle(color: _slate400, fontSize: 13),
                      filled: true,
                      fillColor: _slate50,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: _emerald600, width: 2)),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  onPressed: _vm.isSubmitting ? null : _handleSubmit,
                  icon: _vm.isSubmitting
                      ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Icon(LucideIcons.send, size: 18),
                  label: const Text('Kirim LPJ', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _emerald700,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    elevation: 2,
                    shadowColor: const Color(0x33047857),
                  ),
                ),
                const SizedBox(height: 32),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildInfoCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF047857), Color(0xFF059669)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('LAPORAN PERTANGGUNGJAWABAN',
            style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.0)),
        const SizedBox(height: 8),
        Text(widget.kegiatan.namaKegiatan,
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
        const SizedBox(height: 8),
        if (widget.kegiatan.totalAnggaran != null)
          Text(_formatCurrency(widget.kegiatan.totalAnggaran!),
              style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w900)),
        const Text('Total RAB', style: TextStyle(color: Colors.white70, fontSize: 12)),
      ]),
    );
  }

  Widget _buildExistingLpjBanner(Map<String, dynamic> lpj) {
    final status = lpj['status_verifikasi']?.toString() ?? '';
    final catatan = lpj['catatan_bendahara']?.toString() ?? lpj['catatan_verifikasi']?.toString();
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF3C7),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFFDE68A)),
      ),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Icon(LucideIcons.alertTriangle, size: 18, color: Color(0xFF92400E)),
        const SizedBox(width: 10),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('LPJ sebelumnya: ${status.replaceAll('_', ' ').toUpperCase()}',
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF92400E))),
          if (catatan != null && catatan.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(catatan, style: const TextStyle(fontSize: 12, color: Color(0xFF78350F))),
          ],
        ])),
      ]),
    );
  }

  Widget _buildRabGroup(String kategori, dynamic groupData) {
    final label = groupData['label']?.toString() ?? kategori;
    final items = (groupData['items'] as List?) ?? [];
    if (items.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: _buildCard(
        title: 'Realisasi: $label',
        child: Column(children: items.map<Widget>((item) => _buildRabRealisasiItem(item)).toList()),
      ),
    );
  }

  Widget _buildRabRealisasiItem(Map<String, dynamic> item) {
    final rabId = item['id'].toString();
    final uraian = item['uraian']?.toString() ?? '-';
    final hargaTarget = item['harga_satuan'];
    final totalTarget = item['total'];
    final qty1Ctrl = _qtyControllers[rabId];
    final satuan1Ctrl = _satuan1Controllers[rabId];
    final qty2Ctrl = _qty2Controllers[rabId];
    final satuan2Ctrl = _satuan2Controllers[rabId];
    final qty3Ctrl = _qty3Controllers[rabId];
    final satuan3Ctrl = _satuan3Controllers[rabId];
    final hargaCtrl = _hargaControllers[rabId];

    if (qty1Ctrl == null || satuan1Ctrl == null || qty2Ctrl == null || satuan2Ctrl == null ||
        qty3Ctrl == null || satuan3Ctrl == null || hargaCtrl == null) {
      return const SizedBox.shrink();
    }

    final hasQty3 = item['qty3'] != null && item['qty3'] != 0;

    // Calculate real total for display
    final q1 = double.tryParse(qty1Ctrl.text) ?? 0;
    final q2 = double.tryParse(qty2Ctrl.text) ?? 1;
    final q3Text = qty3Ctrl.text;
    final q3 = hasQty3 && q3Text.isNotEmpty ? (double.tryParse(q3Text) ?? 1) : 1;
    final h = double.tryParse(hargaCtrl.text) ?? 0.0;
    final realTotal = q1 * q2 * q3 * h;

    return Container(
      padding: const EdgeInsets.only(bottom: 16, top: 4),
      decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9)))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(uraian, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: _slate800)),
        const SizedBox(height: 4),
        Text(
          'Target: ${_formatCurrency(hargaTarget)} × ${item['qty1'] ?? 1}${item['qty2'] != null && item['qty2'] != 1 ? ' × ${item['qty2']}' : ''}${item['qty3'] != null && item['qty3'] != 0 ? ' × ${item['qty3']}' : ''} = ${_formatCurrency(totalTarget)}',
          style: const TextStyle(fontSize: 11, color: _slate500),
        ),
        const SizedBox(height: 10),
        
        // Row 1: Qty 1 & Satuan 1
        Row(children: [
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('Vol 1 Realisasi', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: _slate500)),
              const SizedBox(height: 4),
              TextField(
                controller: qty1Ctrl,
                keyboardType: TextInputType.number,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                style: const TextStyle(fontSize: 13),
                decoration: _inputDecoration(),
                onChanged: (_) => setState(() {}),
              ),
            ]),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('Satuan 1 Realisasi', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: _slate500)),
              const SizedBox(height: 4),
              TextField(
                controller: satuan1Ctrl,
                style: const TextStyle(fontSize: 13),
                decoration: _inputDecoration(),
                onChanged: (_) => setState(() {}),
              ),
            ]),
          ),
        ]),
        const SizedBox(height: 10),

        // Row 2: Qty 2 & Satuan 2
        Row(children: [
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('Vol 2 Realisasi', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: _slate500)),
              const SizedBox(height: 4),
              TextField(
                controller: qty2Ctrl,
                keyboardType: TextInputType.number,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                style: const TextStyle(fontSize: 13),
                decoration: _inputDecoration(),
                onChanged: (_) => setState(() {}),
              ),
            ]),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('Satuan 2 Realisasi', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: _slate500)),
              const SizedBox(height: 4),
              TextField(
                controller: satuan2Ctrl,
                style: const TextStyle(fontSize: 13),
                decoration: _inputDecoration(),
                onChanged: (_) => setState(() {}),
              ),
            ]),
          ),
        ]),
        const SizedBox(height: 10),

        // Row 3: Qty 3 & Satuan 3 (if applicable)
        if (hasQty3) ...[
          Row(children: [
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('Vol 3 Realisasi', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: _slate500)),
                const SizedBox(height: 4),
                TextField(
                  controller: qty3Ctrl,
                  keyboardType: TextInputType.number,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  style: const TextStyle(fontSize: 13),
                  decoration: _inputDecoration(),
                  onChanged: (_) => setState(() {}),
                ),
              ]),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('Satuan 3 Realisasi', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: _slate500)),
                const SizedBox(height: 4),
                TextField(
                  controller: satuan3Ctrl,
                  style: const TextStyle(fontSize: 13),
                  decoration: _inputDecoration(),
                  onChanged: (_) => setState(() {}),
                ),
              ]),
            ),
          ]),
          const SizedBox(height: 10),
        ],

        // Row 4: Harga Satuan Realisasi & Total Realisasi
        Row(children: [
          Expanded(
            flex: 2,
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('Harga Satuan Realisasi', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: _slate500)),
              const SizedBox(height: 4),
              TextField(
                controller: hargaCtrl,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d*'))],
                style: const TextStyle(fontSize: 13),
                decoration: _inputDecoration(prefixText: 'Rp '),
                onChanged: (_) => setState(() {}),
              ),
            ]),
          ),
          const SizedBox(width: 12),
          Expanded(
            flex: 1,
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('Total Realisasi', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: _slate500)),
              const SizedBox(height: 4),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                decoration: BoxDecoration(
                  color: _emerald50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFD1FAE5)),
                ),
                child: Text(
                  _formatCurrency(realTotal),
                  style: const TextStyle(fontSize: 12, color: _emerald700, fontWeight: FontWeight.bold),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ]),
          ),
        ]),
        const SizedBox(height: 12),
        const Text('File Bukti / Kuitansi', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: _slate500)),
        const SizedBox(height: 6),
        // Display existing files from server
        if (item['existing_files'] != null && (item['existing_files'] as List).isNotEmpty) ...[
          Wrap(
            spacing: 8,
            runSpacing: 6,
            children: (item['existing_files'] as List).map<Widget>((file) {
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: _emerald50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFFD1FAE5)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(LucideIcons.fileText, size: 14, color: _emerald700),
                    const SizedBox(width: 6),
                    Text(
                      file['original_name']?.toString() ?? 'File',
                      style: const TextStyle(fontSize: 12, color: _emerald700, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(width: 6),
                    InkWell(
                      onTap: () async {
                        final fileId = file['file_id'];
                        if (fileId == null) return;
                        final confirm = await showDialog<bool>(
                          context: context,
                          builder: (ctx) => AlertDialog(
                            title: const Text('Hapus File'),
                            content: Text('Hapus file "${file['original_name']}"?'),
                            actions: [
                              TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Batal')),
                              TextButton(
                                onPressed: () => Navigator.pop(ctx, true),
                                child: const Text('Hapus', style: TextStyle(color: Colors.red)),
                              ),
                            ],
                          ),
                        );
                        if (confirm == true) {
                          final ok = await _vm.deleteLpjFile(fileId);
                          if (ok && mounted) {
                            _vm.fetchLpjDetail(widget.kegiatan.id);
                          } else if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                              content: Text('Gagal menghapus file'),
                              backgroundColor: Colors.red,
                            ));
                          }
                        }
                      },
                      child: const Icon(LucideIcons.x, size: 14, color: Colors.red),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 8),
        ],
        // Display picked files
        if (_pickedFiles[rabId] != null && _pickedFiles[rabId]!.isNotEmpty) ...[
          Wrap(
            spacing: 8,
            runSpacing: 6,
            children: List.generate(_pickedFiles[rabId]!.length, (idx) {
              final file = _pickedFiles[rabId]![idx];
              return Chip(
                label: Text(file.name, style: const TextStyle(fontSize: 11)),
                onDeleted: () => _removePickedFile(rabId, idx),
                backgroundColor: _slate50,
                deleteIconColor: Colors.red,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                padding: EdgeInsets.zero,
              );
            }),
          ),
          const SizedBox(height: 8),
        ],
        OutlinedButton.icon(
          onPressed: () => _pickFileForRab(rabId),
          icon: const Icon(LucideIcons.plus, size: 14),
          label: const Text('Tambah File Bukti / Kuitansi', style: TextStyle(fontSize: 12)),
          style: OutlinedButton.styleFrom(
            foregroundColor: _emerald700,
            side: const BorderSide(color: Color(0xFFD1FAE5)),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
          ),
        ),
      ]),
    );
  }

  Widget _buildIkuSection(List<dynamic> ikuList) {
    return _buildCard(
      title: 'Capaian IKU',
      child: Column(
        children: ikuList.map<Widget>((iku) {
          final ikuId = iku['id'].toString();
          final nama = iku['nama_iku']?.toString() ?? '-';
          final target = iku['target_persen'];
          final ctrl = _ikuControllers[ikuId];
          if (ctrl == null) return const SizedBox.shrink();

          return Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Container(width: 6, height: 6, decoration: const BoxDecoration(color: _emerald600, shape: BoxShape.circle)),
                const SizedBox(width: 8),
                Expanded(child: Text(nama, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: _slate800))),
                if (target != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(color: _emerald50, borderRadius: BorderRadius.circular(99)),
                    child: Text('Target: $target%', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: _emerald700)),
                  ),
              ]),
              const SizedBox(height: 8),
              TextField(
                controller: ctrl,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d*'))],
                style: const TextStyle(fontSize: 13),
                decoration: InputDecoration(
                  labelText: 'Capaian (%)',
                  suffixText: '%',
                  filled: true, fillColor: _slate50,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: _emerald600, width: 2)),
                ),
              ),
            ]),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildCard({required String title, required Widget child, EdgeInsets? padding}) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0).withValues(alpha: 0.6)),
        boxShadow: const [BoxShadow(color: Color(0x08000000), blurRadius: 8, offset: Offset(0, 2))],
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          decoration: const BoxDecoration(
            color: Color(0xFFFAFAFB),
            border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9))),
            borderRadius: BorderRadius.only(topLeft: Radius.circular(16), topRight: Radius.circular(16)),
          ),
          child: Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: _slate800)),
        ),
        Padding(padding: padding ?? const EdgeInsets.all(16), child: child),
      ]),
    );
  }
}
