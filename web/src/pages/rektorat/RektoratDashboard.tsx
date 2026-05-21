import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/helpers';
import { BarChart3, FileText, CheckCircle, XCircle, Clock, TrendingUp, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { databases, APPWRITE_DB_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { useNavigate } from 'react-router-dom';

export function RektoratDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, approved: 0, rejected: 0, pending: 0 });
  const [jurusanStats, setJurusanStats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await databases.listDocuments(APPWRITE_DB_ID, 'kegiatan', [Query.limit(500)]);
        const docs = res.documents;
        const approved = docs.filter((d: any) => ['approved_wadir','accepted_funds','funds_disbursed','lpj_approved','completed','lpj_done'].includes(d.status)).length;
        const rejected = docs.filter((d: any) => d.status === 'rejected').length;
        const pending = docs.length - approved - rejected;
        setStats({ total: docs.length, approved, rejected, pending });

        // Group by jurusan
        const jMap: Record<string, number> = {};
        docs.forEach((d: any) => { const j = d.nama_jurusan || d.jurusan_id || 'Lainnya'; jMap[j] = (jMap[j] || 0) + 1; });
        setJurusanStats(Object.entries(jMap).map(([nama, total]) => ({ nama, total })).sort((a, b) => b.total - a.total));
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    })();
  }, []);

  if (isLoading) return <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-emerald-700 size-8" /></div>;

  const cards = [
    { label: 'Total Usulan', value: stats.total, icon: FileText, color: 'bg-emerald-100 text-emerald-700' },
    { label: 'Disetujui', value: stats.approved, icon: CheckCircle, color: 'bg-emerald-100 text-emerald-600' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'bg-amber-100 text-amber-600' },
    { label: 'Ditolak', value: stats.rejected, icon: XCircle, color: 'bg-red-100 text-red-600' },
  ];

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-slate-900">Dashboard Rektorat</h2><p className="text-slate-500">Ringkasan kegiatan seluruh politeknik.</p></div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <Card key={i} className="shadow-sm"><CardContent className="p-6 flex items-center justify-between">
            <div><p className="text-sm text-slate-600">{c.label}</p><p className="text-3xl font-bold mt-1">{c.value}</p></div>
            <div className={`p-3 rounded-xl ${c.color}`}><c.icon className="size-5" /></div>
          </CardContent></Card>
        ))}
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b"><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="size-5" />Rekap per Jurusan</CardTitle></CardHeader>
        <CardContent className="p-0">
          {jurusanStats.length === 0 ? <div className="py-8 text-center text-slate-500">Belum ada data.</div> :
          <div className="divide-y divide-slate-100">
            {jurusanStats.map((j, i) => (
              <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-400 w-6">{i + 1}.</span>
                  <span className="text-sm font-medium text-slate-800">{j.nama}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${Math.min(100, (j.total / Math.max(1, stats.total)) * 100)}%` }} />
                  </div>
                  <span className="text-sm font-bold text-slate-700 w-8 text-right">{j.total}</span>
                </div>
              </div>
            ))}
          </div>}
        </CardContent>
      </Card>
    </div>
  );
}
