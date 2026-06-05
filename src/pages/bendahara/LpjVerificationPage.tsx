import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { apiGetLpjDetail, apiUpdateKegiatan, apiHitungSpk, apiSimpanSpk, apiGetSpkKriteria } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, XCircle, FileText, Download, Loader2, Info, AlertCircle, FileCheck, DollarSign } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { formatCurrency, formatDate } from '@/lib/helpers';
import { SpkScoreCard } from '@/components/spk/SpkScoreCard';
import { SpkDetailModal } from '@/components/spk/SpkDetailModal';
import type { MooraResult, KriteriaDef } from '@/lib/mooraCalculator';

interface RabItem {
  id: number;
  uraian: string;
  kategori: string;
  qty1: number;
  satuan1: string;
  qty2: number;
  satuan2: string;
  qty3: number | null;
  satuan3: string;
  harga_satuan: number;
  total: number;
  real_qty1: number | null;
  real_satuan1: string | null;
  real_qty2: number | null;
  real_satuan2: string | null;
  real_qty3: number | null;
  real_satuan3: string | null;
  real_harga_satuan: number | null;
  existing_files: ExistingFile[];
}

interface ExistingFile {
  file_id: number;
  filename: string;
  original_name: string;
  file_size: number;
  uploaded_at: string;
  url: string;
}

interface RabGroup {
  label: string;
  items: RabItem[];
}

