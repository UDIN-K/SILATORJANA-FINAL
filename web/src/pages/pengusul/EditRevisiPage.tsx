import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Send, Plus, Loader2, Trash2, MessageSquare, AlertTriangle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { databases, APPWRITE_DB_ID } from '@/lib/appwrite';
import { ID } from 'appwrite';
import { fetchKAK, fetchIKU, fetchRAB, formatCurrency } from '@/lib/helpers';

interface RabItem {
  $id?: string;
  kategori: string;
  uraian: string;
  qty1: number;
  satuan1: string;
  qty2: number;
  satuan2: string;
  qty3: number;
  harga_satuan: number;
}

function calcTotal(r: RabItem): number {
  const q1 = r.qty1 || 0, q2 = r.qty2 || 1, q3 = r.qty3 || 0, h = r.harga_satuan || 0;
  if (q3 > 0) return q1 * q2 * q3 * h;
  return q1 * q2 * h;
}

function parseRevisiComments(catatan: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!catatan) return result;
  const lines = catatan.split('\n');
  for (const line of lines) {
    const match = line.match(/^\[(.+?)\]:\s*(.+)$/);
    if (match) result[match[1]] = match[2];
    else if (line.trim()) result['Umum'] = (result['Umum'] ? result['Umum'] + '\n' : '') + line.trim();
  }
  return result;
}

