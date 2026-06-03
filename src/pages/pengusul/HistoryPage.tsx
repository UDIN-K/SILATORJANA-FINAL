import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { apiListKegiatan } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { Input } from '@/components/ui/input';
import { Search, Eye, Clock, Loader2, Calendar, Building2, Archive } from 'lucide-react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getUserId, formatDate, formatCurrency } from '@/lib/helpers';

export function HistoryPage() {
  const navigate = useNavigate();
  const { setPageTourSteps } = useOutletContext<any>();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setPageTourSteps([
      {
        target: '.tour-history-header',
        content: (
          <div>
            <h3 className="font-bold text-slate-800 text-sm mb-1">Riwayat Kegiatan</h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              Arsip dokumen untuk semua kegiatan yang telah tuntas atau ditolak.
            </p>
          </div>
        ),
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '.tour-history-search',
        content: (
          <div>
            <h3 className="font-bold text-slate-800 text-sm mb-1">Cari Arsip</h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              Gunakan fitur ini untuk mencari dokumen lama berdasarkan nama kegiatannya.
            </p>
          </div>
        ),
        placement: 'bottom-start',
      },
      {
        target: '.tour-history-list',
        content: (
          <div>
            <h3 className="font-bold text-slate-800 text-sm mb-1">Daftar Arsip</h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              Klik "Detail" pada masing-masing arsip untuk melihat rincian LPJ atau sejarah persetujuannya.
            </p>
          </div>
        ),
        placement: 'top',
      }
    ]);
  }, [setPageTourSteps]);

  useEffect(() => {
    (async () => {
      try {
        const userId = getUserId();
        const res = await apiListKegiatan({ pengusul_id: userId });
        // Only show completed/finished items
        const completed = (res.data || res).filter((d: any) =>
          ['completed', 'selesai', 'lpj_done', 'lpj_approved', 'lpj_verified', 'rejected', 'ditolak'].includes(d.status?.toLowerCase())
        );
        setItems(completed);
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    })();
  }, []);

  const filtered = items.filter(item =>
    !search || item.nama_kegiatan?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="tour-history-header">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Archive className="size-6 text-emerald-700" /> Riwayat Kegiatan
        </h2>
        <p className="text-slate-500">Kegiatan yang sudah selesai atau ditolak.</p>
      </div>

      <Card className="tour-history-list shadow-sm border-slate-200">
        <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="tour-history-search relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
            <Input placeholder="Cari kegiatan..." className="pl-9 bg-white" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center"><Loader2 className="animate-spin text-emerald-700 mx-auto" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Clock className="size-12 mx-auto mb-3 text-slate-300" />
              <p>Belum ada riwayat kegiatan.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map(item => (
                <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex-1 min-w-0 w-full sm:w-auto">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <p className="font-semibold text-slate-900 truncate max-w-full">{item.nama_kegiatan}</p>
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Calendar className="size-3" />{formatDate(item.created_at)}</span>
                      {item.nama_jurusan && <span className="flex items-center gap-1"><Building2 className="size-3" />{item.nama_jurusan}</span>}
                      {item.total_anggaran && <span>{formatCurrency(item.total_anggaran)}</span>}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto text-emerald-700 border-emerald-200 hover:bg-emerald-50" onClick={() => navigate(`/dashboard/pengusul/history/${item.id}`)}>
                    <Eye className="size-4 mr-1" /> Detail
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
