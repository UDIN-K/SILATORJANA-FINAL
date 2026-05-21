import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/StatusBadge';
import { ProgressTracker } from '@/components/ProgressTracker';
import { formatDate, formatCurrency, getUserId } from '@/lib/helpers';
import { ArrowLeft, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { databases, APPWRITE_DB_ID } from '@/lib/appwrite';
import { Query, ID } from 'appwrite';

interface ReviewPageProps {
  role: 'ppk' | 'wadir2';
  approveStatus: string;
  backPath: string;
}

export function ReviewApprovalPage({ role, approveStatus, backPath }: ReviewPageProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [kegiatan, setKegiatan] = useState<any>(null);
  const [kak, setKak] = useState<any>(null);
  const [rabList, setRabList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [catatan, setCatatan] = useState('');

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const kg = await databases.getDocument(APPWRITE_DB_ID, 'kegiatan', id);
        setKegiatan(kg);
        try { const r = await databases.listDocuments(APPWRITE_DB_ID, 'kak', [Query.equal('kegiatan_id', id)]); setKak(r.documents[0]); } catch {}
        try { const r = await databases.listDocuments(APPWRITE_DB_ID, 'rab', [Query.equal('kegiatan_id', id)]); setRabList(r.documents); } catch {}
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    })();
  }, [id]);

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      const newStatus = action === 'approve' ? approveStatus : 'rejected';
      await databases.updateDocument(APPWRITE_DB_ID, 'kegiatan', id, { status: newStatus });
      try {
        await databases.createDocument(APPWRITE_DB_ID, 'status_history', ID.unique(), {
          ref_type: 'kegiatan', ref_id: id, status_lama: kegiatan.status, status_baru: newStatus,
          catatan: catatan || (action === 'approve' ? `Disetujui oleh ${role.toUpperCase()}` : `Ditolak oleh ${role.toUpperCase()}`),
          user_id: getUserId(),
        });
      } catch {}
      navigate(backPath);
    } catch (e: any) { alert('Gagal: ' + e.message); } finally { setIsSubmitting(false); }
  };

  if (isLoading) return <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-blue-600 size-8" /></div>;
  if (!kegiatan) return <div className="py-12 text-center text-slate-500">Tidak ditemukan.</div>;

  const totalRab = rabList.reduce((s, r) => s + (r.total || r.harga_satuan * (r.qty1 || r.volume || 1)), 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(backPath)}><ArrowLeft className="size-5" /></Button>
        <div className="flex-1"><h2 className="text-2xl font-bold text-slate-900">{kegiatan.nama_kegiatan}</h2><StatusBadge status={kegiatan.status} /></div>
      </div>

      <Card className="shadow-sm"><CardHeader className="bg-slate-50/50 border-b"><CardTitle className="text-base">Progress</CardTitle></CardHeader><CardContent className="p-6"><ProgressTracker status={kegiatan.status} /></CardContent></Card>

      {kak && (
        <Card className="shadow-sm"><CardHeader className="bg-slate-50/50 border-b"><CardTitle className="text-base">KAK</CardTitle></CardHeader>
          <CardContent className="p-6 space-y-2">
            {kak.tujuan && <div><p className="text-sm font-medium text-slate-500">Tujuan</p><p className="text-sm">{kak.tujuan}</p></div>}
            {kak.sasaran && <div><p className="text-sm font-medium text-slate-500">Sasaran</p><p className="text-sm">{kak.sasaran}</p></div>}
          </CardContent>
        </Card>
      )}

      {rabList.length > 0 && (
        <Card className="shadow-sm"><CardHeader className="bg-slate-50/50 border-b"><CardTitle className="text-base">RAB — Total: {formatCurrency(totalRab)}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm"><thead className="bg-slate-50 border-b text-slate-600"><tr><th className="px-4 py-3 text-left">Uraian</th><th className="px-4 py-3 text-right w-36">Total</th></tr></thead>
            <tbody>{rabList.map(r => <tr key={r.$id} className="border-b border-slate-100"><td className="px-4 py-3">{r.uraian}</td><td className="px-4 py-3 text-right">{formatCurrency(r.total || r.harga_satuan * (r.qty1 || 1))}</td></tr>)}</tbody></table>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm"><CardHeader className="bg-slate-50/50 border-b"><CardTitle className="text-base">Catatan</CardTitle></CardHeader>
        <CardContent className="p-6">
          <textarea className="w-full min-h-[80px] rounded-md border border-slate-200 px-3 py-2 text-sm focus:ring-1 focus:ring-blue-600 focus:outline-none" value={catatan} onChange={e => setCatatan(e.target.value)} placeholder="Catatan untuk keputusan..." />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate(backPath)}>Kembali</Button>
        <Button variant="destructive" onClick={() => handleAction('reject')} disabled={isSubmitting}><XCircle className="size-4 mr-2" />Tolak</Button>
        <Button onClick={() => handleAction('approve')} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700"><CheckCircle className="size-4 mr-2" />{isSubmitting ? 'Memproses...' : 'Setujui'}</Button>
      </div>
    </div>
  );
}
