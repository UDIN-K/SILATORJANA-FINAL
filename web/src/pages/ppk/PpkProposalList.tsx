import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate } from '@/lib/helpers';
import { Eye, Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { databases, APPWRITE_DB_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';

export function PpkProposalList() {
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

  const filtered = items.filter(i => !search || i.nama_kegiatan?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-slate-900">Semua Proposal</h2><p className="text-slate-500">Daftar seluruh proposal kegiatan.</p></div>
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="p-4 border-b bg-slate-50/50"><div className="relative w-full sm:w-80"><Search className="absolute left-3 top-2.5 size-4 text-slate-400" /><Input placeholder="Cari..." className="pl-9 bg-white" value={search} onChange={e => setSearch(e.target.value)} /></div></CardHeader>
        <CardContent className="p-0">
          {isLoading ? <div className="py-12 text-center"><Loader2 className="animate-spin text-blue-600 mx-auto" /></div> :
          filtered.length === 0 ? <div className="py-12 text-center text-slate-500">Tidak ada proposal.</div> :
          <div className="divide-y divide-slate-100">{filtered.map(item => (
            <div key={item.$id} className="flex items-center justify-between p-4 hover:bg-slate-50/50">
              <div><p className="font-semibold text-slate-900">{item.nama_kegiatan}</p><p className="text-xs text-slate-500 mt-1">{formatDate(item.$createdAt)}</p></div>
              <div className="flex items-center gap-3"><StatusBadge status={item.status} /><Button size="sm" variant="outline" onClick={() => navigate(`/dashboard/ppk/review/${item.$id}`)}><Eye className="size-4 mr-1" />Detail</Button></div>
            </div>
          ))}</div>}
        </CardContent>
      </Card>
    </div>
  );
}
