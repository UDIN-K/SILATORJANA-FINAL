import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { Input } from '@/components/ui/input';
import { Search, AlertTriangle, Edit, Eye, Loader2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { databases, APPWRITE_DB_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { getUserId, formatDate, timeAgo } from '@/lib/helpers';

export function NeedsWorkPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const userId = getUserId();
        const res = await databases.listDocuments(APPWRITE_DB_ID, 'kegiatan', [
          Query.equal('pengusul_id', userId),
          Query.orderDesc('$updatedAt'),
        ]);
        const needsWork = res.documents.filter((d: any) =>
          ['revision_requested', 'revisi', 'revisi_done', 'lpj_revision'].includes(d.status?.toLowerCase())
        );
        setItems(needsWork);
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    })();
  }, []);

  const filtered = items.filter(item =>
    !search || item.nama_kegiatan?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <AlertTriangle className="size-6 text-amber-500" /> Perlu Dikerjakan
        </h2>
        <p className="text-slate-500">Kegiatan yang memerlukan revisi atau perbaikan dari Anda.</p>
      </div>

      {!isLoading && items.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="size-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-amber-800">Anda memiliki {items.length} kegiatan yang perlu direvisi</p>
            <p className="text-sm text-amber-700">Segera perbaiki agar proses persetujuan bisa dilanjutkan.</p>
          </div>
        </div>
      )}

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
            <Input placeholder="Cari kegiatan..." className="pl-9 bg-white" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center"><Loader2 className="animate-spin text-blue-600 mx-auto" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Clock className="size-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">Tidak ada kegiatan yang perlu direvisi 🎉</p>
              <p className="text-sm mt-1">Semua kegiatan Anda sudah dalam kondisi baik.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map(item => (
                <div key={item.$id} className="p-4 hover:bg-amber-50/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-semibold text-slate-900 truncate">{item.nama_kegiatan}</p>
                        <StatusBadge status={item.status} />
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                        <span>Diperbarui {timeAgo(item.$updatedAt)}</span>
                        <span>Dibuat {formatDate(item.$createdAt)}</span>
                      </div>
                      {item.catatan_revisi && (
                        <div className="mt-2 p-3 bg-amber-50 border border-amber-100 rounded-md text-sm text-amber-800">
                          <span className="font-semibold">Catatan Revisi:</span> {item.catatan_revisi}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="outline" size="sm" className="text-emerald-700 border-emerald-200 hover:bg-emerald-50" onClick={() => navigate(`/dashboard/pengusul/usulan/${item.$id}`)}>
                        <Eye className="size-4 mr-1" /> Lihat
                      </Button>
                      <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white" onClick={() => navigate(`/dashboard/pengusul/usulan/${item.$id}`)}>
                        <Edit className="size-4 mr-1" /> Revisi
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
