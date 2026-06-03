import { Card, CardContent } from '@/components/ui/card';
import { apiGetKegiatan, apiUpdateKegiatan } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { ArrowLeft, Save, Send, Loader2, MessageSquare, FileText, TrendingUp, DollarSign, Info, Trash2, AlertCircle } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
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
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const doc = await apiGetKegiatan(id);
        setKegiatan(doc);
        const [k, i, r] = await Promise.all([fetchKAK(id), fetchIKU(id), fetchRAB(id)]);
        setKak(k); setIkuList(i); setRabList(r);
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    })();
  }, [id]);

  const handleCommentChange = (field: string, value: string) => {
    setComments(prev => ({ ...prev, [field]: value }));
  };

  const removeComment = (field: string) => {
    setComments(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmitRevision = async () => {
    if (!id) return;
    setIsSaving(true);
    setSubmitError('');
    try {
      const catatan = Object.entries(comments)
        .filter(([, v]) => (v as string).trim())
        .map(([k, v]) => `[${k}]: ${v}`)
        .join('\n');
      
      await apiUpdateKegiatan(id, {
        status: 'revision_requested',
        catatan_revisi: catatan || 'Perlu revisi',
      });
      navigate('/dashboard/verifikator/proposals');
    } catch (e: any) {
      console.error(e);
      setSubmitError(e?.response?.data?.message || e.message || 'Terjadi kesalahan sistem');
    } finally { setIsSaving(false); }
  };

  if (isLoading) return <div className="py-12 text-center"><Loader2 className="animate-spin text-blue-600 mx-auto size-8" /></div>;
  if (!kegiatan) return <div className="py-12 text-center text-slate-500">Data tidak ditemukan.</div>;

  const rabTotal = rabList.reduce((sum: number, r: any) => sum + (parseFloat(r.total) || 0), 0);
  const activeCommentsEntries = Object.entries(comments).filter(([, v]) => (v as string).trim());
  const hasComments = activeCommentsEntries.length > 0;

  const CommentBox = ({ field }: { field: string }) => {
    const hasValue = !!comments[field];
    return (
      <div className={`mt-2 sm:mt-3 flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl transition-all ${hasValue ? 'bg-amber-50 border-amber-200 shadow-sm border' : 'bg-slate-50/50 border border-slate-200'}`}>
        <MessageSquare className={`size-4 sm:size-5 mt-0.5 sm:mt-1 shrink-0 ${hasValue ? 'text-amber-500' : 'text-slate-400'}`} />
        <div className="w-full">
           <textarea
             className="w-full bg-transparent text-xs sm:text-sm focus:outline-none resize-none placeholder:text-slate-400 font-medium text-slate-700"
             rows={hasValue ? 3 : 2}
             placeholder={hasValue ? '' : `Tambahkan instruksi revisi di sini...`}
             value={comments[field] || ''}
             onChange={e => handleCommentChange(field, e.target.value)}
           />
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 py-6 border-b border-slate-200/80 mb-6">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="shrink-0 h-10 w-10 border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100/50 shadow-sm rounded-xl">
           <ArrowLeft className="size-5" />
        </Button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1.5">
             <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Formulir Mode Revisi</h2>
             <span className="bg-amber-100 text-amber-800 text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 rounded-md border border-amber-200 whitespace-nowrap">Mode Intervensi</span>
          </div>
          <p className="text-sm sm:text-[15px] font-medium text-slate-500">{kegiatan.nama_kegiatan}</p>
        </div>
        <div className="mt-2 sm:mt-0 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
           <span className="text-[11px] uppercase tracking-widest text-slate-400 font-bold block mb-1">Status Saat Ini</span>
           <StatusBadge status={kegiatan.status} />
        </div>
      </div>

      {submitError && (
        <div className="mb-6 bg-red-50 text-red-700 border border-red-200 p-4 rounded-xl font-medium flex gap-3 items-center shadow-sm">
           <AlertCircle className="size-5 shrink-0 text-red-500"/> 
           Gagal mengirim revisi: {submitError}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Side: Work Area */}
        <div className="w-full lg:w-2/3 relative">
           
          {/* Tab Navigation */}
          <div className="flex bg-slate-100/50 rounded-xl border border-slate-200/60 p-1.5 gap-1.5 overflow-x-auto shadow-sm mb-6 sticky top-4 z-10 backdrop-blur-md custom-scrollbar">
            {TABS.map(tab => (
              <button key={tab.key}
                className={`flex-none sm:flex-1 px-3 py-2 sm:px-4 sm:py-3 text-[11px] sm:text-[13px] font-bold uppercase tracking-wider rounded-lg transition-all whitespace-nowrap text-center flex items-center justify-center gap-2 sm:gap-2.5 relative ${
                  activeTab === tab.key 
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 translate-y-0' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white border border-transparent hover:border-slate-200/60 hover:shadow-sm'
                }`}
                 onClick={() => setActiveTab(tab.key)}>
                 <tab.icon className={`size-4.5 ${activeTab === tab.key ? 'text-white' : 'text-slate-400'}`} /> {tab.label}
                 {comments[tab.key] && <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full shadow-sm" />}
              </button>
            ))}
          </div>

          {/* Info Kegiatan Tab */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                 <Info className="size-5 sm:size-6 text-blue-500" />
                 <h3 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">Informasi Utama Kegiatan</h3>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                 {[
                   { label: 'Nama Terdaftar Kegiatan', value: kegiatan.nama_kegiatan, field: 'Info - Nama Kegiatan' },
                   { label: 'Kategori / Jenis Kegiatan', value: kegiatan.jenis_kegiatan || '-', field: 'Info - Jenis Kegiatan' },
                   { label: 'Jurusan Terkait', value: kegiatan.nama_jurusan || '-', field: 'Info - Jurusan' },
                   { label: 'Identitas Pengusul', value: kegiatan.pengusul_nama || '-', field: 'Info - Pengusul' }
                 ].map((item, idx) => (
                   <div key={idx} className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col gap-3 sm:gap-4">
                      <div>
                         <span className="text-slate-400 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest block mb-1">{item.label}</span>
                         <p className="font-semibold text-slate-800 text-sm sm:text-[15px]">{item.value}</p>
                      </div>
                      <CommentBox field={item.field} />
                   </div>
                 ))}
              </div>
            </div>
          )}

          {/* KAK Tab */}
          {activeTab === 'kak' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                 <FileText className="size-5 sm:size-6 text-indigo-500" />
                 <h3 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">Rincian Kerangka Acuan Kerja (KAK)</h3>
              </div>
              
              {kak ? (
                <div className="grid grid-cols-1 gap-4 sm:gap-6">
                  {['gambaran_umum', 'penerima_manfaat', 'strategi_pencapaian', 'metode_pelaksanaan', 'tahapan_pelaksanaan'].map(key => (
                    <div key={key} className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col gap-3 sm:gap-4">
                       <div>
                          <span className="text-slate-400 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest block mb-1.5 sm:mb-2">{key.replace(/_/g, ' ')}</span>
                          <p className="font-medium text-slate-700 text-[13px] sm:text-[14px] leading-relaxed max-sm:line-clamp-none line-clamp-6">{kak[key] || '-'}</p>
                       </div>
                       <CommentBox field={`KAK - ${key.replace(/_/g, ' ')}`} />
                    </div>
                  ))}
                  {kak.kurun_waktu_mulai && (
                    <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col gap-3 sm:gap-4">
                      <div>
                         <span className="text-slate-400 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest block mb-1.5 sm:mb-2">Kurun Waktu Operasional</span>
                         <p className="font-semibold text-slate-800 text-sm sm:text-[15px]">{formatDate(kak.kurun_waktu_mulai)} — {formatDate(kak.kurun_waktu_selesai)}</p>
                      </div>
                      <CommentBox field="KAK - Kurun Waktu Operasional" />
                    </div>
                  )}
                </div>
              ) : (
                 <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                    <FileText className="size-10 mx-auto mb-4 text-slate-300" />
                    <p className="font-bold text-slate-500">Data KAK Kosong.</p>
                 </div>
              )}
            </div>
          )}

          {/* IKU Tab */}
          {activeTab === 'iku' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                 <TrendingUp className="size-5 sm:size-6 text-teal-500" />
                 <h3 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">Indikator Kinerja Utama (IKU)</h3>
              </div>
              
              {ikuList.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:gap-6">
                  {ikuList.map((iku: any, i: number) => (
                    <div key={iku.id || i} className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col gap-3 sm:gap-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                         <div>
                            <span className="text-slate-400 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest block mb-1.5 sm:mb-2">Item IKU #{i+1}</span>
                            <p className="font-bold text-slate-800 text-[15px] sm:text-[16px] leading-snug">{iku.nama_iku || iku.indikator || '-'}</p>
                         </div>
                         <div className="sm:text-right bg-teal-50/50 sm:bg-transparent p-2.5 sm:p-0 rounded-lg w-fit">
                            <span className="text-[10px] text-teal-600 font-bold uppercase tracking-wider block mb-0.5 sm:mb-1">Target</span>
                            <span className="font-black text-teal-600 text-lg sm:text-xl">{iku.target_persen != null ? `${iku.target_persen}%` : '-'}</span>
                         </div>
                      </div>
                      <CommentBox field={`IKU #${i + 1}`} />
                    </div>
                  ))}
                </div>
              ) : (
                 <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                    <TrendingUp className="size-10 mx-auto mb-4 text-slate-300" />
                    <p className="font-bold text-slate-500">Data IKU Kosong.</p>
                 </div>
              )}
            </div>
          )}

          {/* RAB Tab */}
          {activeTab === 'rab' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
                 <div className="flex items-center gap-3">
                    <DollarSign className="size-5 sm:size-6 text-emerald-500" />
                    <h3 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">Rincian Anggaran (RAB)</h3>
                 </div>
                 <div className="bg-emerald-50 px-3 py-2 sm:px-4 sm:py-2 rounded-xl text-emerald-800 w-fit">
                    <span className="text-[10px] font-bold uppercase tracking-widest block mb-0.5 opacity-80">Total Kalkulasi</span>
                    <span className="font-black text-sm sm:text-[15px]">{formatCurrency(rabTotal)}</span>
                 </div>
              </div>
              
              {rabList.length > 0 ? (
                 <div className="grid grid-cols-1 gap-4 sm:gap-6">
                   {rabList.map((r: any, i: number) => (
                     <div key={r.id || i} className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col gap-4 sm:gap-5">
                       <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="sm:pr-4">
                             <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                                <span className="text-slate-400 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest">Item Anggaran #{i+1}</span>
                                <span className="bg-slate-100 text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded text-slate-500">{r.kategori || '-'}</span>
                             </div>
                             <p className="font-bold text-slate-800 text-sm sm:text-[15px]">{r.uraian}</p>
                          </div>
                          <div className="sm:text-right shrink-0 bg-slate-50 sm:bg-transparent p-2.5 sm:p-0 rounded-lg w-fit">
                             <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest block mb-0.5">Total Akhir Item</span>
                             <span className="font-black text-slate-800 text-[15px] sm:text-[17px]">{formatCurrency(r.total)}</span>
                          </div>
                       </div>
                       
                       <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-100">
                          <div>
                             <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest block mb-1">Vol / Qty</span>
                             <span className="font-semibold text-slate-700 text-xs sm:text-sm">{r.qty1} {r.satuan1} {r.qty2 ? `x ${r.qty2}`: ''} {r.qty3 ? `x ${r.qty3}`: ''}</span>
                          </div>
                          <div className="sm:flex-1 sm:text-right">
                             <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest block mb-1">Harga Satuan</span>
                             <span className="font-semibold text-slate-700 text-xs sm:text-sm">{formatCurrency(r.harga_satuan)}</span>
                          </div>
                       </div>
                       
                       <CommentBox field={`RAB Item #${i+1} (${r.uraian})`} />
                     </div>
                   ))}
                 </div>
              ) : (
                 <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                    <DollarSign className="size-10 mx-auto mb-4 text-slate-300" />
                    <p className="font-bold text-slate-500">Data RAB Kosong.</p>
                 </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Accumulated Comments Sidebar */}
        <div className="w-full lg:w-1/3 lg:sticky lg:top-4 h-auto lg:max-h-[85vh] flex flex-col pt-2 lg:pt-0">
           <Card className="shadow-xl shadow-amber-900/5 border-amber-200 bg-white flex flex-col flex-1 max-h-[600px] lg:max-h-[85vh] overflow-hidden rounded-2xl">
             <div className="h-2 w-full bg-gradient-to-r from-amber-400 to-amber-600"></div>
             
             <CardContent className="p-0 flex flex-col h-full overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
                   <h3 className="text-md sm:text-lg font-bold text-slate-800 mb-0.5 sm:mb-1 flex items-center gap-2">
                     <MessageSquare className="size-4 sm:size-5 text-amber-500" /> 
                     Kompilasi Revisi
                   </h3>
                   <p className="text-xs sm:text-sm text-slate-500">
                     {activeCommentsEntries.length} instruksi revisi telah direkam
                   </p>
                </div>

                <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-3 sm:space-y-4 custom-scrollbar">
                   {activeCommentsEntries.length === 0 ? (
                      <div className="text-center py-8 sm:py-10 opacity-60">
                         <MessageSquare className="size-8 sm:size-10 mx-auto mb-2 sm:mb-3 text-slate-300" />
                         <p className="text-xs sm:text-sm font-semibold text-slate-500">Belum Ada Rekaman Revisi</p>
                         <p className="text-[11px] sm:text-xs text-slate-400 mt-1 sm:mt-2 leading-relaxed max-w-[200px] mx-auto">Masukan catatan di bagian kiri dokumen untuk menumpuk instruksi di sini.</p>
                      </div>
                   ) : (
                      activeCommentsEntries.map(([field, value]) => (
                         <div key={field} className="group p-3 sm:p-4 bg-amber-50/50 border border-amber-100 rounded-xl relative hover:bg-amber-50 transition-colors pr-10">
                            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-amber-600/70 block mb-1.5 sm:mb-2">{field}</span>
                            <p className="text-xs sm:text-[13px] text-slate-700 font-medium leading-relaxed mb-0 sm:mb-1">"{value}"</p>
                            <Button 
                               variant="ghost" 
                               size="sm" 
                               className="h-7 w-7 p-0 absolute top-2.5 right-2.5 sm:opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 hover:bg-red-50 bg-white/50"
                               onClick={() => removeComment(field)}
                             >
                               <Trash2 className="size-3.5" />
                            </Button>
                         </div>
                      ))
                   )}
                </div>

                <div className="p-4 sm:p-6 border-t border-slate-100 bg-white shrink-0">
                   <Button 
                      disabled={!hasComments || isSaving} 
                      onClick={handleSubmitRevision}
                      className="w-full h-10 sm:h-12 bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-xl shadow-amber-500/25 active:scale-95 transition-all text-sm sm:text-[15px] font-bold"
                   >
                     {isSaving ? <Loader2 className="animate-spin size-4 mr-2" /> : <Send className="size-4 sm:size-4.5 mr-2" />}
                     Kirim {activeCommentsEntries.length} Instruksi Revisi
                   </Button>
                   <Button variant="ghost" className="w-full mt-2 sm:mt-3 h-10 text-slate-500 text-sm font-semibold" onClick={() => navigate(-1)}>
                      Batalkan Verifikasi
                   </Button>
                </div>
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
