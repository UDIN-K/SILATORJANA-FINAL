import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { apiGetKegiatan, apiGetUser, apiListUsers, apiUpdateKegiatan, apiGetLpjDetail } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, MapPin, User, FileText, CheckCircle, AlertTriangle, Target, Info, DollarSign, Check, X, Loader2, Eye } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency, getUserId } from '@/lib/helpers';

export function BendaharaDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [activeTab, setActiveTab] = useState<'info'|'pengusul'|'kak'|'rab'|'iku'|'lpj'>('info');
  const [data, setData] = useState<any>(null);
  const [rabData, setRabData] = useState<any[]>([]);
  const [kakData, setKakData] = useState<any>(null);
  const [ikuData, setIkuData] = useState<any[]>([]);
  const [pengusulData, setPengusulData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [catatan, setCatatan] = useState('');
  const [lpjData, setLpjData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;
        const kegiatan = await apiGetKegiatan(id);
        setData(kegiatan);

        // Fetch KAK
        const kakList = await apiGetKegiatan(id).then((r: any) => ({documents: r.kak ? [r.kak] : []}));
        if (kakList.documents.length > 0) setKakData(kakList.documents[0]);

        // Fetch IKU
        const ikuList = await apiGetKegiatan(id).then((r: any) => ({documents: r.iku || []}));
        setIkuData(ikuList.documents);

        // Fetch RAB
        const rabList = await apiGetKegiatan(id).then((r: any) => ({documents: r.rab || []}));
        setRabData(rabList.documents);

        // Fetch Pengusul info
        if (kegiatan.pengusul_id) {
          try {
            const userList = await apiListUsers();
            if (userList.documents.length > 0) setPengusulData(userList.documents[0]);
          } catch {
            // user_id from Laravel
            try {
              const userDoc = await apiGetUser(String(kegiatan.pengusul_id));
              setPengusulData(userDoc);
            } catch { /* skip */ }
          }
        }

        if (['lpj_submitted', 'lpj_approved', 'lpj_revision', 'lpj_done', 'completed'].includes(kegiatan.status?.toLowerCase())) {
          try {
            const lpjRes = await apiGetLpjDetail(id);
            setLpjData(lpjRes);
          } catch { /* skip */ }
        }

      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const updateStatus = async (status: string, catatanBaru?: string) => {
    if (!id) return;
    setIsUpdating(true);
    try {
      const updateData: Record<string, any> = { status };
      if (catatanBaru) {
        updateData.catatan_revisi = catatanBaru; // Store to database
      }
      await apiUpdateKegiatan(id, updateData);

      navigate('/dashboard/bendahara');
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

  if (['lpj_submitted', 'lpj_approved', 'lpj_revision', 'lpj_done', 'completed'].includes(data.status?.toLowerCase())) {
     tabs.push({ id: 'lpj', label: 'LPJ', icon: CheckCircle });
  }

  const canPencairan = ['approved_wadir', 'accepted_funds', 'disetujui_rektorat'].includes(data.status?.toLowerCase());
  const isMenungguLpj = data.status === 'menunggu_lpj' || data.status === 'lpj_submitted';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/bendahara')}>
          <ArrowLeft className="size-5 text-slate-500" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Detail Bendahara</h2>
          <p className="text-slate-500">Review Usulan, Pencairan, dan LPJ</p>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex bg-white rounded-lg border border-slate-200 p-1.5 gap-1 overflow-x-auto shadow-sm">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap text-center flex items-center justify-center gap-2 ${
              activeTab === tab.id 
                ? 'bg-emerald-700 text-white shadow' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Detail Content Tab */}
        <div className="md:col-span-2 space-y-6">
          
          {/* ===== INFO TAB ===== */}
          {activeTab === 'info' && (
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-lg">Informasi Kegiatan</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="Nama Kegiatan" value={data.nama_kegiatan} />
                  <InfoRow label="Jenis Kegiatan" value={data.jenis_kegiatan} />
                  <InfoRow label="Tanggal Kegiatan" value={fmt(data.tanggal_kegiatan)} />
                  <InfoRow label="Tempat" value={data.tempat} />
                  <InfoRow label="Jurusan" value={data.nama_jurusan} />
                  <InfoRow label="Pengusul" value={data.pengusul_nama || data.pengusul_organisasi} />
                  <InfoRow label="Verifikator Tujuan" value={(data.verifikator_target || '').replace('wadir', 'Wadir ')} />
                  <div>
                    <Label className="text-slate-500 text-xs uppercase tracking-wider">Status</Label>
                    <div className="mt-1"><StatusBadge status={data.status} /></div>
                  </div>
                </div>
                {data.deskripsi && (
                  <div className="pt-4 border-t border-slate-100">
                    <Label className="text-slate-500 text-xs uppercase tracking-wider">Deskripsi</Label>
                    <p className="text-sm text-slate-700 mt-1 leading-relaxed bg-slate-50 p-3 rounded border border-slate-100">
                      {data.deskripsi}
                    </p>
                  </div>
                )}
                <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                  <InfoRow label="Tanggal Dibuat" value={fmt(data.created_at)} />
                  <InfoRow label="Terakhir Diperbarui" value={fmt(data.updated_at)} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* ===== PENGUSUL TAB ===== */}
          {activeTab === 'pengusul' && (
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-lg">Informasi Pengusul</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {pengusulData ? (
                  <div className="grid grid-cols-2 gap-4">
                    <InfoRow label="Nama Lengkap" value={pengusulData.nama} />
                    <InfoRow label="Email" value={pengusulData.email} />
                    <InfoRow label="NIP" value={pengusulData.nip} />
                    <InfoRow label="Role" value={pengusulData.role} />
                    <InfoRow label="Jurusan" value={pengusulData.jurusan || data.nama_jurusan} />
                    <InfoRow label="Organisasi" value={data.pengusul_organisasi} />
                    <InfoRow label="Tanggal Pengajuan" value={fmt(data.created_at)} />
                    <InfoRow label="Terakhir Diupdate" value={fmt(data.updated_at)} />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <InfoRow label="Nama Pengusul" value={data.pengusul_nama} />
                    <InfoRow label="Organisasi" value={data.pengusul_organisasi} />
                    <InfoRow label="Jurusan" value={data.nama_jurusan} />
                    <InfoRow label="Tanggal Pengajuan" value={fmt(data.created_at)} />
                    <div className="col-span-2">
                      <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200/50 flex items-start gap-2">
                        <AlertTriangle className="size-4 shrink-0 mt-0.5" /> 
                        <span>Detail data user lengkap tidak ditemukan di database. Menampilkan data yang tersedia dari kegiatan.</span>
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ===== KAK TAB ===== */}
          {activeTab === 'kak' && (
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-lg">Kerangka Acuan Kerja (KAK)</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {kakData ? (
                  <>
                    <KakField label="Gambaran Umum" value={kakData.gambaran_umum} />
                    <KakField label="Penerima Manfaat" value={kakData.penerima_manfaat} />
                    <KakField label="Strategi Pencapaian" value={kakData.strategi_pencapaian} />
                    <KakField label="Metode Pelaksanaan" value={kakData.metode_pelaksanaan} />
                    <KakField label="Tahapan Pelaksanaan" value={kakData.tahapan_pelaksanaan} />
                    {(kakData.kurun_waktu_mulai || kakData.kurun_waktu_selesai) && (
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                        <InfoRow label="Kurun Waktu Mulai" value={fmt(kakData.kurun_waktu_mulai)} />
                        <InfoRow label="Kurun Waktu Selesai" value={fmt(kakData.kurun_waktu_selesai)} />
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-slate-500 text-sm">Tidak ada data KAK.</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* ===== IKU TAB ===== */}
          {activeTab === 'iku' && (
            <div className="space-y-6 animate-in fade-in duration-300">
               <CardTitle className="text-base text-slate-800 flex items-center gap-2.5"><Target className="size-5 text-teal-500"/> Katalog Indikator Kinerja Utama (IKU)</CardTitle>
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
                         <Target className="size-8 text-slate-300" />
                      </div>
                      <p className="text-slate-500 font-medium">Belum ada IKU yang ditambahkan.</p>
                      <p className="text-sm text-slate-400 mt-1 max-w-sm">Pengusul belum memilih indikator IKU untuk usulan ini.</p>
                   </div>
                )}
            </div>
           )}

          {/* ===== RAB TAB ===== */}
          {activeTab === 'rab' && (
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Rincian Anggaran Biaya (RAB)</CardTitle>
                <span className="text-sm font-semibold text-emerald-700">
                  Grand Total: {formatCurrency(grandTotal)}
                </span>
              </CardHeader>
              <CardContent className="p-0">
                {Object.keys(rabGrouped).length > 0 ? Object.entries(rabGrouped).map(([kat, items]) => {
                  const katLabel = kategoriLabels[kat] || items[0]?.kategori_label || kat;
                  const subtotal = (items as any[]).reduce((s: number, i: any) => s + rabItemTotal(i), 0);
                  return (
                    <div key={kat} className="border-b border-slate-100 last:border-0">
                      <div className="px-4 py-2 bg-emerald-50/60 border-b border-emerald-100">
                        <span className="text-sm font-semibold text-emerald-800 capitalize">{katLabel}</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-white border-b border-slate-100 text-slate-500">
                            <tr>
                              <th className="px-4 py-2 font-medium text-left">Uraian</th>
                              <th className="px-4 py-2 font-medium text-center">Qty1</th>
                              <th className="px-4 py-2 font-medium text-center">Qty2</th>
                              <th className="px-4 py-2 font-medium text-center">Qty3</th>
                              <th className="px-4 py-2 font-medium text-right">Harga</th>
                              <th className="px-4 py-2 font-medium text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(items as any[]).map((item: any, idx: number) => (
                              <tr key={idx} className="border-b border-slate-50">
                                <td className="px-4 py-2 text-slate-900">{item.uraian}</td>
                                <td className="px-4 py-2 text-center text-slate-600">{item.qty1}{item.satuan1 ? ` ${item.satuan1}` : ''}</td>
                                <td className="px-4 py-2 text-center text-slate-600">{item.qty2 || '-'}</td>
                                <td className="px-4 py-2 text-center text-slate-600">{item.qty3 || '-'}</td>
                                <td className="px-4 py-2 text-right text-slate-600">{formatCurrency(item.harga_satuan)}</td>
                                <td className="px-4 py-2 text-right font-medium text-slate-900">{formatCurrency(rabItemTotal(item))}</td>
                              </tr>
                            ))}
                            <tr className="bg-slate-50">
                              <td colSpan={5} className="px-4 py-2 text-right text-sm font-semibold text-slate-600">Subtotal {katLabel}</td>
                              <td className="px-4 py-2 text-right font-bold text-slate-800">{formatCurrency(subtotal)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="p-8 text-center text-slate-500">Tidak ada data RAB.</div>
                )}

                {Object.keys(rabGrouped).length > 0 && (
                  <div className="px-4 py-3 bg-emerald-700 text-white flex justify-between items-center">
                    <span className="font-semibold">Grand Total</span>
                    <span className="text-lg font-bold">{formatCurrency(grandTotal)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ===== IKU TAB ===== */}
          {activeTab === 'iku' && (
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-lg">Indikator Kinerja Utama (IKU)</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {ikuData.length > 0 ? (
                  <div className="space-y-3">
                    {ikuData.map((iku, idx) => (
                      <div key={idx} className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{iku.nama_iku || iku.indikator || 'IKU'}</p>
                          {iku.master_id && <p className="text-xs text-slate-500 mt-1">Master ID: {iku.master_id}</p>}
                        </div>
                        {iku.target_persen != null && (
                          <div className="text-right">
                            <p className="text-2xl font-bold text-emerald-700">{iku.target_persen}%</p>
                            <p className="text-xs text-slate-500">Target</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">Tidak ada data IKU.</p>
                )}
              </CardContent>
            </Card>
          )}
          {/* ===== LPJ TAB ===== */}
          {activeTab === 'lpj' && (
            <Card className="shadow-sm border-slate-200">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="size-4.5 text-emerald-600" /> Berkas Laporan Pertanggungjawaban (LPJ)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {!lpjData ? (
                  <p className="text-slate-500 text-sm">Data LPJ belum tersedia.</p>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(lpjData.rab || {}).map(([kat, group]: [string, any]) => (
                      <div key={kat} className="border border-slate-200 rounded-lg overflow-hidden">
                        <div className="bg-emerald-50/60 px-4 py-2 border-b border-emerald-100">
                          <span className="text-sm font-semibold text-emerald-800 capitalize">{group.label}</span>
                        </div>
                        <div className="p-4 space-y-4">
                          {group.items.map((item: any) => (
                            <div key={item.id} className="border border-slate-100 rounded-lg p-3 bg-white">
                              <p className="font-medium text-slate-800 text-sm mb-2">{item.uraian}</p>
                              {item.existing_files && item.existing_files.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                  {item.existing_files.map((file: any) => {
                                    const isImage = /\.(jpeg|jpg|gif|png|webp)$/i.test(file.url);
                                    return (
                                      <div key={file.file_id} className="border border-slate-200 rounded-lg overflow-hidden hover:border-emerald-400 transition-colors group">
                                        {isImage ? (
                                          <a href={file.url} target="_blank" rel="noreferrer">
                                            <img src={file.url} alt={file.original_name} className="w-full h-32 object-cover cursor-pointer" />
                                          </a>
                                        ) : (
                                          <a href={file.url} target="_blank" rel="noreferrer" className="w-full h-32 bg-slate-50 flex flex-col items-center justify-center text-slate-400 group-hover:text-emerald-500">
                                            <FileText className="size-10 mb-1" />
                                            <span className="text-xs uppercase font-semibold">{file.original_name.split('.').pop()}</span>
                                          </a>
                                        )}
                                        <div className="p-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-1">
                                          <span className="text-xs truncate flex-1" title={file.original_name}>{file.original_name}</span>
                                          <a href={file.url} download className="text-emerald-600 hover:text-emerald-800 shrink-0" title="Download">
                                            <Eye className="size-3.5" />
                                          </a>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-400 italic">Tidak ada berkas terlampir.</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

        </div>

        {/* Panel Aksi */}
        <div className="space-y-6">
           <Card className="shadow-sm border-slate-200 sticky top-20">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                 <CardTitle className="text-lg">Tindakan Bendahara</CardTitle>
                 <CardDescription>Pencairan Dana atau Verifikasi LPJ</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4 pt-6">
                 <div className="space-y-2">
                    <Label htmlFor="catatan">Catatan / Bukti Referensi</Label>
                    <textarea 
                      id="catatan"
                      value={catatan}
                      onChange={e => setCatatan(e.target.value)}
                      className="flex min-h-[100px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-600"
                      placeholder="Masukkan catatan (misal nomor referensi transfer, atau catatan revisi LPJ)..."
                    />
                 </div>
                 
                 <div className="flex flex-col gap-2 pt-2">
                    {canPencairan && (
                      <Button disabled={isUpdating} onClick={() => updateStatus('funds_disbursed', catatan)} className="w-full bg-blue-600 hover:bg-blue-700 h-10">
                         {isUpdating ? <Loader2 className="size-4 mr-2 animate-spin" /> : <DollarSign className="size-4 mr-2" />} Proses Pencairan Dana
                      </Button>
                    )}

                    {isMenungguLpj && (
                      <>
                        <Button disabled={isUpdating} onClick={() => updateStatus('lpj_approved', catatan)} className="w-full bg-emerald-600 hover:bg-emerald-700 h-10">
                          {isUpdating ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Check className="size-4 mr-2" />} Setujui LPJ
                        </Button>
                        <Button disabled={isUpdating} onClick={() => updateStatus('lpj_revision', catatan)} variant="outline" className="w-full text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700 h-10">
                          {isUpdating ? <Loader2 className="size-4 mr-2 animate-spin" /> : <AlertTriangle className="size-4 mr-2" />} Minta Revisi LPJ
                        </Button>
                      </>
                    )}

                    {!canPencairan && !isMenungguLpj && (
                       <p className="text-xs text-slate-500 text-center">Tidak ada tindakan yang diperlukan saat ini. Status kegiatan: {data.status}</p>
                    )}
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>
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

function KakField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <Label className="text-slate-500 text-xs uppercase tracking-wider">{label}</Label>
      <p className="text-sm text-slate-700 mt-1 leading-relaxed bg-slate-50 p-3 rounded border border-slate-100 break-words whitespace-pre-wrap">
        {value || 'Tidak ada data'}
      </p>
    </div>
  );
}
