import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiGetKegiatan, apiUpdateKegiatan } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { ProgressTracker } from '@/components/ProgressTracker';
import { formatDate, formatCurrency, getUserId, formatDateLong, getUserRole } from '@/lib/helpers';
import { ArrowLeft, CheckCircle, XCircle, Loader2, FileText, ClipboardList, BarChart3, Printer, Info, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog';

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

function parseIndikatorKinerja(rawValue: string | undefined | null): any[] {
  if (!rawValue) return [];
  try {
    const parsed = JSON.parse(rawValue);
    if (Array.isArray(parsed)) {
      return parsed.map((item: any) => ({
        bulan: item.bulan || '',
        indikator: item.indikator || '',
        target: item.target !== undefined && item.target !== null ? Number(item.target) : null,
      }));
    }
  } catch {
    if (rawValue && rawValue.trim()) {
      return [{ bulan: '', indikator: rawValue, target: null }];
    }
  }
  return [];
}

export function ReviewApprovalPage({ role, approveStatus, backPath }: ReviewPageProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [kegiatan, setKegiatan] = useState<any>(null);
  const [kak, setKak] = useState<any>(null);
  const [rabList, setRabList] = useState<any[]>([]);
  const [ikuList, setIkuList] = useState<any[]>([]);

  const canAct = (role === 'ppk' && ['verified', 'pending_ppk'].includes(kegiatan?.status)) ||
                 (role.startsWith('wadir') && kegiatan?.status === 'approved_ppk');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [catatan, setCatatan] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('info');

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const kg = await apiGetKegiatan(id);
        setKegiatan(kg);
        setKak(kg.kak || null);
        setRabList(kg.rab || []);
        setIkuList(kg.iku || []);
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    })();
  }, [id]);

  const handleAction = async (action: 'approve') => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      let newStatus: string;
      if (action === 'approve') newStatus = approveStatus;
      const defaultCatatan = action === 'approve' ? `Disetujui oleh ${roleLabel}` : catatan;
      await apiUpdateKegiatan(id, { 
        status: newStatus,
        catatan_revisi: catatan || defaultCatatan
      });
      navigate(backPath);
    } catch (e: any) { alert('Gagal: ' + e.message); } finally { setIsSubmitting(false); }
  };

  if (isLoading) return <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-emerald-700 size-8" /></div>;
  if (!kegiatan) return <div className="py-12 text-center text-slate-500">Tidak ditemukan.</div>;

  const totalRab = rabList.reduce((s, r) => s + calcRabTotal(r), 0);
  
  const actualRole = getUserRole() || role;
  const roleLabelMap: Record<string, string> = {
    ppk: 'PPK',
    wadir1: 'Wakil Direktur I',
    wadir2: 'Wakil Direktur II',
    wadir3: 'Wakil Direktur III',
    wadir4: 'Wakil Direktur IV',
  };
  const roleLabel = roleLabelMap[actualRole] || roleLabelMap[role] || 'Reviewer';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate(backPath)} className="rounded-full bg-slate-100/50 hover:bg-slate-200"><ArrowLeft className="size-5" /></Button>
        <div className="flex-1">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-800">{kegiatan.nama_kegiatan}</h2>
          <div className="flex items-center gap-3 mt-2">
            <StatusBadge status={kegiatan.status} />
            <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{formatDate(kegiatan.created_at)}</span>
          </div>
        </div>
        <Button variant="outline" className="text-[#047857] border-emerald-200 hover:bg-emerald-50 rounded-xl"
          onClick={() => setShowPrintModal(true)}>
          <Printer className="size-4 mr-2" /> Cetak PDF
        </Button>
      </div>

      {/* Progress */}
      <Card className="shadow-sm border-slate-200/60 rounded-2xl overflow-hidden"><CardContent className="p-8 bg-white"><ProgressTracker status={kegiatan.status} /></CardContent></Card>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-slate-100/80 rounded-2xl overflow-x-auto custom-scrollbar">
        {TABS.map(tab => (
          <button key={tab.id}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold tracking-tight transition-all whitespace-nowrap
              ${activeTab === tab.id ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
            onClick={() => setActiveTab(tab.id)}>
            <tab.icon className="size-4.5" /> {tab.label}
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
              {kegiatan.kode_mak && <InfoField label="Kode MAK" value={kegiatan.kode_mak} />}
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
                {kak.indikator_kinerja && (
                  <div className="border-b border-slate-100 pb-4">
                    <p className="text-sm font-semibold text-slate-700 mb-2">Tahapan Indikator Kinerja</p>
                    {(() => {
                      const indicators = parseIndikatorKinerja(kak.indikator_kinerja);
                      if (indicators.length === 0) return <p className="text-sm text-slate-500">-</p>;
                      const isTabular = indicators.some(i => i.bulan || i.target);
                      if (!isTabular) {
                        return <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{indicators[0]?.indikator || '-'}</p>;
                      }
                      return (
                        <div className="border border-slate-200/80 rounded-xl overflow-hidden shadow-sm max-w-2xl mt-1.5">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                              <tr>
                                <th className="px-3 py-2 w-12 text-center">No</th>
                                <th className="px-3 py-2 w-32">Bulan</th>
                                <th className="px-3 py-2">Indikator Keberhasilan</th>
                                <th className="px-3 py-2 w-28 text-center">Target Kumulatif</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                              {indicators.map((item: any, idx: number) => (
                                <tr key={idx} className="bg-white hover:bg-slate-50/50 transition-colors">
                                  <td className="px-3 py-2 text-center font-medium text-slate-500">{idx + 1}</td>
                                  <td className="px-3 py-2 font-medium text-slate-800 capitalize">{item.bulan || '-'}</td>
                                  <td className="px-3 py-2 text-slate-600">{item.indikator || '-'}</td>
                                  <td className="px-3 py-2 text-center font-semibold text-emerald-600 bg-emerald-50/30">{item.target ? `${item.target}%` : '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </div>
                )}
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
                      <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50/50">
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
                    <tr key={iku.id || idx} className="border-b border-slate-100">
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
      {canAct && (
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="text-base">Keputusan {roleLabel}</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-700 mb-1">Catatan Tambahan <span className="text-slate-400 font-normal">(opsional)</span></p>
            <textarea className="w-full min-h-[80px] rounded-md border border-slate-200 px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-600 focus:outline-none"
              value={catatan} onChange={e => setCatatan(e.target.value)} placeholder="Catatan persetujuan (opsional)..." />
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => navigate(backPath)}>Kembali</Button>
            <Button onClick={() => handleAction('approve')} disabled={isSubmitting} className="bg-emerald-700 hover:bg-emerald-800">
              <CheckCircle className="size-4 mr-2" />{isSubmitting ? 'Memproses...' : 'Setujui Pengajuan'}
            </Button>
          </div>
        </CardContent>
      </Card>
      )}

      {/* MODAL PRINT PREVIEW */}
      <Dialog open={showPrintModal} onOpenChange={setShowPrintModal}>
        <DialogContent className="max-w-[95vw] md:max-w-5xl h-[90vh] md:h-[85vh] p-0 flex flex-col bg-slate-100 overflow-hidden border-slate-200">
          <DialogTitle className="sr-only">Pratinjau PDF Dokumen</DialogTitle>
          <div className="flex h-14 shrink-0 items-center justify-between px-6 border-b border-slate-100 shadow-sm z-10 bg-white">
            <span className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              <Printer className="size-4 text-emerald-600" /> Pratinjau Dokumen
            </span>
            <DialogClose render={<Button variant="ghost" size="icon" className="size-8 text-slate-500 rounded-full hover:bg-rose-50 hover:text-rose-600 transition-colors" />}>
              <X className="size-4" />
            </DialogClose>
          </div>
          <iframe 
             src={`/dashboard/pengusul/print/${id}?modal=1&token=${encodeURIComponent(localStorage.getItem('auth_token') || '')}`} 
             className="w-full flex-1 border-0 bg-slate-100 block" 
             title="Print Preview"
          />
        </DialogContent>
      </Dialog>
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
