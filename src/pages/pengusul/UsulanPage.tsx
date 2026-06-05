import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { apiListKegiatan } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Plus, Search, Eye, Edit, Trash2, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/StatusBadge';
import { Pagination } from '@/components/Pagination';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';

export function UsulanPage() {
  const navigate = useNavigate();
  const [usulanList, setUsulanList] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [perPage, setPerPage] = useState(12);
  const { setPageTourSteps } = useOutletContext<any>();

  useEffect(() => {
    setPageTourSteps([
      {
        target: '.tour-usulan-header',
        content: (
          <div>
            <h3 className="font-bold text-slate-800 text-sm mb-1">Daftar Usulan</h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              Di halaman ini Anda dapat melihat sejarah dan status seluruh usulan kegiatan Anda.
            </p>
          </div>
        ),
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '.tour-usulan-add',
        content: (
          <div>
            <h3 className="font-bold text-slate-800 text-sm mb-1">Buat Usulan Baru</h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              Klik tombol ini untuk mulai membuat draf pengajuan kegiatan dan anggaran baru!
            </p>
          </div>
        ),
        placement: 'left',
      },
      {
        target: '.tour-usulan-search',
        content: (
          <div>
            <h3 className="font-bold text-slate-800 text-sm mb-1">Pencarian & Filter</h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              Gunakan kotak pencarian ini untuk menemukan dokumen yang spesifik dengan cepat.
            </p>
          </div>
        ),
        placement: 'bottom-start',
      },
      {
        target: '.tour-usulan-table',
        content: (
          <div>
            <h3 className="font-bold text-slate-800 text-sm mb-1">Tabel Usulan</h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              Data status, tanggal pengajuan, dan detail anggaran ditampilkan dalam bentuk tabel yang dapat di-klik untuk melihat rincian lebih lanjut.
            </p>
          </div>
        ),
        placement: 'top',
      }
    ]);
  }, [setPageTourSteps]);

  // Debounce search input (BUG-009: delay before API call)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1); // Reset to page 1 on new search
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsulan = useCallback(async (page: number, searchTerm: string) => {
    setIsLoading(true);
    try {
      let userId: number | string = 1;
      try {
         const userStr = localStorage.getItem('currentUser');
         if (userStr) {
           const user = JSON.parse(userStr);
           userId = parseInt(user.id || user.user_id || '1', 10);
         }
      } catch(e) {
         console.log('Error reading auth session from localStorage', e);
      }
      // BUG-009: Forward search to backend API
      // BUG-010: Use page parameter for pagination
      const params: Record<string, string> = {
        pengusul_id: String(userId),
        limit: String(perPage),
        page: String(page),
      };
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      const res = await apiListKegiatan(params);
      setUsulanList((res?.data || res) || []);
      // Extract pagination metadata from Laravel paginated response
      setCurrentPage(res?.current_page || 1);
      setLastPage(res?.last_page || 1);
      setTotal(res?.total || 0);
      setPerPage(res?.per_page || 12);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [perPage]);

  useEffect(() => {
    fetchUsulan(currentPage, debouncedSearch);
  }, [currentPage, debouncedSearch, fetchUsulan]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* StatusBadge used instead of getStatusBadge */

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="tour-usulan-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 sm:space-y-1.5">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Daftar Usulan Kegiatan</h2>
          <p className="text-slate-500">Kelola dan pantau seluruh usulan yang Anda ajukan di dalam sistem.</p>
        </div>
        <Button onClick={() => navigate('/dashboard/pengusul/usulan/baru')} className="tour-usulan-add bg-emerald-700 hover:bg-emerald-800 text-white shadow-md shadow-emerald-700/20 px-6 h-11 rounded-full transition-all font-bold group">
          <Plus className="size-5 mr-2 group-hover:rotate-90 transition-transform" /> Buat Usulan Baru
        </Button>
      </div>

      <Card className="tour-usulan-table shadow-lg shadow-slate-200/40 border-white/50 bg-white/80 backdrop-blur-xl overflow-hidden rounded-2xl">
        <CardHeader className="p-5 border-b border-white/50 bg-white/40">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="tour-usulan-search relative w-full sm:w-80 group">
                <Search className="absolute left-4 top-3.5 size-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <Input
                  placeholder="Cari nama kegiatan..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-11 py-5 rounded-xl bg-white border-slate-200/80 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 shadow-sm transition-all text-sm"
                />
              </div>
              {total > 0 && (
                <p className="text-sm text-slate-500 font-medium whitespace-nowrap">
                  Total: <span className="font-bold text-slate-700">{total}</span> usulan
                </p>
              )}
          </div>
        </CardHeader>
        <CardContent className="p-0 border-none sm:border-solid">
          {isLoading ? (
            <div className="py-24 text-center">
              <Loader2 className="animate-spin text-emerald-600 size-10 mx-auto" />
              <p className="text-slate-500 mt-4 text-sm font-medium">Memuat data usulan...</p>
            </div>
          ) : usulanList.length === 0 ? (
            <div className="py-24 text-center text-slate-500 px-4">
              <div className="inline-flex justify-center items-center size-20 rounded-full bg-slate-50 mb-4 border border-slate-100">
                <Search className="size-8 text-slate-300" />
              </div>
              <p className="text-slate-800 text-lg font-semibold">
                {debouncedSearch ? 'Tidak ditemukan usulan' : 'Belum ada usulan'}
              </p>
              <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
                {debouncedSearch ? 'Coba gunakan kata kunci pencarian yang lain.' : 'Silakan klik tombol "Buat Usulan Baru" untuk memulai.'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 sm:p-5 bg-transparent">
                {usulanList.map((item) => (
                  <div key={item.id} className="group flex flex-col justify-between p-4 rounded-2xl bg-white/70 border border-white/60 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all gap-4">
                    <div className="space-y-1 sm:space-y-2">
                      <p className="font-bold text-[13px] sm:text-[15px] text-slate-800 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">{item.nama_kegiatan || 'Usulan Tanpa Nama'}</p>
                      <div className="flex flex-row items-center gap-2 mt-2 opacity-80 flex-wrap">
                        <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">{new Date(item.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                        <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0"></span>
                        <p className="text-[10px] sm:text-[11px] font-mono font-medium text-slate-500 break-all">ID: {String(item.id).padStart(8, '0')}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 pt-3 border-t border-slate-200/50 mt-auto items-start w-full">
                      <div className="transform origin-left shrink-0">
                        <StatusBadge status={item.status} />
                      </div>
                      <div className="flex w-full items-center gap-2">
                        <Button variant="outline" size="sm" className="flex-1 h-8 sm:h-9 text-emerald-700 border-emerald-200/60 bg-emerald-50/50 hover:bg-emerald-100 shadow-sm transition-all" onClick={() => navigate(`/dashboard/pengusul/usulan/${item.id}`)} title="Lihat Detail">
                           <Eye className="size-3.5 sm:size-4" />
                        </Button>
                        <Button disabled={!(item.status === 'draft' || item.status === 'revisi' || item.status === 'revision_requested')} variant="outline" size="sm" className="flex-1 h-8 sm:h-9 text-amber-600 border-amber-200/60 bg-amber-50/50 hover:bg-amber-100 shadow-sm transition-all disabled:opacity-40" onClick={() => navigate(item.status === 'draft' ? `/dashboard/pengusul/usulan/edit/${item.id}` : `/dashboard/pengusul/revisi/${item.id}`)} title="Edit">
                           <Edit className="size-3.5 sm:size-4" />
                        </Button>
                        <Button disabled={!(item.status === 'draft' || item.status === 'revisi' || item.status === 'revision_requested')} variant="outline" size="sm" className="flex-1 h-8 sm:h-9 text-red-600 border-red-200/60 bg-red-50/50 hover:bg-red-100 shadow-sm transition-all disabled:opacity-40" title="Hapus">
                           <Trash2 className="size-3.5 sm:size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* BUG-010: Pagination */}
              <Pagination
                currentPage={currentPage}
                lastPage={lastPage}
                total={total}
                perPage={perPage}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
