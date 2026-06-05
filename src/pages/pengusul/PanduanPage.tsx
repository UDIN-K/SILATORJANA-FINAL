import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BookOpen, CheckCircle, Info } from 'lucide-react';

export function PanduanPage() {
  const steps = [
    { title: 'Pembuatan Usulan KAK & RAB', desc: 'Pengusul membuat usulan dengan mengisi Latar Belakang, IKU, KAK, dan RAB.' },
    { title: 'Verifikasi Berkas', desc: 'Verifikator memeriksa kelengkapan berkas usulan Anda.' },
    { title: 'Upload Surat Pengantar', desc: 'Jika disetujui Verifikator, Anda harus mengunggah Surat Pengantar yang telah ditandatangani.' },
    { title: 'Persetujuan Berjenjang', desc: 'Usulan akan diperiksa oleh PPK, Wadir, hingga disetujui untuk pendanaan.' },
    { title: 'Pencairan Dana', desc: 'Bendahara akan mencairkan uang muka untuk kegiatan Anda.' },
    { title: 'Pelaksanaan Kegiatan', desc: 'Kegiatan dilaksanakan sesuai jadwal yang direncanakan.' },
    { title: 'Pelaporan (LPJ)', desc: 'Pengusul wajib mengunggah Laporan Pertanggungjawaban (LPJ) setelah kegiatan selesai.' },
    { title: 'Review LPJ & Pencairan Sisa', desc: 'Bendahara akan mereview LPJ dan mencairkan sisa dana jika ada.' },
    { title: 'Penutupan Kegiatan', desc: 'Kegiatan dinyatakan selesai (Completed).' }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-300">
      <div className="flex items-center gap-4">
        <div className="bg-emerald-100 p-3 rounded-xl">
          <BookOpen className="size-6 text-emerald-700" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Panduan Penggunaan</h2>
          <p className="text-slate-500">Pelajari alur dan cara menggunakan Sistem Si-Latorjana</p>
        </div>
      </div>

      <div className="bg-blue-50 text-blue-800 p-4 rounded-md border border-blue-100 flex items-start gap-3">
        <Info className="size-5 text-blue-600 mt-0.5 shrink-0" />
        <div>
          <p className="font-medium mb-1">Tips Navigasi Panduan</p>
          <p className="text-sm text-blue-700">Berikut adalah tahapan-tahapan yang harus dilalui oleh setiap usulan kegiatan. Pastikan Anda menyelesaikan setiap tahapan dengan cermat.</p>
        </div>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <CardTitle>Timeline Alur Kegiatan</CardTitle>
          <CardDescription>9 Langkah dari pengajuan hingga kegiatan selesai</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div key={index} className="flex gap-4 items-start">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
                    {index + 1}
                  </div>
                  {index < steps.length - 1 && <div className="w-0.5 h-full bg-emerald-100 mt-2 min-h-12"></div>}
                </div>
                <div className="pt-1 pb-4">
                  <h4 className="font-semibold text-slate-800">{step.title}</h4>
                  <p className="text-sm text-slate-500 mt-1">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
