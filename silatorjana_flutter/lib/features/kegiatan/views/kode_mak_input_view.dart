import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'dart:convert';
import '../../../core/network/api_service.dart';

/// Bottom sheet / dialog untuk verifikator input Kode MAK.
/// Calls: PATCH /kegiatan/{id}/kode-mak
Future<String?> showKodeMakInputSheet(BuildContext context, int kegiatanId, String? currentKodeMak) {
  return showModalBottomSheet<String>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => _KodeMakInputSheet(kegiatanId: kegiatanId, currentKodeMak: currentKodeMak),
  );
}

class _KodeMakInputSheet extends StatefulWidget {
  final int kegiatanId;
  final String? currentKodeMak;
  const _KodeMakInputSheet({required this.kegiatanId, this.currentKodeMak});

  @override
  State<_KodeMakInputSheet> createState() => _KodeMakInputSheetState();
}

class _KodeMakInputSheetState extends State<_KodeMakInputSheet> {
  final ApiService _api = ApiService();
  late final TextEditingController _ctrl;
  bool _isSubmitting = false;
  String? _error;

  static const _emerald700 = Color(0xFF047857);
  static const _emerald600 = Color(0xFF059669);
  static const _emerald50 = Color(0xFFECFDF5);
  static const _emerald100 = Color(0xFFD1FAE5);
  static const _slate50 = Color(0xFFF8FAFC);
  static const _slate400 = Color(0xFF94A3B8);
  static const _slate500 = Color(0xFF64748B);
  static const _slate600 = Color(0xFF475569);
  static const _slate800 = Color(0xFF1E293B);

  @override
  void initState() {
    super.initState();
    _ctrl = TextEditingController(text: widget.currentKodeMak ?? '');
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _handleSave() async {
    final kode = _ctrl.text.trim();
    if (kode.isEmpty) {
      setState(() => _error = 'Kode MAK tidak boleh kosong');
      return;
    }

    setState(() { _isSubmitting = true; _error = null; });

    try {
      final response = await _api.put(
        '/kegiatan/${widget.kegiatanId}',
        body: {'kode_mak': kode},
      );

      if (response.statusCode == 200) {
        if (mounted) Navigator.pop(context, kode);
      } else {
        final data = jsonDecode(response.body);
        setState(() => _error = data['message'] ?? 'Gagal menyimpan Kode MAK');
      }
    } catch (e) {
      setState(() => _error = 'Kesalahan jaringan: $e');
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      padding: EdgeInsets.only(bottom: bottomInset),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: const [BoxShadow(color: Color(0x14000000), blurRadius: 20, offset: Offset(0, -4))],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Handle bar
          Center(
            child: Container(
              width: 40, height: 4,
              margin: const EdgeInsets.only(top: 12, bottom: 20),
              decoration: BoxDecoration(
                color: const Color(0xFFE2E8F0),
                borderRadius: BorderRadius.circular(99),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Header
                Row(children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(color: _emerald50, borderRadius: BorderRadius.circular(12)),
                    child: const Icon(LucideIcons.hash, size: 20, color: _emerald700),
                  ),
                  const SizedBox(width: 14),
                  Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const Text('Input Kode MAK',
                        style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: _slate800)),
                    Text('Mata Anggaran Kegiatan',
                        style: const TextStyle(fontSize: 12, color: _slate500)),
                  ]),
                ]),
                const SizedBox(height: 20),

                // Info
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: _emerald50,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: _emerald100),
                  ),
                  child: const Row(children: [
                    Icon(LucideIcons.info, size: 14, color: _emerald600),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Kode MAK akan ditampilkan di halaman detail proposal dan bisa dilihat oleh semua pihak yang terkait.',
                        style: TextStyle(fontSize: 11, color: Color(0xFF065F46), height: 1.4),
                      ),
                    ),
                  ]),
                ),
                const SizedBox(height: 16),

                // Input
                TextField(
                  controller: _ctrl,
                  autofocus: true,
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, letterSpacing: 2, color: _slate800),
                  textCapitalization: TextCapitalization.characters,
                  decoration: InputDecoration(
                    labelText: 'Kode MAK',
                    hintText: 'Contoh: 521211',
                    hintStyle: const TextStyle(color: _slate400, fontWeight: FontWeight.normal, letterSpacing: 0, fontSize: 14),
                    prefixIcon: const Icon(LucideIcons.tag, size: 18, color: _slate400),
                    errorText: _error,
                    filled: true, fillColor: _slate50,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: _emerald600, width: 2)),
                    errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Colors.red)),
                  ),
                ),
                const SizedBox(height: 20),

                // Buttons
                Row(children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: _slate600,
                        side: const BorderSide(color: Color(0xFFE2E8F0)),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      child: const Text('Batal', style: TextStyle(fontWeight: FontWeight.w600)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: ElevatedButton.icon(
                      onPressed: _isSubmitting ? null : _handleSave,
                      icon: _isSubmitting
                          ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : const Icon(LucideIcons.save, size: 16),
                      label: const Text('Simpan Kode MAK', style: TextStyle(fontWeight: FontWeight.bold)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _emerald700,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        elevation: 2,
                        shadowColor: const Color(0x33047857),
                      ),
                    ),
                  ),
                ]),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
