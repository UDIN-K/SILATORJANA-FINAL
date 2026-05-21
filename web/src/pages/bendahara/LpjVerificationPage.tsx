import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, XCircle, FileText, Download, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { databases, APPWRITE_DB_ID } from '@/lib/appwrite';

export function LpjVerificationPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;
        const kegiatan = await databases.getDocument(APPWRITE_DB_ID, 'kegiatan', id);
        setData(kegiatan);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleVerifikasiLPJ = async (status: string) => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      await databases.updateDocument(APPWRITE_DB_ID, 'kegiatan', id, {
        status: status
      });
      navigate('/dashboard/bendahara');
    } catch (error: any) {
      alert("Failed updating: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto size-8 text-blue-600" /></div>;
  if (!data) return <div className="p-8 text-center text-red-500">Data tidak ditemukan</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/bendahara')}>
          <ArrowLeft className="size-5 text-slate-500" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Verifikasi LPJ</h2>
          <p className="text-slate-500">ID Usulan: {id?.slice(-8).toUpperCase()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
           <Card className="shadow-sm border-slate-200">
             <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-lg">Detail Laporan Pertanggungjawaban</CardTitle>
             </CardHeader>
             <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                   <div className="col-span-2">
                      <Label className="text-slate-500 text-xs uppercase tracking-wider">Nama Kegiatan</Label>
                      <p className="font-medium text-slate-900 mt-1">{data.nama_kegiatan}</p>
                   </div>
                   <div>
                      <Label className="text-slate-500 text-xs uppercase tracking-wider">Status LPJ</Label>
                      <p className="font-medium text-amber-600 mt-1 capitalize">{data.status.replace(/_/g, ' ')}</p>
                   </div>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                   <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                      <h4 className="font-medium text-slate-900 flex items-center gap-2">
                         <FileText className="size-4 text-slate-500" /> Dokumen Pendukung LPJ
                      </h4>
                   </div>
                   <div className="p-4 space-y-3">
                      {/* Placeholder for uploaded documents */}
                      <div className="flex items-center justify-between p-3 border border-slate-100 rounded-md hover:bg-slate-50">
                         <div className="flex items-center gap-3">
                            <FileText className="size-5 text-blue-500" />
                            <div>
                               <p className="text-sm font-medium text-slate-900">Laporan_Kegiatan_Final.pdf</p>
                               <p className="text-xs text-slate-500">Diunggah pada 20 Mei 2026</p>
                            </div>
                         </div>
                         <Button variant="ghost" size="sm" className="text-slate-500 hover:text-blue-600">
                            <Download className="size-4" />
                         </Button>
                      </div>
                      <div className="flex items-center justify-between p-3 border border-slate-100 rounded-md hover:bg-slate-50">
                         <div className="flex items-center gap-3">
                            <FileText className="size-5 text-emerald-500" />
                            <div>
                               <p className="text-sm font-medium text-slate-900">Kwitansi_dan_Nota.zip</p>
                               <p className="text-xs text-slate-500">Diunggah pada 20 Mei 2026</p>
                            </div>
                         </div>
                         <Button variant="ghost" size="sm" className="text-slate-500 hover:text-blue-600">
                            <Download className="size-4" />
                         </Button>
                      </div>
                   </div>
                </div>
             </CardContent>
           </Card>
        </div>

        <div className="space-y-6">
           <Card className="shadow-sm border-slate-200 sticky top-20">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                 <CardTitle className="text-lg">Putusan Verifikasi LPJ</CardTitle>
                 <CardDescription>Otorisasi Bendahara untuk LPJ</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4 pt-6">
                 <div className="space-y-2">
                    <Label htmlFor="catatan">Catatan / Temuan Verifikasi</Label>
                    <textarea 
                      id="catatan"
                      className="flex min-h-[100px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600"
                      placeholder="Masukkan catatan perbaikan jika ada dokumen yang kurang lengkap..."
                    />
                 </div>
                 
                 <div className="flex flex-col gap-2 pt-2">
                    <Button disabled={isSubmitting} onClick={() => handleVerifikasiLPJ('selesai')} className="w-full bg-emerald-600 hover:bg-emerald-700 h-10">
                       {isSubmitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : <CheckCircle2 className="size-4 mr-2" />} 
                       LPJ Selesai & Sesuai
                    </Button>
                    <Button disabled={isSubmitting} onClick={() => handleVerifikasiLPJ('revisi_lpj')} variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 h-10">
                       {isSubmitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : <XCircle className="size-4 mr-2" />} 
                       Minta Revisi LPJ
                    </Button>
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