export function LpjVerificationPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [kegiatan, setKegiatan] = useState<any>(null);
  const [rabGroups, setRabGroups] = useState<Record<string, RabGroup>>({});
  const [lpj, setLpj] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [catatanVerifikasi, setCatatanVerifikasi] = useState('');

  // SPK MOORA state
  const [spkResult, setSpkResult] = useState<MooraResult | null>(null);
  const [spkLoading, setSpkLoading] = useState(false);
  const [spkDetailOpen, setSpkDetailOpen] = useState(false);
  const [spkKriteria, setSpkKriteria] = useState<KriteriaDef[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;
        const res = await apiGetLpjDetail(id);
        setKegiatan(res.kegiatan);
        setRabGroups(res.rab || {});
        setLpj(res.lpj);
        
        // Prefill verification note if exists
        if (res.lpj?.catatan_bendahara) {
          setCatatanVerifikasi(res.lpj.catatan_bendahara);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();

    // Fetch SPK score in parallel
    if (id) {
      setSpkLoading(true);
      Promise.all([
        apiHitungSpk(id).catch(() => null),
        apiGetSpkKriteria().catch(() => []),
      ]).then(([spkRes, kriteriaRes]) => {
        if (spkRes?.perhitungan) {
          setSpkResult(spkRes.perhitungan as MooraResult);
        }
        if (Array.isArray(kriteriaRes)) {
          setSpkKriteria(kriteriaRes);
        }
      }).finally(() => setSpkLoading(false));
    }
  }, [id]);

  const handleVerifikasiLPJ = async (status: string) => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      // Simpan skor SPK secara permanen saat approve
      if (status === 'lpj_approved') {
        await apiSimpanSpk(id).catch(e => console.warn('SPK save warning:', e));
      }

      await apiUpdateKegiatan(id, {
        status: status,
        catatan_revisi: catatanVerifikasi,
      });
      alert(status === 'lpj_approved' ? 'LPJ Berhasil Disetujui! Skor SPK telah disimpan.' : 'Permintaan revisi LPJ berhasil dikirim.');
      navigate('/dashboard/bendahara');
    } catch (error: any) {
      alert("Gagal memproses verifikasi LPJ: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  function calcRealisasiTotal(item: RabItem): number {
    const q1 = item.real_qty1 ?? 0;
    const q2 = item.real_qty2 ?? 1;
    const q3 = item.real_qty3 != null ? item.real_qty3 : 1;
    const h = item.real_harga_satuan ?? 0;
    return q1 * q2 * q3 * h;
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  if (isLoading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto size-8 text-emerald-700" /></div>;
  if (!kegiatan) return <div className="p-8 text-center text-red-500">Data usulan tidak ditemukan</div>;

  // Calculate totals
  let totalKak = 0;
  let totalRealisasi = 0;
  let totalFilesCount = 0;
  Object.values(rabGroups).forEach(group => {
    group.items.forEach(item => {
      totalKak += parseFloat(String(item.total)) || 0;
      totalRealisasi += calcRealisasiTotal(item);
      totalFilesCount += (item.existing_files || []).length;
    });
  });

  const selisih = totalRealisasi - totalKak;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-300">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/dashboard/bendahara/detail/${id}`)}>
          <ArrowLeft className="size-5 text-slate-500" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Verifikasi LPJ Usulan</h2>
          <p className="text-slate-500">ID Usulan: {String(id).padStart(8, '0')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left columns: LPJ Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info Card */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="size-4.5 text-emerald-600" /> Detail Laporan Pertanggungjawaban
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1 md:col-span-2">
                  <Label className="text-slate-500 text-xs uppercase tracking-wider">Nama Kegiatan</Label>
                  <p className="font-semibold text-slate-900 mt-1">{kegiatan.nama_kegiatan}</p>
                </div>
                <div>
                  <Label className="text-slate-500 text-xs uppercase tracking-wider">Pengusul</Label>
                  <p className="font-medium text-slate-950 mt-1">{kegiatan.pengusul_nama}</p>
                </div>
                <div>
                  <Label className="text-slate-500 text-xs uppercase tracking-wider">Batas Waktu LPJ (Deadline)</Label>
                  <p className="font-medium text-slate-950 mt-1">{kegiatan.deadline_lpj ? formatDate(kegiatan.deadline_lpj) : '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RAB Items Realisasi */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 text-base">Realisasi Anggaran per Baris RAB</h3>
            
            {Object.entries(rabGroups).map(([kategori, group]) => (
              <Card key={kategori} className="shadow-sm border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-700 capitalize">{group.label}</span>
                  <span className="bg-emerald-50 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    {group.items.length} item
                  </span>
                </div>
                <CardContent className="p-0 divide-y divide-slate-100">
                  {group.items.map((item, idx) => {
                    const realTotal = calcRealisasiTotal(item);
                    const selisihItem = realTotal - item.total;
                    return (
                      <div key={item.id} className="p-5 space-y-4">
                        <div className="flex justify-between items-start gap-2">
                          <p className="font-bold text-sm text-slate-800">{idx + 1}. {item.uraian}</p>
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                            Budget KAK: {formatCurrency(item.total)}
                          </span>
                        </div>

                        {/* Rencana vs Realisasi Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Rencana */}
                          <div className="bg-sky-50/50 border border-sky-100 rounded-lg p-3 text-xs space-y-1">
                            <span className="font-bold text-sky-700 uppercase tracking-wider block mb-1">Rencana KAK</span>
                            <p className="text-slate-600">Volume: {item.qty1} {item.satuan1} {item.qty2 ? ` x ${item.qty2} ${item.satuan2}` : ''} {item.qty3 ? ` x ${item.qty3} ${item.satuan3}` : ''}</p>
                            <p className="text-slate-600">Harga Satuan: {formatCurrency(item.harga_satuan)}</p>
                            <p className="font-bold text-sky-950 mt-1 border-t border-sky-100/50 pt-1">Total: {formatCurrency(item.total)}</p>
                          </div>

                          {/* Realisasi */}
                          <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-3 text-xs space-y-1">
                            <span className="font-bold text-emerald-700 uppercase tracking-wider block mb-1">Realisasi LPJ</span>
                            <p className="text-slate-600">Volume: {item.real_qty1 ?? '-'} {item.real_satuan1} {item.real_qty2 ? ` x ${item.real_qty2} ${item.real_satuan2}` : ''} {item.real_qty3 ? ` x ${item.real_qty3} ${item.real_satuan3}` : ''}</p>
                            <p className="text-slate-600">Harga Satuan: {formatCurrency(item.real_harga_satuan ?? 0)}</p>
                            <div className="flex justify-between items-center font-bold text-emerald-950 mt-1 border-t border-emerald-100/50 pt-1">
                              <span>Total: {formatCurrency(realTotal)}</span>
                              <span className={selisihItem > 0 ? 'text-red-600' : 'text-emerald-700'}>
                                (Selisih: {selisihItem > 0 ? '+' : ''}{formatCurrency(selisihItem)})
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Receipts Attachments */}
                        <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-500 block">Berkas Kuitansi / Bukti Pembayaran:</Label>
                          {item.existing_files && item.existing_files.length > 0 ? (
                            <div className="space-y-1.5">
                              {item.existing_files.map((file) => {
                                const isImage = file.url.match(/\\.(jpeg|jpg|gif|png)$/i);
                                return (
                                <div key={file.file_id} className="flex flex-col p-2.5 bg-slate-50 border border-slate-100 rounded-lg group text-xs">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <FileText className="size-4 text-emerald-600 shrink-0" />
                                      <div className="min-w-0">
                                        <p className="font-medium text-slate-800 truncate max-w-xs">{file.original_name}</p>
                                        <p className="text-[10px] text-slate-400">{formatFileSize(file.file_size)} • {formatDate(file.uploaded_at)}</p>
                                      </div>
                                    </div>
                                    <a
                                      href={file.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 bg-white border border-slate-200 rounded px-2.5 py-1 shadow-sm font-semibold transition-colors shrink-0"
                                    >
                                      <Download className="size-3" /> Unduh / Lihat
                                    </a>
                                  </div>
                                  {isImage && (
                                    <div className="mt-3 bg-slate-200/50 rounded-md overflow-hidden border border-slate-200/50 flex justify-center p-1">
                                      <img src={file.url} alt={file.original_name} className="max-w-full max-h-64 object-contain rounded" />
                                    </div>
                                  )}
                                </div>
                              )})}
                            </div>
                          ) : (
                            <p className="text-xs text-red-500 italic flex items-center gap-1.5">
                              <AlertCircle className="size-3.5" /> Tidak ada file bukti untuk item ini.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Right column: SPK Score + Decisions */}
        <div className="space-y-6">
          {/* SPK MOORA Score Card */}
          <SpkScoreCard
            result={spkResult}
            isLoading={spkLoading}
            onShowDetail={() => setSpkDetailOpen(true)}
          />
          <Card className="shadow-md border-slate-200 sticky top-20">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-lg">Putusan Verifikasi LPJ</CardTitle>
              <CardDescription>Otorisasi Bendahara untuk LPJ</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              {/* Overall Totals */}
              <div className="space-y-2 pb-4 border-b border-slate-100 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total KAK:</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(totalKak)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total LPJ:</span>
                  <span className="font-bold text-emerald-700">{formatCurrency(totalRealisasi)}</span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-slate-100/50 font-bold">
                  <span className="text-slate-500">Selisih:</span>
                  <span className={selisih > 0 ? 'text-red-700' : 'text-emerald-700'}>
                    {selisih > 0 ? '+' : ''}{formatCurrency(selisih)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Bukti:</span>
                  <span className="font-bold text-slate-800">{totalFilesCount} file</span>
                </div>
              </div>

              {/* Catatan Pengusul */}
              {lpj?.catatan_pengusul && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">Keterangan Pengusul</Label>
                  <p className="text-xs bg-slate-50 border border-slate-100 p-3 rounded-lg text-slate-700 leading-relaxed italic">
                    "{lpj.catatan_pengusul}"
                  </p>
                </div>
              )}

              {/* Notes Input */}
              <div className="space-y-2">
                <Label htmlFor="catatan">Catatan Verifikasi / Temuan</Label>
                <textarea
                  id="catatan"
                  value={catatanVerifikasi}
                  onChange={(e) => setCatatanVerifikasi(e.target.value)}
                  className="flex min-h-[100px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-600"
                  placeholder="Masukkan catatan perbaikan jika ada berkas/nilai realisasi yang tidak cocok..."
                />
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  disabled={isSubmitting}
                  onClick={() => handleVerifikasiLPJ('lpj_approved')}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold h-11 shadow flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : <FileCheck className="size-4" />}
                  LPJ Disetujui & Selesai
                </Button>
                <Button
                  disabled={isSubmitting}
                  onClick={() => handleVerifikasiLPJ('lpj_revision')}
                  variant="outline"
                  className="w-full text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700 h-11"
                >
                  {isSubmitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : <XCircle className="size-4 mr-2" />}
                  Minta Revisi LPJ
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SPK Detail Modal */}
      {spkResult && (
        <SpkDetailModal
          result={spkResult}
          kriteria={spkKriteria}
          isOpen={spkDetailOpen}
          onClose={() => setSpkDetailOpen(false)}
        />
      )}
    </div>
  );
}
