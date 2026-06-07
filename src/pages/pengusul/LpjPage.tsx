import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiGetLpjDetail, apiSubmitLpj, apiDeleteLpjFile } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/helpers';
import {
  ArrowLeft, FileUp, Loader2, CheckCircle, AlertCircle,
  Upload, Trash2, FileText, Package, Briefcase, Plane,
  ChevronDown, ChevronUp, Info, Target
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

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

const CATEGORY_ICONS: Record<string, any> = {
  barang: Package,
  jasa: Briefcase,
  perjalanan: Plane,
};

const CATEGORY_COLORS: Record<string, { bg: string; border: string; header: string; badge: string }> = {
  barang: { bg: 'bg-blue-50/50', border: 'border-blue-200', header: 'from-blue-700 to-blue-800', badge: 'bg-blue-100 text-blue-700' },
  jasa: { bg: 'bg-violet-50/50', border: 'border-violet-200', header: 'from-violet-700 to-violet-800', badge: 'bg-violet-100 text-violet-700' },
  perjalanan: { bg: 'bg-amber-50/50', border: 'border-amber-200', header: 'from-amber-700 to-amber-800', badge: 'bg-amber-100 text-amber-700' },
};

interface IkuItem {
  id: number;
  nama_iku: string;
  target_persen: number | null;
  capaian_persen: number | null;
}

export function LpjPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [catatan, setCatatan] = useState('');
  const [kegiatan, setKegiatan] = useState<any>(null);
  const [rabGroups, setRabGroups] = useState<Record<string, RabGroup>>({});
  const [lpj, setLpj] = useState<any>(null);

  // IKU list from API
  const [ikuList, setIkuList] = useState<IkuItem[]>([]);

  // IKU capaian state: { [ikuId]: capaianValue (string for input) }
  const [ikuCapaian, setIkuCapaian] = useState<Record<number, string>>({});

  // Realisasi state: { [rabId]: { qty1, satuan1, qty2, satuan2, qty3, satuan3, harga_satuan } }
  const [realisasi, setRealisasi] = useState<Record<number, any>>({});

  // New files to upload: { [rabId]: File[] }
  const [newFiles, setNewFiles] = useState<Record<number, File[]>>({});

  // Existing files (can be deleted): { [rabId]: ExistingFile[] }
  const [existingFiles, setExistingFiles] = useState<Record<number, ExistingFile[]>>({});

  // Collapsed categories
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // File input refs
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({}); 

  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id]);

  async function loadData() {
    setIsLoading(true);
    try {
      const res = await apiGetLpjDetail(id!);
      setKegiatan(res.kegiatan);
      setRabGroups(res.rab || {});
      setLpj(res.lpj);

      // Load IKU list
      const loadedIku: IkuItem[] = res.iku || [];
      setIkuList(loadedIku);

      // Pre-fill capaian dari data yang sudah ada di DB
      const initCapaian: Record<number, string> = {};
      loadedIku.forEach((iku) => {
        initCapaian[iku.id] = iku.capaian_persen != null ? String(iku.capaian_persen) : '';
      });
      setIkuCapaian(initCapaian);

      // Initialize realisasi and existing files from loaded data
      const initReal: Record<number, any> = {};
      const initFiles: Record<number, ExistingFile[]> = {};

      Object.values(res.rab || {}).forEach((group: any) => {
        group.items.forEach((item: RabItem) => {
          initReal[item.id] = {
            qty1: item.real_qty1 ?? item.qty1 ?? 0,
            satuan1: item.real_satuan1 ?? item.satuan1 ?? '',
            qty2: item.real_qty2 ?? item.qty2 ?? 1,
            satuan2: item.real_satuan2 ?? item.satuan2 ?? '',
            qty3: item.real_qty3 ?? item.qty3 ?? null,
            satuan3: item.real_satuan3 ?? item.satuan3 ?? '',
            harga_satuan: item.real_harga_satuan ?? item.harga_satuan ?? 0,
          };
          initFiles[item.id] = item.existing_files || [];
        });
      });

      setRealisasi(initReal);
      setExistingFiles(initFiles);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  const canSubmit = kegiatan && ['approved_wadir', 'funds_disbursed', 'accepted_funds', 'lpj_revision', 'lpj_pending', 'lpj_submitted'].includes(kegiatan.status?.toLowerCase());

  function updateRealisasi(rabId: number, field: string, value: any) {
    setRealisasi(prev => ({
      ...prev,
      [rabId]: { ...prev[rabId], [field]: value },
    }));
  }

  function calcRealisasiTotal(rabId: number): number {
    const r = realisasi[rabId];
    if (!r) return 0;
    const q1 = parseFloat(r.qty1) || 0;
    const q2 = parseFloat(r.qty2) || 1;
    const q3 = r.qty3 != null && r.qty3 !== '' ? (parseFloat(r.qty3) || 1) : 1;
    const h = parseFloat(r.harga_satuan) || 0;
    return q1 * q2 * q3 * h;
  }

  function handleFileSelect(rabId: number, files: FileList | null) {
    if (!files) return;
    setNewFiles(prev => ({
      ...prev,
      [rabId]: [...(prev[rabId] || []), ...Array.from(files)],
    }));
  }

  function removeNewFile(rabId: number, index: number) {
    setNewFiles(prev => ({
      ...prev,
      [rabId]: (prev[rabId] || []).filter((_, i) => i !== index),
    }));
  }

  async function removeExistingFile(rabId: number, fileId: number) {
    try {
      await apiDeleteLpjFile(fileId);
      setExistingFiles(prev => ({
        ...prev,
        [rabId]: (prev[rabId] || []).filter(f => f.file_id !== fileId),
      }));
    } catch (e: any) {
      alert('Gagal menghapus file: ' + e.message);
    }
  }

  function totalAllFiles(): number {
    let count = 0;
    Object.values(existingFiles).forEach(arr => count += arr.length);
    Object.values(newFiles).forEach(arr => count += arr.length);
    return count;
  }

  async function handleSubmit() {
    if (!id || !canSubmit) return;

    if (totalAllFiles() === 0) {
      alert('Minimal upload 1 file bukti kuitansi.');
      return;
    }

    // Validasi: semua IKU harus diisi capaian-nya
    if (ikuList.length > 0) {
      const missing = ikuList.some(
        (iku) => ikuCapaian[iku.id] === '' || ikuCapaian[iku.id] == null
      );
      if (missing) {
        alert('Harap isi capaian (%) untuk semua IKU sebelum submit LPJ.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('kegiatan_id', id);
      formData.append('catatan_pengusul', catatan);

      // Append realisasi as JSON
      formData.append('realisasi', JSON.stringify(realisasi));

      // Append IKU capaian as JSON: { [ikuId]: capaianValue }
      const ikuCapaianPayload: Record<number, number | null> = {};
      ikuList.forEach((iku) => {
        const val = ikuCapaian[iku.id];
        ikuCapaianPayload[iku.id] = val !== '' && val != null ? parseFloat(val) : null;
      });
      formData.append('iku_capaian', JSON.stringify(ikuCapaianPayload));

      // Append files grouped by RAB ID
      Object.entries(newFiles).forEach(([rabId, files]) => {
        files.forEach(file => {
          formData.append(`item_files[${rabId}][]`, file);
        });
      });

      await apiSubmitLpj(formData);
      setSuccess(true);
      setTimeout(() => navigate('/dashboard/pengusul/usulan'), 2500);
    } catch (e: any) {
      alert('Gagal submit LPJ: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-emerald-600 size-10" />
        <p className="text-slate-500 text-sm">Memuat data LPJ...</p>
      </div>
    );
  }

  if (!kegiatan) {
    return (
      <div className="py-20 text-center">
        <AlertCircle className="size-12 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-500">Data kegiatan tidak ditemukan.</p>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="mx-auto w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle className="size-10 text-emerald-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">LPJ Berhasil Disubmit!</h3>
        <p className="text-slate-500 text-sm">Mengarahkan ke halaman usulan...</p>
      </div>
    );
  }

  // Calculate totals
  let totalKak = 0;
  let totalRealisasi = 0;
  Object.values(rabGroups).forEach(group => {
    group.items.forEach(item => {
      totalKak += parseFloat(String(item.total)) || 0;
      totalRealisasi += calcRealisasiTotal(item.id);
    });
  });

  const selisih = totalRealisasi - totalKak;
  const categories = Object.entries(rabGroups);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-slate-900">Laporan Pertanggungjawaban</h2>
          <p className="text-slate-500 text-sm truncate">{kegiatan.nama_kegiatan}</p>
        </div>
      </div>

      {/* Status Warning */}
      {!canSubmit && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="size-5 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800">
              Status kegiatan belum memungkinkan untuk submit LPJ. Status saat ini: <strong>{kegiatan.status}</strong>
            </p>
          </CardContent>
        </Card>
      )}

      {/* LPJ Revision Warning */}
      {kegiatan.status === 'lpj_revision' && lpj?.catatan_bendahara && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-5 text-red-600 shrink-0" />
              <p className="text-sm font-semibold text-red-800">Catatan Revisi dari Bendahara:</p>
            </div>
            <p className="text-sm text-red-700 ml-7">{lpj.catatan_bendahara}</p>
          </CardContent>
        </Card>
      )}

      {/* Kegiatan Info Card */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 p-6 text-white">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-200 mb-4 flex items-center gap-2">
            <Info className="size-4" /> Informasi Kegiatan
          </h3>
          <div className="bg-white/10 rounded-xl p-4 mb-3 border border-white/10">
            <p className="text-[11px] text-emerald-200 uppercase tracking-wide mb-1">Nama Kegiatan</p>
            <p className="text-lg font-bold">{kegiatan.nama_kegiatan}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/8 rounded-lg p-3 border border-white/5">
              <p className="text-[11px] text-emerald-200 uppercase tracking-wide mb-1">Jurusan</p>
              <p className="text-sm font-semibold">{kegiatan.nama_jurusan || '-'}</p>
            </div>
            <div className="bg-white/8 rounded-lg p-3 border border-white/5">
              <p className="text-[11px] text-emerald-200 uppercase tracking-wide mb-1">Tanggal</p>
              <p className="text-sm font-semibold">{kegiatan.tanggal_kegiatan ? new Date(kegiatan.tanggal_kegiatan).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</p>
            </div>
            <div className="bg-white/8 rounded-lg p-3 border border-white/5">
              <p className="text-[11px] text-emerald-200 uppercase tracking-wide mb-1">Tempat</p>
              <p className="text-sm font-semibold">{kegiatan.tempat || '-'}</p>
            </div>
            <div className="bg-white/8 rounded-lg p-3 border border-white/5">
              <p className="text-[11px] text-emerald-200 uppercase tracking-wide mb-1">Total RAB</p>
              <p className="text-sm font-semibold">{formatCurrency(kegiatan.total_anggaran)}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Tips Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4 flex gap-3">
          <Info className="size-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900 mb-1">Panduan Pengisian LPJ</p>
            <p className="text-xs text-blue-700 leading-relaxed">
              Isi realisasi penggunaan anggaran pada kolom <strong>"Realisasi LPJ"</strong> untuk setiap item RAB.
              Kolom <strong>"Rencana KAK"</strong> menampilkan nilai yang direncanakan dan tidak dapat diubah.
              Upload bukti kuitansi/nota untuk setiap item (format: JPG, PNG, PDF, maks 5MB).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* RAB Categories with Realisasi */}
      {categories.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="py-16 text-center">
            <Package className="size-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400">Tidak ada data RAB untuk kegiatan ini.</p>
          </CardContent>
        </Card>
      ) : (
        categories.map(([kategori, group]) => {
          const colors = CATEGORY_COLORS[kategori] || CATEGORY_COLORS.barang;
          const Icon = CATEGORY_ICONS[kategori] || Package;
          const isCollapsed = collapsed[kategori] || false;

          let catKak = 0;
          let catReal = 0;
          group.items.forEach(item => {
            catKak += parseFloat(String(item.total)) || 0;
            catReal += calcRealisasiTotal(item.id);
          });

          return (
            <Card key={kategori} className={`shadow-sm overflow-hidden ${colors.border}`}>
              {/* Category Header */}
              <div
                className={`bg-gradient-to-r ${colors.header} text-white px-5 py-3.5 flex items-center justify-between cursor-pointer hover:opacity-95 transition-opacity`}
                onClick={() => setCollapsed(prev => ({ ...prev, [kategori]: !isCollapsed }))}
              >
                <div className="flex items-center gap-3">
                  <Icon className="size-5" />
                  <span className="font-semibold text-[15px]">{group.label}</span>
                  <span className="bg-white/20 text-white/90 text-xs px-2.5 py-0.5 rounded-full font-medium">
                    {group.items.length} item
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-xs hidden sm:block">
                    <span className="text-white/70">Subtotal: </span>
                    <span className="font-bold">{formatCurrency(catReal)}</span>
                  </div>
                  {isCollapsed ? <ChevronDown className="size-5" /> : <ChevronUp className="size-5" />}
                </div>
              </div>

              {/* Category Items */}
              {!isCollapsed && (
                <div className="divide-y divide-slate-100">
                  {group.items.map((item, idx) => {
                    const realTotal = calcRealisasiTotal(item.id);
                    const kakTotal = parseFloat(String(item.total)) || 0;
                    const rabFiles = existingFiles[item.id] || [];
                    const rabNewFiles = newFiles[item.id] || [];
                    const totalItemFiles = rabFiles.length + rabNewFiles.length;

                    return (
                      <div key={item.id} className="p-5 hover:bg-slate-50/50 transition-colors">
                        {/* Item Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-800">{idx + 1}. {item.uraian}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {totalItemFiles > 0 && (
                              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                                {totalItemFiles} file
                              </span>
                            )}
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${colors.badge}`}>
                              {formatCurrency(kakTotal)}
                            </span>
                          </div>
                        </div>

                        {/* Side-by-side: KAK Plan vs Realisasi */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                          {/* KAK Plan (Read-only) */}
                          <div className="bg-sky-50/70 rounded-xl p-4 border border-sky-100">
                            <p className="text-xs font-bold text-sky-700 mb-3 flex items-center gap-1.5 uppercase tracking-wide">
                              <FileText className="size-3.5" /> Rencana KAK
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                              <FieldDisplay label="Vol 1" value={item.qty1} />
                              <FieldDisplay label="Satuan 1" value={item.satuan1} />
                              <FieldDisplay label="Vol 2" value={item.qty2 || '-'} />
                              <FieldDisplay label="Satuan 2" value={item.satuan2 || '-'} />
                              {(item.qty3 != null && item.qty3 !== 0) && (
                                <>
                                  <FieldDisplay label="Vol 3" value={item.qty3} />
                                  <FieldDisplay label="Satuan 3" value={item.satuan3 || '-'} />
                                </>
                              )}
                              <FieldDisplay label="Harga Satuan" value={formatCurrency(item.harga_satuan)} />
                              <FieldDisplay label="Total" value={formatCurrency(kakTotal)} className="font-bold" />
                            </div>
                          </div>

                          {/* Realisasi (Editable) */}
                          <div className="bg-emerald-50/70 rounded-xl p-4 border border-emerald-100">
                            <p className="text-xs font-bold text-emerald-700 mb-3 flex items-center gap-1.5 uppercase tracking-wide">
                              <CheckCircle className="size-3.5" /> Realisasi LPJ
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                              <FieldInput
                                label="Vol 1" type="number"
                                value={realisasi[item.id]?.qty1 ?? ''}
                                onChange={v => updateRealisasi(item.id, 'qty1', v)}
                                disabled={!canSubmit}
                              />
                              <FieldInput
                                label="Satuan 1" type="text"
                                value={realisasi[item.id]?.satuan1 ?? ''}
                                onChange={v => updateRealisasi(item.id, 'satuan1', v)}
                                disabled={!canSubmit}
                              />
                              <FieldInput
                                label="Vol 2" type="number"
                                value={realisasi[item.id]?.qty2 ?? ''}
                                onChange={v => updateRealisasi(item.id, 'qty2', v)}
                                disabled={!canSubmit}
                              />
                              <FieldInput
                                label="Satuan 2" type="text"
                                value={realisasi[item.id]?.satuan2 ?? ''}
                                onChange={v => updateRealisasi(item.id, 'satuan2', v)}
                                disabled={!canSubmit}
                              />
                              {(item.qty3 != null && item.qty3 !== 0) && (
                                <>
                                  <FieldInput
                                    label="Vol 3" type="number"
                                    value={realisasi[item.id]?.qty3 ?? ''}
                                    onChange={v => updateRealisasi(item.id, 'qty3', v)}
                                    disabled={!canSubmit}
                                  />
                                  <FieldInput
                                    label="Satuan 3" type="text"
                                    value={realisasi[item.id]?.satuan3 ?? ''}
                                    onChange={v => updateRealisasi(item.id, 'satuan3', v)}
                                    disabled={!canSubmit}
                                  />
                                </>
                              )}
                              <FieldInput
                                label="Harga Satuan" type="number"
                                value={realisasi[item.id]?.harga_satuan ?? ''}
                                onChange={v => updateRealisasi(item.id, 'harga_satuan', v)}
                                disabled={!canSubmit}
                              />
                              <div className="flex flex-col">
                                <span className="text-[10px] text-emerald-600 font-medium uppercase mb-1">Total</span>
                                <div className="bg-emerald-100 border border-emerald-200 rounded-md px-2.5 py-[7px] text-xs font-bold text-emerald-800">
                                  {formatCurrency(realTotal)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* File Upload Section */}
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5 uppercase tracking-wide">
                              <Upload className="size-3.5" /> Bukti / Kuitansi
                            </p>
                            {canSubmit && (
                              <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg px-3 py-1.5 transition-colors">
                                <Upload className="size-3.5" />
                                Upload File
                                <input
                                  ref={el => { fileRefs.current[item.id] = el; }}
                                  type="file"
                                  className="hidden"
                                  accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx"
                                  multiple
                                  onChange={e => handleFileSelect(item.id, e.target.files)}
                                />
                              </label>
                            )}
                          </div>

                          {/* Existing Files */}
                          {rabFiles.length > 0 && (
                            <div className="space-y-1.5 mb-2">
                              {rabFiles.map(file => {
                                const isImage = file.url.match(/\\.(jpeg|jpg|gif|png)$/i);
                                return (
                                <div key={file.file_id} className="flex flex-col bg-white rounded-lg px-3 py-2 border border-slate-100 group">
                                  <div className="flex items-center gap-2">
                                    <FileText className="size-4 text-slate-400 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-slate-700 truncate">{file.original_name}</p>
                                      <p className="text-[10px] text-slate-400">{formatFileSize(file.file_size)}</p>
                                    </div>
                                    {canSubmit && (
                                      <button
                                        onClick={() => removeExistingFile(item.id, file.file_id)}
                                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all p-1 rounded hover:bg-red-50"
                                        title="Hapus file"
                                      >
                                        <Trash2 className="size-3.5" />
                                      </button>
                                    )}
                                  </div>
                                  {isImage && (
                                    <div className="mt-2 rounded bg-slate-50 border border-slate-100 p-1">
                                      <img src={file.url} alt={file.original_name} className="max-w-full max-h-32 object-contain rounded mx-auto" />
                                    </div>
                                  )}
                                </div>
                              )})}
                            </div>
                          )}

                          {/* New Files (pending upload) */}
                          {rabNewFiles.length > 0 && (
                            <div className="space-y-1.5 mb-2">
                              {rabNewFiles.map((file, fi) => (
                                <div key={fi} className="flex items-center gap-2 bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-100 group">
                                  <Upload className="size-4 text-emerald-500 shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-emerald-700 truncate">{file.name}</p>
                                    <p className="text-[10px] text-emerald-500">{formatFileSize(file.size)} • Baru</p>
                                  </div>
                                  <button
                                    onClick={() => removeNewFile(item.id, fi)}
                                    className="text-red-400 hover:text-red-600 transition-all p-1 rounded hover:bg-red-50"
                                    title="Batal upload"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {totalItemFiles === 0 && (
                            <p className="text-xs text-slate-400 text-center py-2">Belum ada file bukti.</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })
      )}

      {/* IKU Capaian Card */}
      {ikuList.length > 0 && (
        <Card className="shadow-sm overflow-hidden border-teal-200">
          <div className="bg-gradient-to-r from-teal-700 to-teal-800 px-5 py-3.5 flex items-center gap-3 text-white">
            <Target className="size-5" />
            <span className="font-semibold text-[15px]">Capaian IKU (Indikator Kinerja Utama)</span>
            <span className="bg-white/20 text-white/90 text-xs px-2.5 py-0.5 rounded-full font-medium">
              {ikuList.length} IKU
            </span>
          </div>
          <CardContent className="p-5">
            <div className="bg-teal-50/60 border border-teal-100 rounded-xl p-4 mb-5">
              <div className="flex items-start gap-2">
                <Info className="size-4 text-teal-600 shrink-0 mt-0.5" />
                <p className="text-xs text-teal-800 leading-relaxed">
                  Isi persentase <strong>capaian aktual</strong> untuk setiap IKU kegiatan ini.
                  Nilai ini digunakan untuk menghitung skor <strong>C3 (Kesesuaian Output IKU)</strong> pada SPK MOORA.
                  Capaian &ge; target akan menghasilkan skor 100, di bawah target menghasilkan skor 0.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              {ikuList.map((iku, idx) => {
                const capaianVal = ikuCapaian[iku.id] ?? '';
                const target = iku.target_persen ?? 0;
                const capaianNum = parseFloat(capaianVal);
                const ratio = !isNaN(capaianNum) && target > 0 ? capaianNum / target : null;
                const tercapai = ratio !== null && ratio >= 1;
                const isEmpty = capaianVal === '' || capaianVal == null;

                return (
                  <div
                    key={iku.id}
                    className={`rounded-xl border p-4 transition-all ${
                      isEmpty
                        ? 'border-slate-200 bg-white'
                        : tercapai
                        ? 'border-emerald-200 bg-emerald-50/60'
                        : 'border-amber-200 bg-amber-50/60'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      {/* Label */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-0.5">IKU {idx + 1}</p>
                        <p className="font-semibold text-slate-800 text-sm leading-snug">{iku.nama_iku}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Target: <span className="font-bold text-teal-700">{iku.target_persen != null ? `${iku.target_persen}%` : '-'}</span>
                        </p>
                      </div>

                      {/* Capaian Input */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex flex-col items-end">
                          <label className="text-[10px] text-teal-700 font-bold uppercase tracking-wider mb-1">
                            Capaian Aktual (%)
                          </label>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              max="200"
                              step="0.01"
                              className={`w-28 border rounded-lg px-3 py-2 text-sm font-bold text-center focus:outline-none focus:ring-2 transition-all disabled:bg-slate-100 disabled:text-slate-400 ${
                                isEmpty
                                  ? 'border-slate-300 focus:ring-teal-400 focus:border-teal-400'
                                  : tercapai
                                  ? 'border-emerald-400 bg-emerald-50 text-emerald-800 focus:ring-emerald-400'
                                  : 'border-amber-400 bg-amber-50 text-amber-800 focus:ring-amber-400'
                              }`}
                              placeholder="0"
                              value={capaianVal}
                              onChange={(e) =>
                                setIkuCapaian((prev) => ({ ...prev, [iku.id]: e.target.value }))
                              }
                              disabled={!canSubmit}
                            />
                            <span className="text-sm font-semibold text-slate-500">%</span>
                          </div>
                        </div>

                        {/* Status badge */}
                        <div className="w-20 text-center">
                          {!isEmpty && ratio !== null ? (
                            <span
                              className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full ${
                                tercapai
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {tercapai ? '✓ Tercapai' : '✗ Belum'}
                            </span>
                          ) : (
                            <span className="inline-block text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-400">
                              Belum diisi
                            </span>
                          )}
                          {!isEmpty && ratio !== null && (
                            <p className="text-[10px] text-slate-500 mt-1">
                              Rasio: <span className="font-bold">{(ratio * 100).toFixed(0)}%</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Card */}
      <Card className="shadow-md border-slate-200 overflow-hidden">
        <CardHeader className="bg-slate-50/80 border-b px-6 py-4">
          <CardTitle className="text-base">Ringkasan Anggaran</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-sky-50 rounded-xl p-4 border border-sky-100 text-center">
              <p className="text-xs text-sky-600 font-medium uppercase tracking-wide mb-1">Total Rencana (KAK)</p>
              <p className="text-lg font-bold text-sky-800">{formatCurrency(totalKak)}</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 text-center">
              <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide mb-1">Total Realisasi (LPJ)</p>
              <p className="text-lg font-bold text-emerald-800">{formatCurrency(totalRealisasi)}</p>
            </div>
            <div className={`rounded-xl p-4 border text-center ${selisih > 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
              <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${selisih > 0 ? 'text-red-600' : 'text-green-600'}`}>Selisih</p>
              <p className={`text-lg font-bold ${selisih > 0 ? 'text-red-800' : 'text-green-800'}`}>
                {selisih > 0 ? '+' : ''}{formatCurrency(Math.abs(selisih))}
              </p>
            </div>
          </div>

          {/* File Counter */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Total File Bukti</span>
              </div>
              <span className={`text-sm font-bold ${totalAllFiles() > 0 ? 'text-emerald-700' : 'text-red-500'}`}>
                {totalAllFiles()} file
              </span>
            </div>
          </div>

          {/* Catatan */}
          <div>
            <Label className="text-sm font-medium text-slate-700">Catatan Pengusul</Label>
            <textarea
              className="mt-2 w-full min-h-[100px] rounded-lg border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none resize-none transition-all"
              placeholder="Tuliskan catatan atau keterangan tambahan untuk LPJ ini..."
              value={catatan}
              onChange={e => setCatatan(e.target.value)}
              disabled={!canSubmit}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {canSubmit && (
        <div className="flex justify-end gap-3 sticky bottom-4 bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-slate-200 shadow-lg">
          <Button variant="outline" onClick={() => navigate(-1)} className="px-6">
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-emerald-700 hover:bg-emerald-800 px-8 text-white shadow-md hover:shadow-lg transition-all"
          >
            {isSubmitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : <FileUp className="size-4 mr-2" />}
            {isSubmitting ? 'Mengirim LPJ...' : 'Submit LPJ'}
          </Button>
        </div>
      )}
    </div>
  );
}

// ---- Sub-components ----

function FieldDisplay({ label, value, className = '' }: { label: string; value: any; className?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] text-sky-600 font-medium uppercase mb-1">{label}</span>
      <div className={`bg-sky-100/70 border border-sky-200 rounded-md px-2.5 py-[7px] text-xs text-sky-800 ${className}`}>
        {value ?? '-'}
      </div>
    </div>
  );
}

function FieldInput({ label, value, onChange, type, disabled }: {
  label: string;
  value: any;
  onChange: (val: any) => void;
  type: 'text' | 'number';
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] text-emerald-600 font-medium uppercase mb-1">{label}</span>
      <input
        type={type}
        className="bg-white border border-emerald-200 rounded-md px-2.5 py-[6px] text-xs text-slate-800 focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400 focus:outline-none transition-all disabled:bg-slate-100 disabled:text-slate-400"
        value={value}
        onChange={e => onChange(type === 'number' ? e.target.value : e.target.value)}
        disabled={disabled}
        step={type === 'number' ? 'any' : undefined}
      />
    </div>
  );
}
