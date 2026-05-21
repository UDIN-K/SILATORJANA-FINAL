import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, X, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { databases, APPWRITE_DB_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';

export function VerifikasiDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [activeTab, setActiveTab] = useState<'info'|'kak'|'rab'|'iku'>('info');
  const [data, setData] = useState<any>(null);
  const [rabData, setRabData] = useState<any[]>([]);
  const [kakData, setKakData] = useState<any>(null);
  const [ikuData, setIkuData] = useState<any>(null);
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

        const ikuList = await databases.listDocuments(APPWRITE_DB_ID, 'iku', [Query.equal('kegiatan_id', id)]);
        if (ikuList.documents.length > 0) setIkuData(ikuList.documents[0]);

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

      // Update MAK codes if verified
      if (status === 'diverifikasi') {
        await Promise.all(rabData.map((rab) => 
          databases.updateDocument(APPWRITE_DB_ID, 'rab', rab.$id, {
            kode_mak: rab.kode_mak || '',
          })
        ));
      }

      // Normally we would also save the catatan/history to a status_history collection
      navigate('/dashboard/verifikator');
    } catch (error: any) {
      alert("Failed updating: " + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto size-8 text-emerald-700" /></div>;
  if (!data) return <div className="p-8 text-center text-red-500">Data tidak ditemukan</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/verifikator')}>
          <ArrowLeft className="size-5 text-slate-500" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Verifikasi Usulan: {id?.slice(-8).toUpperCase()}</h2>
          <p className="text-slate-500">Tinjau Detail KAK, RAB, dan IKU secara teliti.</p>
        </div>
      </div>
      
      <div className="flex bg-white rounded-lg border border-slate-200 p-1.5 gap-1 overflow-x-auto shadow-sm">
        {[
          { id: 'info', label: 'Info Utama' },
          { id: 'kak', label: 'Tinjauan KAK' },
          { id: 'rab', label: 'Tinjauan RAB & MAK' },
          { id: 'iku', label: 'Tinjauan IKU' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap text-center ${
              activeTab === tab.id 
                ? 'bg-emerald-700 text-white shadow' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Detail Content Tab */}
        <div className="md:col-span-2 space-y-6">
          
          {activeTab === 'info' && (
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-lg">Informasi Kegiatan</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                      <Label className="text-slate-500 text-xs uppercase tracking-wider">Nama Kegiatan</Label>
                      <p className="font-medium text-slate-900 mt-1">{data.nama_kegiatan}</p>
                  </div>
                  <div>
                      <Label className="text-slate-500 text-xs uppercase tracking-wider">Kategori</Label>
                      <p className="font-medium text-slate-900 mt-1">{data.kategori || '-'}</p>
                  </div>
                  <div>
                      <Label className="text-slate-500 text-xs uppercase tracking-wider">Status</Label>
                      <p className="font-medium text-slate-900 mt-1 capitalize">{data.status || 'Draft'}</p>
                  </div>
                  <div>
                      <Label className="text-slate-500 text-xs uppercase tracking-wider">Tgl Pelaksanaan</Label>
                      <p className="font-medium text-slate-900 mt-1">{new Date(data.tgl_kegiatan).toLocaleDateString('id-ID')}</p>
                  </div>
                </div>
                {data.latar_belakang && (
                  <div className="pt-4 border-t border-slate-100">
                     <Label className="text-slate-500 text-xs uppercase tracking-wider">Latar Belakang</Label>
                     <p className="text-sm text-slate-700 mt-1 leading-relaxed">
                       {data.latar_belakang}
                     </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'kak' && (
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-lg">Kerangka Acuan Kerja (KAK)</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <Label className="text-slate-500 text-xs uppercase tracking-wider">Tujuan</Label>
                  <p className="text-sm text-slate-700 mt-1 leading-relaxed bg-slate-50 p-3 rounded border border-slate-100">
                    {kakData?.tujuan || 'Tidak ada data tujuan'}
                  </p>
                </div>
                <div>
                  <Label className="text-slate-500 text-xs uppercase tracking-wider">Sasaran</Label>
                  <p className="text-sm text-slate-700 mt-1 leading-relaxed bg-slate-50 p-3 rounded border border-slate-100">
                    {kakData?.sasaran || 'Tidak ada data sasaran'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'rab' && (
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Rincian Anggaran (RAB)</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                      <thead className="bg-white border-b border-slate-200 text-slate-500">
                        <tr>
                          <th className="px-4 py-3 font-medium">Item</th>
                          <th className="px-4 py-3 font-medium text-center">Vol</th>
                          <th className="px-4 py-3 font-medium text-right">Harga Satuan</th>
                          <th className="px-4 py-3 font-medium text-right">Total</th>
                          <th className="px-4 py-3 font-medium">Kode MAK</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rabData.map((item, idx) => (
                          <tr key={idx} className="border-b border-slate-100 bg-white">
                            <td className="px-4 py-3 text-slate-900">{item.uraian}</td>
                            <td className="px-4 py-3 text-center text-slate-600">{item.volume}</td>
                            <td className="px-4 py-3 text-right text-slate-600">Rp {item.harga_satuan.toLocaleString('id-ID')}</td>
                            <td className="px-4 py-3 text-right font-medium text-slate-900">Rp {(item.volume * item.harga_satuan).toLocaleString('id-ID')}</td>
                            <td className="px-4 py-3">
                               <input 
                                 type="text" 
                                 value={item.kode_mak || ''}
                                 onChange={(e) => {
                                   const newRab = [...rabData];
                                   newRab[idx].kode_mak = e.target.value;
                                   setRabData(newRab);
                                 }}
                                 className="w-full border border-slate-200 rounded px-2 py-1 text-xs" 
                                 placeholder="Input MAK" 
                               />
                            </td>
                          </tr>
                        ))}
                        {rabData.length === 0 && (
                          <tr><td colSpan={5} className="text-center py-4 text-slate-500">Tidak ada data RAB.</td></tr>
                        )}
                        <tr className="bg-slate-50">
                          <td colSpan={3} className="px-4 py-3 font-semibold text-right text-slate-700">Nominal Pengajuan</td>
                          <td className="px-4 py-3 font-bold text-right text-blue-700">Rp {rabData.reduce((acc, curr) => acc + (curr.volume * curr.harga_satuan), 0).toLocaleString('id-ID')}</td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'iku' && (
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-lg">Indikator Kinerja Utama (IKU)</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {ikuData ? (
                 <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <Label className="text-slate-500 text-xs uppercase tracking-wider block mb-2">IKU yang Dipilih</Label>
                    <p className="font-semibold text-slate-900 capitalize">{ikuData.nama_iku?.replace(/_/g, ' ') || 'IKU Data'}</p>
                    <div className="mt-4 flex flex-col gap-1">
                      <Label className="text-slate-500 text-xs uppercase tracking-wider">Target Capaian</Label>
                      <p className="text-slate-700 font-medium">{ikuData.target_persen}%</p>
                    </div>
                 </div>
                ) : (
                  <p className="text-slate-500 text-sm">Tidak ada data IKU.</p>
                )}
              </CardContent>
            </Card>
          )}

        </div>

        {/* Panel Aksi */}
        <div className="space-y-6">
           <Card className="shadow-sm border-slate-200 sticky top-20">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                 <CardTitle className="text-lg">Keputusan Verifikasi</CardTitle>
                 <CardDescription>Berikan tindakan pada usulan ini</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4 pt-6">
                 <div className="space-y-2">
                    <Label htmlFor="catatan">Catatan Revisi / Tolak</Label>
                    <textarea 
                      id="catatan"
                      value={catatan}
                      onChange={e => setCatatan(e.target.value)}
                      className="flex min-h-[100px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600"
                      placeholder="Masukkan catatan spesifik (misal: RAB kurang rincian, dll)..."
                    />
                 </div>
                 
                 <div className="flex flex-col gap-2 pt-2">
                    <Button disabled={isUpdating} onClick={() => updateStatus('diverifikasi')} className="w-full bg-green-600 hover:bg-green-700 h-10">
                       {isUpdating ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Check className="size-4 mr-2" />} Verifikasi & Lanjut
                    </Button>
                    <Button disabled={isUpdating} onClick={() => updateStatus('revisi')} className="w-full bg-amber-500 hover:bg-amber-600 text-white h-10">
                       {isUpdating ? <Loader2 className="size-4 mr-2 animate-spin" /> : <AlertCircle className="size-4 mr-2" />} Kembalikan untuk Revisi
                    </Button>
                    <Button disabled={isUpdating} onClick={() => updateStatus('ditolak')} variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 h-10">
                       {isUpdating ? <Loader2 className="size-4 mr-2 animate-spin" /> : <X className="size-4 mr-2" />} Tolak Usulan
                    </Button>
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
