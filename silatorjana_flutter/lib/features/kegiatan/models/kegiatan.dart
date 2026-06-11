class Kegiatan {
  final int id;
  final String judul;
  final String status;
  final String createdAt;
  final String updatedAt;
  final String namaPengusul;
  final String namaKegiatan;
  final String? namaJurusan;
  final String? jenisKegiatan;
  final String? verifikatorTarget;
  final String? catatanRevisi;
  final num? totalAnggaran;
  final int? pengusulId;
  final String? deskripsi;
  final String? tempat;
  final String? tanggalKegiatan;
  final String? pengusulOrganisasi;
  final String? kodeMak;
  final String? suratPengantarFilename;
  final bool uangMukaDiambil;
  final List<Map<String, dynamic>> pencairanDana;
  final String? deadlineLpj;
  final List<dynamic> penanggungJawab;

  Kegiatan({
    required this.id,
    required this.judul,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
    required this.namaPengusul,
    required this.namaKegiatan,
    this.namaJurusan,
    this.jenisKegiatan,
    this.verifikatorTarget,
    this.catatanRevisi,
    this.totalAnggaran,
    this.pengusulId,
    this.deskripsi,
    this.tempat,
    this.tanggalKegiatan,
    this.pengusulOrganisasi,
    this.kodeMak,
    this.suratPengantarFilename,
    this.uangMukaDiambil = false,
    this.pencairanDana = const [],
    this.deadlineLpj,
    this.penanggungJawab = const [],
  });

  /// Safe int parser
  static int _toInt(dynamic value, [int fallback = 0]) {
    if (value == null) return fallback;
    if (value is int) return value;
    if (value is num) return value.toInt();
    if (value is String) return int.tryParse(value) ?? fallback;
    return fallback;
  }

  /// Safe num parser
  static num? _toNum(dynamic value) {
    if (value == null) return null;
    if (value is num) return value;
    if (value is String) return num.tryParse(value);
    return null;
  }

  /// Format tanggal dari ISO ke "dd/MM/yyyy"
  String get formattedDate {
    if (createdAt.length >= 10) {
      final parts = createdAt.substring(0, 10).split('-');
      if (parts.length == 3) return '${parts[2]}/${parts[1]}/${parts[0]}';
    }
    return createdAt;
  }

  /// Format anggaran ke "Rp 462.442"
  String get formattedAnggaran {
    if (totalAnggaran == null) return 'Rp 0';
    final amount = totalAnggaran!.toInt();
    final str = amount.toString();
    final buffer = StringBuffer();
    for (int i = 0; i < str.length; i++) {
      if (i > 0 && (str.length - i) % 3 == 0) buffer.write('.');
      buffer.write(str[i]);
    }
    return 'Rp $buffer';
  }

  factory Kegiatan.fromJson(Map<String, dynamic> json) {
    // Handle pengusul name from multiple possible fields
    String pengusulNama = 'Pengusul';
    if (json['pengusul_nama'] != null) {
      pengusulNama = json['pengusul_nama'].toString();
    } else if (json['pengusul'] != null && json['pengusul'] is Map) {
      pengusulNama = json['pengusul']['nama']?.toString() ?? 'Pengusul';
    } else if (json['user'] != null && json['user'] is Map) {
      pengusulNama = json['user']['nama']?.toString() ?? 'Pengusul';
    }

    // Handle jurusan from multiple fields
    String? jurusan;
    if (json['nama_jurusan'] != null) {
      jurusan = json['nama_jurusan'].toString();
    } else if (json['pengusul'] != null && json['pengusul'] is Map) {
      jurusan = json['pengusul']['jurusan']?.toString();
    }

    return Kegiatan(
      id: _toInt(json['id']),
      judul: json['nama_kegiatan']?.toString() ?? 'Tanpa Judul',
      status: json['status']?.toString() ?? 'draft',
      createdAt: json['created_at']?.toString() ?? '',
      updatedAt: json['updated_at']?.toString() ?? json['created_at']?.toString() ?? '',
      namaPengusul: pengusulNama,
      namaKegiatan: json['nama_kegiatan']?.toString() ?? 'Tanpa Judul',
      namaJurusan: jurusan,
      jenisKegiatan: json['jenis_kegiatan']?.toString(),
      verifikatorTarget: json['verifikator_target']?.toString(),
      catatanRevisi: json['catatan_revisi']?.toString(),
      totalAnggaran: _toNum(json['total_anggaran']),
      pengusulId: json['pengusul_id'] != null ? _toInt(json['pengusul_id']) : null,
      deskripsi: json['deskripsi']?.toString(),
      tempat: json['tempat']?.toString(),
      tanggalKegiatan: json['tanggal_kegiatan']?.toString(),
      pengusulOrganisasi: json['pengusul_organisasi']?.toString(),
      kodeMak: json['kode_mak']?.toString(),
      suratPengantarFilename: json['surat_pengantar_filename']?.toString(),
      uangMukaDiambil: json['uang_muka_diambil'] == true || json['uang_muka_diambil'] == 1,
      pencairanDana: (json['pencairan_dana'] as List?)?.cast<Map<String, dynamic>>() ?? [],
      deadlineLpj: json['deadline_lpj']?.toString(),
      penanggungJawab: (json['penanggung_jawab'] as List?) ?? [],
    );
  }
}
