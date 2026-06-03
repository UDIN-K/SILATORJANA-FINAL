import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiListKegiatan } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate } from '@/lib/helpers';
import { Search, Eye, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

export function VerifikatorProposalList() {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await apiListKegiatan();
        setItems(res.data || res);
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
    })();
  }, []);

  const filtered = items.filter(i => !search || i.nama_kegiatan?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/50">
        <div className="space-y-1 sm:space-y-1.5">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Ruang Verifikasi</h2>
          <p className="text-slate-500 mt-1">Kelola dan periksa seluruh proposal kegiatan yang diajukan.</p>
        </div>
      </div>
      
      <Card className="shadow-lg shadow-slate-200/40 border-white/50 bg-white/80 backdrop-blur-xl overflow-hidden rounded-2xl">
        <CardHeader className="p-5 border-b border-white/50 bg-white/40">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-3.5 size-4 text-slate-400" />
            <Input 
              placeholder="Cari berdasarkan nama kegiatan..." 
              className="pl-10 h-11 bg-white border-slate-200/80 rounded-xl focus:ring-blue-500/20 transition-all shadow-sm" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
             <div className="py-24 flex flex-col items-center justify-center text-slate-400">
               <Loader2 className="animate-spin text-blue-500 size-10 mb-4" />
               <p className="font-medium text-slate-500">Mengambil data usulan...</p>
             </div>
          ) : filtered.length === 0 ? (
             <div className="py-24 flex flex-col items-center justify-center text-center px-4">
               <div className="w-20 h-20 mb-4 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                 <Search className="size-8 text-slate-300" />
               </div>
               <p className="font-semibold text-slate-800 text-lg">Tidak ada proposal</p>
               <p className="text-slate-500 mt-1 max-w-sm">Belum ada usulan kegiatan yang perlu diverifikasi atau sesuai dengan pencarian Anda.</p>
             </div>
          ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 sm:p-5 bg-transparent">
               {filtered.map(item => (
                 <div key={item.id} className="group flex flex-col justify-between p-4 rounded-2xl bg-white/70 border border-white/60 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all gap-4">
                   <div className="space-y-1 sm:space-y-2">
                     <p className="font-bold text-[13px] sm:text-[15px] text-slate-800 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">{item.nama_kegiatan || 'Usulan Tanpa Nama'}</p>
                     <div className="flex flex-row items-center gap-2 mt-2 opacity-80 flex-wrap">
                       <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{formatDate(item.created_at)}</p>
                       <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0"></span>
                       <p className="text-[11px] sm:text-xs font-medium text-slate-500 line-clamp-1 break-all">{item.pengusul_organisasi || 'Pengusul Umum'}</p>
                     </div>
                   </div>
                   <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-slate-200/50 mt-auto w-full">
                     <div className="shrink-0 min-w-0 flex-1">
                       <StatusBadge status={item.status} />
                     </div>
                     <Button 
                       size="sm" 
                       className="w-full sm:w-auto bg-[#047857] hover:bg-[#065F46] text-white shadow-sm shadow-emerald-700/20 h-8 sm:h-9 rounded-lg font-semibold text-xs sm:text-sm shrink-0"
                       onClick={() => navigate(`/dashboard/verifikator/usulan/${item.id}`)}
                     >
                       <Eye className="size-3.5 sm:size-4 mr-1.5" /> Periksa
                     </Button>
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
