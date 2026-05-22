import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, DollarSign, FileCheck, CheckCircle2, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { databases, APPWRITE_DB_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';

export function BendaharaDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'pencairan' | 'lpj'>('pencairan');
  
  const [usulanPencairan, setUsulanPencairan] = useState<any[]>([]);
  const [usulanLpj, setUsulanLpj] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resPencairan = await databases.listDocuments(APPWRITE_DB_ID, 'kegiatan', [
          Query.equal('status', 'disetujui_rektorat'),
          Query.orderDesc('$createdAt'),
          Query.limit(20)
        ]);

        const resLpj = await databases.listDocuments(APPWRITE_DB_ID, 'kegiatan', [
          Query.equal('status', 'menunggu_lpj'), // or some other status
          Query.orderDesc('$createdAt'),
          Query.limit(20)
        ]);

        setUsulanPencairan(resPencairan.documents);
        setUsulanLpj(resLpj.documents);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const dataToDisplay = activeTab === 'pencairan' ? usulanPencairan : usulanLpj;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard Bendahara</h2>
          <p className="text-slate-500">Kelola Pencairan Dana dan Verifikasi LPJ.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <Card className={`cursor-pointer transition-all border-2 ${activeTab === 'pencairan' ? 'border-blue-600 shadow-md' : 'border-transparent hover:border-slate-200'}`} onClick={() => setActiveTab('pencairan')}>
           <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-3 rounded-full ${activeTab === 'pencairan' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                 <DollarSign className="size-6" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Permintaan Pencairan</h3>
                <p className="text-sm text-slate-500">{usulanPencairan.length} Dokumen menunggu dicairkan</p>
              </div>
           </CardContent>
         </Card>
         <Card className={`cursor-pointer transition-all border-2 ${activeTab === 'lpj' ? 'border-emerald-600 shadow-md' : 'border-transparent hover:border-slate-200'}`} onClick={() => setActiveTab('lpj')}>
           <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-3 rounded-full ${activeTab === 'lpj' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                 <FileCheck className="size-6" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Verifikasi LPJ</h3>
                <p className="text-sm text-slate-500">{usulanLpj.length} LPJ menunggu verifikasi</p>
              </div>
           </CardContent>
         </Card>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-lg">Daftar {activeTab === 'pencairan' ? 'Pencairan Dana' : 'Verifikasi LPJ'}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
               <div className="relative">
                 <Search className="absolute left-2.5 top-2.5 size-4 text-slate-400" />
                 <Input className="pl-9 h-9 text-sm w-[200px]" placeholder="Cari kegiatan..." />
               </div>
               <Button variant="outline" size="sm" className="h-9"><Filter className="size-4" /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-600">
                <tr>
                  <th className="px-6 py-4 font-medium border-r border-slate-100">ID</th>
                  <th className="px-6 py-4 font-medium">Kegiatan</th>
                  <th className="px-6 py-4 font-medium">Tgl Usulan</th>
                  <th className="px-6 py-4 font-medium text-center">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      <Loader2 className="animate-spin text-blue-600 mx-auto size-6" />
                    </td>
                  </tr>
                ) : dataToDisplay.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Tidak ada data.</td>
                  </tr>
                ) : dataToDisplay.map((item) => (
                  <tr key={item.$id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="px-6 py-4 border-r border-slate-100">
                       <span className="font-mono text-xs text-slate-500">{item.$id.slice(-6).toUpperCase()}</span>
                    </td>
                    <td className="px-6 py-4">
                       <p className="font-semibold text-slate-900">{item.nama_kegiatan}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {new Date(item.$createdAt).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-center">
                       <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${activeTab === 'pencairan' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                         {activeTab === 'pencairan' ? 'Menunggu Pencairan' : 'Menunggu LPJ'}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <Button size="sm" onClick={() => navigate(`/dashboard/bendahara/detail/${item.$id}`)} className={activeTab === 'pencairan' ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-emerald-600 hover:bg-emerald-700'}>
                          <CheckCircle2 className="size-4 mr-2" />
                          {activeTab === 'pencairan' ? 'Proses Pencairan' : 'Periksa LPJ'}
                       </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
