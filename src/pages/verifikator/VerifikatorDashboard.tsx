import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiListKegiatan } from '@/lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Search, Eye, Filter, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export function VerifikatorDashboard() {
  const navigate = useNavigate();
  const [usulanList, setUsulanList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsulan = async () => {
      try {
        const res = await apiListKegiatan();
        const docs = res.data || res || [];
        setUsulanList(Array.isArray(docs) ? docs : []);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsulan();
  }, []);

  const menunggu = usulanList.filter(u => ['submitted', 'revisi_done'].includes(u.status?.toLowerCase()));
  const diverifikasi = usulanList.filter(u => ['verified', 'diverifikasi', 'pending_ppk', 'approved_ppk', 'approved_wadir', 'accepted_funds', 'funds_disbursed', 'completed', 'lpj_done'].includes(u.status?.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="space-y-1 sm:space-y-1.5">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Workspace Verifikator</h2>
        <p className="text-slate-500 mt-1">Tinjau dan verifikasi usulan masuk sebelum diteruskan ke PPK.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Card className="shadow-sm hover:shadow-md transition-shadow border-slate-200/60 rounded-2xl cursor-default group">
          <CardContent className="p-4 flex items-center gap-4">
            <Clock className="size-8 sm:size-10 text-amber-500 transition-transform group-hover:scale-110" />
            <div>
               <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800 leading-none mb-1">{menunggu.length}</h3>
               <p className="text-xs sm:text-sm text-slate-500 font-medium">Menunggu Verifikasi</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-shadow border-slate-200/60 rounded-2xl cursor-default group">
          <CardContent className="p-4 flex items-center gap-4">
            <CheckCircle className="size-8 sm:size-10 text-emerald-500 transition-transform group-hover:scale-110" />
            <div>
               <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800 leading-none mb-1">{diverifikasi.length}</h3>
               <p className="text-xs sm:text-sm text-slate-500 font-medium">Telah Diverifikasi</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg border-white/50 bg-white/80 backdrop-blur-xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-white/40 border-b border-white/50 p-4">
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
                  <TableRow key={task.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-medium text-xs">{String(task.id).padStart(8, '0')}</TableCell>
                    <TableCell>{task.nama_kegiatan}</TableCell>
                    <TableCell className="text-slate-600">{new Date(task.created_at).toLocaleDateString('id-ID')}</TableCell>
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
                        onClick={() => navigate(`/dashboard/verifikator/usulan/${task.id}`)}
                      >
                        <Eye className="size-4 mr-1.5" /> {['submitted', 'revisi_done'].includes(task.status?.toLowerCase()) ? 'Verifikasi' : 'Lihat'}
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
