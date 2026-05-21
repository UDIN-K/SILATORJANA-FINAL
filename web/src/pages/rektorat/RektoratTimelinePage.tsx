import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { ArrowLeft, Clock, User, MessageSquare, Loader2, GitBranch } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { databases, APPWRITE_DB_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { formatDate, getStatusLabel } from '@/lib/helpers';

export function RektoratTimelinePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [kegiatan, setKegiatan] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const doc = await databases.getDocument(APPWRITE_DB_ID, 'kegiatan', id);
        setKegiatan(doc);
        // Try to load status_history collection if it exists
        try {
          const res = await databases.listDocuments(APPWRITE_DB_ID, 'status_history', [
            Query.equal('kegiatan_id', id),
            Query.orderDesc('$createdAt'),
          ]);
          setTimeline(res.documents);
        } catch {
          // If status_history collection doesn't exist, create a simple timeline from kegiatan status
          setTimeline([{
            $id: '1',
            status: doc.status,
            catatan: '',
            actor_name: doc.pengusul_nama || '-',
            $createdAt: doc.$updatedAt || doc.$createdAt,
          }]);
        }
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    })();
  }, [id]);

  if (isLoading) return <div className="py-12 text-center"><Loader2 className="animate-spin text-blue-600 mx-auto size-8" /></div>;
  if (!kegiatan) return <div className="py-12 text-center text-slate-500">Data tidak ditemukan.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="size-5" /></Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <GitBranch className="size-6 text-purple-600" /> Timeline Usulan
          </h2>
          <p className="text-slate-500">{kegiatan.nama_kegiatan}</p>
        </div>
      </div>

      <Card className="shadow-sm"><CardContent className="p-5">
        <div className="flex items-center gap-3">
          <StatusBadge status={kegiatan.status} />
          <span className="text-sm text-slate-500">Status terkini</span>
        </div>
      </CardContent></Card>

      <div className="relative pl-8">
        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 via-purple-400 to-slate-200 rounded-full" />
        
        {timeline.length === 0 ? (
          <div className="py-8 text-center text-slate-500 ml-4">Belum ada riwayat timeline.</div>
        ) : (
          <div className="space-y-6">
            {timeline.map((entry: any, idx: number) => {
              const status = entry.new_status || entry.status || 'unknown';
              return (
                <div key={entry.$id || idx} className="relative">
                  <div className="absolute -left-5 top-3 size-4 rounded-full border-2 border-white shadow-md bg-blue-500" />
                  <Card className="ml-4 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <StatusBadge status={status} />
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="size-3" />
                          {formatDate(entry.$createdAt || entry.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1"><User className="size-3.5" /> {entry.actor_name || entry.changed_by_name || '-'}</span>
                        {entry.actor_role && <span className="capitalize text-xs bg-slate-100 px-2 py-0.5 rounded">{entry.actor_role}</span>}
                      </div>
                      {(entry.catatan || entry.note) && (
                        <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-md text-sm text-slate-700">
                          <MessageSquare className="size-4 text-slate-400 mt-0.5 shrink-0" />
                          <span>{entry.catatan || entry.note}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
