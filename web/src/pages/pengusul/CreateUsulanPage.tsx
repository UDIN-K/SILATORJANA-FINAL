import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Send, Plus, Loader2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { databases, APPWRITE_DB_ID } from '@/lib/appwrite';
import { ID, Query } from 'appwrite';
import { formatCurrency, getCurrentUser } from '@/lib/helpers';

export function CreateUsulanPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [jurusanList, setJurusanList] = useState<any[]>([]);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) { navigate('/login'); return; }
    setCurrentUser(user);

    // Load jurusan list
    (async () => {
      try {
        const res = await databases.listDocuments(APPWRITE_DB_ID, 'jurusan', [Query.orderAsc('nama_jurusan'), Query.limit(100)]);
        setJurusanList(res.documents);
      } catch {}
    })();
  }, [navigate]);

  const [formData, setFormData] = useState({
    // Kegiatan fields (match Appwrite schema: nama_kegiatan, deskripsi, jenis_kegiatan, tanggal_kegiatan, tempat, pengusul_organisasi, jurusan_id, verifikator_target)
    nama_kegiatan: '',
    deskripsi: '',
    jenis_kegiatan: '',
    tanggal_kegiatan: '',
    tempat: '',
    pengusul_organisasi: '',
    jurusan_id: '',
    verifikator_target: '',
    // KAK fields (match: gambaran_umum, penerima_manfaat, strategi_pencapaian, metode_pelaksanaan, tahapan_pelaksanaan, indikator_kinerja, kurun_waktu_mulai, kurun_waktu_selesai)
    gambaran_umum: '',
    penerima_manfaat: '',
    strategi_pencapaian: '',
    metode_pelaksanaan: '',
    tahapan_pelaksanaan: '',
    indikator_kinerja: '',
    kurun_waktu_mulai: '',
    kurun_waktu_selesai: '',
    // RAB items (match: kategori, kategori_label, uraian, qty1, satuan1, qty2, satuan2, harga_satuan)
    item_rab: [] as { kategori: string; uraian: string; qty1: number; satuan1: string; harga_satuan: number }[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSubmitting(true);
    try {
      // 1. Create kegiatan
      const kegiatanData: Record<string, any> = {
        nama_kegiatan: formData.nama_kegiatan,
        deskripsi: formData.deskripsi || null,
        jenis_kegiatan: formData.jenis_kegiatan || null,
        tempat: formData.tempat || null,
        pengusul_id: parseInt(currentUser.$id || currentUser.user_id || '1', 10),
        status: 'submitted',
      };
      if (formData.tanggal_kegiatan) kegiatanData.tanggal_kegiatan = formData.tanggal_kegiatan;
      if (formData.pengusul_organisasi) kegiatanData.pengusul_organisasi = formData.pengusul_organisasi;
      if (formData.jurusan_id) kegiatanData.jurusan_id = parseInt(formData.jurusan_id, 10);
      if (formData.verifikator_target) kegiatanData.verifikator_target = formData.verifikator_target;

      const kegiatanRes = await databases.createDocument(APPWRITE_DB_ID, 'kegiatan', ID.unique(), kegiatanData);
      const kegiatanId = kegiatanRes.$id;

      // 2. Create KAK
      const kakData: Record<string, any> = {
        kegiatan_id: kegiatanId,
      };
      if (formData.gambaran_umum) kakData.gambaran_umum = formData.gambaran_umum;
      if (formData.penerima_manfaat) kakData.penerima_manfaat = formData.penerima_manfaat;
      if (formData.strategi_pencapaian) kakData.strategi_pencapaian = formData.strategi_pencapaian;
      if (formData.metode_pelaksanaan) kakData.metode_pelaksanaan = formData.metode_pelaksanaan;
      if (formData.tahapan_pelaksanaan) kakData.tahapan_pelaksanaan = formData.tahapan_pelaksanaan;
      if (formData.indikator_kinerja) kakData.indikator_kinerja = formData.indikator_kinerja;
      if (formData.kurun_waktu_mulai) kakData.kurun_waktu_mulai = formData.kurun_waktu_mulai;
      if (formData.kurun_waktu_selesai) kakData.kurun_waktu_selesai = formData.kurun_waktu_selesai;

      await databases.createDocument(APPWRITE_DB_ID, 'kak', ID.unique(), kakData);

      // 3. Create RAB items
      for (const item of formData.item_rab) {
        const total = item.qty1 * item.harga_satuan;
        await databases.createDocument(APPWRITE_DB_ID, 'rab', ID.unique(), {
          kegiatan_id: kegiatanId,
          kategori: item.kategori || 'barang',
          uraian: item.uraian,
          qty1: item.qty1,
          satuan1: item.satuan1 || '',
          harga_satuan: item.harga_satuan,
        });
      }

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
      item_rab: [...prev.item_rab, { kategori: 'barang', uraian: '', qty1: 1, satuan1: '', harga_satuan: 0 }]
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

  const calculateTotalRab = () => formData.item_rab.reduce((sum, item) => sum + (item.qty1 * item.harga_satuan), 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/pengusul/usulan')}>
          <ArrowLeft className="size-5 text-slate-500" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Buat Usulan Baru (Terpadu)</h2>
          <p className="text-slate-500">Lengkapi seluruh informasi Kegiatan, KAK, dan RAB.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* SECTION 1: INFO KEGIATAN */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle>1. Informasi Kegiatan</CardTitle>
            <CardDescription>Detail dasar kegiatan yang akan dilaksanakan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label htmlFor="nama_kegiatan">Nama Kegiatan *</Label>
              <Input id="nama_kegiatan" value={formData.nama_kegiatan}
                onChange={e => setFormData({...formData, nama_kegiatan: e.target.value})}
                placeholder="Cth: Pengadaan Perangkat Lab..." required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deskripsi">Deskripsi Kegiatan</Label>
              <textarea className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-700"
                placeholder="Deskripsi singkat tentang kegiatan..."
                value={formData.deskripsi} onChange={e => setFormData({...formData, deskripsi: e.target.value})} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Jenis Kegiatan</Label>
                <Select value={formData.jenis_kegiatan} onValueChange={v => setFormData({...formData, jenis_kegiatan: v})}>
                  <SelectTrigger><SelectValue placeholder="Pilih Jenis" /></SelectTrigger>
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
                <Label htmlFor="tanggal_kegiatan">Tanggal Pelaksanaan</Label>
                <Input type="date" id="tanggal_kegiatan" value={formData.tanggal_kegiatan}
                  onChange={e => setFormData({...formData, tanggal_kegiatan: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tempat">Tempat</Label>
                <Input id="tempat" value={formData.tempat}
                  onChange={e => setFormData({...formData, tempat: e.target.value})}
                  placeholder="Lokasi pelaksanaan" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Pengusul / Organisasi</Label>
                <Input value={formData.pengusul_organisasi}
                  onChange={e => setFormData({...formData, pengusul_organisasi: e.target.value})}
                  placeholder="Nama organisasi pengusul (opsional)" />
              </div>
              <div className="space-y-2">
                <Label>Jurusan</Label>
                <Select value={formData.jurusan_id} onValueChange={v => setFormData({...formData, jurusan_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Pilih Jurusan" /></SelectTrigger>
                  <SelectContent>
                    {jurusanList.length > 0 ? jurusanList.map(j => (
                      <SelectItem key={j.$id} value={j.jurusan_id ? j.jurusan_id.toString() : j.$id}>{j.nama_jurusan}</SelectItem>
                    )) : (
                      <SelectItem value="default" disabled>Memuat...</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 2: KAK */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle>2. KAK (Kerangka Acuan Kerja)</CardTitle>
            <CardDescription>Gambaran umum, penerima manfaat, dan strategi pencapaian.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label>Gambaran Umum</Label>
              <textarea className="flex min-h-[100px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-700"
                placeholder="Latar belakang dan gambaran umum kegiatan..."
                value={formData.gambaran_umum} onChange={e => setFormData({...formData, gambaran_umum: e.target.value})} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Penerima Manfaat</Label>
                <textarea className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-700"
                  value={formData.penerima_manfaat} onChange={e => setFormData({...formData, penerima_manfaat: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Strategi Pencapaian</Label>
                <textarea className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-700"
                  value={formData.strategi_pencapaian} onChange={e => setFormData({...formData, strategi_pencapaian: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Metode Pelaksanaan</Label>
                <textarea className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-700"
                  value={formData.metode_pelaksanaan} onChange={e => setFormData({...formData, metode_pelaksanaan: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Tahapan Pelaksanaan</Label>
                <textarea className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-700"
                  value={formData.tahapan_pelaksanaan} onChange={e => setFormData({...formData, tahapan_pelaksanaan: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Indikator Kinerja</Label>
              <textarea className="flex min-h-[60px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-700"
                value={formData.indikator_kinerja} onChange={e => setFormData({...formData, indikator_kinerja: e.target.value})} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
              <div className="space-y-2">
                <Label>Kurun Waktu Mulai</Label>
                <Input type="date" value={formData.kurun_waktu_mulai}
                  onChange={e => setFormData({...formData, kurun_waktu_mulai: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Kurun Waktu Selesai</Label>
                <Input type="date" value={formData.kurun_waktu_selesai}
                  onChange={e => setFormData({...formData, kurun_waktu_selesai: e.target.value})} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 3: RAB */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
            <div><CardTitle>3. RAB (Rincian Anggaran Biaya)</CardTitle><CardDescription>Masukkan rincian item anggaran.</CardDescription></div>
            <Button type="button" variant="outline" size="sm" onClick={handleAddRab}><Plus className="size-4 mr-2" /> Tambah Item</Button>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="px-3 py-3 font-medium w-28">Kategori</th>
                    <th className="px-3 py-3 font-medium">Uraian / Item</th>
                    <th className="px-3 py-3 font-medium w-20 text-center">Qty</th>
                    <th className="px-3 py-3 font-medium w-24">Satuan</th>
                    <th className="px-3 py-3 font-medium w-36 text-right">Harga Satuan</th>
                    <th className="px-3 py-3 font-medium text-right w-36">Total</th>
                    <th className="px-3 py-3 font-medium w-12 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.item_rab.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-100 bg-white">
                      <td className="p-2">
                        <Select value={item.kategori} onValueChange={v => updateRab(idx, 'kategori', v)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="barang">Barang</SelectItem>
                            <SelectItem value="jasa">Jasa</SelectItem>
                            <SelectItem value="honor">Honor</SelectItem>
                            <SelectItem value="transport">Transport</SelectItem>
                            <SelectItem value="konsumsi">Konsumsi</SelectItem>
                            <SelectItem value="lainnya">Lainnya</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2"><Input placeholder="Nama item" value={item.uraian} onChange={e => updateRab(idx, 'uraian', e.target.value)} className="h-8" /></td>
                      <td className="p-2"><Input type="number" min="1" className="text-center h-8" value={item.qty1} onChange={e => updateRab(idx, 'qty1', parseInt(e.target.value) || 0)} /></td>
                      <td className="p-2"><Input placeholder="pcs" value={item.satuan1} onChange={e => updateRab(idx, 'satuan1', e.target.value)} className="h-8" /></td>
                      <td className="p-2"><Input type="number" min="0" className="text-right h-8" value={item.harga_satuan} onChange={e => updateRab(idx, 'harga_satuan', parseInt(e.target.value) || 0)} /></td>
                      <td className="px-3 py-3 text-right font-medium text-slate-900 bg-slate-50">{formatCurrency(item.qty1 * item.harga_satuan)}</td>
                      <td className="p-2 text-center">
                        <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8" onClick={() => handleRemoveRab(idx)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {formData.item_rab.length === 0 && (
                    <tr><td colSpan={7} className="py-8 text-center text-slate-500">Belum ada item RAB. Klik "Tambah Item".</td></tr>
                  )}
                  <tr className="bg-slate-50">
                    <td colSpan={5} className="px-4 py-4 font-semibold text-right">Total Anggaran Keseluruhan</td>
                    <td className="px-4 py-4 font-bold text-right text-blue-700 text-lg">{formatCurrency(calculateTotalRab())}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="outline" onClick={() => navigate('/dashboard/pengusul/usulan')}>Batal</Button>
          <Button type="submit" disabled={isSubmitting} className="bg-emerald-700 hover:bg-emerald-800">
            {isSubmitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Send className="size-4 mr-2" />}
            {isSubmitting ? 'Menyimpan...' : 'Ajukan Usulan Sekarang'}
          </Button>
        </div>
      </form>
    </div>
  );
}
