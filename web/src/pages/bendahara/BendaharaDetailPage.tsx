import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { ProgressTracker } from '@/components/ProgressTracker';
import { formatDate, formatCurrency, getUserId } from '@/lib/helpers';
import { ArrowLeft, DollarSign, FileText, CheckCircle, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { databases, APPWRITE_DB_ID } from '@/lib/appwrite';
import { Query, ID } from 'appwrite';

export function BendaharaDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [kegiatan, setKegiatan] = useState<any>(null);
  const [rabList, setRabList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const kg = await databases.getDocument(APPWRITE_DB_ID, 'kegiatan', id);
        setKegiatan(kg);
        try { const r = await databases.listDocuments(APPWRITE_DB_ID, 'rab', [Query.equal('kegiatan_id', id)]); setRabList(r.documents); } catch {}
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    })();
  }, [id]);

  const handleDisburse = async () => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      await databases.updateDocument(APPWRITE_DB_ID, 'kegiatan', id, { status: 'funds_disbursed' });
      try { await databases.createDocument(APPWRITE_DB_ID, 'status_history', ID.unique(), { ref_type: 'kegiatan', ref_id: id, status_lama: kegiatan.status, status_baru: 'funds_disbursed', catatan: 'Dana dicairkan oleh Bendahara', user_id: getUserId() }); } catch {}
      setKegiatan((prev: any) => ({ ...prev, status: 'funds_disbursed' }));
    } catch (e: any) { alert('Gagal: ' + e.message); } finally { setIsSubmitting(false); }
  };

  const handleApproveLpj = async () => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      await databases.updateDocument(APPWRITE_DB_ID, 'kegiatan', id, { status: 'lpj_approved' });
      try { await databases.createDocument(APPWRITE_DB_ID, 'status_history', ID.unique(), { ref_type: 'kegiatan', ref_id: id, status_lama: kegiatan.status, status_baru: 'lpj_approved', catatan: 'LPJ disetujui oleh Bendahara', user_id: getUserId() }); } catch {}
      setKegiatan((prev: any) => ({ ...prev, status: 'lpj_approved' }));
    } catch (e: any) { alert('Gagal: ' + e.message); } finally { setIsSubmitting(false); }
  };

  if (isLoading) return <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-blue-600 size-8" /></div>;
  if (!kegiatan) return <div className="py-12 text-center text-slate-500">Tidak ditemukan.</div>;

  const totalRab = rabList.reduce((s, r) => s + (r.total || r.harga_satuan * (r.qty1 || r.volume || 1)), 0);
  const canDisburse = ['approved_wadir','accepted_funds'].includes(kegiatan.status?.toLowerCase());
  const canApproveLpj = kegiatan.status === 'lpj_submitted';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="size-5" /></Button>
        <div className="flex-1"><h2 className="text-2xl font-bold text-slate-900">{kegiatan.nama_kegiatan}</h2><StatusBadge status={kegiatan.status} /></div>
      </div>

      <Card className="shadow-sm"><CardHeader className="bg-slate-50/50 border-b"><CardTitle className="text-base">Progress</CardTitle></CardHeader><CardContent className="p-6"><ProgressTracker status={kegiatan.status} /></CardContent></Card>

      <Card className="shadow-sm"><CardHeader className="bg-slate-50/50 border-b"><CardTitle className="text-base">RAB — {formatCurrency(totalRab)}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm"><thead className="bg-slate-50 border-b text-slate-600"><tr><th className="px-4 py-3 text-left">Uraian</th><th className="px-4 py-3 text-center w-20">Vol</th><th className="px-4 py-3 text-right w-36">Satuan</th><th className="px-4 py-3 text-right w-36">Total</th></tr></thead>
          <tbody>{rabList.map(r => <tr key={r.$id} className="border-b border-slate-100"><td className="px-4 py-3">{r.uraian}</td><td className="px-4 py-3 text-center">{r.qty1 || r.volume || 1}</td><td className="px-4 py-3 text-right">{formatCurrency(r.harga_satuan)}</td><td className="px-4 py-3 text-right font-medium">{formatCurrency(r.total || r.harga_satuan * (r.qty1 || 1))}</td></tr>)}
          <tr className="bg-slate-50 font-bold"><td colSpan={3} className="px-4 py-3 text-right">Total</td><td className="px-4 py-3 text-right text-blue-700">{formatCurrency(totalRab)}</td></tr></tbody></table>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        {canDisburse && <Button onClick={handleDisburse} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700"><DollarSign className="size-4 mr-2" />{isSubmitting ? 'Memproses...' : 'Cairkan Dana'}</Button>}
        {canApproveLpj && <Button onClick={handleApproveLpj} disabled={isSubmitting} className="bg-emerald-700 hover:bg-emerald-800"><CheckCircle className="size-4 mr-2" />{isSubmitting ? 'Memproses...' : 'Setujui LPJ'}</Button>}
      </div>
    </div>
  );
}
