import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, ChevronDown, ChevronRight, BookOpen, FileText, ClipboardList, Send, CheckCircle2, HelpCircle, Lightbulb } from 'lucide-react';
import { useState } from 'react';

interface FaqItem { q: string; a: string; }
interface GuideStep { icon: any; title: string; desc: string; }

const GUIDE_STEPS: GuideStep[] = [
  { icon: FileText, title: '1. Buat Usulan Baru', desc: 'Klik menu "Usulan Saya" → tombol "Buat Usulan Baru". Isi formulir Informasi Kegiatan, KAK, dan RAB secara lengkap.' },
  { icon: ClipboardList, title: '2. Lengkapi KAK', desc: 'Isi Kerangka Acuan Kerja meliputi gambaran umum, penerima manfaat, strategi pencapaian, metode pelaksanaan, dan kurun waktu.' },
  { icon: Send, title: '3. Ajukan Usulan', desc: 'Setelah semua data terisi, klik "Ajukan Usulan Sekarang". Status akan berubah menjadi "Menunggu Verifikasi".' },
  { icon: CheckCircle2, title: '4. Proses Verifikasi', desc: 'Verifikator akan memeriksa kelengkapan dokumen. Jika ada kekurangan, akan dikembalikan dengan catatan revisi.' },
  { icon: Lightbulb, title: '5. Revisi (Jika Diminta)', desc: 'Buka menu "Perlu Revisi", klik tombol "Revisi", perbaiki sesuai catatan verifikator, lalu kirim ulang.' },
  { icon: CheckCircle2, title: '6. Persetujuan & Pencairan', desc: 'Setelah diverifikasi, proposal akan melalui PPK → Wadir → Bendahara untuk persetujuan dan pencairan dana.' },
];

const FAQ_DATA: FaqItem[] = [
  { q: 'Apa itu Si-LATORJANA?', a: 'Si-LATORJANA (Sistem Layanan Terpadu Administrasi Pengajuan) adalah sistem manajemen kegiatan kampus Politeknik Negeri Jakarta untuk mengelola alur pengajuan proposal kegiatan.' },
  { q: 'Bagaimana cara membuat usulan baru?', a: 'Masuk ke menu "Usulan Saya" lalu klik tombol "Buat Usulan Baru". Isi semua formulir yang tersedia (Info Kegiatan, KAK, RAB) kemudian klik "Ajukan Usulan".' },
  { q: 'Apa itu KAK?', a: 'KAK (Kerangka Acuan Kerja) adalah dokumen yang menjelaskan gambaran umum kegiatan, tujuan, penerima manfaat, strategi pencapaian, metode pelaksanaan, dan jadwal.' },
  { q: 'Apa itu RAB?', a: 'RAB (Rincian Anggaran Biaya) adalah rincian item-item anggaran yang dibutuhkan. Setiap item memiliki kategori (barang/jasa/perjalanan), volume, dan harga satuan. Total dihitung otomatis.' },
  { q: 'Bagaimana cara menghitung RAB?', a: 'Total per item = Qty1 × Qty2 × Qty3 × Harga Satuan. Jika Qty3 bernilai 0, maka Total = Qty1 × Qty2 × Harga Satuan. Sistem menghitung subtotal per kategori dan grand total.' },
  { q: 'Apa yang terjadi jika usulan dikembalikan untuk revisi?', a: 'Buka menu "Perlu Revisi" untuk melihat daftar usulan yang memerlukan perbaikan. Klik "Revisi" untuk mengedit data, perhatikan catatan dari verifikator, lalu kirim ulang.' },
  { q: 'Bagaimana cara melihat status usulan?', a: 'Buka "Usulan Saya" dan klik pada usulan untuk melihat detailnya termasuk progress tracker yang menunjukkan posisi saat ini dalam alur persetujuan.' },
  { q: 'Bagaimana cara mencetak/export proposal?', a: 'Buka detail usulan lalu klik tombol "Cetak PDF" di pojok kanan atas. Dokumen akan ditampilkan dalam format print-friendly dan bisa disimpan sebagai PDF.' },
  { q: 'Apa saja status dalam alur persetujuan?', a: 'Draft → Menunggu Verifikasi → Diverifikasi → Menunggu PPK → Disetujui PPK → Disetujui Wadir → Dana Diterima → Dana Cair → LPJ → Selesai. Atau dikembalikan untuk revisi di tahap manapun.' },
  { q: 'Apa itu LPJ?', a: 'LPJ (Laporan Pertanggungjawaban) adalah dokumen yang harus disubmit setelah kegiatan selesai dilaksanakan dan dana telah dicairkan. Diakses melalui menu di detail usulan.' },
];

export function PanduanPage() {
  const [search, setSearch] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const filteredFaq = FAQ_DATA.filter(f =>
    !search || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="size-6 text-emerald-700" /> Panduan Pengajuan
        </h2>
        <p className="text-slate-500">Langkah-langkah dan FAQ untuk membantu Anda mengajukan proposal.</p>
      </div>

      {/* Step-by-step Guide */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-emerald-50/50 border-b border-emerald-100">
          <CardTitle className="text-base text-emerald-800">Langkah-langkah Pengajuan Proposal</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-emerald-200" />
            <div className="space-y-6">
              {GUIDE_STEPS.map((step, idx) => (
                <div key={idx} className="relative flex items-start gap-4 pl-2">
                  <div className="relative z-10 size-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 border-2 border-white shadow-sm">
                    <step.icon className="size-4 text-emerald-700" />
                  </div>
                  <div className="pt-1">
                    <p className="font-semibold text-slate-900">{step.title}</p>
                    <p className="text-sm text-slate-600 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-base flex items-center gap-2">
              <HelpCircle className="size-5 text-emerald-700" /> Pertanyaan Umum (FAQ)
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
              <Input placeholder="Cari pertanyaan..." className="pl-9 bg-white h-9" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredFaq.length === 0 ? (
            <div className="py-12 text-center text-slate-500">Tidak ada pertanyaan yang cocok.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredFaq.map((faq, idx) => {
                const realIdx = FAQ_DATA.indexOf(faq);
                const isOpen = expandedFaq === realIdx;
                return (
                  <button key={realIdx} className="w-full text-left p-4 hover:bg-slate-50/50 transition-colors" onClick={() => setExpandedFaq(isOpen ? null : realIdx)}>
                    <div className="flex items-start gap-3">
                      {isOpen ? <ChevronDown className="size-5 text-emerald-600 mt-0.5 shrink-0" /> : <ChevronRight className="size-5 text-slate-400 mt-0.5 shrink-0" />}
                      <div className="flex-1">
                        <p className={`font-medium ${isOpen ? 'text-emerald-800' : 'text-slate-900'}`}>{faq.q}</p>
                        {isOpen && <p className="text-sm text-slate-600 mt-2 leading-relaxed">{faq.a}</p>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
