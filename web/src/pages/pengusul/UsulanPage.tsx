import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Search, Eye, Edit, Trash2, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/StatusBadge';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { account, databases, APPWRITE_DB_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';

export function UsulanPage() {
  const navigate = useNavigate();
  const [usulanList, setUsulanList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsulan = async () => {
      try {
        let userId: number | string = 1;
        try {
           const userStr = localStorage.getItem('currentUser');
           if (userStr) {
             const user = JSON.parse(userStr);
             userId = parseInt(user.$id || user.user_id || '1', 10);
           }
        } catch(e) {
           console.log('Error reading auth session from localStorage', e);
        }
        const res = await databases.listDocuments(APPWRITE_DB_ID, 'kegiatan', [
          Query.equal('pengusul_id', userId),
          Query.orderDesc('$createdAt')
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

  /* StatusBadge used instead of getStatusBadge */

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Daftar Usulan Kegiatan</h2>
          <p className="text-slate-500">Kelola dan pantau seluruh usulan yang Anda ajukan.</p>
        </div>
        <Button onClick={() => navigate('/dashboard/pengusul/usulan/baru')} className="bg-emerald-700 hover:bg-emerald-800">
          <Plus className="size-4 mr-2" /> Buat Usulan Baru
        </Button>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
             <div className="relative w-full sm:w-80">
               <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
               <Input placeholder="Cari ID atau nama kegiatan..." className="pl-9 bg-white border-slate-200" />
             </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80">
                <TableHead className="px-6 py-4 text-slate-600 font-semibold">ID Usulan</TableHead>
                <TableHead className="px-6 py-4 text-slate-600 font-semibold">Nama Kegiatan</TableHead>
                <TableHead className="px-6 py-4 text-slate-600 font-semibold">Tanggal</TableHead>
                <TableHead className="px-6 py-4 text-slate-600 font-semibold">Status</TableHead>
                <TableHead className="px-6 py-4 text-slate-600 font-semibold text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center"><Loader2 className="animate-spin text-blue-600 mx-auto" /></TableCell>
                </TableRow>
              ) : usulanList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-slate-500">Belum ada usulan.</TableCell>
                </TableRow>
              ) : usulanList.map((item) => (
                <TableRow key={item.$id} className="hover:bg-slate-50/50">
                  <TableCell className="px-6 py-4 font-mono text-sm text-slate-600">{item.$id.slice(-8).toUpperCase()}</TableCell>
                  <TableCell className="px-6 py-4 font-medium text-slate-900">{item.nama_kegiatan}</TableCell>
                  <TableCell className="px-6 py-4 text-slate-600">{new Date(item.$createdAt).toLocaleDateString('id-ID')}</TableCell>
                  <TableCell className="px-6 py-4"><StatusBadge status={item.status} /></TableCell>
                  <TableCell className="px-6 py-4 text-right space-x-2">
                    <Button variant="outline" size="icon" className="h-8 w-8 text-emerald-700 border-emerald-200 hover:bg-emerald-50" onClick={() => navigate(`/dashboard/pengusul/usulan/${item.$id}`)}>
                       <Eye className="size-4" />
                    </Button>
                    <Button disabled={!(item.status === 'draft' || item.status === 'revisi')} variant="outline" size="icon" className="h-8 w-8 text-amber-600 border-amber-200 hover:bg-amber-50">
                       <Edit className="size-4" />
                    </Button>
                    <Button disabled={!(item.status === 'draft' || item.status === 'revisi')} variant="outline" size="icon" className="h-8 w-8 text-red-600 border-red-200 hover:bg-red-50">
                       <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
