import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Eye, Filter, CheckCircle2, ShieldAlert, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { databases, APPWRITE_DB_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';

export function ApprovalDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = location.pathname.split('/')[2] || 'Pimpinan';

  const titleMap: Record<string, string> = {
    ppk: 'Pejabat Pembuat Komitmen (PPK)',
    wadir: 'Wakil Direktur',
    rektorat: 'Rektorat',
    bendahara: 'Bendahara'
  };

  const roleTitle = titleMap[role] || role;

  const [usulanList, setUsulanList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsulan = async () => {
      try {
        let targetStatuses: string[] = [];
        if (role === 'ppk') targetStatuses = ['diverifikasi', 'disetujui_ppk', 'ditolak_ppk'];
        if (role === 'wadir') targetStatuses = ['disetujui_ppk', 'disetujui_wadir', 'ditolak_wadir'];
        if (role === 'rektorat') targetStatuses = ['disetujui_wadir', 'disetujui_rektorat', 'ditolak_rektorat'];

        const queries = [
          Query.orderDesc('$createdAt'),
          Query.limit(50)
        ];

        if (targetStatuses.length > 0) {
          queries.push(Query.equal('status', targetStatuses));
        }

        const res = await databases.listDocuments(APPWRITE_DB_ID, 'kegiatan', queries);
        
        setUsulanList(res?.documents || []);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsulan();
  }, [role]);

  const menunggu = usulanList.filter(u => {
    if (role === 'ppk') return u.status === 'diverifikasi';
    if (role === 'wadir') return u.status === 'disetujui_ppk';
    if (role === 'rektorat') return u.status === 'disetujui_wadir';
    if (role === 'bendahara') return u.status === 'disetujui_rektorat';
    return false;
  });

  const disetujui = usulanList.filter(u => {
    if (role === 'ppk') return u.status && u.status.includes('disetujui_ppk');
    if (role === 'wadir') return u.status && u.status.includes('disetujui_wadir');
    if (role === 'rektorat') return u.status && u.status.includes('disetujui_rektorat');
    return false;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 capitalize">Dashboard {roleTitle}</h2>
        <p className="text-slate-500">Tinjau dan putuskan usulan yang memerlukan pengesahan Anda.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
               <ShieldAlert className="size-6" />
            </div>
            <div>
               <p className="text-sm font-medium text-slate-500">Memerlukan Persetujuan</p>
               <h3 className="text-2xl font-bold text-slate-900">{menunggu.length} Usulan</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
               <CheckCircle2 className="size-6" />
            </div>
            <div>
               <p className="text-sm font-medium text-slate-500">Telah Disetujui</p>
               <h3 className="text-2xl font-bold text-slate-900">{disetujui.length} Usulan</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-4">
           <div className="flex flex-col sm:flex-row justify-between gap-4">
             <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                <Input placeholder="Cari usulan..." className="pl-9 bg-white" />
             </div>
             <Button variant="outline" className="bg-white"><Filter className="size-4 mr-2" /> Filter</Button>
           </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>No. Dokumen</TableHead>
                  <TableHead>Uraian Kegiatan</TableHead>
                  <TableHead>Tgl Masuk</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                     <TableCell colSpan={5} className="h-24 text-center">
                       <Loader2 className="size-6 animate-spin text-blue-600 mx-auto" />
                     </TableCell>
                  </TableRow>
                ) : usulanList.length === 0 ? (
                  <TableRow>
                     <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                       Belum ada usulan.
                     </TableCell>
                  </TableRow>
                ) : usulanList.map((item) => {
                  let isWaiting = false;
                  if (role === 'ppk' && item.status === 'diverifikasi') isWaiting = true;
                  if (role === 'wadir' && item.status === 'disetujui_ppk') isWaiting = true;
                  if (role === 'rektorat' && item.status === 'disetujui_wadir') isWaiting = true;

                  return (
                  <TableRow key={item.$id} className="hover:bg-slate-50/50">
                    <TableCell className="font-medium text-xs">{item.$id.slice(-8).toUpperCase()}</TableCell>
                    <TableCell>{item.nama_kegiatan}</TableCell>
                    <TableCell className="text-slate-600">{new Date(item.$createdAt).toLocaleDateString('id-ID')}</TableCell>
                    <TableCell>
                      {isWaiting ? (
                         <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 capitalize">Menunggu {roleTitle}</Badge>
                      ) : (
                         <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 capitalize">{item.status?.replace(/_/g, ' ') || 'Draft'}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        onClick={() => navigate(`/dashboard/${role}/usulan/${item.$id}`)}
                      >
                        <Eye className="size-4 mr-1.5" /> {isWaiting ? 'Proses' : 'Detail'}
                      </Button>
                    </TableCell>
                  </TableRow>
                )})}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
