import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiListKegiatan } from '@/lib/api';
import api from '@/lib/api';
import { Users, FileText, CheckCircle, AlertTriangle, ArrowUpRight, Clock, Database, Loader2, HardDrive } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useState, useEffect } from 'react';

export function AdminDashboard() {
  const [usulanList, setUsulanList] = useState<any[]>([]);
  const [counts, setCounts] = useState({
    total: 0,
    menunggu: 0,
    disetujui: 0,
    ditolak: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [health, setHealth] = useState<any>(null);
  const [jurusanDist, setJurusanDist] = useState<{name:string;count:number;pct:number}[]>([]);

  useEffect(() => {
    const fetchUsulan = async () => {
      try {
        const res = await apiListKegiatan();

        const allDocs = (res?.data || res) || [];
        setUsulanList(allDocs);

        let cTotal = allDocs.length;
        let cMenunggu = 0;
        let cDisetujui = 0;
        let cDitolak = 0;

        allDocs.forEach((doc: any) => {
          if (doc.status === 'selesai' || doc.status === 'disetujui_rektorat') {
            cDisetujui++;
          } else if (doc.status.includes('ditolak') || doc.status === 'revisi') {
            cDitolak++;
          } else {
            cMenunggu++;
          }
        });

        setCounts({
          total: cTotal,
          menunggu: cMenunggu,
          disetujui: cDisetujui,
          ditolak: cDitolak
        });

        // Calculate jurusan distribution
        const jurusanMap: Record<string, number> = {};
        allDocs.forEach((d: any) => {
          const j = d.nama_jurusan || 'Lainnya';
          jurusanMap[j] = (jurusanMap[j] || 0) + 1;
        });
        const dist = Object.entries(jurusanMap)
          .map(([name, count]) => ({ name, count, pct: Math.round((count / cTotal) * 100) }))
          .sort((a, b) => b.count - a.count);
        setJurusanDist(dist);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsulan();

    // Fetch system health
    api.get('/api/system-health').then(res => setHealth(res.data)).catch(() => {});
  }, []);

  const stats = [
    { label: 'Total Usulan', value: counts.total, icon: FileText, color: 'text-emerald-700', bg: 'bg-emerald-100' },
    { label: 'Proses / Menunggu', value: counts.menunggu, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
    { label: 'Selesai / Disetujui', value: counts.disetujui, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Ditolak/Revisi', value: counts.ditolak, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
  ];

  const getStatusBadge = (status: string) => {
    if (status === 'selesai' || status === 'disetujui_rektorat') {
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Selesai/Disetujui Final</Badge>;
    }
    if (status.includes('ditolak') || status.includes('revisi')) {
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 capitalize">{status.replace(/_/g, ' ')}</Badge>;
    }
    return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 capitalize">{status.replace(/_/g, ' ')}</Badge>;
  };

  if (isLoading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto size-8 text-emerald-700" /></div>;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8 sm:pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 sm:pb-4 border-b border-slate-100/60">
        <div className="space-y-1 sm:space-y-1.5">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard Administrator</h2>
          <p className="text-slate-500 mt-1">Ringkasan aktivitas dan metrik sistem Si-LATORJANA.</p>
        </div>
      </div>

      {/* Stats Pipeline */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="shadow-sm hover:shadow-md transition-shadow border-slate-200/60 rounded-2xl cursor-default group">
            <CardContent className="p-4 flex items-center gap-4">
              <stat.icon className={`size-8 sm:size-10 ${stat.color.replace('700', '500').replace('600', '500')} transition-transform group-hover:scale-110`} />
              <div>
                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800 leading-none mb-1">{stat.value}</h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">{stat.label.split(' / ')[0]}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 shadow-sm border-slate-200/60 rounded-2xl bg-white overflow-hidden relative">
          <CardHeader className="p-6 border-b border-slate-100/60 bg-slate-50/50 flex flex-row items-center justify-between">
            <div>
               <CardTitle className="text-lg text-slate-800">Usulan Terkini</CardTitle>
               <CardDescription className="text-sm font-medium mt-1">Daftar usulan terbaru yang masuk ke dalam sistem.</CardDescription>
            </div>
            <button className="text-xs font-bold text-[#047857] bg-[#047857]/10 px-3 py-1.5 rounded-lg hover:bg-[#047857]/20 transition-colors hidden sm:block">Lihat Semua</button>
          </CardHeader>
          <CardContent className="p-0">
             <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/30 border-b border-slate-100/80">
                      <TableHead className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">ID Usulan</TableHead>
                      <TableHead className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Judul Kegiatan</TableHead>
                      <TableHead className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Tanggal</TableHead>
                      <TableHead className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100/60">
                    {usulanList.slice(0, 10).map((usulan) => (
                      <TableRow key={usulan.id} className="hover:bg-slate-50/40 transition-colors border-none group">
                        <TableCell className="px-6 py-4 font-mono text-[12px] font-medium text-slate-400">{String(usulan.id).padStart(8, '0')}</TableCell>
                        <TableCell className="px-6 py-4 font-semibold text-slate-700 text-[14px] group-hover:text-emerald-700 transition-colors">{usulan.nama_kegiatan}</TableCell>
                        <TableCell className="px-6 py-4 text-slate-500 font-medium text-[13px]">{new Date(usulan.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year:'numeric'})}</TableCell>
                        <TableCell className="px-6 py-4">{getStatusBadge(usulan.status)}</TableCell>
                      </TableRow>
                    ))}
                    {usulanList.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-12">
                           <div className="flex flex-col items-center justify-center">
                              <FileText className="size-10 text-slate-300 mb-3" />
                              <p className="font-semibold text-slate-600">Tidak ada usulan.</p>
                           </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
             </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200/60 rounded-2xl bg-white overflow-hidden relative">
           <CardHeader className="p-6 border-b border-slate-100/60 bg-slate-50/50">
             <CardTitle className="text-lg text-slate-800">Kesehatan Sistem</CardTitle>
             <CardDescription className="text-sm font-medium mt-1">Status layanan inti aplikasi</CardDescription>
           </CardHeader>
           <CardContent className="p-6 space-y-8">
               <div className="space-y-5">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 border border-slate-100">
                     <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-xl shadow-sm ${health?.database === 'connected' ? 'bg-emerald-100/80 text-emerald-700' : 'bg-red-100/80 text-red-700'}`}>
                           <Database className="size-4.5" />
                        </div>
                        <div>
                           <p className="font-semibold text-slate-800 text-[14px]">MySQL Database</p>
                           <p className="text-[12px] font-medium text-slate-500 mt-0.5">{health ? `Laravel ${health.laravel_version} • PHP ${health.php_version}` : 'Memuat...'}</p>
                        </div>
                     </div>
                     <Badge className={`shadow-sm border rounded-lg px-2.5 ${health?.database === 'connected' ? 'bg-emerald-100 text-emerald-800 border-emerald-200/50' : 'bg-red-100 text-red-800 border-red-200/50'}`}>{health?.database === 'connected' ? 'Online' : 'Error'}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 border border-slate-100">
                     <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-xl shadow-sm ${health?.storage === 'writable' ? 'bg-emerald-100/80 text-emerald-700' : 'bg-red-100/80 text-red-700'}`}>
                           <HardDrive className="size-4.5" />
                        </div>
                        <div>
                           <p className="font-semibold text-slate-800 text-[14px]">Storage</p>
                           <p className="text-[12px] font-medium text-slate-500 mt-0.5">{health ? `${health.users_count} users • ${health.kegiatan_count} kegiatan` : 'Memuat...'}</p>
                        </div>
                     </div>
                     <Badge className={`shadow-sm border rounded-lg px-2.5 ${health?.storage === 'writable' ? 'bg-emerald-100 text-emerald-800 border-emerald-200/50' : 'bg-red-100 text-red-800 border-red-200/50'}`}>{health?.storage === 'writable' ? 'OK' : 'Error'}</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 border border-slate-100">
                     <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-emerald-100/80 text-emerald-700 shadow-sm">
                           <Users className="size-4.5" />
                        </div>
                        <div>
                           <p className="font-semibold text-slate-800 text-[14px]">Authentication</p>
                           <p className="text-[12px] font-medium text-slate-500 mt-0.5">Laravel Sanctum</p>
                        </div>
                     </div>
                     <Badge className="bg-emerald-100 text-emerald-800 shadow-sm border border-emerald-200/50 rounded-lg px-2.5">Online</Badge>
                  </div>
               </div>

               <div className="pt-6 border-t border-slate-100/80">
                   <h4 className="text-[13px] font-bold text-slate-800 mb-5 uppercase tracking-wider">Distribusi Usulan per Jurusan</h4>
                   <div className="space-y-5">
                      {jurusanDist.length > 0 ? jurusanDist.map((d, i) => {
                        const colors = ['emerald', 'indigo', 'amber', 'blue', 'purple', 'rose', 'cyan'];
                        const c = colors[i % colors.length];
                        return (
                          <div key={d.name}>
                            <div className="flex justify-between text-[13px] mb-2">
                              <span className="text-slate-600 font-semibold tracking-tight">{d.name}</span>
                              <span className={`text-${c}-600 font-extrabold`}>{d.pct}%</span>
                            </div>
                            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                              <div className={`h-full bg-${c}-500 rounded-full`} style={{ width: `${d.pct}%` }}></div>
                            </div>
                          </div>
                        );
                      }) : (
                        <p className="text-sm text-slate-400">Belum ada data.</p>
                      )}
                   </div>
               </div>
           </CardContent>
        </Card>
      </div>
    </div>
  );
}
