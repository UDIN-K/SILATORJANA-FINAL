import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { apiGetKegiatan, apiGetUser, apiListUsers, apiUpdateKegiatan } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, X, AlertCircle, Loader2, User, FileText, DollarSign, Target, Info } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency } from '@/lib/helpers';
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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

export function VerifikasiDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [activeTab, setActiveTab] = useState<'info'|'pengusul'|'kak'|'rab'|'iku'>('info');
  const [data, setData] = useState<any>(null);
  const [rabData, setRabData] = useState<any[]>([]);
  const [kakData, setKakData] = useState<any>(null);
  const [ikuData, setIkuData] = useState<any[]>([]);
  const [pengusulData, setPengusulData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [catatan, setCatatan] = useState('');
  const [kodeMak, setKodeMak] = useState('');
  const [showMakModal, setShowMakModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;
        const kegiatan = await apiGetKegiatan(id);
        setData(kegiatan);

        // Fetch KAK
        const kakList = await apiGetKegiatan(id).then((r: any) => ({documents: r.kak ? [r.kak] : []}));
        if (kakList.documents.length > 0) setKakData(kakList.documents[0]);

        // Fetch IKU (multiple)
        const ikuList = await apiGetKegiatan(id).then((r: any) => ({documents: r.iku || []}));
        setIkuData(ikuList.documents);

        // Fetch RAB
        const rabList = await apiGetKegiatan(id).then((r: any) => ({documents: r.rab || []}));
        setRabData(rabList.documents);

        // Fetch Pengusul info
        if (kegiatan.pengusul_id) {
          try {
            const userDoc = await apiGetUser(kegiatan.pengusul_id);
            setPengusulData(userDoc);
          } catch (err) {
            console.error('Error fetching proposer details', err);
          }
        }

      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const updateStatus = async (status: string, kodeMakParam?: string) => {
    if (!id) return;
    setIsUpdating(true);
    try {
      const updateData: Record<string, any> = { status };
      // Save catatan if rejecting
      if (status === 'rejected' && catatan.trim()) {
        updateData.catatan_revisi = catatan.trim();
      }
      if (kodeMakParam) {
        updateData.kode_mak = kodeMakParam;
      }
      await apiUpdateKegiatan(id, updateData);
      navigate('/dashboard/verifikator');
    } catch (error: any) {
      alert("Gagal mengupdate status: " + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper: format date
  const fmt = (d: string | null | undefined) => {
    if (!d) return '-';
    try { return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return d; }
  };

  // Helper: RAB total per item
  const rabItemTotal = (item: any) => {
    const q1 = item.qty1 || 0, q2 = item.qty2 || 1, q3 = item.qty3 || 0, h = item.harga_satuan || 0;
    if (item.total && item.total > 0) return item.total;
    return q3 > 0 ? q1 * q2 * q3 * h : q1 * q2 * h;
  };

  // Group RAB by kategori
  const rabGrouped = rabData.reduce((acc: Record<string, any[]>, item) => {
    const kat = item.kategori || 'lainnya';
    if (!acc[kat]) acc[kat] = [];
    acc[kat].push(item);
    return acc;
  }, {});

  const kategoriLabels: Record<string, string> = {
    barang: 'Belanja Barang',
    jasa: 'Belanja Jasa',
    perjalanan: 'Belanja Perjalanan',
  };

  if (isLoading) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto size-8 text-emerald-700" /></div>;
  if (!data) return <div className="p-8 text-center text-red-500">Data tidak ditemukan</div>;

  const grandTotal = rabData.reduce((acc, item) => acc + rabItemTotal(item), 0);

  const tabs = [
    { id: 'info', label: 'Info Kegiatan', icon: Info },
    { id: 'pengusul', label: 'Pengusul', icon: User },
    { id: 'kak', label: 'KAK', icon: FileText },
    { id: 'rab', label: 'RAB', icon: DollarSign },
    { id: 'iku', label: 'IKU', icon: Target },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 md:pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-b border-slate-100/60 pb-4">
        <Button variant="outline" size="icon" onClick={() => navigate('/dashboard/verifikator')} className="shrink-0 rounded-xl h-10 w-10 border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100/50 shadow-sm transition-all">
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-800">Pemeriksaan Usulan</h2>
          <p className="text-slate-500 text-[14px] sm:text-[15px] font-medium tracking-tight mt-1">{data.nama_kegiatan}</p>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex bg-slate-100/50 rounded-xl border border-slate-200/60 p-1.5 gap-1.5 overflow-x-auto shadow-sm scrollbar-none">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-[11px] sm:text-[13px] font-bold uppercase tracking-wider rounded-lg transition-all whitespace-nowrap text-center flex items-center justify-center gap-2 ${
              activeTab === tab.id 
                ? 'bg-[#047857] text-white shadow-md shadow-emerald-700/20 translate-y-0' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-white border border-transparent hover:border-slate-200/60 hover:shadow-sm'
            }`}
          >
            <tab.icon className={`size-3.5 sm:size-4 ${activeTab === tab.id ? 'opacity-100' : 'opacity-70'}`} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8">
        {/* Detail Content Tab */}
        <div className="md:col-span-2 space-y-6">
          
          {/* ===== INFO TAB ===== */}
          {activeTab === 'info' && (
            <Card className="shadow-sm border-slate-200/60 bg-white overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
              <CardHeader className="border-b border-slate-100/60 bg-slate-50/30 py-4 px-4 sm:px-6 md:px-8">
                <CardTitle className="text-base text-slate-800 flex items-center gap-2.5"><Info className="size-5 text-blue-500"/> Informasi Utama</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 md:p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                  <div className="space-y-4 sm:space-y-6">
                    <InfoRow label="Nama Terdaftar Kegiatan" value={data.nama_kegiatan} />
                    <InfoRow label="Kategori / Jenis Kegiatan" value={data.jenis_kegiatan} />
                    <InfoRow label="Tanggal Penyelenggaraan" value={fmt(data.tanggal_kegiatan)} />
                    <InfoRow label="Lokasi Penyelenggaraan" value={data.tempat} />
                  </div>
                  <div className="space-y-4 sm:space-y-6">
                    <InfoRow label="Jurusan Terkait" value={data.nama_jurusan} />
                    <InfoRow label="Organisasi / Nama Pengusul" value={data.pengusul_nama || data.pengusul_organisasi} />
                    <InfoRow label="Tujuan Verifikasi (Verifikator)" value={(data.verifikator_target || '').replace('wadir', 'Wadir ')} />
                    {data.kode_mak && <InfoRow label="Kode MAK" value={data.kode_mak} />}
                    <div>
                      <Label className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-1.5 block">Status Dokumen</Label>
                      <div className="mt-1 inline-block"><StatusBadge status={data.status} /></div>
                    </div>
                  </div>
                </div>
                {data.deskripsi && (
                  <div className="pt-6 border-t border-slate-100/80">
                    <Label className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-2 block">Deskripsi Pendek / Latar Belakang</Label>
                    <p className="text-[14px] sm:text-[15px] text-slate-700 leading-relaxed bg-slate-50/80 p-4 rounded-xl border border-slate-100/60 shadow-sm">
                      {data.deskripsi}
                    </p>
                  </div>
                )}
                <div className="pt-6 border-t border-slate-100/80 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 bg-slate-50/40 p-4 rounded-xl">
                  <InfoRow label="Timestamp Dibuat" value={fmt(data.created_at)} />
                  <InfoRow label="Timestamp Terakhir Perubahan" value={fmt(data.updated_at)} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* ===== PENGUSUL TAB ===== */}
          {activeTab === 'pengusul' && (
            <Card className="shadow-sm border-slate-200/60 bg-white overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-violet-500"></div>
              <CardHeader className="border-b border-slate-100/60 bg-slate-50/30 py-4 px-4 sm:px-6 md:px-8">
                <CardTitle className="text-base text-slate-800 flex items-center gap-2.5"><User className="size-5 text-violet-500"/> Profil Pengusul Dokumen</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 md:p-8">
                {pengusulData ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                    <div className="space-y-4 sm:space-y-6">
                      <InfoRow label="Nama Lengkap Terdaftar" value={pengusulData.nama} />
                      <InfoRow label="Alamat Surel (Email)" value={pengusulData.email} />
                      <InfoRow label="Nomor Induk Pegawai (NIP)" value={pengusulData.nip} />
                      <InfoRow label="Akses Peran (Role)" value={pengusulData.role} />
                    </div>
                    <div className="space-y-4 sm:space-y-6">
                      <InfoRow label="Unit Jurusan Terhubung" value={pengusulData.jurusan || data.nama_jurusan} />
                      <InfoRow label="Asal Organisasi" value={data.pengusul_organisasi} />
                      <InfoRow label="Tanggal Tercatat Pengajuan" value={fmt(data.created_at)} />
                      <InfoRow label="Tanggal Terakhir Update" value={fmt(data.updated_at)} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                     <div className="text-amber-700 bg-amber-50/70 p-4 rounded-xl border border-amber-200/50 shadow-sm flex items-start gap-3 sm:gap-4">
                        <AlertCircle className="size-5 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-xs sm:text-sm font-medium leading-relaxed">Profil pengguna sistem lengkap tidak tersedia karena belum didaftarkan di database Users. Menampilkan riwayat entri publik dari formulir kegiatan.</p>
                     </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                      <InfoRow label="Nama Formulir Pengusul" value={data.pengusul_nama} />
                      <InfoRow label="Asal Organisasi" value={data.pengusul_organisasi} />
                      <InfoRow label="Unit Jurusan Terhubung" value={data.nama_jurusan} />
                      <InfoRow label="Tanggal Tercatat Pengajuan" value={fmt(data.created_at)} />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ===== KAK TAB ===== */}
          {activeTab === 'kak' && (
            <Card className="shadow-sm border-slate-200/60 bg-white overflow-hidden relative">
               <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
              <CardHeader className="border-b border-slate-100/60 bg-slate-50/30 py-4 px-4 sm:px-6 md:px-8">
                <CardTitle className="text-base text-slate-800 flex items-center gap-2.5"><FileText className="size-5 text-indigo-500"/> Rincian Kerangka Acuan (KAK)</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 md:space-y-8">
                {kakData ? (
                  <>
                    <KakField label="Gambaran Umum Operasional" value={kakData.gambaran_umum} color="indigo" />
                    <KakField label="Daftar Penerima Manfaat" value={kakData.penerima_manfaat} color="purple" />
                    <KakField label="Rencana Strategi Pencapaian" value={kakData.strategi_pencapaian} color="blue" />
                    <KakField label="Arahan Metode Pelaksanaan" value={kakData.metode_pelaksanaan} color="sky" />
                    <KakField label="Alur Tahapan Pelaksanaan (Timeline)" value={kakData.tahapan_pelaksanaan} color="cyan" />
                    {kakData.indikator_kinerja && (
                      <div className="border-t border-slate-100/80 pt-6">
                        <Label className="text-slate-500 text-xs uppercase tracking-wider mb-2 block font-semibold">Tahapan Indikator Kinerja</Label>
                        {(() => {
                          const indicators = parseIndikatorKinerja(kakData.indikator_kinerja);
                          if (indicators.length === 0) return <p className="text-sm text-slate-500">-</p>;
                          const isTabular = indicators.some(i => i.bulan || i.target);
                          if (!isTabular) {
                            return <p className="text-xs sm:text-sm text-slate-800 leading-relaxed bg-slate-50/80 p-3.5 sm:p-4 rounded-xl border border-slate-200/60">{indicators[0]?.indikator || '-'}</p>;
                          }
                          return (
                            <div className="border border-slate-200/85 rounded-xl overflow-hidden shadow-sm max-w-2xl mt-1.5">
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left whitespace-nowrap sm:whitespace-normal">
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
                                        <td className="px-3 py-2 text-slate-600 break-words max-w-xs">{item.indikator || '-'}</td>
                                        <td className="px-3 py-2 text-center font-semibold text-emerald-600 bg-emerald-50/30">{item.target ? `${item.target}%` : '-'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                    {(kakData.kurun_waktu_mulai || kakData.kurun_waktu_selesai) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-6 border-t border-slate-100/80 bg-slate-50/50 p-4 sm:p-6 rounded-2xl">
                        <InfoRow label="Perkiraan Tanggal Mulai Pelaksanaan" value={fmt(kakData.kurun_waktu_mulai)} />
                        <InfoRow label="Perkiraan Tanggal Akhir Pelaksanaan" value={fmt(kakData.kurun_waktu_selesai)} />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                     <div className="w-16 h-16 mb-4 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                        <FileText className="size-6 text-slate-300" />
                     </div>
                     <p className="font-semibold text-slate-800 text-lg">Dokumen KAK Belum Dibuat</p>
                     <p className="text-slate-500 mt-1 max-w-sm">Pengusul belum mengisi entri Kerangka Acuan Kerja untuk usulan ini.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ===== RAB TAB ===== */}
          {activeTab === 'rab' && (
            <Card className="shadow-sm border-slate-200/60 bg-white overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
              <CardHeader className="border-b border-slate-100/60 bg-slate-50/30 py-5 px-4 sm:px-6 md:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <CardTitle className="text-base text-slate-800 flex items-center gap-2.5"><DollarSign className="size-5 text-emerald-500"/> Ringkasan Anggaran (RAB)</CardTitle>
                <div className="bg-emerald-50 border border-emerald-200/60 px-4 py-2 rounded-xl text-emerald-800 font-bold shadow-sm text-sm shrink-0">
                  Grand Total Estimasi: {formatCurrency(grandTotal)}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {Object.keys(rabGrouped).length > 0 ? Object.entries(rabGrouped).map(([kat, items]) => {
                  const katLabel = kategoriLabels[kat] || items[0]?.kategori_label || kat;
                  const subtotal = (items as any[]).reduce((s: number, i: any) => s + rabItemTotal(i), 0);
                  return (
                    <div key={kat} className="border-b border-slate-100/80 last:border-0 m-2 sm:m-4 md:m-6 ring-1 ring-slate-200/60 rounded-2xl overflow-hidden shadow-sm">
                      <div className="px-4 sm:px-5 py-3 bg-slate-50/80 border-b border-slate-100/80 flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-600 block">{katLabel}</span>
                        <span className="text-[11px] sm:text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded shadow-sm border border-slate-200/50">{(items as any[]).length} Entri</span>
                      </div>
                      
                      {/* Desktop Table View */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-white border-b border-slate-100/60 text-slate-400 text-xs font-bold uppercase tracking-wider">
                            <tr>
                              <th className="px-5 py-3.5 text-left">Deskripsi Uraian</th>
                              <th className="px-5 py-3.5 text-center w-16">Vol 1</th>
                              <th className="px-5 py-3.5 text-center w-16">Vol 2</th>
                              <th className="px-5 py-3.5 text-center w-16">Vol 3</th>
                              <th className="px-5 py-3.5 text-right w-36">Tarif Satuan</th>
                              <th className="px-5 py-3.5 text-right w-36">Nilai Akumulasi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100/50">
                            {(items as any[]).map((item: any, idx: number) => (
                              <tr key={idx} className="bg-white hover:bg-slate-50/40 transition-colors">
                                <td className="px-5 py-4 text-slate-800 font-medium">{item.uraian}</td>
                                <td className="px-5 py-4 text-center text-slate-500 font-semibold">{item.qty1}{item.satuan1 ? ` ${item.satuan1}` : ''}</td>
                                <td className="px-5 py-4 text-center text-slate-500 font-semibold">{item.qty2 || '-'}</td>
                                <td className="px-5 py-4 text-center text-slate-500 font-semibold">{item.qty3 || '-'}</td>
                                <td className="px-5 py-4 text-right text-slate-500">{formatCurrency(item.harga_satuan)}</td>
                                <td className="px-5 py-4 text-right font-bold text-slate-800 bg-slate-50/30">{formatCurrency(rabItemTotal(item))}</td>
                              </tr>
                            ))}
                            <tr className="bg-slate-50/80 border-t border-slate-200/60">
                              <td colSpan={5} className="px-5 py-4 text-right text-[11px] uppercase tracking-widest font-extrabold text-slate-500">Subtotal Kelompok {katLabel}</td>
                              <td className="px-5 py-4 text-right font-black text-slate-800 text-[15px]">{formatCurrency(subtotal)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Card-List View */}
                      <div className="block md:hidden divide-y divide-slate-100 bg-white">
                        {(items as any[]).map((item: any, idx: number) => (
                          <div key={idx} className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <span className="font-semibold text-slate-800 text-[14px] leading-snug">{item.uraian}</span>
                              <span className="text-[11px] font-semibold text-slate-600 shrink-0 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/40">
                                {item.qty1}{item.satuan1 ? ` ${item.satuan1}` : ''}
                                {item.qty2 ? ` × ${item.qty2}` : ''}
                                {item.qty3 ? ` × ${item.qty3}` : ''}
                              </span>
                            </div>
                            <div className="flex items-center justify-between pt-1 border-t border-dashed border-slate-100 text-xs">
                              <span className="text-slate-400">Tarif Satuan</span>
                              <span className="text-slate-600 font-medium">{formatCurrency(item.harga_satuan)}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs sm:text-sm">
                              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Subtotal</span>
                              <span className="font-extrabold text-[#047857]">{formatCurrency(rabItemTotal(item))}</span>
                            </div>
                          </div>
                        ))}
                        <div className="bg-slate-50/80 p-4 border-t border-slate-200/60 flex items-center justify-between">
                          <span className="text-[11px] uppercase tracking-widest font-extrabold text-slate-500">Subtotal {katLabel}</span>
                          <span className="font-black text-slate-800 text-[14px] sm:text-[15px]">{formatCurrency(subtotal)}</span>
                        </div>
                      </div>

                    </div>
                  );
                }) : (
                   <div className="py-24 flex flex-col items-center justify-center text-center px-4">
                      <div className="w-16 h-16 mb-4 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                         <DollarSign className="size-6 text-slate-300" />
                      </div>
                      <p className="font-semibold text-slate-800 text-lg">Catatan Anggaran Belum Dibuat</p>
                      <p className="text-slate-500 mt-1 max-w-sm">Pengusul belum mengisi entri Rincian Anggaran Biaya untuk proposal ini.</p>
                   </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ===== IKU TAB ===== */}
          {activeTab === 'iku' && (
            <Card className="shadow-sm border-slate-200/60 bg-white overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-teal-500"></div>
              <CardHeader className="border-b border-slate-100/60 bg-slate-50/30 py-4 px-4 sm:px-6 md:px-8">
                <CardTitle className="text-base text-slate-800 flex items-center gap-2.5"><Target className="size-5 text-teal-500"/> Katalog Indikator Kinerja Utama (IKU)</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 md:p-8">
                {ikuData.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {ikuData.map((iku, idx) => (
                      <div key={idx} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-teal-300/50 transition-colors group">
                        <div className="mb-4">
                           <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center mb-3">
                              <Target className="size-4 text-teal-600" />
                           </div>
                           <p className="font-bold text-[14px] sm:text-[15px] text-slate-800 leading-snug group-hover:text-teal-800 transition-colors">{iku.nama_iku || iku.indikator || 'Entri IKU Tanpa Nama'}</p>
                           {iku.master_id && <p className="text-[10px] font-bold text-slate-400 mt-2 tracking-wider uppercase">Master Ref ID: <span className="text-slate-500">{iku.master_id}</span></p>}
                        </div>
                        {iku.target_persen != null && (
                          <div className="pt-3 border-t border-slate-100/80 flex items-end justify-between">
                            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Pencapaian Target</p>
                            <p className="text-xl sm:text-2xl font-black text-teal-600">{iku.target_persen}%</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                   <div className="py-20 flex flex-col items-center justify-center text-center px-4">
                      <div className="w-16 h-16 mb-4 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                         <Target className="size-6 text-slate-300" />
                      </div>
                      <p className="font-semibold text-slate-800 text-lg">Indikator Kinerja Kosong</p>
                      <p className="text-slate-500 mt-1 max-w-sm">Pengusul belum mendaftarkan sasaran KPI untuk memonitor progres kegiatan ini.</p>
                   </div>
                )}
              </CardContent>
            </Card>
          )}

        </div>

        {/* Panel Aksi */}
        {['submitted', 'revisi_done'].includes(data?.status) && (
          <div className="w-full space-y-6 select-none animate-in fade-in slide-in-from-bottom duration-300">
             <Card className="shadow-lg shadow-slate-200/50 border-slate-200/60 bg-white md:sticky md:top-24 rounded-2xl overflow-hidden">
              <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
              <CardHeader className="bg-slate-50/30 border-b border-slate-100/60 py-4 px-4 sm:p-5">
                 <CardTitle className="text-base sm:text-lg text-slate-800">Ruang Keputusan Akhir</CardTitle>
                 <CardDescription className="text-xs sm:text-sm font-medium text-slate-500">Berikan penilaian putusan verifikasi level Anda pada dokumen ini.</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                 <div className="space-y-2">
                    <Label htmlFor="catatan" className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#047857] font-semibold">Catatan Lampiran Opini</Label>
                    <textarea 
                      id="catatan"
                      value={catatan}
                      onChange={e => setCatatan(e.target.value)}
                      className="flex min-h-[90px] md:min-h-[120px] w-full rounded-xl border border-slate-200/80 bg-slate-50/50 px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-[14px] leading-relaxed shadow-inner placeholder:text-slate-450 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/10 focus-visible:border-emerald-500 focus-visible:bg-white transition-all resize-none"
                      placeholder="Tuliskan rekomendasi atau catatan alasan (opsional untuk disetujui, Wajib apabila diminta revisi atau ditolak)..."
                    />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-2.5 sm:gap-3 pt-1">
                    <Button 
                      disabled={isUpdating} 
                      onClick={() => setShowMakModal(true)} 
                      className="col-span-2 w-full bg-[#047857] hover:bg-[#065F46] shadow-md shadow-emerald-700/10 text-white h-11 md:h-12 rounded-xl font-bold transition-all active:scale-95 text-xs sm:text-[14px] flex items-center justify-center gap-2"
                    >
                       {isUpdating ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Verifikasi &amp; Setujui
                    </Button>
                    <Button 
                      disabled={isUpdating} 
                      onClick={() => navigate(`/dashboard/verifikator/revisi/${id}`)} 
                      className="w-full bg-amber-500 hover:bg-amber-600 shadow-sm text-white h-11 md:h-12 rounded-xl font-bold transition-all active:scale-95 text-xs sm:text-[14px] flex items-center justify-center gap-2"
                    >
                       {isUpdating ? <Loader2 className="size-4 animate-spin" /> : <AlertCircle className="size-4" />} Minta Revisi
                    </Button>
                    <Button 
                      disabled={isUpdating} 
                      onClick={() => updateStatus('rejected')} 
                      variant="outline" 
                      className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 h-11 md:h-12 rounded-xl border font-bold transition-all active:scale-95 text-xs sm:text-[14px] bg-white flex items-center justify-center gap-2"
                    >
                       {isUpdating ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />} Tolak Usulan
                    </Button>
                 </div>
              </CardContent>
           </Card>
        </div>
        )}
      </div>

      <Dialog open={showMakModal} onOpenChange={setShowMakModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Masukkan Kode MAK</DialogTitle>
            <DialogDescription>
              Kode MAK (Mata Anggaran Kegiatan) wajib diisi untuk menyetujui proposal ini.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="kodeMak" className="text-slate-700 font-semibold">
              Kode MAK <span className="text-red-500">*</span>
            </Label>
            <Input
              id="kodeMak"
              value={kodeMak}
              onChange={(e) => setKodeMak(e.target.value)}
              placeholder="Contoh: 1234.567.890"
              autoFocus
            />
          </div>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowMakModal(false)}
              className="mt-2 sm:mt-0"
              disabled={isUpdating}
            >
              Batal
            </Button>
            <Button
              type="button"
              className="bg-[#047857] hover:bg-[#065F46]"
              onClick={() => {
                if (!kodeMak.trim()) {
                  alert('Kode MAK wajib diisi!');
                  return;
                }
                setShowMakModal(false);
                updateStatus('waiting_surat_pengantar', kodeMak);
              }}
              disabled={!kodeMak.trim() || isUpdating}
            >
              {isUpdating ? <Loader2 className="size-4 animate-spin mr-2" /> : <Check className="size-4 mr-2" />}
              Setujui & Lanjutkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

// Helper components
function InfoRow({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <Label className="text-slate-500 text-xs uppercase tracking-wider">{label}</Label>
      <p className="font-medium text-slate-900 mt-1">{value || '-'}</p>
    </div>
  );
}

function KakField({ label, value, color = "slate" }: { label: string; value: string | null | undefined, color?: string }) {
  const colorMap: Record<string, string> = {
    indigo: "text-indigo-700 bg-indigo-50 border-indigo-200",
    purple: "text-purple-700 bg-purple-50 border-purple-200",
    blue: "text-blue-700 bg-blue-50 border-blue-200",
    sky: "text-sky-700 bg-sky-50 border-sky-200",
    cyan: "text-cyan-700 bg-cyan-50 border-cyan-200",
    slate: "text-slate-700 bg-slate-50 border-slate-200",
  };
  const c = colorMap[color] || colorMap.slate;

  return (
    <div>
      <Label className="text-slate-500 text-xs uppercase tracking-wider">{label}</Label>
      <p className={`text-sm mt-1.5 leading-relaxed p-4 rounded-xl border ${c}`}>
        {value || 'Tidak ada data'}
      </p>
    </div>
  );
}
