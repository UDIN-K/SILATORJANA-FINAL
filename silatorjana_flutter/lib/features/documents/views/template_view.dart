import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// Template view — mirrors web's TemplatePage.tsx.
/// Shows downloadable document templates.
class TemplateView extends StatelessWidget {
  const TemplateView({super.key});

  @override
  Widget build(BuildContext context) {
    final templates = [
      {'title': 'Template KAK', 'desc': 'Kerangka Acuan Kerja standar kegiatan', 'icon': LucideIcons.fileText, 'color': const Color(0xFF3B82F6)},
      {'title': 'Template RAB', 'desc': 'Rencana Anggaran Biaya format Excel', 'icon': LucideIcons.table, 'color': const Color(0xFF10B981)},
      {'title': 'Template Surat Pengantar', 'desc': 'Surat pengantar dari jurusan', 'icon': LucideIcons.mail, 'color': const Color(0xFF8B5CF6)},
      {'title': 'Template LPJ', 'desc': 'Laporan Pertanggungjawaban kegiatan', 'icon': LucideIcons.clipboardCheck, 'color': const Color(0xFFF59E0B)},
      {'title': 'Panduan IKU', 'desc': 'Indikator Kinerja Utama — cara pengisian', 'icon': LucideIcons.target, 'color': const Color(0xFFDC2626)},
    ];

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: templates.length,
        itemBuilder: (context, index) {
          final t = templates[index];
          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: (t['color'] as Color).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(t['icon'] as IconData, size: 24, color: t['color'] as Color),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(t['title'] as String, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF1E293B))),
                      const SizedBox(height: 2),
                      Text(t['desc'] as String, style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(LucideIcons.download, size: 20, color: Color(0xFF047857)),
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Download fitur memerlukan package tambahan')),
                    );
                  },
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
