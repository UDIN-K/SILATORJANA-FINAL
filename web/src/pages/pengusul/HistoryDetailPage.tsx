import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { ProgressTracker } from '@/components/ProgressTracker';
import { ArrowLeft, Calendar, Building2, User, DollarSign, FileText, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { databases, APPWRITE_DB_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { formatDate, formatCurrency, fetchKAK, fetchIKU, fetchRAB } from '@/lib/helpers';

export function HistoryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [kegiatan, setKegiatan] = useState<any>(null);
  const [kak, setKak] = useState<any>(null);
  const [ikuList, setIkuList] = useState<any[]>([]);
  const [rabList, setRabList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const doc = await databases.getDocument(APPWRITE_DB_ID, 'kegiatan', id);
        setKegiatan(doc);
        const [kakData, ikuData, rabData] = await Promise.all([fetchKAK(id), fetchIKU(id), fetchRAB(id)]);
        setKak(kakData);
        setIkuList(ikuData);
        setRabList(rabData);
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    })();
  }, [id]);

  if (isLoading) return <div className="py-12 text-center"><Loader2 className="animate-spin text-emerald-700 mx-auto size-8" /></div>;
  if (!kegiatan) return <div className="py-12 text-center text-slate-500">Data tidak ditemukan.</div>;

  const rabTotal = rabList.reduce((sum: number, r: any) => sum + (parseFloat(r.total) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/pengusul/history')}><ArrowLeft className="size-5" /></Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">{kegiatan.nama_kegiatan}</h2>
          <div className="flex items-center gap-3 mt-1"><StatusBadge status={kegiatan.status} /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-sm"><CardContent className="p-5 space-y-3">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2"><FileText className="size-4 text-emerald-700" /> Informasi Kegiatan</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Jenis</span><span className="font-medium">{kegiatan.jenis_kegiatan || '-'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Jurusan</span><span className="font-medium">{kegiatan.nama_jurusan || '-'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Pengusul</span><span className="font-medium">{kegiatan.pengusul_nama || '-'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Tanggal</span><span className="font-medium">{formatDate(kegiatan.$createdAt)}</span></div>
          </div>
        </CardContent></Card>

        <Card className="shadow-sm"><CardContent className="p-5 space-y-3">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2"><DollarSign className="size-4 text-emerald-600" /> Anggaran</h3>
          <div className="text-3xl font-bold text-emerald-700">{formatCurrency(rabTotal)}</div>
          <div className="text-sm text-slate-500">{rabList.length} item RAB</div>
        </CardContent></Card>
      </div>

      <Card className="shadow-sm"><CardContent className="p-5">
        <h3 className="font-semibold text-slate-900 mb-4">Progress Workflow</h3>
        <ProgressTracker status={kegiatan.status} />
      </CardContent></Card>

      {kak && (
        <Card className="shadow-sm"><CardContent className="p-5 space-y-3">
          <h3 className="font-semibold text-slate-900">Kerangka Acuan Kerja (KAK)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><span className="text-slate-500 block mb-1">Gambaran Umum</span><p>{kak.gambaran_umum || '-'}</p></div>
            <div><span className="text-slate-500 block mb-1">Penerima Manfaat</span><p>{kak.penerima_manfaat || '-'}</p></div>
            <div><span className="text-slate-500 block mb-1">Strategi Pencapaian</span><p>{kak.strategi_pencapaian || '-'}</p></div>
            <div><span className="text-slate-500 block mb-1">Metode Pelaksanaan</span><p>{kak.metode_pelaksanaan || '-'}</p></div>
          </div>
        </CardContent></Card>
      )}

      {ikuList.length > 0 && (
        <Card className="shadow-sm"><CardContent className="p-5 space-y-3">
          <h3 className="font-semibold text-slate-900">Indikator Kinerja Utama (IKU)</h3>
          <div className="divide-y divide-slate-100">
            {ikuList.map((iku: any, i: number) => (
              <div key={iku.$id || i} className="py-2 flex justify-between">
                <span className="text-sm">{iku.nama_iku || iku.indikator || '-'}</span>
                <span className="text-sm font-semibold text-emerald-700">{iku.target_persen != null ? `${iku.target_persen}%` : '-'}</span>
              </div>
            ))}
          </div>
        </CardContent></Card>
      )}

      {rabList.length > 0 && (
        <Card className="shadow-sm"><CardContent className="p-5 space-y-3">
          <h3 className="font-semibold text-slate-900">Rincian Anggaran Biaya (RAB)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-200 text-left text-slate-600">
                <th className="py-2 px-3">No</th><th className="py-2 px-3">Uraian</th><th className="py-2 px-3">Kategori</th><th className="py-2 px-3 text-right">Harga Satuan</th><th className="py-2 px-3 text-right">Total</th>
              </tr></thead>
              <tbody>{rabList.map((r: any, i: number) => (
                <tr key={r.$id || i} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="py-2 px-3">{i + 1}</td>
                  <td className="py-2 px-3 font-medium">{r.uraian}</td>
                  <td className="py-2 px-3 capitalize">{r.kategori || '-'}</td>
                  <td className="py-2 px-3 text-right">{formatCurrency(r.harga_satuan)}</td>
                  <td className="py-2 px-3 text-right font-semibold">{formatCurrency(r.total)}</td>
                </tr>
              ))}</tbody>
              <tfoot><tr className="border-t-2 border-slate-200">
                <td colSpan={4} className="py-3 px-3 font-bold text-right">Total Anggaran</td>
                <td className="py-3 px-3 text-right font-bold text-emerald-700">{formatCurrency(rabTotal)}</td>
              </tr></tfoot>
            </table>
          </div>
        </CardContent></Card>
      )}
    </div>
  );
}
