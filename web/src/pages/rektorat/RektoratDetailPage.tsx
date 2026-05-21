import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { ProgressTracker } from '@/components/ProgressTracker';
import { ArrowLeft, Calendar, Building2, User, DollarSign, FileText, Loader2, ExternalLink } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { databases, APPWRITE_DB_ID } from '@/lib/appwrite';
import { fetchKAK, fetchIKU, fetchRAB, formatDate, formatCurrency } from '@/lib/helpers';

export function RektoratDetailPage() {
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
        const [k, i, r] = await Promise.all([fetchKAK(id), fetchIKU(id), fetchRAB(id)]);
        setKak(k); setIkuList(i); setRabList(r);
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    })();
  }, [id]);

  if (isLoading) return <div className="py-12 text-center"><Loader2 className="animate-spin text-blue-600 mx-auto size-8" /></div>;
  if (!kegiatan) return <div className="py-12 text-center text-slate-500">Data tidak ditemukan.</div>;

  const rabTotal = rabList.reduce((sum: number, r: any) => sum + (parseFloat(r.total) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="size-5" /></Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">{kegiatan.nama_kegiatan}</h2>
          <div className="flex items-center gap-3 mt-1"><StatusBadge status={kegiatan.status} /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Building2, label: 'Jurusan', value: kegiatan.nama_jurusan || '-', color: 'blue' },
          { icon: User, label: 'Pengusul', value: kegiatan.pengusul_nama || '-', color: 'indigo' },
          { icon: Calendar, label: 'Tanggal', value: formatDate(kegiatan.$createdAt), color: 'purple' },
          { icon: DollarSign, label: 'Total Anggaran', value: formatCurrency(rabTotal), color: 'emerald' },
        ].map((stat, i) => (
          <Card key={i} className="shadow-sm"><CardContent className="p-4 flex items-center gap-3">
            <div className={`size-10 rounded-lg bg-${stat.color}-50 flex items-center justify-center`}>
              <stat.icon className={`size-5 text-${stat.color}-600`} />
            </div>
            <div><p className="text-xs text-slate-500">{stat.label}</p><p className="font-semibold text-slate-900 text-sm">{stat.value}</p></div>
          </CardContent></Card>
        ))}
      </div>

      <Card className="shadow-sm"><CardContent className="p-5">
        <h3 className="font-semibold text-slate-900 mb-4">Progress Workflow</h3>
        <ProgressTracker status={kegiatan.status} />
      </CardContent></Card>

      {kak && (
        <Card className="shadow-sm"><CardContent className="p-5 space-y-4">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2"><FileText className="size-4 text-blue-600" /> KAK</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {['gambaran_umum', 'penerima_manfaat', 'strategi_pencapaian', 'metode_pelaksanaan', 'tahapan_pelaksanaan'].map(key => (
              <div key={key}><span className="text-slate-500 block mb-1 capitalize">{key.replace(/_/g, ' ')}</span><p className="text-slate-800">{kak[key] || '-'}</p></div>
            ))}
          </div>
        </CardContent></Card>
      )}

      {ikuList.length > 0 && (
        <Card className="shadow-sm"><CardContent className="p-5 space-y-3">
          <h3 className="font-semibold text-slate-900">IKU</h3>
          <div className="divide-y divide-slate-100">
            {ikuList.map((iku: any, i: number) => (
              <div key={iku.$id || i} className="py-2 flex justify-between text-sm">
                <span>{iku.nama_iku || iku.indikator || '-'}</span>
                <span className="font-semibold text-emerald-700">{iku.target_persen != null ? `${iku.target_persen}%` : '-'}</span>
              </div>
            ))}
          </div>
        </CardContent></Card>
      )}

      {rabList.length > 0 && (
        <Card className="shadow-sm"><CardContent className="p-5 space-y-3">
          <h3 className="font-semibold text-slate-900">RAB — Total: {formatCurrency(rabTotal)}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-slate-600"><th className="py-2 px-3">No</th><th className="py-2 px-3">Uraian</th><th className="py-2 px-3">Kategori</th><th className="py-2 px-3 text-right">Total</th></tr></thead>
              <tbody>{rabList.map((r: any, i: number) => (
                <tr key={r.$id || i} className="border-b border-slate-50"><td className="py-2 px-3">{i+1}</td><td className="py-2 px-3">{r.uraian}</td><td className="py-2 px-3 capitalize">{r.kategori || '-'}</td><td className="py-2 px-3 text-right font-semibold">{formatCurrency(r.total)}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </CardContent></Card>
      )}
    </div>
  );
}
