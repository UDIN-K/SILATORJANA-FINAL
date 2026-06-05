import { useState, useEffect } from 'react';
import { apiListKegiatan } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, CheckCircle, Clock, Loader2, Download } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency, formatDate } from '@/lib/helpers';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function BendaharaLaporanPage() {
  const [laporan, setLaporan] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const data = await apiListKegiatan();
        // Filter usulan yang sudah masuk tahap LPJ atau selesai
        const filtered = data.filter((item: any) => 
          ['lpj_submitted', 'lpj_revision', 'lpj_approved', 'lpj_done', 'completed'].includes(item.status.toLowerCase())
        );
        setLaporan(filtered);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  if (isLoading) {
    return <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-blue-600 size-8" /></div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      <div className="flex items-center gap-4">
        <div className="bg-emerald-100 p-3 rounded-xl">
          <CheckCircle className="size-6 text-emerald-700" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Rekap Laporan LPJ</h2>
          <p className="text-slate-500">Daftar keseluruhan usulan yang telah masuk ke tahap pelaporan</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <Card className="shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
               <div className="size-12 rounded-full bg-blue-50 flex items-center justify-center">
                  <FileText className="size-6 text-blue-600" />
               </div>
               <div>
                  <p className="text-sm text-slate-500 uppercase tracking-wider font-medium">Total LPJ</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{laporan.length}</p>
               </div>
            </CardContent>
         </Card>
         <Card className="shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
               <div className="size-12 rounded-full bg-amber-50 flex items-center justify-center">
                  <Clock className="size-6 text-amber-600" />
               </div>
               <div>
                  <p className="text-sm text-slate-500 uppercase tracking-wider font-medium">Menunggu Review</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                     {laporan.filter(l => ['lpj_submitted', 'lpj_revision'].includes(l.status)).length}
                  </p>
               </div>
            </CardContent>
         </Card>
         <Card className="shadow-sm">
            <CardContent className="p-5 flex items-center gap-4">
               <div className="size-12 rounded-full bg-emerald-50 flex items-center justify-center">
                  <CheckCircle className="size-6 text-emerald-600" />
               </div>
               <div>
                  <p className="text-sm text-slate-500 uppercase tracking-wider font-medium">Selesai (Completed)</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                     {laporan.filter(l => ['lpj_done', 'completed'].includes(l.status)).length}
                  </p>
               </div>
            </CardContent>
         </Card>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
          <CardTitle>Daftar Rekapitulasi</CardTitle>
          <Button variant="outline" size="sm" onClick={() => alert('Fitur Ekspor Excel segera hadir')}>
            <Download className="size-4 mr-2" /> Ekspor Excel
          </Button>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Nama Kegiatan</th>
                <th className="px-4 py-3 font-medium">Pengusul</th>
                <th className="px-4 py-3 font-medium">Tgl Kegiatan</th>
                <th className="px-4 py-3 font-medium text-right">Nilai Anggaran</th>
                <th className="px-4 py-3 font-medium text-center">Status</th>
                <th className="px-4 py-3 font-medium text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {laporan.length > 0 ? laporan.map((item, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 text-slate-900 font-medium">{item.nama_kegiatan}</td>
                  <td className="px-4 py-3 text-slate-600">{item.pengusul_nama || '-'}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(item.tgl_kegiatan)}</td>
                  <td className="px-4 py-3 text-slate-900 font-medium text-right">{formatCurrency(item.total_anggaran || 0)}</td>
                  <td className="px-4 py-3 text-center"><StatusBadge status={item.status} /></td>
                  <td className="px-4 py-3 text-center">
                    <Button variant="ghost" size="sm" className="text-blue-600" onClick={() => navigate(`/dashboard/bendahara/usulan/${item.id}`)}>
                      Lihat LPJ
                    </Button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">Belum ada data laporan LPJ masuk.</td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
