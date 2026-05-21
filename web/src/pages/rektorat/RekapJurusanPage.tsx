import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/StatusBadge';
import { Search, Building2, TrendingUp, DollarSign, FileText, Loader2, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { databases, APPWRITE_DB_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { formatCurrency, getStatusColor } from '@/lib/helpers';

interface JurusanSummary {
  nama: string;
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  totalAnggaran: number;
}

export function RekapJurusanPage() {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await databases.listDocuments(APPWRITE_DB_ID, 'kegiatan', [Query.limit(500)]);
        setItems(res.documents);
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    })();
  }, []);

  const jurusanMap = new Map<string, JurusanSummary>();
  items.forEach((item: any) => {
    const nama = item.nama_jurusan || 'Tidak Diketahui';
    if (!jurusanMap.has(nama)) {
      jurusanMap.set(nama, { nama, total: 0, approved: 0, pending: 0, rejected: 0, totalAnggaran: 0 });
    }
    const j = jurusanMap.get(nama)!;
    j.total++;
    const s = item.status?.toLowerCase() || '';
    if (['completed', 'selesai', 'lpj_done', 'approved_wadir', 'approved_ppk', 'verified', 'funds_disbursed', 'accepted_funds', 'lpj_approved', 'lpj_verified'].includes(s)) j.approved++;
    else if (['rejected', 'ditolak', 'lpj_rejected'].includes(s)) j.rejected++;
    else j.pending++;
    j.totalAnggaran += parseFloat(item.total_anggaran || '0');
  });

  const jurusanList = Array.from(jurusanMap.values()).sort((a, b) => b.total - a.total);
  const filtered = jurusanList.filter(j => !search || j.nama.toLowerCase().includes(search.toLowerCase()));
  const grandTotal = jurusanList.reduce((s, j) => s + j.totalAnggaran, 0);
  const grandCount = jurusanList.reduce((s, j) => s + j.total, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <BarChart3 className="size-6 text-indigo-600" /> Rekapitulasi Per Jurusan
        </h2>
        <p className="text-slate-500">Ringkasan kegiatan berdasarkan jurusan/unit.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-sm border-indigo-100 bg-gradient-to-br from-indigo-50 to-white"><CardContent className="p-4">
          <p className="text-sm text-indigo-600 font-medium">Total Jurusan</p>
          <p className="text-3xl font-bold text-indigo-900">{jurusanList.length}</p>
        </CardContent></Card>
        <Card className="shadow-sm border-blue-100 bg-gradient-to-br from-blue-50 to-white"><CardContent className="p-4">
          <p className="text-sm text-blue-600 font-medium">Total Kegiatan</p>
          <p className="text-3xl font-bold text-blue-900">{grandCount}</p>
        </CardContent></Card>
        <Card className="shadow-sm border-emerald-100 bg-gradient-to-br from-emerald-50 to-white"><CardContent className="p-4">
          <p className="text-sm text-emerald-600 font-medium">Total Anggaran</p>
          <p className="text-2xl font-bold text-emerald-900">{formatCurrency(grandTotal)}</p>
        </CardContent></Card>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
            <Input placeholder="Cari jurusan..." className="pl-9 bg-white" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center"><Loader2 className="animate-spin text-blue-600 mx-auto" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-500">Tidak ada data.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-slate-50/80 text-left text-slate-600 font-semibold">
                  <th className="py-3 px-4">Jurusan</th>
                  <th className="py-3 px-4 text-center">Total</th>
                  <th className="py-3 px-4 text-center">Disetujui</th>
                  <th className="py-3 px-4 text-center">Pending</th>
                  <th className="py-3 px-4 text-center">Ditolak</th>
                  <th className="py-3 px-4 text-right">Anggaran</th>
                </tr></thead>
                <tbody>{filtered.map((j, i) => (
                  <tr key={j.nama} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-medium text-slate-900 flex items-center gap-2">
                      <Building2 className="size-4 text-slate-400" /> {j.nama}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold">{j.total}</td>
                    <td className="py-3 px-4 text-center"><span className="inline-flex items-center gap-1 text-emerald-700 font-medium"><ArrowUpRight className="size-3" />{j.approved}</span></td>
                    <td className="py-3 px-4 text-center"><span className="text-amber-600 font-medium">{j.pending}</span></td>
                    <td className="py-3 px-4 text-center"><span className="inline-flex items-center gap-1 text-red-600 font-medium">{j.rejected > 0 && <ArrowDownRight className="size-3" />}{j.rejected}</span></td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-700">{formatCurrency(j.totalAnggaran)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
