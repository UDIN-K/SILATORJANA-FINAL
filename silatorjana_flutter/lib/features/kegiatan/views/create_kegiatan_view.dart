import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../core/network/api_service.dart';

const List<String> kIndonesianMonths = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const List<String> kIkuIndicatorList = [
  'Lulusan Mendapat Pekerjaan yang Layak',
  'Mahasiswa Mendapat Pengalaman di Luar Kampus',
  'Dosen Berkegatan di Luar Kampus',
  'Praktisi Mengajar di Dalam Kampus',
  'Hasil Kerja Dosen Digunakan oleh Masyarakat',
  'Program Studi Bekerja sama dengan Mitra Kelas Dunia',
  'Kelas yang Kolaboratif dan Partisipatif',
  'Program Studi Bestandar Internasional'
];

class CreateKegiatanView extends StatefulWidget {
  final int? editId; // If provided, edit mode
  const CreateKegiatanView({super.key, this.editId});

  @override
  State<CreateKegiatanView> createState() => _CreateKegiatanViewState();
}

class _CreateKegiatanViewState extends State<CreateKegiatanView> {
  final ApiService _apiService = ApiService();
  Map<String, String> _revisiComments = {};

  Map<String, String> _parseRevisiComments(String? catatan) {
    final result = <String, String>{};
    if (catatan == null || catatan.isEmpty) return result;
    final lines = catatan.split('\n');
    for (final line in lines) {
      final match = RegExp(r'^\[(.+?)\]:\s*(.+)$').firstMatch(line);
      if (match != null) {
        result[match.group(1)!] = match.group(2)!;
      } else if (line.trim().isNotEmpty) {
        result['Umum'] = (result['Umum'] != null ? '${result['Umum']}\n' : '') + line.trim();
      }
    }
    return result;
  }

  int _currentStep = 0; // 0: Info Kegiatan, 1: KAK, 2: IKU, 3: Anggaran (RAB)
  bool _isSubmitting = false;
  bool _isLoading = false;
  String _selectedRabCategory = 'barang'; // barang, jasa, perjalanan

  // Step 1: Info Kegiatan
  final _namaKegiatanCtrl = TextEditingController();
  final _jenisKegiatanCtrl = TextEditingController();
  final _pengusulOrganisasiCtrl = TextEditingController();
  final _tempatCtrl = TextEditingController();
  final _tanggalKegiatanCtrl = TextEditingController();

  // Step 2: KAK (Kerangka Acuan Kerja)
  final _gambaranUmumCtrl = TextEditingController();
  final _penerimaManfaatCtrl = TextEditingController();
  final _metodePelaksanaanCtrl = TextEditingController();
  final _tahapanPelaksanaanCtrl = TextEditingController();
  final _strategiPencapaianCtrl = TextEditingController();
  final _kurunWaktuDariCtrl = TextEditingController();
  final _kurunWaktuSampaiCtrl = TextEditingController();

  // Indikator Keberhasilan (Tabel bulanan)
  final List<Map<String, dynamic>> _indikatorRows = [];

  // Step 3: IKU items
  final List<Map<String, dynamic>> _ikuItems = [];

  // Step 4: RAB items divided by category
  final List<Map<String, dynamic>> _rabBarang = [];
  final List<Map<String, dynamic>> _rabJasa = [];
  final List<Map<String, dynamic>> _rabPerjalanan = [];

  bool get _isEditMode => widget.editId != null;

  @override
  void initState() {
    super.initState();
    if (_isEditMode) {
      _loadExistingData();
    } else {
      _addIndikatorRow();
      _addIkuItem();
      _addRabItem('barang');
      _addRabItem('jasa');
      _addRabItem('perjalanan');
    }
  }

  @override
  void dispose() {
    _namaKegiatanCtrl.dispose();
    _jenisKegiatanCtrl.dispose();
    _pengusulOrganisasiCtrl.dispose();
    _tempatCtrl.dispose();
    _tanggalKegiatanCtrl.dispose();
    _gambaranUmumCtrl.dispose();
    _penerimaManfaatCtrl.dispose();
    _metodePelaksanaanCtrl.dispose();
    _tahapanPelaksanaanCtrl.dispose();
    _strategiPencapaianCtrl.dispose();
    _kurunWaktuDariCtrl.dispose();
    _kurunWaktuSampaiCtrl.dispose();

    _disposeControllers(_indikatorRows);
    _disposeControllers(_ikuItems);
    _disposeControllers(_rabBarang);
    _disposeControllers(_rabJasa);
    _disposeControllers(_rabPerjalanan);
    super.dispose();
  }

  void _disposeControllers(List<Map<String, dynamic>> list) {
    for (var item in list) {
      for (var val in item.values) {
        if (val is TextEditingController) {
          val.dispose();
        }
      }
    }
  }

