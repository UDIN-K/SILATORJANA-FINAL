import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, CheckCircle, AlertTriangle, ArrowUpRight, Clock, Database, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useState, useEffect } from 'react';
import { databases, APPWRITE_DB_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';

export function AdminDashboard() {
  const [usulanList, setUsulanList] = useState<any[]>([]);
  const [counts, setCounts] = useState({
    total: 0,
    menunggu: 0,
    disetujui: 0,
    ditolak: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsulan = async () => {
      try {
        const res = await databases.listDocuments(APPWRITE_DB_ID, 'kegiatan', [
          Query.orderDesc('$createdAt'),
          Query.limit(50)
        ]);

        const allDocs = res?.documents || [];
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
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsulan();
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard Administrator</h2>
          <p className="text-slate-500">Ringkasan aktivitas dan metrik sistem Si-LATORJANA.</p>
        </div>
      </div>

      {/* Stats Pipeline */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="shadow-sm border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                <div className={`p-2 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`size-4 ${stat.color}`} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold tracking-tight text-slate-900">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm border-slate-200">
          <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-lg">Usulan Terkini</CardTitle>
            <CardDescription>Daftar usulan terbaru yang masuk ke dalam sistem.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
             <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50">
                      <TableHead className="px-5 py-3 font-medium text-slate-600">ID Usulan</TableHead>
                      <TableHead className="px-5 py-3 font-medium text-slate-600">Judul Kegiatan</TableHead>
                      <TableHead className="px-5 py-3 font-medium text-slate-600">Tanggal</TableHead>
                      <TableHead className="px-5 py-3 font-medium text-slate-600">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usulanList.slice(0, 10).map((usulan) => (
                      <TableRow key={usulan.$id} className="hover:bg-slate-50/80 transition-colors">
                        <TableCell className="px-5 py-3 font-mono text-xs text-slate-500">{usulan.$id.slice(-8).toUpperCase()}</TableCell>
                        <TableCell className="px-5 py-3 font-medium text-slate-900">{usulan.nama_kegiatan}</TableCell>
                        <TableCell className="px-5 py-3 text-slate-500 text-sm">{new Date(usulan.$createdAt).toLocaleDateString('id-ID')}</TableCell>
                        <TableCell className="px-5 py-3">{getStatusBadge(usulan.status)}</TableCell>
                      </TableRow>
                    ))}
                    {usulanList.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-slate-500">Tidak ada usulan.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
             </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
           <CardHeader className="p-5 border-b border-slate-100 bg-slate-50/50">
             <CardTitle className="text-lg">Kesehatan Sistem</CardTitle>
             <CardDescription>Status layanan inti aplikasi</CardDescription>
           </CardHeader>
           <CardContent className="p-5 space-y-6">
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="p-2 rounded-lg bg-green-100 text-green-700">
                          <Database className="size-4" />
                       </div>
                       <div>
                          <p className="font-medium text-slate-900 text-sm">Appwrite Database</p>
                          <p className="text-xs text-slate-500">Koneksi Stabil</p>
                       </div>
                    </div>
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Online</Badge>
                 </div>
                 
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="p-2 rounded-lg bg-green-100 text-green-700">
                          <Users className="size-4" />
                       </div>
                       <div>
                          <p className="font-medium text-slate-900 text-sm">Authentication</p>
                          <p className="text-xs text-slate-500">Sessions Aktif</p>
                       </div>
                    </div>
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Online</Badge>
                 </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">Distribusi Usulan per Unit</h4>
                  <div className="space-y-3">
                     <div>
                        <div className="flex justify-between text-xs mb-1.5">
                           <span className="text-slate-600 font-medium">BEM & Kemahasiswaan</span>
                           <span className="text-slate-900 font-bold">45%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                           <div className="h-full bg-emerald-700 rounded-full" style={{ width: '45%' }}></div>
                        </div>
                     </div>
                     <div>
                        <div className="flex justify-between text-xs mb-1.5">
                           <span className="text-slate-600 font-medium">Fakultas / Prodi</span>
                           <span className="text-slate-900 font-bold">35%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                           <div className="h-full bg-indigo-500 rounded-full" style={{ width: '35%' }}></div>
                        </div>
                     </div>
                     <div>
                        <div className="flex justify-between text-xs mb-1.5">
                           <span className="text-slate-600 font-medium">Lembaga / Pusat Studi</span>
                           <span className="text-slate-900 font-bold">20%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                           <div className="h-full bg-amber-500 rounded-full" style={{ width: '20%' }}></div>
                        </div>
                     </div>
                  </div>
              </div>
           </CardContent>
        </Card>
      </div>
    </div>
  );
}
