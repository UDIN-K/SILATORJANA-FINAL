import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;

class PdfGeneratorService {
  /// Memformat angka ke Rupiah
  static String formatCurrency(dynamic number) {
    if (number == null) return '0';
    double val = double.tryParse(number.toString()) ?? 0.0;
    String str = val.toStringAsFixed(0);
    String result = '';
    int count = 0;
    for (int i = str.length - 1; i >= 0; i--) {
      result = str[i] + result;
      count++;
      if (count == 3 && i > 0) {
        result = '.$result';
        count = 0;
      }
    }
    return result;
  }

  static String terbilang(double nilai) {
    nilai = nilai.abs();
    final huruf = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
    String temp = "";
    if (nilai < 12) { temp = " ${huruf[nilai.toInt()]}"; }
    else if (nilai < 20) { temp = "${terbilang(nilai - 10)} Belas"; }
    else if (nilai < 100) { temp = "${terbilang(nilai / 10)} Puluh${terbilang(nilai % 10)}"; }
    else if (nilai < 200) { temp = " Seratus${terbilang(nilai - 100)}"; }
    else if (nilai < 1000) { temp = "${terbilang(nilai / 100)} Ratus${terbilang(nilai % 100)}"; }
    else if (nilai < 1000000) { temp = "${terbilang(nilai / 1000)} Ribu${terbilang(nilai % 1000)}"; }
    else if (nilai < 1000000000) { temp = "${terbilang(nilai / 1000000)} Juta${terbilang(nilai % 1000000)}"; }
    else if (nilai < 1000000000000) { temp = "${terbilang(nilai / 1000000000)} Miliar${terbilang(nilai % 1000000000)}"; }
    return temp.trim();
  }

  static String formatDateIndo(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return '-';
    try {
      final date = DateTime.parse(dateStr);
      final months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
      return '${date.day} ${months[date.month - 1]} ${date.year}';
    } catch (_) {
      return dateStr;
    }
  }

