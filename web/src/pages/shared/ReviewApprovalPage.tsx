import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { ProgressTracker } from '@/components/ProgressTracker';
import { formatDate, formatCurrency, getUserId, formatDateLong } from '@/lib/helpers';
import { ArrowLeft, CheckCircle, XCircle, Loader2, FileText, ClipboardList, BarChart3, Printer, Info } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { databases, APPWRITE_DB_ID } from '@/lib/appwrite';
import { Query, ID } from 'appwrite';

interface ReviewPageProps {
  role: 'ppk' | 'wadir2';
  approveStatus: string;
  backPath: string;
}

type TabId = 'info' | 'kak' | 'rab' | 'iku';

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: 'info', label: 'Info Utama', icon: Info },
  { id: 'kak', label: 'KAK', icon: FileText },
  { id: 'rab', label: 'RAB', icon: BarChart3 },
  { id: 'iku', label: 'IKU', icon: ClipboardList },
];

function calcRabTotal(r: any): number {
  const q1 = parseFloat(r.qty1) || 0, q2 = parseFloat(r.qty2) || 1, q3 = parseFloat(r.qty3) || 0, h = parseFloat(r.harga_satuan) || 0;
  if (q3 > 0) return q1 * q2 * q3 * h;
  if (q1 > 0) return q1 * q2 * h;
  return parseFloat(r.total) || 0;
}

