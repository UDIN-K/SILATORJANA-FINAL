import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'dart:convert';
import '../../kegiatan/models/kegiatan.dart';
import '../../../core/network/api_service.dart';

/// Submit ke PPK View — for pengusul to submit proposal to PPK after verified.
/// - Upload surat pengantar (text path / link)
/// - Input daftar penanggung jawab
/// Calls: POST /kegiatan/{id}/submit-ppk
class SubmitPpkView extends StatefulWidget {
  final Kegiatan kegiatan;
  const SubmitPpkView({super.key, required this.kegiatan});

  @override
  State<SubmitPpkView> createState() => _SubmitPpkViewState();
}

class _SubmitPpkViewState extends State<SubmitPpkView> {
  final ApiService _api = ApiService();
  final _suratCtrl = TextEditingController();
  final List<TextEditingController> _pjControllers = [TextEditingController()];
  bool _isSubmitting = false;

  static const _emerald700 = Color(0xFF047857);
  static const _emerald600 = Color(0xFF059669);
  static const _emerald50 = Color(0xFFECFDF5);
  static const _emerald100 = Color(0xFFD1FAE5);
  static const _slate50 = Color(0xFFF8FAFC);
  static const _slate100 = Color(0xFFF1F5F9);
  static const _slate400 = Color(0xFF94A3B8);
  static const _slate500 = Color(0xFF64748B);
  static const _slate600 = Color(0xFF475569);
  static const _slate800 = Color(0xFF1E293B);

  @override
  void initState() {
    super.initState();
    // Populate existing penanggung jawab if any
    final existing = widget.kegiatan.penanggungJawab;
    if (existing.isNotEmpty) {
      _pjControllers.clear();
      for (final pj in existing) {
        _pjControllers.add(TextEditingController(text: pj.toString()));
      }
    }
    // Existing surat pengantar
    if (widget.kegiatan.suratPengantarFilename != null) {
      _suratCtrl.text = widget.kegiatan.suratPengantarFilename!;
    }
  }

  @override
  void dispose() {
    _suratCtrl.dispose();
    for (final c in _pjControllers) c.dispose();
    super.dispose();
  }

  void _addPj() {
    setState(() => _pjControllers.add(TextEditingController()));
  }

  void _removePj(int index) {
    if (_pjControllers.length <= 1) return;
    setState(() {
      _pjControllers[index].dispose();
      _pjControllers.removeAt(index);
    });
  }