  Future<void> _loadExistingData() async {
    setState(() => _isLoading = true);
    try {
      final response = await _apiService.get('/kegiatan/${widget.editId}');
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (mounted) {
          setState(() {
            _namaKegiatanCtrl.text = data['nama_kegiatan'] ?? '';
            _jenisKegiatanCtrl.text = data['jenis_kegiatan'] ?? '';
            _pengusulOrganisasiCtrl.text = data['pengusul_organisasi'] ?? '';
            _revisiComments = _parseRevisiComments(data['catatan_revisi']?.toString());
            _tempatCtrl.text = data['tempat'] ?? '';
            _tanggalKegiatanCtrl.text = data['tanggal_kegiatan'] ?? '';

            final kak = data['kak'];
            if (kak != null) {
              _gambaranUmumCtrl.text = kak['gambaran_umum'] ?? '';
              _penerimaManfaatCtrl.text = kak['penerima_manfaat'] ?? '';
              _metodePelaksanaanCtrl.text = kak['metode_pelaksanaan'] ?? '';
              _tahapanPelaksanaanCtrl.text = kak['tahapan_pelaksanaan'] ?? '';
              _strategiPencapaianCtrl.text = kak['strategi_pencapaian'] ?? '';
              _kurunWaktuDariCtrl.text = kak['kurun_waktu_mulai'] ?? '';
              _kurunWaktuSampaiCtrl.text = kak['kurun_waktu_selesai'] ?? '';

              _indikatorRows.clear();
              final indicators = kak['indikator'];
              if (indicators != null) {
                dynamic parsedInds = indicators;
                if (indicators is String) {
                  try {
                    parsedInds = jsonDecode(indicators);
                  } catch (_) {}
                }
                if (parsedInds is List) {
                  for (var ind in parsedInds) {
                    _indikatorRows.add({
                      'bulan': ind['bulan'] ?? '',
                      'indikator': TextEditingController(text: ind['indikator'] ?? ''),
                      'target': TextEditingController(text: ind['target']?.toString() ?? ''),
                    });
                  }
                }
              }
            }

            final iku = data['iku'];
            if (iku is List && iku.isNotEmpty) {
              _ikuItems.clear();
              for (var it in iku) {
                _ikuItems.add({
                  'nama_indikator': it['nama_iku'] ?? it['indikator'] ?? '',
                  'target_persen': TextEditingController(text: (it['target_persen'] ?? it['target'] ?? '').toString()),
                });
              }
            }

            final rab = data['rab'];
            if (rab is List) {
              _rabBarang.clear();
              _rabJasa.clear();
              _rabPerjalanan.clear();

              for (var it in rab) {
                final category = it['kategori']?.toString().toLowerCase() ?? 'barang';
                final itemMap = {
                  'uraian': TextEditingController(text: it['uraian'] ?? ''),
                  'qty1': TextEditingController(text: (it['qty1'] ?? 1).toString()),
                  'satuan1': it['satuan1']?.toString() ?? '',
                  'qty2': TextEditingController(text: (it['qty2'] ?? 1).toString()),
                  'satuan2': it['satuan2']?.toString() ?? '',
                  'qty3': TextEditingController(text: it['qty3'] != null ? it['qty3'].toString() : ''),
                  'satuan3': it['satuan3']?.toString() ?? '',
                  'harga_satuan': TextEditingController(text: (it['harga_satuan'] ?? 0).toString()),
                };

                if (category == 'barang') {
                  _rabBarang.add(itemMap);
                } else if (category == 'jasa') {
                  _rabJasa.add(itemMap);
                } else if (category == 'perjalanan') {
                  _rabPerjalanan.add(itemMap);
                }
              }
            }
          });
        }
      }
    } catch (_) {
      _showError('Gagal memuat detail usulan');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }

