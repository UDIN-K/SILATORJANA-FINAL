import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiListKegiatan } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/helpers';
import { Eye, CheckCircle, Clock, FileText, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

export function WadirDashboard() {
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

  // Menunggu persetujuan Wadir: setelah PPK menyetujui
  const pendingReview = items.filter(i => i.status === 'approved_ppk');
  // Proposal yang dikembalikan untuk revisi oleh Wadir
  const inRevision = items.filter(i => i.status === 'revision_requested');
  const approved = items.filter(i => ['approved_wadir', 'accepted_funds', 'funds_disbursed', 'completed', 'lpj_done', 'lpj_approved'].includes(i.status));

  if (isLoading) return <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-blue-600 size-8" /></div>;

  return (
    <div className="space-y-6">
      <div className="space-y-1 sm:space-y-1.5">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard Wadir</h2>
        <p className="text-slate-500 mt-1">Persetujuan kegiatan tingkat Wakil Direktur.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="shadow-sm hover:shadow-md transition-shadow border-slate-200/60 rounded-2xl cursor-default group">
          <CardContent className="p-4 flex items-center gap-4">
            <Clock className="size-8 sm:size-10 text-amber-500 transition-transform group-hover:scale-110" />
            <div>
               <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800 leading-none mb-1">{pendingReview.length}</h3>
               <p className="text-xs sm:text-sm text-slate-500 font-medium">Menunggu</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow border-slate-200/60 rounded-2xl cursor-default group">
          <CardContent className="p-4 flex items-center gap-4">
            <CheckCircle className="size-8 sm:size-10 text-emerald-500 transition-transform group-hover:scale-110" />
            <div>
               <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800 leading-none mb-1">{approved.length}</h3>
               <p className="text-xs sm:text-sm text-slate-500 font-medium">Disetujui</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow border-slate-200/60 rounded-2xl cursor-default group col-span-2 sm:col-span-1">
          <CardContent className="p-4 flex items-center gap-4">
            <FileText className="size-8 sm:size-10 text-blue-500 transition-transform group-hover:scale-110" />
            <div>
               <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800 leading-none mb-1">{items.length}</h3>
               <p className="text-xs sm:text-sm text-slate-500 font-medium">Total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Menunggu Persetujuan Wadir */}
      {pendingReview.length > 0 && (
        <Card className="shadow-sm border-amber-200 bg-amber-50/30">
          <CardHeader className="border-b border-amber-100">
            <CardTitle className="text-base text-amber-800">Menunggu Persetujuan Wadir ({pendingReview.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0"><div className="divide-y divide-amber-100">
            {pendingReview.map(item => (
              <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 sm:gap-4 hover:bg-amber-50/50">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{item.nama_kegiatan}</p>
                  <p className="text-xs text-slate-500 mt-1">{formatDate(item.created_at)} · Disetujui PPK</p>
                </div>
                <div className="shrink-0">
                  <Button size="sm" onClick={() => navigate(`/dashboard/wadir2/review/${item.id}`)} className="bg-emerald-700 hover:bg-emerald-800">
                    <Eye className="size-4 mr-1" />Review
                  </Button>
                </div>
              </div>
            ))}
          </div></CardContent>
        </Card>
      )}

      {/* Proposal yang dikembalikan untuk revisi */}
      {inRevision.length > 0 && (
        <Card className="shadow-sm border-rose-200 bg-rose-50/20">
          <CardHeader className="border-b border-rose-100">
            <CardTitle className="text-base text-rose-700">Dikembalikan untuk Revisi ({inRevision.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0"><div className="divide-y divide-rose-100">
            {inRevision.map(item => (
              <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 sm:gap-4 hover:bg-rose-50/30">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{item.nama_kegiatan}</p>
                  <p className="text-xs text-slate-500 mt-1">{formatDate(item.created_at)} · Menunggu perbaikan dari pengusul</p>
                </div>
                <div className="shrink-0">
                  <Button size="sm" variant="outline" onClick={() => navigate(`/dashboard/wadir2/review/${item.id}`)} className="text-rose-600 border-rose-200 hover:bg-rose-50">
                    <Eye className="size-4 mr-1" />Lihat
                  </Button>
                </div>
              </div>
            ))}
          </div></CardContent>
        </Card>
      )}
    </div>
  );
}