  Future<void> _handleSubmit() async {
    final pjList = _pjControllers
        .map((c) => c.text.trim())
        .where((s) => s.isNotEmpty)
        .toList();

    if (pjList.isEmpty) {
      _showSnackBar('Minimal isi 1 penanggung jawab', isError: true);
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final body = <String, dynamic>{
        'penanggung_jawab': pjList,
      };
      if (_suratCtrl.text.trim().isNotEmpty) {
        body['surat_pengantar_path'] = _suratCtrl.text.trim();
        body['surat_pengantar_filename'] = _suratCtrl.text.trim().split('/').last;
      }

      final response = await _api.post(
        '/kegiatan/${widget.kegiatan.id}/submit-ppk',
        body: body,
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        if (mounted) {
          _showSnackBar('Berhasil! Proposal diteruskan ke PPK.');
          Navigator.pop(context, true);
        }
      } else {
        final data = jsonDecode(response.body);
        if (mounted) _showSnackBar(data['message'] ?? 'Gagal mengirim ke PPK', isError: true);
      }
    } catch (e) {
      if (mounted) _showSnackBar('Kesalahan jaringan: $e', isError: true);
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
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
        title: const Text('Submit ke PPK', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17)),
        backgroundColor: Colors.white,
        foregroundColor: _slate800,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: const Color(0xFFE2E8F0)),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header card
            Container(
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
              child: Row(children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(10)),
                  child: const Icon(LucideIcons.sendHorizontal, size: 22, color: Colors.white),
                ),
                const SizedBox(width: 14),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const Text('Teruskan ke PPK', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w500)),
                  const SizedBox(height: 4),
                  Text(widget.kegiatan.namaKegiatan,
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                      maxLines: 2, overflow: TextOverflow.ellipsis),
                ])),
              ]),
            ),
            const SizedBox(height: 16),

            // Info banner
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: _emerald50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: _emerald100),
              ),
              child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Icon(LucideIcons.info, size: 16, color: _emerald600),
                const SizedBox(width: 10),
                const Expanded(
                  child: Text(
                    'Lengkapi surat pengantar dan daftar penanggung jawab kegiatan sebelum meneruskan ke PPK.',
                    style: TextStyle(fontSize: 12, color: Color(0xFF065F46), height: 1.4),
                  ),
                ),
              ]),
            ),
            const SizedBox(height: 20),

            // Surat pengantar
            _buildCard(
              title: 'Surat Pengantar',
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text(
                  'Upload surat pengantar dari Ketua Jurusan / Wakil Direktur',
                  style: TextStyle(fontSize: 12, color: _slate500, height: 1.4),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _suratCtrl,
                  decoration: InputDecoration(
                    labelText: 'Nama / Path File Surat Pengantar',
                    hintText: 'Contoh: surat_pengantar_kegiatan.pdf',
                    hintStyle: const TextStyle(fontSize: 12, color: _slate400),
                    prefixIcon: const Icon(LucideIcons.fileText, size: 18, color: _slate400),
                    filled: true, fillColor: _slate50,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: _emerald600, width: 2)),
                  ),
                ),
              ]),
            ),
            const SizedBox(height: 16),

            // Penanggung Jawab
            _buildCard(
              title: 'Penanggung Jawab Kegiatan',
              child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                const Text('Tambahkan nama-nama penanggung jawab kegiatan ini',
                    style: TextStyle(fontSize: 12, color: _slate500)),
                const SizedBox(height: 12),
                ...List.generate(_pjControllers.length, (i) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Row(children: [
                      Container(
                        width: 32, height: 32,
                        margin: const EdgeInsets.only(right: 10),
                        decoration: BoxDecoration(color: _emerald50, borderRadius: BorderRadius.circular(8)),
                        child: Center(
                          child: Text('${i + 1}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: _emerald700)),
                        ),
                      ),
                      Expanded(
                        child: TextField(
                          controller: _pjControllers[i],
                          style: const TextStyle(fontSize: 13),
                          decoration: InputDecoration(
                            hintText: 'Nama Penanggung Jawab',
                            hintStyle: const TextStyle(fontSize: 12, color: _slate400),
                            filled: true, fillColor: _slate50,
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: _emerald600, width: 2)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                          ),
                        ),
                      ),
                      if (_pjControllers.length > 1) ...[
                        const SizedBox(width: 8),
                        IconButton(
                          onPressed: () => _removePj(i),
                          icon: const Icon(LucideIcons.x, size: 18, color: Colors.red),
                          visualDensity: VisualDensity.compact,
                        ),
                      ],
                    ]),
                  );
                }),
                const SizedBox(height: 4),
                OutlinedButton.icon(
                  onPressed: _addPj,
                  icon: const Icon(LucideIcons.plus, size: 16),
                  label: const Text('Tambah Penanggung Jawab'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: _emerald700,
                    side: const BorderSide(color: _emerald100),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ]),
            ),
            const SizedBox(height: 24),

            ElevatedButton.icon(
              onPressed: _isSubmitting ? null : _handleSubmit,
              icon: _isSubmitting
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Icon(LucideIcons.sendHorizontal, size: 18),
              label: const Text('Teruskan ke PPK', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
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
      ),
    );
  }

  Widget _buildCard({required String title, required Widget child}) {
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
        Padding(padding: const EdgeInsets.all(16), child: child),
      ]),
    );
  }
}
