import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function TemplatePage() {
  const templates = [
    { title: 'Template KAK', desc: 'Format standar Kerangka Acuan Kerja (KAK)', ext: 'DOCX', type: 'kak' },
    { title: 'Template RAB', desc: 'Format standar Rencana Anggaran Biaya (RAB)', ext: 'XLSX', type: 'rab' },
    { title: 'Template Surat Pengantar', desc: 'Format Surat Pengantar usulan kegiatan', ext: 'DOCX', type: 'surat' },
    { title: 'Template LPJ', desc: 'Format Laporan Pertanggungjawaban (LPJ)', ext: 'DOCX', type: 'lpj' }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-300">
      <div className="flex items-center gap-4">
        <div className="bg-emerald-100 p-3 rounded-xl">
          <FileText className="size-6 text-emerald-700" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Unduh Template</h2>
          <p className="text-slate-500">Download format dokumen standar untuk pengajuan kegiatan</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((tpl, i) => (
          <Card key={i} className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-100">
                  {tpl.ext}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">{tpl.title}</h3>
                  <p className="text-sm text-slate-500">{tpl.desc}</p>
                </div>
              </div>
              <Button variant="outline" size="icon" className="shrink-0 text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700" onClick={() => alert('Fitur unduh template segera hadir')}>
                <Download className="size-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
