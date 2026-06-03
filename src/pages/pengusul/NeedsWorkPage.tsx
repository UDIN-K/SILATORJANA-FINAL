import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { apiListKegiatan } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { Input } from '@/components/ui/input';
import { Search, AlertTriangle, Edit, Eye, Loader2, Clock, ClipboardList, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getUserId, formatDate, timeAgo } from '@/lib/helpers';

function renderCatatanRevisi(catatan: string) {
  if (!catatan) return null;
  const lines = catatan.split('\n');
  const items: { field: string; text: string }[] = [];

  for (const line of lines) {
    const match = line.match(/^\[(.+?)\]:\s*(.+)$/);
    if (match) {
      items.push({ field: match[1], text: match[2] });
    } else if (line.trim()) {
      items.push({ field: 'Umum / Lainnya', text: line.trim() });
    }
  }

  if (items.length === 0) return <p className="mt-2 text-sm text-amber-800 bg-amber-50 p-3 rounded-lg border border-amber-100">{catatan}</p>;

  return (
    <div className="space-y-1.5 mt-3 bg-amber-50/40 border border-amber-100/50 rounded-xl p-3">
      <p className="font-bold text-amber-800 text-[11px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <ClipboardList className="size-4 shrink-0" /> Rincian Catatan Revisi:
      </p>
      <div className="grid gap-2 text-xs text-slate-700">
        {items.map((it, idx) => (
          <div key={idx} className="flex items-start gap-2 bg-white/80 border border-slate-100/80 rounded-lg p-2.5 shadow-sm">
            <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-2 py-0.5 rounded-full uppercase shrink-0 mt-0.5">
              {it.field.replace(/_/g, ' ')}
            </span>
            <span className="leading-relaxed font-semibold text-slate-800">{it.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function NeedsWorkPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const userId = getUserId();
        const res = await apiListKegiatan({ pengusul_id: userId });
        const needsWork = (res.data || res).filter((d: any) =>
          ['revision_requested', 'revisi', 'lpj_revision'].includes(d.status?.toLowerCase())
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
      <div className="space-y-1 sm:space-y-1.5">
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
              <p className="font-medium flex items-center justify-center gap-2">
                Tidak ada kegiatan yang perlu direvisi <CheckCircle2 className="size-5 text-emerald-500" />
              </p>
              <p className="text-sm mt-1">Semua kegiatan Anda sudah dalam kondisi baik.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map(item => (
                <div key={item.id} className="p-4 hover:bg-amber-50/30 transition-colors">
                  <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <p className="font-semibold text-slate-900 truncate">{item.nama_kegiatan}</p>
                        <StatusBadge status={item.status} />
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 flex-wrap">
                        <span>Diperbarui {timeAgo(item.updated_at)}</span>
                        <span>Dibuat {formatDate(item.created_at)}</span>
                      </div>
                      {renderCatatanRevisi(item.catatan_revisi)}
                    </div>
                    <div className="flex w-full sm:w-auto justify-end gap-2 shrink-0">
                      <Button variant="outline" size="sm" className="text-emerald-700 border-emerald-200 hover:bg-emerald-50" onClick={() => navigate(`/dashboard/pengusul/usulan/${item.id}`)}>
                        <Eye className="size-4 mr-1" /> Lihat
                      </Button>
                      <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white" onClick={() => navigate(`/dashboard/pengusul/revisi/${item.id}`)}>
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
