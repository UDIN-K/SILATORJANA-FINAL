import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiGetKegiatan, apiUpdateKegiatan, apiSubmitPpk, apiAmbilUangMuka, apiUploadFile } from '@/lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/StatusBadge';
import { ProgressTracker } from '@/components/ProgressTracker';
import { formatDate, formatCurrency, getUserId, fetchKegiatan } from '@/lib/helpers';
import { ArrowLeft, FileText, Clock, MapPin, User, Loader2, Printer, CheckCircle, Plus, Trash, Upload, DollarSign, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog';

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
    if (rawValue.trim()) {
      return [{ bulan: '', indikator: rawValue, target: null }];
    }
  }
  return [];
}

export function DetailUsulanPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [kegiatan, setKegiatan] = useState<any>(null);
  const [kak, setKak] = useState<any>(null);
  const [ikuList, setIkuList] = useState<any[]>([]);
  const [rabList, setRabList] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // PPK Submit & Advance Cash states
  const [penanggungJawab, setPenanggungJawab] = useState<string[]>(['']);
  const [suratPengantarPath, setSuratPengantarPath] = useState<string>('');
  const [suratPengantarFilename, setSuratPengantarFilename] = useState<string>('');
  const [isUploadingFile, setIsUploadingFile] = useState<boolean>(false);
  const [isSubmittingPpk, setIsSubmittingPpk] = useState<boolean>(false);
  const [isTakingAdvance, setIsTakingAdvance] = useState<boolean>(false);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const kg = await apiGetKegiatan(id);
        setKegiatan(kg);

        try {
          const kakRes = await apiGetKegiatan(id).then((r: any) => ({documents: r.kak ? [r.kak] : []}));
          setKak(kakRes.documents[0] || null);
        } catch {}

        try {
          const ikuRes = await apiGetKegiatan(id).then((r: any) => ({documents: r.iku || []}));
          setIkuList(ikuRes.documents);
        } catch {}

        try {
          const rabRes = await apiGetKegiatan(id).then((r: any) => ({documents: r.rab || []}));
          setRabList(rabRes.documents);
        } catch {}

        try {
          const histRes = await fetch(`/api/status-history/kegiatan/${id}`, {
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`,
            },
          });
          if (histRes.ok) {
            const histData = await histRes.json();
            setHistory(Array.isArray(histData) ? histData : []);
          }
        } catch {}
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingFile(true);
    try {
      const res = await apiUploadFile(file, 'surat_pengantar');
      setSuratPengantarPath(res.path);
      setSuratPengantarFilename(res.original_name || file.name);
    } catch (err: any) {
      alert('Gagal mengunggah file: ' + err.message);
    } finally {
      setIsUploadingFile(false);
    }
  };

  const addPenanggungJawab = () => {
    setPenanggungJawab(prev => [...prev, '']);
  };

  const removePenanggungJawab = (index: number) => {
    setPenanggungJawab(prev => prev.filter((_, i) => i !== index));
  };

  const updatePenanggungJawab = (index: number, value: string) => {
    setPenanggungJawab(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleSubmitPpk = async () => {
    if (!id) return;
    const names = penanggungJawab.map(n => n.trim()).filter(Boolean);
    if (names.length === 0) {
      alert('Mohon masukkan minimal 1 penanggung jawab.');
      return;
    }
    if (!suratPengantarPath) {
      alert('Mohon unggah surat pengantar terlebih dahulu.');
      return;
    }

    setIsSubmittingPpk(true);
    try {
      await apiSubmitPpk(id, {
        surat_pengantar_path: suratPengantarPath,
        surat_pengantar_filename: suratPengantarFilename,
        penanggung_jawab: names,
      });
      alert('Usulan berhasil diteruskan ke PPK!');
      window.location.reload();
    } catch (err: any) {
      alert('Gagal mengirim ke PPK: ' + err.message);
    } finally {
      setIsSubmittingPpk(false);
    }
  };

  const handleAmbilUangMuka = async () => {
    if (!id) return;
    if (!confirm('Apakah Anda yakin ingin melakukan konfirmasi penarikan uang muka?')) return;
    setIsTakingAdvance(true);
    try {
      await apiAmbilUangMuka(id);
      alert('Konfirmasi penarikan uang muka berhasil dicatat!');
      window.location.reload();
    } catch (err: any) {
      alert('Gagal: ' + err.message);
    } finally {
      setIsTakingAdvance(false);
    }
  };

  if (isLoading) return <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-blue-600 size-8" /></div>;
  if (!kegiatan) return <div className="py-12 text-center text-slate-500">Data kegiatan tidak ditemukan.</div>;

  const totalRab = rabList.reduce((sum, r) => sum + (r.total || r.harga_satuan * (r.qty1 || r.volume || 1)), 0);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center gap-4 py-2 border-b border-slate-100 pb-6 mb-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="shrink-0 h-10 w-10 border-slate-200 text-slate-600 hover:bg-slate-100/50 hover:text-slate-900 shadow-sm"><ArrowLeft className="size-5" /></Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{kegiatan.nama_kegiatan}</h2>
          <div className="flex items-center gap-3 mt-2">
            <StatusBadge status={kegiatan.status} />
            <span className="text-sm font-medium text-slate-500 flex items-center gap-1.5"><Clock className="size-3.5"/> {formatDate(kegiatan.created_at)}</span>
          </div>
        </div>
        <Button className="bg-slate-800 hover:bg-slate-900 text-white shadow-md w-full md:w-auto h-11 px-6 rounded-xl transition-all" onClick={() => setShowPrintModal(true)}>
          <Printer className="size-4 mr-2" /> Cetak PDF Dokumen
        </Button>
      </div>

      {/* Progress */}
      <Card className="shadow-sm border-slate-200/60 bg-white">
        <CardHeader className="bg-slate-50/30 border-b border-slate-100/60 py-4"><CardTitle className="text-base text-slate-800">Alur Persetujuan Dokumen</CardTitle></CardHeader>
        <CardContent className="p-8"><ProgressTracker status={kegiatan.status} /></CardContent>
      </Card>

      {/* Info Kegiatan */}
      <Card className="shadow-sm border-slate-200/60 bg-white">
        <CardHeader className="bg-slate-50/30 border-b border-slate-100/60 py-4"><CardTitle className="text-base text-slate-800">Detail Informasi Umum</CardTitle></CardHeader>
        <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <InfoRow icon={FileText} label="Jenis Kegiatan" value={kegiatan.jenis_kegiatan || kegiatan.kategori || '-'} />
            <InfoRow icon={User} label="Organisasi Pengusul" value={kegiatan.pengusul_organisasi || '-'} />
          </div>
          <div className="space-y-6">
            <InfoRow icon={Clock} label="Tanggal Pelaksanaan" value={formatDate(kegiatan.tanggal_kegiatan || kegiatan.tgl_kegiatan)} />
            <InfoRow icon={MapPin} label="Lokasi Pelaksanaan" value={kegiatan.tempat || '-'} />
          </div>
          {kegiatan.kode_mak && (
            <div className="md:col-span-2 mt-2 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Kode MAK (Mata Anggaran Kegiatan)</p>
                <p className="text-xl font-black text-emerald-800 tracking-tight">{kegiatan.kode_mak}</p>
              </div>
              <div className="hidden sm:flex items-center justify-center size-10 rounded-full bg-emerald-100">
                <FileText className="size-5 text-emerald-600" />
              </div>
            </div>
          )}
          {kegiatan.deskripsi && <div className="md:col-span-2 pt-4 border-t border-slate-100"><p className="text-sm font-semibold text-slate-600 mb-2 uppercase tracking-widest">Deskripsi / Latar Belakang</p><p className="text-sm leading-relaxed text-slate-700 bg-slate-50/50 p-4 rounded-xl border border-slate-100/50">{kegiatan.deskripsi || kegiatan.latar_belakang}</p></div>}
        </CardContent>
      </Card>

      {/* KAK */}
      {kak && (
        <Card className="shadow-sm border-slate-200/60 bg-white">
          <CardHeader className="bg-slate-50/30 border-b border-slate-100/60 py-4"><CardTitle className="text-base text-slate-800">Kerangka Acuan Kerja (KAK)</CardTitle></CardHeader>
          <CardContent className="p-8 space-y-6">
            {kak.gambaran_umum && <div><p className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-1.5 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Gambaran Umum</p><p className="text-[15px] leading-relaxed text-slate-700 pl-3 border-l-[3px] border-emerald-100 break-words whitespace-pre-wrap">{kak.gambaran_umum}</p></div>}
            {kak.tujuan && <div><p className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-1.5 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Tujuan</p><p className="text-[15px] leading-relaxed text-slate-700 pl-3 border-l-[3px] border-emerald-100 break-words whitespace-pre-wrap">{kak.tujuan}</p></div>}
            {kak.sasaran && <div><p className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-1.5 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Sasaran</p><p className="text-[15px] leading-relaxed text-slate-700 pl-3 border-l-[3px] border-emerald-100 break-words whitespace-pre-wrap">{kak.sasaran}</p></div>}
            {kak.penerima_manfaat && <div><p className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-1.5 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Penerima Manfaat</p><p className="text-[15px] leading-relaxed text-slate-700 pl-3 border-l-[3px] border-emerald-100 break-words whitespace-pre-wrap">{kak.penerima_manfaat}</p></div>}
            {kak.strategi_pencapaian && <div><p className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-1.5 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Strategi Pencapaian</p><p className="text-[15px] leading-relaxed text-slate-700 pl-3 border-l-[3px] border-emerald-100 break-words whitespace-pre-wrap">{kak.strategi_pencapaian}</p></div>}
            {kak.metode_pelaksanaan && <div><p className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-1.5 flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Metode Pelaksanaan</p><p className="text-[15px] leading-relaxed text-slate-700 pl-3 border-l-[3px] border-emerald-100 break-words whitespace-pre-wrap">{kak.metode_pelaksanaan}</p></div>}
            {kak.indikator_kinerja && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Tahapan Indikator Kinerja
                </p>
                <div className="border border-slate-200/80 rounded-xl overflow-hidden shadow-sm">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/50">
                        <TableHead className="w-12 text-center text-xs font-bold uppercase tracking-wider text-slate-500">No</TableHead>
                        <TableHead className="w-32 text-xs font-bold uppercase tracking-wider text-slate-500">Bulan</TableHead>
                        <TableHead className="text-xs font-bold uppercase tracking-wider text-slate-500">Indikator Keberhasilan</TableHead>
                        <TableHead className="w-28 text-center text-xs font-bold uppercase tracking-wider text-slate-500">Target Kumulatif</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parseIndikatorKinerja(kak.indikator_kinerja).map((item: any, idx: number) => (
                        <TableRow key={idx} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100/50">
                          <TableCell className="text-center font-medium text-slate-500">{idx + 1}</TableCell>
                          <TableCell className="font-medium text-slate-700 capitalize">{item.bulan || '-'}</TableCell>
                          <TableCell className="text-slate-600">{item.indikator || '-'}</TableCell>
                          <TableCell className="text-center font-semibold text-emerald-600 bg-emerald-50/30">{item.target ? `${item.target}%` : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* IKU */}
      {ikuList.length > 0 && (
        <Card className="shadow-sm border-slate-200/60 bg-white">
          <CardHeader className="bg-slate-50/30 border-b border-slate-100/60 py-4"><CardTitle className="text-base text-slate-800">Indikator Kinerja Utama (IKU)</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow className="bg-slate-50/50"><TableHead className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Nama Indikator</TableHead><TableHead className="px-6 py-4 w-32 text-right text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Target (%)</TableHead></TableRow></TableHeader>
                <TableBody>
                  {ikuList.map(iku => (
                    <TableRow key={iku.id} className="hover:bg-slate-50/50 transition-colors border-b-slate-100/60"><TableCell className="px-6 py-4 font-medium text-slate-700 min-w-[200px]">{iku.nama_iku}</TableCell><TableCell className="px-6 py-4 text-right whitespace-nowrap font-semibold text-emerald-600 bg-emerald-50/30">{iku.target_persen ?? '-'}%</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* RAB */}
      {rabList.length > 0 && (
        <Card className="shadow-sm border-slate-200/60 bg-white">
          <CardHeader className="bg-slate-50/30 border-b border-slate-100/60 py-4"><CardTitle className="text-base text-slate-800">Rincian Anggaran Biaya (RAB)</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50 border-b-slate-100/60">
                    <TableHead className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Keterangan / Uraian</TableHead>
                    <TableHead className="px-6 py-4 text-center w-20 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Volume</TableHead>
                    <TableHead className="px-6 py-4 text-right w-40 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Harga Satuan</TableHead>
                    <TableHead className="px-6 py-4 text-right w-40 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Total Harga</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rabList.map(rab => {
                    const total = rab.total || (rab.harga_satuan * (rab.qty1 || rab.volume || 1));
                    return (
                      <TableRow key={rab.id} className="hover:bg-slate-50/50 transition-colors border-b-slate-100/60">
                        <TableCell className="px-6 py-4 font-medium text-slate-700 min-w-[200px]">{rab.uraian}</TableCell>
                        <TableCell className="px-6 py-4 text-center whitespace-nowrap font-medium text-slate-600">{rab.qty1 || rab.volume || 1}</TableCell>
                        <TableCell className="px-6 py-4 text-right whitespace-nowrap text-slate-600">{formatCurrency(rab.harga_satuan)}</TableCell>
                        <TableCell className="px-6 py-4 text-right font-semibold text-slate-800 whitespace-nowrap">{formatCurrency(total)}</TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-emerald-50/80">
                    <TableCell colSpan={3} className="px-6 py-5 text-right whitespace-nowrap text-sm font-bold text-emerald-900 uppercase tracking-widest">Total Keseluruhan Anggaran</TableCell>
                    <TableCell className="px-6 py-5 text-right font-bold text-emerald-700 text-lg whitespace-nowrap">{formatCurrency(totalRab)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {history.length > 0 && (
        <Card className="shadow-sm border-slate-200/60 bg-white">
          <CardHeader className="bg-slate-50/30 border-b border-slate-100/60 py-4"><CardTitle className="text-base text-slate-800">Riwayat Perubahan Status</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100/80">
              {history.map(h => (
                <div key={h.id} className="p-5 flex items-start gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="size-2.5 rounded-full bg-emerald-500 mt-2 shrink-0 shadow-sm shadow-emerald-500/20" />
                  <div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={h.status_baru || h.new_status} />
                      <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">{formatDate(h.created_at || h.timestamp)}</span>
                    </div>
                    {h.catatan && <p className="text-[14px] leading-relaxed text-slate-600 mt-2 bg-white px-3 py-2 border border-slate-100 rounded-lg shadow-sm w-fit max-w-full">"{h.catatan}"</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aksi submit ke PPK untuk Pengusul setelah diverifikasi */}
      {(kegiatan.status === 'diverifikasi' || kegiatan.status === 'verified' || kegiatan.status === 'waiting_surat_pengantar') && (
        <Card className="shadow-lg border-emerald-200/60 bg-white overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-700 to-emerald-800 p-6 text-white">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="size-5 text-emerald-300" /> Usulan Telah Berhasil Diverifikasi
            </CardTitle>
            <p className="text-sm text-emerald-100/90 mt-1">
              Dokumen usulan ini telah lulus verifikasi tingkat pertama. Untuk meneruskan ke Pejabat Pembuat Komitmen (PPK), silakan lengkapi berkas pengantar dan daftar penanggung jawab kegiatan di bawah ini.
            </p>
          </div>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Penanggung Jawab */}
              <div className="space-y-4">
                <Label className="text-sm font-bold text-slate-800">Daftar Penanggung Jawab Kegiatan</Label>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {penanggungJawab.map((name, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        placeholder={`Nama Penanggung Jawab #${index + 1}`}
                        value={name}
                        onChange={e => updatePenanggungJawab(index, e.target.value)}
                        className="bg-white border-slate-200 focus-visible:ring-emerald-500/20"
                      />
                      {penanggungJawab.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removePenanggungJawab(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash className="size-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addPenanggungJawab}
                  className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                >
                  <Plus className="size-4 mr-1.5" /> Tambah Baris
                </Button>
              </div>

              {/* Right Column: Upload Surat Pengantar */}
              <div className="space-y-4">
                <Label className="text-sm font-bold text-slate-800">Unggah Surat Pengantar (PDF/Gambar)</Label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center bg-slate-50 hover:bg-slate-100/50 transition-all relative">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={isUploadingFile}
                  />
                  {isUploadingFile ? (
                    <div className="space-y-2">
                      <Loader2 className="animate-spin text-emerald-600 size-8 mx-auto" />
                      <p className="text-xs text-slate-500">Mengunggah file...</p>
                    </div>
                  ) : suratPengantarPath ? (
                    <div className="space-y-2">
                      <CheckCircle2 className="text-emerald-600 size-8 mx-auto" />
                      <p className="text-sm font-medium text-slate-700 truncate max-w-xs mx-auto">{suratPengantarFilename}</p>
                      <p className="text-xs text-emerald-600 font-semibold">File berhasil diunggah</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="text-slate-400 size-8 mx-auto" />
                      <p className="text-sm font-medium text-slate-600">Klik atau seret file ke sini</p>
                      <p className="text-xs text-slate-400">PDF, JPG, PNG hingga 10MB</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <Button
                onClick={handleSubmitPpk}
                disabled={isSubmittingPpk || isUploadingFile || !suratPengantarPath || penanggungJawab.filter(Boolean).length === 0}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-md px-6 py-5 rounded-xl h-11"
              >
                {isSubmittingPpk ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Upload className="size-4 mr-2" />}
                Kirim Usulan ke PPK
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Button Upload LPJ */}
      {['approved_wadir', 'accepted_funds', 'funds_disbursed', 'lpj_submitted', 'lpj_revision', 'lpj_approved', 'lpj_done', 'completed'].includes(kegiatan.status?.toLowerCase()) && (
        <Card className="shadow-lg border-blue-200/60 bg-white overflow-hidden mt-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="size-5 text-blue-300" /> Pelaporan LPJ (Laporan Pertanggungjawaban)
              </CardTitle>
              <p className="text-sm text-blue-100/90 mt-1">
                Sesuai ketentuan, LPJ harus diunggah untuk pencairan dana. Anda dapat mulai menyusun dan mengirim LPJ sekarang.
              </p>
            </div>
            <Button
              onClick={() => navigate(`/dashboard/pengusul/lpj/${id}`)}
              className="bg-white text-blue-700 hover:bg-blue-50 font-bold shadow-md px-6 py-5 rounded-xl h-11 shrink-0"
            >
              <Upload className="size-4 mr-2" />
              Upload / Kelola LPJ
            </Button>
          </div>
        </Card>
      )}

      {/* Tampilan Riwayat Pencairan Dana & Ambil Uang Muka */}
      {((kegiatan.pencairan_dana && kegiatan.pencairan_dana.length > 0) ||
        (kegiatan.pencairanDana && kegiatan.pencairanDana.length > 0) ||
        ['approved_wadir', 'accepted_funds', 'funds_disbursed', 'lpj_submitted', 'lpj_approved', 'lpj_done', 'completed'].includes(kegiatan.status?.toLowerCase())) && (
        <Card className="shadow-sm border-slate-200 bg-white">
          <CardHeader className="bg-slate-50/30 border-b border-slate-100/60 py-4">
            <CardTitle className="text-base text-slate-800 flex items-center gap-2">
              <DollarSign className="size-4.5 text-emerald-600" /> Riwayat Pencairan Dana
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Table/List of disbursements */}
            {(() => {
              const list = kegiatan.pencairan_dana || kegiatan.pencairanDana || [];
              if (list.length === 0) {
                return <p className="text-sm text-slate-500 italic">Belum ada riwayat pencairan dana tercatat.</p>;
              }
              return (
                <div className="overflow-x-auto border border-slate-100 rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/50">
                        <TableHead className="px-4 py-3 text-xs font-bold text-slate-500">Tahap</TableHead>
                        <TableHead className="px-4 py-3 text-xs font-bold text-slate-500">Tanggal Pencairan</TableHead>
                        <TableHead className="px-4 py-3 text-xs font-bold text-slate-500 text-center">Persentase</TableHead>
                        <TableHead className="px-4 py-3 text-xs font-bold text-slate-500 text-right">Nominal</TableHead>
                        <TableHead className="px-4 py-3 text-xs font-bold text-slate-500">Catatan</TableHead>
                        <TableHead className="px-4 py-3 text-xs font-bold text-slate-500 text-center">Status Diambil</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {list.map((p: any, idx: number) => (
                        <TableRow key={p.pencairan_id || p.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                          <TableCell className="px-4 py-3 font-medium text-slate-800">Tahap {idx + 1}</TableCell>
                          <TableCell className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(p.tanggal_pencairan || p.created_at)}</TableCell>
                          <TableCell className="px-4 py-3 text-slate-800 font-bold text-center bg-slate-50/30">{parseFloat(p.persentase)}%</TableCell>
                          <TableCell className="px-4 py-3 text-right font-semibold text-emerald-700 whitespace-nowrap">{formatCurrency(p.nominal)}</TableCell>
                          <TableCell className="px-4 py-3 text-slate-500 text-sm max-w-xs truncate" title={p.catatan}>{p.catatan || '-'}</TableCell>
                          <TableCell className="px-4 py-3 text-center whitespace-nowrap">
                            {p.is_taken || p.tanggal_pengambilan ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                Sudah Diambil
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                Menunggu
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              );
            })()}

            {/* Ambil Uang Muka button for pengusul */}
            {['accepted_funds', 'funds_disbursed'].includes(kegiatan.status?.toLowerCase()) && !kegiatan.uang_muka_diambil && (
              <div className="p-5 bg-amber-50 border border-amber-100 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-semibold text-amber-900 flex items-center gap-1.5">
                    <AlertCircle className="size-4 text-amber-600" /> Penarikan Dana / Uang Muka Tersedia
                  </h4>
                  <p className="text-xs text-amber-700 max-w-xl leading-relaxed">
                    Dana kegiatan telah dicairkan oleh Bendahara. Silakan kunjungi ruang Bendahara untuk mengambil dana tunai/transfer fisik. Setelah mengambil dana, konfirmasikan penarikan dana Anda di bawah ini agar tenggat waktu pengerjaan laporan LPJ terdata secara valid di sistem.
                  </p>
                </div>
                <Button
                  onClick={handleAmbilUangMuka}
                  disabled={isTakingAdvance}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-md px-6 rounded-xl shrink-0 h-10 border-none"
                >
                  {isTakingAdvance ? <Loader2 className="size-4 mr-2 animate-spin" /> : <DollarSign className="size-4 mr-2" />}
                  Konfirmasi Pengambilan Dana
                </Button>
              </div>
            )}

            {kegiatan.uang_muka_diambil && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3">
                <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Dana Telah Diambil</p>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Anda telah mengonfirmasi penarikan seluruh dana/uang muka kegiatan ini.
                    {kegiatan.deadline_lpj && (
                      <span> Batas waktu akhir penyerahan Laporan LPJ Anda adalah: <strong>{formatDate(kegiatan.deadline_lpj)}</strong> (14 Hari Kerja setelah pencairan selesai).</span>
                    )}
                  </p>
                </div>
              </div>
            )}
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

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100/60">
      <div className="p-2.5 rounded-lg bg-white shadow-sm border border-slate-100"><Icon className="size-4.5 text-emerald-600" /></div>
      <div><p className="text-[11px] uppercase tracking-widest font-bold text-slate-400 mb-0.5">{label}</p><p className="text-[15px] font-semibold text-slate-800">{value}</p></div>
    </div>
  );
}
