import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { databases, APPWRITE_DB_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';

export function PencairanPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [data, setData] = useState<any>(null);
  const [rabData, setRabData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tglPencairan, setTglPencairan] = useState('');
  const [noReferensi, setNoReferensi] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;
        const kegiatan = await databases.getDocument(APPWRITE_DB_ID, 'kegiatan', id);
        setData(kegiatan);

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

  const handlePencairan = async () => {
    if (!id || !tglPencairan || !noReferensi) {
      alert('Mohon lengkapi data pencairan (tanggal dan no referensi).');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await databases.updateDocument(APPWRITE_DB_ID, 'kegiatan', id, {
        status: 'menunggu_lpj'
      });
      // In a real app we would store the pencairan data into a specific collection as well.
      navigate('/dashboard/bendahara');
    } catch (error: any) {
      alert("Failed updating: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto size-8 text-emerald-700" /></div>;
  if (!data) return <div className="p-8 text-center text-red-500">Data tidak ditemukan</div>;

  const totalRp = rabData.reduce((acc, curr) => acc + (curr.volume * curr.harga_satuan), 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/bendahara')}>
          <ArrowLeft className="size-5 text-slate-500" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Proses Pencairan Dana</h2>
          <p className="text-slate-500">ID Usulan: {id?.slice(-8).toUpperCase()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
           <Card className="shadow-sm border-slate-200">
             <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-lg">Detail Pengajuan Pencairan</CardTitle>
             </CardHeader>
             <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                   <div className="col-span-2">
                      <Label className="text-slate-500 text-xs uppercase tracking-wider">Nama Kegiatan</Label>
                      <p className="font-medium text-slate-900 mt-1">{data.nama_kegiatan}</p>
                   </div>
                   <div>
                      <Label className="text-slate-500 text-xs uppercase tracking-wider">Nilai Disetujui</Label>
                      <p className="font-bold text-emerald-700 mt-1 text-lg">Rp {totalRp.toLocaleString('id-ID')}</p>
                   </div>
                   <div>
                      <Label className="text-slate-500 text-xs uppercase tracking-wider">Status Saat Ini</Label>
                      <p className="font-medium text-slate-900 mt-1 capitalize">{data.status.replace(/_/g, ' ')}</p>
                   </div>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
                   <AlertCircle className="size-5 text-amber-600 flex-shrink-0" />
                   <p className="text-sm text-amber-800">
                     Pastikan seluruh dokumen persetujuan (Wadir, PPK) telah ditandatangani sebelum melakukan transfer.
                   </p>
                </div>
             </CardContent>
           </Card>

           <Card className="shadow-sm border-slate-200">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                 <CardTitle className="text-lg">Bukti Transfer / Pencairan</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label>Tanggal Pencairan</Label>
                       <Input type="date" value={tglPencairan} onChange={(e) => setTglPencairan(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                       <Label>Nomor Referensi Transaksi</Label>
                       <Input placeholder="Contoh: TRF-BCA-9283719" value={noReferensi} onChange={(e) => setNoReferensi(e.target.value)} />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <Label>Catatan Pencairan (Opsional)</Label>
                    <textarea 
                      className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600"
                      placeholder="Catatan tambahan..."
                    />
                 </div>
              </CardContent>
           </Card>
        </div>

        <div className="space-y-6">
           <Card className="shadow-sm border-slate-200 sticky top-20">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                 <CardTitle className="text-lg">Aksi Final</CardTitle>
                 <CardDescription>Otorisasi Bendahara</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                 <p className="text-sm text-slate-600 mb-4">
                    Dengan menekan tombol di bawah, Anda mengonfirmasi bahwa dana sebesar <span className="font-bold text-slate-900">Rp {totalRp.toLocaleString('id-ID')}</span> telah dicairkan ke pengusul.
                 </p>
                 <Button disabled={isSubmitting} onClick={handlePencairan} className="w-full bg-emerald-700 hover:bg-emerald-800 h-11">
                    {isSubmitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : <CheckCircle2 className="size-4 mr-2" />} 
                    Konfirmasi Pencairan Dana
                 </Button>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
