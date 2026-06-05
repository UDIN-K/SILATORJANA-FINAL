import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { apiListKegiatan } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, DollarSign, FileCheck, CheckCircle2, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SpkDashboardWidget } from '@/components/spk/SpkDashboardWidget';


export function BendaharaDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'pencairan' | 'lpj'>('pencairan');
  
  const [usulanPencairan, setUsulanPencairan] = useState<any[]>([]);
  const [usulanLpj, setUsulanLpj] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiListKegiatan();
        const rawItems = Array.isArray(res) ? res : (res.data || []);
        
        // Filter for disbursement requests
        const pencairan = rawItems.filter((item: any) =>
          ['approved_wadir', 'accepted_funds', 'disetujui_rektorat'].includes(item.status?.toLowerCase())
        );

        // Filter for LPJ verification requests
        const lpj = rawItems.filter((item: any) =>
          ['lpj_submitted', 'lpj_revision'].includes(item.status?.toLowerCase())
        );

        setUsulanPencairan(pencairan);
        setUsulanLpj(lpj);
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
        <div className="space-y-1 sm:space-y-1.5">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard Bendahara</h2>
          <p className="text-slate-500 mt-1">Kelola Pencairan Dana dan Verifikasi LPJ.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-4">
         <Card className={`shadow-sm cursor-pointer hover:shadow-md transition-shadow border-slate-200/60 rounded-2xl group ${activeTab === 'pencairan' ? 'ring-2 ring-blue-500' : ''}`} onClick={() => setActiveTab('pencairan')}>
           <CardContent className="p-4 flex items-center gap-4">
               <DollarSign className={`size-8 sm:size-10 transition-transform group-hover:scale-110 ${activeTab === 'pencairan' ? 'text-blue-500' : 'text-slate-400'}`} />
               <div>
                 <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800 leading-none mb-1">{usulanPencairan.length}</h3>
                 <p className="text-xs sm:text-sm text-slate-500 font-medium">Tindakan Bendahara (Pencairan/LPJ)</p>
               </div>
           </CardContent>
         </Card>
         <Card className={`shadow-sm cursor-pointer hover:shadow-md transition-shadow border-slate-200/60 rounded-2xl group ${activeTab === 'lpj' ? 'ring-2 ring-emerald-500' : ''}`} onClick={() => setActiveTab('lpj')}>
           <CardContent className="p-4 flex items-center gap-4">
               <FileCheck className={`size-8 sm:size-10 transition-transform group-hover:scale-110 ${activeTab === 'lpj' ? 'text-emerald-500' : 'text-slate-400'}`} />
               <div>
                 <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800 leading-none mb-1">{usulanLpj.length}</h3>
                 <p className="text-xs sm:text-sm text-slate-500 font-medium">Menunggu Pengusul (Submit LPJ)</p>
               </div>
           </CardContent>
         </Card>
      </div>

      {/* SPK MOORA Quality Analysis Widget */}
      <SpkDashboardWidget />

      <Card className="shadow-lg border-white/50 bg-white/80 backdrop-blur-xl rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-white/50 p-4 sm:p-6 bg-white/40">
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
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="px-6 py-4 border-r border-slate-100">
                       <span className="font-mono text-xs text-slate-500">{String(item.id).padStart(6, '0')}</span>
                    </td>
                    <td className="px-6 py-4">
                       <p className="font-semibold text-slate-900">{item.nama_kegiatan}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {new Date(item.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-center">
                       <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${activeTab === 'pencairan' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                         {activeTab === 'pencairan' ? 'Menunggu Tindakan' : 'Menunggu Pengusul'}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <Button size="sm" onClick={() => navigate(activeTab === 'pencairan' ? `/dashboard/bendahara/detail/${item.id}` : `/dashboard/bendahara/lpj/${item.id}`)} className={activeTab === 'pencairan' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'}>
                          <CheckCircle2 className="size-4 mr-2" />
                          {activeTab === 'pencairan' ? 'Proses Sekarang' : 'Verifikasi LPJ'}
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