export function ReviewApprovalPage({ role, approveStatus, backPath }: ReviewPageProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [kegiatan, setKegiatan] = useState<any>(null);
  const [kak, setKak] = useState<any>(null);
  const [rabList, setRabList] = useState<any[]>([]);
  const [ikuList, setIkuList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [catatan, setCatatan] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('info');

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const kg = await databases.getDocument(APPWRITE_DB_ID, 'kegiatan', id);
        setKegiatan(kg);
        try { const r = await databases.listDocuments(APPWRITE_DB_ID, 'kak', [Query.equal('kegiatan_id', id)]); setKak(r.documents[0]); } catch {}
        try { const r = await databases.listDocuments(APPWRITE_DB_ID, 'rab', [Query.equal('kegiatan_id', id)]); setRabList(r.documents); } catch {}
        try { const r = await databases.listDocuments(APPWRITE_DB_ID, 'iku', [Query.equal('kegiatan_id', id)]); setIkuList(r.documents); } catch {}
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

  if (isLoading) return <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-emerald-700 size-8" /></div>;
  if (!kegiatan) return <div className="py-12 text-center text-slate-500">Tidak ditemukan.</div>;

  const totalRab = rabList.reduce((s, r) => s + calcRabTotal(r), 0);
  const roleLabel = role === 'ppk' ? 'PPK' : 'Wakil Direktur II';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(backPath)}><ArrowLeft className="size-5" /></Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-900">{kegiatan.nama_kegiatan}</h2>
          <div className="flex items-center gap-3 mt-1">
            <StatusBadge status={kegiatan.status} />
            <span className="text-sm text-slate-500">{formatDate(kegiatan.$createdAt)}</span>
          </div>
        </div>
        <Button variant="outline" size="sm" className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
          onClick={() => window.open(`/dashboard/pengusul/print/${id}`, '_blank')}>
          <Printer className="size-4 mr-1" /> Cetak
        </Button>
      </div>

      {/* Progress */}
      <Card className="shadow-sm"><CardContent className="p-6"><ProgressTracker status={kegiatan.status} /></CardContent></Card>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        {TABS.map(tab => (
          <button key={tab.id}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
              ${activeTab === tab.id ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab(tab.id)}>
            <tab.icon className="size-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100"><CardTitle className="text-base">Informasi Kegiatan</CardTitle></CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoField label="Nama Kegiatan" value={kegiatan.nama_kegiatan} />
              <InfoField label="Jenis Kegiatan" value={kegiatan.jenis_kegiatan || '-'} />
              <InfoField label="Tanggal Pelaksanaan" value={formatDateLong(kegiatan.tanggal_kegiatan)} />
              <InfoField label="Tempat" value={kegiatan.tempat || '-'} />
              <InfoField label="Pengusul / Organisasi" value={kegiatan.pengusul_organisasi || kegiatan.pengusul_nama || '-'} />
              <InfoField label="Jurusan" value={kegiatan.nama_jurusan || '-'} />
              <InfoField label="Total Anggaran" value={formatCurrency(totalRab)} highlight />
              <InfoField label="Status" value={kegiatan.status} />
            </div>
            {kegiatan.deskripsi && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <p className="text-sm font-medium text-slate-500 mb-2">Deskripsi</p>
                <p className="text-sm text-slate-800 whitespace-pre-wrap">{kegiatan.deskripsi}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'kak' && (
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100"><CardTitle className="text-base">Kerangka Acuan Kerja (KAK)</CardTitle></CardHeader>
          <CardContent className="p-6">
            {kak ? (
              <div className="space-y-5">
                {kak.gambaran_umum && <KakField label="Gambaran Umum" value={kak.gambaran_umum} />}
                {kak.tujuan && <KakField label="Tujuan" value={kak.tujuan} />}
                {kak.sasaran && <KakField label="Sasaran" value={kak.sasaran} />}
                {kak.penerima_manfaat && <KakField label="Penerima Manfaat" value={kak.penerima_manfaat} />}
                {kak.strategi_pencapaian && <KakField label="Strategi Pencapaian" value={kak.strategi_pencapaian} />}
                {kak.metode_pelaksanaan && <KakField label="Metode Pelaksanaan" value={kak.metode_pelaksanaan} />}
                {kak.tahapan_pelaksanaan && <KakField label="Tahapan Pelaksanaan" value={kak.tahapan_pelaksanaan} />}
                {kak.indikator_kinerja && <KakField label="Indikator Kinerja" value={kak.indikator_kinerja} />}
                {(kak.kurun_waktu_mulai || kak.kurun_waktu_selesai) && (
                  <KakField label="Kurun Waktu" value={`${formatDateLong(kak.kurun_waktu_mulai)} — ${formatDateLong(kak.kurun_waktu_selesai)}`} />
                )}
              </div>
            ) : <div className="py-8 text-center text-slate-500">Belum ada data KAK.</div>}
          </CardContent>
        </Card>
      )}

      {activeTab === 'rab' && (
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Rincian Anggaran Biaya (RAB)</CardTitle>
              <span className="text-sm font-bold text-emerald-700">{formatCurrency(totalRab)}</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {rabList.length === 0 ? <div className="py-8 text-center text-slate-500">Belum ada data RAB.</div> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium w-10">No</th>
                      <th className="px-4 py-3 text-left font-medium w-24">Kategori</th>
                      <th className="px-4 py-3 text-left font-medium">Uraian</th>
                      <th className="px-4 py-3 text-center font-medium w-14">Qty1</th>
                      <th className="px-4 py-3 text-center font-medium w-14">Qty2</th>
                      <th className="px-4 py-3 text-center font-medium w-14">Qty3</th>
                      <th className="px-4 py-3 text-right font-medium w-28">Harga Satuan</th>
                      <th className="px-4 py-3 text-right font-medium w-32">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rabList.map((r, idx) => (
                      <tr key={r.$id} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="px-4 py-3 text-center text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-3"><span className="capitalize text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{r.kategori || '-'}</span></td>
                        <td className="px-4 py-3 font-medium">{r.uraian || '-'}</td>
                        <td className="px-4 py-3 text-center">{r.qty1 || '-'}</td>
                        <td className="px-4 py-3 text-center">{r.qty2 || '-'}</td>
                        <td className="px-4 py-3 text-center">{r.qty3 || '-'}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(r.harga_satuan)}</td>
                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(calcRabTotal(r))}</td>
                      </tr>
                    ))}
                    <tr className="bg-emerald-50/50">
                      <td colSpan={7} className="px-4 py-3 text-right font-bold text-slate-900">Grand Total</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-700 text-base">{formatCurrency(totalRab)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'iku' && (
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100"><CardTitle className="text-base">Indikator Kinerja Utama (IKU)</CardTitle></CardHeader>
          <CardContent className="p-0">
            {ikuList.length === 0 ? <div className="py-8 text-center text-slate-500">Belum ada data IKU.</div> : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium w-12">No</th>
                    <th className="px-4 py-3 text-left font-medium">Indikator</th>
                    <th className="px-4 py-3 text-right font-medium w-28">Target (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {ikuList.map((iku, idx) => (
                    <tr key={iku.$id || idx} className="border-b border-slate-100">
                      <td className="px-4 py-3 text-center">{idx + 1}</td>
                      <td className="px-4 py-3">{iku.nama_iku || iku.indikator || '-'}</td>
                      <td className="px-4 py-3 text-right">{iku.target_persen != null ? `${iku.target_persen}%` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Decision Section */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="text-base">Keputusan {roleLabel}</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Catatan (opsional)</p>
            <textarea className="w-full min-h-[80px] rounded-md border border-slate-200 px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              value={catatan} onChange={e => setCatatan(e.target.value)} placeholder="Catatan untuk keputusan..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => navigate(backPath)}>Kembali</Button>
            <Button variant="destructive" onClick={() => handleAction('reject')} disabled={isSubmitting}>
              <XCircle className="size-4 mr-2" />Tolak
            </Button>
            <Button onClick={() => handleAction('approve')} disabled={isSubmitting} className="bg-emerald-700 hover:bg-emerald-800">
              <CheckCircle className="size-4 mr-2" />{isSubmitting ? 'Memproses...' : 'Setujui'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* Sub-components */
function InfoField({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-sm ${highlight ? 'font-bold text-emerald-700 text-lg' : 'text-slate-900'}`}>{value}</p>
    </div>
  );
}

function KakField({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-slate-100 pb-4">
      <p className="text-sm font-semibold text-slate-700 mb-1">{label}</p>
      <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{value}</p>
    </div>
  );
}
