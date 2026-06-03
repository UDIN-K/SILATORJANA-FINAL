import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiListKegiatan } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate, formatCurrency } from '@/lib/helpers';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Filter, TrendingUp, Loader2, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';

export function RektoratLaporanPage() {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    (async () => {
      try {
        const res = await apiListKegiatan();
        setItems((res.data || res));
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    })();
  }, []);

  const yearSet = new Set<number>(); items.forEach(i => yearSet.add(new Date(i.created_at).getFullYear()));
  const years = Array.from(yearSet).sort((a, b) => b - a);

  const filtered = items.filter(i => {
    if (filterYear !== 'all' && new Date(i.created_at).getFullYear().toString() !== filterYear) return false;
    if (filterStatus !== 'all' && i.status !== filterStatus) return false;
    return true;
  });

  const totalAnggaran = filtered.reduce((s, i) => s + (i.total_anggaran || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1 sm:space-y-1.5">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Laporan & Analisis</h2>
          <p className="text-slate-500 mt-1">Rekap kegiatan dan realisasi anggaran.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-sm"><CardContent className="p-4"><p className="text-sm text-slate-500">Total Kegiatan</p><p className="text-2xl font-bold">{filtered.length}</p></CardContent></Card>
        <Card className="shadow-sm"><CardContent className="p-4"><p className="text-sm text-slate-500">Total Anggaran</p><p className="text-2xl font-bold text-blue-700">{formatCurrency(totalAnggaran)}</p></CardContent></Card>
        <Card className="shadow-sm"><CardContent className="p-4"><p className="text-sm text-slate-500">Selesai</p><p className="text-2xl font-bold text-emerald-600">{filtered.filter(i => ['completed','lpj_done'].includes(i.status)).length}</p></CardContent></Card>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="p-4 border-b bg-slate-50/50 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Daftar Kegiatan</CardTitle>
          <div className="flex gap-2">
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-32"><SelectValue placeholder="Tahun" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Semua</SelectItem>{years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Semua</SelectItem><SelectItem value="completed">Selesai</SelectItem><SelectItem value="approved_wadir">Disetujui</SelectItem><SelectItem value="rejected">Ditolak</SelectItem></SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? <div className="py-12 text-center"><Loader2 className="animate-spin text-blue-600 mx-auto" /></div> :
          <div className="divide-y divide-slate-100">
            {filtered.map(item => (
              <div key={item.id} className="p-4 hover:bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-start sm:items-center gap-3 min-w-0"><FileText className="size-5 text-slate-400 shrink-0" /><div className="min-w-0"><p className="font-medium text-slate-900 truncate">{item.nama_kegiatan}</p><p className="text-xs text-slate-500 truncate">{item.nama_jurusan || '-'} · {formatDate(item.created_at)}</p></div></div>
                <div className="shrink-0"><StatusBadge status={item.status} /></div>
              </div>
            ))}
          </div>}
        </CardContent>
      </Card>
    </div>
  );
}
