import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { apiGetKegiatan, apiUpdateKegiatan } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, XCircle, Loader2, Info, FileText, DollarSign, Target } from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';

export function ApprovalDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const role = location.pathname.split('/')[2];

  const [data, setData] = useState<any>(null);
  const [rabData, setRabData] = useState<any[]>([]);
  const [ikuData, setIkuData] = useState<any[]>([]);
  const [kakData, setKakData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [catatan, setCatatan] = useState('');
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;
        const kegiatan = await apiGetKegiatan(id);
        setData(kegiatan);

        const kakList = await apiGetKegiatan(id).then((r: any) => ({documents: r.kak ? [r.kak] : []}));
        if (kakList.documents.length > 0) setKakData(kakList.documents[0]);

        const ikuList = await apiGetKegiatan(id).then((r: any) => ({documents: r.iku || []}));
        setIkuData(ikuList.documents);

        const rabList = await apiGetKegiatan(id).then((r: any) => ({documents: r.rab || []}));
        setRabData(rabList.documents);

      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const updateStatus = async (status: string) => {
    if (!id) return;
    setIsUpdating(true);
    try {
      await apiUpdateKegiatan(id, {
        status: status,
      });
      navigate(`/dashboard/${role}`);
    } catch (error: any) {
      alert("Failed updating: " + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const getApproveStatusAction = () => {
    if (role === 'ppk') return 'disetujui_ppk';
    if (role === 'wadir') return 'disetujui_wadir';
    if (role === 'rektorat') return 'disetujui_rektorat';
    return 'disetujui';
  };

  if (isLoading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto size-8 text-blue-600" /></div>;
  if (!data) return <div className="p-8 text-center text-red-500">Data tidak ditemukan</div>;

  const totalRp = rabData.reduce((acc, curr) => acc + (curr.volume * curr.harga_satuan), 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/dashboard/${role}`)}>
          <ArrowLeft className="size-5 text-slate-500" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Persetujuan Usulan: {id?.slice(-8).toUpperCase()}</h2>
          <p className="text-slate-500">Periksa detail sebelum memberikan keputusan final.</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200 mb-6">
        {[
            { id: 'info', label: 'Info Usulan', icon: Info },
            { id: 'kak', label: 'Latar Belakang / KAK', icon: FileText },
            { id: 'rab', label: 'Rincian RAB', icon: DollarSign },
            { id: 'iku', label: 'IKU', icon: Target },
          ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium transition-colors ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
           {activeTab === 'info' && (
             <Card className="shadow-sm border-slate-200">
               <CardHeader className="border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
                 <CardTitle className="text-lg">Ringkasan Kegiatan</CardTitle>
                 <Badge className="bg-green-100 text-green-700 capitalize">{data.status.replace(/_/g, ' ')}</Badge>
               </CardHeader>
               <CardContent className="p-6 space-y-4">
                 <div>
                   <h3 className="text-xl font-bold text-slate-900">{data.nama_kegiatan}</h3>
                   <p className="text-sm text-slate-500 mt-1">Status saat ini: {data.status}</p>
                   {data.tgl_kegiatan && <p className="text-sm text-slate-500 mt-1">Tanggal: {new Date(data.tgl_kegiatan).toLocaleDateString('id-ID')}</p>}
                   {data.kode_mak && (
                     <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                       <div>
                         <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Kode MAK (Mata Anggaran Kegiatan)</p>
                         <p className="text-xl font-black text-emerald-800 tracking-tight">{data.kode_mak}</p>
                       </div>
                     </div>
                   )}
                 </div>
               </CardContent>
             </Card>
           )}

           {activeTab === 'kak' && (
             <Card className="shadow-sm border-slate-200">
                <CardContent className="p-6 space-y-4">
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <Label className="text-slate-500 text-xs uppercase tracking-wider mb-2 block">Latar Belakang / KAK</Label>
                      <p className="text-sm text-slate-700 whitespace-pre-line">
                        {data.latar_belakang || kakData?.tujuan || 'Tidak ada latar belakang'}
                      </p>
                  </div>
                  {data.surat_pengantar_path && (
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <Label className="text-slate-500 text-xs uppercase tracking-wider mb-2 block flex justify-between">
                        <span>Surat Pengantar</span>
                        <a href={`http://localhost:8000/${data.surat_pengantar_path}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                            Buka di Tab Baru
                        </a>
                      </Label>
                      
                      {data.surat_pengantar_path.toLowerCase().endsWith('.pdf') ? (
                        <div className="mt-3 border rounded-md overflow-hidden h-[500px] bg-white">
                            <iframe 
                              src={`http://localhost:8000/${data.surat_pengantar_path}`} 
                              className="w-full h-full" 
                              title="Preview Surat Pengantar"
                            />
                        </div>
                      ) : (
                        <a href={`http://localhost:8000/${data.surat_pengantar_path}`} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-2 mt-2">
                          {data.surat_pengantar_filename || 'Unduh Dokumen Surat Pengantar'}
                        </a>
                      )}
                    </div>
                  )}
                </CardContent>
             </Card>
           )}

           {activeTab === 'iku' && (
            <div className="space-y-6 animate-in fade-in duration-300">
               <CardTitle className="text-base text-slate-800 flex items-center gap-2.5"><Target className="size-5 text-teal-500"/> Katalog Indikator Kinerja Utama (IKU)</CardTitle>
                {ikuData.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {ikuData.map((iku, idx) => (
                      <div key={idx} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-teal-300/50 transition-colors group">
                        <div className="mb-4">
                           <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center mb-3">
                              <Target className="size-4 text-teal-600" />
                           </div>
                           <p className="font-bold text-[14px] sm:text-[15px] text-slate-800 leading-snug group-hover:text-teal-800 transition-colors">{iku.nama_iku || iku.indikator || 'Entri IKU Tanpa Nama'}</p>
                           {iku.master_id && <p className="text-[10px] font-bold text-slate-400 mt-2 tracking-wider uppercase">Master Ref ID: <span className="text-slate-500">{iku.master_id}</span></p>}
                        </div>
                        {iku.target_persen != null && (
                          <div className="pt-3 border-t border-slate-100/80 flex items-end justify-between">
                            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Pencapaian Target</p>
                            <p className="text-xl sm:text-2xl font-black text-teal-600">{iku.target_persen}%</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                   <div className="py-20 flex flex-col items-center justify-center text-center px-4">
                      <div className="w-16 h-16 mb-4 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                         <Target className="size-8 text-slate-300" />
                      </div>
                      <p className="text-slate-500 font-medium">Belum ada IKU yang ditambahkan.</p>
                      <p className="text-sm text-slate-400 mt-1 max-w-sm">Pengusul belum memilih indikator IKU untuk usulan ini.</p>
                   </div>
                )}
            </div>
           )}

           {activeTab === 'rab' && (
             <Card className="shadow-sm border-slate-200">
               <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                 <CardTitle className="text-lg">Daftar RAB</CardTitle>
               </CardHeader>
               <CardContent className="p-0">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                        <tr>
                          <th className="px-4 py-3 font-medium">Uraian</th>
                          <th className="px-4 py-3 font-medium text-center">Vol</th>
                          <th className="px-4 py-3 font-medium text-right">Harga Satuan</th>
                          <th className="px-4 py-3 font-medium text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rabData.map((item, idx) => (
                          <tr key={idx} className="border-b border-slate-100 bg-white">
                            <td className="px-4 py-3 text-slate-900 font-medium">{item.uraian}</td>
                            <td className="px-4 py-3 text-center text-slate-600">{item.volume}</td>
                            <td className="px-4 py-3 text-right text-slate-600">Rp {item.harga_satuan.toLocaleString('id-ID')}</td>
                            <td className="px-4 py-3 text-right text-slate-900">Rp {(item.volume * item.harga_satuan).toLocaleString('id-ID')}</td>
                          </tr>
                        ))}
                        {rabData.length === 0 && (
                          <tr><td colSpan={4} className="text-center py-4 text-slate-500">Tidak ada item RAB.</td></tr>
                        )}
                      </tbody>
                  </table>
               </CardContent>
             </Card>
           )}
        </div>

        <div className="space-y-6">
           <Card className="shadow-sm border-slate-200 sticky top-20">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                 <CardTitle className="text-lg">Aksi Persetujuan</CardTitle>
                 <CardDescription>Berikan tindakan pada usulan ini</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4 pt-6">
                 <div className="space-y-2">
                    <Label htmlFor="catatan">Catatan / Keterangan</Label>
                    <textarea 
                      id="catatan"
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      className="flex min-h-[100px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600"
                      placeholder="Masukkan alasan jika ditolak, atau pesan persetujuan..."
                    />
                 </div>
                 
                 <div className="flex flex-col gap-2 pt-2">
                    <Button disabled={isUpdating} onClick={() => updateStatus(getApproveStatusAction())} className="w-full bg-emerald-700 hover:bg-emerald-800 h-10">
                       {isUpdating ? <Loader2 className="size-4 mr-2 animate-spin" /> : <CheckCircle className="size-4 mr-2" />} Setujui Usulan
                    </Button>
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
