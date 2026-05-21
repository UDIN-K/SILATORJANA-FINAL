import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency, getUserId } from '@/lib/helpers';
import { ArrowLeft, FileUp, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { databases, APPWRITE_DB_ID } from '@/lib/appwrite';
import { Query, ID } from 'appwrite';

export function LpjPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [kegiatan, setKegiatan] = useState<any>(null);
  const [rabList, setRabList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [catatan, setCatatan] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const kg = await databases.getDocument(APPWRITE_DB_ID, 'kegiatan', id);
        setKegiatan(kg);
        const rabRes = await databases.listDocuments(APPWRITE_DB_ID, 'rab', [Query.equal('kegiatan_id', id)]);
        setRabList(rabRes.documents);
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
    })();
  }, [id]);

  const canSubmit = kegiatan && ['funds_disbursed','accepted_funds','lpj_revision','lpj_pending'].includes(kegiatan.status?.toLowerCase());

  const handleSubmit = async () => {
    if (!id || !canSubmit) return;
    setIsSubmitting(true);
    try {
      await databases.updateDocument(APPWRITE_DB_ID, 'kegiatan', id, { status: 'lpj_submitted' });
      try { await databases.createDocument(APPWRITE_DB_ID, 'lpj', ID.unique(), { kegiatan_id: id, catatan_pengusul: catatan, status_verifikasi: 'pending' }); } catch {}
      setSuccess(true);
      setTimeout(() => navigate('/dashboard/pengusul/usulan'), 2000);
    } catch (e: any) { alert('Gagal: ' + e.message); }
    finally { setIsSubmitting(false); }
  };

  if (isLoading) return <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-emerald-700 size-8" /></div>;
  if (!kegiatan) return <div className="py-12 text-center text-slate-500">Tidak ditemukan.</div>;
  if (success) return <div className="py-20 text-center"><CheckCircle className="size-16 text-emerald-500 mx-auto mb-4" /><h3 className="text-xl font-bold">LPJ Berhasil Disubmit!</h3></div>;

  const totalRab = rabList.reduce((s, r) => s + (r.total || r.harga_satuan * (r.qty1 || r.volume || 1)), 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="size-5" /></Button>
        <div><h2 className="text-2xl font-bold text-slate-900">Upload LPJ</h2><p className="text-slate-500">{kegiatan.nama_kegiatan}</p></div>
      </div>

      {!canSubmit && <Card className="border-amber-200 bg-amber-50"><CardContent className="p-4 flex items-center gap-3"><AlertCircle className="size-5 text-amber-600" /><p className="text-sm text-amber-800">Status belum memungkinkan submit LPJ.</p></CardContent></Card>}

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b"><CardTitle className="text-base">RAB - Total: {formatCurrency(totalRab)}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm"><thead className="bg-slate-50 border-b text-slate-600"><tr><th className="px-4 py-3 text-left">Uraian</th><th className="px-4 py-3 text-right w-36">Total</th></tr></thead>
          <tbody>{rabList.map(r => <tr key={r.$id} className="border-b border-slate-100"><td className="px-4 py-3">{r.uraian}</td><td className="px-4 py-3 text-right">{formatCurrency(r.total || r.harga_satuan * (r.qty1 || 1))}</td></tr>)}</tbody></table>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b"><CardTitle className="text-base">Catatan</CardTitle></CardHeader>
        <CardContent className="p-6">
          <Label>Catatan Pengusul</Label>
          <textarea className="mt-2 w-full min-h-[100px] rounded-md border border-slate-200 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-600 focus:outline-none" value={catatan} onChange={e => setCatatan(e.target.value)} disabled={!canSubmit} />
        </CardContent>
      </Card>

      {canSubmit && <div className="flex justify-end gap-4"><Button variant="outline" onClick={() => navigate(-1)}>Batal</Button><Button onClick={handleSubmit} disabled={isSubmitting} className="bg-emerald-700 hover:bg-emerald-800">{isSubmitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : <FileUp className="size-4 mr-2" />}{isSubmitting ? 'Mengirim...' : 'Submit LPJ'}</Button></div>}
    </div>
  );
}
