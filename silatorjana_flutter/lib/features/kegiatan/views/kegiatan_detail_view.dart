import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../models/kegiatan.dart';
import '../../auth/models/user.dart';
import '../viewmodels/kegiatan_viewmodel.dart';
import '../../monitoring/views/timeline_view.dart';
import 'kegiatan_print_view.dart';
import 'kode_mak_input_view.dart';
import 'submit_ppk_view.dart';
import '../../lpj/views/lpj_upload_view.dart';
import '../../lpj/viewmodels/lpj_viewmodel.dart';
import '../../bendahara/views/pencairan_view.dart';

/// Detail view for a single Kegiatan/Usulan proposal.
/// Mirrors the web's DetailUsulanPage.tsx layout: header, progress tracker,
/// info grid, KAK, IKU table, RAB table, history timeline, and action buttons.
class KegiatanDetailView extends StatefulWidget {
  final Kegiatan kegiatan;
  final User currentUser;

  const KegiatanDetailView({super.key, required this.kegiatan, required this.currentUser});

  @override
  State<KegiatanDetailView> createState() => _KegiatanDetailViewState();
}

class _KegiatanDetailViewState extends State<KegiatanDetailView> {
  final KegiatanViewModel _vm = KegiatanViewModel();

  // Design tokens
  static const _emerald700 = Color(0xFF047857);
  static const _emerald600 = Color(0xFF059669);
  static const _emerald50 = Color(0xFFECFDF5);
  static const _emerald100 = Color(0xFFD1FAE5);
  static const _slate800 = Color(0xFF1E293B);
  static const _slate600 = Color(0xFF475569);
  static const _slate500 = Color(0xFF64748B);
  static const _slate400 = Color(0xFF94A3B8);
  static const _slate100 = Color(0xFFF1F5F9);
  static const _slate50 = Color(0xFFF8FAFC);
  static const _amber600 = Color(0xFFD97706);

  @override
  void initState() {
    super.initState();
    _vm.fetchKegiatanDetail(widget.kegiatan.id);
  }

  @override
  void dispose() {
    _vm.dispose();
    super.dispose();
  }

  /// Resolve the target status when this role approves.
  String? _getApproveStatus() {
    final role = widget.currentUser.role;
    if (role == 'verifikator') return 'verified';
    if (role == 'ppk') return 'approved_ppk';
    if (role.startsWith('wadir')) return 'approved_wadir';
    return null;
  }

  /// Check if this role can act on the current kegiatan status.
  bool _canActOnStatus() {
    if (_vm.detailData == null) return false;
    final role = widget.currentUser.role;
    final status = (_vm.detailData!['status'] ?? '').toString().toLowerCase();

    if (role == 'verifikator') {
      return ['submitted', 'revisi_done', 'diajukan'].contains(status);
    } else if (role == 'ppk') {
      return ['verified', 'pending_ppk', 'diverifikasi'].contains(status);
    } else if (role.startsWith('wadir')) {
      return status == 'approved_ppk';
    }
    return false;
  }