  /// Men-generate PDF berdasarkan data kegiatan
  static Future<pw.Document> generatePdf(Map<String, dynamic> data) async {
    final pdf = pw.Document();

    // Load fonts and images
    final ByteData logoData = await rootBundle.load('assets/images/app-logo.png');
    final Uint8List logoBytes = logoData.buffer.asUint8List();

    final kak = data['kak'];
    final List<dynamic> ikuList = data['iku'] ?? [];
    final List<dynamic> rabList = data['rab'] ?? [];
    
    final documentNumber = 'KGT-${data['id'].toString().padLeft(4, '0')}/${DateTime.now().year}';
    final userName = data['pengusul_nama'] ?? 'Pengusul';
    final userJurusan = data['nama_jurusan'] ?? data['pengusul_organisasi'] ?? '-';

    // Group RAB
    Map<String, List<dynamic>> rabByCategory = {};
    double grandTotal = 0.0;
    for (var rab in rabList) {
      String cat = (rab['kategori'] ?? 'lainnya').toString().toLowerCase();
      rabByCategory.putIfAbsent(cat, () => []).add(rab);
    }

    // Colors
    final primaryColor = PdfColor.fromHex('#047857');
    final secondaryColor = PdfColor.fromHex('#1E293B');

    // 1. Cover Page
    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(40),
        build: (pw.Context context) {
          return pw.Center(
            child: pw.Column(
              mainAxisAlignment: pw.MainAxisAlignment.center,
              children: [
                pw.Container(
                  padding: const pw.EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: pw.BoxDecoration(
                    color: PdfColor.fromHex('#F1F5F9'),
                    borderRadius: const pw.BorderRadius.all(pw.Radius.circular(20)),
                  ),
                  child: pw.Text('Dokumen KAK · TA ${DateTime.now().year}', style: pw.TextStyle(color: secondaryColor, fontWeight: pw.FontWeight.bold)),
                ),
                pw.SizedBox(height: 60),
                pw.Image(pw.MemoryImage(logoBytes), width: 120),
                pw.SizedBox(height: 16),
                pw.Text('POLITEKNIK NEGERI JAKARTA', style: pw.TextStyle(fontSize: 16, fontWeight: pw.FontWeight.bold, letterSpacing: 2)),
                pw.SizedBox(height: 40),
                pw.Divider(thickness: 2, color: primaryColor),
                pw.SizedBox(height: 40),
                pw.Text('Kerangka Acuan Kerja', style: pw.TextStyle(fontSize: 28, fontWeight: pw.FontWeight.bold, color: primaryColor)),
                pw.Text('Tahun Anggaran ${DateTime.now().year}', style: pw.TextStyle(fontSize: 18, color: PdfColor.fromHex('#64748B'))),
                pw.SizedBox(height: 60),
                pw.Container(
                  padding: const pw.EdgeInsets.all(20),
                  decoration: pw.BoxDecoration(
                    border: pw.Border.all(color: PdfColor.fromHex('#E2E8F0')),
                    borderRadius: const pw.BorderRadius.all(pw.Radius.circular(8)),
                  ),
                  child: pw.Column(
                    children: [
                      _buildCoverInfoRow('Nomor Dokumen', documentNumber),
                      _buildCoverInfoRow('Kegiatan', data['nama_kegiatan'] ?? '-'),
                      _buildCoverInfoRow('Unit Kerja', userJurusan),
                      _buildCoverInfoRow('Pengusul', userName),
                    ],
                  ),
                ),
                pw.Spacer(),
                pw.Text('Kementerian Pendidikan Tinggi, Riset, dan Teknologi', style: pw.TextStyle(fontSize: 10, color: PdfColor.fromHex('#94A3B8'))),
                pw.Text('Politeknik Negeri Jakarta · ${DateTime.now().year}', style: pw.TextStyle(fontSize: 11, fontWeight: pw.FontWeight.bold, color: secondaryColor)),
              ],
            ),
          );
        },
      ),
    );

    // 2. Content Pages
    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.symmetric(horizontal: 50, vertical: 60),
        header: (context) => pw.Column(
          children: [
            pw.Row(
              children: [
                pw.Image(pw.MemoryImage(logoBytes), width: 60),
                pw.SizedBox(width: 16),
                pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text('POLITEKNIK NEGERI JAKARTA', style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold)),
                    pw.Text('SISTEM INFORMASI SILATORJANA', style: pw.TextStyle(fontSize: 12, fontWeight: pw.FontWeight.bold)),
                    pw.Text('Jl. Prof. DR. G.A. Siwabessy, Kampus Universitas Indonesia, Depok 16425', style: pw.TextStyle(fontSize: 9)),
                    pw.Text('Telepon: 021-7270036 | Email: humas@pnj.ac.id', style: pw.TextStyle(fontSize: 9)),
                  ],
                ),
              ],
            ),
            pw.SizedBox(height: 8),
            pw.Divider(thickness: 2),
            pw.SizedBox(height: 16),
          ],
        ),
        footer: (context) => pw.Column(
          children: [
            pw.Divider(thickness: 1),
            pw.SizedBox(height: 4),
            pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
              children: [
                pw.Text('Si-LATORJANA — Digenerate pada ${formatDateIndo(DateTime.now().toIso8601String())}', style: const pw.TextStyle(fontSize: 8)),
                pw.Text('Halaman ${context.pageNumber} dari ${context.pagesCount}', style: const pw.TextStyle(fontSize: 8)),
              ],
            ),
          ],
        ),
        build: (pw.Context context) {
          List<pw.Widget> content = [];

          // Document Title
          content.add(
            pw.Center(
              child: pw.Column(
                children: [
                  pw.Text('PROPOSAL KEGIATAN', style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold, decoration: pw.TextDecoration.underline)),
                  pw.Text('Nomor: $documentNumber', style: pw.TextStyle(fontSize: 11)),
                  pw.SizedBox(height: 24),
                ],
              ),
            ),
          );

          // I. Informasi Kegiatan
          content.add(_buildSectionTitle('I. INFORMASI KEGIATAN'));
          content.add(
            pw.Table(
              columnWidths: const {
                0: pw.FixedColumnWidth(120),
                1: pw.FixedColumnWidth(10),
                2: pw.FlexColumnWidth(),
              },
              children: [
                _buildInfoRow('Nama Kegiatan', data['nama_kegiatan'] ?? '-'),
                _buildInfoRow('Jenis Kegiatan', (data['jenis_kegiatan'] ?? '-').toString().toUpperCase()),
                _buildInfoRow('Tanggal Pelaksanaan', formatDateIndo(data['tanggal_kegiatan'])),
                _buildInfoRow('Tempat Pelaksanaan', data['tempat'] ?? '-'),
                _buildInfoRow('Pengusul', userName),
                _buildInfoRow('Jurusan', userJurusan),
              ],
            ),
          );
          content.add(pw.SizedBox(height: 20));

          // II. KAK
          if (kak != null) {
            content.add(_buildSectionTitle('II. KERANGKA ACUAN KERJA (KAK)'));
            if (kak['gambaran_umum'] != null) content.addAll(_buildKakItem('A. Gambaran Umum', kak['gambaran_umum']));
            if (kak['penerima_manfaat'] != null) content.addAll(_buildKakItem('B. Penerima Manfaat', kak['penerima_manfaat']));
            if (kak['strategi_pencapaian'] != null) content.addAll(_buildKakItem('C. Strategi Pencapaian', kak['strategi_pencapaian']));
            if (kak['metode_pelaksanaan'] != null) content.addAll(_buildKakItem('D. Metode Pelaksanaan', kak['metode_pelaksanaan']));
            if (kak['tahapan_pelaksanaan'] != null) content.addAll(_buildKakItem('E. Tahapan Pelaksanaan', kak['tahapan_pelaksanaan']));
            
            if (kak['indikator_kinerja'] != null) {
              content.add(pw.Padding(padding: const pw.EdgeInsets.only(top: 8, bottom: 4), child: pw.Text('F. Indikator Kinerja', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 11))));
              
              List<dynamic> indicators = [];
              try {
                indicators = jsonDecode(kak['indikator_kinerja']);
              } catch (_) {}
              
              if (indicators.isNotEmpty) {
                content.add(
                  pw.TableHelper.fromTextArray(
                    headerStyle: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 10),
                    cellStyle: const pw.TextStyle(fontSize: 10),
                    headerDecoration: pw.BoxDecoration(color: PdfColor.fromHex('#F8FAFC')),
                    headers: ['No', 'Bulan', 'Indikator Keberhasilan', 'Target (%)'],
                    data: indicators.asMap().entries.map((e) {
                      final item = e.value;
                      return [
                        (e.key + 1).toString(),
                        item['bulan'] ?? '-',
                        item['indikator'] ?? '-',
                        item['target'] != null ? '${item['target']}%' : '-',
                      ];
                    }).toList(),
                  ),
                );
              } else {
                content.add(pw.Text(kak['indikator_kinerja'] ?? '-', style: const pw.TextStyle(fontSize: 11)));
              }
            }
            content.add(pw.SizedBox(height: 20));
          }

          // III. IKU
          if (ikuList.isNotEmpty) {
            content.add(_buildSectionTitle('III. INDIKATOR KINERJA UTAMA (IKU)'));
            content.add(
              pw.TableHelper.fromTextArray(
                headerStyle: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 10),
                cellStyle: const pw.TextStyle(fontSize: 10),
                headerDecoration: pw.BoxDecoration(color: PdfColor.fromHex('#F8FAFC')),
                headers: ['No', 'Nama IKU'],
                columnWidths: const {0: pw.FixedColumnWidth(40), 1: pw.FlexColumnWidth()},
                data: ikuList.asMap().entries.map((e) {
                  return [(e.key + 1).toString(), e.value['nama_iku'] ?? e.value['indikator'] ?? '-'];
                }).toList(),
              ),
            );
            content.add(pw.SizedBox(height: 20));
          }

          // IV. RAB
          if (rabList.isNotEmpty) {
            content.add(_buildSectionTitle('IV. RENCANA ANGGARAN BIAYA (RAB)'));
            
            List<List<dynamic>> rabTableData = [];
            rabTableData.add([
              'No', 'Uraian', 'Vol1', 'Sat1', 'Vol2', 'Sat2', 'Vol3', 'Sat3', 'Harga(Rp)', 'Jumlah(Rp)'
            ]);

            rabByCategory.forEach((kategori, items) {
              rabTableData.add(['', kategori.toUpperCase(), '', '', '', '', '', '', '', '']); // Kategori Header
              
              double subtotal = 0.0;
              for (int i = 0; i < items.length; i++) {
                final item = items[i];
                final q1 = double.tryParse(item['qty1']?.toString() ?? item['volume']?.toString() ?? '0') ?? 0;
                final q2 = double.tryParse(item['qty2']?.toString() ?? '0') ?? 0;
                final q3 = double.tryParse(item['qty3']?.toString() ?? '0') ?? 0;
                
                double vol = q1;
                if (q2 > 0) vol *= q2;
                if (q3 > 0) vol *= q3;
                if (vol == 0) vol = 1;
                
                final harga = double.tryParse(item['harga_satuan']?.toString() ?? '0') ?? 0;
                final jumlah = vol * harga;
                subtotal += jumlah;
                grandTotal += jumlah;
                
                rabTableData.add([
                  (i + 1).toString(),
                  item['uraian'] ?? '-',
                  q1 > 0 ? q1.toString() : '-',
                  item['satuan1'] ?? item['satuan'] ?? '-',
                  q2 > 0 ? q2.toString() : '-',
                  q2 > 0 ? (item['satuan2'] ?? '-') : '-',
                  q3 > 0 ? q3.toString() : '-',
                  q3 > 0 ? (item['satuan3'] ?? '-') : '-',
                  formatCurrency(harga),
                  formatCurrency(jumlah),
                ]);
              }
              rabTableData.add(['', 'Subtotal', '', '', '', '', '', '', '', formatCurrency(subtotal)]);
            });

            rabTableData.add(['', 'TOTAL ANGGARAN DIUSULKAN', '', '', '', '', '', '', '', formatCurrency(grandTotal)]);

            content.add(
              pw.TableHelper.fromTextArray(
                headerStyle: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 8),
                cellStyle: const pw.TextStyle(fontSize: 8),
                headerDecoration: pw.BoxDecoration(color: PdfColor.fromHex('#F8FAFC')),
                cellAlignment: pw.Alignment.centerLeft,
                headers: rabTableData[0].map((e) => e.toString()).toList(),
                data: rabTableData.sublist(1).map((row) => row.map((e) => e.toString()).toList()).toList(),
              ),
            );
            
            content.add(pw.SizedBox(height: 10));
            content.add(
              pw.Container(
                padding: const pw.EdgeInsets.all(8),
                decoration: pw.BoxDecoration(color: PdfColor.fromHex('#F1F5F9'), border: pw.Border.all(color: PdfColor.fromHex('#E2E8F0'))),
                child: pw.Text('Terbilang: ${terbilang(grandTotal)} Rupiah', style: pw.TextStyle(fontSize: 10, fontStyle: pw.FontStyle.italic, fontWeight: pw.FontWeight.bold)),
              )
            );
            content.add(pw.SizedBox(height: 20));
          }

          // V. Lampiran
          content.add(_buildSectionTitle('V. LAMPIRAN'));
          content.add(
            pw.Table(
              columnWidths: const {0: pw.FixedColumnWidth(120), 1: pw.FixedColumnWidth(10), 2: pw.FlexColumnWidth()},
              children: [
                _buildInfoRow('Surat Pengantar', data['surat_pengantar'] != null ? 'Ada Dokumen' : 'Tidak ada'),
                _buildInfoRow('Dokumen KAK', kak?['file_kak'] != null ? 'Ada Dokumen' : 'Tidak ada'),
              ],
            ),
          );
          content.add(pw.SizedBox(height: 40));

          // Signatures
          content.add(
            pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
              children: [
                pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.center,
                  children: [
                    pw.Text('Mengetahui,', style: const pw.TextStyle(fontSize: 11)),
                    pw.Text('Ketua Jurusan', style: pw.TextStyle(fontSize: 11, fontWeight: pw.FontWeight.bold)),
                    pw.SizedBox(height: 60),
                    pw.Text('.......................................', style: pw.TextStyle(fontSize: 11, fontWeight: pw.FontWeight.bold)),
                    pw.Text('NIP. ................................', style: const pw.TextStyle(fontSize: 11)),
                  ]
                ),
                pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.center,
                  children: [
                    pw.Text('Depok, ${formatDateIndo(DateTime.now().toIso8601String())}', style: const pw.TextStyle(fontSize: 11)),
                    pw.Text('Pengusul,', style: pw.TextStyle(fontSize: 11, fontWeight: pw.FontWeight.bold)),
                    pw.SizedBox(height: 60),
                    pw.Text(userName, style: pw.TextStyle(fontSize: 11, fontWeight: pw.FontWeight.bold)),
                    pw.Text('NIP/NIM. ................................', style: const pw.TextStyle(fontSize: 11)),
                  ]
                ),
              ]
            )
          );

          return content;
        },
      ),
    );

    return pdf;
  }

  static pw.Widget _buildCoverInfoRow(String label, String value) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(vertical: 4),
      child: pw.Row(
        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
        children: [
          pw.Text(label, style: pw.TextStyle(color: PdfColor.fromHex('#64748B'), fontSize: 12)),
          pw.Text(value, style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 12)),
        ],
      ),
    );
  }

  static pw.Widget _buildSectionTitle(String title) {
    return pw.Padding(
      padding: const pw.EdgeInsets.only(bottom: 8),
      child: pw.Text(title, style: pw.TextStyle(fontSize: 12, fontWeight: pw.FontWeight.bold)),
    );
  }

  static pw.TableRow _buildInfoRow(String label, String value) {
    return pw.TableRow(
      children: [
        pw.Padding(padding: const pw.EdgeInsets.symmetric(vertical: 4), child: pw.Text(label, style: const pw.TextStyle(fontSize: 11))),
        pw.Padding(padding: const pw.EdgeInsets.symmetric(vertical: 4), child: pw.Text(':', style: const pw.TextStyle(fontSize: 11))),
        pw.Padding(padding: const pw.EdgeInsets.symmetric(vertical: 4), child: pw.Text(value, style: const pw.TextStyle(fontSize: 11))),
      ],
    );
  }

  static List<pw.Widget> _buildKakItem(String title, String content) {
    return [
      pw.Padding(padding: const pw.EdgeInsets.only(top: 8, bottom: 4), child: pw.Text(title, style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 11))),
      pw.Text(content, style: const pw.TextStyle(fontSize: 11)),
    ];
  }
}
