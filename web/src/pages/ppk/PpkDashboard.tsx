import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate, getUserId } from '@/lib/helpers';
import { Search, Eye, CheckCircle, XCircle, FileText, Clock, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { databases, APPWRITE_DB_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';

export function PpkDashboard() {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await databases.listDocuments(APPWRITE_DB_ID, 'kegiatan', [Query.orderDesc('$updatedAt'), Query.limit(200)]);
        setItems(res.documents);
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    })();
  }, []);

  const pending = items.filter(i => ['verified','pending_ppk'].includes(i.status?.toLowerCase()));
  const approved = items.filter(i => ['approved_ppk','approved_wadir','accepted_funds','funds_disbursed','completed','lpj_done'].includes(i.status?.toLowerCase()));
  const rejected = items.filter(i => i.status === 'rejected');
  const filtered = items.filter(i => !search || i.nama_kegiatan?.toLowerCase().includes(search.toLowerCase()));

  const cards = [
    { label: 'Menunggu Review', value: pending.length, icon: Clock, color: 'bg-amber-100 text-amber-600' },
    { label: 'Disetujui', value: approved.length, icon: CheckCircle, color: 'bg-emerald-100 text-emerald-600' },
    { label: 'Ditolak', value: rejected.length, icon: XCircle, color: 'bg-red-100 text-red-600' },
    { label: 'Total', value: items.length, icon: FileText, color: 'bg-blue-100 text-blue-600' },
  ];

  if (isLoading) return <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-blue-600 size-8" /></div>;

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-slate-900">Dashboard PPK</h2><p className="text-slate-500">Proses penetapan dan persetujuan kegiatan.</p></div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <Card key={i} className="shadow-sm"><CardContent className="p-6 flex items-center justify-between">
            <div><p className="text-sm text-slate-600">{c.label}</p><p className="text-3xl font-bold mt-1">{c.value}</p></div>
            <div className={`p-3 rounded-xl ${c.color}`}><c.icon className="size-5" /></div>
          </CardContent></Card>
        ))}
      </div>

      {pending.length > 0 && (
        <Card className="shadow-sm border-amber-200 bg-amber-50/30">
          <CardHeader className="border-b border-amber-100"><CardTitle className="text-base text-amber-800">Menunggu Persetujuan ({pending.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-amber-100">
              {pending.map(item => (
                <div key={item.$id} className="flex items-center justify-between p-4 hover:bg-amber-50/50">
                  <div><p className="font-semibold text-slate-900">{item.nama_kegiatan}</p><p className="text-xs text-slate-500 mt-1">{formatDate(item.$createdAt)}</p></div>
                  <Button size="sm" onClick={() => navigate(`/dashboard/ppk/review/${item.$id}`)} className="bg-emerald-700 hover:bg-emerald-800"><Eye className="size-4 mr-1" />Review</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
