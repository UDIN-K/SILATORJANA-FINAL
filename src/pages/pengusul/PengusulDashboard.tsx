import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiListKegiatan } from '@/lib/api';
import { Package, Clock, ShieldCheck, CheckCircle, Plus, FileText, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useEffect, useState } from 'react';

export function PengusulDashboard() {
  const navigate = useNavigate();
  const { setPageTourSteps } = useOutletContext<any>();
  const [usulanList, setUsulanList] = useState<any[]>([]);
  const [counts, setCounts] = useState({
    total: 0,
    menunggu: 0,
    berjalan: 0,
    selesai: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setPageTourSteps([
      {
        target: '.tour-pengusul-header',
        content: (
          <div>
            <h3 className="font-bold text-slate-800 text-sm mb-1">Dashboard Pengusul</h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              Ringkasan aktivitas dan metrik jumlah usulan Anda.
            </p>
          </div>
        ),
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '.tour-pengusul-add',
        content: (
          <div>
            <h3 className="font-bold text-slate-800 text-sm mb-1">Buat Usulan Baru</h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              Tombol cepat untuk mulai membuat draf pengajuan baru.
            </p>
          </div>
        ),
        placement: 'left',
      },
      {
        target: '.tour-pengusul-stats',
        content: (
          <div>
            <h3 className="font-bold text-slate-800 text-sm mb-1">Statistik Real-time</h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              Pantau progres berapa usulan yang sedang diajukan, berjalan, atau sudah selesai.
            </p>
          </div>
        ),
        placement: 'top',
      },
    ]);
  }, [setPageTourSteps]);

  useEffect(() => {
    const fetchUsulan = async () => {
      try {
        let userId: number | string = 1; // fallback
        try {
          const userStr = localStorage.getItem('currentUser');
          if (userStr) {
            const user = JSON.parse(userStr);
            userId = parseInt(user.id || user.user_id || '1', 10);
          }
        } catch (e) {
          console.log('Error reading auth session from localStorage', e);
        }

        const allRes = await apiListKegiatan();

        const allDocs = (allRes.data || allRes);
        setUsulanList(allDocs.slice(0, 5)); // Just take top 5 for the "Aktivitas Terakhir"

        let cTotal = allDocs.length;
        let cMenunggu = 0;
        let cBerjalan = 0;
        let cSelesai = 0;

        allDocs.forEach((doc: any) => {
          if (doc.status === 'selesai' || doc.status === 'completed' || doc.status === 'lpj_done') {
            cSelesai++;
          } else if (doc.status.startsWith('menunggu') || doc.status.startsWith('disetujui') || ['pending_ppk', 'approved_ppk', 'approved_wadir', 'accepted_funds', 'funds_disbursed'].includes(doc.status?.toLowerCase())) {
            cBerjalan++;
          } else if (['draft', 'diajukan', 'revisi', 'submitted', 'revisi_done', 'diverifikasi', 'verified'].includes(doc.status?.toLowerCase())) {
            cMenunggu++;
          }
        });

        setCounts({
          total: cTotal,
          menunggu: cMenunggu,
          berjalan: cBerjalan,
          selesai: cSelesai
        });
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsulan();
  }, []);

  return (
    <div className="space-y-6">
      <div className="tour-pengusul-header flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard Pengusul</h2>
          <p className="text-slate-500">Selamat datang kembali! Berikut ringkasan usulan Anda.</p>
        </div>
        <Button onClick={() => navigate('/dashboard/pengusul/usulan/baru')} className="tour-pengusul-add bg-emerald-700 hover:bg-emerald-800 text-white shadow-md shadow-emerald-700/20 px-6 h-11 rounded-full transition-all font-bold group">
          <Plus className="size-5 mr-2 group-hover:rotate-90 transition-transform" />
          Buat Usulan Baru
        </Button>
      </div>

      {isLoading ? (
        <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-emerald-700 size-8" /></div>
      ) : (
        <>
          <div className="tour-pengusul-stats grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="shadow-sm hover:shadow-md transition-shadow border-slate-200/60 rounded-2xl cursor-default group">
              <CardContent className="p-4 flex items-center gap-4">
                <Package className="size-8 sm:size-10 text-emerald-500 transition-transform group-hover:scale-110" />
                <div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800 leading-none mb-1">{counts.total}</h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">Total</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-shadow border-slate-200/60 rounded-2xl cursor-default group">
              <CardContent className="p-4 flex items-center gap-4">
                <Clock className="size-8 sm:size-10 text-amber-500 transition-transform group-hover:scale-110" />
                <div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800 leading-none mb-1">{counts.menunggu}</h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">Verifikasi</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-shadow border-slate-200/60 rounded-2xl cursor-default group">
              <CardContent className="p-4 flex items-center gap-4">
                <ShieldCheck className="size-8 sm:size-10 text-indigo-500 transition-transform group-hover:scale-110" />
                <div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800 leading-none mb-1">{counts.berjalan}</h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">Berjalan</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm hover:shadow-md transition-shadow border-slate-200/60 rounded-2xl cursor-default group">
              <CardContent className="p-4 flex items-center gap-4">
                <CheckCircle className="size-8 sm:size-10 text-emerald-500 transition-transform group-hover:scale-110" />
                <div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800 leading-none mb-1">{counts.selesai}</h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">Selesai</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Perlu Revisi Alert */}
          {usulanList.filter((i: any) => i.status === 'revision_requested').length > 0 && (
            <Card className="shadow-sm border-rose-200 bg-rose-50/30">
              <CardHeader className="border-b border-rose-100 bg-rose-50/50">
                <CardTitle className="text-base text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="size-5 shrink-0" /> Usulan Perlu Direvisi ({usulanList.filter((i: any) => i.status === 'revision_requested').length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-rose-100">
                  {usulanList.filter((i: any) => i.status === 'revision_requested').map((item: any) => (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-rose-50/50">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{item.nama_kegiatan}</p>
                        {item.catatan_revisi && <p className="text-xs text-rose-700 mt-1 italic">Catatan: {item.catatan_revisi}</p>}
                      </div>
                      <Button size="sm" onClick={() => navigate(`/dashboard/pengusul/revisi/${item.id}`)} className="bg-rose-600 hover:bg-rose-700 shrink-0">
                        Perbaiki Sekarang
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Verified — siap diteruskan ke PPK */}
          {usulanList.filter((i: any) => i.status === 'verified' || i.status === 'diverifikasi').length > 0 && (
            <Card className="shadow-sm border-emerald-200 bg-emerald-50/20">
              <CardHeader className="border-b border-emerald-100 bg-emerald-50/30">
                <CardTitle className="text-base text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="size-5 shrink-0" /> Terverifikasi – Siap Diteruskan ke PPK ({usulanList.filter((i: any) => i.status === 'verified' || i.status === 'diverifikasi').length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-emerald-100">
                  {usulanList.filter((i: any) => i.status === 'verified' || i.status === 'diverifikasi').map((item: any) => (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-emerald-50/50">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{item.nama_kegiatan}</p>
                        <p className="text-xs text-emerald-700 mt-1">Diverifikasi · Klik "Teruskan ke PPK" di halaman detail</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/dashboard/pengusul/usulan/${item.id}`)} className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 shrink-0">
                        Teruskan ke PPK
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

            <Card className="shadow-lg border-white/50 bg-white/80 backdrop-blur-xl rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-white/50 bg-white/40">
              <CardTitle className="text-lg">Aktivitas Terakhir</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {usulanList.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">Anda belum membuat usulan kegiatan.</div>
                ) : (
                  usulanList.map((item) => (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 sm:gap-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
                        <div className="p-2.5 rounded-full bg-slate-100 text-slate-500 shrink-0">
                          <FileText className="size-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{item.nama_kegiatan}</p>
                          <p className="text-sm text-slate-500">{new Date(item.created_at).toLocaleDateString('id-ID')}</p>
                        </div>
                      </div>
                      <div className="ml-12 sm:ml-0 shrink-0">
                        <StatusBadge status={item.status} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// End of component