    if (_indikatorRows.isEmpty) _addIndikatorRow();
    if (_ikuItems.isEmpty) _addIkuItem();
    if (_rabBarang.isEmpty) _addRabItem('barang');
    if (_rabJasa.isEmpty) _addRabItem('jasa');
    if (_rabPerjalanan.isEmpty) _addRabItem('perjalanan');
  }

  void _addIndikatorRow() {
    setState(() {
      _indikatorRows.add({
        'bulan': '',
        'indikator': TextEditingController(),
        'target': TextEditingController(),
      });
    });
  }

  void _removeIndikatorRow(int index) {
    if (_indikatorRows.length > 1) {
      setState(() {
        _indikatorRows[index]['indikator']!.dispose();
        _indikatorRows[index]['target']!.dispose();
        _indikatorRows.removeAt(index);
      });
    }
  }

  void _addIkuItem() {
    setState(() {
      _ikuItems.add({
        'nama_indikator': '',
        'target_persen': TextEditingController(),
      });
    });
  }

  void _removeIkuItem(int index) {
    if (_ikuItems.length > 1) {
      setState(() {
        _ikuItems[index]['target_persen']!.dispose();
        _ikuItems.removeAt(index);
      });
    }
  }

  void _addRabItem(String category) {
    final list = category == 'barang'
        ? _rabBarang
        : (category == 'jasa' ? _rabJasa : _rabPerjalanan);
    setState(() {
      list.add({
        'uraian': TextEditingController(),
        'qty1': TextEditingController(text: '1'),
        'satuan1': '',
        'qty2': TextEditingController(text: '1'),
        'satuan2': '',
        'qty3': TextEditingController(),
        'satuan3': '',
        'harga_satuan': TextEditingController(),
      });
    });
  }

  void _removeRabItem(int index, String category) {
    final list = category == 'barang'
        ? _rabBarang
        : (category == 'jasa' ? _rabJasa : _rabPerjalanan);
    if (list.length > 1) {
      setState(() {
        list[index]['uraian']!.dispose();
        list[index]['qty1']!.dispose();
        list[index]['qty2']!.dispose();
        list[index]['qty3']!.dispose();
        list[index]['harga_satuan']!.dispose();
        list.removeAt(index);
      });
    }
  }

  List<String> _getSatuanOptions(String category) {
    if (category == 'barang') {
      return ['', 'OK', 'LS', 'PCS', 'PACK', 'SET', 'UNIT', 'BOX'];
    } else if (category == 'jasa') {
      return ['', 'ORG', 'JAM', 'KALI', 'LS'];
    } else {
      return ['', 'PP', 'ORG', 'KALI', 'LS'];
    }
  }

  double _calculateItemTotal(Map<String, dynamic> item) {
    final q1 = double.tryParse(item['qty1']!.text) ?? 0.0;
    final q2 = double.tryParse(item['qty2']!.text) ?? 0.0;
    final q3Text = item['qty3']!.text;
    final q3 = q3Text.isEmpty ? 0.0 : (double.tryParse(q3Text) ?? 0.0);
    final h = double.tryParse(item['harga_satuan']!.text) ?? 0.0;
    return q3 > 0 ? q1 * q2 * q3 * h : q1 * q2 * h;
  }

  double _getCategorySubtotal(List<Map<String, dynamic>> list) {
    return list.fold(0.0, (sum, it) => sum + _calculateItemTotal(it));
  }

  double _getGrandTotal() {
    return _getCategorySubtotal(_rabBarang) +
        _getCategorySubtotal(_rabJasa) +
        _getCategorySubtotal(_rabPerjalanan);
  }

  String _formatCurrency(double amount) {
    final str = amount.toInt().toString();
    final buffer = StringBuffer();
    for (int i = 0; i < str.length; i++) {
      if (i > 0 && (str.length - i) % 3 == 0) buffer.write('.');
      buffer.write(str[i]);
    }
    return 'Rp $buffer';
  }

  Future<void> _selectDate(TextEditingController ctrl, {DateTime? firstDate}) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now().isAfter(firstDate ?? DateTime.now()) ? DateTime.now() : (firstDate ?? DateTime.now()),
      firstDate: firstDate ?? DateTime.now().subtract(const Duration(days: 30)),
      lastDate: DateTime.now().add(const Duration(days: 365 * 2)),
      builder: (context, child) => Theme(
        data: ThemeData.light().copyWith(
          colorScheme: const ColorScheme.light(primary: Color(0xFF047857)),
        ),
        child: child!,
      ),
    );
    if (picked != null) {
      ctrl.text = '${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
      setState(() {});
    }
  }

  bool _validateStep(int step) {
    if (step == 0) {
      if (_namaKegiatanCtrl.text.trim().isEmpty) {
        _showError('Nama kegiatan wajib diisi');
        return false;
      }
      if (_jenisKegiatanCtrl.text.trim().isEmpty) {
        _showError('Jenis kegiatan wajib diisi');
        return false;
      }
      if (_tanggalKegiatanCtrl.text.isEmpty) {
        _showError('Tanggal kegiatan wajib diisi');
        return false;
      }
      if (_tempatCtrl.text.trim().isEmpty) {
        _showError('Tempat / lokasi wajib diisi');
        return false;
      }
      if (_pengusulOrganisasiCtrl.text.trim().isEmpty) {
        _showError('Pengusul / organisasi wajib diisi');
        return false;
      }
    } else if (step == 1) {
      if (_gambaranUmumCtrl.text.trim().isEmpty) {
        _showError('Gambaran umum wajib diisi');
        return false;
      }
      if (_penerimaManfaatCtrl.text.trim().isEmpty) {
        _showError('Penerima manfaat wajib diisi');
        return false;
      }
      if (_metodePelaksanaanCtrl.text.trim().isEmpty) {
        _showError('Metode pelaksanaan wajib diisi');
        return false;
      }
      if (_tahapanPelaksanaanCtrl.text.trim().isEmpty) {
        _showError('Tahapan pelaksanaan wajib diisi');
        return false;
      }
      if (_strategiPencapaianCtrl.text.trim().isEmpty) {
        _showError('Strategi pencapaian wajib diisi');
        return false;
      }
      if (_kurunWaktuDariCtrl.text.isEmpty) {
        _showError('Kurun waktu mulai wajib diisi');
        return false;
      }
      if (_kurunWaktuSampaiCtrl.text.isEmpty) {
        _showError('Kurun waktu selesai wajib diisi');
        return false;
      }
      if (_indikatorRows.isEmpty) {
        _showError('Minimal 1 Indikator Kinerja Keberhasilan harus ditambahkan');
        return false;
      }
      for (int i = 0; i < _indikatorRows.length; i++) {
        final row = _indikatorRows[i];
        if (row['bulan'] == null || row['bulan'].toString().isEmpty) {
          _showError('Bulan pada Indikator #${i + 1} wajib dipilih');
          return false;
        }
        if (row['indikator']!.text.trim().isEmpty) {
          _showError('Indikator pada Indikator #${i + 1} wajib diisi');
          return false;
        }
        final target = double.tryParse(row['target']!.text);
        if (target == null || target < 0 || target > 100) {
          _showError('Target pada Indikator #${i + 1} harus di antara 0% s/d 100%');
          return false;
        }
      }
    } else if (step == 2) {
      if (_ikuItems.isEmpty) {
        _showError('Minimal 1 indikator IKU harus ditambahkan');
        return false;
      }
      for (int i = 0; i < _ikuItems.length; i++) {
        final row = _ikuItems[i];
        if (row['nama_indikator'] == null || row['nama_indikator'].toString().isEmpty) {
          _showError('Indikator IKU #${i + 1} wajib dipilih');
          return false;
        }
        final target = double.tryParse(row['target_persen']!.text);
        if (target == null || target < 0 || target > 100) {
          _showError('Target pada IKU #${i + 1} harus di antara 0% s/d 100%');
          return false;
        }
      }
    } else if (step == 3) {
      final allRab = [..._rabBarang, ..._rabJasa, ..._rabPerjalanan];
      final filledRab = allRab.where((it) => it['uraian']!.text.trim().isNotEmpty && (double.tryParse(it['harga_satuan']!.text) ?? 0) > 0).toList();
      if (filledRab.isEmpty) {
        _showError('Minimal 1 item RAB harus diisi lengkap (uraian dan harga satuan)');
        return false;
      }

      // Validate positive qty and non-negative price for all filled items
      for (final cat in ['barang', 'jasa', 'perjalanan']) {
        final list = cat == 'barang' ? _rabBarang : (cat == 'jasa' ? _rabJasa : _rabPerjalanan);
        final label = cat == 'barang' ? 'Belanja Barang' : (cat == 'jasa' ? 'Belanja Jasa' : 'Belanja Perjalanan');
        for (int i = 0; i < list.length; i++) {
          final item = list[i];
          final uraian = item['uraian']!.text.trim();
          if (uraian.isNotEmpty) {
            final q1 = double.tryParse(item['qty1']!.text);
            if (q1 == null || q1 <= 0) {
              _showError('Jumlah 1 pada item $label #${i + 1} harus lebih dari 0');
              return false;
            }
            final q2Text = item['qty2']!.text;
            if (q2Text.isNotEmpty) {
              final q2 = double.tryParse(q2Text);
              if (q2 == null || q2 <= 0) {
                _showError('Jumlah 2 pada item $label #${i + 1} harus lebih dari 0');
                return false;
              }
            }
            final q3Text = item['qty3']!.text;
            if (q3Text.isNotEmpty) {
              final q3 = double.tryParse(q3Text);
              if (q3 == null || q3 <= 0) {
                _showError('Jumlah 3 pada item $label #${i + 1} harus lebih dari 0');
                return false;
              }
            }
            final h = double.tryParse(item['harga_satuan']!.text);
            if (h == null || h < 0) {
              _showError('Harga satuan pada item $label #${i + 1} tidak boleh negatif');
              return false;
            }
          }
        }
      }

      if (_getGrandTotal() <= 0) {
        _showError('Total anggaran harus lebih dari Rp 0');
        return false;
      }
    }
    return true;
  }

  Future<void> _submitForm({required String status, String? verifikatorTarget}) async {
    setState(() => _isSubmitting = true);

    try {
      final fields = <String, String>{
        'nama_kegiatan': _namaKegiatanCtrl.text.trim(),
        'jenis_kegiatan': _jenisKegiatanCtrl.text.trim(),
        'tanggal_kegiatan': _tanggalKegiatanCtrl.text,
        'tempat': _tempatCtrl.text.trim(),
        'pengusul_organisasi': _pengusulOrganisasiCtrl.text.trim(),
        'status': status,
        if (verifikatorTarget != null) 'verifikator_target': verifikatorTarget,
      };

      final kak = {
        'gambaran_umum': _gambaranUmumCtrl.text.trim(),
        'penerima_manfaat': _penerimaManfaatCtrl.text.trim(),
        'metode_pelaksanaan': _metodePelaksanaanCtrl.text.trim(),
        'tahapan_pelaksanaan': _tahapanPelaksanaanCtrl.text.trim(),
        'strategi_pencapaian': _strategiPencapaianCtrl.text.trim(),
        'kurun_waktu_mulai': _kurunWaktuDariCtrl.text,
        'kurun_waktu_selesai': _kurunWaktuSampaiCtrl.text,
        'indikator': _indikatorRows.map((row) => {
          'bulan': row['bulan'],
          'indikator': row['indikator']!.text.trim(),
          'target': double.tryParse(row['target']!.text) ?? 0.0,
        }).toList(),
      };
      fields['kak'] = jsonEncode(kak);

      final iku = _ikuItems.where((item) => item['nama_indikator'].toString().isNotEmpty).map((item) => {
        'nama_iku': item['nama_indikator'],
        'target_persen': double.tryParse(item['target_persen']!.text) ?? 0.0,
      }).toList();
      fields['iku'] = jsonEncode(iku);

      List<Map<String, dynamic>> mapRabItems(List<Map<String, dynamic>> list, String category) {
        return list.where((it) => it['uraian']!.text.trim().isNotEmpty).map((it) => {
          'kategori': category,
          'uraian': it['uraian']!.text.trim(),
          'qty1': double.tryParse(it['qty1']!.text) ?? 1.0,
          'satuan1': it['satuan1'],
          'qty2': double.tryParse(it['qty2']!.text) ?? 1.0,
          'satuan2': it['satuan2'],
          'qty3': it['qty3']!.text.isEmpty ? null : (double.tryParse(it['qty3']!.text)),
          'satuan3': it['satuan3'],
          'harga_satuan': double.tryParse(it['harga_satuan']!.text) ?? 0.0,
        }).toList();
      }

      final rab = [
        ...mapRabItems(_rabBarang, 'barang'),
        ...mapRabItems(_rabJasa, 'jasa'),
        ...mapRabItems(_rabPerjalanan, 'perjalanan'),
      ];
      fields['rab'] = jsonEncode(rab);

      final files = <String, String>{};
      if (_suratPengantarFile != null) {
        files['surat_pengantar'] = _suratPengantarFile!.path;
      }

      String endpoint = '/kegiatan';
      if (_isEditMode) {
        endpoint = '/kegiatan/${widget.editId}';
        fields['_method'] = 'PUT';
      }

      final response = await _apiService.postMultipart(
        endpoint,
        fields: fields,
        files: files.isNotEmpty ? files : null,
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        if (mounted) {
          final isDraft = status == 'draft';
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(isDraft 
                  ? 'Draft usulan berhasil disimpan!' 
                  : (_isEditMode ? 'Usulan berhasil diperbarui!' : 'Usulan berhasil dikirim!')),
              backgroundColor: const Color(0xFF047857),
            ),
          );
          Navigator.pop(context, true);
        }
      } else {
        final errData = jsonDecode(response.body);
        _showError(errData['message'] ?? 'Gagal menyimpan data (${response.statusCode})');
      }
    } catch (e) {
      _showError('Kesalahan jaringan: $e');
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Future<void> _showVerifikatorModal() async {
    String? selectedWadir;
    final options = [
      {'value': 'wadir1', 'label': 'Wadir I', 'desc': 'Bidang Akademik'},
      {'value': 'wadir2', 'label': 'Wadir II', 'desc': 'Bidang Administrasi & Keuangan'},
      {'value': 'wadir3', 'label': 'Wadir III', 'desc': 'Bidang Kemahasiswaan & Alumni'},
      {'value': 'wadir4', 'label': 'Wadir IV', 'desc': 'Bidang Kerjasama & Perencanaan'},
    ];

    final target = await showDialog<String>(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              titlePadding: EdgeInsets.zero,
              contentPadding: const EdgeInsets.all(20),
              title: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF0B6B4A), Color(0xFF047857)],
                  ),
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(20),
                    topRight: Radius.circular(20),
                  ),
                ),
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0x33FFFFFF),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(LucideIcons.checkCircle, color: Colors.white, size: 24),
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Pilih Verifikator Wadir', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                          Text('Tentukan tujuan verifikasi usulan', style: TextStyle(color: Colors.white70, fontSize: 12)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Tentukan Wakil Direktur tujuan verifikasi untuk usulan ini. Pengajuan akan diarahkan ke pilihan Anda.',
                    style: TextStyle(color: Color(0xFF475569), fontSize: 13),
                  ),
                  const SizedBox(height: 16),
                  ...options.map((opt) {
                    final isSelected = selectedWadir == opt['value'];
                    return Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      decoration: BoxDecoration(
                        border: Border.all(
                          color: isSelected ? const Color(0xFF047857) : const Color(0xFFE2E8F0),
                          width: 2,
                        ),
                        borderRadius: BorderRadius.circular(12),
                        color: isSelected ? const Color(0xFFECFDF5) : Colors.white,
                      ),
                      child: RadioListTile<String>(
                        value: opt['value']!,
                        groupValue: selectedWadir,
                        activeColor: const Color(0xFF047857),
                        title: Text(opt['label']!, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF1E293B))),
                        subtitle: Text(opt['desc']!, style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                        onChanged: (val) {
                          setDialogState(() {
                            selectedWadir = val;
                          });
                        },
                      ),
                    );
                  }).toList(),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Batal', style: TextStyle(color: Color(0xFF64748B), fontWeight: FontWeight.bold)),
                ),
                ElevatedButton(
                  onPressed: selectedWadir == null ? null : () => Navigator.pop(context, selectedWadir),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF047857),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(LucideIcons.send, size: 16),
                      SizedBox(width: 8),
                      Text('Kirim Usulan', style: TextStyle(fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              ],
            );
          },
        );
      },
    );

    if (target != null) {
      _submitForm(status: 'submitted', verifikatorTarget: target);
    }
  }

  List<MapEntry<String, String>> _getMatchedComments(List<String> fields) {
    final matched = <MapEntry<String, String>>[];
    for (final entry in _revisiComments.entries) {
      for (final field in fields) {
        if (entry.key.toLowerCase().contains(field.toLowerCase())) {
          matched.add(entry);
          break;
        }
      }
    }
    final seenKeys = <String>{};
    final unique = <MapEntry<String, String>>[];
    for (final m in matched) {
      if (!seenKeys.contains(m.key)) {
        seenKeys.add(m.key);
        unique.add(m);
      }
    }
    return unique;
  }

  bool _hasRevisiComment(List<String> fields) {
    return _getMatchedComments(fields).isNotEmpty;
  }

  Widget _buildRevisiNote(List<String> fields) {
    final matched = _getMatchedComments(fields);
    if (matched.isEmpty) return const SizedBox.shrink();
    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFBEB), // bg-amber-50
        border: Border.all(color: const Color(0xFFFDE68A)), // border-amber-200
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(LucideIcons.messageSquare, color: Color(0xFFD97706), size: 16),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Catatan Revisi Verifikator:',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                    color: Color(0xFF92400E),
                  ),
                ),
                const SizedBox(height: 4),
                ...matched.map((e) => Text(
                  e.value,
                  style: const TextStyle(
                    fontWeight: FontWeight.w500,
                    fontSize: 12,
                    color: Color(0xFFB45309),
                  ),
                )),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGlobalRevisiAlert() {
    if (_revisiComments.isEmpty) return const SizedBox.shrink();
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFBEB), // bg-amber-50
        border: Border.all(color: const Color(0xFFFDE68A)), // border-amber-200
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(LucideIcons.alertTriangle, color: Color(0xFFD97706), size: 20),
              const SizedBox(width: 8),
              const Text(
                'Perhatian: Revisi Diperlukan',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 15,
                  color: Color(0xFF78350F),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Divider(color: Color(0xFFFDE68A)),
          const SizedBox(height: 8),
          ..._revisiComments.entries.map((entry) {
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0x99FFFFFF),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFFEF3C7)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    entry.key.replaceAll('_', ' ').toUpperCase(),
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 11,
                      color: Color(0xFF78350F),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    entry.value,
                    style: const TextStyle(
                      fontSize: 13,
                      color: Color(0xFF92400E),
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: Colors.red),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF0F172A),
        elevation: 1,
        title: Text(_isEditMode ? 'Edit Usulan' : 'Buat Usulan Baru', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          if (!_isLoading)
            TextButton.icon(
              onPressed: _isSubmitting ? null : () => _submitForm(status: 'draft'),
              icon: const Icon(LucideIcons.save, size: 16, color: Color(0xFF047857)),
              label: const Text('Simpan Draft', style: TextStyle(color: Color(0xFF047857), fontWeight: FontWeight.bold)),
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF047857)))
          : SafeArea(
              child: Column(
                children: [
                  // Progress Step Tracker
                  Container(
                    color: Colors.white,
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                    child: _buildStepProgress(),
                  ),
                  const Divider(height: 1, color: Color(0xFFE2E8F0)),

                  // Step Content
                  Expanded(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          _buildGlobalRevisiAlert(),
                          _buildCurrentStepContent(),
                        ],
                      ),
                    ),
                  ),

                  // Bottom Nav Bar
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        if (_currentStep > 0)
                          OutlinedButton.icon(
                            onPressed: () {
                              setState(() {
                                _currentStep--;
                              });
                            },
                            icon: const Icon(LucideIcons.arrowLeft, size: 16),
                            label: const Text('Kembali', style: TextStyle(fontWeight: FontWeight.bold)),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: const Color(0xFF64748B),
                              side: const BorderSide(color: Color(0xFFCBD5E1)),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                            ),
                          )
                        else
                          OutlinedButton(
                            onPressed: () => Navigator.pop(context),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: const Color(0xFF64748B),
                              side: const BorderSide(color: Color(0xFFCBD5E1)),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                            ),
                            child: const Text('Batal', style: TextStyle(fontWeight: FontWeight.bold)),
                          ),
                        ElevatedButton(
                          onPressed: _isSubmitting
                              ? null
                              : () {
                                  if (_validateStep(_currentStep)) {
                                    if (_currentStep < 3) {
                                      setState(() {
                                        _currentStep++;
                                      });
                                    } else {
                                      _showVerifikatorModal();
                                    }
                                  }
                                },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF047857),
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                          ),
                          child: _isSubmitting
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                )
                              : Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(_currentStep == 3 ? 'Kirim Usulan' : 'Lanjut',
                                        style: const TextStyle(fontWeight: FontWeight.bold)),
                                    const SizedBox(width: 8),
                                    Icon(_currentStep == 3 ? LucideIcons.send : LucideIcons.arrowRight, size: 16),
                                  ],
                                ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildStepProgress() {
    final steps = [
      {'id': 1, 'name': 'Info Kegiatan'},
      {'id': 2, 'name': 'Kerangka Acuan (KAK)'},
      {'id': 3, 'name': 'Kinerja (IKU)'},
      {'id': 4, 'name': 'Anggaran (RAB)'},
    ];

    return Row(
      children: steps.asMap().entries.map((entry) {
        final idx = entry.key;
        final step = entry.value;
        final id = step['id'] as int;

        final isActive = _currentStep == idx;
        final isCompleted = _currentStep > idx;

        return Expanded(
          child: Row(
            children: [
              if (idx > 0)
                Expanded(
                  child: Container(
                    height: 3,
                    color: isCompleted ? const Color(0xFF10B981) : const Color(0xFFE2E8F0),
                  ),
                ),
              const SizedBox(width: 4),
              GestureDetector(
                onTap: () {
                  if (idx < _currentStep) {
                    setState(() {
                      _currentStep = idx;
                    });
                  }
                },
                child: Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: isActive
                        ? const Color(0xFF047857)
                        : (isCompleted ? const Color(0xFFECFDF5) : const Color(0xFFF1F5F9)),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isActive
                          ? const Color(0xFF047857)
                          : (isCompleted ? const Color(0xFFA7F3D0) : const Color(0xFFE2E8F0)),
                      width: 2,
                    ),
                  ),
                  child: Center(
                    child: isCompleted
                        ? const Icon(Icons.check, color: Color(0xFF047857), size: 14)
                        : Text(
                            '$id',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: isActive
                                  ? Colors.white
                                  : (isCompleted ? const Color(0xFF047857) : const Color(0xFF94A3B8)),
                            ),
                          ),
                  ),
                ),
              ),
              const SizedBox(width: 4),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildCurrentStepContent() {
    switch (_currentStep) {
      case 0:
        return _buildInfoUmumStep();
      case 1:
        return _buildKakStep();
      case 2:
        return _buildIkuStep();
      case 3:
        return _buildRabStep();
      default:
        return Container();
    }
  }

  Widget _buildInfoUmumStep() {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Color(0xFFE2E8F0)),
      ),
      color: Colors.white,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Informasi Utama Kegiatan',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
            ),
            const SizedBox(height: 16),
            _buildTextField(_namaKegiatanCtrl, 'Nama Kegiatan *', LucideIcons.fileText, commentFields: ['nama', 'info - nama']),
            const SizedBox(height: 16),
            _buildTextField(_jenisKegiatanCtrl, 'Jenis Kegiatan *', LucideIcons.tag, hint: 'Seminar / Workshop', commentFields: ['jenis']),
            const SizedBox(height: 16),
            _buildTextField(_pengusulOrganisasiCtrl, 'Organisasi Pengusul *', LucideIcons.users, hint: 'Himpunan Mahasiswa', commentFields: ['pengusul', 'organisasi']),
            const SizedBox(height: 16),
            _buildTextField(_tempatCtrl, 'Tempat / Lokasi Kegiatan *', LucideIcons.mapPin, hint: 'Aula Gedung Utama', commentFields: ['tempat']),
            const SizedBox(height: 16),
            GestureDetector(
              onTap: () => _selectDate(_tanggalKegiatanCtrl),
              child: AbsorbPointer(
                child: _buildTextField(_tanggalKegiatanCtrl, 'Tanggal Kegiatan *', LucideIcons.calendar, commentFields: ['tanggal']),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildKakStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Card(
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: const BorderSide(color: Color(0xFFE2E8F0)),
          ),
          color: Colors.white,
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text('Kerangka Acuan Kerja (KAK)', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                _buildTextArea(_gambaranUmumCtrl, 'Gambaran Umum Acara *', commentFields: ['gambaran', 'umum']),
                const SizedBox(height: 16),
                _buildTextArea(_penerimaManfaatCtrl, 'Penerima Manfaat *', commentFields: ['penerima', 'manfaat']),
                const SizedBox(height: 16),
                _buildTextArea(_metodePelaksanaanCtrl, 'Metode Pelaksanaan *', commentFields: ['metode']),
                const SizedBox(height: 16),
                _buildTextArea(_tahapanPelaksanaanCtrl, 'Tahapan Pelaksanaan *', commentFields: ['tahapan']),
                const SizedBox(height: 16),
                _buildTextArea(_strategiPencapaianCtrl, 'Strategi Pencapaian Keluaran *', commentFields: ['strategi']),
                const SizedBox(height: 16),
                GestureDetector(
                  onTap: () => _selectDate(_kurunWaktuDariCtrl),
                  child: AbsorbPointer(
                    child: _buildTextField(_kurunWaktuDariCtrl, 'Kurun Waktu Pelaksanaan (Dari) *', LucideIcons.calendar, commentFields: ['waktu', 'kurun']),
                  ),
                ),
                const SizedBox(height: 16),
                GestureDetector(
                  onTap: () => _selectDate(_kurunWaktuSampaiCtrl, firstDate: _kurunWaktuDariCtrl.text.isNotEmpty ? DateTime.tryParse(_kurunWaktuDariCtrl.text) : null),
                  child: AbsorbPointer(
                    child: _buildTextField(_kurunWaktuSampaiCtrl, 'Kurun Waktu Pelaksanaan (Sampai) *', LucideIcons.calendarCheck, commentFields: ['waktu', 'kurun']),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        Card(
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: const BorderSide(color: Color(0xFFE2E8F0)),
          ),
          color: Colors.white,
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Indikator Keberhasilan', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                    TextButton.icon(
                      onPressed: _addIndikatorRow,
                      icon: const Icon(LucideIcons.plus, size: 16),
                      label: const Text('Tambah'),
                      style: TextButton.styleFrom(foregroundColor: const Color(0xFF047857)),
                    ),
                  ],
                ),
                _buildRevisiNote(['indikator']),
                const SizedBox(height: 12),
                ..._indikatorRows.asMap().entries.map((entry) {
                  final index = entry.key;
                  final row = entry.value;

                  return Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Indikator #${index + 1}',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF047857))),
                            if (_indikatorRows.length > 1)
                              IconButton(
                                icon: const Icon(LucideIcons.trash2, size: 16, color: Colors.red),
                                onPressed: () => _removeIndikatorRow(index),
                              ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        DropdownButtonFormField<String>(
                          value: row['bulan'].toString().isEmpty ? null : row['bulan'].toString(),
                          decoration: _inputDecoration('Bulan *', null),
                          items: kIndonesianMonths.map((m) {
                            return DropdownMenuItem(value: m, child: Text(m));
                          }).toList(),
                          onChanged: (val) {
                            setState(() {
                              row['bulan'] = val;
                            });
                          },
                        ),
                        const SizedBox(height: 8),
                        _buildTextField(row['indikator']!, 'Indikator Keberhasilan *', null),
                        const SizedBox(height: 8),
                        _buildTextField(row['target']!, 'Target Kumulatif (%) *', null, isNumber: true, allowDecimal: true, maxLength: 5),
                      ],
                    ),
                  );
                }),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildIkuStep() {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Color(0xFFE2E8F0)),
      ),
      color: Colors.white,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Indikator Kinerja Utama (IKU)', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                TextButton.icon(
                  onPressed: _addIkuItem,
                  icon: const Icon(LucideIcons.plus, size: 16),
                  label: const Text('Tambah IKU'),
                  style: TextButton.styleFrom(foregroundColor: const Color(0xFF047857)),
                ),
              ],
            ),
            _buildRevisiNote(['iku']),
            const SizedBox(height: 16),
            ..._ikuItems.asMap().entries.map((entry) {
              final index = entry.key;
              final row = entry.value;

              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('IKU #${index + 1}',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF047857))),
                        if (_ikuItems.length > 1)
                          IconButton(
                            icon: const Icon(LucideIcons.trash2, size: 16, color: Colors.red),
                            onPressed: () => _removeIkuItem(index),
                          ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      value: row['nama_indikator'].toString().isEmpty ? null : row['nama_indikator'].toString(),
                      decoration: _inputDecoration('Pilih Indikator *', null),
                      isExpanded: true,
                      items: kIkuIndicatorList.map((iku) {
                        return DropdownMenuItem(value: iku, child: Text(iku, style: const TextStyle(fontSize: 12)));
                      }).toList(),
                      onChanged: (val) {
                        setState(() {
                          row['nama_indikator'] = val;
                        });
                      },
                    ),
                    const SizedBox(height: 8),
                    _buildTextField(row['target_persen']!, 'Target (%) *', null, isNumber: true, allowDecimal: true, maxLength: 5),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
    );
  }

  Widget _buildRabStep() {
    final list = _selectedRabCategory == 'barang'
        ? _rabBarang
        : (_selectedRabCategory == 'jasa' ? _rabJasa : _rabPerjalanan);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Category Selector
        SegmentedButton<String>(
          segments: const [
            ButtonSegment(value: 'barang', label: Text('Barang'), icon: Icon(LucideIcons.shoppingCart, size: 16)),
            ButtonSegment(value: 'jasa', label: Text('Jasa'), icon: Icon(LucideIcons.wrench, size: 16)),
            ButtonSegment(value: 'perjalanan', label: Text('Perjalanan'), icon: Icon(LucideIcons.plane, size: 16)),
          ],
          selected: {_selectedRabCategory},
          onSelectionChanged: (set) {
            setState(() {
              _selectedRabCategory = set.first;
            });
          },
          style: SegmentedButton.styleFrom(
            selectedBackgroundColor: const Color(0xFF047857),
            selectedForegroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
        _buildRevisiNote(['rab']),
        const SizedBox(height: 16),

        // Items list for category
        Card(
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: const BorderSide(color: Color(0xFFE2E8F0)),
          ),
          color: Colors.white,
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Rincian Belanja - ${_selectedRabCategory.toUpperCase()}',
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                    TextButton.icon(
                      onPressed: () => _addRabItem(_selectedRabCategory),
                      icon: const Icon(LucideIcons.plus, size: 16),
                      label: const Text('Tambah Item'),
                      style: TextButton.styleFrom(foregroundColor: const Color(0xFF047857)),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                ...list.asMap().entries.map((entry) {
                  final index = entry.key;
                  final item = entry.value;
                  final total = _calculateItemTotal(item);

                  return Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Item #${index + 1}',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF047857))),
                            if (list.length > 1)
                              IconButton(
                                icon: const Icon(LucideIcons.trash2, size: 16, color: Colors.red),
                                onPressed: () => _removeRabItem(index, _selectedRabCategory),
                              ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        _buildTextField(item['uraian']!, 'Uraian Belanja *', null),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Expanded(child: _buildTextField(item['qty1']!, 'Jumlah 1 *', null, isNumber: true, onChanged: (_) => setState(() {}), maxLength: 6)),
                            const SizedBox(width: 8),
                            Expanded(
                              child: DropdownButtonFormField<String>(
                                value: item['satuan1'].toString().isEmpty ? null : item['satuan1'].toString(),
                                decoration: _inputDecoration('Satuan 1 *', null),
                                items: _getSatuanOptions(_selectedRabCategory).map((s) {
                                  return DropdownMenuItem(value: s, child: Text(s.isEmpty ? 'Pilih' : s));
                                }).toList(),
                                onChanged: (val) {
                                  setState(() {
                                    item['satuan1'] = val;
                                  });
                                },
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Expanded(child: _buildTextField(item['qty2']!, 'Jumlah 2 *', null, isNumber: true, onChanged: (_) => setState(() {}), maxLength: 6)),
                            const SizedBox(width: 8),
                            Expanded(
                              child: DropdownButtonFormField<String>(
                                value: item['satuan2'].toString().isEmpty ? null : item['satuan2'].toString(),
                                decoration: _inputDecoration('Satuan 2 *', null),
                                items: _getSatuanOptions(_selectedRabCategory).map((s) {
                                  return DropdownMenuItem(value: s, child: Text(s.isEmpty ? 'Pilih' : s));
                                }).toList(),
                                onChanged: (val) {
                                  setState(() {
                                    item['satuan2'] = val;
                                  });
                                },
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Expanded(child: _buildTextField(item['qty3']!, 'Jumlah 3 (Opsional)', null, isNumber: true, onChanged: (_) => setState(() {}), maxLength: 6)),
                            const SizedBox(width: 8),
                            Expanded(
                              child: DropdownButtonFormField<String>(
                                value: item['satuan3'].toString().isEmpty ? null : item['satuan3'].toString(),
                                decoration: _inputDecoration('Satuan 3', null),
                                items: _getSatuanOptions(_selectedRabCategory).map((s) {
                                  return DropdownMenuItem(value: s, child: Text(s.isEmpty ? 'Pilih' : s));
                                }).toList(),
                                onChanged: (val) {
                                  setState(() {
                                    item['satuan3'] = val;
                                  });
                                },
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        _buildTextField(item['harga_satuan']!, 'Harga Satuan (Rp) *', null, isNumber: true, onChanged: (_) => setState(() {}), allowDecimal: true, maxLength: 15),
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Subtotal Item:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF64748B))),
                            Text(_formatCurrency(total), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Color(0xFF047857))),
                          ],
                        ),
                      ],
                    ),
                  );
                }),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFECFDF5),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFA7F3D0)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Subtotal Kategori:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF065F46))),
                      Text(_formatCurrency(_getCategorySubtotal(list)), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: Color(0xFF047857))),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Grand Total Box
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFFF0FDF4),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFF86EFAC), width: 2),
            boxShadow: const [
              BoxShadow(
                color: Color(0x1A047857),
                blurRadius: 10,
                offset: Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('TOTAL ANGGARAN (RAB):', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF166534))),
              Text(_formatCurrency(_getGrandTotal()), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: Color(0xFF15803D))),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildTextField(TextEditingController ctrl, String label, IconData? icon, {bool isNumber = false, String? hint, ValueChanged<String>? onChanged, List<String>? commentFields, bool allowDecimal = false, int? maxLength}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        TextField(
          controller: ctrl,
          keyboardType: isNumber ? TextInputType.number : TextInputType.text,
          onChanged: onChanged,
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: Color(0xFF0F172A)),
          decoration: _inputDecoration(label, icon, hint: hint, commentFields: commentFields),
        ),
        if (commentFields != null) _buildRevisiNote(commentFields),
      ],
    );
  }

  Widget _buildTextArea(TextEditingController ctrl, String label, {List<String>? commentFields}) {
    final hasComment = commentFields != null && _hasRevisiComment(commentFields);
    final borderColor = hasComment ? const Color(0xFFF59E0B) : const Color(0xFFE2E8F0);
    final fillColor = hasComment ? const Color(0xFFFEF3C7) : Colors.white;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        TextField(
          controller: ctrl,
          maxLines: 4,
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: Color(0xFF0F172A)),
          decoration: InputDecoration(
            labelText: label,
            labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF475569)),
            alignLabelWithHint: true,
            filled: true,
            fillColor: fillColor,
            border: _inputBorder(color: borderColor),
            enabledBorder: _inputBorder(color: borderColor),
            focusedBorder: _inputBorder(color: hasComment ? const Color(0xFFD97706) : const Color(0xFF059669)),
            contentPadding: const EdgeInsets.all(12),
          ),
        ),
        if (commentFields != null) _buildRevisiNote(commentFields),
      ],
    );
  }

  InputDecoration _inputDecoration(String label, IconData? icon, {String? hint, List<String>? commentFields}) {
    final hasComment = commentFields != null && _hasRevisiComment(commentFields);
    final borderColor = hasComment ? const Color(0xFFF59E0B) : const Color(0xFFE2E8F0);
    final fillColor = hasComment ? const Color(0xFFFEF3C7) : Colors.white;

    return InputDecoration(
      labelText: label,
      labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF475569)),
      hintText: hint,
      hintStyle: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8), fontWeight: FontWeight.normal),
      prefixIcon: icon != null ? Icon(icon, size: 18, color: const Color(0xFF94A3B8)) : null,
      filled: true,
      fillColor: fillColor,
      border: _inputBorder(color: borderColor),
      enabledBorder: _inputBorder(color: borderColor),
      focusedBorder: _inputBorder(color: hasComment ? const Color(0xFFD97706) : const Color(0xFF059669)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
    );
  }

  OutlineInputBorder _inputBorder({Color? color}) {
    return OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide(
        color: color ?? const Color(0xFFE2E8F0),
        width: 1.5,
      ),
    );
  }
}
