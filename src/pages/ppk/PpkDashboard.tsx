import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiListKegiatan } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/helpers';
import { Eye, CheckCircle, XCircle, FileText, Clock, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

export function PpkDashboard() {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiListKegiatan();
        setItems((res.data || res));
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    })();
  }, []);

  // pending_ppk = Pengusul telah meneruskan ke PPK, menunggu review PPK
  const pendingReview = items.filter(i => i.status === 'pending_ppk');
  // revision_requested = PPK telah meminta revisi, menunggu perbaikan pengusul
  const inRevision = items.filter(i => i.status === 'revision_requested');
  const approved = items.filter(i => ['approved_ppk', 'approved_wadir', 'accepted_funds', 'funds_disbursed', 'completed', 'lpj_done', 'lpj_approved'].includes(i.status?.toLowerCase()));
  const rejected = items.filter(i => i.status === 'rejected');

  const cards = [
    { label: 'Menunggu Review', value: pendingReview.length, icon: Clock, color: 'bg-amber-100 text-amber-600', backColor: 'text-amber-900/5' },
    { label: 'Disetujui', value: approved.length, icon: CheckCircle, color: 'bg-emerald-100 text-emerald-600', backColor: 'text-emerald-900/5' },
    { label: 'Ditolak', value: rejected.length, icon: XCircle, color: 'bg-red-100 text-red-600', backColor: 'text-red-900/5' },
    { label: 'Total', value: items.length, icon: FileText, color: 'bg-blue-100 text-blue-600', backColor: 'text-blue-900/5' },
  ];

  if (isLoading) return <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-blue-600 size-8" /></div>;

  return (
    <div className="space-y-6">
      <div className="space-y-1 sm:space-y-1.5">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard PPK</h2>
        <p className="text-slate-500 mt-1">Proses penetapan dan persetujuan kegiatan.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((c, i) => (
          <Card key={i} className="shadow-sm hover:shadow-md transition-shadow border-slate-200/60 rounded-2xl cursor-default group">
            <CardContent className="p-4 flex items-center gap-4">
               <c.icon className={`size-8 sm:size-10 ${c.color.replace('bg-', 'text-').replace('100 text-', '').replace('600', '500')} transition-transform group-hover:scale-110`} />
               <div>
                 <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800 leading-none mb-1">{c.value}</h3>
                 <p className="text-xs sm:text-sm text-slate-500 font-medium">{c.label}</p>
               </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Menunggu Review PPK */}
      {pendingReview.length > 0 && (
        <Card className="shadow-sm border-amber-200 bg-amber-50/30">
          <CardHeader className="border-b border-amber-100">
            <CardTitle className="text-base text-amber-800">Menunggu Persetujuan PPK ({pendingReview.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-amber-100">
              {pendingReview.map(item => (
                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 sm:gap-4 hover:bg-amber-50/50">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{item.nama_kegiatan}</p>
                    <p className="text-xs text-slate-500 mt-1">{formatDate(item.created_at)} · Diteruskan pengusul ke PPK</p>
                  </div>
                  <div className="shrink-0">
                    <Button size="sm" onClick={() => navigate(`/dashboard/ppk/review/${item.id}`)} className="bg-emerald-700 hover:bg-emerald-800">
                      <Eye className="size-4 mr-1" />Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Menunggu Revisi dari Pengusul */}
      {inRevision.length > 0 && (
        <Card className="shadow-sm border-rose-200 bg-rose-50/20">
          <CardHeader className="border-b border-rose-100">
            <CardTitle className="text-base text-rose-700">Dikembalikan untuk Revisi ({inRevision.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-rose-100">
              {inRevision.map(item => (
                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 sm:gap-4 hover:bg-rose-50/30">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{item.nama_kegiatan}</p>
                    <p className="text-xs text-slate-500 mt-1">{formatDate(item.created_at)} · Menunggu perbaikan dari pengusul</p>
                  </div>
                  <div className="shrink-0">
                    <Button size="sm" variant="outline" onClick={() => navigate(`/dashboard/ppk/review/${item.id}`)} className="text-rose-600 border-rose-200 hover:bg-rose-50">
                      <Eye className="size-4 mr-1" />Lihat
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
