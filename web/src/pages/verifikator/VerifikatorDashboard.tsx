import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Search, Eye, Filter, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { databases, APPWRITE_DB_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';

export function VerifikatorDashboard() {
  const navigate = useNavigate();
  const [usulanList, setUsulanList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsulan = async () => {
      try {
        const res = await databases.listDocuments(APPWRITE_DB_ID, 'kegiatan', [
          Query.equal('status', ['draft', 'diajukan', 'diverifikasi', 'revisi', 'ditolak']),
          Query.orderDesc('$createdAt'),
          Query.limit(50)
        ]);
        setUsulanList(res?.documents || []);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsulan();
  }, []);

  const menunggu = usulanList.filter(u => u.status === 'draft' || u.status === 'diajukan');
  const diverifikasi = usulanList.filter(u => u.status === 'diverifikasi');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Workspace Verifikator</h2>
        <p className="text-slate-500">Tinjau dan verifikasi usulan masuk sebelum diteruskan ke PPK.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 rounded-full bg-amber-100 text-amber-600">
               <Clock className="size-6" />
            </div>
            <div>
               <p className="text-sm font-medium text-slate-500">Menunggu Verifikasi</p>
               <h3 className="text-2xl font-bold text-slate-900">{menunggu.length} Usulan</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-6 flex items-center space-x-4">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
               <CheckCircle className="size-6" />
            </div>
            <div>
               <p className="text-sm font-medium text-slate-500">Telah Diverifikasi</p>
               <h3 className="text-2xl font-bold text-slate-900">{diverifikasi.length} Usulan</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-4">
           <div className="flex flex-col sm:flex-row justify-between gap-4">
             <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                <Input placeholder="Cari berdasarkan ID atau nama..." className="pl-9 bg-white" />
             </div>
             <Button variant="outline" className="bg-white"><Filter className="size-4 mr-2" /> Filter</Button>
           </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>ID Usulan</TableHead>
                  <TableHead>Nama Kegiatan</TableHead>
                  <TableHead>Tgl Masuk</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Tindakan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                   <TableRow>
                     <TableCell colSpan={5} className="h-24 text-center">
                       <Loader2 className="size-6 animate-spin text-emerald-700 mx-auto" />
                     </TableCell>
                   </TableRow>
                ) : usulanList.length === 0 ? (
                   <TableRow>
                     <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                       Belum ada data usulan.
                     </TableCell>
                   </TableRow>
                ) : usulanList.map((task) => (
                  <TableRow key={task.$id} className="hover:bg-slate-50/50">
                    <TableCell className="font-medium text-xs">{task.$id.slice(-8).toUpperCase()}</TableCell>
                    <TableCell>{task.nama_kegiatan}</TableCell>
                    <TableCell className="text-slate-600">{new Date(task.$createdAt).toLocaleDateString('id-ID')}</TableCell>
                    <TableCell>
                      {task.status === 'diverifikasi' ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Telah Diverifikasi</Badge>
                      ) : task.status === 'revisi' ? (
                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Revisi</Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 capitalize">{task.status || 'Menunggu'}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                        onClick={() => navigate(`/dashboard/verifikator/usulan/${task.$id}`)}
                      >
                        <Eye className="size-4 mr-1.5" /> {(task.status === 'draft' || task.status === 'diajukan') ? 'Verifikasi' : 'Lihat'}
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
