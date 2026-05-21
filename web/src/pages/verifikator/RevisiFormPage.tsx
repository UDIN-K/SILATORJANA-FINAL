import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { ArrowLeft, Save, Send, Loader2, MessageSquare, FileText, TrendingUp, DollarSign, Info } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { databases, APPWRITE_DB_ID } from '@/lib/appwrite';
import { fetchKAK, fetchIKU, fetchRAB, formatCurrency, formatDate } from '@/lib/helpers';

const TABS = [
  { key: 'info', label: 'Info Kegiatan', icon: Info },
  { key: 'kak', label: 'KAK', icon: FileText },
  { key: 'iku', label: 'IKU', icon: TrendingUp },
  { key: 'rab', label: 'RAB', icon: DollarSign },
];

export function RevisiFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialTab = searchParams.get('tab') || 'info';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [kegiatan, setKegiatan] = useState<any>(null);
  const [kak, setKak] = useState<any>(null);
  const [ikuList, setIkuList] = useState<any[]>([]);
  const [rabList, setRabList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [comments, setComments] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const doc = await databases.getDocument(APPWRITE_DB_ID, 'kegiatan', id);
        setKegiatan(doc);
        const [k, i, r] = await Promise.all([fetchKAK(id), fetchIKU(id), fetchRAB(id)]);
        setKak(k); setIkuList(i); setRabList(r);
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    })();
  }, [id]);

  const handleCommentChange = (field: string, value: string) => {
    setComments(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitRevision = async () => {
    if (!id) return;
    setIsSaving(true);
    try {
      const catatan = Object.entries(comments)
        .filter(([, v]) => v.trim())
        .map(([k, v]) => `[${k}]: ${v}`)
        .join('\n');
      
      await databases.updateDocument(APPWRITE_DB_ID, 'kegiatan', id, {
        status: 'revision_requested',
        catatan_revisi: catatan || 'Perlu revisi',
      });
      alert('Revisi berhasil dikirim!');
      navigate('/dashboard/verifikator/proposals');
    } catch (e: any) {
      console.error(e);
      alert('Gagal mengirim revisi: ' + (e.message || ''));
    } finally { setIsSaving(false); }
  };

  if (isLoading) return <div className="py-12 text-center"><Loader2 className="animate-spin text-blue-600 mx-auto size-8" /></div>;
  if (!kegiatan) return <div className="py-12 text-center text-slate-500">Data tidak ditemukan.</div>;

  const rabTotal = rabList.reduce((sum: number, r: any) => sum + (parseFloat(r.total) || 0), 0);
  const hasComments = Object.values(comments).some(v => v.trim());

  const CommentBox = ({ field }: { field: string }) => (
    <div className="mt-3 flex items-start gap-2">
      <MessageSquare className="size-4 text-amber-500 mt-2 shrink-0" />
      <textarea
        className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none resize-none bg-amber-50/50"
        rows={2}
        placeholder={`Catatan revisi untuk ${field}...`}
        value={comments[field] || ''}
        onChange={e => handleCommentChange(field, e.target.value)}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="size-5" /></Button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-900">Revisi: {kegiatan.nama_kegiatan}</h2>
          <div className="flex items-center gap-3 mt-1"><StatusBadge status={kegiatan.status} /></div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(tab => (
          <Button key={tab.key} variant={activeTab === tab.key ? 'default' : 'outline'} size="sm"
            className={activeTab === tab.key ? 'bg-emerald-700 text-white' : ''}
            onClick={() => setActiveTab(tab.key)}>
            <tab.icon className="size-4 mr-1" /> {tab.label}
            {comments[tab.key] && <span className="ml-1 size-2 bg-amber-400 rounded-full inline-block" />}
          </Button>
        ))}
      </div>

      {/* Info Kegiatan Tab */}
      {activeTab === 'info' && (
        <Card className="shadow-sm"><CardContent className="p-5 space-y-4">
          <h3 className="font-semibold text-slate-900">Informasi Kegiatan</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><span className="text-slate-500 block mb-1">Nama Kegiatan</span><p className="font-medium">{kegiatan.nama_kegiatan}</p></div>
            <div><span className="text-slate-500 block mb-1">Jenis</span><p className="font-medium">{kegiatan.jenis_kegiatan || '-'}</p></div>
            <div><span className="text-slate-500 block mb-1">Jurusan</span><p className="font-medium">{kegiatan.nama_jurusan || '-'}</p></div>
            <div><span className="text-slate-500 block mb-1">Pengusul</span><p className="font-medium">{kegiatan.pengusul_nama || '-'}</p></div>
            <div><span className="text-slate-500 block mb-1">Tanggal Dibuat</span><p className="font-medium">{formatDate(kegiatan.$createdAt)}</p></div>
            <div><span className="text-slate-500 block mb-1">Status</span><StatusBadge status={kegiatan.status} /></div>
          </div>
          <CommentBox field="Info Kegiatan" />
        </CardContent></Card>
      )}

      {/* KAK Tab */}
      {activeTab === 'kak' && (
        <Card className="shadow-sm"><CardContent className="p-5 space-y-4">
          <h3 className="font-semibold text-slate-900">Kerangka Acuan Kerja</h3>
          {kak ? (
            <div className="space-y-4 text-sm">
              {['gambaran_umum', 'penerima_manfaat', 'strategi_pencapaian', 'metode_pelaksanaan', 'tahapan_pelaksanaan'].map(key => (
                <div key={key} className="border-b border-slate-100 pb-3">
                  <span className="text-slate-500 block mb-1 capitalize font-medium">{key.replace(/_/g, ' ')}</span>
                  <p className="text-slate-800">{kak[key] || '-'}</p>
                  <CommentBox field={`KAK - ${key.replace(/_/g, ' ')}`} />
                </div>
              ))}
              {kak.kurun_waktu_mulai && (
                <div className="border-b border-slate-100 pb-3">
                  <span className="text-slate-500 block mb-1 font-medium">Kurun Waktu</span>
                  <p className="text-slate-800">{formatDate(kak.kurun_waktu_mulai)} — {formatDate(kak.kurun_waktu_selesai)}</p>
                </div>
              )}
            </div>
          ) : <p className="text-slate-500">Belum ada data KAK.</p>}
        </CardContent></Card>
      )}

      {/* IKU Tab */}
      {activeTab === 'iku' && (
        <Card className="shadow-sm"><CardContent className="p-5 space-y-4">
          <h3 className="font-semibold text-slate-900">Indikator Kinerja Utama</h3>
          {ikuList.length > 0 ? (
            <div className="space-y-3">
              {ikuList.map((iku: any, i: number) => (
                <div key={iku.$id || i} className="border border-slate-100 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">{iku.nama_iku || iku.indikator || '-'}</span>
                    <span className="text-sm font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                      {iku.target_persen != null ? `${iku.target_persen}%` : '-'}
                    </span>
                  </div>
                  <CommentBox field={`IKU #${i + 1}`} />
                </div>
              ))}
            </div>
          ) : <p className="text-slate-500">Belum ada data IKU.</p>}
        </CardContent></Card>
      )}

      {/* RAB Tab */}
      {activeTab === 'rab' && (
        <Card className="shadow-sm"><CardContent className="p-5 space-y-4">
          <h3 className="font-semibold text-slate-900">Rincian Anggaran Biaya — Total: {formatCurrency(rabTotal)}</h3>
          {rabList.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-left text-slate-600 font-semibold">
                    <th className="py-2 px-3">No</th><th className="py-2 px-3">Uraian</th><th className="py-2 px-3">Kategori</th><th className="py-2 px-3 text-right">Harga</th><th className="py-2 px-3 text-right">Total</th>
                  </tr></thead>
                  <tbody>{rabList.map((r: any, i: number) => (
                    <tr key={r.$id || i} className="border-b border-slate-50">
                      <td className="py-2 px-3">{i+1}</td><td className="py-2 px-3">{r.uraian}</td>
                      <td className="py-2 px-3 capitalize">{r.kategori || '-'}</td>
                      <td className="py-2 px-3 text-right">{formatCurrency(r.harga_satuan)}</td>
                      <td className="py-2 px-3 text-right font-semibold">{formatCurrency(r.total)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <CommentBox field="RAB" />
            </>
          ) : <p className="text-slate-500">Belum ada data RAB.</p>}
        </CardContent></Card>
      )}

      {/* Submit Bar */}
      <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 -mx-4 sm:-mx-6 lg:-mx-8 flex justify-between items-center shadow-lg rounded-t-xl">
        <span className="text-sm text-slate-500">
          {hasComments ? `${Object.values(comments).filter(v => v.trim()).length} catatan revisi` : 'Belum ada catatan revisi'}
        </span>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>Batal</Button>
          <Button className="bg-amber-500 hover:bg-amber-600 text-white" disabled={!hasComments || isSaving} onClick={handleSubmitRevision}>
            {isSaving ? <Loader2 className="animate-spin size-4 mr-2" /> : <Send className="size-4 mr-2" />}
            Kirim Revisi
          </Button>
        </div>
      </div>
    </div>
  );
}
