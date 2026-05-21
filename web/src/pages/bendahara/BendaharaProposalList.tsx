import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate } from '@/lib/helpers';
import { Eye, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { databases, APPWRITE_DB_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';

export function BendaharaProposalList() {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await databases.listDocuments(APPWRITE_DB_ID, 'kegiatan', [Query.orderDesc('$updatedAt'), Query.limit(200)]);
        setItems(res.documents.filter((d: any) => ['approved_wadir','accepted_funds','funds_disbursed','lpj_submitted','lpj_approved','lpj_done','completed'].includes(d.status?.toLowerCase())));
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-slate-900">Pencairan & LPJ</h2><p className="text-slate-500">Kelola pencairan dana dan verifikasi LPJ.</p></div>
      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-0">
          {isLoading ? <div className="py-12 text-center"><Loader2 className="animate-spin text-blue-600 mx-auto" /></div> :
          items.length === 0 ? <div className="py-12 text-center text-slate-500">Belum ada kegiatan.</div> :
          <div className="divide-y divide-slate-100">
            {items.map(item => (
              <div key={item.$id} className="flex items-center justify-between p-4 hover:bg-slate-50/50">
                <div><p className="font-semibold text-slate-900">{item.nama_kegiatan}</p><p className="text-xs text-slate-500 mt-1">{formatDate(item.$createdAt)}</p></div>
                <div className="flex items-center gap-3"><StatusBadge status={item.status} />
                  <Button size="sm" variant="outline" onClick={() => navigate(`/dashboard/bendahara/detail/${item.$id}`)}><Eye className="size-4 mr-1" />Detail</Button>
                </div>
              </div>
            ))}
          </div>}
        </CardContent>
      </Card>
    </div>
  );
}