export function EditRevisiPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [kegiatan, setKegiatan] = useState<any>(null);
  const [kakId, setKakId] = useState<string | null>(null);
  const [revisiComments, setRevisiComments] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    nama_kegiatan: '', deskripsi: '', jenis_kegiatan: '', tanggal_kegiatan: '',
    tempat: '', pengusul_organisasi: '',
    gambaran_umum: '', penerima_manfaat: '', strategi_pencapaian: '',
    metode_pelaksanaan: '', tahapan_pelaksanaan: '', indikator_kinerja: '',
    kurun_waktu_mulai: '', kurun_waktu_selesai: '',
  });
  const [rabItems, setRabItems] = useState<RabItem[]>([]);
  const [deletedRabIds, setDeletedRabIds] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const doc = await databases.getDocument(APPWRITE_DB_ID, 'kegiatan', id);
        setKegiatan(doc);
        setRevisiComments(parseRevisiComments(doc.catatan_revisi || ''));
        setForm(prev => ({
          ...prev,
          nama_kegiatan: doc.nama_kegiatan || '',
          deskripsi: doc.deskripsi || '',
          jenis_kegiatan: doc.jenis_kegiatan || '',
          tanggal_kegiatan: doc.tanggal_kegiatan || '',
          tempat: doc.tempat || '',
          pengusul_organisasi: doc.pengusul_organisasi || '',
        }));

        const kak = await fetchKAK(id);
        if (kak) {
          setKakId(kak.$id);
          setForm(prev => ({
            ...prev,
            gambaran_umum: kak.gambaran_umum || '',
            penerima_manfaat: kak.penerima_manfaat || '',
            strategi_pencapaian: kak.strategi_pencapaian || '',
            metode_pelaksanaan: kak.metode_pelaksanaan || '',
            tahapan_pelaksanaan: kak.tahapan_pelaksanaan || '',
            indikator_kinerja: kak.indikator_kinerja || '',
            kurun_waktu_mulai: kak.kurun_waktu_mulai || '',
            kurun_waktu_selesai: kak.kurun_waktu_selesai || '',
          }));
        }

        const rabDocs = await fetchRAB(id);
        setRabItems(rabDocs.map((r: any) => ({
          $id: r.$id, kategori: r.kategori || 'barang', uraian: r.uraian || '',
          qty1: r.qty1 || r.volume || 1, satuan1: r.satuan1 || '', qty2: r.qty2 || 1,
          satuan2: r.satuan2 || '', qty3: r.qty3 || 0, harga_satuan: r.harga_satuan || 0,
        })));
      } catch (e) { console.error(e); }
      finally { setIsLoading(false); }
    })();
  }, [id]);

  const updateForm = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const addRab = () => setRabItems(prev => [...prev, {
    kategori: 'barang', uraian: '', qty1: 1, satuan1: '', qty2: 1, satuan2: '', qty3: 0, harga_satuan: 0,
  }]);

  const removeRab = (idx: number) => {
    const item = rabItems[idx];
    if (item.$id) setDeletedRabIds(prev => [...prev, item.$id!]);
    setRabItems(prev => prev.filter((_, i) => i !== idx));
  };

  const updateRab = (idx: number, field: string, value: any) => {
    setRabItems(prev => { const n = [...prev]; (n[idx] as any)[field] = value; return n; });
  };

  const grandTotal = rabItems.reduce((s, r) => s + calcTotal(r), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !kegiatan) return;
    setIsSubmitting(true);
    try {
      // Update kegiatan
      await databases.updateDocument(APPWRITE_DB_ID, 'kegiatan', id, {
        nama_kegiatan: form.nama_kegiatan,
        deskripsi: form.deskripsi || null,
        jenis_kegiatan: form.jenis_kegiatan || null,
        tanggal_kegiatan: form.tanggal_kegiatan || null,
        tempat: form.tempat || null,
        pengusul_organisasi: form.pengusul_organisasi || null,
        status: 'revisi_done',
        catatan_revisi: null,
        total_anggaran: grandTotal,
      });

      // Update or create KAK
      const kakData: Record<string, any> = { kegiatan_id: id };
      for (const key of ['gambaran_umum','penerima_manfaat','strategi_pencapaian','metode_pelaksanaan','tahapan_pelaksanaan','indikator_kinerja','kurun_waktu_mulai','kurun_waktu_selesai'] as const) {
        if ((form as any)[key]) kakData[key] = (form as any)[key];
      }
      if (kakId) {
        await databases.updateDocument(APPWRITE_DB_ID, 'kak', kakId, kakData);
      } else {
        await databases.createDocument(APPWRITE_DB_ID, 'kak', ID.unique(), kakData);
      }

      // Delete removed RAB items
      for (const delId of deletedRabIds) {
        try { await databases.deleteDocument(APPWRITE_DB_ID, 'rab', delId); } catch {}
      }

      // Upsert RAB items
      for (const item of rabItems) {
        const rabData = {
          kegiatan_id: id, kategori: item.kategori, uraian: item.uraian,
          qty1: item.qty1, satuan1: item.satuan1, qty2: item.qty2, satuan2: item.satuan2,
          qty3: item.qty3, harga_satuan: item.harga_satuan,
          total: calcTotal(item),
        };
        if (item.$id) {
          await databases.updateDocument(APPWRITE_DB_ID, 'rab', item.$id, rabData);
        } else {
          await databases.createDocument(APPWRITE_DB_ID, 'rab', ID.unique(), rabData);
        }
      }

      alert('Revisi berhasil dikirim!');
      navigate('/dashboard/pengusul/needs-work');
    } catch (error: any) {
      console.error(error);
      alert('Gagal menyimpan revisi: ' + error.message);
    } finally { setIsSubmitting(false); }
  };

  if (isLoading) return <div className="py-12 text-center"><Loader2 className="animate-spin text-emerald-700 mx-auto size-8" /></div>;
  if (!kegiatan) return <div className="py-12 text-center text-slate-500">Data tidak ditemukan.</div>;

  const hasComments = Object.keys(revisiComments).length > 0;

  const getMatchedComments = (fields: string[]) => {
    const matched = fields.flatMap(f => {
      return Object.entries(revisiComments).filter(([k]) => k.toLowerCase().includes(f.toLowerCase()));
    });
    const unique = new Map();
    matched.forEach(([k, v]) => unique.set(k, v));
    return Array.from(unique.entries());
  };

  const RevisiNote = ({ fields }: { fields: string[] }) => {
    const matched = getMatchedComments(fields);
    if (matched.length === 0) return null;
    return (
      <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
        <div className="flex items-start gap-2">
          <MessageSquare className="size-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-amber-800 mb-1">Catatan Revisi Verifikator:</p>
            {matched.map(([k, v]) => <p key={k} className="text-amber-700 font-medium">{v}</p>)}
          </div>
        </div>
      </div>
    );
  };

  const inputClass = (fields: string[]) => getMatchedComments(fields).length > 0 ? 'border-amber-400 bg-amber-50/50 focus-visible:ring-amber-500' : '';
  const taClass = (fields: string[]) => "flex min-h-[80px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-700 " + inputClass(fields);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="size-5" /></Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-900">Revisi Usulan</h2>
          <p className="text-slate-500">Perbaiki data sesuai catatan verifikator, lalu kirim ulang.</p>
        </div>
      </div>

      {hasComments && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="size-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-amber-800">Catatan revisi dari Verifikator:</p>
            {Object.entries(revisiComments).map(([k, v]) => (
              <p key={k} className="text-sm text-amber-700 mt-1"><span className="font-medium">[{k}]</span> {v}</p>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Info Kegiatan */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle>1. Informasi Kegiatan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="space-y-2">
              <Label>Nama Kegiatan *</Label>
              <Input className={inputClass(['nama', 'info - nama'])} value={form.nama_kegiatan} onChange={e => updateForm('nama_kegiatan', e.target.value)} required />
              <RevisiNote fields={['nama', 'info - nama']} />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <textarea className={taClass(['deskripsi'])} value={form.deskripsi} onChange={e => updateForm('deskripsi', e.target.value)} />
              <RevisiNote fields={['deskripsi']} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-2">
                <Label>Jenis Kegiatan</Label>
                <div className={inputClass(['jenis'])}>
                  <Select value={form.jenis_kegiatan} onValueChange={v => updateForm('jenis_kegiatan', v)}>
                    <SelectTrigger className={inputClass(['jenis'])}><SelectValue placeholder="Pilih" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pengadaan">Pengadaan</SelectItem>
                      <SelectItem value="acara">Acara / Event</SelectItem>
                      <SelectItem value="riset">Penelitian</SelectItem>
                      <SelectItem value="pelatihan">Pelatihan</SelectItem>
                      <SelectItem value="lainnya">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <RevisiNote fields={['jenis']} />
              </div>
              <div className="space-y-2">
                <Label>Tanggal</Label>
                <Input type="date" className={inputClass(['tanggal'])} value={form.tanggal_kegiatan} onChange={e => updateForm('tanggal_kegiatan', e.target.value)} />
                <RevisiNote fields={['tanggal']} />
              </div>
              <div className="space-y-2">
                <Label>Tempat</Label>
                <Input className={inputClass(['tempat'])} value={form.tempat} onChange={e => updateForm('tempat', e.target.value)} />
                <RevisiNote fields={['tempat']} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KAK */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100"><CardTitle>2. KAK (Kerangka Acuan Kerja)</CardTitle></CardHeader>
          <CardContent className="space-y-5 pt-6">
            {(['gambaran_umum','penerima_manfaat','strategi_pencapaian','metode_pelaksanaan','tahapan_pelaksanaan','indikator_kinerja'] as const).map(key => (
              <div key={key} className="space-y-2">
                <Label className="capitalize">{key.replace(/_/g, ' ')}</Label>
                <textarea className={taClass([`kak - ${key.replace(/_/g, ' ')}`, key.replace(/_/g, ' ')])} value={(form as any)[key]} onChange={e => updateForm(key, e.target.value)} />
                <RevisiNote fields={[`kak - ${key.replace(/_/g, ' ')}`, key.replace(/_/g, ' ')]} />
              </div>
            ))}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-100">
              <div className="space-y-2">
                <Label>Kurun Waktu Mulai</Label>
                <Input type="date" className={inputClass(['waktu', 'kurun'])} value={form.kurun_waktu_mulai} onChange={e => updateForm('kurun_waktu_mulai', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Kurun Waktu Selesai</Label>
                <Input type="date" className={inputClass(['waktu', 'kurun'])} value={form.kurun_waktu_selesai} onChange={e => updateForm('kurun_waktu_selesai', e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RAB */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle>3. RAB (Rincian Anggaran Biaya)</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addRab}><Plus className="size-4 mr-1" /> Tambah</Button>
          </CardHeader>
          <CardContent className="pt-6">
            <RevisiNote fields={['rab']} />
            <div className="border border-slate-200 rounded-lg overflow-x-auto mt-3">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="px-2 py-2.5 font-medium w-24">Kategori</th>
                    <th className="px-2 py-2.5 font-medium">Uraian</th>
                    <th className="px-2 py-2.5 font-medium w-16 text-center">Qty1</th>
                    <th className="px-2 py-2.5 font-medium w-16 text-center">Qty2</th>
                    <th className="px-2 py-2.5 font-medium w-16 text-center">Qty3</th>
                    <th className="px-2 py-2.5 font-medium w-28 text-right">Harga Satuan</th>
                    <th className="px-2 py-2.5 font-medium w-32 text-right">Total</th>
                    <th className="px-2 py-2.5 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {rabItems.map((item, idx) => {
                    const rowFields = [`rab item #${idx + 1}`, `rab #${idx + 1}`];
                    if (item.uraian) rowFields.push(`rab item #${idx + 1} (${item.uraian})`);
                    const hasRowNote = getMatchedComments(rowFields).length > 0;
                    return (
                      <React.Fragment key={idx}>
                        <tr className={`border-b border-slate-100 ${hasRowNote ? 'bg-amber-50/30' : ''}`}>
                          <td className="p-1.5 align-top">
                            <Select value={item.kategori} onValueChange={v => updateRab(idx, 'kategori', v)}>
                              <SelectTrigger className={`h-8 text-xs ${inputClass(rowFields)}`}><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {['barang','jasa','honor','transport','konsumsi','perjalanan','lainnya'].map(k => (
                                  <SelectItem key={k} value={k} className="capitalize">{k}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-1.5 align-top">
                            <Input className={`h-8 ${inputClass(rowFields)}`} value={item.uraian} onChange={e => updateRab(idx, 'uraian', e.target.value)} />
                            <div className="mt-1"><RevisiNote fields={rowFields} /></div>
                          </td>
                          <td className="p-1.5 align-top"><Input type="number" min="0" className={`h-8 text-center ${inputClass(rowFields)}`} value={item.qty1} onChange={e => updateRab(idx, 'qty1', parseInt(e.target.value) || 0)} /></td>
                          <td className="p-1.5 align-top"><Input type="number" min="0" className={`h-8 text-center ${inputClass(rowFields)}`} value={item.qty2} onChange={e => updateRab(idx, 'qty2', parseInt(e.target.value) || 0)} /></td>
                          <td className="p-1.5 align-top"><Input type="number" min="0" className={`h-8 text-center ${inputClass(rowFields)}`} value={item.qty3} onChange={e => updateRab(idx, 'qty3', parseInt(e.target.value) || 0)} /></td>
                          <td className="p-1.5 align-top"><Input type="number" min="0" className={`h-8 text-right ${inputClass(rowFields)}`} value={item.harga_satuan} onChange={e => updateRab(idx, 'harga_satuan', parseInt(e.target.value) || 0)} /></td>
                          <td className={`px-2 py-2 text-right font-medium align-top ${hasRowNote ? '' : 'bg-slate-50'}`}>{formatCurrency(calcTotal(item))}</td>
                          <td className="p-1.5 text-center align-top">
                            <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8" onClick={() => removeRab(idx)}>
                              <Trash2 className="size-4" />
                            </Button>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                  {rabItems.length === 0 && (
                    <tr><td colSpan={8} className="py-8 text-center text-slate-500">Belum ada item RAB.</td></tr>
                  )}
                  <tr className="bg-slate-50">
                    <td colSpan={6} className="px-4 py-3 font-semibold text-right">Total Anggaran</td>
                    <td className="px-4 py-3 font-bold text-right text-emerald-700 text-lg">{formatCurrency(grandTotal)}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>Batal</Button>
          <Button type="submit" disabled={isSubmitting} className="bg-emerald-700 hover:bg-emerald-800">
            {isSubmitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Send className="size-4 mr-2" />}
            {isSubmitting ? 'Menyimpan...' : 'Kirim Revisi'}
          </Button>
        </div>
      </form>
    </div>
  );
}
