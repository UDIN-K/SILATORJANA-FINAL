import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, FileSpreadsheet, File, FolderOpen } from 'lucide-react';
import { useDraggableScroll } from '@/hooks/useDraggableScroll';

interface TemplateItem {
  icon: any;
  name: string;
  description: string;
  format: string;
  color: string;
}

const TEMPLATES: TemplateItem[] = [
  {
    icon: FileText,
    name: 'Template KAK (Kerangka Acuan Kerja)',
    description: 'Template standar dokumen Kerangka Acuan Kerja untuk pengajuan kegiatan kampus.',
    format: 'DOCX',
    color: 'text-blue-600 bg-blue-50',
  },
  {
    icon: FileSpreadsheet,
    name: 'Template RAB (Rincian Anggaran Biaya)',
    description: 'Spreadsheet template untuk menyusun rincian anggaran biaya kegiatan dengan perhitungan otomatis.',
    format: 'XLSX',
    color: 'text-emerald-600 bg-emerald-50',
  },
  {
    icon: FileText,
    name: 'Template Proposal Kegiatan',
    description: 'Template lengkap proposal kegiatan meliputi latar belakang, tujuan, dan rencana pelaksanaan.',
    format: 'DOCX',
    color: 'text-blue-600 bg-blue-50',
  },
  {
    icon: File,
    name: 'Template LPJ (Laporan Pertanggungjawaban)',
    description: 'Template laporan pertanggungjawaban setelah kegiatan selesai dilaksanakan.',
    format: 'DOCX',
    color: 'text-purple-600 bg-purple-50',
  },
  {
    icon: FileSpreadsheet,
    name: 'Template Rekapitulasi Anggaran',
    description: 'Spreadsheet rekapitulasi anggaran per jurusan / per periode.',
    format: 'XLSX',
    color: 'text-emerald-600 bg-emerald-50',
  },
];

export function TemplatePage() {
  const scrollRef = useDraggableScroll<HTMLDivElement>();

  const handleDownload = (template: TemplateItem) => {
    // In a real implementation, this would download from Laravel storage.
    // For now, show an alert indicating the feature is ready for backend integration.
    alert(`Download template "${template.name}" belum tersedia.\n\nUntuk mengaktifkan fitur ini, upload file template ke Laravel storage.`);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FolderOpen className="size-6 text-emerald-700" /> Template Dokumen
        </h2>
        <p className="text-slate-500">Download template yang diperlukan untuk melengkapi pengajuan kegiatan.</p>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-sm text-emerald-800">
        <p className="font-semibold">💡 Tips</p>
        <p className="mt-1">Gunakan template resmi agar dokumen Anda sesuai format yang diterima oleh verifikator. Template sudah mengikuti standar Politeknik Negeri Jakarta.</p>
      </div>

      <div ref={scrollRef} className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-6 pt-2 select-none hide-scrollbar">
        {TEMPLATES.map((t, idx) => (
          <Card key={idx} className="shrink-0 w-[85vw] sm:w-[300px] snap-center shadow-sm border-slate-200 hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex flex-col h-full">
              <div className="flex items-start gap-4 mb-4">
                <div className={`size-12 rounded-xl ${t.color} flex items-center justify-center shrink-0`}>
                  <t.icon className="size-6" />
                </div>
                <div className="flex-1">
                  <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-500 mb-1">{t.format}</span>
                  <p className="font-semibold text-slate-900 leading-tight">{t.name}</p>
                </div>
              </div>
              <p className="text-sm text-slate-500 grow mb-6">{t.description}</p>
              <Button variant="outline" className="w-full text-emerald-700 border-emerald-200 hover:bg-emerald-50 mt-auto" onClick={() => handleDownload(t)}>
                <Download className="size-4 mr-2" /> Download Template
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
