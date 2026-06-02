import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import api, { apiCreateKegiatan } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Send, Plus, Loader2, Trash2, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, getCurrentUser } from '@/lib/helpers';

export function CreateUsulanPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [jurusanList, setJurusanList] = useState<any[]>([]);
  const [ikuMasterList, setIkuMasterList] = useState<any[]>([]);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) { navigate('/login'); return; }
    setCurrentUser(user);

    // Fetch jurusan list from API
    api.get('/api/jurusan').then(res => {
      setJurusanList(Array.isArray(res.data) ? res.data : res.data?.data || []);
    }).catch(() => {
      setJurusanList([
        { id: '1', nama_jurusan: 'Teknik Informatika & Komputer' },
        { id: '2', nama_jurusan: 'Teknik Elektro' },
        { id: '3', nama_jurusan: 'Teknik Mesin' },
        { id: '4', nama_jurusan: 'Teknik Sipil' },
        { id: '5', nama_jurusan: 'Teknik Grafika & Penerbitan' },
        { id: '6', nama_jurusan: 'Akuntansi' },
        { id: '7', nama_jurusan: 'Administrasi Niaga' },
      ]);
    });

    // Fetch IKU master list
    api.get('/api/iku-master').then(res => {
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setIkuMasterList(data.filter((item: any) => item.is_visible !== false));
    }).catch(() => {
      // Fallback master IKU jika API gagal - comprehensive list matching native system
      setIkuMasterList([
        { id: 1, nama_indikator: 'Lulusan Mendapat Pekerjaan yang Layak', is_visible: true },
        { id: 2, nama_indikator: 'Mahasiswa Mendapat Pengalaman di Luar Kampus', is_visible: true },
        { id: 3, nama_indikator: 'Dosen Berkegatan di Luar Kampus', is_visible: true },
        { id: 4, nama_indikator: 'Praktisi Mengajar di Dalam Kampus', is_visible: true },
        { id: 5, nama_indikator: 'Hasil Kerja Dosen Digunakan oleh Masyarakat', is_visible: true },
        { id: 6, nama_indikator: 'Program Studi Bekerja sama dengan Mitra Kelas Dunia', is_visible: true },
        { id: 7, nama_indikator: 'Kelas yang Kolaboratif dan Partisipatif', is_visible: true },
        { id: 8, nama_indikator: 'Program Studi Bestandar Internasional', is_visible: true },
        { id: 9, nama_indikator: 'Peserta terlayani (%)', is_visible: true },
        { id: 10, nama_indikator: 'Kepuasan pengguna (%)', is_visible: true },
        { id: 11, nama_indikator: 'Tingkat kelulusan (%)', is_visible: true },
        { id: 12, nama_indikator: 'Efektivitas program (%)', is_visible: true },
      ]);
    });
  }, [navigate]);

  const [formData, setFormData] = useState({
    // Kegiatan fields
    nama_kegiatan: '',
    deskripsi: '',
    jenis_kegiatan: '',
    tanggal_kegiatan: '',
    tempat: '',
    pengusul_organisasi: '',
    jurusan_id: '',
    // KAK fields
    gambaran_umum: '',
    penerima_manfaat: '',
    strategi_pencapaian: '',
    metode_pelaksanaan: '',
    tahapan_pelaksanaan: '',
    indikator_kinerja_rows: [] as { bulan: string; indikator: string; target: number | null; persen: number | null }[],
    kurun_waktu_mulai: '',
    kurun_waktu_selesai: '',
    // IKU items (Step 3) - pilihan dari master
    ikuItems: [] as { nama_indikator: string; target_persen: number | null }[],
    // RAB items (Step 4)
    item_rab: [] as { kategori: string; uraian: string; qty1: number; satuan1: string; qty2: number; qty3: number; harga_satuan: number }[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSubmitting(true);
    try {
      // Filter IKU items (non-empty)
      const ikuItems = formData.ikuItems.filter(item => item.nama_indikator.trim()).map(item => ({
        nama_iku: item.nama_indikator.trim(),
        target_persen: item.target_persen || null,
      }));

      const payload: Record<string, any> = {
        nama_kegiatan: formData.nama_kegiatan,
        deskripsi: formData.deskripsi || null,
        jenis_kegiatan: formData.jenis_kegiatan || null,
        tempat: formData.tempat || null,
        status: 'submitted',
      };
      if (formData.jurusan_id) payload.jurusan_id = formData.jurusan_id;
      if (formData.tanggal_kegiatan) payload.tanggal_kegiatan = formData.tanggal_kegiatan;

      // KAK data - indikator_kinerja converted from table to JSON string
      const indikatorKinerjaStr = formData.indikator_kinerja_rows.length > 0 
        ? JSON.stringify(formData.indikator_kinerja_rows)
        : null;
      
      payload.kak = {
        gambaran_umum: formData.gambaran_umum || null,
        penerima_manfaat: formData.penerima_manfaat || null,
        strategi_pencapaian: formData.strategi_pencapaian || null,
        metode_pelaksanaan: formData.metode_pelaksanaan || null,
        tahapan_pelaksanaan: formData.tahapan_pelaksanaan || null,
        indikator_kinerja: indikatorKinerjaStr,
        kurun_waktu_mulai: formData.kurun_waktu_mulai || null,
        kurun_waktu_selesai: formData.kurun_waktu_selesai || null,
      };

      // RAB items
      payload.rab = formData.item_rab.map(item => ({
        kategori: item.kategori || 'barang',
        uraian: item.uraian,
        harga_satuan: item.harga_satuan,
        qty1: item.qty1,
        satuan1: item.satuan1 || '',
        qty2: item.qty2 || 1,
        qty3: item.qty3 || 0,
      }));

      if (ikuItems.length > 0) payload.iku = ikuItems;

      await apiCreateKegiatan(payload);
      navigate('/dashboard/pengusul/usulan');
    } catch (error: any) {
      console.error(error);
      alert('Gagal membuat usulan: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddRab = () => {
    setFormData(prev => ({
      ...prev,
      item_rab: [...prev.item_rab, { kategori: 'barang', uraian: '', qty1: 1, satuan1: '', qty2: 1, qty3: 0, harga_satuan: 0 }]
    }));
  };

  const handleRemoveRab = (index: number) => {
    setFormData(prev => ({ ...prev, item_rab: prev.item_rab.filter((_, i) => i !== index) }));
  };

  const updateRab = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const newRab = [...prev.item_rab];
      (newRab[index] as any)[field] = value;
      return { ...prev, item_rab: newRab };
    });
  };

  const calcItemTotal = (item: typeof formData.item_rab[0]) => {
    const q1 = item.qty1 || 0, q2 = item.qty2 || 1, q3 = item.qty3 || 0, h = item.harga_satuan || 0;
    return q3 > 0 ? q1 * q2 * q3 * h : q1 * q2 * h;
  };
  const calculateTotalRab = () => formData.item_rab.reduce((sum, item) => sum + calcItemTotal(item), 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 py-4 border-b border-slate-100">
        <Button variant="outline" size="icon" onClick={() => navigate('/dashboard/pengusul/usulan')} className="h-10 w-10 border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100/50 shadow-sm transition-all rounded-xl shrink-0">
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Buat Usulan Baru</h2>
          <p className="text-slate-500 font-medium tracking-tight mt-1">Isi formulir terpadu untuk Informasi Kegiatan, KAK, IKU, dan RAB.</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 py-4 mt-2">
        {[
          { id: 1, name: 'Info Kegiatan' },
          { id: 2, name: 'Kerangka Acuan (KAK)' },
          { id: 3, name: 'Indikator Kinerja (IKU)' },
          { id: 4, name: 'Anggaran (RAB)' }
        ].map((step, idx) => (
           <React.Fragment key={step.id}>
             <div className="flex items-center gap-2 sm:gap-3">
               <div className={`flex items-center justify-center size-8 sm:size-10 rounded-full font-bold transition-all text-sm sm:text-base ${currentStep === step.id ? 'bg-[#047857] text-white shadow-md' : currentStep > step.id ? 'bg-emerald-100 text-[#047857]' : 'bg-slate-100 text-slate-400'}`}>
                 {step.id}
               </div>
               <span className={`font-semibold text-xs sm:text-sm ${currentStep === step.id ? 'text-slate-900' : currentStep > step.id ? 'text-[#047857]' : 'text-slate-400'}`}>{step.name}</span>
             </div>
             {idx < 3 && <div className={`flex-1 h-1 rounded-full ${currentStep > step.id ? 'bg-emerald-500' : 'bg-slate-100'}`} />}
           </React.Fragment>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-10 mt-2">
        
        {/* SECTION 1: INFO KEGIATAN */}
        <div className={currentStep !== 1 ? 'hidden' : 'space-y-6'}>
          <Card className="shadow-sm border-slate-200/60 bg-white overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
          <CardHeader className="bg-slate-50/30 border-b border-slate-100/60 py-5 pl-6 sm:pl-8 pr-4 sm:pr-6">
            <CardTitle className="text-lg text-blue-900 flex items-center gap-2">
               <div className="flex items-center justify-center size-6 rounded-md bg-blue-100 text-blue-700 text-sm font-bold">1</div>
               Informasi Utama Kegiatan
            </CardTitle>
            <CardDescription className="text-slate-500 ml-8 font-medium">Detail dasar mendefinisikan kegiatan yang akan diusulkan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6 pl-6 sm:pl-8 pr-4 sm:pr-6">
            <div className="space-y-2">
              <Label htmlFor="nama_kegiatan" className="text-slate-700 font-semibold">Nama Kegiatan <span className="text-red-500">*</span></Label>
              <Input id="nama_kegiatan" value={formData.nama_kegiatan}
                onChange={e => setFormData({...formData, nama_kegiatan: e.target.value})}
                placeholder="Cth: Pengadaan Perangkat Laboratorium Jaringan..." required className="h-12 rounded-xl focus-visible:ring-blue-500/20 focus-visible:border-blue-500 shadow-sm" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deskripsi" className="text-slate-700 font-semibold">Deskripsi Singkat</Label>
              <textarea className="flex min-h-[100px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/10 focus-visible:border-blue-500 transition-all resize-none"
                placeholder="Jelaskan secara ringkas mengenai kegiatan yang diajukan..."
                value={formData.deskripsi} onChange={e => setFormData({...formData, deskripsi: e.target.value})} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">Jenis Kegiatan</Label>
                <Select value={formData.jenis_kegiatan} onValueChange={v => setFormData({...formData, jenis_kegiatan: v})}>
                  <SelectTrigger className="h-12 rounded-xl bg-white focus:ring-blue-500/20"><SelectValue placeholder="Pilih Jenis..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pengadaan">Pengadaan</SelectItem>
                    <SelectItem value="acara">Acara / Event</SelectItem>
                    <SelectItem value="riset">Penelitian</SelectItem>
                    <SelectItem value="pelatihan">Pelatihan</SelectItem>
                    <SelectItem value="lainnya">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tanggal_kegiatan" className="text-slate-700 font-semibold">Tanggal Pelaksanaan</Label>
                <Input type="date" id="tanggal_kegiatan" value={formData.tanggal_kegiatan}
                  onChange={e => setFormData({...formData, tanggal_kegiatan: e.target.value})} className="h-12 rounded-xl focus:ring-blue-500/20" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tempat" className="text-slate-700 font-semibold">Lokasi Pelaksanaan</Label>
                <Input id="tempat" value={formData.tempat}
                  onChange={e => setFormData({...formData, tempat: e.target.value})}
                  placeholder="Lokasi acara/pengadaan" className="h-12 rounded-xl focus:ring-blue-500/20" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">Instansi / Unit Pengusul</Label>
                <Input value={formData.pengusul_organisasi}
                  onChange={e => setFormData({...formData, pengusul_organisasi: e.target.value})}
                  placeholder="Opsional, cth: HIMA TIK" className="h-12 rounded-xl focus:ring-blue-500/20" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">Jurusan Terkait</Label>
                <Select value={formData.jurusan_id} onValueChange={v => setFormData({...formData, jurusan_id: v})}>
                  <SelectTrigger className="h-12 rounded-xl bg-white focus:ring-blue-500/20"><SelectValue placeholder="Pilih entitas jurusan..." /></SelectTrigger>
                  <SelectContent>
                    {jurusanList.length > 0 ? jurusanList.map(j => (
                      <SelectItem key={j.id} value={j.jurusan_id ? j.jurusan_id.toString() : j.id}>{j.nama_jurusan}</SelectItem>
                    )) : (
                      <SelectItem value="default" disabled>Memuat daftar...</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>

        {/* SECTION 2: KAK */}
        <div className={currentStep !== 2 ? 'hidden' : 'space-y-6'}>
        <Card className="shadow-sm border-slate-200/60 bg-white overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
          <CardHeader className="bg-slate-50/30 border-b border-slate-100/60 py-5 pl-6 sm:pl-8 pr-4 sm:pr-6">
            <CardTitle className="text-lg text-indigo-900 flex items-center gap-2">
               <div className="flex items-center justify-center size-6 rounded-md bg-indigo-100 text-indigo-700 text-sm font-bold">2</div>
               Kerangka Acuan Kerja (KAK)
            </CardTitle>
            <CardDescription className="text-slate-500 ml-8 font-medium">Uraikan konsep operasional, strategi, dan penerima manfaat kegiatan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6 pl-6 sm:pl-8 pr-4 sm:pr-6">
            <div className="space-y-2">
              <Label className="text-slate-700 font-semibold">Latar Belakang / Gambaran Umum</Label>
              <textarea className="flex min-h-[120px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/10 focus-visible:border-indigo-500 transition-all resize-none"
                placeholder="Paparkan mengapa kegiatan ini penting untuk dilaksanakan..."
                value={formData.gambaran_umum} onChange={e => setFormData({...formData, gambaran_umum: e.target.value})} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">Pihak Penerima Manfaat</Label>
                <textarea className="flex min-h-[90px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/10 focus-visible:border-indigo-500 transition-all resize-none"
                  placeholder="Siapa saja yang akan langsung dan tidak langsung mendapatkan manfaat?"
                  value={formData.penerima_manfaat} onChange={e => setFormData({...formData, penerima_manfaat: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">Strategi Pencapaian Sasaran</Label>
                <textarea className="flex min-h-[90px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/10 focus-visible:border-indigo-500 transition-all resize-none"
                  placeholder="Pendekatan yang dilakukan untuk menyukseskan kegiatan."
                  value={formData.strategi_pencapaian} onChange={e => setFormData({...formData, strategi_pencapaian: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">Metode Pelaksanaan</Label>
                <textarea className="flex min-h-[90px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/10 focus-visible:border-indigo-500 transition-all resize-none"
                  value={formData.metode_pelaksanaan} onChange={e => setFormData({...formData, metode_pelaksanaan: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">Tahapan Pelaksanaan (Timeline)</Label>
                <textarea className="flex min-h-[90px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/10 focus-visible:border-indigo-500 transition-all resize-none"
                  value={formData.tahapan_pelaksanaan} onChange={e => setFormData({...formData, tahapan_pelaksanaan: e.target.value})} />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <Label className="text-slate-700 font-semibold">Indikator Kinerja (Rancangan & Progress)</Label>
                <Button type="button" variant="secondary" size="sm" className="h-10 rounded-xl"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    indikator_kinerja_rows: [...prev.indikator_kinerja_rows, { bulan: '', indikator: '', target: null, persen: null }],
                  }))}
                >
                  <Plus className="mr-2 h-4 w-4" /> Tambah Baris
                </Button>
              </div>
              
              {formData.indikator_kinerja_rows.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
                  <p className="mb-2">Belum ada indikator yang ditambahkan.</p>
                  <p className="text-sm">Klik "Tambah Baris" untuk menambahkan rancangan dan progress target.</p>
                </div>
              ) : (
                <div className="border border-slate-200/80 rounded-2xl overflow-x-auto shadow-sm">
                  <table className="w-full text-sm text-left min-w-[700px]">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                      <tr>
                        <th className="px-4 py-3 w-28">Bulan</th>
                        <th className="px-4 py-3 min-w-[200px]">Indikator Keberhasislan</th>
                        <th className="px-4 py-3 w-24">Target</th>
                        <th className="px-4 py-3 w-16 text-center">%</th>
                        <th className="px-4 py-3 w-12 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/60">
                      {formData.indikator_kinerja_rows.map((row, idx) => (
                        <tr key={idx} className="bg-white hover:bg-slate-50/50 transition-colors">
                          <td className="p-2.5">
                            <Input type="month" placeholder="Bulan" value={row.bulan} 
                              onChange={e => setFormData(prev => {
                                const next = [...prev.indikator_kinerja_rows];
                                next[idx] = {...next[idx], bulan: e.target.value};
                                return {...prev, indikator_kinerja_rows: next};
                              })}
                              className="h-10 rounded-lg text-xs" />
                          </td>
                          <td className="p-2.5">
                            <Input placeholder="Contoh: Tersusunnya dokumen RPKL" value={row.indikator}
                              onChange={e => setFormData(prev => {
                                const next = [...prev.indikator_kinerja_rows];
                                next[idx] = {...next[idx], indikator: e.target.value};
                                return {...prev, indikator_kinerja_rows: next};
                              })}
                              className="h-10 rounded-lg text-xs" />
                          </td>
                          <td className="p-2.5">
                            <Input placeholder="Target" type="text" value={row.target ?? ''} 
                              onChange={e => setFormData(prev => {
                                const next = [...prev.indikator_kinerja_rows];
                                next[idx] = {...next[idx], target: e.target.value ? Number(e.target.value) : null};
                                return {...prev, indikator_kinerja_rows: next};
                              })}
                              className="h-10 rounded-lg text-xs text-center" />
                          </td>
                          <td className="p-2.5">
                            <Input placeholder="%" type="number" min="0" max="100" value={row.persen ?? ''}
                              onChange={e => setFormData(prev => {
                                const next = [...prev.indikator_kinerja_rows];
                                next[idx] = {...next[idx], persen: e.target.value ? Number(e.target.value) : null};
                                return {...prev, indikator_kinerja_rows: next};
                              })}
                              className="h-10 rounded-lg text-xs text-center" />
                          </td>
                          <td className="p-2.5 text-center">
                            <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg h-8 w-8"
                              onClick={() => setFormData(prev => ({
                                ...prev,
                                indikator_kinerja_rows: prev.indikator_kinerja_rows.filter((_, i) => i !== idx),
                              }))}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="text-xs text-slate-500">Isi indikator kinerja per-bulan beserta target temu/jilanya</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold text-xs uppercase tracking-widest text-slate-500">Estimasi Kurun Waktu Mulai</Label>
                <Input type="date" value={formData.kurun_waktu_mulai}
                  onChange={e => setFormData({...formData, kurun_waktu_mulai: e.target.value})} className="h-12 rounded-xl focus:ring-indigo-500/20" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold text-xs uppercase tracking-widest text-slate-500">Estimasi Kurun Waktu Selesai</Label>
                <Input type="date" value={formData.kurun_waktu_selesai}
                  onChange={e => setFormData({...formData, kurun_waktu_selesai: e.target.value})} className="h-12 rounded-xl focus:ring-indigo-500/20" />
              </div>
            </div>
          </CardContent>
        </Card>
        </div>

        {/* SECTION 3: IKU */}
        <div className={currentStep !== 3 ? 'hidden' : 'space-y-6'}>
        <Card className="shadow-sm border-slate-200/60 bg-white overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500"></div>
          <CardHeader className="bg-slate-50/30 border-b border-slate-100/60 py-5 pl-6 sm:pl-8 pr-4 sm:pr-6">
            <CardTitle className="text-lg text-purple-900 flex items-center gap-2">
               <div className="flex items-center justify-center size-6 rounded-md bg-purple-100 text-purple-700 text-sm font-bold">3</div>
               Indikator Kinerja Utama (IKU)
            </CardTitle>
            <CardDescription className="text-slate-500 ml-8 font-medium">Pilih indikator keberhasilan dan tentukan target yang ingin dicapai.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6 pl-6 sm:pl-8 pr-4 sm:pr-6">
            <div className="bg-blue-50 border border-blue-200/50 rounded-2xl p-5 flex items-start gap-4">
              <div className="bg-blue-100/80 p-2 rounded-lg shrink-0">
                <Target className="size-5 text-blue-600" />
              </div>
              <div>
                <h4 className="text-[15px] font-bold text-blue-900 mb-1">Indikator Kinerja Utama</h4>
                <p className="text-[14px] text-blue-800/80 leading-relaxed">Pilih indikator dari daftar master yang telah dikonfigurasi oleh admin. Untuk setiap indikator, tentukan target persentase (%lacak) yang ingin dicapai.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label className="text-slate-700 font-semibold">Daftar IKU yang Dipilih</Label>
                  <p className="text-slate-500 text-sm">Klik "+ Tambah IKU" untuk menambahkan indikator baru.</p>
                </div>
                <Button type="button" variant="secondary" size="sm" className="h-10 rounded-xl"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    ikuItems: [...prev.ikuItems, { nama_indikator: '', target_persen: null }],
                  }))}
                >
                  <Plus className="mr-2 h-4 w-4" /> Tambah IKU
                </Button>
              </div>

              {formData.ikuItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-slate-500 text-center">
                  <Target className="size-8 opacity-30 mx-auto mb-2" />
                  <p>Belum ada indikator yang dipilih.</p>
                  <p className="text-sm">Klik "Tambah IKU" untuk memilih indikator dari master.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.ikuItems.map((iku, index) => (
                    <div key={index} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_128px_40px]">
                        <div>
                          <Label className="text-slate-700 font-semibold">Pilih Indikator</Label>
                          <Select value={iku.nama_indikator} onValueChange={v => setFormData(prev => {
                            const next = [...prev.ikuItems];
                            next[index] = { ...next[index], nama_indikator: v };
                            return { ...prev, ikuItems: next };
                          })}>
                            <SelectTrigger className="h-12 rounded-xl bg-white focus:ring-purple-500/20">
                              <SelectValue placeholder="Pilih dari master IKU..." />
                            </SelectTrigger>
                            <SelectContent>
                              {ikuMasterList.length > 0 ? ikuMasterList.map(item => (
                                <SelectItem key={item.id} value={item.nama_indikator || item.nama_iku || String(item.id)}>
                                  {item.nama_indikator || item.nama_iku}
                                </SelectItem>
                              )) : (
                                <SelectItem value="_empty" disabled>Tidak ada IKU master</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-slate-700 font-semibold">Target (%)</Label>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={iku.target_persen ?? ''}
                            onChange={e => setFormData(prev => {
                              const next = [...prev.ikuItems];
                              next[index] = { ...next[index], target_persen: e.target.value ? Number(e.target.value) : null };
                              return { ...prev, ikuItems: next };
                            })}
                            placeholder="0 - 100"
                            className="h-12 rounded-xl focus-visible:ring-purple-500/20"
                          />
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="h-10 w-10 text-rose-500"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            ikuItems: prev.ikuItems.filter((_, idx) => idx !== index),
                          }))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        </div>

        {/* SECTION 4: RAB */}
        <div className={currentStep !== 4 ? 'hidden' : 'space-y-6'}>
        <Card className="shadow-sm border-slate-200/60 bg-white overflow-hidden relative">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
          <CardHeader className="bg-slate-50/30 border-b border-slate-100/60 py-5 pl-6 sm:pl-8 pr-4 sm:pr-6 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg text-emerald-900 flex items-center gap-2">
                <div className="flex items-center justify-center size-6 rounded-md bg-emerald-100 text-emerald-700 text-sm font-bold">4</div>
                Rincian Anggaran (RAB)
              </CardTitle>
              <CardDescription className="text-slate-500 ml-8 font-medium">Input baris anggaran untuk pengajuan pendanaan.</CardDescription>
            </div>
            <Button type="button" variant="outline" className="bg-white border-slate-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 shadow-sm transition-all" onClick={handleAddRab}>
              <Plus className="size-4 mr-2" /> Tambah Baris RAB
            </Button>
          </CardHeader>
          <CardContent className="pt-6 pl-6 sm:pl-8 pr-4 sm:pr-6">
            <div className="border border-slate-200/80 rounded-2xl overflow-x-auto shadow-sm">
              <table className="w-full text-sm text-left min-w-[900px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-bold">
                  <tr>
                    <th className="px-4 py-4 w-32">Kategori</th>
                  <th className="px-4 py-4 min-w-[150px]">Uraian</th>
                  <th className="px-4 py-4 w-20 text-center">Vol 1</th>
                  <th className="px-4 py-4 w-24">Satuan</th>
                  <th className="px-4 py-4 w-20 text-center">Vol 2</th>
                  <th className="px-4 py-4 w-20 text-center">Vol 3</th>
                  <th className="px-4 py-4 w-36 text-right">Harga Satuan</th>
                    <th className="px-4 py-4 text-right w-40">Subtotal</th>
                    <th className="px-4 py-4 w-12 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/60">
                  {formData.item_rab.map((item, idx) => (
                    <tr key={idx} className="bg-white hover:bg-slate-50/50 transition-colors">
                      <td className="p-2.5">
                        <Select value={item.kategori} onValueChange={v => updateRab(idx, 'kategori', v)}>
                          <SelectTrigger className="h-10 text-xs rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="barang">Barang</SelectItem>
                            <SelectItem value="jasa">Jasa</SelectItem>
                            <SelectItem value="honor">Honor</SelectItem>
                            <SelectItem value="transport">Transport</SelectItem>
                            <SelectItem value="konsumsi">Konsumsi</SelectItem>
                            <SelectItem value="perjalanan">Perjalanan Dinas</SelectItem>
                            <SelectItem value="lainnya">Lainnya</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2.5"><Input placeholder="Nama keperluan..." value={item.uraian} onChange={e => updateRab(idx, 'uraian', e.target.value)} className="h-10 rounded-xl" /></td>
                      <td className="p-2.5"><Input type="number" min="0" className="text-center h-10 rounded-xl" value={item.qty1 === 0 ? '' : item.qty1} onChange={e => updateRab(idx, 'qty1', parseInt(e.target.value) || 0)} /></td>
                      <td className="p-2.5"><Input placeholder="Cth: pcs/OH" value={item.satuan1} onChange={e => updateRab(idx, 'satuan1', e.target.value)} className="h-10 rounded-xl" /></td>
                      <td className="p-2.5"><Input type="number" min="0" className="text-center h-10 rounded-xl" value={item.qty2 === 0 ? '' : item.qty2} onChange={e => updateRab(idx, 'qty2', parseInt(e.target.value) || 0)} placeholder="1" /></td>
                      <td className="p-2.5"><Input type="number" min="0" className="text-center h-10 rounded-xl" value={item.qty3 === 0 ? '' : item.qty3} onChange={e => updateRab(idx, 'qty3', parseInt(e.target.value) || 0)} placeholder="0" /></td>
                      <td className="p-2.5"><Input type="number" min="0" className="text-right h-10 rounded-xl" value={item.harga_satuan === 0 ? '' : item.harga_satuan} onChange={e => updateRab(idx, 'harga_satuan', parseInt(e.target.value) || 0)} placeholder="0" /></td>
                      <td className="px-4 py-2 text-right font-semibold text-slate-800 bg-slate-50/50">{formatCurrency(calcItemTotal(item))}</td>
                      <td className="p-2.5 text-center">
                        <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg h-9 w-9" onClick={() => handleRemoveRab(idx)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {formData.item_rab.length === 0 && (
                    <tr><td colSpan={9} className="py-12 flex-col justify-center text-center text-slate-500 font-medium bg-slate-50 border-t border-dashed border-slate-200">Tidak ada pengajuan dana yang dimasukkan. <button type="button" className="text-emerald-600 font-semibold ml-1 hover:underline" onClick={handleAddRab}>Tambah Baris RAB</button></td></tr>
                  )}
                  <tr className="bg-emerald-50 border-t border-emerald-100">
                    <td colSpan={7} className="px-5 py-5 font-bold text-emerald-900 text-right uppercase tracking-widest text-xs">Total Akumulasi Anggaran</td>
                    <td className="px-5 py-5 font-black text-right text-emerald-700 text-[18px] tracking-tight">{formatCurrency(calculateTotalRab())}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-between gap-4 pt-6 border-t border-slate-200">
          {currentStep > 1 ? (
             <Button type="button" variant="outline" className="h-14 px-8 rounded-2xl font-bold text-slate-600 hover:bg-slate-100 border-slate-300 w-full sm:w-auto transition-all" onClick={() => setCurrentStep(prev => prev - 1)}>Kembali</Button>
          ) : (
             <Button type="button" variant="outline" className="h-14 px-8 rounded-2xl font-bold text-slate-600 hover:bg-slate-100 border-slate-300 w-full sm:w-auto transition-all" onClick={() => navigate('/dashboard/pengusul/usulan')}>Batalkan</Button>
          )}

          {currentStep < 4 ? (
             <Button type="button" className="h-14 px-8 rounded-2xl font-bold bg-[#047857] hover:bg-[#065F46] text-white shadow-xl shadow-emerald-700/20 w-full sm:w-auto transition-all active:scale-95 text-[15px]" onClick={() => setCurrentStep(prev => prev + 1)}>Selanjutnya</Button>
          ) : (
             <Button type="submit" disabled={isSubmitting} className="h-14 px-8 rounded-2xl font-bold bg-[#047857] hover:bg-[#065F46] text-white shadow-xl shadow-emerald-700/20 w-full sm:w-auto transition-all active:scale-95 text-[15px]">
               {isSubmitting ? <Loader2 className="size-5 mr-3 animate-spin" /> : <Send className="size-5 mr-3" />}
               {isSubmitting ? 'Memproses Pengajuan...' : 'Ajukan Dokumen Usulan'}
             </Button>
          )}
        </div>
      </form>
    </div>
  );
}