  /// Action dialog for approve/reject.
  /// Uses exact target status strings for the backend PUT /kegiatan/{id}.
  Future<void> _submitAction(String action) async {
    final catatanCtrl = TextEditingController();
    final kodeMakCtrl = TextEditingController();
    final isApprove = action == 'approve';
    final role = widget.currentUser.role;
    final isVerifikator = role == 'verifikator';

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Row(children: [
            Icon(
              isApprove ? LucideIcons.checkCircle : LucideIcons.alertTriangle,
              color: isApprove ? _emerald700 : Colors.red,
              size: 22,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(isApprove ? 'Setujui Proposal' : 'Minta Revisi',
                  style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
            ),
          ]),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                isApprove
                    ? 'Apakah Anda yakin menyetujui proposal ini?'
                    : 'Berikan catatan revisi untuk pengusul:',
                style: const TextStyle(fontSize: 14, color: _slate500),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: catatanCtrl,
                maxLines: 3,
                decoration: InputDecoration(
                  hintText: isApprove ? 'Catatan (opsional)' : 'Catatan revisi *',
                  hintStyle: const TextStyle(color: _slate400),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: _emerald600, width: 2),
                  ),
                ),
              ),
              if (isApprove && isVerifikator) ...[
                const SizedBox(height: 12),
                TextField(
                  controller: kodeMakCtrl,
                  decoration: InputDecoration(
                    labelText: 'Kode MAK *',
                    hintText: 'Contoh: 1234.567.890',
                    hintStyle: const TextStyle(color: _slate400),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: _emerald600, width: 2),
                    ),
                  ),
                ),
              ],
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Batal', style: TextStyle(color: _slate500)),
            ),
            ElevatedButton(
              onPressed: () {
                if (!isApprove && catatanCtrl.text.isEmpty) {
                  ScaffoldMessenger.of(ctx).showSnackBar(
                    const SnackBar(content: Text('Catatan wajib diisi'), backgroundColor: Colors.orange),
                  );
                  return;
                }
                if (isApprove && isVerifikator && kodeMakCtrl.text.isEmpty) {
                  ScaffoldMessenger.of(ctx).showSnackBar(
                    const SnackBar(content: Text('Kode MAK wajib diisi'), backgroundColor: Colors.orange),
                  );
                  return;
                }
                Navigator.pop(ctx, true);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: isApprove ? _emerald700 : Colors.red,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: Text(isApprove ? 'Setujui' : 'Minta Revisi',
                  style: const TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );

    if (confirmed != true) return;

    // Resolve the exact target status for the backend
    final String targetStatus;
    if (isApprove) {
      targetStatus = _getApproveStatus() ?? 'verified';
    } else {
      targetStatus = 'revision_requested';
    }

    final catatan = catatanCtrl.text.isNotEmpty
        ? catatanCtrl.text
        : 'Disetujui oleh ${widget.currentUser.nama} (${widget.currentUser.role})';

    final body = <String, dynamic>{
      'status': targetStatus,
      'catatan_revisi': catatan,
    };

    // Add Kode MAK for verifikator approval
    if (isApprove && isVerifikator && kodeMakCtrl.text.isNotEmpty) {
      body['kode_mak'] = kodeMakCtrl.text.trim();
    }

    final success = await _vm.submitActionWithBody(widget.kegiatan.id, body);
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Status berhasil diperbarui!'), backgroundColor: _emerald700),
      );
      Navigator.pop(context, true);
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Gagal memperbarui status.'), backgroundColor: Colors.red),
      );
    }
    catatanCtrl.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _slate50,
      appBar: AppBar(
        title: const Text('Detail Pengajuan', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 17)),
        backgroundColor: Colors.white,
        foregroundColor: _slate800,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: const Color(0xFFE2E8F0)),
        ),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.clock, size: 20),
            tooltip: 'Timeline',
            onPressed: () => Navigator.push(context, MaterialPageRoute(
              builder: (_) => TimelineView(
                kegiatanId: widget.kegiatan.id,
                title: 'Timeline: ${widget.kegiatan.namaKegiatan}',
              ),
            )),
          ),
          IconButton(
            icon: const Icon(LucideIcons.printer, size: 20),
            tooltip: 'Cetak PDF',
            onPressed: () => Navigator.push(context, MaterialPageRoute(
              builder: (_) => KegiatanPrintView(kegiatanId: widget.kegiatan.id),
            )),
          ),
        ],
      ),
      body: ListenableBuilder(
        listenable: _vm,
        builder: (context, _) => _buildBody(),
      ),
      bottomNavigationBar: ListenableBuilder(
        listenable: _vm,
        builder: (context, _) => _buildActionButtons() ?? const SizedBox.shrink(),
      ),
    );
  }

  Widget _buildBody() {
    if (_vm.isDetailLoading) {
      return const Center(child: CircularProgressIndicator(color: _emerald700));
    }
    if (_vm.detailErrorMessage != null) {
      return Center(child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const Icon(LucideIcons.alertTriangle, size: 48, color: Colors.orange),
          const SizedBox(height: 12),
          Text(_vm.detailErrorMessage!, textAlign: TextAlign.center, style: const TextStyle(color: _slate500)),
        ]),
      ));
    }
    if (_vm.detailData == null) {
      return const Center(child: Text('Data tidak ditemukan.'));
    }

    final d = _vm.detailData!;
    final k = Kegiatan.fromJson(d);

    // Extract sub-data
    final kak = d['kak'] as Map<String, dynamic>?;
    final ikuList = (d['iku'] as List?)?.cast<Map<String, dynamic>>() ?? [];
    final rabList = (d['rab'] as List?)?.cast<Map<String, dynamic>>() ?? [];
    final historyList = (d['status_history'] as List?)?.cast<Map<String, dynamic>>() ?? [];
    final deskripsi = d['deskripsi']?.toString() ?? kak?['latar_belakang']?.toString();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // ═══════════════════════════════════════════
          // HEADER: Title + Status + Date
          // ═══════════════════════════════════════════
          _buildHeader(k),
          const SizedBox(height: 20),

          // ═══════════════════════════════════════════
          // PROGRESS TRACKER
          // ═══════════════════════════════════════════
          _buildProgressTracker(k.status),
          const SizedBox(height: 20),

          // ═══════════════════════════════════════════
          // DETAIL INFORMASI UMUM (2-col grid)
          // ═══════════════════════════════════════════
          _buildCard(
            title: 'Detail Informasi Umum',
            child: Column(
              children: [
                _buildInfoGrid(k),
                // Kode MAK highlight
                if (k.kodeMak != null && k.kodeMak!.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  _buildKodeMakBanner(k.kodeMak!),
                ],
                // Deskripsi
                if (deskripsi != null && deskripsi.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  const Divider(color: Color(0xFFF1F5F9)),
                  const SizedBox(height: 12),
                  const Text('DESKRIPSI / LATAR BELAKANG',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: _slate500, letterSpacing: 1.5)),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: _slate50,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE2E8F0).withValues(alpha: 0.5)),
                    ),
                    child: Text(deskripsi, style: const TextStyle(fontSize: 14, color: _slate600, height: 1.6)),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 16),

          // ═══════════════════════════════════════════
          // KAK (Kerangka Acuan Kerja)
          // ═══════════════════════════════════════════
          if (kak != null) ...[
            _buildKakSection(kak),
            const SizedBox(height: 16),
          ],

          // ═══════════════════════════════════════════
          // IKU Table
          // ═══════════════════════════════════════════
          if (ikuList.isNotEmpty) ...[
            _buildCard(
              title: 'Indikator Kinerja Utama (IKU)',
              padding: EdgeInsets.zero,
              child: _buildIkuTable(ikuList),
            ),
            const SizedBox(height: 16),
          ],

          // ═══════════════════════════════════════════
          // RAB Table
          // ═══════════════════════════════════════════
          if (rabList.isNotEmpty) ...[
            _buildCard(
              title: 'Rincian Anggaran Biaya (RAB)',
              padding: EdgeInsets.zero,
              child: _buildRabTable(rabList),
            ),
            const SizedBox(height: 16),
          ],

          // ═══════════════════════════════════════════
          // PENGUSUL: Upload Surat Pengantar & Penanggung Jawab (for PPK)
          // ═══════════════════════════════════════════
          if (widget.currentUser.role == 'pengusul' && 
              ['verified', 'diverifikasi', 'waiting_surat_pengantar'].contains(k.status.toLowerCase())) ...[
            _buildPengusulPpkSubmissionCard(k, d),
            const SizedBox(height: 16),
          ],

          // ═══════════════════════════════════════════
          // PENGUSUL: Upload LPJ
          // ═══════════════════════════════════════════
          if (widget.currentUser.role == 'pengusul' && 
              ['approved_wadir', 'accepted_funds', 'funds_disbursed', 'lpj_revision', 'lpj_submitted'].contains(k.status.toLowerCase())) ...[
            _buildPengusulLpjCard(k, d),
            const SizedBox(height: 16),
          ],

          // ═══════════════════════════════════════════
          // HISTORY Timeline
          // ═══════════════════════════════════════════
          if (historyList.isNotEmpty) ...[
            _buildCard(
              title: 'Riwayat Perubahan Status',
              padding: EdgeInsets.zero,
              child: _buildHistoryTimeline(historyList),
            ),
            const SizedBox(height: 16),
          ],

          // Catatan revisi (if any)
          if (k.catatanRevisi != null && k.catatanRevisi!.isNotEmpty) ...[
            _buildRevisiNotice(k.catatanRevisi!),
            const SizedBox(height: 16),
          ],

          const SizedBox(height: 60),
        ],
      ),
    );
  }

  // ════════════════════════════════════════════════════════════════
  //  HEADER
  // ════════════════════════════════════════════════════════════════

  Widget _buildHeader(Kegiatan k) {
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
          Text(
            k.judul,
            style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: _slate800, letterSpacing: -0.5, height: 1.3),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 10,
            runSpacing: 8,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              _buildStatusBadge(k.status),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(LucideIcons.clock, size: 14, color: _slate400),
                  const SizedBox(width: 4),
                  Text(k.formattedDate, style: const TextStyle(fontSize: 13, color: _slate500, fontWeight: FontWeight.w500)),
                ],
              ),
              if (_vm.detailData?['kode_mak'] != null && _vm.detailData!['kode_mak'].toString().isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(color: _emerald50, borderRadius: BorderRadius.circular(6), border: Border.all(color: _emerald100)),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(LucideIcons.hash, size: 12, color: _emerald700),
                      const SizedBox(width: 4),
                      Text('MAK: ${_vm.detailData!['kode_mak']}', style: const TextStyle(fontSize: 12, color: _emerald700, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  // ════════════════════════════════════════════════════════════════
  //  STATUS BADGE (matching web's StatusBadge component)
  // ════════════════════════════════════════════════════════════════

  Widget _buildStatusBadge(String status) {
    final s = status.toLowerCase();
    Color bg, fg;
    String label = status.replaceAll('_', ' ').toUpperCase();

    if (s == 'draft') {
      bg = const Color(0xFFF1F5F9); fg = _slate600;
    } else if (s.contains('revisi') || s == 'revision_requested' || s == 'lpj_revision') {
      bg = const Color(0xFFFEF3C7); fg = const Color(0xFF92400E);
    } else if (s == 'submitted' || s == 'diajukan') {
      bg = const Color(0xFFDBEAFE); fg = const Color(0xFF1E40AF);
    } else if (s.contains('approved') || s.contains('disetujui') || s.contains('verified') || s == 'diverifikasi') {
      bg = _emerald50; fg = const Color(0xFF065F46);
    } else if (s == 'rejected' || s == 'ditolak') {
      bg = const Color(0xFFFEE2E2); fg = const Color(0xFF991B1B);
    } else if (s.contains('pending')) {
      bg = const Color(0xFFFEF3C7); fg = const Color(0xFF92400E);
    } else if (s == 'completed' || s == 'selesai' || s == 'lpj_done' || s == 'lpj_approved') {
      bg = _emerald50; fg = const Color(0xFF065F46);
    } else if (s.contains('funds') || s.contains('pencairan')) {
      bg = const Color(0xFFDBEAFE); fg = const Color(0xFF1E40AF);
    } else {
      bg = _slate100; fg = _slate600;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(99),
      ),
      child: Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: fg, letterSpacing: 0.5)),
    );
  }

  // ════════════════════════════════════════════════════════════════
  //  PROGRESS TRACKER (web: ProgressTracker component)
  // ════════════════════════════════════════════════════════════════

  Widget _buildProgressTracker(String status) {
    final steps = ['Draft', 'Diajukan', 'Verifikasi', 'PPK', 'Wadir', 'Pencairan', 'LPJ', 'Selesai'];
    final s = status.toLowerCase();
    int currentStep = 0;

    if (s == 'draft') currentStep = 0;
    else if (s == 'submitted' || s == 'diajukan') currentStep = 1;
    else if (s.contains('verif') || s == 'diverifikasi' || s == 'verified') currentStep = 2;
    else if (s.contains('ppk') || s == 'pending_ppk' || s == 'approved_ppk') currentStep = 3;
    else if (s.contains('wadir') || s == 'approved_wadir') currentStep = 4;
    else if (s.contains('funds') || s.contains('accepted') || s.contains('pencairan')) currentStep = 5;
    else if (s.contains('lpj')) currentStep = 6;
    else if (s == 'completed' || s == 'selesai') currentStep = 7;

    return _buildCard(
      title: 'Alur Persetujuan Dokumen',
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: List.generate(steps.length, (i) {
            final isCompleted = i <= currentStep;
            final isCurrent = i == currentStep;
            return Row(
              children: [
                Column(
                  children: [
                    Container(
                      width: 32, height: 32,
                      decoration: BoxDecoration(
                        color: isCompleted ? _emerald700 : _slate100,
                        shape: BoxShape.circle,
                        border: isCurrent ? Border.all(color: _emerald600, width: 2) : null,
                        boxShadow: isCurrent ? [const BoxShadow(color: Color(0x33047857), blurRadius: 8)] : null,
                      ),
                      child: Center(
                        child: isCompleted
                            ? const Icon(LucideIcons.check, size: 16, color: Colors.white)
                            : Text('${i + 1}', style: const TextStyle(fontSize: 12, color: _slate400, fontWeight: FontWeight.bold)),
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(steps[i], style: TextStyle(
                      fontSize: 10, fontWeight: isCurrent ? FontWeight.bold : FontWeight.w500,
                      color: isCompleted ? _emerald700 : _slate400,
                    )),
                  ],
                ),
                if (i < steps.length - 1)
                  Container(
                    width: 28, height: 2, margin: const EdgeInsets.only(bottom: 18),
                    color: i < currentStep ? _emerald600 : const Color(0xFFE2E8F0),
                  ),
              ],
            );
          }),
        ),
      ),
    );
  }

  // ════════════════════════════════════════════════════════════════
  //  INFO GRID (web: 2-col grid with icon-box InfoRow)
  // ════════════════════════════════════════════════════════════════

  Widget _buildInfoGrid(Kegiatan k) {
    final items = <_InfoItem>[
      _InfoItem(LucideIcons.fileText, 'Jenis Kegiatan', k.jenisKegiatan ?? '-'),
      _InfoItem(LucideIcons.user, 'Organisasi Pengusul', k.pengusulOrganisasi ?? '-'),
      _InfoItem(LucideIcons.clock, 'Tanggal Pelaksanaan', k.formattedDate),
      _InfoItem(LucideIcons.mapPin, 'Lokasi Pelaksanaan', k.tempat ?? '-'),
    ];

    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: items.map((item) => SizedBox(
        width: MediaQuery.of(context).size.width >= 600
            ? (MediaQuery.of(context).size.width - 96) / 2
            : double.infinity,
        child: _buildInfoRow(item),
      )).toList(),
    );
  }

  Widget _buildInfoRow(_InfoItem item) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: _slate50.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFF1F5F9).withValues(alpha: 0.6)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: _slate100),
              boxShadow: const [BoxShadow(color: Color(0x08000000), blurRadius: 4)],
            ),
            child: Icon(item.icon, size: 18, color: _emerald600),
          ),
          const SizedBox(width: 12),
          Expanded(child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(item.label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: _slate400, letterSpacing: 1.0)),
              const SizedBox(height: 4),
              Text(item.value, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: _slate800)),
            ],
          )),
        ],
      ),
    );
  }

  // ════════════════════════════════════════════════════════════════
  //  KODE MAK BANNER
  // ════════════════════════════════════════════════════════════════

  Widget _buildKodeMakBanner(String kodeMak) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _emerald50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _emerald100),
        boxShadow: const [BoxShadow(color: Color(0x08000000), blurRadius: 4)],
      ),
      child: Row(children: [
        Expanded(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('KODE MAK (MATA ANGGARAN KEGIATAN)',
                style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: _emerald600, letterSpacing: 1.0)),
            const SizedBox(height: 4),
            Text(kodeMak, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Color(0xFF065F46), letterSpacing: -0.5)),
          ],
        )),
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(color: _emerald100, shape: BoxShape.circle),
          child: const Icon(LucideIcons.fileText, size: 20, color: _emerald600),
        ),
      ]),
    );
  }

  // ════════════════════════════════════════════════════════════════
  //  KAK Section (web: left-bordered paragraphs)
  // ════════════════════════════════════════════════════════════════

  Widget _buildKakSection(Map<String, dynamic> kak) {
    final fields = <MapEntry<String, String>>[];
    void addIf(String key, String label) {
      final val = kak[key]?.toString();
      if (val != null && val.isNotEmpty) fields.add(MapEntry(label, val));
    }
    addIf('gambaran_umum', 'Gambaran Umum');
    addIf('tujuan', 'Tujuan');
    addIf('sasaran', 'Sasaran');
    addIf('penerima_manfaat', 'Penerima Manfaat');
    addIf('strategi_pencapaian', 'Strategi Pencapaian');
    addIf('metode_pelaksanaan', 'Metode Pelaksanaan');

    if (fields.isEmpty) return const SizedBox.shrink();

    return _buildCard(
      title: 'Kerangka Acuan Kerja (KAK)',
      child: Column(
        children: fields.map((f) => Padding(
          padding: const EdgeInsets.only(bottom: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Container(width: 6, height: 6, decoration: const BoxDecoration(color: _emerald600, shape: BoxShape.circle)),
                const SizedBox(width: 8),
                Text(f.key.toUpperCase(), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: _emerald700, letterSpacing: 1.0)),
              ]),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.only(left: 12),
                decoration: const BoxDecoration(
                  border: Border(left: BorderSide(color: _emerald100, width: 3)),
                ),
                child: Text(f.value, style: const TextStyle(fontSize: 15, color: _slate600, height: 1.6)),
              ),
            ],
          ),
        )).toList(),
      ),
    );
  }

  // ════════════════════════════════════════════════════════════════
  //  IKU TABLE
  // ════════════════════════════════════════════════════════════════

  Widget _buildIkuTable(List<Map<String, dynamic>> ikuList) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: const BoxDecoration(
            color: Color(0xFFFAFAFB),
            border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9))),
          ),
          child: const Row(children: [
            Expanded(flex: 3, child: Text('NAMA INDIKATOR', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: _slate500, letterSpacing: 1.0))),
            Expanded(flex: 1, child: Text('TARGET', textAlign: TextAlign.right, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: _slate500, letterSpacing: 1.0))),
          ]),
        ),
        ...ikuList.map((iku) => Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Color(0xFFF8FAFC)))),
          child: Row(children: [
            Expanded(flex: 3, child: Text(iku['nama_iku']?.toString() ?? '-', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: _slate600))),
            Expanded(flex: 1, child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(color: _emerald50.withValues(alpha: 0.3), borderRadius: BorderRadius.circular(6)),
              child: Text(
                iku['target_persen'] != null ? '${iku['target_persen']}%' : '-',
                textAlign: TextAlign.right,
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: _emerald600),
              ),
            )),
          ]),
        )),
      ],
    );
  }

  // ════════════════════════════════════════════════════════════════
  //  RAB TABLE
  // ════════════════════════════════════════════════════════════════

  Widget _buildRabTable(List<Map<String, dynamic>> rabList) {
    num totalRab = 0;
    for (var r in rabList) {
      final t = (r['total'] ?? ((r['harga_satuan'] ?? 0) * (r['qty1'] ?? r['volume'] ?? 1)));
      totalRab += (t is num) ? t : num.tryParse(t.toString()) ?? 0;
    }

    return Column(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: const BoxDecoration(
            color: Color(0xFFFAFAFB),
            border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9))),
          ),
          child: const Row(children: [
            Expanded(flex: 3, child: Text('URAIAN', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: _slate500, letterSpacing: 1.0))),
            Expanded(flex: 1, child: Text('VOL', textAlign: TextAlign.center, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: _slate500, letterSpacing: 1.0))),
            Expanded(flex: 2, child: Text('HARGA SATUAN', textAlign: TextAlign.right, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: _slate500, letterSpacing: 1.0))),
            Expanded(flex: 2, child: Text('TOTAL', textAlign: TextAlign.right, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: _slate500, letterSpacing: 1.0))),
          ]),
        ),
        ...rabList.map((r) {
          final harga = (r['harga_satuan'] ?? 0);
          final vol = r['qty1'] ?? r['volume'] ?? 1;
          final total = r['total'] ?? (harga is num ? harga * (vol is num ? vol : 1) : 0);
          return Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Color(0xFFF8FAFC)))),
            child: Row(children: [
              Expanded(flex: 3, child: Text(r['uraian']?.toString() ?? '-', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: _slate600))),
              Expanded(flex: 1, child: Text('$vol', textAlign: TextAlign.center, style: const TextStyle(fontSize: 13, color: _slate600))),
              Expanded(flex: 2, child: Text(_formatCurrency(harga), textAlign: TextAlign.right, style: const TextStyle(fontSize: 13, color: _slate600))),
              Expanded(flex: 2, child: Text(_formatCurrency(total), textAlign: TextAlign.right, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: _slate800))),
            ]),
          );
        }),
        // Total row
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          decoration: BoxDecoration(color: _emerald50.withValues(alpha: 0.8)),
          child: Row(children: [
            const Expanded(flex: 6, child: Text('TOTAL KESELURUHAN ANGGARAN',
                textAlign: TextAlign.right,
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF065F46), letterSpacing: 1.0))),
            const SizedBox(width: 12),
            Expanded(flex: 2, child: Text(_formatCurrency(totalRab),
                textAlign: TextAlign.right,
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: _emerald700))),
          ]),
        ),
      ],
    );
  }

  // ════════════════════════════════════════════════════════════════
  //  HISTORY TIMELINE
  // ════════════════════════════════════════════════════════════════

  Widget _buildHistoryTimeline(List<Map<String, dynamic>> history) {
    return Column(
      children: history.map((h) {
        final statusBaru = h['status_baru']?.toString() ?? h['new_status']?.toString() ?? '';
        final catatan = h['catatan']?.toString();
        final date = h['created_at']?.toString() ?? h['timestamp']?.toString() ?? '';
        final formattedDate = date.length >= 10 ? date.substring(0, 10) : date;

        return Container(
          padding: const EdgeInsets.all(16),
          decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9)))),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 10, height: 10, margin: const EdgeInsets.only(top: 4),
                decoration: BoxDecoration(
                  color: _emerald600,
                  shape: BoxShape.circle,
                  boxShadow: [BoxShadow(color: _emerald600.withValues(alpha: 0.2), blurRadius: 4)],
                ),
              ),
              const SizedBox(width: 12),
              Expanded(child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(spacing: 8, runSpacing: 4, children: [
                    _buildStatusBadge(statusBaru),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(color: _slate100, borderRadius: BorderRadius.circular(6)),
                      child: Text(formattedDate, style: const TextStyle(fontSize: 11, color: _slate400, fontWeight: FontWeight.w500)),
                    ),
                  ]),
                  if (catatan != null && catatan.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: _slate100),
                        boxShadow: const [BoxShadow(color: Color(0x05000000), blurRadius: 4)],
                      ),
                      child: Text('"$catatan"', style: const TextStyle(fontSize: 14, color: _slate600, height: 1.5)),
                    ),
                  ],
                ],
              )),
            ],
          ),
        );
      }).toList(),
    );
  }

  // ════════════════════════════════════════════════════════════════
  //  REVISI NOTICE
  // ════════════════════════════════════════════════════════════════

  Widget _buildRevisiNotice(String catatan) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF3C7),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFFDE68A)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(LucideIcons.alertTriangle, size: 20, color: Color(0xFF92400E)),
          const SizedBox(width: 12),
          Expanded(child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Catatan Revisi', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF92400E))),
              const SizedBox(height: 4),
              Text(catatan, style: const TextStyle(fontSize: 14, color: Color(0xFF78350F), height: 1.5)),
            ],
          )),
        ],
      ),
    );
  }

  // ════════════════════════════════════════════════════════════════
  //  REUSABLE CARD
  // ════════════════════════════════════════════════════════════════

  Widget _buildCard({required String title, required Widget child, EdgeInsets? padding}) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0).withValues(alpha: 0.6)),
        boxShadow: const [BoxShadow(color: Color(0x08000000), blurRadius: 8, offset: Offset(0, 2))],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            decoration: const BoxDecoration(
              color: Color(0xFFFAFAFB),
              border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9))),
            ),
            child: Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: _slate800)),
          ),
          Padding(
            padding: padding ?? const EdgeInsets.all(20),
            child: child,
          ),
        ],
      ),
    );
  }

  // ════════════════════════════════════════════════════════════════
  //  ACTION BUTTONS (bottom bar for approval roles)
  // ════════════════════════════════════════════════════════════════

  Widget? _buildActionButtons() {
    if (_vm.detailData == null) return null;
    final k = Kegiatan.fromJson(_vm.detailData!);
    final role = widget.currentUser.role;
    final status = k.status.toLowerCase();

    // ── PENGUSUL ──────────────────────────────────────────────────────
    if (role == 'pengusul') {
      if (status == 'draft') {
        return _buildSingleActionBar(
          icon: LucideIcons.trash2,
          label: 'Hapus Draft',
          color: Colors.red,
          onPressed: () async {
            final confirm = await showDialog<bool>(
              context: context,
              builder: (ctx) => AlertDialog(
                title: const Text('Hapus Draft'),
                content: const Text('Apakah Anda yakin ingin menghapus draft ini?'),
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
              final success = await _vm.deleteKegiatan(k.id);
              if (success && mounted) {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Draft dihapus'), backgroundColor: Colors.red));
                Navigator.pop(context, true);
              }
            }
          },
        );
      }
      // Submit ke PPK setelah diverifikasi
      if (status == 'verified' || status == 'diverifikasi') {
        return _buildSingleActionBar(
          icon: LucideIcons.sendHorizontal,
          label: 'Teruskan ke PPK',
          color: _emerald700,
          onPressed: () async {
            final result = await Navigator.push<bool>(context, MaterialPageRoute(
              builder: (_) => SubmitPpkView(kegiatan: k),
            ));
            if (result == true && mounted) Navigator.pop(context, true);
          },
        );
      }
      // Konfirmasi Uang Muka / Input LPJ
      if (status == 'funds_disbursed' || status == 'accepted_funds' ||
          status == 'lpj_revision' || status == 'lpj_pending') {
        if (!k.uangMukaDiambil && status == 'funds_disbursed') {
          return _buildSingleActionBar(
            icon: LucideIcons.wallet,
            label: 'Konfirmasi Penarikan Uang Muka',
            color: _amber600,
            onPressed: () async {
              final confirm = await showDialog<bool>(
                context: context,
                builder: (ctx) => AlertDialog(
                  title: const Text('Penarikan Uang Muka'),
                  content: const Text('Apakah Anda yakin ingin melakukan konfirmasi penarikan uang muka?'),
                  actions: [
                    TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Batal')),
                    ElevatedButton(
                      onPressed: () => Navigator.pop(ctx, true),
                      style: ElevatedButton.styleFrom(backgroundColor: _amber600, foregroundColor: Colors.white),
                      child: const Text('Konfirmasi'),
                    ),
                  ],
                ),
              );
              if (confirm == true) {
                final lpjVm = LpjViewModel();
                final success = await lpjVm.tandaiDanaDiambil(k.id, true);
                if (success && mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Penarikan uang muka berhasil dicatat!')));
                  _vm.fetchKegiatanDetail(k.id);
                }
              }
            },
          );
        }

        return _buildSingleActionBar(
          icon: LucideIcons.clipboardList,
          label: 'Input LPJ & Realisasi',
          color: _emerald700,
          onPressed: () async {
            final result = await Navigator.push<bool>(context, MaterialPageRoute(
              builder: (_) => LpjUploadView(kegiatan: k),
            ));
            if (result == true && mounted) Navigator.pop(context, true);
          },
        );
      }
      return null;
    }

    // ── VERIFIKATOR ────────────────────────────────────────────────────
    if (role == 'verifikator') {
      final canVerify = ['submitted', 'revisi_done', 'revision_requested'].contains(status);
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: const BoxDecoration(
          color: Colors.white,
          boxShadow: [BoxShadow(color: Color(0x14000000), blurRadius: 8, offset: Offset(0, -2))],
        ),
        child: SafeArea(
          top: false,
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            // Kode MAK button — always visible for verifikator
            OutlinedButton.icon(
              onPressed: () async {
                final newKode = await showKodeMakInputSheet(context, k.id, k.kodeMak);
                if (newKode != null && mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Kode MAK disimpan: $newKode'), backgroundColor: _emerald700),
                  );
                  _vm.fetchKegiatanDetail(k.id);
                }
              },
              icon: const Icon(LucideIcons.hash, size: 16),
              label: Text(k.kodeMak != null ? 'Edit Kode MAK (${k.kodeMak})' : 'Input Kode MAK'),
              style: OutlinedButton.styleFrom(
                foregroundColor: _emerald700,
                side: const BorderSide(color: Color(0xFFD1FAE5)),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                padding: const EdgeInsets.symmetric(vertical: 12),
                minimumSize: const Size(double.infinity, 0),
              ),
            ),
            if (canVerify) ...[
              const SizedBox(height: 10),
              Row(children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _vm.isActionLoading ? null : () => _submitAction('reject'),
                    icon: const Icon(LucideIcons.alertTriangle, size: 16),
                    label: const Text('Minta Revisi', style: TextStyle(fontWeight: FontWeight.bold)),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      side: const BorderSide(color: Color(0xFFFCA5A5)),
                      foregroundColor: Colors.red,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: _vm.isActionLoading ? null : () => _submitAction('approve'),
                    icon: _vm.isActionLoading
                        ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Icon(LucideIcons.checkCircle, size: 16),
                    label: const Text('Verifikasi', style: TextStyle(fontWeight: FontWeight.bold)),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      backgroundColor: _emerald700,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
              ]),
            ],
          ]),
        ),
      );
    }

    // ── BENDAHARA ──────────────────────────────────────────────────────
    if (role == 'bendahara') {
      if (['approved_wadir', 'accepted_funds', 'funds_disbursed', 'lpj_submitted', 'lpj_revision', 'lpj_approved', 'lpj_verified'].contains(status)) {
        return Container(
          padding: const EdgeInsets.all(16),
          decoration: const BoxDecoration(
            color: Colors.white,
            boxShadow: [BoxShadow(color: Color(0x14000000), blurRadius: 8, offset: Offset(0, -2))],
          ),
          child: SafeArea(
            top: false,
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => PencairanView(kegiatan: widget.kegiatan)))
                    .then((_) => _vm.fetchKegiatanDetail(widget.kegiatan.id));
                },
                icon: const Icon(LucideIcons.dollarSign, size: 16),
                label: const Text('Proses Pencairan Dana', style: TextStyle(fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: const Color(0xFF2563EB),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
          ),
        );
      }
    }

    // ── OTHER APPROVER ROLES (PPK, Wadir, Rektorat) ────────────────────
    if (role == 'admin' || role == 'bendahara' || role.isEmpty) return null;
    if (!_canActOnStatus()) return null;

    final isPpkOrWadir = role == 'ppk' || role.startsWith('wadir');

    if (isPpkOrWadir) {
      return _buildSingleActionBar(
        icon: LucideIcons.checkCircle,
        label: 'Setujui',
        color: _emerald700,
        onPressed: _vm.isActionLoading ? null : () => _submitAction('approve'),
      );
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        color: Colors.white,
        boxShadow: [BoxShadow(color: Color(0x14000000), blurRadius: 8, offset: Offset(0, -2))],
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            if (role != 'ppk' && role != 'wadir') ...[
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _vm.isActionLoading ? null : () => _submitAction('reject'),
                  icon: const Icon(LucideIcons.alertTriangle, size: 16),
                  label: const Text('Minta Revisi', style: TextStyle(fontWeight: FontWeight.bold)),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    side: const BorderSide(color: Color(0xFFFCA5A5)),
                    foregroundColor: Colors.red,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
              const SizedBox(width: 12),
            ],
            Expanded(
              child: ElevatedButton.icon(
                onPressed: _vm.isActionLoading ? null : () => _submitAction('approve'),
                icon: _vm.isActionLoading
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Icon(LucideIcons.checkCircle, size: 16),
                label: const Text('Setujui', style: TextStyle(fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: _emerald700,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 2,
                  shadowColor: const Color(0x33047857),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Helper: single action button bar
  Widget _buildSingleActionBar({required IconData icon, required String label, required Color color, required VoidCallback? onPressed}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        color: Colors.white,
        boxShadow: [BoxShadow(color: Color(0x14000000), blurRadius: 8, offset: Offset(0, -2))],
      ),
      child: SafeArea(
        top: false,
        child: ElevatedButton.icon(
          onPressed: onPressed,
          icon: Icon(icon, size: 18),
          label: Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
          style: ElevatedButton.styleFrom(
            backgroundColor: color,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            padding: const EdgeInsets.symmetric(vertical: 16),
            elevation: 2,
            shadowColor: color.withValues(alpha: 0.3),
          ),
        ),
      ),
    );
  }


  Widget _buildPengusulPpkSubmissionCard(Kegiatan k, Map<String, dynamic> d) {
    return _buildCard(
      title: 'Tindakan Pengusul: Teruskan ke PPK',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'Usulan telah diverifikasi. Anda perlu meneruskan usulan ke PPK beserta Surat Pengantar dan KAK.',
            style: TextStyle(fontSize: 13, color: _slate600),
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => SubmitPpkView(kegiatan: k)))
                .then((_) => _vm.fetchKegiatanDetail(widget.kegiatan.id));
            },
            icon: const Icon(LucideIcons.send, size: 16),
            label: const Text('Teruskan ke PPK', style: TextStyle(fontWeight: FontWeight.bold)),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF2563EB),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
          )
        ],
      )
    );
  }

  Widget _buildPengusulLpjCard(Kegiatan k, Map<String, dynamic> d) {
    return _buildCard(
      title: 'Laporan Pertanggungjawaban (LPJ)',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'Silakan isi realisasi dana, realisasi IKU, dan unggah bukti kuitansi.',
            style: TextStyle(fontSize: 13, color: _slate600),
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => LpjUploadView(kegiatan: k)))
                .then((_) => _vm.fetchKegiatanDetail(widget.kegiatan.id));
            },
            icon: const Icon(LucideIcons.fileText, size: 16),
            label: const Text('Isi & Upload LPJ', style: TextStyle(fontWeight: FontWeight.bold)),
            style: ElevatedButton.styleFrom(
              backgroundColor: _emerald700,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
          )
        ],
      )
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
}

class _InfoItem {
  final IconData icon;
  final String label;
  final String value;
  _InfoItem(this.icon, this.label, this.value);
}
