import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { databases, APPWRITE_DB_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';

export function ApprovalDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const role = location.pathname.split('/')[2];

  const [data, setData] = useState<any>(null);
  const [rabData, setRabData] = useState<any[]>([]);
  const [kakData, setKakData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [catatan, setCatatan] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;
        const kegiatan = await databases.getDocument(APPWRITE_DB_ID, 'kegiatan', id);
        setData(kegiatan);

        const kakList = await databases.listDocuments(APPWRITE_DB_ID, 'kak', [Query.equal('kegiatan_id', id)]);
        if (kakList.documents.length > 0) setKakData(kakList.documents[0]);

        const rabList = await databases.listDocuments(APPWRITE_DB_ID, 'rab', [Query.equal('kegiatan_id', id)]);
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
      await databases.updateDocument(APPWRITE_DB_ID, 'kegiatan', id, {
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
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
               </div>
               
               <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <Label className="text-slate-500 text-xs uppercase tracking-wider mb-2 block">Latar Belakang / KAK</Label>
                  <p className="text-sm text-slate-700 whitespace-pre-line">
                    {data.latar_belakang || kakData?.tujuan || 'Tidak ada latar belakang'}
                  </p>
               </div>

               <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-4">
                  <div className="flex flex-col">
                     <span className="text-slate-500 text-xs uppercase tracking-wider">Total Item Anggaran</span>
                     <span className="text-lg font-semibold text-slate-900 mt-1">{rabData.length} Item</span>
                  </div>
                  <div className="flex flex-col col-span-2">
                     <span className="text-slate-500 text-xs uppercase tracking-wider">Total Nilai Disetujui</span>
                     <span className="text-2xl font-bold text-blue-700 mt-1">Rp {totalRp.toLocaleString('id-ID')}</span>
                  </div>
               </div>
             </CardContent>
           </Card>

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
                    <Button disabled={isUpdating} onClick={() => updateStatus('ditolak_' + role)} variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 h-10">
                       {isUpdating ? <Loader2 className="size-4 mr-2 animate-spin" /> : <XCircle className="size-4 mr-2" />} Tolak
                    </Button>
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
