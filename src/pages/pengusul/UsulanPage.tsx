import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { apiListKegiatan } from '@/lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Search, Eye, Edit, Trash2, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/StatusBadge';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useEffect, useState } from 'react';

export function UsulanPage() {
  const navigate = useNavigate();
  const [usulanList, setUsulanList] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    const fetchUsulan = async () => {
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
        const res = await apiListKegiatan({ pengusul_id: userId });
        setUsulanList((res?.data || res) || []);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsulan();
  }, []);

  const filteredList = usulanList.filter(item => {
    const s = search.toLowerCase();
    return (
      item.nama_kegiatan?.toLowerCase().includes(s) ||
      String(item.id).includes(s)
    );
  });

  /* StatusBadge used instead of getStatusBadge */

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="tour-usulan-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Daftar Usulan Kegiatan</h2>
          <p className="text-slate-500 mt-2">Kelola dan pantau seluruh usulan yang Anda ajukan di dalam sistem.</p>
        </div>
        <Button onClick={() => navigate('/dashboard/pengusul/usulan/baru')} className="tour-usulan-add bg-[#047857] hover:bg-[#065F46] text-white shadow-lg shadow-emerald-700/20 px-6 py-5 rounded-xl transition-all font-semibold h-11 border-none cursor-pointer active:scale-95 flex items-center justify-center">
          <Plus className="size-5 mr-2" /> Buat Usulan Baru
        </Button>
      </div>

      <Card className="tour-usulan-table shadow-sm border-slate-200/60 overflow-hidden bg-white">
        <CardHeader className="p-5 border-b border-slate-100/60 bg-slate-50/30">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="tour-usulan-search relative w-full sm:w-80 group">
                <Search className="absolute left-4 top-3.5 size-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                <Input
                  placeholder="Cari ID atau nama kegiatan..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-11 py-5 rounded-xl bg-white border-slate-200/80 focus-visible:ring-emerald-500/20 focus-visible:border-emerald-500 shadow-sm transition-all text-sm"
                />
              </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b-slate-100/60">
                  <TableHead className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">ID Usulan</TableHead>
                  <TableHead className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Nama Kegiatan</TableHead>
                  <TableHead className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Tanggal Diajukan</TableHead>
                  <TableHead className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Status Saat Ini</TableHead>
                  <TableHead className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-slate-500 text-right whitespace-nowrap">Aksi / Tindakan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center">
                       <Loader2 className="animate-spin text-emerald-600 size-8 mx-auto" />
                       <p className="text-slate-500 mt-2 text-sm">Memuat data usulan...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-slate-500">
                       <div className="inline-flex justify-center items-center size-12 rounded-full bg-slate-50 mb-3 border border-slate-100">
                         <Search className="size-6 text-slate-300" />
                       </div>
                       <p className="text-slate-500 text-sm font-medium">
                         {usulanList.length === 0 ? 'Belum ada usulan yang diajukan.' : 'Tidak ditemukan usulan yang cocok.'}
                       </p>
                       <p className="text-slate-400 text-xs mt-1">
                         {usulanList.length === 0 ? 'Silakan klik tombol "Buat Usulan Baru" untuk memulai.' : 'Coba gunakan kata kunci pencarian yang lain.'}
                       </p>
                    </TableCell>
                  </TableRow>
                ) : filteredList.map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/80 transition-colors border-b-slate-100/60">
                    <TableCell className="px-6 py-4 font-mono text-sm font-medium text-slate-500">{String(item.id).padStart(8, '0')}</TableCell>
                    <TableCell className="px-6 py-4 font-semibold text-slate-800 min-w-[200px]">{item.nama_kegiatan}</TableCell>
                    <TableCell className="px-6 py-4 text-slate-600 whitespace-nowrap font-medium text-sm">{new Date(item.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</TableCell>
                    <TableCell className="px-6 py-4 min-w-[150px]"><StatusBadge status={item.status} /></TableCell>
                    <TableCell className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      <Button variant="outline" size="sm" className="h-9 w-9 p-0 text-emerald-700 border-emerald-200/60 bg-emerald-50/50 hover:bg-emerald-100 shadow-sm transition-all" onClick={() => navigate(`/dashboard/pengusul/usulan/${item.id}`)} title="Lihat Detail">
                         <Eye className="size-4" />
                      </Button>
                      <Button disabled={!(item.status === 'draft' || item.status === 'revisi')} variant="outline" size="sm" className="h-9 w-9 p-0 text-amber-600 border-amber-200/60 bg-amber-50/50 hover:bg-amber-100 shadow-sm transition-all disabled:opacity-40" title="Edit">
                         <Edit className="size-4" />
                      </Button>
                      <Button disabled={!(item.status === 'draft' || item.status === 'revisi')} variant="outline" size="sm" className="h-9 w-9 p-0 text-red-600 border-red-200/60 bg-red-50/50 hover:bg-red-100 shadow-sm transition-all disabled:opacity-40" title="Hapus">
                         <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
